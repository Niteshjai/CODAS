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

    // Rotation helpers: the session/refresh state a login leaves behind, then a refresh of it
    const login = async (sid: string, hash: string) => {
      await sessionStore.create(testUserId, sid, 'consumer');
      await sessionStore.storeRefreshToken(sid, hash);
      return (await sessionStore.get(sid))!;
    };
    const rotate = (oldSid: string, oldHash: string, newSid: string, session: { familyId?: string; authTime?: number }) =>
      sessionStore.rotateRefreshToken(
        { sessionId: oldSid, tokenHash: oldHash },
        { sessionId: newSid, refreshToken: `jwt-for-${newSid}`, refreshHash: `hash-for-${newSid}` },
        { userId: testUserId, role: 'consumer', twoFactorVerified: false, familyId: session.familyId ?? oldSid, authTime: session.authTime ?? 0 },
      );
    const cleanup = async (...sids: string[]) => {
      for (const sid of sids) {
        for (const prefix of ['session:', 'refresh:', 'refresh_used:', 'refresh_replay:', 'blocked:', 'session_family:']) {
          await kvStore.del(prefix + sid);
        }
      }
    };

    const rotationSuite = async (tag: string) => {
      const s1 = `sess-rot-${tag}-1-` + Date.now();
      const s2 = `sess-rot-${tag}-2-` + Date.now();
      const s3 = `sess-rot-${tag}-3-` + Date.now();
      try {
        const session = await login(s1, 'h1');

        // Wrong token: nothing changes, the old session keeps working
        expect((await rotate(s1, 'wrong-hash', s2, session)).kind).toBe('invalid');
        expect(await kvStore.get(`session:${s2}`)).toBeNull();
        expect((await sessionStore.get(s1))?.userId).toBe(testUserId);
        expect(await kvStore.get(`refresh:${s1}`)).toBe('h1');

        // Right token: old session ended and its successor created in one step
        expect((await rotate(s1, 'h1', s2, session)).kind).toBe('ok');
        expect(await kvStore.get(`refresh:${s1}`)).toBeNull();
        expect(await kvStore.get(`session:${s1}`)).toBeNull();
        expect(await sessionStore.isBlocked(s1)).toBe(true);
        expect(JSON.parse((await kvStore.get(`refresh_used:${s1}`))!).hash).toBe('h1');
        const next = await sessionStore.get(s2);
        expect(next?.familyId).toBe(s1);
        expect(next?.authTime).toBe(session.authTime);
        expect(await kvStore.get(`refresh:${s2}`)).toBe(`hash-for-${s2}`);
        expect(await kvStore.get(`session_family:${s1}`)).toBe(s2);

        // A parallel refresh (another tab) presenting the same token moments later is a race, not
        // theft, and is handed the pair the winner produced
        const race = await rotate(s1, 'h1', s3, session);
        expect(race.kind).toBe('race');
        expect(race.kind === 'race' ? race.next?.sessionId : undefined).toBe(s2);
        expect(race.kind === 'race' ? race.next?.refreshToken : undefined).toBe(`jwt-for-${s2}`);
        expect(await kvStore.get(`session:${s3}`)).toBeNull();
        // Same answer when the loser finds the old session already gone
        expect((await sessionStore.inspectSpentRefreshToken(s1, 'h1')).kind).toBe('race');
        expect(await sessionStore.isCurrentRefreshToken(s2, `hash-for-${s2}`)).toBe(true);
      } finally {
        await cleanup(s1, s2, s3);
      }
    };

    it('rotates a refresh token exactly once, atomically (Redis)', async () => {
      await rotationSuite('redis');
    });

    it('rotates a refresh token exactly once, atomically (in-memory store)', async () => {
      const previous = process.env.MOCK_MODE;
      process.env.MOCK_MODE = 'true';
      try {
        await rotationSuite('memory');
      } finally {
        if (previous === undefined) delete process.env.MOCK_MODE;
        else process.env.MOCK_MODE = previous;
      }
    });

    it('treats a replay outside the race window as reuse and can end the login family', async () => {
      const oldSid = 'sess-reuse-old-' + Date.now();
      const newSid = 'sess-reuse-new-' + Date.now();
      try {
        const session = await login(oldSid, 'h1');
        expect((await rotate(oldSid, 'h1', newSid, session)).kind).toBe('ok');

        // Age the "used" record past the race window
        const rec = JSON.parse((await kvStore.get(`refresh_used:${oldSid}`))!);
        rec.at -= 60_000;
        await kvStore.setex(`refresh_used:${oldSid}`, 60, JSON.stringify(rec));

        const outcome = await sessionStore.inspectSpentRefreshToken(oldSid, 'h1');
        expect(outcome.kind).toBe('reused');
        await sessionStore.revokeFamily(outcome.kind === 'reused' ? outcome.familyId! : '');
        expect(await sessionStore.get(newSid)).toBeNull();
        expect(await sessionStore.isBlocked(newSid)).toBe(true);
      } finally {
        await cleanup(oldSid, newSid);
      }
    });

    it('"sign out everywhere" also ends a session rotated after it', async () => {
      const userId = 'user-revoke-rotate-' + Date.now();
      const s1 = 'sess-rr-1-' + Date.now();
      const s2 = 'sess-rr-2-' + Date.now();
      try {
        await sessionStore.create(userId, s1, 'consumer');
        await sessionStore.storeRefreshToken(s1, 'h1');
        const session = (await sessionStore.get(s1))!;   // refresh read the session...
        await new Promise(r => setTimeout(r, 5));
        await sessionStore.revokeAllForUser(userId);      // ...then sign-out-everywhere landed...
        await new Promise(r => setTimeout(r, 5));
        const outcome = await sessionStore.rotateRefreshToken(  // ...before the rotation ran
          { sessionId: s1, tokenHash: 'h1' },
          { sessionId: s2, refreshToken: 'jwt-2', refreshHash: 'h2' },
          { userId, role: 'consumer', twoFactorVerified: false, familyId: session.familyId!, authTime: session.authTime! },
        );
        expect(outcome.kind).toBe('ok');
        expect(await sessionStore.get(s2)).toBeNull();
      } finally {
        await cleanup(s1, s2);
        await kvStore.del(`sessions_revoked_before:${userId}`);
      }
    });

    it('drops the refresh token when a session is revoked', async () => {
      const sid = 'sess-drop-' + Date.now();
      await sessionStore.create(testUserId, sid, 'consumer');
      await sessionStore.storeRefreshToken(sid, 'h2');
      await sessionStore.revoke(sid);
      expect(await kvStore.get(`refresh:${sid}`)).toBeNull();
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

      // A login after "sign out everywhere" is unaffected
      await new Promise(r => setTimeout(r, 5));
      const sess3 = 'sess-all-3-' + Date.now();
      await sessionStore.create(testUserId, sess3, 'consumer');
      expect((await sessionStore.get(sess3))?.userId).toBe(testUserId);
      await kvStore.del(`sessions_revoked_before:${testUserId}`);
    });

  });
}
