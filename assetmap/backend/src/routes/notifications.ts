import { FastifyInstance, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { pool } from '../db/connection'
import { successResponse, errorResponse } from '../utils/constants'
import { notificationCenter, NotificationError, NOTIFICATION_ID_RE } from '../services/notificationCenter'

// In-app notification center. Auth only — deliberately NOT plan-gated:
// every plan sees its own alerts, to-dos and account activity in-app.
// Every route acts only on the signed-in user's own items.

function handleError(reply: FastifyReply, err: unknown) {
  if (err instanceof NotificationError) {
    return reply.status(err.statusCode).send(errorResponse(err.code, err.message))
  }
  throw err
}

const idParams = {
  type: 'object',
  required: ['id'],
  properties: { id: { type: 'string', pattern: NOTIFICATION_ID_RE.source, maxLength: 200 } },
} as const

export async function notificationsRoutes(app: FastifyInstance) {
  const authed = [verifyAccessToken]

  app.get('/', {
    preHandler: authed,
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    reply.header('Cache-Control', 'no-store')
    return reply.send(successResponse(await notificationCenter.buildFeed(pool, req.user!.id)))
  })

  app.post('/read-all', {
    preHandler: authed,
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    try {
      return reply.send(successResponse(await notificationCenter.markAllRead(pool, req.user!.id)))
    } catch (err) { return handleError(reply, err) }
  })

  app.post('/:id/read', {
    preHandler: authed,
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    schema: { params: idParams },
  }, async (req, reply) => {
    try {
      await notificationCenter.markRead(pool, req.user!.id, (req.params as { id: string }).id)
      return reply.send(successResponse({ ok: true }))
    } catch (err) { return handleError(reply, err) }
  })

  app.post('/:id/dismiss', {
    preHandler: authed,
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    schema: { params: idParams },
  }, async (req, reply) => {
    try {
      await notificationCenter.dismiss(pool, req.user!.id, (req.params as { id: string }).id)
      return reply.send(successResponse({ ok: true }))
    } catch (err) { return handleError(reply, err) }
  })

  app.post('/:id/snooze', {
    preHandler: authed,
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    schema: {
      params: idParams,
      body: {
        type: 'object',
        required: ['hours'],
        properties: { hours: { type: 'integer', minimum: 1, maximum: 720 } },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    try {
      await notificationCenter.snooze(pool, req.user!.id, (req.params as { id: string }).id, (req.body as { hours: number }).hours)
      return reply.send(successResponse({ ok: true }))
    } catch (err) { return handleError(reply, err) }
  })
}
