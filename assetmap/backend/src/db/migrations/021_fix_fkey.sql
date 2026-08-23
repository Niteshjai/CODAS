-- Fix foreign key constraint on transactions

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_account_id_fkey;
-- Don't add a strict constraint because the ID could come from financial_accounts OR asset_snapshots_aa

ALTER TABLE investment_holdings DROP CONSTRAINT IF EXISTS investment_holdings_account_id_fkey;
