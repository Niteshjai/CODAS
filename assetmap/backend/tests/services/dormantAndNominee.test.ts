import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { dormantAccountFinder } from '../../src/services/dormantAccountFinder';
import { nomineeChecker } from '../../src/services/nomineeChecker';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerDormantAndNomineeTests() {
  describe('dormantAccountFinder & nomineeChecker (Asset Health & Compliance)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Health User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM dormant_accounts WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM nominee_status WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM user_alerts WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('dormantAccountFinder: detects inactive accounts and evaluates IEPF risk', async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setMonth(oneYearAgo.getMonth() - 14);

      const twoYearsAgo = new Date();
      twoYearsAgo.setMonth(twoYearsAgo.getMonth() - 24);

      const result = await dormantAccountFinder.analyzeAccounts(pool, testUserId, [
        {
          accountRef: 'ACC-DORMANT-01',
          fipName: 'State Bank of India',
          fiType: 'DEPOSIT',
          currentBalance: 50000,
          transactions: [
            { transactionDate: twoYearsAgo.toISOString(), amount: 1000 },
            { transactionDate: oneYearAgo.toISOString(), amount: 500 }
          ]
        }
      ]);

      expect(result.dormantCount).toBe(1);
      expect(result.totalDormantBalancePaise).toBe(50000_00);

      const dormant = await dormantAccountFinder.getDormantAccounts(pool, testUserId);
      expect(dormant.accounts).toHaveLength(1);
      expect(dormant.accounts[0].account_ref).toBe('ACC-DORMANT-01');
    });

    it('nomineeChecker: scans accounts for missing nominees and calculates completion %', async () => {
      const result = await nomineeChecker.processAAData(pool, testUserId, [
        {
          accountRef: 'ACC-WITH-NOMINEE',
          fipName: 'HDFC Bank',
          fiType: 'DEPOSIT',
          nominee: { name: 'Parent Name' }
        },
        {
          accountRef: 'ACC-NO-NOMINEE',
          fipName: 'ICICI Bank',
          fiType: 'DEPOSIT',
          nominee: null
        }
      ]);

      expect(result.withNominee).toBe(1);
      expect(result.withoutNominee).toBe(1);

      const status = await nomineeChecker.getNomineeStatus(pool, testUserId);
      expect(status.summary.total).toBe(2);
      expect(status.summary.withNominee).toBe(1);
      expect(status.summary.withoutNominee).toBe(1);
      expect(status.summary.completionPct).toBe(50);
    });

  });
}
