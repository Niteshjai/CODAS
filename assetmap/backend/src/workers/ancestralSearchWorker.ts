import { Queue, Worker } from 'bullmq'
import { Pool }          from 'pg'
import { ancestralSearch } from '../ancestral/ancestralSearch'
import { onShutdown } from '../utils/lifecycle'
import { logger }          from '../utils/logger'
import { getRedisConnection } from './redisConnection'

let ancestralSearchQueue: Queue

export function startAncestralSearchWorker(pool: Pool): void {
  const connection = getRedisConnection();

  ancestralSearchQueue = new Queue('ancestral-search', {
    connection,
    // Job data carries ancestor names: never keep it in Redis after the job ends
    defaultJobOptions: { removeOnComplete: true, removeOnFail: true },
    skipVersionCheck: true
  } as any)

  const worker = new Worker(
    'ancestral-search',
    async (job) => {
      const { searchId, userId, input, variants } = job.data
      logger.info('[AncestralSearch] Processing search', { searchId })
      await ancestralSearch.executeSearch(
        pool, searchId, userId, input, variants
      )
    },
    {
      connection,
      concurrency: 3,    // Max 3 concurrent searches (Surepass rate limits)
      skipVersionCheck: true,
    } as any
  )

  worker.on('failed', (job, err) => {
    // err can carry ancestor names / raw API bodies — log the message only
    logger.error(`[AncestralSearch] Job ${job?.id} failed`, { error: err.message })
  })
  worker.on('error', (err) => {
    logger.error('[AncestralSearch] Worker error', { error: err.message })
  })
  // An EventEmitter 'error' with no listener crashes the process (e.g. on a Redis blip)
  ancestralSearchQueue.on('error', (err) => {
    logger.error('[AncestralSearch] Queue error', { error: err.message })
  })
  // Let in-flight jobs finish on deploy instead of dropping them mid-way
  onShutdown('AncestralSearch worker', () => worker.close())
  onShutdown('AncestralSearch queue', () => ancestralSearchQueue.close())

  logger.info('[AncestralSearch] Worker started')
}

export { ancestralSearchQueue }
