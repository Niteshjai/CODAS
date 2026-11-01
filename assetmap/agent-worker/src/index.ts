// Validate env *before* importing anything that touches Postgres/Redis.
// Static imports are hoisted, so the old check ran only after the worker
// module had already connected (to localhost, if REDIS_URL was missing)
// and started consuming jobs.

const REQUIRED_ENV = ['DATABASE_URL', 'REDIS_URL', 'ANTHROPIC_API_KEY', 'ENCRYPTION_KEY']

async function main(): Promise<void> {
  const missing = REQUIRED_ENV.filter(key => !process.env[key])
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

  const { setupSchedulers, getSchedulerQueue } = await import('./agent/queue/agentScheduler')
  const { startSchedulerWorker }               = await import('./agent/queue/schedulerWorker')
  const { startAgentWorker }                   = await import('./agent/queue/agentWorker')
  const { getAgentQueue }                      = await import('./agent/queue/agentQueue')
  const { closeConnections }                   = await import('./db/connections')

  await setupSchedulers()
  const schedulerWorker = startSchedulerWorker()
  const agentWorker     = startAgentWorker()

  console.log('[Startup] AssetMap agent worker and scheduler running')

  let shuttingDown = false
  const shutdown = async (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`[Shutdown] ${signal} received — finishing in-flight jobs`)
    await Promise.allSettled([agentWorker.close(), schedulerWorker.close()])
    await Promise.allSettled([getAgentQueue().close(), getSchedulerQueue().close()])
    await closeConnections()
    process.exit(0)
  }

  process.on('SIGINT',  () => void shutdown('SIGINT'))
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
}

main().catch(err => {
  console.error('[Startup] Fatal error:', err)
  process.exit(1)
})
