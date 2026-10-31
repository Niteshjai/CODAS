-- ─────────────────────────────────────────────────────
-- USER PREFERENCES (Account Settings)
--  * marketing communication consent is recorded explicitly (opt-in, off by default)
--    with the time it was last changed, as DPDP consent evidence
-- ─────────────────────────────────────────────────────

ALTER TABLE alert_preferences
  ADD COLUMN IF NOT EXISTS marketing_opt_in     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_updated_at TIMESTAMPTZ;
