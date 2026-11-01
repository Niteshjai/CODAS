import { FastifyInstance } from 'fastify'
import { verifyAccessToken } from '../middleware/auth'
import { alertService } from '../services/alertService'
import { nomineeChecker } from '../services/nomineeChecker'
import { dormantAccountFinder } from '../services/dormantAccountFinder'
import { netWorthTracker } from '../services/netWorthTracker'
import { pool } from '../db/connection'
import { AlertsPreferencesSchema } from '../utils/validators'
import { planEnforcer } from '../plans/planEnforcer'
import { accountSettings, SettingsError } from '../services/accountSettings'

export async function engagementRoutes(app: FastifyInstance) {

  // ── Alerts
  app.get('/alerts', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('email_alerts', pool)],
    handler: async (request, reply) => {
      const { limit = 20, offset = 0 } = request.query as Record<string, any>
      const [alerts, unread] = await Promise.all([
        alertService.getUserAlerts(pool, request.user!.id, limit, offset),
        alertService.getUnreadCount(pool, request.user!.id)
      ])
      return { success: true, data: { alerts, unread } }
    }
  })

  app.post('/alerts/read-all', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('email_alerts', pool)],
    handler: async (request, reply) => {
      await alertService.markAllRead(pool, request.user!.id)
      return { success: true }
    }
  })

  // Same preferences as /api/settings/notifications (kept for existing clients)
  app.get('/alerts/preferences', {
    preHandler: [verifyAccessToken],
    handler: async (request) => {
      const prefs = await accountSettings.getPreferences(pool, request.user!.id)
      return { success: true, data: prefs }
    }
  })

  app.patch('/alerts/preferences', {
    schema: { body: AlertsPreferencesSchema },
    preHandler: [verifyAccessToken],
    handler: async (request, reply) => {
      try {
        const prefs = await accountSettings.updateNotifications(pool, request.user!.id, request.body as Record<string, boolean>)
        return { success: true, data: prefs }
      } catch (err) {
        if (err instanceof SettingsError) {
          return reply.status(err.statusCode).send({ success: false, error: { code: err.code, message: err.message } })
        }
        throw err
      }
    }
  })

  // ── Nominee checker
  app.get('/nominee/status', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('nominee_checker', pool)],
    handler: async (request, reply) => {
      const status = await nomineeChecker.getNomineeStatus(
        pool, request.user!.id
      )
      return { success: true, data: status }
    }
  })

  // ── Dormant accounts
  app.get('/dormant', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('dormant_finder', pool)],
    handler: async (request, reply) => {
      const data = await dormantAccountFinder.getDormantAccounts(
        pool, request.user!.id
      )
      return { success: true, data }
    }
  })

  app.post('/dormant/:accountId/acknowledge', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('dormant_finder', pool)],
    handler: async (request, reply) => {
      const { accountId } = request.params as { accountId: string }
      await dormantAccountFinder.acknowledgeAccount(
        pool, request.user!.id, accountId
      )
      return { success: true }
    }
  })

  // ── Net worth tracker
  app.get('/networth/history', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('networth_tracker', pool)],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['6m', '12m', '24m', 'all'] }
        }
      }
    },
    handler: async (request, reply) => {
      const { period = '12m' } = request.query as Record<string, any>
      const history = await netWorthTracker.getNetWorthHistory(
        pool, request.user!.id, period
      )
      return { success: true, data: history }
    }
  })

  app.get('/networth/latest', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('networth_tracker', pool)],
    handler: async (request, reply) => {
      const snapshot = await netWorthTracker.getLatestSnapshot(
        pool, request.user!.id
      )
      return { success: true, data: snapshot }
    }
  })
}
