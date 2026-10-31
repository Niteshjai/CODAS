import { FastifyInstance }         from 'fastify'
import { verifyAccessToken,
         requireRole }              from '../middleware/auth'
import { planEnforcer }            from '../plans/planEnforcer'
import { razorpaySubscriptionService } from '../billing/razorpaySubscription'
import { PLANS }                   from '../plans/planConfig'
import crypto                      from 'crypto'
import { pool, kvStore }           from '../db/connection'
import { errorResponse, ERROR_CODES } from '../utils/constants'

function safeEqualHex(expected: string, received: string): boolean {
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(received || '', 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(new Uint8Array(a), new Uint8Array(b))
}

export async function plansRoutes(app: FastifyInstance) {

  // Keep the raw JSON body (scoped to this plugin) so webhook HMACs are computed over the exact bytes sent
  const defaultJsonParser = app.getDefaultJsonParser('error', 'ignore')
  app.removeContentTypeParser('application/json')
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    (req as any).rawBody = body
    defaultJsonParser(req, body as string, done)
  })

  // ── GET all plans (public — pricing page)
  app.get('/api/plans', {
    handler: async (req, reply) => {
      const result = await pool.query(`
        SELECT p.*,
          json_agg(
            json_build_object(
              'feature_key', pf.feature_key,
              'is_enabled', pf.is_enabled
            )
          ) AS features
        FROM plans p
        LEFT JOIN plan_features pf ON pf.plan_id = p.id
        WHERE p.is_active = true
        GROUP BY p.id
        ORDER BY p.display_order
      `)

      return { success: true, data: result.rows }
    }
  })

  // ── GET user's current plan status
  app.get('/api/plans/status', {
    preHandler: [verifyAccessToken],
    handler: async (req, reply) => {
      const status = await planEnforcer.getUserPlanStatus(
        pool, req.user!.id
      )
      return { success: true, data: status }
    }
  })

  // ── POST validate promo code
  app.post('/api/plans/validate-promo', {
    preHandler: [verifyAccessToken],
    schema: {
      body: {
        type: 'object',
        required: ['code', 'planId'],
        properties: {
          code:   { type: 'string', minLength: 3, maxLength: 50 },
          planId: { type: 'string', enum: ['plus', 'pro'] }
        }
      }
    },
    handler: async (req, reply) => {
      const { code, planId } = req.body as any
      const result = await razorpaySubscriptionService.validatePromoCode(
        pool, code, planId
      )
      return { success: true, data: result }
    }
  })

  // ── POST subscribe to a plan
  app.post('/api/plans/subscribe', {
    preHandler: [verifyAccessToken],
    config: { rateLimit: { max: 50, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: 'object',
        required: ['planId', 'billingCycle'],
        properties: {
          planId:       { type: 'string', enum: ['plus', 'pro'] },
          billingCycle: { type: 'string', enum: ['monthly', 'yearly'] },
          promoCode:    { type: 'string' }
        },
        additionalProperties: false
      }
    },
    handler: async (req, reply) => {
      const { planId, billingCycle, promoCode } = req.body as any

      // Check for existing active subscription
      const existing = await pool.query(
        `SELECT id, plan_id FROM user_subscriptions
         WHERE user_id = $1 AND status = 'active'`,
        [req.user!.id]
      )

      if (existing.rows[0]) {
        return reply.status(409).send({
          success: false,
          error: {
            code:    'ALREADY_SUBSCRIBED',
            message: `Already on ${existing.rows[0].plan_id} plan. Use upgrade endpoint.`
          }
        })
      }

      const result = await razorpaySubscriptionService.createSubscription(
        pool, req.user!.id, planId, billingCycle, promoCode
      )

      return reply.status(201).send({ success: true, data: result })
    }
  })

  // ── POST upgrade plan
  app.post('/api/plans/upgrade', {
    preHandler: [verifyAccessToken],
    schema: {
      body: {
        type: 'object',
        required: ['newPlanId'],
        properties: {
          newPlanId:    { type: 'string', enum: ['plus', 'pro'] },
          billingCycle: { type: 'string', enum: ['monthly', 'yearly'] }
        }
      }
    },
    handler: async (req, reply) => {
      const { newPlanId, billingCycle } = req.body as any

      // Create new pending subscription without prematurely cancelling the active one
      const result = await razorpaySubscriptionService.createSubscription(
        pool, req.user!.id, newPlanId,
        billingCycle ?? 'monthly'
      )

      return { success: true, data: result }
    }
  })

  // ── POST confirm subscription after client checkout
  app.post('/api/plans/confirm-subscription', {
    preHandler: [verifyAccessToken],
    schema: {
      body: {
        type: 'object',
        required: ['razorpayPaymentId', 'razorpaySubscriptionId', 'razorpaySignature'],
        properties: {
          razorpayPaymentId:      { type: 'string' },
          razorpaySubscriptionId: { type: 'string' },
          razorpaySignature:      { type: 'string' },
        }
      }
    },
    handler: async (req, reply) => {
      const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = req.body as any
      const userId = req.user!.id

      // Razorpay checkout signature: HMAC_SHA256(payment_id|subscription_id, key_secret).
      // Without this check any client could activate a paid plan without paying.
      const keySecret = process.env.RAZORPAY_KEY_SECRET
      if (!keySecret) {
        return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Payments are not configured'))
      }
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
        .digest('hex')
      if (!safeEqualHex(expectedSignature, razorpaySignature)) {
        return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid payment signature'))
      }

      // Find the pending subscription
      const subRes = await pool.query(
        `SELECT * FROM user_subscriptions 
         WHERE user_id = $1 AND razorpay_subscription_id = $2 AND status = 'pending'`,
        [userId, razorpaySubscriptionId]
      )

      if (!subRes.rows[0]) {
        return reply.status(404).send({ success: false, error: { message: 'Subscription record not found' } })
      }

      const sub = subRes.rows[0]

      // Cancel any older active subscriptions for this user
      await pool.query(
        `UPDATE user_subscriptions 
         SET status = 'cancelled', updated_at = NOW() 
         WHERE user_id = $1 AND id != $2 AND status = 'active'`,
        [userId, sub.id]
      )

      const interval = sub.billing_cycle === 'yearly' ? '1 year' : '1 month'

      // Activate new subscription
      await pool.query(
        `UPDATE user_subscriptions 
         SET status = 'active', 
             current_period_start = NOW(), 
             current_period_end = NOW() + INTERVAL '${interval}',
             updated_at = NOW()
         WHERE id = $1`,
        [sub.id]
      )

      // Update user tier
      await pool.query(
        `UPDATE users SET subscription_tier = 'premium' WHERE id = $1`,
        [userId]
      )

      // Record payment if payment ID exists
      if (razorpayPaymentId) {
        await pool.query(
          `INSERT INTO subscription_payments (
            subscription_id, user_id, razorpay_payment_id, amount_paise,
            gst_paise, total_paise, status, payment_method, paid_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'paid', 'razorpay', NOW())
          ON CONFLICT DO NOTHING`,
          [
            sub.id, userId, razorpayPaymentId,
            Math.round(sub.price_paise / 1.18),
            Math.round(sub.price_paise - sub.price_paise / 1.18),
            sub.price_paise
          ]
        )
      }

      return { success: true, data: { status: 'active', planId: sub.plan_id } }
    }
  })

  // ── POST cancel subscription
  app.post('/api/plans/cancel', {
    preHandler: [verifyAccessToken],
    schema: {
      body: {
        type: 'object',
        properties: {
          immediately: { type: 'boolean', default: false }
        }
      }
    },
    handler: async (req, reply) => {
      const { immediately } = req.body as any ?? {}
      await razorpaySubscriptionService.cancelSubscription(
        pool, req.user!.id, immediately ?? false
      )
      return {
        success: true,
        data: {
          message: immediately
            ? 'Subscription cancelled immediately. Downgraded to Free.'
            : 'Subscription will cancel at end of billing period.'
        }
      }
    }
  })

  // ── GET billing history
  app.get('/api/plans/billing-history', {
    preHandler: [verifyAccessToken],
    handler: async (req, reply) => {
      const result = await pool.query(`
        SELECT
          sp.id, sp.amount_paise, sp.gst_paise,
          sp.total_paise, sp.status,
          sp.payment_method, sp.paid_at,
          sp.invoice_s3_key,
          us.plan_id, us.billing_cycle
        FROM subscription_payments sp
        JOIN user_subscriptions us ON us.id = sp.subscription_id
        WHERE sp.user_id = $1
        ORDER BY sp.paid_at DESC
        LIMIT 24
      `, [req.user!.id])
      return { success: true, data: result.rows }
    }
  })

  // ── GET feature gate check (frontend calls this before rendering)
  app.get('/api/plans/can-access/:feature', {
    preHandler: [verifyAccessToken],
    handler: async (req, reply) => {
      const { feature } = req.params as { feature: string }
      const check = await planEnforcer.canAccess(
        pool, req.user!.id, feature as any
      )
      return { success: true, data: check }
    }
  })

  // ── POST Razorpay webhook
  app.post('/api/plans/webhook/razorpay', {
    handler: async (req, reply) => {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
      if (!webhookSecret) {
        // Fail closed: never process unauthenticated billing events
        return reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'Webhook not configured'))
      }

      const signature = req.headers['x-razorpay-signature'] as string
      const rawBody   = (req as any).rawBody as string | undefined
      if (!rawBody) {
        return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Missing body'))
      }
      const expected  = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex')

      if (!safeEqualHex(expected, signature)) {
        return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Invalid signature'))
      }

      // Idempotency: Razorpay retries deliveries; process each event id once
      const eventId = req.headers['x-razorpay-event-id'] as string | undefined
      if (eventId) {
        const seenKey = `razorpay_event:${eventId}`
        if (await kvStore.get(seenKey)) {
          return { success: true, data: { duplicate: true } }
        }
        await kvStore.setex(seenKey, 60 * 60 * 24 * 7, '1')
      }

      const event   = (req.body as any).event
      const payload = (req.body as any).payload

      await razorpaySubscriptionService.handleWebhook(
        pool, event, payload
      )

      return { success: true }
    }
  })

  // ── ADMIN: Setup Razorpay plans (run once on deploy)
  app.post('/api/admin/billing/setup-razorpay-plans', {
    preHandler: [verifyAccessToken, requireRole('admin')],
    handler: async (req, reply) => {
      await razorpaySubscriptionService.setupRazorpayPlans(pool)
      return { success: true, data: { message: 'Razorpay plans created' } }
    }
  })

}
