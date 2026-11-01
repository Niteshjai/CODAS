import type { Queryable } from '../../db/types'
import { decryptOptional } from '../../utils/encryption'
import { toNumber } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Account Aggregator loader (source key `setu_aa`)
//
// The backend owns every Setu call: accountAggregator.fetchFinancialData stores
// one asset_snapshots_aa row per account (encrypted masked account ref, balance
// and the raw FI payload). This loader reads the snapshots of the user's ACTIVE
// consents and rebuilds the flattened account objects aaDataNormaliser expects
// ({ fiType, fipName, maskedAccNumber, linkRefNumber, summary, profile, transactions }).
//
// Stored raw shapes (raw_json_encrypted):
//  - real Setu v2:  { linkRefNumber, maskedAccNumber, FIstatus, fipID, data: { account: {...} } }
//  - older flat:    { fipName, maskedAccNumber, summary, ... }
//  - dev mocks:     { type: 'SAVINGS', status, profile: { holders: ... } } — no summary,
//                   so the value comes from balance_encrypted.
// ─────────────────────────────────────────────

interface SnapshotRow {
  id:                    string
  fi_type:               string
  institution_name:      string | null
  account_ref_encrypted: string | null
  balance_encrypted:     string | null
  raw_json_encrypted:    string | null
  currency:              string | null
  fetched_at:            Date
  last_txn_at:           Date | null
}

export interface AALoadResult {
  success:  boolean
  skipped?: boolean
  error?:   string
  accounts: any[]
  metadata: { snapshots: number; activeConsents: number; undecryptable: number }
}

/** Same unwrapping as the backend's aaTransactions.accountObject. */
function accountObject(raw: any): any {
  return raw?.data?.account ?? raw?.account ?? raw?.Account ?? raw ?? {}
}

/** Raw ReBIT / Setu types the normaliser distinguishes beyond the stored fi_type enum. */
const SPECIFIC_FI_TYPES = new Set([
  'TERM_DEPOSIT', 'RECURRING_DEPOSIT', 'PPF', 'BONDS', 'GOVT_SECURITIES',
  'SOVEREIGN_GOLD_BOND', 'SGB', 'GOLD',
])

function fiTypeOf(row: SnapshotRow, raw: any, account: any): string {
  const candidates = [raw?.fiType, account?.type, raw?.type]
    .map(t => String(t ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_'))
  const specific = candidates.find(t => SPECIFIC_FI_TYPES.has(t))
  return specific ?? row.fi_type
}

function transactionsOf(account: any): any[] {
  const container = account?.transactions ?? account?.Transactions
  if (Array.isArray(container)) return container
  const list = container?.transaction ?? container?.Transaction
  return Array.isArray(list) ? list : list ? [list] : []
}

function toAccount(row: SnapshotRow): any {
  const raw       = JSON.parse(decryptOptional(row.raw_json_encrypted) || '{}')
  const account   = accountObject(raw)
  const maskedRef = decryptOptional(row.account_ref_encrypted) ||
                    raw?.maskedAccNumber || account?.maskedAccNumber || undefined
  const balance   = toNumber(decryptOptional(row.balance_encrypted))
  const summary   = { ...(account?.summary ?? raw?.summary ?? {}) }

  // Dev mock rows (and some FIPs) carry no value in the payload: use the stored balance
  if (summary.currentValue == null && summary.currentBalance == null && balance !== undefined) {
    summary.currentBalance = balance
  }
  if (!summary.currency && row.currency) summary.currency = row.currency

  const transactions = transactionsOf(account)
  if (transactions.length === 0 && row.last_txn_at) {
    // Bank transactions live in the transactions table (the backend strips them from
    // the payload); pass the latest date through for the dormancy check.
    summary.lastTransactionDate = summary.lastTransactionDate ?? row.last_txn_at.toISOString()
  }

  // The backend's mock insurance rows say { type: 'LIFE' }: keep it as a policy-type hint
  const fiType = fiTypeOf(row, raw, account)
  const policyType = account?.policyType ?? summary.policyType ??
    (fiType === 'INSURANCE_POLICIES' ? account?.type : undefined)

  return {
    ...account,
    fiType,
    policyType,
    fipId:           raw?.fipID ?? raw?.fipId,
    fipName:         row.institution_name || raw?.fipName || raw?.fipID || undefined,
    maskedAccNumber: maskedRef,
    linkRefNumber:   raw?.linkRefNumber ?? account?.linkedAccRef,
    summary,
    transactions,
  }
}

export async function loadAASnapshots(db: Queryable, userId: string): Promise<AALoadResult> {
  const consents = await db.query<{ active: string; total: string }>(`
    SELECT COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active, COUNT(*) AS total
    FROM consents WHERE user_id = $1
  `, [userId])
  const activeConsents = Number(consents.rows[0]?.active ?? 0)
  const totalConsents  = Number(consents.rows[0]?.total ?? 0)

  if (totalConsents === 0) {
    return {
      success: false, skipped: true, error: 'No AA consent for this user',
      accounts: [], metadata: { snapshots: 0, activeConsents: 0, undecryptable: 0 },
    }
  }

  // Revoked / expired consents contribute nothing: the user's current AA data is the
  // empty set, so their old accounts get deactivated by the inject step.
  const res = await db.query<SnapshotRow>(`
    SELECT s.id, s.fi_type::text AS fi_type, s.institution_name,
           s.account_ref_encrypted, s.balance_encrypted, s.raw_json_encrypted,
           s.currency, s.fetched_at,
           (SELECT MAX(t.date) FROM transactions t
             WHERE t.user_id = s.user_id AND t.account_id = s.id) AS last_txn_at
    FROM asset_snapshots_aa s
    JOIN consents c ON c.id = s.consent_id
    WHERE s.user_id = $1 AND c.user_id = $1 AND c.status = 'ACTIVE'
    ORDER BY s.fetched_at DESC, s.id
  `, [userId])

  const accounts: any[] = []
  let undecryptable = 0
  for (const row of res.rows) {
    try {
      accounts.push(toAccount(row))
    } catch {
      // One bad row must not fail the run; never log the ciphertext or payload
      undecryptable++
    }
  }

  const metadata = { snapshots: res.rows.length, activeConsents, undecryptable }
  if (undecryptable > 0) {
    // Report the source as failed so its unseen assets are not deactivated
    return {
      success: false,
      error:   `${undecryptable} of ${res.rows.length} AA snapshots could not be decrypted`,
      accounts, metadata,
    }
  }
  return { success: true, accounts, metadata }
}
