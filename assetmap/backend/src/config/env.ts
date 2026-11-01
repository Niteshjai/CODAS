import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env explicitly if needed
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MOCK_MODE: z.enum(['true', 'false']).default('false'),
  REDIS_URL: z.string().optional(),
  // Postgres pool sizing/timeouts (read in db/connection.ts). Keep instances × PG_POOL_MAX
  // (+ b2b gateway + agent worker) under ~80% of the server's max_connections.
  PG_POOL_MAX: z.coerce.number().int().min(1).max(200).optional(),
  PG_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(0).optional(),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1000).optional(),
  // Application Insights (src/telemetry.ts); telemetry is off when unset
  APPLICATIONINSIGHTS_CONNECTION_STRING: z.string().optional(),
  APPINSIGHTS_SAMPLING_RATIO: z.coerce.number().min(0).max(1).optional(),
  // Start the in-process cron jobs and BullMQ workers (src/index.ts). Must be a slot-sticky
  // App Service setting: false on the staging slot, true (or unset) on production.
  RUN_BACKGROUND_JOBS: z.preprocess(v => (v === '' ? undefined : v), z.enum(['true', 'false']).default('true')),
  
  // Secrets
  COOKIE_SECRET: z.string().min(16, 'COOKIE_SECRET must be at least 16 characters long'),
  JWT_PRIVATE_KEY: z.string().min(100, 'JWT_PRIVATE_KEY must be provided').transform(val => val.replace(/\\n/g, '\n')),
  JWT_PUBLIC_KEY: z.string().min(100, 'JWT_PUBLIC_KEY must be provided').transform(val => val.replace(/\\n/g, '\n')),
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 hex characters (32 bytes)'),
  AADHAAR_SALT: z.string().min(16, 'AADHAAR_SALT must be at least 16 characters'),

  // External APIs
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_VERIFY_SERVICE_SID: z.string().optional(),

  SETU_CLIENT_ID: z.string().optional(),
  SETU_CLIENT_SECRET: z.string().optional(),
  
  RESEND_API_KEY: z.string().optional(),
  SUPPORT_INBOX_EMAIL: z.string().email().optional(),        // new support tickets are forwarded here
  SUPPORT_AI_ASSISTANT: z.enum(['true', 'false']).default('true'), // automated first reply (needs ANTHROPIC_API_KEY)
  ANTHROPIC_API_KEY: z.string().optional(),
  TERM_AFFILIATE_URL: z.string().optional(),
  HEALTH_AFFILIATE_URL: z.string().optional(),
  ZOHO_SIGN_TOKEN: z.string().optional(),
  UMANG_API_KEY: z.string().optional(),
  
  // Allowed Origins
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  UIDAI_PUBLIC_CERT: z.string().optional().transform(val => val ? val.replace(/\\n/g, '\n') : val),
}).refine(e => !(e.NODE_ENV === 'production' && e.MOCK_MODE === 'true'), {
  message: 'MOCK_MODE must not be enabled in production (it bypasses authentication)',
  path: ['MOCK_MODE'],
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:\n', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
