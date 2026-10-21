import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { otpService } from '../../src/auth/otpService';
import { pool, kvStore } from '../../src/db/connection';
import { encryptPII } from '../../src/utils/encryption';
import crypto from 'crypto';

export function registerOtpServiceTests() {
  describe('otpService (Email OTP 2FA)', () => {
    let testUserId: string;
    const testEmail = `test_otp_${Date.now()}@example.com`;

    beforeAll(async () => {
      // Create a test user in DB
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted, email_encrypted)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [
        crypto.randomBytes(16).toString('hex'),
        encryptPII('OTP Test User'),
        encryptPII(testEmail)
      ]);
      testUserId = res.rows[0].id;

      // Ensure user_two_factor row exists
      await pool.query(`
        INSERT INTO user_two_factor (user_id, is_enabled, method)
        VALUES ($1, false, 'email')
        ON CONFLICT (user_id) DO NOTHING
      `, [testUserId]);
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await kvStore.del(`ratelimit:2fa_send:${testUserId}`);
      }
    });

    it('sends email OTP, stores hash in DB, and sets expiry', async () => {
      const result = await otpService.sendEmailOTP(pool, testUserId);

      expect(result.sent).toBe(true);
      expect(result.maskedEmail).toContain('@');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Verify OTP hash is in database
      const row = await pool.query('SELECT otp_code_hash, otp_expires_at FROM user_two_factor WHERE user_id = $1', [testUserId]);
      expect(row.rows[0]?.otp_code_hash).toBeDefined();
      expect(typeof row.rows[0]?.otp_code_hash).toBe('string');
    });

    it('rejects an incorrect OTP code', async () => {
      const isValid = await otpService.verifyOTP(pool, testUserId, '000000');
      expect(isValid).toBe(false);
    });

    it('fails to verify if OTP has expired in the database', async () => {
      // Set expired timestamp
      await pool.query(`
        UPDATE user_two_factor
        SET otp_expires_at = NOW() - INTERVAL '1 minute'
        WHERE user_id = $1
      `, [testUserId]);

      const isValid = await otpService.verifyOTP(pool, testUserId, '123456');
      expect(isValid).toBe(false);
    });

    it('correctly tracks and enforces rate limits in Redis', async () => {
      const rateLimitUser = 'test-ratelimit-user-' + Date.now();
      await kvStore.del(`ratelimit:2fa_send:${rateLimitUser}`);

      // Record 3 sends
      await otpService.recordSend(rateLimitUser);
      await otpService.recordSend(rateLimitUser);
      await otpService.recordSend(rateLimitUser);

      let threw = false;
      try {
        await otpService.checkSendLimit(rateLimitUser);
      } catch (err: any) {
        threw = true;
        expect(err.message).toContain('OTP_RATE_LIMIT');
      }
      expect(threw).toBe(true);

      // Cleanup
      await kvStore.del(`ratelimit:2fa_send:${rateLimitUser}`);
    });

  });
}
