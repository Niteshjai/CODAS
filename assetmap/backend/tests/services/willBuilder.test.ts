import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { willBuilder, WillError } from '../../src/services/willBuilder';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

async function expectWillError(fn: () => Promise<unknown>, status: number, messagePart: string) {
  let caught: unknown;
  try { await fn(); } catch (err) { caught = err; }
  expect(caught instanceof WillError).toBe(true);
  expect((caught as WillError).statusCode).toBe(status);
  expect((caught as WillError).message).toContain(messagePart);
}

export function registerWillBuilderTests() {
  describe('willBuilder (Estate Planning & Asset Allocation)', () => {
    let testUserId: string;
    let otherUserId: string;
    let testWillId: string;
    let testBeneficiaryId: string;
    let secondBeneficiaryId: string;
    const aadhaarHash = crypto.randomBytes(16).toString('hex');

    const details = {
      testatorName: 'Nitesh Jaiswal',
      testatorDob: '1995-05-15',
      testatorAddress: '123 Test Street, Bangalore, KA',
      testatorPan: 'ABCDE1234F',
      executorName: 'Trusted Executor',
      executorRelation: 'Brother',
      executorMobile: '9876543210',
    };

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2), ($3, $4)
        RETURNING id
      `, [aadhaarHash, 'Will User', crypto.randomBytes(16).toString('hex'), 'Other User']);
      testUserId = res.rows[0].id;
      otherUserId = res.rows[1].id;
    });

    afterAll(async () => {
      for (const id of [testUserId, otherUserId].filter(Boolean)) {
        await pool.query('DELETE FROM will_allocations WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM will_beneficiaries WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM wills WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
      }
    });

    it('creates a draft will using the account\'s verified Aadhaar hash', async () => {
      testWillId = await willBuilder.createWill(pool, testUserId, details);
      expect(typeof testWillId).toBe('string');

      const row = await pool.query('SELECT testator_aadhaar_hash, status FROM wills WHERE id = $1', [testWillId]);
      expect(row.rows[0].testator_aadhaar_hash).toBe(aadhaarHash);
      expect(row.rows[0].status).toBe('draft');

      const auditResult = await pool.query(
        `SELECT action FROM audit_logs
         WHERE user_id = $1 AND entity_id = $2 AND action = 'WILL_CREATED'`,
        [testUserId, testWillId]
      );
      expect(auditResult.rows).toHaveLength(1);
    });

    it('rejects testators under 18 and self-appointed executors', async () => {
      const minorDob = `${new Date().getFullYear() - 10}-01-01`;
      await expectWillError(() => willBuilder.createWill(pool, testUserId, { ...details, testatorDob: minorDob }), 400, 'at least 18');
      await expectWillError(() => willBuilder.createWill(pool, testUserId, { ...details, executorName: 'nitesh jaiswal' }), 400, 'someone other than yourself');
    });

    it('updates will details in place', async () => {
      await willBuilder.updateWill(pool, testUserId, testWillId, { ...details, testatorAddress: '456 New Road, Pune' });
      const full = await willBuilder.getFullWill(pool, testUserId, testWillId);
      expect(full.testatorAddress).toBe('456 New Road, Pune');
    });

    it('adds beneficiaries and rejects duplicates', async () => {
      testBeneficiaryId = await willBuilder.addBeneficiary(pool, testUserId, testWillId, { name: 'Beneficiary Child', relation: 'Son' });
      secondBeneficiaryId = await willBuilder.addBeneficiary(pool, testUserId, testWillId, { name: 'Second Child', relation: 'Daughter' });
      expect(typeof testBeneficiaryId).toBe('string');
      await expectWillError(
        () => willBuilder.addBeneficiary(pool, testUserId, testWillId, { name: 'beneficiary child', relation: 'Son' }),
        400, 'already a beneficiary');
    });

    const assetRefId = crypto.randomUUID();

    it('allocates an asset using the beneficiary\'s stored name', async () => {
      const allocId = await willBuilder.addAllocation(pool, testUserId, testWillId, {
        assetType: 'land_record',
        assetRefId,
        assetDescription: 'Bangalore Apartment Flat 402',
        beneficiaryId: testBeneficiaryId,
        allocationPct: 60
      });
      expect(typeof allocId).toBe('string');
    });

    it('prevents an asset\'s allocations from exceeding 100%', async () => {
      await expectWillError(() => willBuilder.addAllocation(pool, testUserId, testWillId, {
        assetType: 'land_record', assetRefId, assetDescription: 'Bangalore Apartment Flat 402',
        beneficiaryId: secondBeneficiaryId, allocationPct: 50
      }), 400, 'Only 40%');
    });

    it('prevents giving the same beneficiary two shares of one asset', async () => {
      await expectWillError(() => willBuilder.addAllocation(pool, testUserId, testWillId, {
        assetType: 'land_record', assetRefId, assetDescription: 'Bangalore Apartment Flat 402',
        beneficiaryId: testBeneficiaryId, allocationPct: 10
      }), 400, 'already has a share');
    });

    it('blocks access to another user\'s will', async () => {
      await expectWillError(
        () => willBuilder.addBeneficiary(pool, otherUserId, testWillId, { name: 'Intruder', relation: 'Friend' }),
        404, 'Will not found');
    });

    it('resumes the current will with beneficiaries and allocations', async () => {
      const current = await willBuilder.getCurrentWill(pool, testUserId);
      expect(current.willId).toBe(testWillId);
      expect(current.details.testatorName).toBe('Nitesh Jaiswal');
      expect(current.beneficiaries).toHaveLength(2);
      expect(current.allocations).toHaveLength(1);
      expect(current.allocations[0].beneficiaryName).toBe('Beneficiary Child');
      expect(current.allocations[0].allocationPct).toBe(60);
    });

    it('generates a PDF and marks the will completed', async () => {
      const pdf = await willBuilder.generatePDF(pool, testUserId, testWillId);
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
      const row = await pool.query('SELECT status FROM wills WHERE id = $1', [testWillId]);
      expect(row.rows[0].status).toBe('completed');
    });

    it('removing a beneficiary removes their allocations and re-opens the draft', async () => {
      await willBuilder.removeBeneficiary(pool, testUserId, testWillId, testBeneficiaryId);
      const full = await willBuilder.getFullWill(pool, testUserId, testWillId);
      expect(full.beneficiaries).toHaveLength(1);
      expect(full.allocations).toHaveLength(0);
      expect(full.status).toBe('draft');
    });

    it('refuses to generate a PDF with nothing allocated', async () => {
      await expectWillError(() => willBuilder.generatePDF(pool, testUserId, testWillId), 400, 'Allocate at least one asset');
    });

  });
}
