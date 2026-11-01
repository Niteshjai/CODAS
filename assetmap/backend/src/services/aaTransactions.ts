import { createHash } from 'crypto'
import type { PoolClient } from 'pg'

// Turns Account Aggregator FI data (ReBIT schema, as delivered by Setu) into rows for the
// `transactions` table, and stores them idempotently.
//
// Identity: an account's snapshot row (asset_snapshots_aa) is deleted and re-created on every
// refresh, so transactions are keyed by a stable `account_key` (ReBIT account type + FIP id +
// masked account number) and re-pointed to the newest snapshot id after each refresh. Duplicates across
// overlapping fetches are dropped by a unique (user_id, account_key, dedupe_key) index.

type Dict = Record<string, any>

export interface ParsedTransaction {
  txnId: string | null
  date: string            // ISO timestamp
  type: 'CREDIT' | 'DEBIT'
  amount: number          // rupees, positive
  balanceAfter: number | null
  narration: string | null
  reference: string | null
  mode: string | null
  dedupeKey: string
}

const MAX_TXNS_PER_ACCOUNT = 5000   // a 12-month savings history is typically 200–1,500
const MAX_RAW_TXNS = 50000          // hard bound on parsing work for an abusive payload
const INSERT_CHUNK = 500            // 13 params/row → well under Postgres' 65,535 limit
// ReBIT deposit types that say which way money moved. On a savings/current account (the only
// accounts whose transactions are stored) INTEREST is a real credit and TDS a real debit; the
// running balance depends on them, so dropping them would leave gaps in the history.
const CREDIT_TYPES = new Set(['CREDIT', 'CR', 'INTEREST'])
const DEBIT_TYPES = new Set(['DEBIT', 'DR', 'TDS'])
const DIRECTION_TYPES = new Set([...CREDIT_TYPES, ...DEBIT_TYPES])

const str = (v: unknown): string | null => {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s ? s : null
}
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const asArray = (v: unknown): Dict[] => (Array.isArray(v) ? v : v && typeof v === 'object' ? [v as Dict] : [])

/** The ReBIT `account` object wherever it sits in the payload. */
export function accountObject(raw: Dict): Dict {
  return raw?.data?.account ?? raw?.account ?? raw?.Account ?? raw ?? {}
}

/** Raw transaction entries, accepting the ReBIT JSON shape and a few common variants. */
export function rawTransactionList(raw: Dict): Dict[] {
  const account = accountObject(raw)
  const container = account.transactions ?? account.Transactions ?? raw?.transactions ?? raw?.Transactions
  if (Array.isArray(container)) return container
  return asArray(container?.transaction ?? container?.Transaction)
}

/**
 * Parse and validate transactions; malformed entries are skipped, never guessed.
 * Returns at most MAX_TXNS_PER_ACCOUNT entries, newest first, whatever order the FIP sent.
 */
export function parseTransactions(raw: Dict): ParsedTransaction[] {
  const out: ParsedTransaction[] = []
  // Only savings/current-style accounts have a spendable transaction history. Term/recurring
  // deposits report OPENING/INTEREST/TDS/CLOSING events, which are not money in or out.
  const acctType = String(accountObject(raw).type ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (acctType && !['deposit', 'savings', 'current', 'saving', 'sb', 'ca'].includes(acctType)) return out
  for (const t of rawTransactionList(raw).slice(0, MAX_RAW_TXNS)) {
    const rawAmount = num(t.amount)
    const when = str(t.transactionTimestamp ?? t.valueDate ?? t.txnDate ?? t.date)
    if (rawAmount === null || rawAmount === 0 || !when) continue
    const parsedDate = new Date(when)
    if (Number.isNaN(parsedDate.getTime())) continue

    // Only a direction type (or no type at all, then the sign) says which way money moved.
    // OPENING/CLOSING/INSTALLMENT/OTHERS, insurance PREMIUM_PAYMENT etc. are skipped rather than guessed.
    const declared = String(t.type ?? t.txnType ?? '').trim().toUpperCase()
    if (declared && !DIRECTION_TYPES.has(declared)) continue
    const type: 'CREDIT' | 'DEBIT' =
      CREDIT_TYPES.has(declared) ? 'CREDIT'
      : DEBIT_TYPES.has(declared) ? 'DEBIT'
      : rawAmount > 0 ? 'CREDIT' : 'DEBIT'
    const amount = Math.abs(rawAmount)
    const txnId = str(t.txnId ?? t.transactionId)
    const balanceAfter = num(t.currentBalance ?? t.balance ?? t.closingBalance)
    const narration = str(t.narration ?? t.description)
    const date = parsedDate.toISOString()

    // A bank's txnId is unique within the account. Without one, fingerprint the entry; the
    // running balance makes two genuinely different same-day, same-amount payments distinct.
    const dedupeKey = txnId
      ? `id:${txnId}`
      : 'h:' + createHash('sha256').update([date, type, amount.toFixed(2), narration ?? '', balanceAfter ?? ''].join('|')).digest('hex').slice(0, 40)

    out.push({
      txnId, date, type, amount, balanceAfter, narration,
      reference: str(t.reference ?? t.txnRef),
      mode: str(t.mode)?.toUpperCase().slice(0, 30) ?? null,
      dedupeKey,
    })
  }
  // ReBIT lists are oldest first: cap after sorting so the newest entries are the ones kept.
  // Dates are ISO strings from toISOString(), so string order is chronological.
  out.sort((a, b) => b.date.localeCompare(a.date))
  return out.length > MAX_TXNS_PER_ACCOUNT ? out.slice(0, MAX_TXNS_PER_ACCOUNT) : out
}

/**
 * The ReBIT nominee flag from profile.holders.holder[].nominee ("REGISTERED" / "NOT-REGISTERED").
 * null when the payload says nothing, so callers don't record "no nominee" for an unknown.
 */
export function nomineeFlagOf(raw: Dict): 'REGISTERED' | 'NOT_REGISTERED' | null {
  const holders = asArray(accountObject(raw)?.profile?.holders?.holder)
  for (const holder of holders) {
    const flag = String(holder?.nominee ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
    if (flag === 'REGISTERED' || flag === 'YES' || flag === 'Y') return 'REGISTERED'
    if (flag === 'NOT_REGISTERED' || flag === 'NO' || flag === 'N') return 'NOT_REGISTERED'
  }
  return null
}

/** Accounts in a Setu v2 session response whose data is still on its way (FIstatus PENDING). */
export function pendingAccountCount(body: Dict): number {
  return asArray(body?.fips ?? body?.Fips)
    .flatMap((fip) => asArray(fip.accounts ?? fip.Accounts))
    .filter((acc) => String(acc?.FIstatus ?? acc?.fiStatus ?? '').toUpperCase() === 'PENDING')
    .length
}

/** Copy of the payload without the transaction list (it now lives in the transactions table). */
export function withoutTransactions(raw: Dict): Dict {
  const clone = JSON.parse(JSON.stringify(raw ?? {}))
  for (const holder of [clone?.data?.account, clone?.account, clone?.Account, clone]) {
    if (holder && typeof holder === 'object') {
      delete holder.transactions
      delete holder.Transactions
    }
  }
  return clone
}

/**
 * Stable per-account identity across refreshes (no PII beyond the already-masked number).
 * Pass stable identifiers — the raw ReBIT account type and the FIP id — not display or mapped
 * values, so renaming an institution or remapping an FI type never re-keys stored history.
 */
export function accountKeyOf(accountType: string, institution: string, accountRef: string): string {
  return createHash('sha256').update(`${accountType}|${institution.trim().toLowerCase()}|${accountRef.trim().toUpperCase()}`).digest('hex')
}

/**
 * Insert new transactions for an account (duplicates ignored) and point the account's whole
 * history at its current snapshot id. Must run inside the caller's transaction.
 * Returns how many rows were newly inserted.
 */
export async function saveAccountTransactions(
  client: PoolClient,
  userId: string,
  accountId: string,
  accountKey: string,
  txns: ParsedTransaction[],
  currency = 'INR',
): Promise<number> {
  let inserted = 0
  for (let i = 0; i < txns.length; i += INSERT_CHUNK) {
    const chunk = txns.slice(i, i + INSERT_CHUNK)
    const values: unknown[] = []
    const rows = chunk.map((t, j) => {
      const b = j * 13
      values.push(accountId, userId, t.txnId, t.date, t.narration, t.type, t.amount, t.balanceAfter, currency, t.reference, t.mode, t.dedupeKey, accountKey)
      return `(${Array.from({ length: 13 }, (_, k) => `$${b + k + 1}`).join(', ')})`
    })
    const res = await client.query(
      `INSERT INTO transactions
         (account_id, user_id, txn_id, date, narration, type, amount, balance_after, currency, reference, mode, dedupe_key, account_key)
       VALUES ${rows.join(', ')}
       ON CONFLICT (user_id, account_key, dedupe_key) WHERE account_key IS NOT NULL AND dedupe_key IS NOT NULL
       DO NOTHING`,
      values,
    )
    inserted += res.rowCount ?? 0
  }
  await relinkAccountTransactions(client, userId, accountId, accountKey)
  return inserted
}

/** After a refresh re-creates the snapshot row, move the account's existing history onto it. */
export async function relinkAccountTransactions(client: PoolClient, userId: string, accountId: string, accountKey: string): Promise<void> {
  await client.query(
    'UPDATE transactions SET account_id = $1 WHERE user_id = $2 AND account_key = $3 AND account_id <> $1',
    [accountId, userId, accountKey],
  )
}

/**
 * Flatten a Setu FI-data response into per-account items. Accepts the v2 shape
 * ({ fips: [{ fipID, accounts: [{ linkRefNumber, maskedAccNumber, FIstatus, data: { account } }] }] })
 * and the flat array ({ data: [...] }) the code used before. Accounts whose data didn't arrive
 * (FIstatus FAILED/DENIED/TIMEOUT, data null) are skipped rather than stored as ₹0.
 */
export function flattenFiResponse(body: Dict): Dict[] {
  const fips = asArray(body?.fips ?? body?.Fips)
  if (fips.length) {
    const items: Dict[] = []
    for (const fip of fips) {
      for (const acc of asArray(fip.accounts ?? fip.Accounts)) {
        if (!acc?.data) continue
        items.push({ ...acc, fipID: acc.fipID ?? fip.fipID ?? fip.fipId })
      }
    }
    return items
  }
  return asArray(body?.data ?? body?.Payload ?? body?.payload)
}
