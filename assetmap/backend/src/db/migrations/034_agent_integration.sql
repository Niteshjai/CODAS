-- 034: wire the asset-orchestration agent (assetmap/agent-worker) into AssetMap.
--
-- * The backend now enqueues agent runs when new data lands (AA refresh, land fetch, unclaimed
--   search) or the user asks for a rescan. At most ONE queued run per user: a burst of triggers
--   collapses into the queued run, which reads the latest stored data when it starts.
-- * Anomalies are de-duplicated by fingerprint, so a condition seen on every run is one row
--   (with last_seen_at/occurrences), not a new alert per run.
-- * Audit actions for agent runs.

-- Collapse any existing duplicate queued runs before adding the unique index
UPDATE agent_runs r
   SET status = 'cancelled', completed_at = NOW(), error_message = 'Superseded by a newer queued run'
 WHERE r.status = 'queued'
   AND EXISTS (
     SELECT 1 FROM agent_runs n
      WHERE n.user_id = r.user_id AND n.status = 'queued'
        AND (n.created_at, n.id) > (r.created_at, r.id)
   );

CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_runs_one_queued_per_user
  ON agent_runs (user_id) WHERE status = 'queued';

-- 'data_updated': the backend stored new source data for the user (AA refresh, land, unclaimed)
ALTER TABLE agent_runs DROP CONSTRAINT IF EXISTS agent_runs_trigger_type_check;
ALTER TABLE agent_runs ADD CONSTRAINT agent_runs_trigger_type_check CHECK (trigger_type IN (
  'consent_granted', 'cron_scheduled', 'user_refresh', 'estate_case',
  'manual_admin', 'webhook', 'data_updated'
));

-- Latest run per user, for the status endpoint
CREATE INDEX IF NOT EXISTS idx_agent_runs_user_created
  ON agent_runs (user_id, created_at DESC);

-- Anomaly de-duplication
ALTER TABLE asset_anomalies
  ADD COLUMN IF NOT EXISTS fingerprint  TEXT,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS occurrences  INTEGER NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_anomalies_user_fingerprint
  ON asset_anomalies (user_id, fingerprint) WHERE fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_anomalies_user_open
  ON asset_anomalies (user_id, last_seen_at DESC) WHERE is_resolved = false;

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'AGENT_RUN_REQUESTED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'AGENT_RUN_COMPLETED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'AGENT_RUN_FAILED';
