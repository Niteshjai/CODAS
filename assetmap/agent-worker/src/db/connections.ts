import { Pool } from 'pg'
import Redis from 'ioredis'

// ─────────────────────────────────────────────
// Shared Postgres pool and Redis connection.
// Created lazily so nothing connects until the
// env has been validated in index.ts.
// ─────────────────────────────────────────────

let pool: Pool | undefined
let redis: Redis | undefined

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    pool.on('error', err => {
      console.error('[DB] Idle client error:', err.message)
    })
  }
  return pool
}

/** BullMQ requires maxRetriesPerRequest: null on its connections. */
export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })
  }
  return redis
}

export async function closeConnections(): Promise<void> {
  await Promise.allSettled([
    pool?.end(),
    redis?.quit(),
  ])
}
