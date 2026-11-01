import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { pool } from '../../src/db/connection';
import {
  accountKeyOf, flattenFiResponse, nomineeFlagOf, parseTransactions, pendingAccountCount, saveAccountTransactions, withoutTransactions,
} from '../../src/services/aaTransactions';
import {
  consentDataRange, fetchFinancialData, mapFIType, normalizeFinancialData, sessionDataRange,
} from '../../src/services/accountAggregator';
import { ConsentModel } from '../../src/models/consent';
import crypto from 'crypto';

// A Setu v2-style FI data response (ReBIT deposit schema), one READY account and one FAILED one,
// so the session ends PARTIAL
const v2Response = {
  status: 'PARTIAL',
  fips: [{
    fipID: 'HDFC-FIP',
    accounts: [
      {
        linkRefNumber: 'link-1',
        maskedAccNumber: 'XXXXXX1234',
        FIstatus: 'READY',
        data: {
          account: {
            type: 'deposit',
            maskedAccNumber: 'XXXXXX1234',
            profile: { holders: { holder: [{ name: 'A', nominee: 'REGISTERED' }] } },
            summary: { currentBalance: '101666.33', currency: 'INR', type: 'SAVINGS' },
            transactions: {
              startDate: '2026-09-01', endDate: '2026-10-31',
              transaction: [
                { txnId: 'T1', type: 'CREDIT', mode: 'NEFT', amount: '85000.00', currentBalance: '120000.00', transactionTimestamp: '2026-10-01T09:30:00+05:30', valueDate: '2026-10-01', narration: 'NEFT-SALARY-ACME CORP', reference: 'N123' },
                { txnId: 'T2', type: 'DEBIT', mode: 'UPI', amount: '349.00', currentBalance: '119651.00', transactionTimestamp: '2026-10-02T20:11:00+05:30', narration: 'UPI/SWIGGY/ord', reference: 'U456' },
                { type: 'DEBIT', mode: 'ATM', amount: '2000', currentBalance: '117651.00', valueDate: '2026-10-03', narration: 'ATM WDL' },
                { type: 'DEBIT', amount: 'not-a-number', valueDate: '2026-10-04' },
                { type: 'DEBIT', amount: '10', narration: 'no date' },
              ],
            },
          },
        },
      },
      { linkRefNumber: 'link-2', maskedAccNumber: 'XXXXXX9999', FIstatus: 'FAILED', data: null },
    ],
  }],
};

export function registerAaTransactionsTests() {
  describe('aaTransactions (real AA transaction ingestion)', () => {
    let userId: string;

    beforeAll(async () => {
      const r = await pool.query(
        'INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, NULL) RETURNING id',
        [crypto.randomBytes(16).toString('hex')]
      );
      userId = r.rows[0].id;
    });

    afterAll(async () => {
      if (userId) {
        await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM asset_snapshots_aa WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM nominee_status WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM dormant_accounts WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM user_alerts WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM consents WHERE user_id = $1', [userId]);
        await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      }
    });

    it('flattens the v2 response and skips accounts whose data did not arrive', () => {
      const items = flattenFiResponse(v2Response);
      expect(items.length).toBe(1);
      expect(items[0].fipID).toBe('HDFC-FIP');
      expect(flattenFiResponse({ data: [{ type: 'deposit' }] }).length).toBe(1); // legacy flat shape
    });

    it('treats a PARTIAL session as final only once no account is still pending', () => {
      expect(pendingAccountCount(v2Response)).toBe(0);
      const stillArriving = {
        status: 'PARTIAL',
        fips: [{ fipID: 'SBI-FIP', accounts: [{ linkRefNumber: 'l3', FIstatus: 'PENDING', data: null }] }, ...v2Response.fips],
      };
      expect(pendingAccountCount(stillArriving)).toBe(1);
    });

    it('parses valid transactions and drops malformed ones', () => {
      const txns = parseTransactions(flattenFiResponse(v2Response)[0]);
      expect(txns.length).toBe(3);
      const salary = txns.find(t => t.txnId === 'T1')!;
      expect(salary.type).toBe('CREDIT');
      expect(salary.amount).toBe(85000);
      expect(salary.balanceAfter).toBe(120000);
      expect(salary.mode).toBe('NEFT');
      expect(salary.dedupeKey).toBe('id:T1');
      // No txnId → fingerprint, stable across parses
      const atm = txns.find(t => t.narration === 'ATM WDL')!;
      expect(atm.dedupeKey.startsWith('h:')).toBe(true);
      expect(parseTransactions(flattenFiResponse(v2Response)[0]).find(t => t.narration === 'ATM WDL')!.dedupeKey).toBe(atm.dedupeKey);
    });

    it('never books term-deposit or insurance entries as CREDIT; the sign is used only when no type is declared', () => {
      const fd = parseTransactions({ data: { account: { type: 'term-deposit', transactions: { transaction: [
        { type: 'OPENING', amount: '100000', valueDate: '2026-01-01' },
        { type: 'TDS', amount: '500', valueDate: '2026-06-01' },
        { type: 'INTEREST', amount: '1800', valueDate: '2026-06-01' },
      ] } } } });
      expect(fd.length).toBe(0);
      const premium = parseTransactions({ account: { transactions: { transaction: [{ type: 'PREMIUM_PAYMENT', amount: '24000', txnDate: '2026-04-01' }] } } });
      expect(premium.length).toBe(0);
      const untyped = parseTransactions({ transactions: [{ amount: '-250', date: '2026-10-05' }, { amount: '900', date: '2026-10-06' }] });
      expect(untyped.map(t => t.type).join(',')).toBe('CREDIT,DEBIT'); // newest first
      expect(untyped[1].amount).toBe(250);
    });

    it('books savings-account INTEREST as a credit and TDS as a debit', () => {
      const sb = parseTransactions({ data: { account: { type: 'deposit', transactions: { transaction: [
        { type: 'INTEREST', amount: '1123.50', valueDate: '2026-09-30', narration: 'INT.PD' },
        { type: 'TDS', amount: '112.35', valueDate: '2026-09-30', narration: 'TDS' },
        { type: 'OTHERS', amount: '10', valueDate: '2026-09-30' },
      ] } } } });
      expect(sb.length).toBe(2);
      expect(sb.find(t => t.narration === 'INT.PD')!.type).toBe('CREDIT');
      expect(sb.find(t => t.narration === 'TDS')!.type).toBe('DEBIT');
    });

    it('keeps the newest 5000 transactions when the FIP sends more (oldest first)', () => {
      const start = Date.parse('2026-01-01T00:00:00Z');
      const transaction = Array.from({ length: 6000 }, (_, i) => ({
        txnId: `H${i}`, type: i % 2 ? 'DEBIT' : 'CREDIT', amount: '10', transactionTimestamp: new Date(start + i * 3600_000).toISOString(),
      }));
      const txns = parseTransactions({ data: { account: { transactions: { transaction } } } });
      expect(txns.length).toBe(5000);
      expect(txns[0].txnId).toBe('H5999');
      expect(txns[txns.length - 1].txnId).toBe('H1000');
    });

    it('reads the ReBIT nominee flag and returns null when the payload says nothing', () => {
      expect(nomineeFlagOf(flattenFiResponse(v2Response)[0])).toBe('REGISTERED');
      expect(nomineeFlagOf({ profile: { holders: { holder: { nominee: 'NOT-REGISTERED' } } } })).toBe('NOT_REGISTERED');
      expect(nomineeFlagOf({ type: 'SAVINGS' })).toBeNull();
    });

    it('strips the transaction list from the stored payload', () => {
      const stripped = withoutTransactions(flattenFiResponse(v2Response)[0]);
      expect(stripped.data.account.transactions).toBe(undefined);
      expect(stripped.data.account.summary.currentBalance).toBe('101666.33');
    });

    it('stores each transaction once across overlapping refreshes and follows the account to its new snapshot', async () => {
      const txns = parseTransactions(flattenFiResponse(v2Response)[0]);
      const key = accountKeyOf('deposit', 'HDFC-FIP', 'XXXXXX1234');
      const snapshot1 = crypto.randomUUID();
      const snapshot2 = crypto.randomUUID();

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        expect(await saveAccountTransactions(client, userId, snapshot1, key, txns)).toBe(3);
        await client.query('COMMIT');

        // Next refresh: snapshot re-created with a new id, overlapping range plus one new entry
        const next = [...txns, { ...txns[1], txnId: 'T9', dedupeKey: 'id:T9', amount: 99 }];
        await client.query('BEGIN');
        expect(await saveAccountTransactions(client, userId, snapshot2, key, next)).toBe(1);
        await client.query('COMMIT');
      } finally {
        client.release();
      }

      const rows = await pool.query('SELECT account_id FROM transactions WHERE user_id = $1', [userId]);
      expect(rows.rows.length).toBe(4);
      expect(rows.rows.every(r => r.account_id === snapshot2)).toBe(true);
    });

    it('keys accounts by type, institution and masked number, not by snapshot', () => {
      expect(accountKeyOf('deposit', 'HDFC-FIP', 'xxxxxx1234')).toBe(accountKeyOf('deposit', ' hdfc-fip ', 'XXXXXX1234'));
      expect(accountKeyOf('deposit', 'HDFC-FIP', 'XXXXXX1234') === accountKeyOf('deposit', 'HDFC-FIP', 'XXXXXX5678')).toBe(false);
      // A savings account and a term deposit with the same masked suffix are different accounts
      expect(accountKeyOf('deposit', 'HDFC-FIP', 'XXXXXX1234') === accountKeyOf('term_deposit', 'HDFC-FIP', 'XXXXXX1234')).toBe(false);
    });

    it('maps Setu FI types (incl. GSTR1_3B) and skips unknown types instead of filing them as deposits', () => {
      expect(mapFIType('GSTR1_3B')).toBe('GSTN');
      expect(mapFIType('mutualfunds')).toBe('MUTUAL_FUND');
      expect(mapFIType('EQUITIES')).toBe('EQUITY');
      expect(mapFIType('term-deposit')).toBe('DEPOSIT');
      expect(mapFIType('something_new')).toBeNull();

      const items = normalizeFinancialData([
        ...flattenFiResponse(v2Response),
        { fiType: 'GSTR1_3B', fipID: 'GST-FIP', linkRefNumber: 'g1', data: { account: { type: 'gstr1_3b' } } },
        { fipID: 'X-FIP', data: { account: { type: 'mystery' } } },
      ]);
      expect(items.length).toBe(2);
      expect(items[0].fiType).toBe('DEPOSIT');
      expect(items[0].fipId).toBe('HDFC-FIP');
      expect(items[0].rawType).toBe('deposit');
      expect(items[0].linkRefNumber).toBe('link-1');
      expect(items[0].accountRef).toBe('XXXXXX1234');
      expect(items[0].balance).toBe(101666.33);
      expect(items[1].fiType).toBe('GSTN');
    });

    it('sets the consent data range end to the consent expiry and caps each session at now', () => {
      const now = new Date('2026-11-01T10:00:00Z');
      expect(consentDataRange('2025-11-01', now)).toEqual({ start: '2025-11-01', end: '2027-11-01' });
      expect(consentDataRange('2030-01-01', now).start).toBe('2026-11-01'); // never a future start

      const session = sessionDataRange('2025-11-01', '2027-11-01', now.getTime());
      expect(session.from).toBe('2025-11-01T00:00:00.000Z');
      expect(session.to).toBe(now.toISOString());
      // A consent created before the fix (range ended on its creation day) still fetches up to that end
      expect(sessionDataRange('2025-10-01', '2026-10-01', now.getTime()).to).toBe('2026-10-01T00:00:00.000Z');
    });

    it('keeps an old-style consent active and refreshes it end to end (sandbox data)', async () => {
      const consentId = crypto.randomUUID();
      // Created before the fix: the data range ends on the creation day
      await pool.query(
        `INSERT INTO consents (user_id, consent_id, fi_types, purpose, date_range_start, date_range_end, status)
         VALUES ($1, $2, '{DEPOSIT}', 'Test consent purpose', CURRENT_DATE - 365, CURRENT_DATE, 'ACTIVE')`,
        [userId, consentId]
      );
      const active = await ConsentModel.getActiveConsents(userId);
      expect(active.map(c => c.consentId)).toContain(consentId);

      const items = await fetchFinancialData(consentId, userId);
      expect(items.length).toBe(2);
      const snaps = await pool.query('SELECT COUNT(*)::int AS n FROM asset_snapshots_aa WHERE user_id = $1', [userId]);
      expect(snaps.rows[0].n).toBe(2);
      // Sandbox payloads carry a NOT-REGISTERED ReBIT flag, so the nominee check still records them
      const ns = await pool.query('SELECT has_nominee FROM nominee_status WHERE user_id = $1', [userId]);
      expect(ns.rows.length).toBe(2);
      expect(ns.rows.every(r => r.has_nominee === false)).toBe(true);

      // A second refresh doesn't duplicate accounts or the day's simulated entries
      const before = await pool.query('SELECT COUNT(*)::int AS n FROM transactions WHERE user_id = $1', [userId]);
      await fetchFinancialData(consentId, userId);
      const again = await pool.query('SELECT COUNT(*)::int AS n FROM asset_snapshots_aa WHERE user_id = $1', [userId]);
      expect(again.rows[0].n).toBe(2);
      const after = await pool.query('SELECT COUNT(*)::int AS n FROM transactions WHERE user_id = $1', [userId]);
      expect(after.rows[0].n).toBe(before.rows[0].n);
    });

    it('does not treat a consent past its 12-month duration as active', async () => {
      const consentId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO consents (user_id, consent_id, fi_types, purpose, date_range_start, date_range_end, status, created_at)
         VALUES ($1, $2, '{DEPOSIT}', 'Test consent purpose', CURRENT_DATE - 800, CURRENT_DATE + 30, 'ACTIVE', NOW() - INTERVAL '13 months')`,
        [userId, consentId]
      );
      const active = await ConsentModel.getActiveConsents(userId);
      expect(active.map(c => c.consentId).includes(consentId)).toBe(false);
    });
  });
}
