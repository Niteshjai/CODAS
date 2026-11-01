import { CanonicalAsset } from '../schemas/canonicalAsset'
import { toNumber, toPaise, toIsoDate } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Land Data Normaliser
// Maps Surepass land records → canonical LAND assets
// Handles: survey numbers, khasra, plot numbers,
//          area calculations, title status
// ─────────────────────────────────────────────

/** Rough placeholder rate used only when the source gives no valuation. */
const FALLBACK_RUPEES_PER_ACRE = 500000

/** Convert an area to acres; undefined when the unit is unknown (guntha, bigha… vary by state). */
function areaInAcres(area: number | undefined, unit: unknown): number | undefined {
  if (area === undefined) return undefined
  const u = String(unit ?? 'acres').toLowerCase().replace(/[\s.]/g, '')
  if (['acre', 'acres', 'ac'].includes(u))                 return area
  if (['hectare', 'hectares', 'ha'].includes(u))           return area * 2.47105
  if (['sqm', 'sqmeter', 'sqmetre', 'squaremeter', 'squaremetre', 'm2'].includes(u)) return area / 4046.86
  if (['sqft', 'squarefeet', 'squarefoot', 'ft2'].includes(u)) return area / 43560
  return undefined
}

export function normaliseLandData(
  userId: string,
  raw: any
): CanonicalAsset[] {
  const assets: CanonicalAsset[] = []
  const records: any[] = Array.isArray(raw?.records) ? raw.records : []

  for (const record of records) {
    const area = toNumber(record.area ?? record.area_value)
    const unit = record.area_unit ?? 'acres'

    // Prefer the source's valuation. Only approximate when the area can be
    // converted to acres reliably; otherwise leave the value at 0 rather than
    // inventing one (a sq-ft area treated as acres overstated value ~43,000×).
    const estimated = toNumber(record.estimated_value)
    const acres     = areaInAcres(area, unit)
    const valuePaise = estimated !== undefined
      ? Math.round(estimated * 100)
      : acres !== undefined ? Math.round(acres * FALLBACK_RUPEES_PER_ACRE * 100) : 0

    const purchaseValue = toNumber(record.purchase_value)
    const investedPaise = purchaseValue !== undefined ? toPaise(purchaseValue) : 0

    // Build a readable asset name from available identifiers
    const assetName = [
      record.survey_number  && `Survey ${record.survey_number}`,
      record.khasra_number  && `Khasra ${record.khasra_number}`,
      record.plot_number    && `Plot ${record.plot_number}`,
    ].filter(Boolean).join(' / ') || 'Land Parcel'

    const location = [
      record.village,
      record.taluk ?? record.tehsil,
      record.district,
      record.state,
    ].filter(Boolean).join(', ')

    const sourceId = record.source_id ?? record.survey_number ?? record.khasra_number

    assets.push({
      userId,
      assetClass:         'LAND',
      primarySource:      'surepass',
      secondarySources:   [],
      sourceRecordIds:    sourceId ? { surepass: String(sourceId) } : {},

      institutionName:    location || 'Land Registry',
      institutionType:    'LAND_REGISTRY',

      currentValuePaise:  valuePaise,
      investedValuePaise: investedPaise,
      // Gain is only meaningful when a purchase value is known
      gainLossPaise:      purchaseValue !== undefined ? valuePaise - investedPaise : 0,
      currency:           'INR',

      assetName,
      assetSubtype:       record.land_type ?? record.land_use,
      quantity:           area,
      unit:               String(unit),

      isActive:           true,
      isDormant:          false,
      // Land has no nominee concept in the registry; leave unknown
      titleStatus:        record.title_status ?? 'unknown',
      ownershipType:      record.ownership_type ?? record.holder_type ?? 'unknown',

      openedDate:         toIsoDate(record.registration_date ?? record.purchase_date),
      valuationDate:      new Date().toISOString().slice(0, 10),

      documentAvailable:  false,
      rawData:            record,
    })
  }

  return assets
}
