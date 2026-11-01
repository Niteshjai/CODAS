-- ─────────────────────────────────────────────────────
-- SPEND ANALYSER AI ORCHESTRATION
--  * Review queue: low-confidence classifications are flagged instead of silently guessed
--  * Idempotent classification of AA transactions (source_txn_id)
--  * Merchant memory provenance (seed / ai / user / crowd) + crowd votes for global promotion
--    (global rows only ever carry counts, never user ids)
--  * Needs profile: household context, priorities, bucket mapping and target split
--  * Insights: provenance (ai / template), evidence, stable fact keys, dismissal
--  * New audit actions for spend analysis
-- ─────────────────────────────────────────────────────

-- 1. Classified transactions: review queue + source link
ALTER TABLE classified_transactions
  ADD COLUMN IF NOT EXISTS needs_review   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_reason  TEXT,
  ADD COLUMN IF NOT EXISTS source_txn_id  UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_classified_tx_source
  ON classified_transactions(user_id, source_txn_id)
  WHERE source_txn_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classified_tx_review
  ON classified_transactions(user_id, transaction_date DESC)
  WHERE needs_review = true AND is_ignored = false;

CREATE INDEX IF NOT EXISTS idx_classified_tx_merchant
  ON classified_transactions(user_id, merchant_name);

-- 2. Merchant memory provenance + crowd agreement
ALTER TABLE merchant_category_map
  ADD COLUMN IF NOT EXISTS source          VARCHAR(10) NOT NULL DEFAULT 'seed',
  ADD COLUMN IF NOT EXISTS agreement_count INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'merchant_category_map_source_check') THEN
    ALTER TABLE merchant_category_map
      ADD CONSTRAINT merchant_category_map_source_check
      CHECK (source IN ('seed','ai','user','crowd'));
  END IF;
END $$;

-- Existing per-user rows came from either AI learning or user corrections
UPDATE merchant_category_map SET source = CASE WHEN confidence >= 100 THEN 'user' ELSE 'ai' END
 WHERE user_id IS NOT NULL AND source = 'seed';

CREATE INDEX IF NOT EXISTS idx_merchant_map_user_source
  ON merchant_category_map(user_id, source, last_seen_at DESC);

-- One vote per user per merchant (their latest correction). Deleted with the user.
CREATE TABLE IF NOT EXISTS merchant_category_votes (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_name  VARCHAR(300) NOT NULL,
  category       VARCHAR(50)  NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, merchant_name)
);
CREATE INDEX IF NOT EXISTS idx_merchant_votes_merchant
  ON merchant_category_votes(merchant_name, category);

-- Re-seed the curated global merchants (no-op where 018 already inserted them)
INSERT INTO merchant_category_map
  (user_id, merchant_name, category, subcategory, category_group, confidence, times_seen, user_confirmed, source)
VALUES
(null,'NETFLIX','SUBSCRIPTIONS','OTT','expense',100,1000,true,'seed'),
(null,'AMAZON PRIME','SUBSCRIPTIONS','OTT','expense',100,1000,true,'seed'),
(null,'HOTSTAR','SUBSCRIPTIONS','OTT','expense',100,1000,true,'seed'),
(null,'SPOTIFY','SUBSCRIPTIONS','Music','expense',100,1000,true,'seed'),
(null,'YOUTUBE PREMIUM','SUBSCRIPTIONS','Music','expense',100,1000,true,'seed'),
(null,'GOOGLE ONE','SUBSCRIPTIONS','Cloud','expense',100,1000,true,'seed'),
(null,'SWIGGY','FOOD','Delivery','expense',100,1000,true,'seed'),
(null,'ZOMATO','FOOD','Delivery','expense',100,1000,true,'seed'),
(null,'BIGBASKET','FOOD','Groceries','expense',100,1000,true,'seed'),
(null,'BLINKIT','FOOD','Groceries','expense',100,1000,true,'seed'),
(null,'ZEPTO','FOOD','Groceries','expense',100,1000,true,'seed'),
(null,'DMART','FOOD','Groceries','expense',100,1000,true,'seed'),
(null,'STARBUCKS','FOOD','Cafe','expense',100,1000,true,'seed'),
(null,'AIRTEL','RECHARGE','Mobile','expense',95,1000,true,'seed'),
(null,'JIO','RECHARGE','Mobile','expense',95,1000,true,'seed'),
(null,'TATA PLAY','RECHARGE','DTH','expense',100,1000,true,'seed'),
(null,'HDFC LIFE','INSURANCE','Life','expense',100,1000,true,'seed'),
(null,'STAR HEALTH','INSURANCE','Health','expense',100,1000,true,'seed'),
(null,'IRCTC','TRAVEL','Train','expense',100,1000,true,'seed'),
(null,'INDIGO','TRAVEL','Flight','expense',100,1000,true,'seed'),
(null,'UBER','TRAVEL','Cab','expense',100,1000,true,'seed'),
(null,'OLA','TRAVEL','Cab','expense',100,1000,true,'seed'),
(null,'RAPIDO','TRAVEL','Cab','expense',100,1000,true,'seed'),
(null,'AMAZON','SHOPPING','Online','expense',90,1000,true,'seed'),
(null,'FLIPKART','SHOPPING','Online','expense',100,1000,true,'seed'),
(null,'MYNTRA','SHOPPING','Clothing','expense',100,1000,true,'seed'),
(null,'APOLLO','HEALTH','Pharmacy','expense',90,1000,true,'seed'),
(null,'PHARMEASY','HEALTH','Pharmacy','expense',100,1000,true,'seed'),
(null,'BOOKMYSHOW','PARTY','Events','expense',100,1000,true,'seed'),
(null,'ZERODHA','INVESTMENTS','Stocks','expense',90,1000,true,'seed'),
(null,'GROWW','INVESTMENTS','MF/Stocks','expense',90,1000,true,'seed'),
(null,'HPCL','TRAVEL','Fuel','expense',100,1000,true,'seed'),
(null,'BPCL','TRAVEL','Fuel','expense',100,1000,true,'seed'),
(null,'INDIANOIL','TRAVEL','Fuel','expense',100,1000,true,'seed')
ON CONFLICT (user_id, merchant_name) DO NOTHING;

-- 3. Needs profile (what matters to this user)
CREATE TABLE IF NOT EXISTS spend_needs_profiles (
  user_id               UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  household_size        INTEGER CHECK (household_size BETWEEN 1 AND 20),
  city_tier             VARCHAR(10) CHECK (city_tier IN ('metro','tier1','tier2','tier3')),
  income_band           VARCHAR(10) CHECK (income_band IN ('lt_25k','25k_50k','50k_1l','1l_2l','2l_5l','gt_5l')),
  priorities            TEXT[] NOT NULL DEFAULT '{}',
  goals_note_encrypted  TEXT,            -- free text may contain PII: AES-256-GCM via encryptPII
  target_needs_pct      INTEGER NOT NULL DEFAULT 50,
  target_wants_pct      INTEGER NOT NULL DEFAULT 30,
  target_savings_pct    INTEGER NOT NULL DEFAULT 20,
  bucket_overrides      JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { "FOOD": "needs", "FOOD:Delivery": "wants" }
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT spend_needs_profiles_split_check CHECK (
    target_needs_pct BETWEEN 0 AND 100 AND target_wants_pct BETWEEN 0 AND 100
    AND target_savings_pct BETWEEN 0 AND 100
    AND target_needs_pct + target_wants_pct + target_savings_pct = 100
  )
);

-- 4. Insights: provenance, evidence, stable fact keys, dismissal
ALTER TABLE spend_insights
  ADD COLUMN IF NOT EXISTS generated_by  VARCHAR(10) NOT NULL DEFAULT 'template',
  ADD COLUMN IF NOT EXISTS evidence      JSONB,
  ADD COLUMN IF NOT EXISTS fact_key      VARCHAR(160),
  ADD COLUMN IF NOT EXISTS priority      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dismissed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'spend_insights_generated_by_check') THEN
    ALTER TABLE spend_insights
      ADD CONSTRAINT spend_insights_generated_by_check
      CHECK (generated_by IN ('ai','template'));
  END IF;
END $$;

UPDATE spend_insights
   SET fact_key = insight_type || ':' || COALESCE(category, '') || ':' || id::text
 WHERE fact_key IS NULL;

-- Several facts of one type can share a category (e.g. two subscriptions), so uniqueness moves to fact_key
ALTER TABLE spend_insights DROP CONSTRAINT IF EXISTS spend_insights_user_id_month_insight_type_category_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_spend_insights_fact
  ON spend_insights(user_id, month, fact_key);

-- 5. Audit actions
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'SPEND_ANALYSIS_RUN';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'SPEND_CATEGORY_CORRECTED';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'SPEND_PROFILE_UPDATED';
