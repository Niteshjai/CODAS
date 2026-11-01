import { Queue } from 'bullmq'
import { getRedis } from '../../db/connections'

export const SCHEDULER_QUEUE_NAME = 'agent-scheduler'

/** Cron patterns are evaluated in this timezone (the server may run in UTC). */
const TZ = 'Asia/Kolkata'

let schedulerQueue: Queue | undefined

export function getSchedulerQueue(): Queue {
  schedulerQueue ??= new Queue(SCHEDULER_QUEUE_NAME, { connection: getRedis() })
  return schedulerQueue
}

// ─────────────────────────────────────────────
// Agent Scheduler Definitions
// Repeatable jobs are keyed by name + pattern + tz, so calling this on
// every startup does not create duplicates.
// ─────────────────────────────────────────────

export async function setupSchedulers() {
  const queue = getSchedulerQueue()

  // 1. Daily Full Refresh — 02:00 IST
  await queue.add('daily-full-refresh', {}, { repeat: { pattern: '0 2 * * *', tz: TZ } })

  // 2. Stale Asset Sync — every 6 hours
  await queue.add('stale-asset-sync', {}, { repeat: { pattern: '0 */6 * * *', tz: TZ } })

  // 3. Weekly Estate Check — Sunday 03:00 IST
  await queue.add('weekly-estate-check', {}, { repeat: { pattern: '0 3 * * 0', tz: TZ } })

  console.log('[Scheduler] Schedulers setup successfully')
}
