import { Queue, type JobsOptions } from 'bullmq'
import type { Queryable } from '../../db/types'
import { getRedis } from '../../db/connections'
import type { AgentJobData, TriggerType } from '../schemas/canonicalAsset'

// ─────────────────────────────────────────────
// Producer side of the asset-orchestration queue.
//
// Version-independent handoff shared with the backend (src/agent/agentRuns.ts):
//  - queue `asset-orchestration`, job name `run`, jobId = runId = agent_runs.id
//  - job data { runId, userId, triggerType } only — no PII in Redis
//  - at most one `queued` run per user (unique partial index from migration 034):
//    a burst of triggers collapses into the queued run, which reads the latest
//    stored data when it starts
// ─────────────────────────────────────────────

export const AGENT_QUEUE_NAME = 'asset-orchestration'
export const AGENT_JOB_NAME   = 'run'

/** Must match the backend producer's options exactly. */
export const AGENT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: { age: 7 * 24 * 3600 },
} as const satisfies JobsOptions

let agentQueue: Queue | undefined

export function getAgentQueue(): Queue {
  agentQueue ??= new Queue(AGENT_QUEUE_NAME, { connection: getRedis() })
  return agentQueue
}

export interface EnqueueResult {
  runId:   string
  deduped: boolean
}

/**
 * Create a run (or join the user's already-queued run) and add its job.
 * triggerMetadata must not contain PII (e.g. { reason: 'catch_up' }).
 */
export async function enqueueAgentRun(
  db: Queryable,
  params: { userId: string; triggerType: TriggerType; triggerMetadata?: Record<string, unknown> },
): Promise<EnqueueResult> {
  const queue = getAgentQueue()

  // Two tries: if the queued run we collided with started between the INSERT and the
  // SELECT, the second INSERT succeeds.
  for (let attempt = 0; attempt < 2; attempt++) {
    const ins = await db.query<{ id: string }>(`
      INSERT INTO agent_runs (user_id, trigger_type, trigger_metadata)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) WHERE status = 'queued' DO NOTHING
      RETURNING id
    `, [params.userId, params.triggerType, JSON.stringify(params.triggerMetadata ?? {})])

    if (ins.rows.length === 0) {
      const existing = await db.query<{ id: string }>(
        `SELECT id FROM agent_runs WHERE user_id = $1 AND status = 'queued' LIMIT 1`,
        [params.userId],
      )
      const runId = existing.rows[0]?.id
      if (!runId) continue
      // Repair a queued row whose job is gone (e.g. Redis was flushed); jobId makes this idempotent
      if (!(await queue.getJob(runId))) {
        await addJob(queue, { runId, userId: params.userId, triggerType: params.triggerType })
          .catch(err => console.error(`[Queue] Could not re-add job for queued run ${runId}: ${err.message}`))
      }
      return { runId, deduped: true }
    }

    const runId = ins.rows[0].id
    try {
      await addJob(queue, { runId, userId: params.userId, triggerType: params.triggerType })
    } catch (err) {
      // Don't leave a queued row without a job: it would block every later trigger for this user
      await db.query(`
        UPDATE agent_runs SET status = 'failed', completed_at = NOW(), error_message = 'Enqueue failed'
        WHERE id = $1 AND status = 'queued'
      `, [runId])
      throw err
    }
    return { runId, deduped: false }
  }

  throw new Error('Could not enqueue agent run: queued run changed state concurrently')
}

async function addJob(queue: Queue, data: AgentJobData): Promise<void> {
  await queue.add(AGENT_JOB_NAME, data, { ...AGENT_JOB_OPTIONS, jobId: data.runId })
}
