import { Pool } from 'pg'
import axios     from 'axios'

// ─────────────────────────────────────────────
// Fetch AA Data Tool
// Calls Setu Account Aggregator (FIU v2 API) to fetch
// financial data across all FI types. Mirrors the request
// shape used by AssetMap's services/accountAggregator.ts.
// ─────────────────────────────────────────────

interface FetchAAParams {
  userId:     string
  consentId:  string
  fiTypes?:   string[]
}

const DEFAULT_FI_TYPES = [
  'DEPOSIT', 'MUTUAL_FUND', 'EQUITY',
  'NPS', 'INSURANCE_POLICIES'
]

/** FI types that should pass a filter on their parent type. */
const FI_TYPE_FAMILY: Record<string, string> = {
  TERM_DEPOSIT:      'DEPOSIT',
  RECURRING_DEPOSIT: 'DEPOSIT',
  EQUITIES:          'EQUITY',
  MUTUAL_FUNDS:      'MUTUAL_FUND',
}

const POLL_INTERVAL_MS = 3000
const MAX_POLLS        = 10

/**
 * Setu v2 returns `fips[].accounts[].data.account{ type, profile, summary, transactions }`.
 * Flatten it into one object per account so the normaliser sees a single shape.
 * Older/flat payloads (`accounts`, `fipData`, `data`) are passed through.
 */
function flattenAccounts(body: any): any[] {
  if (Array.isArray(body?.fips)) {
    return body.fips.flatMap((fip: any) =>
      (Array.isArray(fip?.accounts) ? fip.accounts : []).map((acc: any) => {
        const account = acc?.data?.account ?? {}
        const txns    = account.transactions?.transaction ?? account.transactions
        return {
          ...account,
          fiType:          acc.fiType ?? account.type,
          fipId:           fip.fipID ?? fip.fipId,
          fipName:         fip.fipName ?? acc.fipName ?? fip.fipID ?? fip.fipId,
          maskedAccNumber: acc.maskedAccNumber ?? account.maskedAccNumber,
          linkRefNumber:   acc.linkRefNumber ?? account.linkedAccRef,
          fiStatus:        acc.FIstatus ?? acc.fiStatus,
          transactions:    Array.isArray(txns) ? txns : txns ? [txns] : [],
        }
      })
    )
  }
  const flat = body?.accounts ?? body?.fipData ?? body?.data
  return Array.isArray(flat) ? flat : []
}

export async function fetchAADataTool(
  pool: Pool,
  params: FetchAAParams
): Promise<any> {
  const {
    userId,
    consentId,
    fiTypes = DEFAULT_FI_TYPES,
  } = params

  const client = axios.create({
    baseURL: process.env.SETU_AA_BASE_URL,
    headers: {
      'Content-Type':          'application/json',
      'x-client-id':           process.env.SETU_CLIENT_ID ?? '',
      'x-client-secret':       process.env.SETU_CLIENT_SECRET ?? '',
      'x-product-instance-id': process.env.SETU_PRODUCT_INSTANCE_ID ?? '',
    },
    timeout: 30000,
  })

  console.log(`[FetchAA] Fetching for user ${userId}`)

  try {
    // The requested range must sit inside the consent's FI data range,
    // otherwise Setu rejects the session.
    const consentRes = await pool.query(`
      SELECT date_range_start, date_range_end
      FROM consents
      WHERE consent_id = $1 AND user_id = $2 AND status = 'ACTIVE'
      LIMIT 1
    `, [consentId, userId])

    if (consentRes.rows.length === 0) {
      throw new Error('Consent not found or not ACTIVE for this user')
    }

    const consent = consentRes.rows[0]
    const now     = new Date()
    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const start   = consent.date_range_start ? new Date(consent.date_range_start) : yearAgo
    const end     = consent.date_range_end   ? new Date(consent.date_range_end)   : now
    const from    = start > yearAgo ? start : yearAgo
    const to      = end < now ? end : now

    // Step 1: Create a data session using the consent
    const sessionRes = await client.post('/v2/sessions', {
      consentId,
      dataRange: { from: from.toISOString(), to: to.toISOString() },
      format: 'json',
    })

    const sessionId = sessionRes.data?.id ?? sessionRes.data?.sessionId
    if (!sessionId) {
      throw new Error('No session ID returned from Setu AA')
    }

    // Step 2: Poll the session; the FI data is returned on the session itself
    let session: any
    let status = 'PENDING'
    for (let attempt = 1; attempt <= MAX_POLLS; attempt++) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))
      const statusRes = await client.get(`/v2/sessions/${sessionId}`, { timeout: 15000 })
      session = statusRes.data
      status  = String(session?.status ?? 'PENDING').toUpperCase()
      if (status !== 'PENDING') break
    }

    if (status !== 'COMPLETED' && status !== 'PARTIAL') {
      throw new Error(`AA session did not complete. Final status: ${status}`)
    }

    const rawAccounts = flattenAccounts(session)

    const wanted = new Set(fiTypes.map(t => t.toUpperCase()))
    const filteredAccounts = rawAccounts.filter((acc: any) => {
      const ft = String(acc.fiType ?? acc.type ?? '').toUpperCase()
      if (!ft) return true
      return wanted.has(ft) || wanted.has(FI_TYPE_FAMILY[ft] ?? '')
    })

    console.log(`[FetchAA] Retrieved ${filteredAccounts.length} of ${rawAccounts.length} accounts (session ${status})`)

    return {
      success:  true,
      source:   'setu_aa',
      accounts: filteredAccounts,
      metadata: {
        sessionId,
        sessionStatus: status,
        fetchedAt:     new Date().toISOString(),
        totalRaw:      rawAccounts.length,
        filtered:      filteredAccounts.length,
        fiTypes,
      }
    }

  } catch (error: any) {
    console.error(`[FetchAA] Error:`, error.message)

    return {
      success: false,
      source:  'setu_aa',
      error:   error.message,
      accounts: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        errorCode: error.response?.status,
      }
    }
  }
}
