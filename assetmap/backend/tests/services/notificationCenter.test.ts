import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import Fastify from 'fastify';
import crypto from 'crypto';
import { pool } from '../../src/db/connection';
import {
  notificationCenter, buildFeed, mergeRaw, NOTIFICATION_SOURCES, NotificationError,
  safeInAppPath, maskIp, ACTIVITY_COPY, type NotificationSource, type RawNotification,
} from '../../src/services/notificationCenter';
import { notificationsRoutes } from '../../src/routes/notifications';
import { verifyAccessToken } from '../../src/middleware/auth';
import { AUDIT_ACTIONS } from '../../src/utils/constants';

async function expectNotificationError(fn: () => Promise<unknown>, status: number) {
  let caught: unknown;
  try { await fn(); } catch (err) { caught = err; }
  expect(caught instanceof NotificationError).toBe(true);
  expect((caught as NotificationError).statusCode).toBe(status);
}

const HOUR = 60 * 60 * 1000;

function raw(partial: Partial<RawNotification> & { id: string }): RawNotification {
  return {
    kind: 'alert', severity: 'info', title: partial.id, body: '', createdAt: new Date(), source: 'test',
    ...partial,
  };
}

export function registerNotificationCenterTests() {
  describe('notificationCenter (in-app notification feed)', () => {
    let userId: string;
    let otherUserId: string;
    let balanceAlertId: string;
    let otherAlertId: string;
    let nomineeItemId: string;
    let shortfallInsightId: string;
    let dismissedInsightId: string;

    beforeAll(async () => {
      const u = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted) VALUES ($1, 'Notif User'), ($2, 'Other Notif User') RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), crypto.randomBytes(16).toString('hex')]);
      userId = u.rows[0].id;
      otherUserId = u.rows[1].id;

      // Stored alerts: two copies of a standing condition + a balance drop
      await pool.query(`
        INSERT INTO user_alerts (user_id, alert_type, severity, title, body, created_at) VALUES
          ($1, 'nominee_missing', 'warning', '3 accounts have no nominee', 'old', NOW() - INTERVAL '20 days'),
          ($1, 'nominee_missing', 'warning', '2 accounts have no nominee', 'newer', NOW() - INTERVAL '2 days')
      `, [userId]);
      const b = await pool.query(`
        INSERT INTO user_alerts (user_id, alert_type, severity, title, body, metadata, created_at)
        VALUES ($1, 'balance_drop', 'critical', 'Balance dropped 40%', 'Your total balance fell.', '{"actionUrl":"https://evil.example"}', NOW() - INTERVAL '1 hour')
        RETURNING id
      `, [userId]);
      balanceAlertId = b.rows[0].id;
      const o = await pool.query(`
        INSERT INTO user_alerts (user_id, alert_type, severity, title, body) VALUES ($1, 'large_transaction', 'info', 'Not yours', 'x') RETURNING id
      `, [otherUserId]);
      otherAlertId = o.rows[0].id;

      // A live condition: an account with no nominee
      await pool.query(`
        INSERT INTO nominee_status (user_id, account_ref, institution_name, fi_type, has_nominee)
        VALUES ($1, 'acct-1', 'Test Bank', 'DEPOSIT', false)
      `, [userId]);

      // Budget over 100% this month
      await pool.query(`INSERT INTO category_budgets (user_id, category, budget_paise) VALUES ($1, 'SUBSCRIPTIONS', 100000)`, [userId]);
      await pool.query(`
        INSERT INTO monthly_spend_summary (user_id, month, category, category_group, total_paise, transaction_count)
        VALUES ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, 'SUBSCRIPTIONS', 'expense', 125000, 3)
      `, [userId]);

      // 99.5% of a budget used — close, but not over
      await pool.query(`INSERT INTO category_budgets (user_id, category, budget_paise) VALUES ($1, 'SHOPPING', 100000)`, [userId]);
      await pool.query(`
        INSERT INTO monthly_spend_summary (user_id, month, category, category_group, total_paise, transaction_count)
        VALUES ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, 'SHOPPING', 'expense', 99500, 2)
      `, [userId]);

      // Spend insights: a missed savings target, and one already dismissed in the Spend Analyser
      const si = await pool.query(`
        INSERT INTO spend_insights (user_id, month, insight_type, title, body, action_label, action_url, dismissed_at) VALUES
          ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, 'savings_opportunity', 'Saving 10% of income vs your 25% target', 'b', 'See needs vs wants', '/dashboard?tab=analytics&view=breakdown', NULL),
          ($1, DATE_TRUNC('month', CURRENT_DATE)::DATE, 'large_expense', 'Dismissed insight', 'b', 'See transaction', '/dashboard?tab=analytics&view=transactions', NOW())
        RETURNING id, title
      `, [userId]);
      shortfallInsightId = si.rows.find((r: { title: string }) => r.title.startsWith('Saving')).id;
      dismissedInsightId = si.rows.find((r: { title: string }) => r.title === 'Dismissed insight').id;

      // Support replied on an open ticket
      const t = await pool.query(`
        INSERT INTO support_tickets (reference, user_id, category, subject) VALUES ($1, $2, 'bug', 'PDF will not download') RETURNING id
      `, [`CS-T${crypto.randomBytes(3).toString('hex').toUpperCase()}`, userId]);
      await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'user', 'It fails')`, [t.rows[0].id]);
      await pool.query(`INSERT INTO support_messages (ticket_id, sender, body) VALUES ($1, 'agent', 'Fixed now, please retry')`, [t.rows[0].id]);

      // Security activity with a full IP address
      await pool.query(`
        INSERT INTO two_factor_audit_log (user_id, event, method, ip_address, user_agent, metadata)
        VALUES ($1, '2fa_disabled', NULL, '203.0.113.77', 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0', '{}')
      `, [userId]);
    });

    afterAll(async () => {
      for (const id of [userId, otherUserId].filter(Boolean)) {
        await pool.query('DELETE FROM notification_state WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM two_factor_audit_log WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM spend_insights WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM support_tickets WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM monthly_spend_summary WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM category_budgets WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM nominee_status WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM user_alerts WHERE user_id = $1', [id]);
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
      }
    });

    it('builds a sorted, de-duplicated feed from alerts, live conditions and activity', async () => {
      const feed = await buildFeed(pool, userId);
      expect(feed.degraded).toHaveLength(0);
      const ids = feed.items.map(i => i.id);
      expect(new Set(ids).size).toBe(ids.length);

      for (let k = 1; k < feed.items.length; k++) {
        expect(new Date(feed.items[k - 1].createdAt).getTime() >= new Date(feed.items[k].createdAt).getTime()).toBe(true);
      }

      // The live nominee item replaces both stored nominee_missing alerts
      expect(feed.items.filter(i => i.title.includes('no nominee') && i.kind === 'alert')).toHaveLength(0);
      const nominee = feed.items.find(i => i.id.startsWith('action:nominee:'));
      expect(nominee).toBeDefined();
      expect(nominee!.title).toBe('1 account has no nominee');
      expect(nominee!.actionUrl).toBe('/nominee');
      nomineeItemId = nominee!.id;

      const balance = feed.items.find(i => i.id === `alert:${balanceAlertId}`)!;
      expect(balance.severity).toBe('critical');
      expect(balance.read).toBe(false);
      // Unsafe metadata URLs are never passed through
      expect(balance.actionUrl).toBe('/dashboard?tab=overview');

      const budget = feed.items.find(i => i.id.startsWith('action:budget:') && i.title.includes('Subscriptions'))!;
      expect(budget.title).toBe('Over budget on Subscriptions');
      expect(budget.body).toContain('₹1,250');
      // ₹995 of ₹1,000 would round to 100% but is not over budget
      const near = feed.items.find(i => i.id.startsWith('action:budget:') && i.title.includes('Shopping'))!;
      expect(near.title).toBe('Shopping budget 99% used');
      expect(near.severity).toBe('info');

      const support = feed.items.find(i => i.id.startsWith('action:support-reply:'))!;
      expect(support.body).toContain('Fixed now');

      // Never a will, never 2FA → both are suggested
      expect(ids.includes('action:will:none')).toBe(true);
      expect(feed.items.some(i => i.id.startsWith('action:2fa-off:'))).toBe(true);
      // Standing conditions carry no made-up event date
      expect(feed.items.find(i => i.id === 'action:will:none')!.ongoing).toBe(true);
      expect(feed.items.find(i => i.id.startsWith('action:2fa-off:'))!.ongoing).toBe(true);

      expect(feed.unreadCount).toBe(feed.items.filter(i => !i.read).length);
      expect(feed.counts.all).toBe(feed.items.length);
    });

    it("never includes another user's items and masks IP addresses", async () => {
      const feed = await buildFeed(pool, userId);
      expect(feed.items.some(i => i.id === `alert:${otherAlertId}`)).toBe(false);
      const sec = feed.items.find(i => i.title === 'Two-factor authentication turned off')!;
      expect(sec.kind).toBe('activity');
      expect(sec.read).toBe(false);
      expect(sec.dismissible).toBe(false);
      expect(sec.body).toContain('203.0.113.x');
      expect(sec.body).toContain('Chrome on Windows');
      expect(JSON.stringify(feed)).not.toContain('203.0.113.77');

      const other = await buildFeed(pool, otherUserId);
      expect(other.items.some(i => i.id === `alert:${balanceAlertId}`)).toBe(false);
    });

    it('marks single items read (stored alerts and live items) and rejects foreign or malformed ids', async () => {
      await notificationCenter.markRead(pool, userId, `alert:${balanceAlertId}`);
      const row = await pool.query('SELECT is_read FROM user_alerts WHERE id = $1', [balanceAlertId]);
      expect(row.rows[0].is_read).toBe(true);

      await notificationCenter.markRead(pool, userId, nomineeItemId);
      const feed = await buildFeed(pool, userId);
      expect(feed.items.find(i => i.id === nomineeItemId)!.read).toBe(true);
      expect(feed.items.find(i => i.id === `alert:${balanceAlertId}`)!.read).toBe(true);

      await expectNotificationError(() => notificationCenter.markRead(pool, userId, `alert:${otherAlertId}`), 404);
      await expectNotificationError(() => notificationCenter.markRead(pool, userId, 'alert:not-a-uuid'), 404);
      await expectNotificationError(() => notificationCenter.markRead(pool, userId, 'bogus'), 404);
      const foreign = await pool.query('SELECT is_read FROM user_alerts WHERE id = $1', [otherAlertId]);
      expect(foreign.rows[0].is_read).toBe(false);

      // Well-formed ids that the user's feed doesn't produce never create state rows
      await expectNotificationError(() => notificationCenter.markRead(pool, userId, 'recovery:anything-at-all'), 404);
      await expectNotificationError(() => notificationCenter.dismiss(pool, userId, 'action:made-up'), 404);
      await expectNotificationError(() => notificationCenter.snooze(pool, userId, 'action:made-up', 1), 404);
      const junk = await pool.query(
        `SELECT COUNT(*)::int AS n FROM notification_state WHERE user_id = $1 AND item_key IN ('recovery:anything-at-all', 'action:made-up')`,
        [userId]
      );
      expect(junk.rows[0].n).toBe(0);
    });

    it('treats spend insights honestly: no "success" for missed targets, read stays listed, dismiss is shared', async () => {
      let feed = await buildFeed(pool, userId);
      const id = `insight:${shortfallInsightId}`;
      const shortfall = feed.items.find(i => i.id === id)!;
      expect(shortfall.severity).toBe('info');
      // The Spend Analyser can't open a specific view yet, so the link doesn't promise one
      expect(shortfall.actionUrl).toBe('/dashboard?tab=analytics');
      expect(shortfall.actionLabel).toBe('Open Spend Analyser');
      expect(feed.items.some(i => i.id === `insight:${dismissedInsightId}`)).toBe(false);

      await notificationCenter.markRead(pool, userId, id);
      feed = await buildFeed(pool, userId);
      expect(feed.items.find(i => i.id === id)!.read).toBe(true);

      await notificationCenter.dismiss(pool, userId, id);
      const row = await pool.query('SELECT dismissed_at FROM spend_insights WHERE id = $1', [shortfallInsightId]);
      expect(row.rows[0].dismissed_at === null).toBe(false);
      feed = await buildFeed(pool, userId);
      expect(feed.items.some(i => i.id === id)).toBe(false);

      // Un-dismissing in the Spend Analyser brings it back in the bell (one shared state)
      await pool.query('UPDATE spend_insights SET dismissed_at = NULL WHERE id = $1', [shortfallInsightId]);
      feed = await buildFeed(pool, userId);
      expect(feed.items.some(i => i.id === id)).toBe(true);
    });

    it('dismisses a live item until its underlying condition changes', async () => {
      await notificationCenter.dismiss(pool, userId, nomineeItemId);
      let feed = await buildFeed(pool, userId);
      expect(feed.items.some(i => i.id.startsWith('action:nominee:'))).toBe(false);

      // Another account without a nominee → new fingerprint → the item comes back, unread
      await pool.query(`
        INSERT INTO nominee_status (user_id, account_ref, institution_name, fi_type, has_nominee)
        VALUES ($1, 'acct-2', 'Second Bank', 'DEPOSIT', false)
      `, [userId]);
      feed = await buildFeed(pool, userId);
      const back = feed.items.find(i => i.id.startsWith('action:nominee:'))!;
      expect(back).toBeDefined();
      expect(back.id === nomineeItemId).toBe(false);
      expect(back.title).toBe('2 accounts have no nominee');
      expect(back.read).toBe(false);
    });

    it('refuses to dismiss activity history', async () => {
      const feed = await buildFeed(pool, userId);
      const activity = feed.items.find(i => i.kind === 'activity')!;
      await expectNotificationError(() => notificationCenter.dismiss(pool, userId, activity.id), 400);
    });

    it('snoozes an item until the snooze ends', async () => {
      const id = 'action:will:none';
      await notificationCenter.snooze(pool, userId, id, 1);
      expect((await buildFeed(pool, userId)).items.some(i => i.id === id)).toBe(false);
      const later = await buildFeed(pool, userId, { now: new Date(Date.now() + 2 * HOUR) });
      expect(later.items.some(i => i.id === id)).toBe(true);
      await expectNotificationError(() => notificationCenter.snooze(pool, userId, id, 0), 400);
    });

    it('marks everything read, including stored alerts', async () => {
      await pool.query(`INSERT INTO user_alerts (user_id, alert_type, severity, title, body) VALUES ($1, 'large_transaction', 'info', 'Large payment', '₹2,00,000 debited')`, [userId]);
      const before = await buildFeed(pool, userId);
      expect(before.unreadCount).toBeGreaterThan(0);

      const after = await notificationCenter.markAllRead(pool, userId);
      expect(after.unreadCount).toBe(0);
      const rebuilt = await buildFeed(pool, userId);
      expect(rebuilt.unreadCount).toBe(0);
      const unreadAlerts = await pool.query('SELECT COUNT(*)::int AS n FROM user_alerts WHERE user_id = $1 AND is_read = false', [userId]);
      expect(unreadAlerts.rows[0].n).toBe(0);
    });

    it('isolates a failing source, silently skips a missing table, and reports a missing column', async () => {
      const boom: NotificationSource = { name: 'boom', load: async () => { throw new Error('kaboom'); } };
      const missingTable: NotificationSource = {
        name: 'missing_table',
        load: async ({ pool: p }) => { await p.query('SELECT 1 FROM table_that_does_not_exist_030'); return []; },
      };
      const missingColumn: NotificationSource = {
        name: 'missing_column',
        load: async ({ pool: p }) => { await p.query('SELECT column_that_does_not_exist_030 FROM users LIMIT 1'); return []; },
      };
      const feed = await buildFeed(pool, userId, { sources: [boom, ...NOTIFICATION_SOURCES, missingTable, missingColumn] });
      expect([...feed.degraded].sort()).toEqual(['boom', 'missing_column']);
      expect(feed.items.some(i => i.id.startsWith('action:budget:'))).toBe(true);
    });

    it('keeps only the newest copy of a standing-condition alert and collapses repeated activity', async () => {
      const now = Date.now();
      const out = mergeRaw([
        raw({ id: 'alert:a', alertType: 'consent_expiring', createdAt: new Date(now - 3 * HOUR) }),
        raw({ id: 'alert:b', alertType: 'consent_expiring', createdAt: new Date(now - HOUR) }),
        raw({ id: 'alert:b', alertType: 'consent_expiring', createdAt: new Date(now - HOUR) }),
        raw({ id: 'activity:1', kind: 'activity', collapseKey: 'sync', createdAt: new Date(now - 10 * 60 * 1000) }),
        raw({ id: 'activity:2', kind: 'activity', collapseKey: 'sync', createdAt: new Date(now - 10 * 60 * 1000 - 2000) }),
        raw({ id: 'activity:3', kind: 'activity', collapseKey: 'sync', createdAt: new Date(now - 40 * 60 * 1000) }),
      ]);
      expect(out.map(i => i.id)).toEqual(['activity:1', 'alert:b']);
      expect((out[0] as RawNotification & { count?: number }).count).toBe(2);
    });

    it('only allows in-app action paths and masks IPs to /24', async () => {
      expect(safeInAppPath('/nominee')).toBe('/nominee');
      expect(safeInAppPath('/dashboard?tab=land')).toBe('/dashboard?tab=land');
      expect(safeInAppPath('https://evil.example')).toBeNull();
      expect(safeInAppPath('//evil.example')).toBeNull();
      expect(safeInAppPath('/javascript:alert(1)')).toBeNull();
      expect(maskIp('10.20.30.40')).toBe('10.20.30.x');
      expect(maskIp('::ffff:10.20.30.40')).toBe('10.20.30.x');
      expect(maskIp('2001:db8:85a3::8a2e:370:7334')).toBe('2001:db8:85a3::/48');
      // Compressed addresses are expanded first, so no host bits leak into the prefix
      expect(maskIp('2001:db8::1')).toBe('2001:db8:0::/48');
      expect(maskIp('fe80::1c2b:3d4e:5f60:7182')).toBe('fe80:0:0::/48');
      expect(maskIp('::1')).toBe('0:0:0::/48');
      expect(maskIp('fe80::1%eth0')).toBe('fe80:0:0::/48');
      expect(maskIp('not-an-ip')).toBeNull();
    });

    it('has a decision (copy or hidden) for every audit action', async () => {
      for (const action of AUDIT_ACTIONS) {
        expect(Object.prototype.hasOwnProperty.call(ACTIVITY_COPY, action)).toBe(true);
      }
    });

    it('serves the feed with authentication only — no plan gate', async () => {
      const app = Fastify();
      const routes: Array<{ url: string; preHandler: unknown }> = [];
      app.addHook('onRoute', (r) => { routes.push({ url: r.url, preHandler: r.preHandler }); });
      await app.register(notificationsRoutes, { prefix: '/api/notifications' });
      await app.ready();
      expect(routes.length).toBeGreaterThanOrEqual(5);
      for (const r of routes) {
        expect(Array.isArray(r.preHandler)).toBe(true);
        expect((r.preHandler as unknown[]).length).toBe(1);
        expect((r.preHandler as unknown[])[0] === verifyAccessToken).toBe(true);
      }

      const prevMock = process.env.MOCK_MODE;
      process.env.MOCK_MODE = 'true';
      try {
        const res = await app.inject({ method: 'GET', url: '/api/notifications' });
        expect(res.statusCode).toBe(200);
        const body = res.json();
        expect(body.success).toBe(true);
        expect(Array.isArray(body.data.items)).toBe(true);

        const bad = await app.inject({ method: 'POST', url: '/api/notifications/not-an-id/read' });
        expect(bad.statusCode).toBe(400);
      } finally {
        process.env.MOCK_MODE = prevMock;
        await app.close();
      }
    });
  });
}
