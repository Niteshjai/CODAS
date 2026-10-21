import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { auditLogger } from '../../src/services/auditLogger';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerAuditLoggerTests() {
  describe('auditLogger (Immutable RBI Audit Logging)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Audit User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        // Audit logs are append-only / immutable by database trigger, so we clean users
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('writes an immutable audit log entry into database', async () => {
      await auditLogger.log(
        testUserId,
        'LOGIN' as any,
        'users',
        testUserId,
        '127.0.0.1',
        'Audit-Test-Agent/1.0',
        { method: 'phone_otp' }
      );

      const trail = await auditLogger.getUserAuditTrail(testUserId, 1, 10);
      expect(trail.total).toBeGreaterThanOrEqual(1);
      expect(trail.logs[0].action).toBe('LOGIN');
      expect(trail.logs[0].actionDescription).toBe('Logged in');
      expect(trail.logs[0].entityType).toBe('users');
    });

    it('retrieves user audit trail with pagination', async () => {
      const consentId = crypto.randomUUID();
      // Write multiple logs
      await auditLogger.log(testUserId, 'PHONE_VERIFIED' as any, 'auth', undefined, '127.0.0.1');
      await auditLogger.log(testUserId, 'CONSENT_CREATED' as any, 'consents', consentId, '127.0.0.1');

      const page1 = await auditLogger.getUserAuditTrail(testUserId, 1, 2);
      expect(page1.logs).toHaveLength(2);
      expect(page1.totalPages).toBeGreaterThanOrEqual(1);
    });

  });
}
