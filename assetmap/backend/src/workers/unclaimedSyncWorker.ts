import { Pool } from 'pg'
import { unclaimedAssets } from '../services/unclaimedAssets'
import { logger } from '../utils/logger'
import { decryptPII } from '../utils/encryption'

// Simple worker to pick up 'pending' searches and run them
export async function runUnclaimedSyncWorker(pool: Pool) {
  logger.info('UnclaimedSyncWorker started...')
  
  setInterval(async () => {
    try {
      const result = await pool.query(`
        SELECT id, user_id, pan_enc, name_enc 
        FROM unclaimed_search_requests 
        WHERE search_status = 'pending' AND payment_status = 'completed'
        LIMIT 5
      `)
      
      for (const row of result.rows) {
        // Columns hold ciphertext; the registries need the plaintext PAN/name
        try {
          await unclaimedAssets.runSearch(
            pool,
            row.id,
            row.user_id,
            { pan: decryptPII(row.pan_enc), name: decryptPII(row.name_enc) }
          )
        } catch (err) {
          logger.error(`UnclaimedSyncWorker failed for search ${row.id}`, { error: (err as Error).message })
        }
      }
    } catch (err) {
      logger.error('UnclaimedSyncWorker error:', { error: (err as Error).message })
    }
  }, 60000) // Run every minute
}
