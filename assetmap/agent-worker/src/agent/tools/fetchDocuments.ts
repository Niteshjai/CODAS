import { Pool } from 'pg'
import axios     from 'axios'

// ─────────────────────────────────────────────
// Fetch Documents Tool (DigiLocker)
// Pulls issued and linked documents from
// DigiLocker. Returns Aadhaar, PAN, land
// records, insurance, vehicle RC documents.
// ─────────────────────────────────────────────

interface FetchDocumentsParams {
  userId:    string
  docTypes?: string[]
}

const DEFAULT_DOC_TYPES = [
  'AADHAAR', 'PAN', 'LAND_RECORD',
  'INSURANCE', 'RC'
]

export async function fetchDocumentsTool(
  pool: Pool,
  params: FetchDocumentsParams
): Promise<any> {
  const {
    userId,
    docTypes = DEFAULT_DOC_TYPES,
  } = params

  const clientId     = process.env.DIGILOCKER_CLIENT_ID!
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET!

  console.log(`[FetchDocs] Fetching documents for user ${userId}`)

  try {
    // Step 1: Get the user's DigiLocker access token from DB
    let tokenRow
    try {
      tokenRow = await pool.query(`
        SELECT access_token, refresh_token, token_expires_at
        FROM digilocker_tokens
        WHERE user_id = $1
        AND token_expires_at > NOW()
        ORDER BY created_at DESC LIMIT 1
      `, [userId])
    } catch (dbErr: any) {
      // AssetMap has no digilocker_tokens table yet (42P01 = undefined_table).
      // Treat as "not set up", not as a failed source — otherwise every run
      // would be marked partial.
      if (dbErr?.code === '42P01') {
        return {
          success:   false,
          skipped:   true,
          source:    'digilocker',
          error:     'DigiLocker integration not set up (no digilocker_tokens table)',
          documents: [],
          metadata:  { fetchedAt: new Date().toISOString() }
        }
      }
      throw dbErr
    }

    // A user who never linked DigiLocker is not an error either
    if (tokenRow.rows.length === 0) {
      return {
        success:    false,
        skipped:    true,
        source:     'digilocker',
        error:      'No valid DigiLocker access token found. User needs to (re-)link.',
        documents:  [],
        metadata:   { fetchedAt: new Date().toISOString() }
      }
    }

    const accessToken = tokenRow.rows[0].access_token

    // Step 2: Fetch issued documents
    const issuedRes = await axios.get(
      'https://api.digitallocker.gov.in/public/oauth2/1/files/issued',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type':  'application/json',
        },
        timeout: 15000,
      }
    )

    const issuedDocs = issuedRes.data?.items ?? issuedRes.data?.documents ?? []

    // Step 3: Fetch pulled (self-uploaded) documents
    let pulledDocs: any[] = []
    try {
      const pulledRes = await axios.get(
        'https://api.digitallocker.gov.in/public/oauth2/1/files/pulled',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type':  'application/json',
          },
          timeout: 15000,
        }
      )
      pulledDocs = pulledRes.data?.items ?? pulledRes.data?.documents ?? []
    } catch (pullErr: any) {
      console.warn(`[FetchDocs] Pulled docs fetch failed:`, pullErr.message)
    }

    // Combine all documents
    const allDocs = [...issuedDocs, ...pulledDocs]

    // Filter by requested doc types
    // DigiLocker's file listing puts the document type in `doctype`;
    // `type` there is "file"/"dir", so it must not be the first fallback.
    const filteredDocs = allDocs.filter((doc: any) => {
      const type = String(doc.docType ?? doc.doctype ?? doc.type ?? '').toUpperCase()
      return docTypes.some(dt => type.includes(dt))
    })

    // Fetch individual document details for asset-relevant docs
    const enrichedDocs = []
    for (const doc of filteredDocs) {
      try {
        const docUri  = doc.uri ?? doc.docUri
        const docType = String(doc.docType ?? doc.doctype ?? '').toUpperCase()
        if (docUri && !['AADHAAR', 'PAN'].includes(docType)) {
          const detailRes = await axios.get(
            `https://api.digitallocker.gov.in/public/oauth2/1/file/${encodeURIComponent(docUri)}`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
              timeout: 10000,
            }
          )
          // This endpoint can return the file itself (PDF/XML) rather than
          // JSON. Spreading a string turned every character into a key
          // ({0:'%',1:'P',...}) that then got stored as raw data, so only
          // merge structured JSON.
          const detail = detailRes.data
          const isJsonObject = detail !== null && typeof detail === 'object' &&
            !Array.isArray(detail) && !Buffer.isBuffer(detail)
          enrichedDocs.push({
            ...doc,
            ...(isJsonObject ? detail : {}),
            uri: docUri,
          })
        } else {
          enrichedDocs.push({ ...doc, uri: docUri })
        }
      } catch (detailErr: any) {
        console.warn(`[FetchDocs] Detail fetch failed for ${doc.name}:`, detailErr.message)
        enrichedDocs.push(doc)
      }
    }

    console.log(`[FetchDocs] Retrieved ${enrichedDocs.length} documents (${allDocs.length} total)`)

    return {
      success:   true,
      source:    'digilocker',
      documents: enrichedDocs,
      metadata: {
        fetchedAt:     new Date().toISOString(),
        totalIssued:   issuedDocs.length,
        totalPulled:   pulledDocs.length,
        filtered:      enrichedDocs.length,
        docTypes,
      }
    }

  } catch (error: any) {
    console.error(`[FetchDocs] Error:`, error.message)

    return {
      success:   false,
      source:    'digilocker',
      error:     error.message,
      documents: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        errorCode: error.response?.status,
      }
    }
  }
}
