import { Queue } from 'bullmq'
import { Pool } from 'pg'
import { redis } from '../../db/redis.js'

export const webhookQueue = new Queue('b2b-webhooks', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'custom',
    }
  }
})

export async function fireWebhooks(
  pool: Pool,
  clientId: string,
  userId: string | null,
  eventType: string,
  payload: any
) {
  const result = await pool.query(
    'SELECT webhook_url FROM b2b_clients WHERE id=$1 AND is_active=true',
    [clientId]
  )
  const webhookUrl = result.rows[0]?.webhook_url
  if (!webhookUrl) return

  // Record pending delivery in DB
  const delivery = await pool.query(`
    INSERT INTO b2b_webhook_deliveries (
      client_id, user_id, event_type, payload, webhook_url, status
    ) VALUES ($1, $2, $3, $4::jsonb, $5, 'pending')
    RETURNING id
  `, [clientId, userId, eventType, JSON.stringify(payload), webhookUrl])

  await webhookQueue.add(
    'deliver-webhook',
    {
      deliveryId: delivery.rows[0].id,
      clientId,
      webhookUrl,
      payload,
      eventType
    }
  )
}
