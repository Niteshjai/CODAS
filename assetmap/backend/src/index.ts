// Telemetry must load first so it can instrument fastify/pg/ioredis/winston as they are imported
import { flushTelemetry } from './telemetry';
import 'dotenv/config';
import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';

import { pool, redis, checkDatabaseHealth, checkRedisHealth, closeConnections, connectRedis } from './db/connection';
import { normalizeIp } from './utils/clientIp';
import { logger } from './utils/logger';
import cron from 'node-cron';
import { isShuttingDown, markShuttingDown, runClosers } from './utils/lifecycle';
import { errorResponse, successResponse, ERROR_CODES } from './utils/constants';
import { env } from './config/env';

// Route imports
import authRoutes from './routes/auth';
import consentRoutes from './routes/consent';
import assetRoutes from './routes/assets';
import estateRoutes from './routes/estate';
import reportRoutes from './routes/reports';
import { landRoutes } from './routes/land';
import { engagementRoutes } from './routes/alerts';
import { startLandSyncWorker } from './workers/landSyncWorker';
import { startAssetChangeWorker } from './workers/assetChangeWorker';
import { startNetWorthSnapshotWorker } from './workers/netWorthSnapshotWorker';
import { runUnclaimedSyncWorker } from './workers/unclaimedSyncWorker';
import { insuranceRoutes } from './routes/insurance';
import { unclaimedRoutes } from './routes/unclaimed';
import { recoveryRoutes } from './routes/recovery';
import { willRoutes } from './routes/will';
import { loanRoutes } from './routes/loan';
import logsRoutes from './routes/logs';
import { plansRoutes } from './routes/plans';
import { supportRoutes } from './routes/support';
import { nomineeRoutes } from './routes/nominee';
import { spendAnalyticsRoutes } from './routes/spend';
import { familyRoutes } from './routes/family';
import { settingsRoutes } from './routes/settings';
import { scoringRoutes } from './routes/scoring';
import { manualRoutes } from './routes/manual';
// import { startNomineeWorker } from './workers/nomineeQueue';
import { startStatusSweeper } from './cron/statusSweeper';
import { startNomineeVerificationWorker } from './workers/nomineeVerificationWorker';
import { startClassifierWorker } from './workers/classifierWorker';
import { startFamilySnapshotWorker } from './workers/familySnapshotWorker';
import { ancestralRoutes } from './routes/ancestral';
import { startAncestralSearchWorker } from './workers/ancestralSearchWorker';
import { twoFactorRoutes } from './routes/twoFactor';
import { notificationsRoutes } from './routes/notifications';
import { agentRoutes } from './routes/agent';
import { startTwoFactorSweeper } from './cron/twoFactorSweeper';
import { verifyAccessToken, requireRole } from './middleware/auth';

const TRUST_PROXY_HOPS = parseInt(process.env.TRUST_PROXY_HOPS || (process.env.NODE_ENV === 'production' ? '1' : '0'), 10) || 0;

const app = Fastify({
  // Behind Azure App Service / a load balancer, trust exactly N proxy hops so request.ip
  // is the real client (rate limits, audit IPs) and spoofed X-Forwarded-For entries are ignored.
  trustProxy: (_address: string, hop: number) => hop < TRUST_PROXY_HOPS,
  logger: {
    level: 'info',
    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          // NEVER log Authorization header or any PII
        };
      }
    }
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);

import fastifyCookie from '@fastify/cookie';

declare module 'fastify' {
  interface FastifyInstance {
    // Other decorators if any
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string;
      role: string;
      sessionId: string;
      type: string;
      twoFactorVerified?: boolean;
    };
    user: {
      id: string;
      role: string;
      sessionId: string;
      twoFactorVerified?: boolean;
    };
  }
}

async function registerPlugins() {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    }
  });

  await app.register(cors, { 
    origin: env.FRONTEND_URL, 
    credentials: true,
    exposedHeaders: ['x-access-token', 'x-refresh-token']
  });
  // General per-IP limit. In production the counters live in Redis so every instance shares
  // them; if Redis is briefly unreachable requests are allowed rather than failed.
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (req) => normalizeIp(req.ip) ?? req.ip,
    ...(process.env.NODE_ENV === 'production' ? { redis, skipOnError: true, nameSpace: 'rl:' } : {}),
  });

  await app.register(fastifyCookie, {
    secret: env.COOKIE_SECRET, // for cookie signature
    hook: 'onRequest'
  });

  await app.register(jwt, {
    secret: { private: env.JWT_PRIVATE_KEY, public: env.JWT_PUBLIC_KEY },
    sign: { algorithm: 'RS256' },
    verify: { algorithms: ['RS256'] },
    cookie: {
      cookieName: 'access_token',
      signed: false,
    },
  });

  await app.register(multipart, { limits: { fileSize: 10 * 1024 * 1024 } });
}

// Global error handler
app.setErrorHandler((err, request, reply) => {
  const error = err as Record<string, any>;
  if (error.validation) {
    reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, error.message));
    return;
  }
  // Handle empty JSON body errors from Fastify's parser
  if (error.message?.includes('Body cannot be empty')) {
    reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, 'Request body is required'));
    return;
  }
  // Client errors raised by Fastify/plugins (429 rate limit, 413 too large, 415, 404…) keep their
  // status — otherwise every rate-limited request surfaced as a 500 "something went wrong"
  const status = Number(error.statusCode);
  if (status >= 400 && status < 500) {
    const message = status === 429
      ? 'Too many requests. Please wait a moment and try again.'
      : (typeof error.message === 'string' && error.message) || 'Request could not be processed';
    reply.status(status).send(errorResponse(status === 429 ? ERROR_CODES.RATE_LIMITED : ERROR_CODES.VALIDATION_ERROR, message));
    return;
  }
  logger.error('Unhandled error', { error: error.stack || error.message });
  reply.status(500).send(errorResponse(ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred'));
});

// Many route catch blocks return `(error as Error).message` with a 500, which leaks driver,
// SQL and upstream-API text to clients. Replace any 5xx message with a generic one (the
// original is logged); 4xx messages are authored for users and pass through unchanged.
app.addHook('onSend', async (request, reply, payload) => {
  if (reply.statusCode < 500 || typeof payload !== 'string') return payload;
  try {
    const body = JSON.parse(payload);
    if (body?.error && typeof body.error === 'object' && body.error.message) {
      logger.error('5xx response', { url: request.url.split('?')[0], status: reply.statusCode, error: body.error.message });
      body.error.message = 'Something went wrong. Please try again.';
      return JSON.stringify(body);
    }
  } catch {
    // non-JSON payload: leave as is
  }
  return payload;
});

// Liveness: is the process up? No dependency checks, so a DB/Redis blip doesn't make the
// platform restart every instance at once. Point the App Service health check here.
app.get('/api/health/live', async (_request, reply) => {
  reply.status(isShuttingDown() ? 503 : 200).send(successResponse({ status: isShuttingDown() ? 'shutting_down' : 'alive' }));
});

// Readiness: can this instance serve traffic right now? 503 while draining or when a dependency is down.
app.get('/api/health', async (request, reply) => {
  if (isShuttingDown()) {
    return reply.status(503).send(successResponse({ status: 'shutting_down', timestamp: new Date().toISOString() }));
  }
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(),
  ]);

  const status = dbHealthy && redisHealthy ? 200 : 503;

  reply.status(status).send(
    successResponse({
      status: status === 200 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        redis: redisHealthy ? 'connected' : 'disconnected',
      },
      // waiting > 0 for long means the pool is saturated (slow queries or too small PG_POOL_MAX)
      dbPool: { total: pool.totalCount, idle: pool.idleCount, waiting: pool.waitingCount },
    })
  );
});

// API Routes
async function registerRoutes() {
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(consentRoutes, { prefix: '/api/consent' });
  await app.register(assetRoutes, { prefix: '/api/assets' });
  await app.register(landRoutes, { prefix: '/api/assets' });
  await app.register(estateRoutes, { prefix: '/api/estate' });
  await app.register(reportRoutes, { prefix: '/api/reports' });
  await app.register(engagementRoutes, { prefix: '/api/engagement' });
  await app.register(insuranceRoutes, { prefix: '/api/insurance' });
  await app.register(unclaimedRoutes, { prefix: '/api/unclaimed' });
  await app.register(scoringRoutes, { prefix: '/api/scoring' });
  await app.register(recoveryRoutes, { prefix: '/api/recovery' });
  await app.register(willRoutes, { prefix: '/api/will' });
  await app.register(loanRoutes, { prefix: '/api/loan' });
  await app.register(logsRoutes, { prefix: '/api/logs' });
  await app.register(plansRoutes); // Prefix is defined inside plans.ts as /api/...
  await app.register(supportRoutes, { prefix: '/api/support' });
  await app.register(nomineeRoutes, { prefix: '/api/nominee' });
  await app.register(spendAnalyticsRoutes, { prefix: '/api/spend' });
  await app.register(familyRoutes, { prefix: '/api/family' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(manualRoutes, { prefix: '/api/manual' });
  await app.register(ancestralRoutes);
  await app.register(twoFactorRoutes);
  await app.register(notificationsRoutes, { prefix: '/api/notifications' });
  await app.register(agentRoutes, { prefix: '/api/agent' });

  app.post('/api/admin/run-migration', {
    preHandler: [verifyAccessToken, requireRole('admin')],
  }, async (req, reply) => {
    const fs = require('fs');
    const path = require('path');
    const sql = fs.readFileSync(path.join(__dirname, 'db', 'migrations', '011_plans_billing.sql'), 'utf-8');
    await pool.query(sql);
    return { success: true };
  });
}

async function startServer(): Promise<void> {
  try {
    await registerPlugins();
    await registerRoutes();

    if (process.env.MOCK_MODE === 'true') {
      logger.info('Running in MOCK_MODE. Bypassing PostgreSQL and Redis connections.');
      // Actually we still need Postgres for mock mode because we query it. 
      // The original code was bypassing Postgres for mock mode but we shouldn't bypass it.
      await pool.query('SELECT 1');
      logger.info('PostgreSQL connection established for MOCK_MODE');

      // Ensure mock user exists to prevent foreign key violations (e.g. net worth history)
      await pool.query(`
        INSERT INTO users (id, name_encrypted, registered_at)
        VALUES ('00000000-0000-4000-a000-000000000001', 'Mock User', NOW())
        ON CONFLICT (id) DO NOTHING
      `);

      const redisConnected = await connectRedis();
      if (redisConnected) {
        logger.info('Redis connection established');
      }
    } else {
      await pool.query('SELECT 1');
      logger.info('PostgreSQL connection established');

      const redisConnected = await connectRedis();
      if (redisConnected) {
        logger.info('Redis connection established');
      }
    }

    // Cron sweepers and BullMQ workers. RUN_BACKGROUND_JOBS is a slot-sticky App Service setting:
    // false on the staging slot so the warming-up release, and the old release left there after a
    // swap, never run jobs (duplicate alerts, paid lookups, feed entries) against production data.
    if (env.RUN_BACKGROUND_JOBS === 'true') {
      startLandSyncWorker(pool);
      startAssetChangeWorker(pool);
      startNetWorthSnapshotWorker(pool);
      runUnclaimedSyncWorker(pool);
      // startNomineeWorker();
      startStatusSweeper();
      startNomineeVerificationWorker();
      startClassifierWorker(pool);
      startFamilySnapshotWorker(pool);
      startAncestralSearchWorker(pool);
      startTwoFactorSweeper();
    } else {
      logger.info('RUN_BACKGROUND_JOBS=false — cron jobs and queue workers are not started on this instance');
    }

    await app.listen({ port: PORT, host: '0.0.0.0' });
    logger.info(`AssetMap backend running on port ${PORT}`);
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    await flushTelemetry();
    process.exit(1);
  }
}

const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS || '25000', 10);

// Deploys send SIGTERM. Drain instead of dropping work: stop accepting requests and let in-flight
// ones finish, stop scheduling cron runs, let BullMQ jobs finish, then close DB/Redis.
async function gracefulShutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown()) return;
  markShuttingDown();
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // The final telemetry flush is bounded (see telemetry.ts), so worst case is SHUTDOWN_TIMEOUT_MS
  // plus a few seconds — keep that under the platform's SIGTERM→SIGKILL grace period.
  const force = setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit', { timeoutMs: SHUTDOWN_TIMEOUT_MS });
    void flushTelemetry().finally(() => process.exit(1));
  }, SHUTDOWN_TIMEOUT_MS);
  force.unref();

  try {
    for (const task of cron.getTasks().values()) task.stop();
    await app.close();               // waits for in-flight HTTP requests
    await runClosers();              // BullMQ workers finish their current job
    await closeConnections();
    logger.info('Shutdown complete');
  } catch (err) {
    logger.error('Error during shutdown', { error: (err as Error).message });
    exitCode = 1;
  }
  await flushTelemetry();            // export the last batched spans/logs, including this shutdown's
  process.exit(exitCode);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// A stray rejected promise should be logged, not crash every in-flight request.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { error: reason instanceof Error ? reason.message : String(reason) });
});
// After an uncaught exception the process state is unknown: drain and exit so the platform restarts it.
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception — shutting down', { error: err.message, stack: err.stack });
  void gracefulShutdown('uncaughtException', 1);
});

startServer();

export default app;
