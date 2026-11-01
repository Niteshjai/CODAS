import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { pool } from '../../src/db/connection';
import { encryptPII } from '../../src/utils/encryption';
import { USER_TRANSACTIONS_SQL } from '../../src/scoring/dimensions/transactionSource';
import { effectiveLiquidity, COUNTED_ASSET_CLASSES } from '../../src/scoring/assetClasses';
import { incomeStabilityScore } from '../../src/scoring/dimensions/incomeStabilityScore';
import { liabilityBurdenScore } from '../../src/scoring/dimensions/liabilityBurdenScore';
import { behavioralScore } from '../../src/scoring/dimensions/behavioralScore';
import { assetStrengthScore } from '../../src/scoring/dimensions/assetStrengthScore';
import { fraudRiskScore } from '../../src/scoring/dimensions/fraudRiskScore';
import { canonicalPolicyType, loadCoverPolicies } from '../../src/services/insuranceGapFinder';
import { buildFeed, NOTIFICATION_SOURCES, ACTIVITY_COPY } from '../../src/services/notificationCenter';
import { nomineeVerifier } from '../../src/nominee/verification/nomineeVerifier';

/**
 * Readers of the tables the asset-orchestration agent fills (canonical_assets, asset_anomalies)
 * and of AA transactions (`transactions`, migrations 020 + 033). Needs migrations 032–034.
 */
export function registerAgentDataReaderTests() {
  describe('Agent data readers (canonical_assets, asset_anomalies, transactions)', () => {
    let userId: string;
    const tag = crypto.randomBytes(6).toString('hex');
    const ids: Record<string, string> = {};

    const addAsset = async (key: string, cls: string, inst: string, value: number, extra: Record<string, unknown> = {}) => {
      const r = await pool.query(`
        INSERT INTO canonical_assets (user_id, asset_class, institution_name, current_value_paise, has_nominee,
          nominee_name_enc, primary_source, source, asset_subtype, ai_liquidity_score, dedup_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$9,$10) RETURNING id`,
        [userId, cls, inst, value, extra.hasNominee ?? null, extra.nomineeEnc ?? null, extra.source ?? 'setu_aa',
         extra.subtype ?? null, extra.liquidity ?? 50, `${tag}-${key}`]);
      ids[key] = r.rows[0].id;
    };

    beforeAll(async () => {
      const u = await pool.query(`INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, $2) RETURNING id`,
        [`agent-readers-${tag}`, encryptPII('Agent Reader Test')]);
      userId = u.rows[0].id;

      await addAsset('hdfc', 'BANK_ACCOUNT', 'HDFC Bank', 250000_00, { hasNominee: false });
      await addAsset('sbi', 'BANK_ACCOUNT', 'SBI', 80000_00);
      await addAsset('icici', 'BANK_ACCOUNT', 'ICICI Bank', 40000_00, { hasNominee: true });
      await addAsset('land', 'LAND', 'Bhulekh', 4500000_00, { source: 'surepass' });
      await addAsset('aa_life', 'INSURANCE_LIFE', 'LIC', 0, { subtype: 'TERM' });
      await addAsset('doc_health', 'INSURANCE_HEALTH', 'Star Health', 1000000_00, { source: 'digilocker' });
      await addAsset('motor', 'INSURANCE_OTHER', 'Acko', 600000_00, { source: 'digilocker' });
      await addAsset('unclaimed', 'UNCLAIMED', 'IEPF', 12000_00, { source: 'iepf' });

      await pool.query(`INSERT INTO asset_anomalies (user_id, canonical_id, anomaly_type, severity, description, fingerprint, occurrences)
        VALUES ($1,$2,'sudden_balance_drop','warning','Balance fell 62%.',$3,3)`, [userId, ids.hdfc, `fp-${tag}`]);
      for (let k = 0; k < 2; k++) {
        await pool.query(`INSERT INTO asset_anomalies (user_id, anomaly_type, severity, description)
          VALUES ($1,'duplicate_suspected','info','Two SBI accounts look alike.')`, [userId]);
      }
      await pool.query(`INSERT INTO asset_anomalies (user_id, anomaly_type, severity, description, is_resolved)
        VALUES ($1,'value_spike','critical','Already resolved',true)`, [userId]);

      const acct = crypto.randomUUID();
      for (let m = 0; m < 6; m++) {
        await pool.query(`INSERT INTO transactions (account_id, user_id, date, narration, type, amount, account_key, dedupe_key)
          VALUES ($1,$2,NOW() - make_interval(months => $3::int, days => 2),$4,'CREDIT',85000.00,$5,$6)`,
          [acct, userId, m, `NEFT SALARY ACME ${m}`, `ak-${tag}`, `sal-${m}`]);
        if (m < 3) {
          await pool.query(`INSERT INTO transactions (account_id, user_id, date, narration, type, amount, account_key, dedupe_key)
            VALUES ($1,$2,NOW() - make_interval(months => $3::int, days => 5),$4,'DEBIT',21500.50,$5,$6)`,
            [acct, userId, m, `ACH EMI HOME LOAN 98765${m}`, `ak-${tag}`, `emi-${m}`]);
        }
      }
      await pool.query(`INSERT INTO transactions (account_id, user_id, date, narration, type, amount)
        VALUES ($1,$2,NOW() - INTERVAL '40 days','ECS RETURNED INSUFFICIENT FUNDS','DR',350)`, [acct, userId]);
    });

    afterAll(async () => {
      if (!userId) return;
      await pool.query(`DELETE FROM nominee_update_tasks WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM nominee_update_batches WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM notification_state WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM asset_anomalies WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM transactions WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM canonical_assets WHERE user_id = $1`, [userId]);
      await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
    });

    it('reads AA transactions from `transactions`, in paise', async () => {
      expect(USER_TRANSACTIONS_SQL.includes('aa_transactions')).toBe(false);
      const income = await incomeStabilityScore(pool, userId, 5000000_00);
      expect(income.data.avgMonthlyIncomePaise).toBe(85000_00);
      expect(income.data.monthsOfHistory).toBe(6);
      expect(income.data.monthlyObligationsPaise).toBe(2150050);
    });

    it('counts one loan per lender narration and keeps bounces out of EMIs', async () => {
      const liability = await liabilityBurdenScore(pool, userId);
      expect(liability.data.activeLoansCount).toBe(1);
      expect(liability.data.monthlyEMIBurdenPaise).toBe(2150050);
      expect(liability.data.bouncedPayments).toBe(1);
      const behaviour = await behavioralScore(pool, userId);
      expect(behaviour.data.bounceCount).toBe(1);
    });

    it('counts holdings only in asset strength (no insurance or unclaimed money)', async () => {
      const strength = await assetStrengthScore(pool, userId, 5000000_00);
      expect(strength.data.totalAssets).toBe((250000 + 80000 + 40000 + 4500000) * 100);
      expect(COUNTED_ASSET_CLASSES.includes('INSURANCE_HEALTH')).toBe(false);
    });

    it('treats the agent fallback liquidity (50) as no opinion', () => {
      expect(effectiveLiquidity('BANK_ACCOUNT', 50)).toBe(95);
      expect(effectiveLiquidity('BANK_ACCOUNT', null)).toBe(95);
      expect(effectiveLiquidity('LAND', 72)).toBe(72);
    });

    it('fraud risk: first-run rows are not "new accounts"; anomalies are open and de-duplicated', async () => {
      const first = await fraudRiskScore(pool, userId);
      expect(first.data.newAccountCount).toBe(0);
      expect(first.data.unresolvedAgentAnomalies).toBe(2);

      await pool.query(`UPDATE canonical_assets SET created_at = NOW() - INTERVAL '60 days' WHERE user_id = $1`, [userId]);
      for (let k = 0; k < 3; k++) await addAsset(`new${k}`, 'BANK_ACCOUNT', `New Bank ${k}`, 1000_00);
      const later = await fraudRiskScore(pool, userId);
      expect(later.data.newAccountCount).toBe(3);
      await pool.query(`DELETE FROM canonical_assets WHERE user_id = $1 AND institution_name LIKE 'New Bank %'`, [userId]);
    });

    it('insurance: AA zero values and INSURANCE_OTHER are never life/health cover', async () => {
      expect(canonicalPolicyType('INSURANCE_LIFE', 'Term plan')).toBe('TERM');
      expect(canonicalPolicyType('INSURANCE_OTHER', null)).toBe('OTHER');
      const policies = await loadCoverPolicies(pool, userId);
      expect(policies.map(p => p.policy_type).sort()).toEqual(['HEALTH', 'OTHER']);
    });

    it('notification feed: one item per open anomaly, nominee unknowns are not "missing"', async () => {
      const sources = NOTIFICATION_SOURCES.filter(s => s.name === 'anomalies' || s.name === 'nominees');
      const feed = await buildFeed(pool, userId, { sources });
      const anomalies = feed.items.filter(i => i.source === 'anomalies');
      expect(anomalies).toHaveLength(2);
      expect(anomalies.every(i => i.actionUrl === '/dashboard?tab=overview')).toBe(true);
      const nominee = feed.items.find(i => i.id.startsWith('action:nominee:'));
      expect(nominee?.title).toBe('1 account has no nominee');

      // Dismissed stays dismissed when the agent sees the same condition again
      await pool.query(`INSERT INTO notification_state (user_id, item_key, read_at, dismissed_at) VALUES ($1,$2,NOW(),NOW())`,
        [userId, anomalies[0].id]);
      await pool.query(`UPDATE asset_anomalies SET occurrences = occurrences + 1, last_seen_at = NOW() WHERE user_id = $1`, [userId]);
      const again = await buildFeed(pool, userId, { sources });
      expect(again.items.filter(i => i.source === 'anomalies')).toHaveLength(1);
    });

    it('covers the agent audit actions in the activity copy', () => {
      for (const a of ['AGENT_RUN_REQUESTED', 'AGENT_RUN_COMPLETED', 'AGENT_RUN_FAILED']) {
        expect(Object.prototype.hasOwnProperty.call(ACTIVITY_COPY, a)).toBe(true);
      }
    });

    it('nominee verifier: has_nominee=TRUE without a readable name verifies without crashing', async () => {
      const b = await pool.query(`INSERT INTO nominee_update_batches (user_id) VALUES ($1) RETURNING id`, [userId]);
      await pool.query(`UPDATE canonical_assets SET nominee_name_enc = 'aa:bb:' WHERE id = $1`, [ids.icici]);
      for (const [cid, name] of [[ids.icici, 'ICICI Bank'], [ids.hdfc, 'HDFC Bank']]) {
        await pool.query(`INSERT INTO nominee_update_tasks (batch_id, user_id, canonical_asset_id, institution_name, institution_type, update_method, status)
          VALUES ($1,$2,$3,$4,'bank','guided_otp','user_completed')`, [b.rows[0].id, userId, cid, name]);
      }
      const tasks = await pool.query(`
        SELECT t.*, ca.has_nominee, ca.nominee_name_enc AS current_nominee_enc
          FROM nominee_update_tasks t LEFT JOIN canonical_assets ca ON ca.id = t.canonical_asset_id
         WHERE t.batch_id = $1 ORDER BY t.institution_name`, [b.rows[0].id]);
      const verified = [];
      for (const t of tasks.rows) verified.push(await nomineeVerifier.verifyTask(t));
      expect(verified).toEqual([false, true]); // HDFC (no nominee), ICICI (flag only)
      const icici = await pool.query(`SELECT status, post_update_nominee FROM nominee_update_tasks WHERE canonical_asset_id = $1`, [ids.icici]);
      expect(icici.rows[0].status).toBe('verified');
      expect(icici.rows[0].post_update_nominee).toBeNull();
    });
  });
}
