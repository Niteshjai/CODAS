import { createHash } from 'crypto'
import type { Queryable } from '../../db/types'
import { decryptOptional } from '../../utils/encryption'
import { toNumber } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Unclaimed-assets loader (source key `iepf_epfo`)
//
// The backend owns the IEPF / EPFO / IRDAI searches (unclaimedAssets.runSearch,
// plan-gated) and stores each hit in unclaimed_assets_found. Every search
// inserts fresh rows, so the same holding appears once per search; this loader
// keeps the newest row per (source, company, folio). Claimed rows are left out
// (no longer unclaimed), as are the "check your PF balance manually" placeholders
// (amount 0, no folio).
// Output shape: { iepf: { records }, epfo: { accounts, pension }, irdai: { records } }
// for unclaimedNormaliser.
// ─────────────────────────────────────────────

interface UnclaimedRow {
  id:               string
  source:           string
  asset_type:       string | null
  company_name:     string | null
  folio_number_enc: string | null
  amount_paise:     string | null
  claim_url:        string | null
  is_claimed:       boolean | null
  created_at:       Date
}

export interface UnclaimedLoadResult {
  success:  boolean
  error?:   string
  iepf:     { records: any[] }
  epfo:     { accounts: any[]; pension: any[] }
  irdai:    { records: any[] }
  metadata: { rows: number; kept: number; undecryptable: number }
}

/** Opaque, stable per-holding reference (no folio/member id in plaintext columns). */
function stableRef(source: string, company: string, folio: string): string {
  return createHash('sha256').update(`${source}|${company.trim().toLowerCase()}|${folio.trim()}`).digest('hex').slice(0, 24)
}

export async function loadUnclaimed(db: Queryable, userId: string): Promise<UnclaimedLoadResult> {
  const res = await db.query<UnclaimedRow>(`
    SELECT id, source, asset_type, company_name, folio_number_enc,
           amount_paise, claim_url, is_claimed, created_at
    FROM unclaimed_assets_found
    WHERE user_id = $1
    ORDER BY created_at DESC, id
  `, [userId])

  const out: UnclaimedLoadResult = {
    success: true,
    iepf:  { records: [] },
    epfo:  { accounts: [], pension: [] },
    irdai: { records: [] },
    metadata: { rows: res.rows.length, kept: 0, undecryptable: 0 },
  }

  const seen = new Set<string>()
  for (const row of res.rows) {
    let folio: string
    try {
      folio = decryptOptional(row.folio_number_enc) ?? ''
    } catch {
      out.metadata.undecryptable++
      continue
    }

    const source  = String(row.source ?? '').toLowerCase()
    const company = row.company_name ?? ''
    const ref     = stableRef(source, company, folio)
    // Newest first, so the first row seen per holding wins (a later claim marks it claimed)
    if (seen.has(ref)) continue
    seen.add(ref)
    if (row.is_claimed) continue

    const amount = (toNumber(row.amount_paise) ?? 0) / 100
    if (amount <= 0 && !folio) continue // manual-check placeholder, not an asset

    const common = {
      source_ref:   ref,
      company_name: company || undefined,
      amount,
      asset_type:   row.asset_type ?? undefined,
      claim_url:    row.claim_url ?? undefined,
      found_at:     row.created_at.toISOString(),
    }

    if (source === 'iepf') {
      out.iepf.records.push({ ...common, type: 'UNCLAIMED_DIVIDEND', reference_number: ref, folio_number: folio || undefined })
    } else if (source === 'epfo') {
      out.epfo.accounts.push({
        ...common,
        establishment_name: company || undefined,
        total_balance:      amount,
        uan:                folio || undefined,
        account_type:       'unclaimed_pf',
      })
    } else if (source.startsWith('irdai')) {
      out.irdai.records.push({ ...common, policy_number: folio || undefined })
    } else {
      continue
    }
    out.metadata.kept++
  }

  if (out.metadata.undecryptable > 0) {
    out.success = false
    out.error   = `${out.metadata.undecryptable} of ${res.rows.length} unclaimed rows could not be decrypted`
  }
  return out
}
