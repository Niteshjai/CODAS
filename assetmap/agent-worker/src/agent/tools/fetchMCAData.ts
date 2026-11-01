import { Pool } from 'pg'
import axios     from 'axios'

// ─────────────────────────────────────────────
// Fetch MCA21 Data Tool
// Searches Ministry of Corporate Affairs data
// for directorships and shareholdings linked
// to the user's PAN.
// ─────────────────────────────────────────────

interface FetchMCAParams {
  userId: string
  pan?:   string
}

export async function fetchMCADataTool(
  pool: Pool,
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

  console.log(`[FetchMCA] Searching for PAN: ${pan}`)

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
    console.error(`[FetchMCA] Error:`, error.message)

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
