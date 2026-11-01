import { Pool } from 'pg'
import axios     from 'axios'

// ─────────────────────────────────────────────
// Fetch Land Data Tool
// Calls Surepass API to search land records
// by owner name, state, district.
// ─────────────────────────────────────────────

interface FetchLandParams {
  userId:     string
  ownerName:  string
  state:      string
  stateCode?: string
  district?:  string
}

export async function fetchLandDataTool(
  pool: Pool,
  params: FetchLandParams
): Promise<any> {
  const {
    userId,
    ownerName,
    state,
    stateCode,
    district,
  } = params

  const apiUrl = process.env.SUREPASS_API_URL!
  const token  = process.env.SUREPASS_TOKEN!

  console.log(`[FetchLand] Searching for ${ownerName} in ${state}`)

  try {
    // Step 1: Search land records by owner name
    const searchRes = await axios.post(
      `${apiUrl}/land-records/search`,
      {
        owner_name: ownerName,
        state:      state,
        state_code: stateCode,
        district:   district,
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
        },
        timeout: 30000,
      }
    )

    const records = searchRes.data?.data?.records ??
                    searchRes.data?.records ??
                    searchRes.data?.data ?? []

    console.log(`[FetchLand] Found ${records.length} land records`)

    // Step 2: Enrich each record with details if available
    const enrichedRecords = []
    for (const record of records) {
      try {
        if (record.detail_url || record.record_id) {
          const detailRes = await axios.get(
            record.detail_url ?? `${apiUrl}/land-records/${record.record_id}`,
            {
              headers: { 'Authorization': `Bearer ${token}` },
              timeout: 10000,
            }
          )
          enrichedRecords.push({
            ...record,
            ...detailRes.data?.data,
            source_id: record.record_id ?? record.id,
          })
        } else {
          enrichedRecords.push({
            ...record,
            source_id: record.record_id ?? record.id,
          })
        }
      } catch (detailErr: any) {
        // If detail fetch fails, use the search result as-is
        console.warn(`[FetchLand] Detail fetch failed for record:`, detailErr.message)
        enrichedRecords.push({
          ...record,
          source_id: record.record_id ?? record.id,
        })
      }
    }

    return {
      success: true,
      source:  'surepass',
      records: enrichedRecords,
      metadata: {
        fetchedAt:  new Date().toISOString(),
        ownerName,
        state,
        district,
        totalFound: enrichedRecords.length,
      }
    }

  } catch (error: any) {
    console.error(`[FetchLand] Error:`, error.message)

    return {
      success: false,
      source:  'surepass',
      error:   error.message,
      records: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        errorCode: error.response?.status,
      }
    }
  }
}
