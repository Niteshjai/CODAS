import { Worker } from 'bullmq'
import type { Queryable } from '../../db/types'
import { enqueueAgentRun } from './agentQueue'
import { CATCH_UP_JOB_NAME, SCHEDULER_QUEUE_NAME } from './agentScheduler'
import { getPool, getRedis } from '../../db/connections'
import { config } from '../../config'

/** A run still `running` after this long belongs to a dead worker. */
const STALE_RUNNING = '2 hours'

/**
 * Users the daily catch-up should refresh: they have source data the agent reads
 * (AA snapshots of an ACTIVE consent, active land records, or unclaimed findings),
 * no run in flight, and either no successful run in the last 7 days or source
 * data newer than their last finished run. No PII is selected.
 */
const CATCH_UP_SQL = `
  WITH src AS (
    SELECT u.id AS user_id,
      GREATEST(
        (SELECT MAX(s.fetched_at) FROM asset_snapshots_aa s
           JOIN consents c ON c.id = s.consent_id
          WHERE s.user_id = u.id AND c.status = 'ACTIVE'),
        (SELECT MAX(lr.updated_at) FROM land_records lr
          WHERE lr.user_id = u.id AND lr.is_active IS NOT FALSE),
        (SELECT MAX(f.created_at) FROM unclaimed_assets_found f
          WHERE f.user_id = u.id)
      ) AS newest_source_at
    FROM users u
  ), runs AS (
    SELECT r.user_id,
      MAX(r.completed_at) FILTER (WHERE r.status IN ('completed', 'partial'))           AS last_ok_at,
      MAX(r.completed_at) FILTER (WHERE r.status IN ('completed', 'partial', 'failed')) AS last_finished_at,
      BOOL_OR(r.status IN ('queued', 'running'))                                         AS in_flight
    FROM agent_runs r
    GROUP BY r.user_id
  )
  SELECT src.user_id
  FROM src
  LEFT JOIN runs ON runs.user_id = src.user_id
  WHERE src.newest_source_at IS NOT NULL
    AND COALESCE(runs.in_flight, false) = false
    AND (
      runs.last_ok_at IS NULL
      OR runs.last_ok_at < NOW() - INTERVAL '7 days'
      OR runs.last_finished_at IS NULL
      OR src.newest_source_at > runs.last_finished_at
    )
  ORDER BY src.newest_source_at DESC
  LIMIT $1
`

export async function runCatchUp(db: Queryable = getPool()): Promise<{ selected: number; enqueued: number; deduped: number }> {
  // Runs left 'running' by a crashed worker would block their users forever
  const stale = await db.query(`
    UPDATE agent_runs
       SET status = 'failed', completed_at = NOW(), current_step = NULL,
           error_message = 'Run abandoned (worker stopped mid-run)'
     WHERE status = 'running' AND COALESCE(started_at, queued_at) < NOW() - INTERVAL '${STALE_RUNNING}'
  `)
  if (stale.rowCount) console.warn(`[Scheduler] Marked ${stale.rowCount} abandoned run(s) failed`)

  const cap = config.catchUpCap()
  const res = await db.query<{ user_id: string }>(CATCH_UP_SQL, [cap])
  if (res.rows.length >= cap) {
    console.warn(`[Scheduler] Catch-up hit its cap of ${cap} users; the rest are picked up on the next tick`)
  }

  let enqueued = 0
  let deduped  = 0
  for (const { user_id } of res.rows) {
    // One bad user must not stop the rest of the batch
    try {
      const r = await enqueueAgentRun(db, {
        userId:          user_id,
        triggerType:     'cron_scheduled',
        triggerMetadata: { reason: 'catch_up' },
      })
      if (r.deduped) deduped++
      else enqueued++
    } catch (err: any) {
      console.error(`[Scheduler] Failed to enqueue run for user ${user_id}: ${err.message}`)
    }
  }

  console.log(`[Scheduler] Catch-up: ${res.rows.length} user(s) selected, ${enqueued} enqueued, ${deduped} already queued`)
  return { selected: res.rows.length, enqueued, deduped }
}

export function startSchedulerWorker(): Worker {
  const worker = new Worker(
    SCHEDULER_QUEUE_NAME,
    async (job) => {
      if (job.name === CATCH_UP_JOB_NAME) return runCatchUp()
      // Leftovers from the removed 02:00 / 6-hourly / weekly schedules
      console.warn(`[Scheduler] Ignoring obsolete job ${job.name}`)
    },
    { connection: getRedis() },
  )

  worker.on('failed', (job, err) => {
    console.error(`[Scheduler] Job ${job?.name} failed: ${err.message}`)
  })

  worker.on('error', err => {
    console.error('[Scheduler] Worker error:', err.message)
  })

  return worker
}
