-- 033: store real Account Aggregator transactions idempotently.
--
-- asset_snapshots_aa rows are re-created on every refresh, so a transaction can't be identified
-- by account_id alone. account_key is a stable hash of (FI type, institution, masked account
-- number); dedupe_key is the bank's txnId (or a fingerprint when there is none). Re-fetching an
-- overlapping date range then inserts only genuinely new transactions.

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_key TEXT,
  ADD COLUMN IF NOT EXISTS dedupe_key  TEXT,
  ADD COLUMN IF NOT EXISTS mode        VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_user_account_dedupe
  ON transactions (user_id, account_key, dedupe_key)
  WHERE account_key IS NOT NULL AND dedupe_key IS NOT NULL;

-- Re-linking history to the newest snapshot after each refresh
CREATE INDEX IF NOT EXISTS idx_transactions_user_account_key
  ON transactions (user_id, account_key);

-- Account detail page: newest transactions of one account
CREATE INDEX IF NOT EXISTS idx_transactions_account_date
  ON transactions (account_id, date DESC);
