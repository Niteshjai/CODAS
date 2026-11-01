/**
 * AA transaction history for the scoring dimensions.
 *
 * The scorers were written against an `aa_transactions` table that no migration creates.
 * Account Aggregator transactions are stored in `transactions` (020 + 033):
 *   date TIMESTAMPTZ, narration TEXT, type 'CREDIT' | 'DEBIT', amount DECIMAL(15,2) in RUPEES
 *   (always positive since 033; older rows may carry a sign or 'CR'/'DR').
 *
 * This subquery maps those columns onto the names and units the scorers use:
 *   value_date       ← date
 *   description      ← narration ('' when absent, so ILIKE never sees NULL)
 *   transaction_type ← 'CREDIT' | 'DEBIT' (CR/DR and case normalised; anything else is NULL
 *                      and never matches a direction filter)
 *   amount_paise     ← ROUND(ABS(amount) * 100)::BIGINT (integer paise, like canonical_assets)
 *
 * Usage: `FROM ${USER_TRANSACTIONS_SQL} tx WHERE ...` with the user id as $1.
 */
export const USER_TRANSACTIONS_SQL = `(
  SELECT
    t.user_id,
    t.date                                              AS value_date,
    COALESCE(t.narration, '')                           AS description,
    CASE
      WHEN UPPER(t.type) IN ('CREDIT', 'CR') THEN 'CREDIT'
      WHEN UPPER(t.type) IN ('DEBIT',  'DR') THEN 'DEBIT'
    END                                                 AS transaction_type,
    ROUND(ABS(t.amount) * 100)::BIGINT                  AS amount_paise
  FROM transactions t
  WHERE t.user_id = $1
)`
