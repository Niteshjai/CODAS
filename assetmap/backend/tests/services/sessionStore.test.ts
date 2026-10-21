import { describe, it, expect, afterAll } from '../testFramework';
import { sessionStore } from '../../src/services/sessionStore';
import { kvStore } from '../../src/db/connection';
import crypto from 'crypto';

export function registerSessionStoreTests() {
  describe('sessionStore (JWT & User Session Management)', () => {
    const testUserId = 'user-session-test-' + Date.now();
    const testSessionId = 'sess-' + crypto.randomBytes(8).toString('hex');
    const testRefreshTokenHash = crypto.createHash('sha256').update('dummy-refresh-token').digest('hex');

    afterAll(async () => {
      await sessionStore.revoke(testSessionId);
      await kvStore.del(`blocked:${testSessionId}`);
      await kvStore.del(`refresh:${testSessionId}`);
    });

    it('creates and retrieves a user session', async () => {
      await sessionStore.create(testUserId, testSessionId, 'consumer');

      const session = await sessionStore.get(testSessionId);
      expect(session).toBeDefined();
      expect(session?.userId).toBe(testUserId);
      expect(session?.role).toBe('consumer');
    });

    it('stores and validates refresh token hash', async () => {
      await sessionStore.storeRefreshToken(testSessionId, testRefreshTokenHash);

      const isValid = await sessionStore.validateRefreshToken(testSessionId, testRefreshTokenHash);
      expect(isValid).toBe(true);

      const isInvalid = await sessionStore.validateRefreshToken(testSessionId, 'wrong-hash');
      expect(isInvalid).toBe(false);
    });

    it('revokes session and adds session ID to blocklist', async () => {
      await sessionStore.revoke(testSessionId);

      const session = await sessionStore.get(testSessionId);
      expect(session).toBeNull();

      const isBlocked = await sessionStore.isBlocked(testSessionId);
      expect(isBlocked).toBe(true);
    });

    it('revokes all sessions for a specific user ID', async () => {
      const sess1 = 'sess-all-1-' + Date.now();
      const sess2 = 'sess-all-2-' + Date.now();

      await sessionStore.create(testUserId, sess1, 'consumer');
      await sessionStore.create(testUserId, sess2, 'consumer');

      await sessionStore.revokeAllForUser(testUserId);

      expect(await sessionStore.get(sess1)).toBeNull();
      expect(await sessionStore.get(sess2)).toBeNull();
    });

  });
}
