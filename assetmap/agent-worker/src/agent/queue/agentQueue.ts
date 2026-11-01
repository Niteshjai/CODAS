import { Queue } from 'bullmq'
import { Pool }  from 'pg'
import { z } from 'zod'
import { AgentContextSchema } from '../schemas/canonicalAsset'
import { getRedis } from '../../db/connections'

const EnqueueContextSchema = AgentContextSchema.omit({ runId: true })

export const AGENT_QUEUE_NAME = 'asset-orchestration'

// ─────────────────────────────────────────────
// BullMQ Queue Setup (lazy — nothing connects on import)
// ─────────────────────────────────────────────

let agentQueue: Queue | undefined

export function getAgentQueue(): Queue {
  agentQueue ??= new Queue(AGENT_QUEUE_NAME, {
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600, // keep 24 hours
        count: 1000,
      },
      removeOnFail: {
        age: 7 * 24 * 3600, // keep 7 days
      },
    },
  })
  return agentQueue
}

// ─────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────

/**
 * Enqueue a new agent run. Creates the initial tracking row
 * in agent_runs and adds the job to BullMQ.
 */
export async function enqueueAgentRun(
  pool: Pool,
  context: z.input<typeof EnqueueContextSchema>
): Promise<string> {
  const parsed = EnqueueContextSchema.parse(context)

  const res = await pool.query(`
    INSERT INTO agent_runs (
      user_id, trigger_type, trigger_metadata
    ) VALUES ($1, $2, $3)
    RETURNING id
  `, [
    parsed.userId,
    parsed.triggerType,
    JSON.stringify(parsed.triggerMetadata)
  ])

  const runId = res.rows[0].id

  try {
    await getAgentQueue().add(`run-${runId}`, { ...parsed, runId }, {
      jobId: runId, // Ensure idempotency
    })
  } catch (err) {
    // Don't leave a run stuck in 'queued' forever (the scheduler skips
    // users with an in-flight run).
    await pool.query(`
      UPDATE agent_runs SET status = 'failed', completed_at = NOW(), error_message = $2
      WHERE id = $1
    `, [runId, `Enqueue failed: ${(err as Error).message}`])
    throw err
  }

  console.log(`[Queue] Enqueued agent run ${runId} for user ${parsed.userId}`)
  return runId
}

/**
 * Log a specific step in the agent run to agent_run_steps.
 */
export async function logRunStep(
  pool: Pool,
  params: {
    runId:         string
    userId:        string
    stepName:      string
    status:        'started' | 'completed' | 'failed' | 'skipped'
    inputSummary:  any
    outputSummary: any
    durationMs:    number
    errorMessage?: string
  }
): Promise<void> {
  await pool.query(`
    INSERT INTO agent_run_steps (
      run_id, user_id, step_name, status,
      input_summary, output_summary, duration_ms, error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    params.runId,
    params.userId,
    params.stepName,
    params.status,
    JSON.stringify(params.inputSummary),
    JSON.stringify(params.outputSummary),
    params.durationMs,
    params.errorMessage ?? null
  ])
}
