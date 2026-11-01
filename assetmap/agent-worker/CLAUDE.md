# CLAUDE.md — assetmap/agent-worker

Guidance for this package. The repo-wide rules in the root `CLAUDE.md` and `AGENTS.md` also apply.

## What this is

The AI orchestration agent for **AssetMap** (package `assetmap-agent-worker`). It is a headless BullMQ worker, with no HTTP server, and runs as its own process separate from `../backend`. For each user it runs a Claude tool-use loop that pulls asset data from Indian sources (Setu Account Aggregator, Surepass land records, DigiLocker, IEPF/EPFO unclaimed assets, MCA21). It then normalises the data into one canonical schema, deduplicates it, enriches it with a second Claude call, and upserts it into Postgres.

It shares the backend's Postgres and Redis. It reads `users` (PII only as `*_encrypted` columns), `consents` and `land_records`, and it shares `canonical_assets` with the backend. Backend code reads and writes agent columns too (e.g. `ancestral/ancestralSearch.ts` inserts with `ON CONFLICT (dedup_hash)`, and `scoring/` reads `ai_anomaly_flag`). Check both packages before you change a shared column, constraint or index.

This is a separate npm package (ESM, `"type": "module"`, run with `tsx`), unlike the backend (CommonJS). It does not import from `../backend`. Its `utils/encryption.ts` uses the same AES-256-GCM format as the backend's `encryptPII`, so keep the two compatible.

## Commands

All commands run from `assetmap/agent-worker/`:

```bash
npm install
npm run dev        # tsx watch, loads .env if present
npm start
npm run typecheck  # tsc --noEmit (the only check; there is no build, lint, or test setup)
```

- `src/index.ts` checks the required env and the 64-hex-character `ENCRYPTION_KEY` **before** it dynamically imports anything that connects. Keep connection setup lazy: use `getPool()` / `getRedis()` from `db/connections.ts`, not module-level `new Pool()` / `new Redis()`.
- `ENCRYPTION_KEY` must be the same key AssetMap uses, because the scheduler decrypts `users.name_encrypted` / `pan_encrypted`.
- `.env.example` lists every variable the code reads.
- **Schema** lives with the backend's migrations: `../backend/src/db/migrations/032_agent_orchestration.sql`, mounted in `../docker-compose.yml`. It can be re-run safely and extends `canonical_assets` from migration 015 rather than recreating it. Existing databases need it applied by hand with `psql`. Put future agent schema changes in a new numbered migration there, following the root CLAUDE.md migration steps.
- The worker is not in `docker-compose.yml` and not deployed by CI. Run it yourself against the compose Postgres/Redis.

## Architecture

```
schedulerWorker (cron, IST) ──► enqueueAgentRun() ──► BullMQ "asset-orchestration" ──► agentWorker ──► runOrchestrationAgent()
                                   │ inserts agent_runs row; runId = BullMQ jobId (retries reuse it)
```

- **`agent/queue/`**
  - `agentScheduler.ts` defines the repeatable jobs: daily refresh at 02:00, stale-asset sync every 6h, and weekly estate check Sunday 03:00, all in `Asia/Kolkata`.
  - `schedulerWorker.ts` decrypts each user's name and PAN, attaches their ACTIVE consent and the state from their latest land record, and skips users who already have a queued/running run.
  - Nothing starts on import. `index.ts` calls `startAgentWorker()` / `startSchedulerWorker()`.
- **`agent/orchestrator.ts`**: the model only chooses which step runs next. **All identity (userId, consentId, PAN, name, state, runId) and all data payloads live server-side in `RunState`.** Tool inputs never carry them, and tool results sent back to Claude are counts/status only (no raw PII).
  - Each step requires the previous one (normalise → dedup → enrich → inject), and a new fetch invalidates downstream results.
  - Fetch tools in one turn run concurrently.
  - If the model stops early (`end_turn`, `max_tokens`, `refusal`, step limit), `completePipeline()` finishes the remaining steps deterministically.
  - The run ends `completed`, or `partial` if a source failed or enrichment fell back to defaults. Skipped sources (no consent, no PAN, no state, DigiLocker not linked) don't count as failures.
  - Adding a tool means updating `AGENT_TOOLS`, `executeTool()`, and, for fetches, `FETCH_TOOL_SOURCE`.
- **Source keys** are `setu_aa`, `surepass`, `digilocker`, `iepf_epfo`, `mca21` (`ALL_SOURCES` in `schemas/canonicalAsset.ts`). `sourcesToFetch` also accepts the aliases `iepf`/`epfo`.
- **`agent/tools/`** holds one file per tool.
  - `fetchAAData` uses Setu FIU **v2** (`/v2/sessions`, lowercase `dataRange`, `x-product-instance-id`), the same API AssetMap's `services/accountAggregator.ts` calls, and flattens `fips[].accounts[].data.account`.
  - `enrichWithAI` sends assets to Claude in batches of 25 and falls back to default enrichment per batch on any error.
  - `injectToDatabase` builds its INSERT from one column list. Every value bound for a typed column goes through `utils/sanitize.ts` (`toIsoDate` handles Indian DD-MM-YYYY; strings are truncated to their VARCHAR size; numeric fields are made NaN-safe).
- **`agent/schemas/canonicalAsset.ts`** holds the Zod schemas and enums. Monetary values are **integers in paise**.
- **`services/`** are still stubs: `auditLogger`, `alertService` and `netWorthTracker` only log, and alerts fire on every run.
- The model is `ANTHROPIC_MODEL`, default `claude-sonnet-4-6`.

## Data and security conventions

- PII/identifiers (account ref, policy/folio number, nominee name, raw payloads) are stored encrypted in `*_enc` columns via `utils/encryption.ts` (AES-256-GCM, `iv:authTag:ciphertext` hex, the same format as AssetMap's `encryptPII`). Never write them in plaintext, never put them in `agent_run_steps`, and never send them to the model.
- `dedup_hash` (`tools/normaliseData.ts`) always includes the user ID and is **globally unique**, because AssetMap relies on `ON CONFLICT (dedup_hash)`. The upsert also refuses to update a row that belongs to a different user. If you change the hash recipe, existing rows will no longer match, so plan a backfill.
- RLS is enabled on the agent tables using the same pattern as AssetMap's `land_records`. The services connect as the table owner, so RLS is bypassed for them.
