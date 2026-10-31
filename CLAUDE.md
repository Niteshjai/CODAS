# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

AssetMap is an Aadhaar-linked asset discovery platform for India: users verify via Aadhaar OKYC, grant Account Aggregator (Setu) consent, and get a unified view of financial and land assets plus engagement features (alerts, nominee checks/updates, dormant accounts, net worth, recovery, wills, loans, family vault). See `AGENTS.md` for style/commit conventions and `ARCHITECTURE.md` for the system diagram.

## Repository layout

Three independent npm packages, no workspace tooling — run `npm install` and commands inside each:

- `assetmap/backend/` — Fastify API (CommonJS, `tsx` for dev)
- `assetmap/frontend/` — React 19 + Vite SPA (Tailwind v4, Zustand, Radix/shadcn primitives in `src/components/ui/`)
- `b2b_gateway/` — separate partner-facing Fastify service (ESM / `NodeNext`, so relative imports need `.js` extensions)

There is **no `python-service/`** directory despite references in README, ARCHITECTURE, and `assetmap/.github/copilot-instructions.md`; it is commented out in `docker-compose.yml`.

## Commands

```bash
# Infra (Postgres 15 + Redis 7 + backend + frontend)
cd assetmap && docker-compose up -d

# Backend (port 3000)
cd assetmap/backend
npm run dev          # tsx watch --env-file=.env src/index.ts
npm run typecheck
npm run build        # tsc -> dist/
npm test             # tsx tests/runAllTests.ts (needs DB + Redis reachable via .env)
npm run seed:dev     # seed_dev_env.ts
npm run tunnel       # smee proxy for Setu consent webhook -> /api/consent/callback

# Frontend (port 5173)
cd assetmap/frontend
npm run dev
npm run lint         # oxlint
npm run build        # tsc -b && vite build

# B2B gateway (port 3001, requires JWT_SECRET)
cd b2b_gateway
npm run dev
npm run typecheck
npm test             # node:test via tsx --test, only wealthManagerTransform.test.ts
```

### Backend tests

The backend uses a custom, dependency-free harness (`tests/testFramework.ts`), not Jest/Vitest. Each `*.test.ts` exports a `registerXxxTests()` function that must be imported and called in `tests/runAllTests.ts` — a new test file is not picked up automatically. There is no CLI filter; to run a single suite, temporarily comment out the other `register*` calls in `runAllTests.ts`. The runner imports the real `pool`/`kvStore` from `src/db/connection`, so Postgres and Redis must be up.

Frontend has no test runner.

## Backend architecture

- **Entry point** `src/index.ts`: registers plugins (helmet, CORS, rate-limit, cookie, JWT, multipart), a global error handler, then every route module in `registerRoutes()` with an explicit `/api/*` prefix. Exceptions: `plansRoutes`, `ancestralRoutes`, and `twoFactorRoutes` declare their own prefixes internally. After startup it launches all background workers (`src/workers/*`) and cron sweepers (`src/cron/*`) in-process — there is no separate worker process.
- **Env** is validated with Zod in `src/config/env.ts`; missing/invalid critical config calls `process.exit(1)`. New config must be added to the schema and `.env.example` together.
- **Response envelope**: every response is `{ success, data?, error?: { code, message } }` — use `successResponse` / `errorResponse` and `ERROR_CODES` from `src/utils/constants.ts`.
- **Auth**: RS256 JWT in an httpOnly `access_token` cookie, validated against Redis-backed sessions (`src/services/sessionStore.ts`, `src/middleware/auth.ts` exports `verifyAccessToken` / `requireRole`). 2FA (TOTP, OTP, backup codes, trusted devices) lives in `src/auth/`. Plan-gated features are enforced by `src/plans/planEnforcer.ts` (returns 402).
- **MOCK_MODE=true** bypasses JWT verification in the auth middleware, injects a fixed mock user, and alters startup (`index.ts`) and several models. Preserve this path when touching auth or models. Separately, `NODE_ENV=development` makes external integrations (UIDAI OKYC, Setu AA, Surepass) return mock data; any 6-digit OTP is accepted.
- **Data access**: raw SQL via the `pg` pool in `src/db/connection.ts` (no ORM). PII must go through `encryptPII` / `decryptPII` (AES-256-GCM) in `src/utils/encryption.ts`; Aadhaar/mobile/email are stored only as salted hashes (`hashAadhaar`, `hashMobile`, `hashEmail`). Never store raw Aadhaar. Sensitive actions must write to the append-only audit log (`src/services/auditLogger.ts`) using a valid `audit_action` enum value — adding an action may require a migration that extends the enum.
- **Domain modules** sit beside `services/` as feature directories (`nominee/`, `recovery/`, `ancestral/`, `classifier/`, `scoring/`, `family/`, `manual/`, `billing/`). `src/nominee/nomineeOrchestrator.ts` drives nominee updates tracked in `nominee_update_batches` / `nominee_update_tasks`; UI status should reflect in-progress tasks from that table, not just the static `nominee_status`. `canonical_assets` is the central per-user asset table.

### Migrations

There is no migration runner. `src/db/schema.sql` plus each file in `src/db/migrations/` is mounted explicitly into Postgres's `docker-entrypoint-initdb.d` by `assetmap/docker-compose.yml`, so it only runs on a **fresh** volume. When adding a migration:
1. Create a new numerically prefixed `.sql` file (don't edit applied ones).
2. Add a matching volume line to `docker-compose.yml` in order.
3. Apply it manually to existing databases (e.g. `psql`). Ad-hoc scripts like `backend/run_migration.js` contain hardcoded local credentials and are not a general tool.

The root of `assetmap/backend/` contains many one-off debug/seed scripts (`check.js`, `debug_land.js`, `fix_fi_types.js`, `test_*.ts`, etc.); they are not part of the app or test suite.

## Frontend architecture

- `src/App.tsx` bootstraps the session once via `getSession()` and gates protected routes on `authChecked`.
- All backend calls go through `src/services/api.ts`: it sends `credentials: 'include'`, on 401 refreshes via `/auth/refresh` once while queueing concurrent requests (`failedQueue`), and dispatches an `upgrade-required` window event on 402. Base URL is `VITE_API_URL`.
- Global state is in Zustand stores under `src/store/`; `assetStore` persists to `sessionStorage` (including `authUser`). Prefer these stores over duplicating state locally.

## B2B gateway

Standalone service (`src/server.ts`) for partners: API-key auth (`src/b2b/auth/apiKeyManager.ts`), sliding-window rate limiting in Redis, per-partner response transforms (`src/b2b/transforms/` — NBFC, insurance, law firm, HR/payroll, wealth manager), and BullMQ webhook delivery (`src/b2b/webhooks/`). It shares the backend's Postgres via `DATABASE_URL`; its tables come from the backend migration `009_b2b_api.sql`. Its JWT plugin uses a shared-secret `JWT_SECRET` (HS256), unlike the backend's RS256 keys.

## Deployment

`.github/workflows/azure-deploy.yml` runs on every push to `main`: the backend Docker image goes to GHCR → Azure Web App, and the frontend goes to Azure Static Web Apps. There is no CI test/lint gate, so run checks locally before pushing to `main`. The gateway is not deployed by CI.
