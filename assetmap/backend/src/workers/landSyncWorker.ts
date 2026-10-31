import cron from 'node-cron'
import { Pool } from 'pg'
import { landRegistryService } from '../services/landRegistry'
import { decryptPII } from '../utils/encryption'
import { logger } from '../utils/logger'

// Runs every night at 2AM IST (cron, not setInterval: an interval restarts its 24h
// countdown on every deploy, so the job could never fire on a frequently restarted server)
// Re-fetches records whose sync_frequency_days has passed
export function startLandSyncWorker(pool: Pool) {
  cron.schedule('0 2 * * *', async () => {
    logger.info('[LandSync] Starting nightly sync job')

    // Find all records due for sync
    let result
    try {
      result = await pool.query(`
      SELECT DISTINCT user_id, state_code, owner_name_enc
      FROM land_records
      WHERE next_sync_at <= NOW()
      AND is_active = true
      AND source != 'manual'
      LIMIT 500
    `)
    } catch (err) {
      logger.error('[LandSync] Job failed', { error: (err as Error).message })
      return
    }

    // owner_name_enc uses a random IV, so SQL DISTINCT can't dedupe owners: do it after
    // decrypting, otherwise each parcel of the same owner triggers a separate paid lookup
    const seen = new Set<string>()
    let synced = 0
    for (const row of result.rows) {
      try {
        const ownerName = decryptPII(row.owner_name_enc)
        if (!ownerName) continue
        const key = `${row.user_id}|${row.state_code}|${ownerName.trim().toLowerCase()}`
        if (seen.has(key)) continue
        seen.add(key)
        await landRegistryService.fetchAndStoreLandRecords(
          pool,
          row.user_id,
          {
            name:      ownerName,
            state:     row.state_code,
            stateCode: row.state_code,
          },
          'scheduled'
        )
        synced++
        // Rate limit Surepass calls — max 1 per second
        await new Promise(r => setTimeout(r, 1000))
      } catch (err) {
        logger.error('[LandSync] Sync failed', { userId: row.user_id, error: (err as Error).message })
      }
    }

    logger.info(`[LandSync] Completed. Synced ${synced} owners.`)
  }, { timezone: 'Asia/Kolkata' })

  logger.info('[LandSync] Worker registered — runs nightly at 2AM IST')
}
