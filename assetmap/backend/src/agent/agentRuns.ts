import { Queue } from 'bullmq'
import { pool } from '../db/connection'
import { getRedisConnection } from '../workers/redisConnection'
import { onShutdown } from '../utils/lifecycle'
import { logger } from '../utils/logger'

// ═══════════════════════════════════════════════════════════════
// Asset-orchestration agent: backend producer + read model
//
// The agent (assetmap/agent-worker) runs as its own process and consumes the BullMQ queue
// 'asset-orchestration'. The backend only enqueues runs and reads their results. Handoff contract:
//   * one agent_runs row per run; jobId = runId = agent_runs.id; job name 'run'
//   * job data is { runId, userId, triggerType } ONLY — no PII in Redis
//   * at most ONE queued run per user (unique partial index, migration 034): a burst of triggers
//     collapses into the queued run, which reads the latest stored data when it starts
// The queue is created lazily and independently of RUN_BACKGROUND_JOBS: an API-only instance
// must still be able to hand work to the agent.
// ═══════════════════════════════════════════════════════════════

export const AGENT_QUEUE_NAME = 'asset-orchestration'
export const AGENT_JOB_NAME = 'run'

export type AgentTriggerType = 'consent_granted' | 'data_updated' | 'user_refresh' | 'cron_scheduled' | 'manual_admin'

export interface AgentJobData {
  runId: string
  userId: string
  triggerType: AgentTriggerType
}

export interface EnqueueResult {
  runId: string
  deduped: boolean
}

export const AGENT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: true,
  removeOnFail: { age: 7 * 24 * 3600 },
}

// How long a request path waits for Redis before giving up on the hand-off
const ADD_TIMEOUT_MS = 5000

/** The part of a BullMQ Queue the producer uses (tests inject their own). */
export interface AgentQueueLike {
  add(name: string, data: AgentJobData, opts: Record<string, unknown>): Promise<unknown>
  remove?(jobId: string): Promise<unknown>
}

let queue: Queue | null = null
let injectedQueue: AgentQueueLike | null = null

function getQueue(): AgentQueueLike {
  if (injectedQueue) return injectedQueue
  if (!queue) {
    queue = new Queue(AGENT_QUEUE_NAME, { connection: getRedisConnection(), skipVersionCheck: true } as any)
    // An EventEmitter 'error' with no listener crashes the process (e.g. on a Redis blip)
    queue.on('error', (err) => logger.error('[Agent] Queue error', { error: err.message }))
    const q = queue
    onShutdown('Agent queue', () => q.close())
  }
  return queue as unknown as AgentQueueLike
}

/**
 * Tests only: route enqueues to another queue (or a stub) so test runs never reach the real
 * worker. Pass null to restore the real queue. Returns the previously injected queue.
 */
export function setAgentQueueForTests(q: AgentQueueLike | null): AgentQueueLike | null {
  const previous = injectedQueue
  injectedQueue = q
  return previous
}

async function addWithTimeout(q: AgentQueueLike, data: AgentJobData): Promise<void> {
  const add = q.add(AGENT_JOB_NAME, data, { ...AGENT_JOB_OPTIONS, jobId: data.runId })
  let timer: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Queue add timed out')), ADD_TIMEOUT_MS)
  })
  try {
    await Promise.race([add, timeout])
  } catch (err) {
    // If the add lands after we gave up, the run is already marked failed: take the job back out
    // so the worker never processes a run the API reported as failed.
    add.then(() => q.remove?.(data.runId)).catch(() => {})
    throw err
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Queue an agent run for a user. Returns the queued run (deduped when one was already waiting),
 * or null when the hand-off failed. Never throws: triggers sit on data paths (AA refresh, land
 * fetch, unclaimed search) that must not fail because the agent is unavailable.
 * `metadata` is stored in agent_runs.trigger_metadata and must not contain PII.
 */
export async function enqueueAgentRun(
  userId: string,
  triggerType: AgentTriggerType,
  metadata: Record<string, unknown> = {}
): Promise<EnqueueResult | null> {
  let runId: string | null = null
  try {
    // A queued run can start (leave 'queued') between our INSERT and SELECT; retry once then.
    for (let attempt = 0; attempt < 3 && !runId; attempt++) {
      const inserted = await pool.query(
        `INSERT INTO agent_runs (user_id, trigger_type, trigger_metadata)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (user_id) WHERE status = 'queued' DO NOTHING
         RETURNING id`,
        [userId, triggerType, JSON.stringify(metadata ?? {})]
      )
      if (inserted.rows[0]) {
        runId = inserted.rows[0].id as string
        break
      }
      const existing = await pool.query(
        `SELECT id FROM agent_runs WHERE user_id = $1 AND status = 'queued' LIMIT 1`,
        [userId]
      )
      if (existing.rows[0]) {
        return { runId: existing.rows[0].id as string, deduped: true }
      }
    }
    if (!runId) {
      logger.warn('[Agent] Could not create a run', { userId, triggerType })
      return null
    }
  } catch (err) {
    logger.error('[Agent] Run insert failed', { userId, triggerType, error: (err as Error).message })
    return null
  }

  try {
    await addWithTimeout(getQueue(), { runId, userId, triggerType })
    logger.info('[Agent] Run queued', { runId, userId, triggerType })
    return { runId, deduped: false }
  } catch (err) {
    logger.error('[Agent] Enqueue failed', { runId, userId, triggerType, error: (err as Error).message })
    await pool.query(
      `UPDATE agent_runs
          SET status = 'failed', error_message = 'Enqueue failed', completed_at = NOW()
        WHERE id = $1 AND status = 'queued'`,
      [runId]
    ).catch((e) => logger.error('[Agent] Could not mark run failed', { runId, error: (e as Error).message }))
    return null
  }
}

// ─────────────────────────────────────────────
// Read model for /api/agent
// ─────────────────────────────────────────────

export interface AgentRunView {
  id: string
  status: string
  triggerType: string
  currentStep: string | null
  queuedAt: string | null
  startedAt: string | null
  completedAt: string | null
  durationMs: number | null
  recordsCreated: number
  recordsUpdated: number
  recordsDeduplicated: number
  anomaliesDetected: number
  sourcesFetched: string[]
  stepsFailed: string[]
  aiUsed: boolean
}

export interface AgentStatus {
  latestRun: AgentRunView | null
  inFlight: boolean
  canonicalAssetCount: number
  openAnomalies: number
  lastSuccessfulAt: string | null
}

const iso = (v: unknown): string | null => (v ? new Date(v as string).toISOString() : null)

export async function getAgentStatus(userId: string): Promise<AgentStatus> {
  const [latest, counts] = await Promise.all([
    pool.query(
      `SELECT id, status, trigger_type, current_step, queued_at, started_at, completed_at, duration_ms,
              records_created, records_updated, records_deduplicated, anomalies_detected,
              sources_fetched, steps_failed, ai_calls_made
         FROM agent_runs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [userId]
    ),
    pool.query(
      `SELECT
         EXISTS (SELECT 1 FROM agent_runs WHERE user_id = $1 AND status IN ('queued', 'running')) AS in_flight,
         (SELECT COUNT(*) FROM canonical_assets
           WHERE user_id = $1 AND is_active = true AND is_duplicate IS NOT TRUE)::int AS canonical_count,
         (SELECT COUNT(*) FROM asset_anomalies WHERE user_id = $1 AND is_resolved = false)::int AS open_anomalies,
         (SELECT MAX(completed_at) FROM agent_runs
           WHERE user_id = $1 AND status IN ('completed', 'partial')) AS last_successful_at`,
      [userId]
    ),
  ])

  const r = latest.rows[0]
  const c = counts.rows[0]
  return {
    latestRun: r
      ? {
          id: r.id,
          status: r.status,
          triggerType: r.trigger_type,
          currentStep: r.current_step ?? null,
          queuedAt: iso(r.queued_at),
          startedAt: iso(r.started_at),
          completedAt: iso(r.completed_at),
          durationMs: r.duration_ms ?? null,
          recordsCreated: r.records_created ?? 0,
          recordsUpdated: r.records_updated ?? 0,
          recordsDeduplicated: r.records_deduplicated ?? 0,
          anomaliesDetected: r.anomalies_detected ?? 0,
          sourcesFetched: r.sources_fetched ?? [],
          stepsFailed: r.steps_failed ?? [],
          aiUsed: (r.ai_calls_made ?? 0) > 0,
        }
      : null,
    inFlight: Boolean(c?.in_flight),
    canonicalAssetCount: c?.canonical_count ?? 0,
    openAnomalies: c?.open_anomalies ?? 0,
    lastSuccessfulAt: iso(c?.last_successful_at),
  }
}

export interface AnomalyView {
  id: string
  type: string | null
  severity: string | null
  description: string | null
  aiExplanation: string | null
  institution: string | null
  assetClass: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  occurrences: number
}

/** Open anomalies for a user, newest first (max 50). Reads plaintext columns only. */
export async function listOpenAnomalies(userId: string): Promise<AnomalyView[]> {
  const res = await pool.query(
    `SELECT a.id, a.anomaly_type, a.severity, a.description, a.ai_explanation,
            a.created_at, a.last_seen_at, a.occurrences,
            c.institution_name, c.asset_class
       FROM asset_anomalies a
       LEFT JOIN canonical_assets c ON c.id = a.canonical_id AND c.user_id = a.user_id
      WHERE a.user_id = $1 AND a.is_resolved = false
      ORDER BY a.last_seen_at DESC, a.created_at DESC
      LIMIT 50`,
    [userId]
  )
  return res.rows.map((r) => ({
    id: r.id,
    type: r.anomaly_type ?? null,
    severity: r.severity ?? null,
    description: r.description ?? null,
    aiExplanation: r.ai_explanation ?? null,
    institution: r.institution_name ?? null,
    assetClass: r.asset_class ?? null,
    firstSeenAt: iso(r.created_at),
    lastSeenAt: iso(r.last_seen_at),
    occurrences: r.occurrences ?? 1,
  }))
}

/** Mark an anomaly resolved. Returns false when it doesn't exist or belongs to someone else. */
export async function resolveAnomaly(userId: string, anomalyId: string): Promise<boolean> {
  const res = await pool.query(
    `UPDATE asset_anomalies
        SET is_resolved = true, resolved_at = COALESCE(resolved_at, NOW())
      WHERE id = $1 AND user_id = $2
      RETURNING id`,
    [anomalyId, userId]
  )
  return (res.rowCount ?? 0) > 0
}
