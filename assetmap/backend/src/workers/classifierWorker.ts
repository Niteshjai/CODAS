import { Queue, Worker } from 'bullmq'
import { Pool }          from 'pg'
import { transactionClassifier } from '../classifier/transactionClassifier'
import { logger }        from '../utils/logger'
import { getRedisConnection, JOB_RETENTION } from './redisConnection'

let classifierWorkerQueue: Queue

export function startClassifierWorker(pool: Pool): void {
  const connection = getRedisConnection();

  classifierWorkerQueue = new Queue('transaction-classifier', {
    connection,
    defaultJobOptions: JOB_RETENTION, // job data is only { userId }
    skipVersionCheck: true,
  } as any)

  const worker = new Worker(
    'transaction-classifier',
    async (job) => {
      const { userId } = job.data
      logger.info('[Classifier] Processing user', { userId })
      const result = await transactionClassifier.processUserTransactions(pool, userId)
      logger.info('[Classifier] Done', { userId, processed: result.processed, failed: result.failed })
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
