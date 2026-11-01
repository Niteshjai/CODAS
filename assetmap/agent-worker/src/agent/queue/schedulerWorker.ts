import { Worker } from 'bullmq'
import { enqueueAgentRun } from './agentQueue'
import { SCHEDULER_QUEUE_NAME } from './agentScheduler'
import { ALL_SOURCES } from '../schemas/canonicalAsset'
import { getPool, getRedis } from '../../db/connections'
import { decryptOptional } from '../../utils/encryption'

type TriggerType = 'cron_scheduled' | 'estate_case'

interface UserRow {
  id:              string
  name_encrypted:  string | null
  mobile_encrypted:string | null
  pan_encrypted:   string | null
  consent_id:      string | null
  state:           string | null
  state_code:      string | null
  district:        string | null
}

/**
 * AssetMap stores PII only as AES-256-GCM ciphertext (`*_encrypted`), so the
 * old `SELECT u.name, u.mobile, u.pan` failed on every scheduler tick.
 * Also pulls the user's active AA consent (without it cron runs never
 * refreshed bank/MF data) and the state from their latest land record.
 * Users with a run already queued/running are skipped so ticks don't pile
 * up concurrent runs for the same user.
 */
function userSelect(extraAssetCondition = ''): string {
  return `
    SELECT
      u.id, u.name_encrypted, u.mobile_encrypted, u.pan_encrypted,
      (SELECT c.consent_id FROM consents c
        WHERE c.user_id = u.id AND c.status = 'ACTIVE'
        ORDER BY c.created_at DESC LIMIT 1) AS consent_id,
      lr.state, lr.state_code, lr.district
    FROM users u
    LEFT JOIN LATERAL (
      SELECT state, state_code, district FROM land_records
      WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
    ) lr ON true
    WHERE EXISTS (
      SELECT 1 FROM canonical_assets ca
      WHERE ca.user_id = u.id AND ca.is_active = true ${extraAssetCondition}
    )
    AND NOT EXISTS (
      SELECT 1 FROM agent_runs ar
      WHERE ar.user_id = u.id
        AND ar.status IN ('queued', 'running')
        AND ar.created_at > NOW() - INTERVAL '6 hours'
    )
  `
}

function safeDecrypt(value: string | null, userId: string, field: string): string | undefined {
  try {
    return decryptOptional(value) ?? undefined
  } catch (err: any) {
    console.warn(`[Scheduler] Could not decrypt ${field} for user ${userId}: ${err.message}`)
    return undefined
  }
}

async function enqueueForUsers(
  rows: UserRow[],
  triggerType: TriggerType,
  triggerMetadata: Record<string, unknown>,
  options: { forceRefresh?: boolean; isEstateCase?: boolean } = {}
): Promise<number> {
  const pool = getPool()
  let enqueued = 0

  for (const row of rows) {
    // One bad user must not stop the rest of the batch
    try {
      await enqueueAgentRun(pool, {
        userId: row.id,
        triggerType,
        triggerMetadata,
        consentId: row.consent_id ?? undefined,
        userProfile: {
          name:      safeDecrypt(row.name_encrypted, row.id, 'name') ?? 'Unknown',
          mobile:    safeDecrypt(row.mobile_encrypted, row.id, 'mobile') ?? '',
          pan:       safeDecrypt(row.pan_encrypted, row.id, 'pan'),
          state:     row.state ?? undefined,
          stateCode: row.state_code ?? undefined,
          district:  row.district ?? undefined,
        },
        sourcesToFetch: [...ALL_SOURCES],
        options: {
          forceRefresh:    options.forceRefresh ?? false,
          skipCache:       false,
          enrichWithAI:    true,
          detectAnomalies: true,
          triggerAlerts:   true,
          isEstateCase:    options.isEstateCase ?? false,
        },
      })
      enqueued++
    } catch (err: any) {
      console.error(`[Scheduler] Failed to enqueue run for user ${row.id}:`, err.message)
    }
  }

  return enqueued
}

async function runDailyFullRefresh(): Promise<void> {
  const res = await getPool().query<UserRow>(userSelect())
  const count = await enqueueForUsers(res.rows, 'cron_scheduled', { job: 'daily-full-refresh' }, { forceRefresh: true })
  console.log(`[Scheduler] daily-full-refresh enqueued ${count}/${res.rows.length} runs`)
}

async function runStaleAssetSync(): Promise<void> {
  const res = await getPool().query<UserRow>(
    userSelect('AND (ca.is_stale = true OR ca.next_sync_at < NOW())')
  )
  const count = await enqueueForUsers(res.rows, 'cron_scheduled', { job: 'stale-asset-sync' })
  console.log(`[Scheduler] stale-asset-sync enqueued ${count}/${res.rows.length} runs`)
}

async function runWeeklyEstateCheck(): Promise<void> {
  const res = await getPool().query<UserRow>(userSelect())
  const count = await enqueueForUsers(
    res.rows, 'estate_case', { job: 'weekly-estate-check' },
    { forceRefresh: true, isEstateCase: true }
  )
  console.log(`[Scheduler] weekly-estate-check enqueued ${count}/${res.rows.length} runs`)
}

export function startSchedulerWorker(): Worker {
  const worker = new Worker(
    SCHEDULER_QUEUE_NAME,
    async (job) => {
      switch (job.name) {
        case 'daily-full-refresh':
          await runDailyFullRefresh()
          break
        case 'stale-asset-sync':
          await runStaleAssetSync()
          break
        case 'weekly-estate-check':
          await runWeeklyEstateCheck()
          break
        default:
          console.warn(`[Scheduler] Unknown job: ${job.name}`)
      }
    },
    { connection: getRedis() }
  )

  worker.on('failed', (job, err) => {
    console.error(`[Scheduler] Job ${job?.name} failed:`, err.message)
  })

  worker.on('error', err => {
    console.error('[Scheduler] Worker error:', err.message)
  })

  return worker
}
