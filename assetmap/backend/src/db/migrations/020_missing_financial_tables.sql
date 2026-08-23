-- Missing Financial Tables (Phase 2 additions used by models)

CREATE TABLE IF NOT EXISTS financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_id UUID REFERENCES consents(id) ON DELETE SET NULL,
  fi_type fi_type NOT NULL,
  institution_name VARCHAR(255) NOT NULL,
  account_ref_encrypted TEXT NOT NULL,
  account_type VARCHAR(100),
  holder_name_encrypted TEXT,
  ifsc_code VARCHAR(20),
  branch VARCHAR(255),
  nominee_encrypted TEXT,
  balance_encrypted TEXT NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status VARCHAR(50),
  opened_at TIMESTAMPTZ,
  maturity_date TIMESTAMPTZ,
  raw_json_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_accounts_user_id ON financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_consent_id ON financial_accounts(consent_id);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  txn_id VARCHAR(255),
  date TIMESTAMPTZ NOT NULL,
  narration TEXT,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  category VARCHAR(100),
  reference VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);

CREATE TABLE IF NOT EXISTS investment_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES financial_accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(100),
  scheme_name VARCHAR(255),
  units DECIMAL(15, 4),
  nav DECIMAL(15, 4),
  cost_basis DECIMAL(15, 2),
  current_value DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'INR',
  holding_type VARCHAR(100),
  folio_number VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_holdings_account_id ON investment_holdings(account_id);
CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);
