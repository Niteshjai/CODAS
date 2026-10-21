import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { twoFactorAuth } from '../../src/auth/twoFactorAuth';
import { totpService } from '../../src/auth/totpService';
import { pool, kvStore } from '../../src/db/connection';
import { encryptPII } from '../../src/utils/encryption';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

export function registerTwoFactorAuthTests() {
  describe('twoFactorAuth (Orchestrator & Flow)', () => {
    let testUserId: string;
    const testEmail = `2fa_orch_${Date.now()}@example.com`;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted, email_encrypted)
        VALUES ($1, $2, $3)
        RETURNING id
      `, [
        crypto.randomBytes(16).toString('hex'),
        encryptPII('Orchestrator Test User'),
        encryptPII(testEmail)
      ]);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM two_factor_audit_log WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM two_factor_backup_codes WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM trusted_devices WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM pending_2fa_sessions WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM user_two_factor WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await kvStore.del(`ratelimit:2fa_fail:${testUserId}`);
        await kvStore.del(`ratelimit:2fa_lock:${testUserId}`);
      }
    });

    it('returns isEnabled: false for initial status', async () => {
      const status = await twoFactorAuth.getStatus(pool, testUserId);
      expect(status.isEnabled).toBe(false);
      expect(status.method).toBeNull();
    });

    it('begins and confirms TOTP setup successfully', async () => {
      // 1. Begin TOTP setup
      const setup = await twoFactorAuth.beginTOTPSetup(pool, testUserId);
      expect(setup.secret).toBeDefined();
      expect(setup.qrCode.startsWith('data:image/png;base64,')).toBe(true);

      // 2. Generate valid TOTP token from secret
      const token = speakeasy.totp({
        secret: setup.secret,
        encoding: 'base32'
      });

      // 3. Confirm TOTP setup
      const confirm = await twoFactorAuth.confirmTOTPSetup(pool, testUserId, token);
      expect(confirm.success).toBe(true);
      expect(confirm.backupCodes).toHaveLength(10);

      // 4. Status should now be enabled with method 'totp'
      const status = await twoFactorAuth.getStatus(pool, testUserId);
      expect(status.isEnabled).toBe(true);
      expect(status.method).toBe('totp');
      expect(status.backupRemaining).toBe(10);
    });

    it('creates a short-lived pending 2FA session token', async () => {
      const token = await twoFactorAuth.createPendingSession(
        pool,
        testUserId,
        '127.0.0.1',
        'Jest-Runner/1.0'
      );

      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);

      // Verify row in pending_2fa_sessions
      const row = await pool.query('SELECT user_id, is_used FROM pending_2fa_sessions WHERE session_token = $1', [token]);
      expect(row.rows[0]?.user_id).toBe(testUserId);
      expect(row.rows[0]?.is_used).toBe(false);
    });

    it('verifies 2FA challenge and issues trusted device token', async () => {
      // Get current TOTP secret from DB
      const user2FARow = await pool.query('SELECT totp_secret_enc FROM user_two_factor WHERE user_id = $1', [testUserId]);
      const { decryptPII } = await import('../../src/utils/encryption');
      const rawSecret = decryptPII(user2FARow.rows[0].totp_secret_enc);

      const code = speakeasy.totp({ secret: rawSecret, encoding: 'base32' });
      const pendingToken = await twoFactorAuth.createPendingSession(pool, testUserId, '127.0.0.1', 'Node/24');

      const result = await twoFactorAuth.verifyChallenge(pool, {
        pendingSessionToken: pendingToken,
        code,
        method: 'totp',
        trustDevice: true,
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome on Mac'
      });

      expect(result.success).toBe(true);
      expect(result.userId).toBe(testUserId);
      expect(result.deviceToken).toBeDefined();

      // Pending session must be marked as used
      const sessionRow = await pool.query('SELECT is_used FROM pending_2fa_sessions WHERE session_token = $1', [pendingToken]);
      expect(sessionRow.rows[0]?.is_used).toBe(true);
    });

    it('records failures and triggers temporary lockout after 5 failed attempts', async () => {
      await kvStore.del(`ratelimit:2fa_fail:${testUserId}`);
      await kvStore.del(`ratelimit:2fa_lock:${testUserId}`);

      for (let i = 0; i < 5; i++) {
        await twoFactorAuth.recordFailure(pool, testUserId, '127.0.0.1');
      }

      const isLocked = await kvStore.get(`ratelimit:2fa_lock:${testUserId}`);
      expect(isLocked).toBe('locked');

      // Cleanup
      await kvStore.del(`ratelimit:2fa_fail:${testUserId}`);
      await kvStore.del(`ratelimit:2fa_lock:${testUserId}`);
    });

    it('disables 2FA and revokes all trusted devices', async () => {
      await twoFactorAuth.disable(pool, testUserId, '127.0.0.1');

      const status = await twoFactorAuth.getStatus(pool, testUserId);
      expect(status.isEnabled).toBe(false);

      // Verify devices revoked
      const devices = await pool.query('SELECT * FROM trusted_devices WHERE user_id = $1 AND is_active = true', [testUserId]);
      expect(devices.rows).toHaveLength(0);
    });

  });
}
