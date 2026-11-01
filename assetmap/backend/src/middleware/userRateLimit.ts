import { FastifyReply, FastifyRequest } from 'fastify'
import { kvStore } from '../db/connection'
import { errorResponse, ERROR_CODES } from '../utils/constants'

/**
 * Count one use of a per-user fixed-window quota. Returns false once the user is over `max`
 * for the current window, true otherwise. Fails open: if the store is unreachable the call
 * is allowed, since a limiter outage shouldn't take features down with it.
 * Shares buckets with userRateLimit(scope, ...) when called with the same scope and window.
 */
export async function consumeUserQuota(scope: string, userId: string, max: number, windowSec: number): Promise<boolean> {
  const bucket = Math.floor(Date.now() / 1000 / windowSec)
  const key = `url:${scope}:${userId}:${bucket}`
  try {
    const count = await kvStore.incr(key)
    if (count === 1) await kvStore.expire(key, windowSec)
    return count <= max
  } catch {
    return true
  }
}

/**
 * Per-user fixed-window limit, for expensive endpoints (Claude calls, paid lookups).
 * @fastify/rate-limit runs before authentication and can only key by IP; this runs as a
 * preHandler after verifyAccessToken, so one account can't burn the AI budget from many IPs.
 */
export function userRateLimit(scope: string, max: number, windowSec: number) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userId = request.user?.id
    if (!userId) return
    if (await consumeUserQuota(scope, userId, max, windowSec)) return
    const bucket = Math.floor(Date.now() / 1000 / windowSec)
    const retryAfter = (bucket + 1) * windowSec - Math.floor(Date.now() / 1000)
    reply.header('Retry-After', String(Math.max(1, retryAfter)))
    return reply.status(429).send(errorResponse(ERROR_CODES.RATE_LIMITED, 'You have made too many requests. Please try again later.'))
  }
}
