import { Queue, Worker } from 'bullmq'
import { Pool }          from 'pg'
import { runSpendAnalysis } from '../spend/spendOrchestrator'
import { onShutdown } from '../utils/lifecycle'
import { logger }        from '../utils/logger'
import { getRedisConnection, JOB_RETENTION } from './redisConnection'

// Spend analyser pipeline per user: classify → rebuild monthly summary → analyse → insights.
// Job data: { userId, reclassify?: boolean, month?: 'YYYY-MM' } (no PII).

let classifierWorkerQueue: Queue

export function startClassifierWorker(pool: Pool): void {
  const connection = getRedisConnection();

  classifierWorkerQueue = new Queue('transaction-classifier', {
    connection,
    defaultJobOptions: JOB_RETENTION,
    skipVersionCheck: true,
  } as any)

  const worker = new Worker(
    'transaction-classifier',
    async (job) => {
      const { userId, reclassify, month } = job.data as { userId: string; reclassify?: boolean; month?: string }
      logger.info('[Classifier] Processing user', { userId, reclassify: Boolean(reclassify) })
      const result = await runSpendAnalysis(pool, userId, { reclassify: Boolean(reclassify), month: month ?? null })
      logger.info('[Classifier] Done', {
        userId,
        classified: result.classification.classified,
        reclassified: result.classification.reclassified,
        needsReview: result.classification.needsReview,
        insights: result.insights.length,
        generatedBy: result.generatedBy,
      })
    },
    {
      connection,
      concurrency: 5,
      skipVersionCheck: true,
    } as any
  )

  worker.on('failed', (job, err) => {
    logger.error(`[Classifier] Job ${job?.id} failed`, { error: err.message })
  })
  worker.on('error', (err) => {
    logger.error('[Classifier] Worker error', { error: err.message })
  })
  // An EventEmitter 'error' with no listener crashes the process (e.g. on a Redis blip)
  classifierWorkerQueue.on('error', (err) => {
    logger.error('[Classifier] Queue error', { error: err.message })
  })
  // Let in-flight jobs finish on deploy instead of dropping them mid-way
  onShutdown('Classifier worker', () => worker.close())
  onShutdown('Classifier queue', () => classifierWorkerQueue.close())

  logger.info('[Classifier] Worker started')
}

/**
 * Queue a spend analysis for a user after new transactions arrive. Deduplicated per user, so a
 * burst of refreshes runs one job. Never throws: a missing queue (no Redis in dev) only logs.
 */
export async function enqueueSpendAnalysis(userId: string): Promise<void> {
  try {
    if (!classifierWorkerQueue) return
    await classifierWorkerQueue.add('analyze', { userId }, { deduplication: { id: `spend-analyze:${userId}` } } as any)
  } catch (err) {
    logger.warn('[Classifier] Could not queue spend analysis', { userId, error: (err as Error).message })
  }
}

export { classifierWorkerQueue }
