import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { insuranceGapFinder } from '../../src/services/insuranceGapFinder';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerInsuranceGapFinderTests() {
  describe('insuranceGapFinder (IRDAI Insurance Adequacy Engine)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Insurance User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM insurance_gap_analysis WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM insurance_policies WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('processes and stores AA insurance policies in database', async () => {
      await insuranceGapFinder.processAAInsuranceData(pool, testUserId, [
        {
          policyNumber: 'POL-TERM-001',
          insurerName: 'HDFC Life',
          policyType: 'TERM_INSURANCE',
          planName: 'Click 2 Protect 3D Plus',
          sumAssured: 10000000, // 1 Crore
          premium: 12000,
          premiumFrequency: 'ANNUALLY',
          policyStartDate: '2023-01-01',
          policyStatus: 'ACTIVE',
          nomineeName: 'Spouse Name',
          nomineeRelation: 'SPOUSE'
        },
        {
          policyNumber: 'POL-HEALTH-002',
          insurerName: 'Star Health',
          policyType: 'HEALTH_INSURANCE',
          planName: 'Family Health Optima',
          sumAssured: 1000000, // 10 Lakhs
          premium: 18000,
          premiumFrequency: 'ANNUALLY',
          policyStartDate: '2023-06-01',
          policyStatus: 'ACTIVE'
        }
      ]);

      const rows = await pool.query('SELECT * FROM insurance_policies WHERE user_id = $1', [testUserId]);
      expect(rows.rows).toHaveLength(2);
    });

    it('analyzes insurance gaps, computes shortfall and recommendations', async () => {
      const analysis = await insuranceGapFinder.analyzeGaps(pool, testUserId, {
        annualIncomePaise: 1200000_00,   // ₹12 Lakhs / year
        age: 32,
        dependentsCount: 2,
        outstandingLoansPaise: 3000000_00, // ₹30 Lakhs
        monthlyExpensesPaise: 50000_00
      });

      expect(analysis).toBeDefined();
      expect(analysis.hasTermPlan).toBe(true);
      expect(analysis.hasHealthCover).toBe(true);
      expect(analysis.totalTermCoverPaise).toBe(10000000_00); // 1 Crore
      expect(analysis.totalHealthCoverPaise).toBe(1000000_00); // 10 Lakhs
      expect(analysis.recommendedLifePaise).toBe(14400000_00); // 12 * 12L = 1.44 Cr
      expect(typeof analysis.gapScore).toBe('number');
      expect(Array.isArray(analysis.gaps)).toBe(true);
      expect(Array.isArray(analysis.recommendations)).toBe(true);
    });

  });
}
