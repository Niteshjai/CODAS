-- ─────────────────────────────────────────────────────
-- NOTIFICATION CENTER
-- Per-user read / dismiss / snooze state for items in the in-app
-- notification feed that are not rows of their own (live "needs action"
-- items and account activity). user_alerts keeps its own is_read flag.
--
-- item_key is the feed item id, e.g. 'action:nominee:3f9a0c1d2e4b'. Keys for
-- live items embed a fingerprint of the underlying condition, so a dismissed
-- item only comes back when that condition changes.
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_state (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key        VARCHAR(200) NOT NULL,
  read_at         TIMESTAMPTZ,
  dismissed_at    TIMESTAMPTZ,
  snoozed_until   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_notification_state_user ON notification_state(user_id, updated_at DESC);
