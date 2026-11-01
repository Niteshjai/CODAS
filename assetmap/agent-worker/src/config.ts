// ─────────────────────────────────────────────
// Runtime configuration read from the environment.
// Every variable here is documented in .env.example.
// Values are read lazily (functions), so index.ts can validate the
// environment before anything else looks at it.
// ─────────────────────────────────────────────

function intEnv(name: string, fallback: number, min = 1): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isInteger(n) && n >= min ? n : fallback
}

export const config = {
  /** Fast tier: picks the next pipeline step. Aligned with the backend's CLAUDE_MODELS. */
  routingModel: () => process.env.ANTHROPIC_MODEL?.trim() || 'claude-haiku-5-5',
  /** Enrichment (risk, liquidity, anomalies). */
  enrichModel:  () => process.env.ANTHROPIC_ENRICH_MODEL?.trim() || 'claude-sonnet-5-5',
  anthropicTimeoutMs:  30_000,
  anthropicMaxRetries: 2,

  hasAnthropicKey: () => Boolean(process.env.ANTHROPIC_API_KEY?.trim()),

  /** DigiLocker and MCA21 call external APIs directly; off unless explicitly enabled. */
  externalSourcesEnabled: () => process.env.AGENT_ENABLE_EXTERNAL_SOURCES === 'true',

  pgPoolMax: () => intEnv('AGENT_PG_POOL_MAX', 5),

  /**
   * Each run holds one dedicated connection (its advisory lock) and does all its
   * work on it, so concurrency must leave room in the pool for the scheduler.
   */
  concurrency: () => {
    const requested = intEnv('AGENT_CONCURRENCY', 3)
    return Math.max(1, Math.min(requested, config.pgPoolMax() - 1))
  },

  heartbeatFile: () => process.env.AGENT_HEARTBEAT_FILE?.trim() || '/tmp/agent-worker.heartbeat',
  heartbeatIntervalMs: 30_000,

  /** Max users the daily catch-up enqueues per tick. */
  catchUpCap: () => intEnv('AGENT_CATCHUP_MAX_USERS', 2000),

  isProduction: () => process.env.NODE_ENV === 'production',
}
