import type { Queryable } from '../../db/types'
import { decryptOptional } from '../../utils/encryption'
import { toNumber } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Land loader (source key `surepass`)
//
// The backend owns land lookups (landRegistry / Zoop, cached and re-synced by
// landSyncWorker) and stores them in land_records with the identifiers encrypted
// (*_enc, same AES-GCM format; see backend db/queries/landRecords.ts). This
// loader maps the user's active records to the fields landDataNormaliser reads.
// ─────────────────────────────────────────────

interface LandRow {
  id:                   string
  survey_number_enc:    string | null
  plot_number_enc:      string | null
  khasra_number_enc:    string | null
  village:              string | null
  taluka:               string | null
  district:             string | null
  state:                string | null
  state_code:           string | null
  area_value:           string | null
  area_unit:            string | null
  land_type:            string | null
  land_use:             string | null
  ownership_type:       string | null
  title_status:         string | null
  registration_date:    Date | null
  estimated_value_paise:string | null
  valuation_date:       Date | null
  digilocker_doc_available: boolean | null
  digilocker_doc_uri:   string | null
  source:               string | null
}

export interface LandLoadResult {
  success:  boolean
  error?:   string
  records:  any[]
  metadata: { rows: number; undecryptable: number }
}

function toRecord(row: LandRow): any {
  const estimatedPaise = toNumber(row.estimated_value_paise)
  return {
    // Stable id: the land_records row survives re-syncs (upserted on source + record id)
    source_id:        row.id,
    survey_number:    decryptOptional(row.survey_number_enc) ?? undefined,
    plot_number:      decryptOptional(row.plot_number_enc) ?? undefined,
    khasra_number:    decryptOptional(row.khasra_number_enc) ?? undefined,
    village:          row.village ?? undefined,
    taluk:            row.taluka ?? undefined,
    district:         row.district ?? undefined,
    state:            row.state ?? undefined,
    state_code:       row.state_code ?? undefined,
    area:             toNumber(row.area_value),
    area_unit:        row.area_unit ?? 'acres',
    land_type:        row.land_type ?? undefined,
    land_use:         row.land_use ?? undefined,
    ownership_type:   row.ownership_type ?? undefined,
    title_status:     row.title_status ?? undefined,
    registration_date: row.registration_date ?? undefined,
    // The normaliser takes rupees
    estimated_value:  estimatedPaise !== undefined ? estimatedPaise / 100 : undefined,
    valuation_date:   row.valuation_date ?? undefined,
    digilocker_doc_available: row.digilocker_doc_available ?? false,
    digilocker_doc_uri:       row.digilocker_doc_uri ?? undefined,
    registry_source:  row.source ?? undefined,
  }
}

export async function loadLandRecords(db: Queryable, userId: string): Promise<LandLoadResult> {
  const res = await db.query<LandRow>(`
    SELECT id, survey_number_enc, plot_number_enc, khasra_number_enc,
           village, taluka, district, state, state_code,
           area_value, area_unit, land_type, land_use,
           ownership_type, title_status, registration_date,
           estimated_value_paise, valuation_date,
           digilocker_doc_available, digilocker_doc_uri, source
    FROM land_records
    WHERE user_id = $1 AND is_active IS NOT FALSE
    ORDER BY created_at DESC, id
  `, [userId])

  const records: any[] = []
  let undecryptable = 0
  for (const row of res.rows) {
    try {
      records.push(toRecord(row))
    } catch {
      undecryptable++
    }
  }

  const metadata = { rows: res.rows.length, undecryptable }
  if (undecryptable > 0) {
    return {
      success: false,
      error:   `${undecryptable} of ${res.rows.length} land records could not be decrypted`,
      records, metadata,
    }
  }
  return { success: true, records, metadata }
}
