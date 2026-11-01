import { describe, it, expect, afterAll } from '../testFramework';
import { otpGuard } from '../../src/services/otpGuard';
import { otpStore } from '../../src/services/otpStore';
import { kvStore, redis, useMemoryStore } from '../../src/db/connection';

export function registerOtpGuardAndStoreTests() {
  describe('otpGuard & otpStore (Rate Limiting & Redis Stores)', () => {
    const testPhone = '+919999988888';
    const testTxnId = 'txn-test-' + Date.now();
    const testRegToken = 'reg-token-' + Date.now();

    afterAll(async () => {
      await otpGuard.clearOnSuccess(testPhone);
      await kvStore.del(`otp_lock:${testPhone}`);
      await otpStore.deletePhoneOtp(testTxnId);
      await otpStore.deletePendingRegistration(testRegToken);
    });

    it('otpGuard: tracks consecutive failures and locks after 5 attempts', async () => {
      await otpGuard.clearOnSuccess(testPhone);

      for (let i = 1; i <= 4; i++) {
        const attempts = await otpGuard.recordFailure(testPhone);
        expect(attempts).toBe(i);
        expect(await otpGuard.isLocked(testPhone)).toBe(false);
      }

      // 5th failure triggers lock
      await otpGuard.recordFailure(testPhone);
      const isLocked = await otpGuard.isLocked(testPhone);
      expect(isLocked).toBe(true);

      // Clearing on success removes failures
      await otpGuard.clearOnSuccess(testPhone);
    });

    it('otpGuard.allow: caps requests per target within the window', async () => {
      const id = 'allow-test-' + Date.now();
      try {
        for (let i = 1; i <= 3; i++) expect(await otpGuard.allow('test_scope', id, 3, 60)).toBe(true);
        expect(await otpGuard.allow('test_scope', id, 3, 60)).toBe(false);
        if (!useMemoryStore()) {
          const ttl = await redis.ttl(`otp_rate:test_scope:${id}`);
          expect(ttl).toBeGreaterThan(0);
          expect(ttl).toBeLessThan(61);
        }
      } finally {
        await kvStore.del(`otp_rate:test_scope:${id}`);
      }
    });

    it('otpGuard.allow: a counter left without a TTL gets one instead of locking out forever', async () => {
      const id = 'allow-nottl-' + Date.now();
      const key = `otp_rate:test_scope:${id}`;
      try {
        // A crash between INCR and EXPIRE used to leave exactly this behind
        await kvStore.incr(key);
        await kvStore.incr(key);
        expect(await otpGuard.allow('test_scope', id, 5, 60)).toBe(true);
        if (!useMemoryStore()) {
          expect(await redis.ttl(key)).toBeGreaterThan(0);
        }
        expect(await kvStore.get(key)).toBe('3');
      } finally {
        await kvStore.del(key);
      }
    });

    it('otpStore: phone OTP lifecycle (save, fetch, mark used, delete)', async () => {
      await otpStore.setPhoneOtp(testTxnId, {
        phone: testPhone,
        countryCode: '+91',
        otp: '123456'
      });

      const fetched = await otpStore.getPhoneOtp(testTxnId);
      expect(fetched).toBeDefined();
      expect(fetched.otp).toBe('123456');
      expect(fetched.used).toBe(false);

      await otpStore.markPhoneOtpUsed(testTxnId);
      const used = await otpStore.getPhoneOtp(testTxnId);
      expect(used.used).toBe(true);

      await otpStore.deletePhoneOtp(testTxnId);
      const deleted = await otpStore.getPhoneOtp(testTxnId);
      expect(deleted).toBeNull();
    });

    it('otpStore: pending registration flow lifecycle', async () => {
      await otpStore.setPendingRegistration(testRegToken, {
        phone: testPhone,
        countryCode: '+91',
        createdAt: Date.now()
      });

      const reg = await otpStore.getPendingRegistration(testRegToken);
      expect(reg).toBeDefined();
      expect(reg.phone).toBe(testPhone);

      // Update with KYC data
      await otpStore.updatePendingRegistration(testRegToken, {
        ...reg,
        email: 'user@example.com',
        kycData: { name: 'Verified Name' }
      });

      const updated = await otpStore.getPendingRegistration(testRegToken);
      expect(updated.email).toBe('user@example.com');
      expect(updated.kycData.name).toBe('Verified Name');

      await otpStore.deletePendingRegistration(testRegToken);
      expect(await otpStore.getPendingRegistration(testRegToken)).toBeNull();
    });

  });
}
