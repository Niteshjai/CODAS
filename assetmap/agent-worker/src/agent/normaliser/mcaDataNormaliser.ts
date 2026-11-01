import { CanonicalAsset, withComputedGainLoss } from '../schemas/canonicalAsset'
import { toNumber, toPaise } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// MCA21 Data Normaliser
// Maps company directorships / shareholdings → canonical assets
// ─────────────────────────────────────────────

export function normaliseMCAData(
  userId: string,
  raw: any
): CanonicalAsset[] {
  const companies = raw?.companies ?? []
  if (!Array.isArray(companies)) return []

  return companies.map((company: any) => {
    const sourceId = company.cin ?? company.companyId ?? company.name
    const shares   = toNumber(company.shareCount ?? company.sharesHeld)

    return withComputedGainLoss({
      userId,
      assetClass:       'EQUITY',
      primarySource:    'mca21',
      secondarySources: [],
      sourceRecordIds:  sourceId ? { mca21: String(sourceId) } : {},

      institutionName:  company.companyName ?? company.name,
      institutionType:  company.role ?? 'directorship',

      // Only the user's own holding counts. paidUpCapital is the whole
      // company's capital — attributing it to a director inflated net worth
      // by the size of the company. A directorship with no holding is 0.
      currentValuePaise:  toPaise(company.shareValue),
      investedValuePaise: toPaise(company.investedAmount ?? company.shareValue),
      gainLossPaise:      0,
      currency:           'INR',

      assetName:    company.companyName ?? company.name,
      assetSubtype: company.designation ?? company.role,
      quantity:     shares,
      unit:         shares !== undefined ? 'shares' : undefined,

      isActive:           String(company.status ?? '').toLowerCase() !== 'inactive',
      isDormant:          false,
      documentAvailable:  false,
      rawData:            company,
    })
  })
}
