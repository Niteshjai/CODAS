import { DelayedError, Job, UnrecoverableError, Worker } from 'bullmq'
import type pg from 'pg'
import { AgentJobData, AgentJobDataSchema } from '../schemas/canonicalAsset'
import { runOrchestrationAgent, RunOutcome } from '../orchestrator'
import { loadRunContext } from '../runContext'
import { getPool, getRedis } from '../../db/connections'
import { writeAuditLog } from '../../services/auditLogger'
import { config } from '../../config'
import { AGENT_QUEUE_NAME } from './agentQueue'

// ─────────────────────────────────────────────
// BullMQ Worker — consumes asset-orchestration jobs.
//
// Run lifecycle (agent_runs.status):
//   queued → running → completed | partial
//   running → queued            (attempt failed, attempts left; BullMQ backs off)
//   running → cancelled         (attempt failed while another run is already queued
//                                for the user: that run supersedes this one)
//   running → failed            (last attempt failed, or unrecoverable)
// One run per user at a time: a session-level advisory lock on a dedicated
// connection, which also carries all of the run's queries.
// Started explicitly from index.ts (importing this module has no side effects).
// ─────────────────────────────────────────────

const TERMINAL = new Set(['completed', 'partial', 'failed', 'cancelled'])

/** While another run holds the user's lock, re-check this often (does not use up attempts)… */
const LOCK_RETRY_DELAY_MS = 15_000
/** …for at most this long after the run was queued; then it counts as a failed attempt. */
const LOCK_WAIT_MAX_MS = 30 * 60_000

const lockKey = (userId: string) => `agent-run:${userId}`

/** Error text for agent_runs / logs: message only (never a stack), bounded. */
function safeMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  return msg.replace(/\s+/g, ' ').slice(0, 300) || 'Unknown error'
}

function partialNote(outcome: RunOutcome): string | null {
  if (outcome.status !== 'partial') return null
  const notes: string[] = []
  if (outcome.sourcesFailed.length) notes.push(`sources failed: ${outcome.sourcesFailed.join(', ')}`)
  if (!outcome.aiUsed) notes.push('AI enrichment unavailable (defaults used)')
  else if (outcome.stepsFailed.length) notes.push(`steps failed: ${outcome.stepsFailed.join(', ')}`)
  return notes.join('; ') || 'AI enrichment partially fell back to defaults'
}

async function markCompleted(db: pg.PoolClient, data: AgentJobData, outcome: RunOutcome, durationMs: number): Promise<void> {
  await db.query(`
    UPDATE agent_runs SET
      status               = $2,
      completed_at         = NOW(),
      duration_ms          = $3,
      records_created      = $4,
      records_updated      = $5,
      records_deduplicated = $6,
      anomalies_detected   = $7,
      ai_tokens_used       = $8,
      ai_calls_made        = $9,
      sources_fetched      = $10,
      steps_completed      = $11,
      steps_failed         = $12,
      error_message        = $13,
      error_stack          = NULL,
      current_step         = 'done'
    WHERE id = $1
  `, [
    data.runId, outcome.status, durationMs,
    outcome.recordsCreated, outcome.recordsUpdated, outcome.recordsDeduplicated,
    outcome.anomaliesDetected, outcome.tokensUsed, outcome.aiCalls,
    outcome.sourcesFetched, outcome.stepsCompleted, outcome.stepsFailed,
    partialNote(outcome),
  ])

  await writeAuditLog(db, {
    userId:     data.userId,
    action:     'AGENT_RUN_COMPLETED',
    entityType: 'agent_runs',
    entityId:   data.runId,
    metadata: {
      status:              outcome.status,
      triggerType:         data.triggerType,
      recordsCreated:      outcome.recordsCreated,
      recordsUpdated:      outcome.recordsUpdated,
      recordsDeduplicated: outcome.recordsDeduplicated,
      recordsDeactivated:  outcome.recordsDeactivated,
      anomaliesDetected:   outcome.anomaliesDetected,
      aiCalls:             outcome.aiCalls,
      sourcesFetched:      outcome.sourcesFetched,
      sourcesFailed:       outcome.sourcesFailed,
      durationMs,
    },
  })
}

/**
 * Attempt failed. With attempts left the run goes back to `queued` (or is
 * cancelled if another run is already queued for the user); otherwise it is
 * marked `failed` and audited. Always throws, so BullMQ records the outcome.
 */
async function handleAttemptFailure(
  pool: pg.Pool,
  data: AgentJobData,
  err: unknown,
  attempt: number,
  maxAttempts: number,
): Promise<never> {
  const message = safeMessage(err)
  const final   = err instanceof UnrecoverableError || attempt >= maxAttempts

  if (!final) {
    try {
      await pool.query(`
        UPDATE agent_runs
           SET status = 'queued', current_step = NULL, error_message = $2
         WHERE id = $1 AND status IN ('running', 'queued')
      `, [data.runId, `Attempt ${attempt} of ${maxAttempts} failed: ${message}`])
    } catch (updateErr: any) {
      if (updateErr?.code === '23505') {
        // Another run is already queued for this user and will read the same (newer) data
        await pool.query(`
          UPDATE agent_runs
             SET status = 'cancelled', completed_at = NOW(), current_step = NULL,
                 error_message = 'Superseded'
           WHERE id = $1 AND status NOT IN ('completed', 'partial', 'failed', 'cancelled')
        `, [data.runId]).catch(e => console.error(`[Worker] run ${data.runId}: could not cancel: ${e.message}`))
        console.warn(`[Worker] run ${data.runId}: superseded by a queued run; not retrying`)
        throw new UnrecoverableError('Superseded by a newer queued run')
      }
      console.error(`[Worker] run ${data.runId}: could not requeue: ${updateErr?.message}`)
    }
    console.warn(`[Worker] run ${data.runId}: attempt ${attempt}/${maxAttempts} failed, will retry: ${message}`)
    throw err
  }

  try {
    const res = await pool.query(`
      UPDATE agent_runs SET
        status        = 'failed',
        completed_at  = NOW(),
        duration_ms   = (EXTRACT(EPOCH FROM (NOW() - COALESCE(started_at, queued_at))) * 1000)::int,
        error_message = $2,
        error_stack   = NULL,
        current_step  = NULL
      WHERE id = $1 AND status NOT IN ('completed', 'partial', 'cancelled')
      RETURNING id
    `, [data.runId, message])
    if (res.rows.length) {
      await writeAuditLog(pool, {
        userId:     data.userId,
        action:     'AGENT_RUN_FAILED',
        entityType: 'agent_runs',
        entityId:   data.runId,
        metadata:   { triggerType: data.triggerType, attempts: attempt },
      })
    }
  } catch (updateErr: any) {
    console.error(`[Worker] run ${data.runId}: could not record failure: ${updateErr?.message}`)
  }
  console.error(`[Worker] run ${data.runId}: failed after ${attempt} attempt(s): ${message}`)
  throw err
}

async function processAgentJob(pool: pg.Pool, job: Job, token?: string): Promise<unknown> {
  const parsed = AgentJobDataSchema.safeParse(job.data)
  if (!parsed.success) throw new UnrecoverableError('Invalid job data')
  const data        = parsed.data
  const attempt     = job.attemptsMade + 1
  const maxAttempts = job.opts.attempts ?? 1

  const run = await pool.query<{ status: string; user_id: string; queued_at: Date }>(
    `SELECT status, user_id, queued_at FROM agent_runs WHERE id = $1`, [data.runId],
  )
  const row = run.rows[0]
  if (!row) throw new UnrecoverableError('Run not found')
  if (row.user_id !== data.userId) throw new UnrecoverableError('Run does not belong to the job user')
  if (TERMINAL.has(row.status)) {
    console.log(`[Worker] run ${data.runId} is already ${row.status}; skipping job`)
    return { skipped: true, status: row.status }
  }

  const client = await pool.connect()
  let locked = false
  let destroyClient = false
  try {
    const lock = await client.query<{ ok: boolean }>(
      `SELECT pg_try_advisory_lock(hashtext($1)) AS ok`, [lockKey(data.userId)],
    )
    locked = lock.rows[0]?.ok === true
    if (!locked) {
      const waited = Date.now() - new Date(row.queued_at).getTime()
      if (token && waited < LOCK_WAIT_MAX_MS) {
        // Another run for this user is in progress: back off without using up an attempt
        await job.moveToDelayed(Date.now() + LOCK_RETRY_DELAY_MS, token)
        throw new DelayedError()
      }
      throw new Error('Another run is in progress for this user')
    }

    // Attempt start. 'running' is allowed: a stalled attempt (worker crash) is re-processed.
    const started = await client.query(`
      UPDATE agent_runs SET
        status = 'running', started_at = NOW(), completed_at = NULL, duration_ms = NULL,
        current_step = 'initialising', error_message = NULL, error_stack = NULL,
        records_created = 0, records_updated = 0, records_deduplicated = 0,
        anomalies_detected = 0, ai_tokens_used = 0, ai_calls_made = 0,
        sources_fetched = '{}', steps_completed = '{}', steps_failed = '{}',
        trigger_metadata = COALESCE(trigger_metadata, '{}'::jsonb) || jsonb_build_object('attempt', $2::int)
      WHERE id = $1 AND status IN ('queued', 'running')
      RETURNING id
    `, [data.runId, attempt])
    if (started.rows.length === 0) {
      return { skipped: true } // cancelled or finished concurrently
    }
    // Clear this run's per-attempt rows from earlier attempts
    await client.query(`DELETE FROM agent_run_steps WHERE run_id = $1`, [data.runId])
    await client.query(`DELETE FROM asset_dedup_log WHERE run_id = $1`, [data.runId])

    console.log(`[Worker] run ${data.runId}: started (attempt ${attempt}/${maxAttempts}, trigger ${data.triggerType})`)
    const t0      = Date.now()
    const context = await loadRunContext(client, data)
    const outcome = await runOrchestrationAgent(client, context)
    const durationMs = Date.now() - t0

    // Outside the failure path: a finished pipeline is recorded as finished
    await markCompleted(client, data, outcome, durationMs)
    console.log(
      `[Worker] run ${data.runId}: ${outcome.status} in ${durationMs}ms ` +
      `(created ${outcome.recordsCreated}, updated ${outcome.recordsUpdated}, ` +
      `deactivated ${outcome.recordsDeactivated}, AI calls ${outcome.aiCalls})`,
    )
    return { status: outcome.status, created: outcome.recordsCreated, updated: outcome.recordsUpdated }
  } catch (err) {
    if (err instanceof DelayedError) throw err
    return await handleAttemptFailure(pool, data, err, attempt, maxAttempts)
  } finally {
    if (locked) {
      await client.query(`SELECT pg_advisory_unlock(hashtext($1))`, [lockKey(data.userId)])
        .catch(() => { destroyClient = true }) // dropping the connection releases the lock
    }
    client.release(destroyClient || undefined)
  }
}

export function startAgentWorker(): Worker {
  const pool = getPool()

  const worker = new Worker(
    AGENT_QUEUE_NAME,
    (job, token) => processAgentJob(pool, job, token),
    {
      connection:  getRedis(),
      concurrency: config.concurrency(),
      // Runs are short (DB reads + a few Claude calls); give slow Claude calls headroom
      // before BullMQ considers a job stalled.
      lockDuration: 5 * 60 * 1000,
    },
  )

  worker.on('failed', (job, err) => {
    if (err instanceof DelayedError) return
    console.error(`[Worker] job ${job?.id} failed (attempt ${job?.attemptsMade}): ${safeMessage(err)}`)
  })

  worker.on('error', err => {
    console.error('[Worker] Worker error:', safeMessage(err))
  })

  return worker
}
