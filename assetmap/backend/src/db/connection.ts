import 'dotenv/config';
import { Pool, PoolConfig } from 'pg';
import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
// PostgreSQL Connection Pool
// ─────────────────────────────────────────────

const STATEMENT_TIMEOUT_MS = parseInt(process.env.PG_STATEMENT_TIMEOUT_MS ?? '15000', 10);

const pgConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.PG_POOL_MAX ?? '20', 10),
  // A hung query (lock wait, runaway plan) must not hold a pool slot forever: the server cancels
  // it after this long. Transactions left open by a crashed handler are closed after 30s.
  ...(STATEMENT_TIMEOUT_MS > 0 ? { statement_timeout: STATEMENT_TIMEOUT_MS } : {}),
  idle_in_transaction_session_timeout: 30000,
  idleTimeoutMillis: 120000, // 2 minutes, prevents reconnect every minute for cron workers
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
};

export const pool = new Pool(pgConfig);

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error', { error: err.message });
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected');
});

// ─────────────────────────────────────────────
// Redis Client + in-memory fallback
// ─────────────────────────────────────────────

let redisAvailable = false;

const redisClientOptions: RedisOptions = {
  maxRetriesPerRequest: null,
  retryStrategy(times: number) {
    if (process.env.NODE_ENV === 'development') {
      return null;
    }

    // Exponential backoff: 200ms, 400ms, 800ms, ... up to 30s, then keep retrying
    const delay = Math.min(times * 200, 30000);
    logger.debug(`Redis reconnecting in ${delay}ms (attempt ${times})`);
    return delay;
  },
  lazyConnect: true,
  enableOfflineQueue: false,
  keepAlive: 30000,   // Send TCP keep-alive every 30s to prevent idle drops
  connectTimeout: 10000,
};

const localRedisOptions: RedisOptions = {
  host: process.env.REDIS_HOST ?? '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
};

export const redis = process.env.NODE_ENV === 'development'
  ? new Redis({ ...redisClientOptions, ...localRedisOptions })
  : new Redis(process.env.REDIS_URL || 'redis://localhost:6379', redisClientOptions);

redis.on('error', (err) => {
  if (redisAvailable) {
    logger.error('Redis connection error', { error: err.message });
    redisAvailable = false;
  }
});

redis.on('connect', () => {
  logger.debug('Redis client connected');
});

redis.on('ready', () => {
  redisAvailable = true;
  logger.info('Redis client ready');
});

const memoryStore = new Map<string, { value: string; expiresAt?: number }>();

function cleanupExpiredMemoryEntries() {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.expiresAt && now > entry.expiresAt) {
      memoryStore.delete(key);
    }
  }
}

export function isRedisAvailable(): boolean {
  return redisAvailable;
}

export function useMemoryStore(): boolean {
  // Never fall back in production: a per-process Map would silently split sessions,
  // OTP state and rate-limit counters across instances. Let Redis errors surface instead.
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.MOCK_MODE === 'true' || !redisAvailable;
}

export async function connectRedis(): Promise<boolean> {
  if (process.env.MOCK_MODE === 'true') {
    return false;
  }

  try {
    await redis.connect();
    await redis.ping();
    redisAvailable = true;
    return true;
  } catch (err) {
    redisAvailable = false;

    if (process.env.NODE_ENV === 'development') {
      logger.warn('Redis unavailable — falling back to in-memory store for sessions and cache', {
        error: (err as Error).message,
      });
      try {
        redis.disconnect();
      } catch {
        // ignore cleanup errors
      }
      return false;
    }

    throw err;
  }
}

export type KvOp =
  | { op: 'del'; key: string }
  | { op: 'setex'; key: string; ttl: number; value: string };

// KEYS[1] = guard, KEYS[2..] = op targets. ARGV[1] = expected guard value, then per op:
// 'del'  or  'setex', ttl, value
const COMPARE_AND_APPLY_LUA = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return 0 end
local a = 2
for k = 2, #KEYS do
  if ARGV[a] == 'del' then
    redis.call('DEL', KEYS[k])
    a = a + 1
  else
    redis.call('SETEX', KEYS[k], ARGV[a + 1], ARGV[a + 2])
    a = a + 3
  end
end
return 1
`;

/** Key-value store that uses Redis when available, otherwise in-memory. */
export const kvStore = {
  async setex(key: string, ttl: number, value: string): Promise<void> {
    if (useMemoryStore()) {
      memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      return;
    }
    await redis.setex(key, ttl, value);
  },

  async get(key: string): Promise<string | null> {
    if (useMemoryStore()) {
      cleanupExpiredMemoryEntries();
      const entry = memoryStore.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryStore.delete(key);
        return null;
      }
      return entry.value;
    }
    return redis.get(key);
  },

  async del(key: string): Promise<void> {
    if (useMemoryStore()) {
      memoryStore.delete(key);
      return;
    }
    await redis.del(key);
  },

  async incr(key: string): Promise<number> {
    if (useMemoryStore()) {
      const entry = memoryStore.get(key);
      const live = entry && !(entry.expiresAt && Date.now() > entry.expiresAt) ? entry : undefined;
      const next = parseInt(live?.value || '0', 10) + 1;
      // Keep the existing TTL, as Redis INCR does
      memoryStore.set(key, { value: String(next), expiresAt: live?.expiresAt });
      return next;
    }
    return redis.incr(key);
  },

  async expire(key: string, ttl: number): Promise<void> {
    if (useMemoryStore()) {
      const entry = memoryStore.get(key);
      if (entry) {
        memoryStore.set(key, { ...entry, expiresAt: Date.now() + ttl * 1000 });
      }
      return;
    }
    await redis.expire(key, ttl);
  },

  /**
   * INCR that always leaves the key with a TTL: sets `ttl` when the key has none (first hit, or
   * a counter left without one by a crash between INCR and EXPIRE). Atomic on Redis; no Redis 7
   * `EXPIRE NX` needed.
   */
  async incrWithTtl(key: string, ttl: number): Promise<number> {
    if (useMemoryStore()) {
      const entry = memoryStore.get(key);
      const live = entry && !(entry.expiresAt && Date.now() > entry.expiresAt) ? entry : undefined;
      const next = parseInt(live?.value || '0', 10) + 1;
      memoryStore.set(key, { value: String(next), expiresAt: live?.expiresAt ?? Date.now() + ttl * 1000 });
      return next;
    }
    const count = await redis.eval(
      "local c = redis.call('INCR', KEYS[1]) if redis.call('TTL', KEYS[1]) < 0 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end return c",
      1, key, ttl,
    );
    return Number(count);
  },

  /**
   * All-or-nothing: if `guardKey` currently equals `expected`, apply every op in order and return
   * true; otherwise change nothing and return false. One Lua script on Redis (the keys must share
   * a slot on a cluster), one synchronous block in memory, so no other command can interleave.
   */
  async compareAndApply(guardKey: string, expected: string, ops: KvOp[]): Promise<boolean> {
    if (useMemoryStore()) {
      const entry = memoryStore.get(guardKey);
      const live = entry && !(entry.expiresAt && Date.now() > entry.expiresAt) ? entry : undefined;
      if (!live || live.value !== expected) return false;
      for (const op of ops) {
        if (op.op === 'del') memoryStore.delete(op.key);
        else memoryStore.set(op.key, { value: op.value, expiresAt: Date.now() + op.ttl * 1000 });
      }
      return true;
    }
    const keys = [guardKey, ...ops.map((op) => op.key)];
    const args: Array<string | number> = [expected];
    for (const op of ops) {
      if (op.op === 'del') args.push('del');
      else args.push('setex', op.ttl, op.value);
    }
    const applied = await redis.eval(COMPARE_AND_APPLY_LUA, keys.length, ...keys, ...args);
    return applied === 1;
  },

  async mget(keys: string[]): Promise<Array<string | null>> {
    if (!keys.length) return [];
    if (useMemoryStore()) return Promise.all(keys.map((k) => kvStore.get(k)));
    return redis.mget(...keys);
  },

  async keys(pattern: string): Promise<string[]> {
    if (useMemoryStore()) {
      cleanupExpiredMemoryEntries();
      const prefix = pattern.replace('*', '');
      return Array.from(memoryStore.keys()).filter((k) => k.startsWith(prefix));
    }
    return redis.keys(pattern);
  },
};

// ─────────────────────────────────────────────
// Health Checks
// ─────────────────────────────────────────────

export async function checkDatabaseHealth(): Promise<boolean> {
  if (process.env.MOCK_MODE === 'true') return true;
  try {
    const result = await pool.query('SELECT 1 AS health');
    return result.rows[0]?.health === 1;
  } catch {
    return false;
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  if (process.env.MOCK_MODE === 'true' || useMemoryStore()) return true;
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
// Graceful Shutdown
// ─────────────────────────────────────────────

export async function closeConnections(): Promise<void> {
  logger.info('Closing database connections...');

  if (process.env.MOCK_MODE !== 'true') {
    await pool.end();
  }

  if (redisAvailable && redis.status !== 'end') {
    await redis.quit();
  }

  logger.info('All database connections closed');
}
