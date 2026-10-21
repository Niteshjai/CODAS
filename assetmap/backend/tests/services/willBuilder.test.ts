import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { willBuilder } from '../../src/services/willBuilder';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerWillBuilderTests() {
  describe('willBuilder (Estate Planning & Asset Allocation)', () => {
    let testUserId: string;
    let testWillId: string;
    let testBeneficiaryId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Will User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM will_allocations WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM will_beneficiaries WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM wills WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('creates a new draft will record in database', async () => {
      testWillId = await willBuilder.createWill(pool, testUserId, {
        testatorName: 'Nitesh Jaiswal',
        testatorDob: '1995-05-15',
        testatorAddress: '123 Test Street, Bangalore, KA',
        testatorPan: 'ABCDE1234F',
        testatorAadhaarHash: crypto.randomBytes(16).toString('hex'),
        executorName: 'Trusted Executor',
        executorRelation: 'BROTHER',
        executorMobile: '+919876543210',
        subscriptionPlan: 'premium',
        subscriptionId: 'sub-test-123'
      });

      expect(typeof testWillId).toBe('string');

      const auditResult = await pool.query(
        `SELECT action FROM audit_logs
         WHERE user_id = $1 AND entity_id = $2 AND action = 'WILL_CREATED'`,
        [testUserId, testWillId]
      );
      expect(auditResult.rows).toHaveLength(1);
    });

    it('adds a beneficiary to the will', async () => {
      testBeneficiaryId = await willBuilder.addBeneficiary(pool, testUserId, testWillId, {
        name: 'Beneficiary Child',
        relation: 'SON',
        dob: '2015-01-01',
        mobile: '+919999900000',
        email: 'child@example.com'
      });

      expect(typeof testBeneficiaryId).toBe('string');
    });

    const assetRefId = crypto.randomUUID();

    it('adds an asset allocation to the will beneficiary', async () => {
      const allocId = await willBuilder.addAllocation(pool, testUserId, testWillId, {
        assetType: 'land_record',
        assetRefId: assetRefId,
        assetDescription: 'Bangalore Apartment Flat 402',
        estimatedValuePaise: 15000000_00, // 1.5 Cr
        beneficiaryId: testBeneficiaryId,
        beneficiaryName: 'Beneficiary Child',
        beneficiaryRelation: 'SON',
        allocationPct: 100
      });

      expect(typeof allocId).toBe('string');
    });

    it('prevents asset allocation from exceeding 100%', async () => {
      let threw = false;
      try {
        await willBuilder.addAllocation(pool, testUserId, testWillId, {
          assetType: 'land_record',
          assetRefId: assetRefId,
          assetDescription: 'Bangalore Apartment Flat 402',
          estimatedValuePaise: 15000000_00,
          beneficiaryId: testBeneficiaryId,
          beneficiaryName: 'Second Beneficiary',
          beneficiaryRelation: 'DAUGHTER',
          allocationPct: 50 // exceeds 100% since 100% already allocated
        });
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain('Allocation exceeds 100%');
      }

      expect(threw).toBe(true);
    });

    it('retrieves the full decrypted will with beneficiaries and allocations', async () => {
      const fullWill = await willBuilder.getFullWill(pool, testUserId, testWillId);

      expect(fullWill).toBeDefined();
      expect(fullWill.testatorName).toBe('Nitesh Jaiswal');
      expect(fullWill.executorName).toBe('Trusted Executor');
      expect(fullWill.beneficiaries).toHaveLength(1);
      expect(fullWill.beneficiaries[0].name).toBe('Beneficiary Child');
      expect(fullWill.allocations).toHaveLength(1);
      expect(parseFloat(fullWill.allocations[0].allocation_pct)).toBe(100);
    });

  });
}
