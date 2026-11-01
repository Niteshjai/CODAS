import { createHash } from 'crypto'
import { randomUUID } from 'crypto';
import { sessionStore, type RefreshOutcome, type SessionData } from './sessionStore'
import { JWT_CONFIG } from '../config/jwt'

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

function signAccessToken(fastify: any, userId: string, role: string, sessionId: string, twoFactorVerified: boolean): string {
  return fastify.jwt.sign(
    { sub: userId, role, sessionId, type: 'access', twoFactorVerified },
    { expiresIn: JWT_CONFIG.access.expiresIn }
  )
}

function signRefreshToken(fastify: any, userId: string, sessionId: string): string {
  return fastify.jwt.sign(
    { sub: userId, sessionId, type: 'refresh' },
    { expiresIn: JWT_CONFIG.refresh.expiresIn }
  )
}

// Set cookies (fallback) and headers (for cross-domain)
function sendTokens(reply: any, accessToken: string, refreshToken: string): void {
  reply
    .setCookie('access_token', accessToken, { ...JWT_CONFIG.cookie, maxAge: 60 * 15 })
    .setCookie('refresh_token', refreshToken, { ...JWT_CONFIG.cookie, maxAge: 60 * 60 * 24 * 7, path: '/api/auth/refresh' })
    .header('x-access-token', accessToken)
    .header('x-refresh-token', refreshToken);
}

/** Starts a new login family (sign-in). */
export async function issueTokenPair(
  fastify: any,
  userId: string,
  role: string,
  reply: any,
  twoFactorVerified: boolean = false
): Promise<void> {
  const sessionId = randomUUID()
  const accessToken = signAccessToken(fastify, userId, role, sessionId, twoFactorVerified)
  const refreshToken = signRefreshToken(fastify, userId, sessionId)

  // Store session + refresh token hash in Redis
  await sessionStore.create(userId, sessionId, role, twoFactorVerified)
  await sessionStore.storeRefreshToken(sessionId, hashToken(refreshToken))

  sendTokens(reply, accessToken, refreshToken)
}

/**
 * Refresh: exchanges the presented refresh token for a new pair in the same login family. The
 * JWTs are signed first and the store change is one atomic step, so any failure leaves the old
 * token and session exactly as they were. Tokens are sent only when the outcome is 'ok'.
 */
export async function rotateTokenPair(
  fastify: any,
  reply: any,
  old: { sessionId: string; tokenHash: string },
  session: SessionData,
): Promise<RefreshOutcome> {
  const sessionId = randomUUID()
  const twoFactorVerified = !!session.twoFactorVerified
  const accessToken = signAccessToken(fastify, session.userId, session.role, sessionId, twoFactorVerified)
  const refreshToken = signRefreshToken(fastify, session.userId, sessionId)

  const outcome = await sessionStore.rotateRefreshToken(
    old,
    { sessionId, refreshToken, refreshHash: hashToken(refreshToken) },
    {
      userId: session.userId,
      role: session.role,
      twoFactorVerified,
      familyId: session.familyId ?? old.sessionId,
      authTime: session.authTime ?? session.createdAt ?? Date.now(),
    },
  )
  if (outcome.kind === 'ok') sendTokens(reply, accessToken, refreshToken)
  return outcome
}

/**
 * Re-sends the pair a rotation moments ago produced (its response was lost, or a parallel tab
 * lost the race), with a fresh access token. False when that pair is no longer usable: its
 * session ended, or its refresh token was itself rotated already.
 */
export async function resendRotatedPair(
  fastify: any,
  reply: any,
  next: { sessionId: string; refreshToken: string },
): Promise<boolean> {
  const session = await sessionStore.get(next.sessionId)
  if (!session) return false
  if (!(await sessionStore.isCurrentRefreshToken(next.sessionId, hashToken(next.refreshToken)))) return false
  const accessToken = signAccessToken(fastify, session.userId, session.role, next.sessionId, !!session.twoFactorVerified)
  sendTokens(reply, accessToken, next.refreshToken)
  return true
}
