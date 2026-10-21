import { describe, it, expect, beforeAll, afterAll } from '../testFramework';
import { backupCodeService } from '../../src/auth/backupCodeService';
import { pool } from '../../src/db/connection';
import crypto from 'crypto';

export function registerBackupCodeServiceTests() {
  describe('backupCodeService (2FA Recovery Codes)', () => {
    let testUserId: string;

    beforeAll(async () => {
      const res = await pool.query(`
        INSERT INTO users (aadhaar_hash, name_encrypted)
        VALUES ($1, $2)
        RETURNING id
      `, [crypto.randomBytes(16).toString('hex'), 'Backup Test User']);
      testUserId = res.rows[0].id;
    });

    afterAll(async () => {
      if (testUserId) {
        await pool.query('DELETE FROM two_factor_backup_codes WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
      }
    });

    it('generates exactly 10 backup codes with format XXXX-XXXXX', async () => {
      const codes = await backupCodeService.generateCodes(pool, testUserId);

      expect(codes).toHaveLength(10);
      for (const code of codes) {
        expect(typeof code).toBe('string');
        expect(code).toContain('-');
        expect(code.length).toBe(10);
      }

      // Check DB remaining count
      const count = await backupCodeService.getRemainingCount(pool, testUserId);
      expect(count).toBe(10);
    });

    it('verifies and consumes a valid backup code', async () => {
      const codes = await backupCodeService.generateCodes(pool, testUserId);
      const codeToUse = codes[0];

      const success = await backupCodeService.verifyAndConsume(
        pool,
        testUserId,
        codeToUse,
        '127.0.0.1'
      );

      expect(success).toBe(true);

      // Remaining count should now be 9
      const count = await backupCodeService.getRemainingCount(pool, testUserId);
      expect(count).toBe(9);
    });

    it('prevents reusing an already consumed backup code', async () => {
      const codes = await backupCodeService.generateCodes(pool, testUserId);
      const codeToUse = codes[0];

      // First use: success
      const firstUse = await backupCodeService.verifyAndConsume(pool, testUserId, codeToUse, '127.0.0.1');
      expect(firstUse).toBe(true);

      // Second use: fails
      const secondUse = await backupCodeService.verifyAndConsume(pool, testUserId, codeToUse, '127.0.0.1');
      expect(secondUse).toBe(false);
    });

    it('rejects completely invalid backup codes', async () => {
      const invalid = await backupCodeService.verifyAndConsume(pool, testUserId, 'INVALID-CODE', '127.0.0.1');
      expect(invalid).toBe(false);
    });

    it('re-generating backup codes invalidates all previous unused codes', async () => {
      const oldCodes = await backupCodeService.generateCodes(pool, testUserId);
      const newCodes = await backupCodeService.generateCodes(pool, testUserId);

      // Old code should fail
      const oldUsed = await backupCodeService.verifyAndConsume(pool, testUserId, oldCodes[0], '127.0.0.1');
      expect(oldUsed).toBe(false);

      // New code should succeed
      const newUsed = await backupCodeService.verifyAndConsume(pool, testUserId, newCodes[0], '127.0.0.1');
      expect(newUsed).toBe(true);
    });

  });
}
