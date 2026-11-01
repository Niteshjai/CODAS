import { kvStore } from '../db/connection'
import { encryptPII, decryptPII } from '../utils/encryption'

const SESSION_PREFIX = 'session:'
const REFRESH_PREFIX = 'refresh:'
const BLOCKLIST_PREFIX = 'blocked:'
// Set when a refresh token is consumed: lets a second use be told apart from a race or a theft
const REFRESH_USED_PREFIX = 'refresh_used:'
// For REFRESH_RACE_WINDOW_MS after a rotation: the pair it produced (refresh token encrypted), so a
// client whose response was lost, or a parallel tab, gets that pair again instead of an error
const REFRESH_REPLAY_PREFIX = 'refresh_replay:'
// Latest live session of a login "family" (a login plus every rotation after it)
const FAMILY_PREFIX = 'session_family:'
// "Sign out everywhere": every session of this user whose login (authTime) is at or before this
// time is invalid
const REVOKED_BEFORE_PREFIX = 'sessions_revoked_before:'

const SESSION_TTL = 60 * 60 * 24 * 7      // matches the refresh token lifetime
const BLOCKLIST_TTL = 60 * 15              // longest access-token lifetime
// Two tabs (or a request and a tab) refreshing at the same moment both present the same token.
// The loser is told to retry with the winner's token instead of being treated as an attacker.
export const REFRESH_RACE_WINDOW_MS = 30_000

export interface SessionData {
  userId: string
  role: string
  twoFactorVerified?: boolean
  familyId?: string
  /** When the login family started. Kept across refreshes, so "sign out everywhere" ends them all. */
  authTime?: number
  createdAt?: number
}

export type RefreshOutcome =
  | { kind: 'ok' }
  // consumed moments ago by a parallel refresh; `next` is the pair it produced, when still known
  | { kind: 'race'; next?: { sessionId: string; refreshToken: string } }
  | { kind: 'reused'; familyId?: string }   // consumed long ago: likely a stolen token
  | { kind: 'invalid' }

interface UsedRecord { hash: string; familyId?: string; at: number }

function sessionRecord(userId: string, role: string, twoFactorVerified: boolean, familyId: string, authTime: number): string {
  const now = Date.now()
  return JSON.stringify({ userId, role, twoFactorVerified, familyId, authTime, createdAt: now, lastSeenAt: now })
}

export const sessionStore = {

  async create(
    userId: string, sessionId: string, role: string, twoFactorVerified: boolean = false,
    familyId?: string, authTime?: number,
  ): Promise<void> {
    const family = familyId ?? sessionId
    await kvStore.setex(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL,
      sessionRecord(userId, role, twoFactorVerified, family, authTime ?? Date.now()))
    await kvStore.setex(`${FAMILY_PREFIX}${family}`, SESSION_TTL, sessionId)
  },

  /** Throws if the store is unreachable — callers must not treat that as "no session". */
  async get(sessionId: string): Promise<SessionData | null> {
    const data = await kvStore.get(`${SESSION_PREFIX}${sessionId}`)
    if (!data) return null
    const parsed = JSON.parse(data) as SessionData
    const revokedBefore = await kvStore.get(`${REVOKED_BEFORE_PREFIX}${parsed.userId}`)
    // Sessions written before authTime existed fall back to their own creation time
    if (revokedBefore && (parsed.authTime ?? parsed.createdAt ?? 0) <= Number(revokedBefore)) return null
    await kvStore.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL)
    return parsed
  },

  async revoke(sessionId: string): Promise<void> {
    await kvStore.del(`${SESSION_PREFIX}${sessionId}`)
    await kvStore.del(`${REFRESH_PREFIX}${sessionId}`)
    await kvStore.setex(`${BLOCKLIST_PREFIX}${sessionId}`, BLOCKLIST_TTL, '1')
  },

  async isBlocked(sessionId: string): Promise<boolean> {
    const result = await kvStore.get(`${BLOCKLIST_PREFIX}${sessionId}`)
    return result === '1'
  },

  /** O(1): no key scan. Every existing session of the user stops validating immediately. */
  async revokeAllForUser(userId: string): Promise<void> {
    await kvStore.setex(`${REVOKED_BEFORE_PREFIX}${userId}`, SESSION_TTL, String(Date.now()))
  },

  async storeRefreshToken(sessionId: string, tokenHash: string): Promise<void> {
    await kvStore.setex(`${REFRESH_PREFIX}${sessionId}`, SESSION_TTL, tokenHash)
  },

  /** True while `tokenHash` is the live (not yet rotated) refresh token of the session. */
  async isCurrentRefreshToken(sessionId: string, tokenHash: string): Promise<boolean> {
    return (await kvStore.get(`${REFRESH_PREFIX}${sessionId}`)) === tokenHash
  },

  /**
   * Single-use refresh, as one atomic step: if `old.tokenHash` is still the live refresh token of
   * `old.sessionId`, consume it, record it as used, end the old session and create its successor
   * (same login family and authTime) with `next`'s refresh token. Either all of it happens or
   * none of it does, so a store failure midway can't strand the user between two sessions. When
   * the token was already consumed, reports whether that was a race (seconds ago) or a reuse.
   */
  async rotateRefreshToken(
    old: { sessionId: string; tokenHash: string },
    next: { sessionId: string; refreshToken: string; refreshHash: string },
    session: { userId: string; role: string; twoFactorVerified: boolean; familyId: string; authTime: number },
  ): Promise<RefreshOutcome> {
    const used: UsedRecord = { hash: old.tokenHash, familyId: session.familyId, at: Date.now() }
    const replay = JSON.stringify({ sessionId: next.sessionId, refresh: encryptPII(next.refreshToken) })
    const rotated = await kvStore.compareAndApply(`${REFRESH_PREFIX}${old.sessionId}`, old.tokenHash, [
      { op: 'del', key: `${REFRESH_PREFIX}${old.sessionId}` },
      { op: 'setex', key: `${REFRESH_USED_PREFIX}${old.sessionId}`, ttl: SESSION_TTL, value: JSON.stringify(used) },
      { op: 'setex', key: `${REFRESH_REPLAY_PREFIX}${old.sessionId}`, ttl: REFRESH_RACE_WINDOW_MS / 1000, value: replay },
      { op: 'del', key: `${SESSION_PREFIX}${old.sessionId}` },
      { op: 'setex', key: `${BLOCKLIST_PREFIX}${old.sessionId}`, ttl: BLOCKLIST_TTL, value: '1' },
      {
        op: 'setex', key: `${SESSION_PREFIX}${next.sessionId}`, ttl: SESSION_TTL,
        value: sessionRecord(session.userId, session.role, session.twoFactorVerified, session.familyId, session.authTime),
      },
      { op: 'setex', key: `${REFRESH_PREFIX}${next.sessionId}`, ttl: SESSION_TTL, value: next.refreshHash },
      { op: 'setex', key: `${FAMILY_PREFIX}${session.familyId}`, ttl: SESSION_TTL, value: next.sessionId },
    ])
    if (rotated) return { kind: 'ok' }
    return this.inspectSpentRefreshToken(old.sessionId, old.tokenHash)
  },

  /**
   * Classifies a refresh token that can't be consumed. The "used" marker is written in the same
   * atomic step as the consume, so a concurrent loser always sees it.
   */
  async inspectSpentRefreshToken(sessionId: string, tokenHash: string): Promise<Exclude<RefreshOutcome, { kind: 'ok' }>> {
    const used = await kvStore.get(`${REFRESH_USED_PREFIX}${sessionId}`)
    if (!used) return { kind: 'invalid' }
    const record = JSON.parse(used) as UsedRecord
    if (record.hash !== tokenHash) return { kind: 'invalid' }
    if (Date.now() - record.at >= REFRESH_RACE_WINDOW_MS) return { kind: 'reused', familyId: record.familyId }

    const replay = await kvStore.get(`${REFRESH_REPLAY_PREFIX}${sessionId}`)
    if (!replay) return { kind: 'race' }
    try {
      const parsed = JSON.parse(replay) as { sessionId: string; refresh: string }
      return { kind: 'race', next: { sessionId: parsed.sessionId, refreshToken: decryptPII(parsed.refresh) } }
    } catch {
      return { kind: 'race' }
    }
  },

  /** Ends the current session of a login family (used when a stolen refresh token is replayed). */
  async revokeFamily(familyId: string): Promise<void> {
    const current = await kvStore.get(`${FAMILY_PREFIX}${familyId}`)
    if (current) await this.revoke(current)
    await kvStore.del(`${FAMILY_PREFIX}${familyId}`)
  },
}
