import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { netWorthTracker } from '../../src/services/netWorthTracker';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerNetWorthTrackerTests() {
  describe('netWorthTracker (Net Worth & Asset Snapshot Engine)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'NetWorth User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM asset_snapshots WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM networth_monthly WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('saves daily asset snapshot and computes total net worth', async () => {
      await netWorthTracker.saveSnapshot(pool, testUserId, {
        bankBalancePaise: 500000_00,    // 5 Lakhs
        mfValuePaise: 1000000_00,       // 10 Lakhs
        equityValuePaise: 1500000_00,   // 15 Lakhs
        npsValuePaise: 200000_00,       // 2 Lakhs
        insuranceValuePaise: 300000_00, // 3 Lakhs
        landValuePaise: 2500000_00,     // 25 Lakhs
        bankAccounts: 2,
        investmentAccounts: 3
      });

      const latest = await netWorthTracker.getLatestSnapshot(pool, testUserId);
      expect(latest).toBeDefined();
      expect(parseInt(latest.total_balance_paise)).toBe(6000000_00); // 60 Lakhs
      expect(parseInt(latest.bank_balance_paise)).toBe(500000_00);
      expect(parseInt(latest.land_value_paise)).toBe(2500000_00);
      expect(latest.total_accounts).toBe(5);
    });

    it('fetches net worth history and calculates growth trends', async () => {
      const history = await netWorthTracker.getNetWorthHistory(pool, testUserId, '12m');

      expect(history).toBeDefined();
      expect(Array.isArray(history.monthly)).toBe(true);
      expect(history.current).toBeDefined();
      expect(typeof history.allTimeHigh).toBe('number');
      expect(history.allTimeHigh).toBeGreaterThan(0);
    });

  });
}
