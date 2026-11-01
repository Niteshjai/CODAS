import { Queue, Worker } from 'bullmq'
import { Pool }          from 'pg'
import { runSpendAnalysis } from '../spend/spendOrchestrator'
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

  logger.info('[Classifier] Worker started')
}

export { classifierWorkerQueue }
