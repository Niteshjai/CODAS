import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { loanEligibility } from '../../src/services/loanEligibility';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerLoanEligibilityTests() {
  describe('loanEligibility (Indian Lending & FOIR Assessment)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Loan User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM loan_assessments WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('calculates FOIR, LTV and loan eligibility accurately for high credit score', async () => {
      const assessment = await loanEligibility.assessEligibility(pool, testUserId, {
        monthlyIncomePaise: 100000_00, // ₹1,00,000 / month
        monthlyObligationsPaise: 20000_00, // ₹20,000 / month
        totalAssetsPaise: 5000000_00, // ₹50 Lakhs
        totalLandValuePaise: 4000000_00, // ₹40 Lakhs
        existingLoansPaise: 200000_00,
        creditScoreApprox: 780
      });

      expect(assessment.foir).toBe(0.2); // 20,000 / 1,00,000 = 0.2
      expect(assessment.eligibilityBand).toBe('high');
      expect(assessment.availableEMIPaise).toBe(35000_00); // (1,00,000 * 0.55) - 20,000 = 35,000
      expect(assessment.homeLoanMaxPaise).toBeGreaterThan(0);
      expect(assessment.personalLoanMaxPaise).toBeGreaterThan(0);
      expect(assessment.homeLoanEMI).toBeGreaterThan(0);
    });

    it('sets personal loan eligibility to 0 for poor credit score (< 650)', async () => {
      const assessment = await loanEligibility.assessEligibility(pool, testUserId, {
        monthlyIncomePaise: 80000_00,
        monthlyObligationsPaise: 10000_00,
        totalAssetsPaise: 2000000_00,
        totalLandValuePaise: 1500000_00,
        existingLoansPaise: 0,
        creditScoreApprox: 620
      });

      expect(assessment.personalLoanMaxPaise).toBe(0);
      expect(assessment.eligibilityBand).toBe('low');
    });

  });
}
