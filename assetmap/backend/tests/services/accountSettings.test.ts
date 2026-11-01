import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { accountSettings, SettingsError, maskEmail, maskMobile, __testing } from '../../src/services/accountSettings';
import { alertService } from '../../src/services/alertService';
import { pool, kvStore } from '../../src/db/connection';
import { encryptPII, decryptPII } from '../../src/utils/encryption';
import crypto from 'crypto';

async function expectSettingsError(fn: () => Promise<unknown>, status: number, messagePart: string) {
  let caught: unknown;
  try { await fn(); } catch (err) { caught = err; }
  expect(caught instanceof SettingsError).toBe(true);
  expect((caught as SettingsError).statusCode).toBe(status);
  expect((caught as SettingsError).message).toContain(messagePart);
}

export function registerAccountSettingsTests() {
  describe('accountSettings (Account Settings page)', () => {
    let userId: string;

    beforeAll(async () => {
      const res = await pool.query(
        `INSERT INTO users (aadhaar_hash, name_encrypted, mobile_encrypted) VALUES ($1, $2, $3) RETURNING id`,
        [crypto.randomBytes(16).toString('hex'), encryptPII('Settings Tester'), encryptPII('+919812345678')]
      );
      userId = res.rows[0].id;
    });

    afterAll(async () => {
      await kvStore.del(__testing.emailOtpKey(userId));
      await pool.query('DELETE FROM alert_preferences WHERE user_id = $1', [userId]);
      await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    });

    it('masks contact details for display', () => {
      expect(maskMobile('+919812345678')).toBe('+91 ••••••5678');
      expect(maskEmail('nitesh@example.com')).toBe('ni••••@example.com');
    });

    it('returns account, defaults and channel availability', async () => {
      const s = await accountSettings.getSettings(pool, userId);
      expect(s.account.name).toBe('Settings Tester');
      expect(s.account.mobile).toBe('+91 ••••••5678');
      expect(s.account.email).toBeNull();
      expect(s.account.plan.id).toBe('free');
      expect(s.notifications.marketing).toBe(false);
      expect(s.notifications.balanceDrop).toBe(true);
      expect(s.channels.emailOnFile).toBe(false);
      expect(s.channels.smsAllowed).toBe(false);
    });

    it('saves alert-type toggles and records marketing consent time', async () => {
      const prefs = await accountSettings.updateNotifications(pool, userId, { landChange: false, marketing: true });
      expect(prefs.landChange).toBe(false);
      expect(prefs.marketing).toBe(true);
      const row = await pool.query('SELECT marketing_updated_at FROM alert_preferences WHERE user_id = $1', [userId]);
      expect(row.rows[0].marketing_updated_at).not.toBeNull();
    });

    it('enforces prerequisites only when turning a channel on', async () => {
      await expectSettingsError(() => accountSettings.updateNotifications(pool, userId, { email: true }), 400, 'email address first');
      await expectSettingsError(() => accountSettings.updateNotifications(pool, userId, { sms: true }), 402, 'Plus plan');
      const off = await accountSettings.updateNotifications(pool, userId, { sms: false, push: false });
      expect(off.sms).toBe(false);
      expect(off.push).toBe(false);
    });

    it('ignores unknown keys instead of interpolating them into SQL', async () => {
      await alertService.updatePreferences(pool, userId, { 'sms_enabled = true; DROP TABLE users; --': true, sms_enabled: false } as any);
      const prefs = await accountSettings.getPreferences(pool, userId);
      expect(prefs.sms).toBe(false);
    });

    it('verifies a new email with a code before saving it (encrypted)', async () => {
      const email = `delivered+${crypto.randomBytes(4).toString('hex')}@resend.dev`;
      const started = await accountSettings.startEmailChange(pool, userId, email);
      expect(started.maskedEmail.endsWith('@resend.dev')).toBe(true);

      // Plant a known code (the real one only goes to the inbox)
      const pending = JSON.parse((await kvStore.get(__testing.emailOtpKey(userId)))!);
      pending.otpHash = __testing.hashOtp('424242');
      await kvStore.setex(__testing.emailOtpKey(userId), 600, JSON.stringify(pending));

      await expectSettingsError(() => accountSettings.confirmEmailChange(pool, userId, '111111'), 400, 'Incorrect code');
      const done = await accountSettings.confirmEmailChange(pool, userId, '424242');
      expect(done.email.endsWith('@resend.dev')).toBe(true);

      const row = await pool.query('SELECT email_encrypted, email_hash FROM users WHERE id = $1', [userId]);
      expect(decryptPII(row.rows[0].email_encrypted)).toBe(email);
      expect(typeof row.rows[0].email_hash).toBe('string');

      // Code is single-use
      await expectSettingsError(() => accountSettings.confirmEmailChange(pool, userId, '424242'), 400, 'expired');
      // With an email on file, email alerts can now be enabled
      const prefs = await accountSettings.updateNotifications(pool, userId, { email: true });
      expect(prefs.email).toBe(true);
    });

    it('locks the code after too many wrong attempts', async () => {
      await accountSettings.startEmailChange(pool, userId, `delivered+${crypto.randomBytes(4).toString('hex')}@resend.dev`);
      for (let i = 0; i < 5; i++) {
        try { await accountSettings.confirmEmailChange(pool, userId, '000000'); } catch { /* expected */ }
      }
      await expectSettingsError(() => accountSettings.confirmEmailChange(pool, userId, '000000'), 429, 'Too many');
      // The pending code is discarded once locked
      await expectSettingsError(() => accountSettings.confirmEmailChange(pool, userId, '000000'), 400, 'expired');
    });

    it('exports the user\'s own data without any Aadhaar number', async () => {
      const data = await accountSettings.exportData(pool, userId);
      expect(data.profile!.name).toBe('Settings Tester');
      expect(data.profile!.mobile).toBe('+919812345678');
      expect(data.profile!.aadhaar).toContain('Not stored');
      expect(Array.isArray(data.consents)).toBe(true);
      expect(data.notificationPreferences.email).toBe(true);
    });
  });
}
