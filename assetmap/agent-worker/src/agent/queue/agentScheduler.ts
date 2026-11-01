import { Queue } from 'bullmq'
import { getRedis } from '../../db/connections'

export const SCHEDULER_QUEUE_NAME = 'agent-scheduler'

/** Cron patterns are evaluated in this timezone (the server may run in UTC). */
const TZ = 'Asia/Kolkata'

export const CATCH_UP_SCHEDULER_ID = 'agent-catch-up'
export const CATCH_UP_JOB_NAME     = 'catch-up'
/** Daily at 03:30 IST — after the backend's 02:00 land sync and nightly jobs. */
const CATCH_UP_PATTERN = '30 3 * * *'

let schedulerQueue: Queue | undefined

export function getSchedulerQueue(): Queue {
  schedulerQueue ??= new Queue(SCHEDULER_QUEUE_NAME, { connection: getRedis() })
  return schedulerQueue
}

// ─────────────────────────────────────────────
// The agent's only scheduled work is a daily catch-up: runs are normally
// triggered by the backend when new data lands. Older versions registered
// 02:00 daily / 6-hourly stale / weekly estate repeatables; they are removed
// here on every startup, along with anything else that is not the catch-up.
// ─────────────────────────────────────────────

export async function setupSchedulers(): Promise<void> {
  const queue = getSchedulerQueue()
  let removed = 0

  // Legacy repeatables created with queue.add(name, data, { repeat })
  for (const r of await queue.getRepeatableJobs()) {
    if (r.key === CATCH_UP_SCHEDULER_ID || r.id === CATCH_UP_SCHEDULER_ID) continue
    if (await queue.removeRepeatableByKey(r.key)) removed++
  }
  // Job schedulers (the newer API; upsertJobScheduler below)
  for (const s of await queue.getJobSchedulers()) {
    const id = (s as any).id ?? s.key
    if (id === CATCH_UP_SCHEDULER_ID) continue
    if (await queue.removeJobScheduler(id)) removed++
  }
  if (removed > 0) console.log(`[Scheduler] Removed ${removed} obsolete repeatable job(s)`)

  await queue.upsertJobScheduler(
    CATCH_UP_SCHEDULER_ID,
    { pattern: CATCH_UP_PATTERN, tz: TZ },
    { name: CATCH_UP_JOB_NAME, data: {}, opts: { removeOnComplete: 50, removeOnFail: 50 } },
  )
  console.log(`[Scheduler] Daily catch-up scheduled at 03:30 ${TZ}`)
}
