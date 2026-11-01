import { FastifyRequest, FastifyReply } from 'fastify'
import { sessionStore } from '../services/sessionStore'

export async function verifyAccessToken(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // In MOCK_MODE, bypass JWT and set a mock user
  if (process.env.MOCK_MODE === 'true' && process.env.NODE_ENV !== 'production') {
    request.user = { id: '00000000-0000-4000-a000-000000000001', role: 'user', sessionId: 'mock-session', twoFactorVerified: true }
    return
  }

  let payload: { sub: string; role: string; sessionId: string; type: string; twoFactorVerified?: boolean };
  try {
    // Try Authorization header first (LocalStorage flow), then fall back to cookies
    const authHeader = request.headers['authorization'];
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : request.cookies['access_token'];

    if (!token) {
      return reply.status(401).send({ success: false, error: { code: 'NO_TOKEN', message: 'Authentication required' } })
    }

    if (authHeader?.startsWith('Bearer ')) {
      // Verify from raw token (Authorization header)
      payload = request.server.jwt.verify<typeof payload>(token);
    } else {
      // Verify from cookie
      payload = await request.jwtVerify<typeof payload>({
        onlyCookie: true,
      });
    }

    if (payload.type !== 'access') {
      return reply.status(401).send({ success: false, error: { code: 'WRONG_TOKEN_TYPE', message: 'Invalid token type' } })
    }

  } catch (err) {
    return reply.status(401).send({ success: false, error: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } })
  }

  // The token itself is valid. If the session store can't be reached (e.g. a Redis blip), answer
  // 503 so clients keep the user signed in and retry, instead of 401, which reads as "logged out".
  let session, blocked
  try {
    ;[session, blocked] = await Promise.all([
      sessionStore.get(payload.sessionId),
      sessionStore.isBlocked(payload.sessionId)
    ])
  } catch (err) {
    request.log.error({ err: (err as Error).message }, 'Session store unavailable')
    reply.header('Retry-After', '5')
    return reply.status(503).send({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable. Please try again.' } })
  }

  if (!session || blocked) {
    return reply.status(401).send({ success: false, error: { code: 'SESSION_INVALID', message: 'Session expired or revoked' } })
  }

  request.user = { id: payload.sub, role: payload.role, sessionId: payload.sessionId, twoFactorVerified: !!payload.twoFactorVerified }
}

export function requireRole(...allowedRoles: string[]) {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHENTICATED' } })
    }
    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
    }
  }
}

export function requireOwnership(paramName: string = 'userId') {
  return async function(request: FastifyRequest, reply: FastifyReply) {
    const paramUserId = (request.params as Record<string, any>)[paramName]
    if (request.user?.role === 'admin') return // admins bypass
    if (request.user?.id !== paramUserId) {
      return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied to this resource' } })
    }
  }
}

