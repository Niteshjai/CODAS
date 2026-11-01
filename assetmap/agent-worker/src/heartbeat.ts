import { mkdir, writeFile } from 'fs/promises'
import { dirname } from 'path'
import type { Worker } from 'bullmq'
import { config } from './config'
import { getPool, getRedis } from './db/connections'

// ─────────────────────────────────────────────
// Liveness signal for a worker with no HTTP port. Every 30s, while the workers
// are running and Postgres + Redis answer, the heartbeat file is rewritten.
// Health check (Dockerfile / Container Apps probe): file mtime < 2 minutes.
// ─────────────────────────────────────────────

async function healthy(workers: Worker[]): Promise<boolean> {
  if (!workers.every(w => w.isRunning())) return false
  try {
    if ((await getRedis().ping()) !== 'PONG') return false
    await getPool().query('SELECT 1')
    return true
  } catch {
    return false
  }
}

export function startHeartbeat(workers: Worker[]): () => void {
  const file = config.heartbeatFile()
  let stopped = false

  const beat = async () => {
    if (stopped) return
    if (await healthy(workers)) {
      try {
        await mkdir(dirname(file), { recursive: true })
        await writeFile(file, `${new Date().toISOString()}\n`)
      } catch (err: any) {
        console.error(`[Heartbeat] Could not write ${file}: ${err.message}`)
      }
    } else {
      console.warn('[Heartbeat] Unhealthy (worker stopped or Postgres/Redis unreachable); not updating heartbeat')
    }
  }

  void beat()
  const timer = setInterval(() => void beat(), config.heartbeatIntervalMs)
  timer.unref()
  return () => { stopped = true; clearInterval(timer) }
}
