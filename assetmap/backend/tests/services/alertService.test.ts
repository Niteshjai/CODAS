import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { alertService } from '../../src/services/alertService';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerAlertServiceTests() {
  describe('alertService (Alerts, Emails & Preferences)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Alert Test User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM user_alerts WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM alert_preferences WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('creates a new user alert notification in database', async () => {
      const alertId = await alertService.createAlert(pool, {
        userId: testUserId,
        type: 'new_account_linked',
        severity: 'warning',
        title: 'New Account Linked',
        body: 'A bank account was linked to your profile.',
        metadata: { ip: '192.168.1.1' }
      });

      expect(typeof alertId).toBe('string');

      const alerts = await alertService.getUserAlerts(pool, testUserId);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].title).toBe('New Account Linked');
      expect(alerts[0].severity).toBe('warning');
    });

    it('tracks unread alert counts and marks alerts as read', async () => {
      const unreadBefore = await alertService.getUnreadCount(pool, testUserId);
      expect(unreadBefore).toBeGreaterThanOrEqual(1);

      await alertService.markAllRead(pool, testUserId);

      const unreadAfter = await alertService.getUnreadCount(pool, testUserId);
      expect(unreadAfter).toBe(0);
    });

    it('retrieves and updates user alert preferences', async () => {
      const prefs = await alertService.getPreferences(pool, testUserId);
      expect(prefs).toBeDefined();

      await alertService.updatePreferences(pool, testUserId, {
        email_enabled: true,
        sms_enabled: false
      });

      const updated = await alertService.getPreferences(pool, testUserId);
      expect(updated.email_enabled).toBe(true);
      expect(updated.sms_enabled).toBe(false);
    });

    it('sends email or console fallback without crashing', async () => {
      // In dev mode / test, sendEmail handles delivery
      const sent = await alertService.sendEmail({
        to: 'delivered@resend.dev',
        subject: 'Test Notification',
        html: '<p>This is a test notification</p>'
      });
      expect(typeof sent).toBe('boolean');
    });

  });
}
