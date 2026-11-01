-- ─────────────────────────────────────────────
-- AssetMap AI Orchestration Agent — Database Tables
-- Migration 032 — schema for assetmap/agent-worker (also adds the
-- canonical_assets columns AssetMap's ancestral search and scoring use)
--
-- Runs against the AssetMap database (needs users, consents and,
-- optionally, land_records). Idempotent: safe to re-run, and safe on a
-- database where AssetMap migration 015 has already created a smaller
-- canonical_assets table — this migration extends that table instead of
-- failing on CREATE TABLE.
-- ─────────────────────────────────────────────

-- Shared helper (identical to AssetMap migration 004)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

-- ─────────────────────────────────────────────
-- AGENT RUN TRACKING
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_runs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id)
                        ON DELETE CASCADE,

  -- Trigger
  trigger_type          VARCHAR(30) NOT NULL CHECK (trigger_type IN (
                          'consent_granted', 'cron_scheduled',
                          'user_refresh', 'estate_case',
                          'manual_admin', 'webhook'
                        )),
  trigger_metadata      JSONB DEFAULT '{}',

  -- Status
  status                VARCHAR(20) NOT NULL DEFAULT 'queued'
                        CHECK (status IN (
                          'queued', 'running', 'completed',
                          'failed', 'partial', 'cancelled'
                        )),

  -- Steps tracking
  steps_completed       TEXT[] DEFAULT '{}',
  steps_failed          TEXT[] DEFAULT '{}',
  current_step          VARCHAR(100),

  -- Results summary
  sources_fetched       TEXT[] DEFAULT '{}',
  records_created       INTEGER DEFAULT 0,
  records_updated       INTEGER DEFAULT 0,
  records_deduplicated  INTEGER DEFAULT 0,
  anomalies_detected    INTEGER DEFAULT 0,
  alerts_triggered      INTEGER DEFAULT 0,

  -- AI usage
  ai_tokens_used        INTEGER DEFAULT 0,
  ai_calls_made         INTEGER DEFAULT 0,

  -- Timing
  queued_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  duration_ms           INTEGER,

  -- Error
  error_message         TEXT,
  error_stack           TEXT,

  -- Cost tracking
  estimated_cost_paise  INTEGER DEFAULT 0,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step-level audit log for each agent run.
-- output_summary holds counts/status only — never raw source data.
CREATE TABLE IF NOT EXISTS agent_run_steps (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id          UUID NOT NULL REFERENCES agent_runs(id)
                  ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  step_name       VARCHAR(100) NOT NULL,
  status          VARCHAR(20) CHECK (status IN (
                    'started', 'completed', 'failed', 'skipped'
                  )),
  input_summary   JSONB DEFAULT '{}',
  output_summary  JSONB DEFAULT '{}',
  duration_ms     INTEGER,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- CANONICAL UNIFIED ASSET TABLE
-- Base shape matches AssetMap migration 015; agent columns are added below.
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS canonical_assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_class           VARCHAR(50) NOT NULL,
  institution_name      VARCHAR(200) NOT NULL,
  account_ref_enc       TEXT,
  folio_number_enc      TEXT,
  has_nominee           BOOLEAN DEFAULT false,
  nominee_name_enc      TEXT,
  current_value_paise   BIGINT DEFAULT 0,
  digilocker_uri        TEXT,
  source                VARCHAR(50) DEFAULT 'AA',
  is_active             BOOLEAN DEFAULT true,
  last_synced_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Asset classes: union of the agent's classes and the ones AssetMap writes
-- (REAL_ESTATE from 015, AGRICULTURAL_LAND_MANUAL from ancestral search).
ALTER TABLE canonical_assets DROP CONSTRAINT IF EXISTS canonical_assets_asset_class_check;
ALTER TABLE canonical_assets ADD CONSTRAINT canonical_assets_asset_class_check
  CHECK (asset_class IN (
    'BANK_ACCOUNT', 'FIXED_DEPOSIT', 'MUTUAL_FUND', 'EQUITY', 'NPS',
    'INSURANCE_LIFE', 'INSURANCE_HEALTH', 'INSURANCE_OTHER',
    'LAND', 'PROPERTY', 'REAL_ESTATE', 'AGRICULTURAL_LAND_MANUAL',
    'EPF', 'PPF', 'BOND', 'GOLD', 'VEHICLE', 'UNCLAIMED', 'OTHER'
  ));

ALTER TABLE canonical_assets
  ADD COLUMN IF NOT EXISTS run_id                UUID REFERENCES agent_runs(id) ON DELETE SET NULL,

  -- Source tracking (nullable: rows written by AssetMap before this
  -- migration have no primary_source)
  ADD COLUMN IF NOT EXISTS primary_source        VARCHAR(30),
  ADD COLUMN IF NOT EXISTS secondary_sources     TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_record_ids     JSONB DEFAULT '{}',

  -- Institution
  ADD COLUMN IF NOT EXISTS institution_type      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS institution_ifsc      VARCHAR(20),

  -- Identity (encrypted)
  ADD COLUMN IF NOT EXISTS policy_number_enc     TEXT,

  -- Financial values (in paise, always integers)
  ADD COLUMN IF NOT EXISTS invested_value_paise  BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gain_loss_paise       BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gain_loss_pct         DECIMAL(8,4),
  ADD COLUMN IF NOT EXISTS currency              VARCHAR(5) DEFAULT 'INR',

  -- Asset metadata
  ADD COLUMN IF NOT EXISTS asset_name            VARCHAR(300),
  ADD COLUMN IF NOT EXISTS asset_subtype         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS quantity              DECIMAL(20,6),
  ADD COLUMN IF NOT EXISTS unit                  VARCHAR(20),

  -- Status flags
  ADD COLUMN IF NOT EXISTS is_dormant            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_status          VARCHAR(30),
  ADD COLUMN IF NOT EXISTS ownership_type        VARCHAR(30),

  -- Dates
  ADD COLUMN IF NOT EXISTS opened_date           DATE,
  ADD COLUMN IF NOT EXISTS maturity_date         DATE,
  ADD COLUMN IF NOT EXISTS last_transaction_date DATE,
  ADD COLUMN IF NOT EXISTS valuation_date        DATE,

  -- AI enrichment fields
  ADD COLUMN IF NOT EXISTS ai_category_label     VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ai_risk_level         VARCHAR(20),
  ADD COLUMN IF NOT EXISTS ai_liquidity_score    INTEGER,
  ADD COLUMN IF NOT EXISTS ai_anomaly_flag       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_anomaly_reason     TEXT,
  ADD COLUMN IF NOT EXISTS ai_recommendations    TEXT[],
  ADD COLUMN IF NOT EXISTS ai_summary            TEXT,
  ADD COLUMN IF NOT EXISTS ai_enriched_at        TIMESTAMPTZ,

  -- Deduplication
  ADD COLUMN IF NOT EXISTS dedup_hash            VARCHAR(64),
  ADD COLUMN IF NOT EXISTS is_duplicate          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canonical_record_id   UUID REFERENCES canonical_assets(id),

  -- Document links
  ADD COLUMN IF NOT EXISTS document_available    BOOLEAN DEFAULT false,

  -- Raw data (encrypted)
  ADD COLUMN IF NOT EXISTS raw_data_enc          TEXT,

  -- Sync metadata
  ADD COLUMN IF NOT EXISTS fetched_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS next_sync_at          TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  ADD COLUMN IF NOT EXISTS is_stale              BOOLEAN DEFAULT false;

ALTER TABLE canonical_assets DROP CONSTRAINT IF EXISTS canonical_assets_primary_source_check;
ALTER TABLE canonical_assets ADD CONSTRAINT canonical_assets_primary_source_check
  CHECK (primary_source IS NULL OR primary_source IN (
    'setu_aa', 'surepass', 'digilocker', 'iepf', 'epfo', 'mca21',
    'irdai', 'manual', 'ancestral_search'
  ));

ALTER TABLE canonical_assets DROP CONSTRAINT IF EXISTS canonical_assets_ai_risk_level_check;
ALTER TABLE canonical_assets ADD CONSTRAINT canonical_assets_ai_risk_level_check
  CHECK (ai_risk_level IS NULL OR ai_risk_level IN (
    'very_low', 'low', 'medium', 'high', 'very_high'
  ));

ALTER TABLE canonical_assets DROP CONSTRAINT IF EXISTS canonical_assets_ai_liquidity_score_check;
ALTER TABLE canonical_assets ADD CONSTRAINT canonical_assets_ai_liquidity_score_check
  CHECK (ai_liquidity_score IS NULL OR ai_liquidity_score BETWEEN 0 AND 100);

-- Upsert key. Must be a unique index on dedup_hash alone: both the agent
-- and AssetMap's ancestral search use ON CONFLICT (dedup_hash). Every
-- hash includes the user id, so global uniqueness is safe. The name
-- matches the constraint index an earlier version of this migration made,
-- so IF NOT EXISTS skips it when that already exists.
CREATE UNIQUE INDEX IF NOT EXISTS canonical_assets_dedup_hash_key
  ON canonical_assets(dedup_hash);

-- ─────────────────────────────────────────────
-- DEDUP TRACKING
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_dedup_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canonical_id      UUID REFERENCES canonical_assets(id) ON DELETE SET NULL,
  duplicate_source  VARCHAR(30),
  duplicate_ref     VARCHAR(200),
  merge_strategy    VARCHAR(50),
  merged_fields     TEXT[],
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ANOMALY LOG
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS asset_anomalies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id            UUID REFERENCES agent_runs(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canonical_id      UUID REFERENCES canonical_assets(id) ON DELETE SET NULL,
  anomaly_type      VARCHAR(50) CHECK (anomaly_type IN (
                      'sudden_balance_drop', 'new_unknown_account',
                      'land_mutation_detected', 'large_transaction',
                      'dormant_account_activated', 'value_spike',
                      'suspicious_pattern', 'duplicate_suspected'
                    )),
  severity          VARCHAR(20) CHECK (severity IN (
                      'info', 'warning', 'critical'
                    )),
  description       TEXT,
  ai_explanation    TEXT,
  is_resolved       BOOLEAN DEFAULT false,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_canonical_assets_user
  ON canonical_assets(user_id, asset_class, is_active);
CREATE INDEX IF NOT EXISTS idx_canonical_assets_stale
  ON canonical_assets(next_sync_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agent_runs_user
  ON agent_runs(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_run_steps_run
  ON agent_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_asset_anomalies_user
  ON asset_anomalies(user_id, is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_asset_anomalies_run
  ON asset_anomalies(run_id);

-- ─────────────────────────────────────────────
-- TRIGGERS
-- ─────────────────────────────────────────────

DROP TRIGGER IF EXISTS update_canonical_assets_updated_at ON canonical_assets;
CREATE TRIGGER update_canonical_assets_updated_at
  BEFORE UPDATE ON canonical_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (agent-owned tables only)
-- Same pattern as AssetMap's land_records: enforced for non-owner roles,
-- bypassed by the table owner the services connect as. canonical_assets
-- is owned by AssetMap (which does not enable RLS on it), so it is left alone.
-- current_setting(..., true) returns NULL instead of erroring when unset.
-- ─────────────────────────────────────────────

ALTER TABLE agent_runs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_run_steps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_anomalies     ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_runs_rls ON agent_runs;
CREATE POLICY agent_runs_rls ON agent_runs
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

DROP POLICY IF EXISTS agent_run_steps_rls ON agent_run_steps;
CREATE POLICY agent_run_steps_rls ON agent_run_steps
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);

DROP POLICY IF EXISTS agent_anomalies_rls ON asset_anomalies;
CREATE POLICY agent_anomalies_rls ON asset_anomalies
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::UUID);
