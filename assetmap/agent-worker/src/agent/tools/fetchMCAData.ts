import axios     from 'axios'
import type { Queryable } from '../../db/types'

// ─────────────────────────────────────────────
// Fetch MCA21 Data Tool
// Searches Ministry of Corporate Affairs data
// for directorships and shareholdings linked
// to the user's PAN.
// External call: only reachable when AGENT_ENABLE_EXTERNAL_SOURCES=true
// (the backend has no MCA21 storage yet). Never logs the PAN.
// ─────────────────────────────────────────────

interface FetchMCAParams {
  userId: string
  pan?:   string
}

export async function fetchMCADataTool(
  _db: Queryable,
  params: FetchMCAParams
): Promise<any> {
  const { userId, pan } = params

  if (!pan) {
    return {
      success: false,
      source:  'mca21',
      error:   'PAN is required for MCA21 search',
      data:    null,
      metadata: { fetchedAt: new Date().toISOString() }
    }
  }

  try {
    // Mock API for MCA21
    const mcaRes = await axios.post(
      'https://mock-kyc-api.example.com/mca/search',
      { pan },
      { headers: { 'Authorization': 'Bearer mock-token' }, timeout: 15000 }
    )

    const companies = mcaRes.data?.companies ?? []

    return {
      success:   true,
      source:    'mca21',
      companies,
      metadata: {
        fetchedAt: new Date().toISOString(),
        companiesFound: companies.length,
      }
    }
  } catch (error: any) {
    console.error(`[FetchMCA] Search failed (${error.response?.status ?? 'no status'})`)

    return {
      success:   false,
      source:    'mca21',
      error:     error.message,
      companies: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        errorCode: error.response?.status,
      }
    }
  }
}
