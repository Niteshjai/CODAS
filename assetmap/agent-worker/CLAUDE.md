# CLAUDE.md — assetmap/agent-worker

Guidance for this package. The repo-wide rules in the root `CLAUDE.md` and `AGENTS.md` also apply.

## What this is

The asset-orchestration worker for **AssetMap** (package `assetmap-agent-worker`). It is a headless BullMQ worker with no HTTP server, and it runs as its own process separate from `../backend`. For each run it reads the data the backend has already stored for a user, normalises it into `canonical_assets`, deduplicates it, enriches it (with Claude when available) and upserts it.

**The backend owns every external call.** It fetches and stores Setu AA data (`asset_snapshots_aa`, `transactions`), land records (`land_records`) and unclaimed-asset findings (`unclaimed_assets_found`). The worker never calls Setu, Zoop/Surepass, IEPF/EPFO or MCA. It decrypts those tables with the shared `ENCRYPTION_KEY`. DigiLocker and MCA21 have no backend storage and stay disabled unless `AGENT_ENABLE_EXTERNAL_SOURCES=true`.

The worker shares the backend's Postgres and Redis. It reads `users` (`*_encrypted` only), `consents`, the three source tables above, and `agent_runs`. It writes `canonical_assets`, `agent_runs`, `agent_run_steps`, `asset_dedup_log`, `asset_anomalies` and `audit_logs`. Backend code reads and writes agent columns too. For example, `ancestral/ancestralSearch.ts` inserts with `ON CONFLICT (dedup_hash)`, the nominee verifier sets `has_nominee`, and `scoring/` reads `ai_anomaly_flag` and `title_status`. Check both packages before you change a shared column, constraint or index.

This is a separate npm package (ESM, `"type": "module"`), unlike the backend (CommonJS). It does not import from `../backend`. Its `utils/encryption.ts` uses the same AES-256-GCM format as the backend's `encryptPII`, so keep the two compatible. An empty ciphertext segment (`iv:tag:`) decrypts to `''`.

## Commands

All commands run from `assetmap/agent-worker/`:

```bash
npm install
npm run dev        # tsx watch, loads .env if present
npm run typecheck  # tsc --noEmit
npm run build      # esbuild bundle -> dist/index.js (dependencies stay external)
npm start          # node dist/index.js (loads .env if present)
docker build -t assetmap-agent-worker .   # multi-stage, node:22-alpine, non-root
```

There is no lint or test setup. Node ≥ 22 is required.

- `src/index.ts` validates `DATABASE_URL`, `REDIS_URL` and the 64-hex-character `ENCRYPTION_KEY` **before** it dynamically imports anything that connects. It then checks that migrations 032 and 034 are applied. Keep connection setup lazy: use `getPool()` / `getRedis()` from `db/connections.ts`, not module-level `new Pool()` / `new Redis()`.
- `ANTHROPIC_API_KEY` is optional. Without it the worker starts in deterministic mode and warns once.
- In local dev, `REDIS_URL` must point at the Redis the backend actually uses: `redis://127.0.0.1:6379`. In development the backend ignores its own `REDIS_URL` and uses `REDIS_HOST`/`REDIS_PORT`.
- `.env.example` lists every variable the code reads.
- **Schema** lives with the backend's migrations: `032_agent_orchestration.sql` and `034_agent_integration.sql`. 034 adds the one-queued-run-per-user index, anomaly fingerprints and the `AGENT_RUN_*` audit actions. Put future agent schema changes in a new numbered backend migration, following the root CLAUDE.md migration steps.
- Health: the worker rewrites `AGENT_HEARTBEAT_FILE` (default `/tmp/agent-worker.heartbeat`) every 30s, but only while its workers run and Postgres and Redis answer. The Docker `HEALTHCHECK` passes when the file's mtime is under 2 minutes.
- Shutdown on SIGTERM/SIGINT: the worker stops taking jobs and finishes the current run, capped at 25s (then it forces the close and BullMQ re-runs the stalled job later). It then closes the queues, the pool and Redis.

## Queue contract (shared with the backend producer, `backend/src/agent/agentRuns.ts`)

- Queue `asset-orchestration`, job name `run`, **jobId = runId = `agent_runs.id`**.
- Job data is `{ runId, userId, triggerType }` **only**, with no PII in Redis. The worker loads and decrypts the profile at run time (`agent/runContext.ts`).
- Job options are `AGENT_JOB_OPTIONS` in `agent/queue/agentQueue.ts`: 3 attempts, exponential 5s backoff, `removeOnComplete: true`, failed jobs kept 7 days. The backend must use the same options.
- Enqueue (`enqueueAgentRun`) inserts `agent_runs ... ON CONFLICT (user_id) WHERE status = 'queued' DO NOTHING`. If no row comes back, the user already has a queued run, and the call returns `{ runId: <that run>, deduped: true }` without adding a job. It re-adds the job only if the job is missing from Redis. If `add` throws, the row is set to `failed` ('Enqueue failed').
- `trigger_type` is one of: `consent_granted`, `data_updated`, `user_refresh`, `cron_scheduled` or `manual_admin`. `trigger_metadata` holds no PII.

## Run lifecycle (`agent/queue/agentWorker.ts`)

- **One run per user.** A session-level `pg_try_advisory_lock(hashtext('agent-run:'||userId))` is held on a dedicated pool connection, and all of the run's queries use that connection. If the lock is busy, the job is moved back to delayed (15s, via `DelayedError`, which does not use up an attempt) for up to 30 minutes after it was queued. After that, a busy lock counts as a failed attempt.
- **Attempt start:** the status becomes `running`, counters reset, and `trigger_metadata.attempt` is set. The worker also deletes this run's `agent_run_steps` and `asset_dedup_log` rows from earlier attempts.
- **Attempt failure with attempts left:** the status goes back to `queued`. If another run is already queued for the user, the unique index rejects that update. The run is then marked `cancelled` ('Superseded') and retrying stops (`UnrecoverableError`).
- **Final failure:** the status becomes `failed` with a bounded `error_message` and no stack, and the worker writes audit `AGENT_RUN_FAILED`.
- **Success:** the status becomes `completed` or `partial`, and the worker writes audit `AGENT_RUN_COMPLETED`. The metadata holds counts and source names only. The completion update runs outside the failure path.
- **`partial`** means a source failed, or AI enrichment fell back to defaults (no key, rejected key, or API errors). Skipped sources don't count as failures.

## Pipeline (`agent/orchestrator.ts`)

- Claude is optional. When it is available, the routing model (`ANTHROPIC_MODEL`, default `claude-haiku-5-5`) only chooses which step runs next. **All identity and data live server-side in `RunState`.** Tool inputs are ignored, and tool results are counts only.
- Any Claude error ends the model loop, and `completePipeline()` runs the remaining steps deterministically. A 401/403 also disables AI for the rest of the process (`agent/ai.ts`). A run never fails because of AI.
- The SDK client is set to a 30s timeout and 2 retries. `ai_calls_made` and `ai_tokens_used` count successful calls only.
- **Steps:** load sources → `normalise_data` → `deduplicate_data` → `enrich_with_ai` → `inject_to_database`.
  - Each step requires the previous one, and a new load invalidates downstream results.
  - Enrichment uses `ANTHROPIC_ENRICH_MODEL` (default `claude-sonnet-5-5`). It sends Claude batches of 25 non-identifying fields and falls back to defaults per batch.
- **Sources** (`agent/loaders/`), keyed by source:
  - `setu_aa` (`aaSnapshots.ts`) reads snapshots of the user's ACTIVE consents. It decrypts the account ref, balance and raw payload, and unwraps `data.account` the way the backend's `aaTransactions.accountObject` does. When the payload has no value (dev mock rows), it uses `balance_encrypted`. If the user has consents but none are ACTIVE, the load succeeds with 0 accounts, which deactivates their AA assets. A user with no consent at all is skipped.
  - `surepass` (`landRecords.ts`) reads active `land_records` and decrypts `*_enc`. The value comes from `estimated_value_paise`.
  - `iepf_epfo` (`unclaimed.ts`) reads `unclaimed_assets_found`. It keeps the newest row per holding, drops claimed rows and the manual-check placeholders, and writes `primary_source` as `iepf`, `epfo` or `irdai`.
  - `digilocker` and `mca21` use external fetchers (`tools/fetchDocuments.ts`, `tools/fetchMCAData.ts`) and run only with `AGENT_ENABLE_EXTERNAL_SOURCES=true`.
  - A row that fails to decrypt is skipped, and its source is reported `failed` so its unseen assets are not deactivated.
- **Adding a source** means adding a loader, a `FETCH_TOOLS` entry, a `runFetch()` case, `FETCH_TOOL_SOURCE`, `PRIMARY_SOURCES_BY_SOURCE` (in `injectToDatabase.ts`), and `DB_SOURCES` or `EXTERNAL_SOURCES`.
- The worker does **not** send nominee or dormant alerts or compute net worth. The backend owns those (nomineeChecker and dormantAccountFinder in `accountAggregator`, and the net-worth snapshot cron).
- **Scheduler** (`agent/queue/agentScheduler.ts`, `schedulerWorker.ts`) runs one job, a daily catch-up at 03:30 Asia/Kolkata.
  - On startup it removes every other repeatable (including the old 02:00, 6-hourly and weekly jobs).
  - It enqueues `cron_scheduled` runs for users who meet all of these: they have source data, they have no queued or running run, and either they have had no completed or partial run in 7 days or their source data is newer than their last finished run.
  - It enqueues at most `AGENT_CATCHUP_MAX_USERS` users per tick.
  - It also marks runs stuck in `running` for over 2h as `failed`.

## canonical_assets write rules (`tools/injectToDatabase.ts`)

- Each asset is upserted on `dedup_hash` in one transaction on the run's connection. The upsert refuses to update a row owned by another user.
- `has_nominee` is never downgraded from TRUE (the backend's nominee verifier sets it). `nominee_name_enc` is merged with `COALESCE`.
- The legacy `source` column is written equal to `primary_source`.
- `title_status` and `ownership_type` are normalised to the backend's lower-case enums:
  - `title_status`: `clear`, `dispute`, `mutation_pending`, `encumbered` or `unknown`
  - `ownership_type`: `self`, `inherited`, `joint`, `disputed` or `unknown`
- **Deactivation:** for each source that loaded successfully in this run, the user's rows with that source's `primary_source` values that this run did not write are set `is_active = false`. Rows from other sources, and from failed or skipped sources, are never touched.
- **Anomalies** are upserted on `(user_id, fingerprint)`, where fingerprint = `sha256(userId|type|dedup_hash)`. The upsert sets `canonical_id`, `last_seen_at` and `occurrences` (a retry of the same run doesn't count twice) and keeps `is_resolved`.

## Data and security conventions

- PII and identifiers are stored encrypted in `*_enc` columns via `utils/encryption.ts`. This covers account refs, policy, folio and member numbers, nominee names, survey, khasra and plot numbers, and raw payloads. Never write them in plaintext columns such as `asset_name`, `source_record_ids` or `agent_run_steps`. Never send them to the model, and never log them.
- `dedup_hash` (`tools/normaliseData.ts`) always includes the user ID and is **globally unique**. If you change the recipe, existing rows will no longer match, so plan a backfill.
- Monetary values are **integers in paise**.
- RLS is enabled on the agent tables using the same pattern as `land_records`. The services connect as the table owner, so RLS is bypassed for them.
