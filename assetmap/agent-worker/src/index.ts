// Validate env *before* importing anything that touches Postgres/Redis.
// Static imports are hoisted, so modules that connect are imported dynamically
// after the check.

const REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL', 'ENCRYPTION_KEY']

/** worker.close() waits for in-flight jobs; cap it so the platform's kill timeout is not hit. */
const SHUTDOWN_GRACE_MS = 25_000

async function main(): Promise<void> {
  const missing = REQUIRED_ENV.filter(key => !process.env[key]?.trim())
  if (missing.length > 0) {
    console.error(`[Startup] Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  const { getKey } = await import('./utils/encryption')
  try {
    getKey()
  } catch (err: any) {
    console.error(`[Startup] ${err.message}`)
    process.exit(1)
  }

  const { config }                             = await import('./config')
  const { aiAvailable }                        = await import('./agent/ai')
  const { getPool, closeConnections }          = await import('./db/connections')
  const { setupSchedulers, getSchedulerQueue } = await import('./agent/queue/agentScheduler')
  const { startSchedulerWorker }               = await import('./agent/queue/schedulerWorker')
  const { startAgentWorker }                   = await import('./agent/queue/agentWorker')
  const { getAgentQueue }                      = await import('./agent/queue/agentQueue')
  const { startHeartbeat }                     = await import('./heartbeat')

  // Fail fast if the schema the worker needs is missing (migrations 032 + 034)
  try {
    await getPool().query(`SELECT fingerprint FROM asset_anomalies LIMIT 0`)
    await getPool().query(`SELECT 1 FROM agent_runs LIMIT 0`)
  } catch (err: any) {
    console.error(`[Startup] Database not ready (apply backend migrations 032 and 034): ${err.message}`)
    await closeConnections()
    process.exit(1)
  }

  // Missing key → deterministic mode (warns once)
  aiAvailable()

  await setupSchedulers()
  const schedulerWorker = startSchedulerWorker()
  const agentWorker     = startAgentWorker()
  const stopHeartbeat   = startHeartbeat([agentWorker, schedulerWorker])

  console.log(
    `[Startup] AssetMap agent worker running (concurrency ${config.concurrency()}, ` +
    `pool ${config.pgPoolMax()}, external sources ${config.externalSourcesEnabled() ? 'on' : 'off'}, ` +
    `heartbeat ${config.heartbeatFile()})`,
  )

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[Shutdown] ${signal} received — no new jobs; finishing in-flight runs (max ${SHUTDOWN_GRACE_MS / 1000}s)`)
    stopHeartbeat()

    const graceful = Promise.allSettled([agentWorker.close(), schedulerWorker.close()])
    const timedOut = await Promise.race([
      graceful.then(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(true), SHUTDOWN_GRACE_MS).unref()),
    ])
    if (timedOut) {
      // In-flight runs are retried by BullMQ (stalled-job recovery) on the next start
      console.warn('[Shutdown] Grace period over; forcing workers closed')
      await Promise.allSettled([agentWorker.close(true), schedulerWorker.close(true)])
    }

    await Promise.allSettled([getAgentQueue().close(), getSchedulerQueue().close()])
    await closeConnections()
    console.log('[Shutdown] Clean exit')
    process.exit(0)
  }

  process.on('SIGINT',  () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

main().catch(err => {
  console.error('[Startup] Fatal error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
