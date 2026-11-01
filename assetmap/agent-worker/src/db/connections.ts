import pg from 'pg'
import { Redis } from 'ioredis'
import { config } from '../config'

// ─────────────────────────────────────────────
// Shared Postgres pool and Redis connection.
// Created lazily so nothing connects until the
// env has been validated in index.ts.
// ─────────────────────────────────────────────

let pool: pg.Pool | undefined
let redis: Redis | undefined

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: config.pgPoolMax(),
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
      idle_in_transaction_session_timeout: 60000,
      // Mirrors the backend: Azure Postgres requires TLS with a verified certificate
      ssl: config.isProduction() ? { rejectUnauthorized: true } : undefined,
    })
    pool.on('error', err => {
      console.error('[DB] Idle client error:', err.message)
    })
  }
  return pool
}

/**
 * Shared ioredis connection for BullMQ (Queues and Workers; BullMQ duplicates it
 * for blocking calls). BullMQ requires maxRetriesPerRequest: null. A rediss://
 * URL enables TLS (Azure Cache for Redis).
 */
export function getRedis(): Redis {
  if (!redis) {
    const url = process.env.REDIS_URL!
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
      ...(url.startsWith('rediss://') ? { tls: {} } : {}),
    })
    redis.on('error', err => {
      console.error('[Redis] Connection error:', err.message)
    })
  }
  return redis
}

export async function closeConnections(): Promise<void> {
  await Promise.allSettled([
    pool?.end(),
    redis?.quit(),
  ])
}
