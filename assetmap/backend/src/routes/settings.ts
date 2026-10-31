import { FastifyInstance, FastifyReply } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { pool } from '../db/connection'
import { accountSettings, SettingsError } from '../services/accountSettings'
import { sessionStore } from '../services/sessionStore'
import { auditLogger } from '../services/auditLogger'
import { successResponse, errorResponse } from '../utils/constants'

// Account Settings API — every route acts only on the signed-in user's own account

function handleError(reply: FastifyReply, err: unknown) {
  if (err instanceof SettingsError) {
    return reply.status(err.statusCode).send(errorResponse(err.code, err.message))
  }
  throw err
}

export async function settingsRoutes(app: FastifyInstance) {
  const authed = [verifyAccessToken]

  app.get('/', { preHandler: authed }, async (req, reply) => {
    try {
      return reply.send(successResponse(await accountSettings.getSettings(pool, req.user!.id)))
    } catch (err) { return handleError(reply, err) }
  })

  app.patch('/notifications', {
    preHandler: authed,
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          email:       { type: 'boolean' },
          sms:         { type: 'boolean' },
          push:        { type: 'boolean' },
          marketing:   { type: 'boolean' },
          balanceDrop: { type: 'boolean' },
          newAccount:  { type: 'boolean' },
          landChange:  { type: 'boolean' },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    try {
      const body = req.body as Record<string, boolean>
      const prefs = await accountSettings.updateNotifications(pool, req.user!.id, body)
      await auditLogger.log(req.user!.id, 'UPDATE_RECORD', 'alert_preferences', undefined,
        req.ip, req.headers['user-agent'], { changed: body })
      return reply.send(successResponse(prefs))
    } catch (err) { return handleError(reply, err) }
  })

  // ── Add / change account email (verified by a code sent to the new address)
  app.post('/email/start', {
    preHandler: authed,
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: {
      body: {
        type: 'object', required: ['email'],
        properties: { email: { type: 'string', minLength: 5, maxLength: 254 } },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    try {
      const { email } = req.body as { email: string }
      return reply.send(successResponse(await accountSettings.startEmailChange(pool, req.user!.id, email)))
    } catch (err) { return handleError(reply, err) }
  })

  app.post('/email/confirm', {
    preHandler: authed,
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    schema: {
      body: {
        type: 'object', required: ['otp'],
        properties: { otp: { type: 'string', pattern: '^[0-9]{6}$' } },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    try {
      const { otp } = req.body as { otp: string }
      const result = await accountSettings.confirmEmailChange(pool, req.user!.id, otp)
      await auditLogger.log(req.user!.id, 'UPDATE_RECORD', 'users', req.user!.id,
        req.ip, req.headers['user-agent'], { field: 'email' })
      return reply.send(successResponse(result))
    } catch (err) { return handleError(reply, err) }
  })

  // ── Sign out of every device (all sessions, including this one)
  app.post('/sessions/revoke-all', {
    preHandler: authed,
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const userId = req.user!.id
    await sessionStore.revokeAllForUser(userId)
    await auditLogger.log(userId, 'LOGOUT', 'auth', undefined, req.ip, req.headers['user-agent'], { scope: 'all_devices' })
    return reply
      .clearCookie('access_token')
      .clearCookie('refresh_token', { path: '/api/auth/refresh' })
      .send(successResponse({ message: 'Signed out of all devices' }))
  })

  // ── Download my data (DPDP right of access)
  app.get('/export', {
    preHandler: authed,
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (req, reply) => {
    const data = await accountSettings.exportData(pool, req.user!.id)
    await auditLogger.log(req.user!.id, 'REPORT_DOWNLOADED', 'users', req.user!.id,
      req.ip, req.headers['user-agent'], { type: 'personal_data_export' })
    const day = new Date().toISOString().slice(0, 10)
    return reply
      .header('Content-Type', 'application/json; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="assetmap-my-data-${day}.json"`)
      .header('Cache-Control', 'no-store')
      .send(JSON.stringify(data, null, 2))
  })
}
