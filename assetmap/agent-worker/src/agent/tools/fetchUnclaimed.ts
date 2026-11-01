import { Pool } from 'pg'
import axios     from 'axios'

// ─────────────────────────────────────────────
// Fetch Unclaimed Assets Tool
// Searches IEPF (dividends/shares) and EPFO
// (provident fund) by PAN and name.
// ─────────────────────────────────────────────

interface FetchUnclaimedParams {
  userId: string
  pan?:   string
  name:   string
}

export async function fetchUnclaimedTool(
  pool: Pool,
  params: FetchUnclaimedParams
): Promise<any> {
  const { userId, pan, name } = params

  if (!pan) {
    return {
      success: false,
      source:  'iepf_epfo',
      error:   'PAN is required for unclaimed asset search',
      data:    null,
      metadata: { fetchedAt: new Date().toISOString() }
    }
  }

  console.log(`[FetchUnclaimed] Searching for PAN: ${pan}, Name: ${name}`)

  const result = {
    iepf: { records: [] as any[], error: null as string | null },
    epfo: { accounts: [] as any[], pension: [] as any[], error: null as string | null }
  }

  // 1. Fetch IEPF Data (Unclaimed Dividends/Shares)
  // Mock API for IEPF (in reality this would be via Surepass or MCA direct)
  try {
    const iepfRes = await axios.post(
      'https://mock-kyc-api.example.com/iepf/search',
      { pan, name },
      { headers: { 'Authorization': 'Bearer mock-token' }, timeout: 15000 }
    )
    result.iepf.records = iepfRes.data?.records ?? []
  } catch (error: any) {
    console.warn(`[FetchUnclaimed] IEPF fetch failed:`, error.message)
    result.iepf.error = error.message
  }

  // 2. Fetch EPFO Data (Provident Fund)
  // Mock API for EPFO
  try {
    const epfoRes = await axios.post(
      'https://mock-kyc-api.example.com/epfo/search',
      { pan, name },
      { headers: { 'Authorization': 'Bearer mock-token' }, timeout: 15000 }
    )
    result.epfo.accounts = epfoRes.data?.accounts ?? []
    result.epfo.pension = epfoRes.data?.pension ?? []
  } catch (error: any) {
    console.warn(`[FetchUnclaimed] EPFO fetch failed:`, error.message)
    result.epfo.error = error.message
  }

  return {
    success: true,
    source:  'iepf_epfo',
    iepf:    result.iepf,
    epfo:    result.epfo,
    metadata: {
      fetchedAt: new Date().toISOString(),
      iepfRecordsFound: result.iepf.records.length,
      epfoAccountsFound: result.epfo.accounts.length,
    }
  }
}
