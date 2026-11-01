import { Worker } from 'bullmq'
import { AgentContextSchema } from '../schemas/canonicalAsset'
import { runOrchestrationAgent } from '../orchestrator'
import { getPool, getRedis } from '../../db/connections'
import { AGENT_QUEUE_NAME } from './agentQueue'

// ─────────────────────────────────────────────
// BullMQ Worker
// Consumes orchestration jobs and runs the agent.
// Started explicitly from index.ts (importing this module has no side effects).
// ─────────────────────────────────────────────

export function startAgentWorker(): Worker {
  const pool = getPool()

  const worker = new Worker(
    AGENT_QUEUE_NAME,
    async (job) => {
      const context = AgentContextSchema.parse(job.data)
      console.log(`[Worker] Starting job ${job.id} for user ${context.userId} (attempt ${job.attemptsMade + 1})`)

      const result = await runOrchestrationAgent(pool, context)
      console.log(`[Worker] Job ${job.id} completed. Records: ${result.recordsProcessed}`)
      return result
    },
    {
      connection: getRedis(),
      concurrency: 3, // Process up to 3 agent runs in parallel
      // A run polls Setu and calls Claude several times; give it time
      // before BullMQ considers the job stalled.
      lockDuration: 5 * 60 * 1000,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message)
  })

  worker.on('error', err => {
    console.error('[Worker] Worker error:', err.message)
  })

  return worker
}
