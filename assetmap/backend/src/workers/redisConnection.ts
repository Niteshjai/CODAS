// BullMQ connection options shared by the queue workers.
// BullMQ needs maxRetriesPerRequest: null; rediss:// URLs (e.g. Azure Cache for Redis) need TLS.
export function getRedisConnection() {
  if (process.env.NODE_ENV !== 'development' && process.env.REDIS_URL) {
    try {
      const u = new URL(process.env.REDIS_URL);
      return {
        host: u.hostname,
        port: parseInt(u.port || '6379', 10),
        password: u.password ? decodeURIComponent(u.password) : undefined,
        username: u.username ? decodeURIComponent(u.username) : undefined,
        tls: u.protocol === 'rediss:' ? { servername: u.hostname } : undefined,
        maxRetriesPerRequest: null,
      };
    } catch {}
  }
  return {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    maxRetriesPerRequest: null,
  };
}

// Keep Redis from growing without bound while retaining recent failures for debugging
export const JOB_RETENTION = {
  removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
  removeOnFail: { age: 7 * 24 * 60 * 60 },
};
