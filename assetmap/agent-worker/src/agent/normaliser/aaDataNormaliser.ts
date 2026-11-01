import { CanonicalAsset } from '../schemas/canonicalAsset'
import { toNumber, toPaise, toIsoDate, monthsSince } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Account Aggregator Data Normaliser
// Maps Setu AA FI types → canonical asset schema
// Handles: DEPOSIT, TERM/RECURRING_DEPOSIT, MUTUAL_FUND,
//          EQUITY, NPS, INSURANCE_POLICIES, PPF, BONDS, GOLD
// Accepts the flattened account list produced by fetchAADataTool.
// ─────────────────────────────────────────────

function mapAssetClass(fiType: string | undefined, account: any): CanonicalAsset['assetClass'] {
  switch (fiType) {
    case 'DEPOSIT': {
      const accountType = String(account.summary?.type ?? account.accountType ?? '').toUpperCase()
      return accountType === 'FIXED' || accountType === 'TERM' ? 'FIXED_DEPOSIT' : 'BANK_ACCOUNT'
    }
    case 'TERM_DEPOSIT':
    case 'RECURRING_DEPOSIT':
      return 'FIXED_DEPOSIT'
    case 'MUTUAL_FUND':
    case 'MUTUAL_FUNDS':
      return 'MUTUAL_FUND'
    case 'EQUITY':
    case 'EQUITIES':
      return 'EQUITY'
    case 'NPS':
      return 'NPS'
    case 'INSURANCE_POLICIES':
    case 'INSURANCE': {
      const ptype = String(account.policyType ?? account.summary?.policyType ?? '').toUpperCase()
      return ptype.includes('LIFE') || ptype.includes('TERM') ? 'INSURANCE_LIFE'
        : ptype.includes('HEALTH') ? 'INSURANCE_HEALTH'
        : 'INSURANCE_OTHER'
    }
    case 'PPF':
      return 'PPF'
    case 'BONDS':
    case 'BOND':
    case 'GOVT_SECURITIES':
      return 'BOND'
    case 'GOLD':
    case 'SOVEREIGN_GOLD_BOND':
    case 'SGB':
      return 'GOLD'
    default:
      return 'OTHER'
  }
}

/** Latest transaction date — AA returns transactions oldest-first, so [0] is the wrong end. */
function latestTransactionDate(account: any): string | undefined {
  const txns: any[] = Array.isArray(account.transactions) ? account.transactions : []
  let latest: string | undefined
  for (const tx of txns) {
    const d = toIsoDate(tx?.valueDate ?? tx?.transactionTimestamp ?? tx?.date)
    if (d && (!latest || d > latest)) latest = d
  }
  return latest ?? toIsoDate(account.summary?.lastTransactionDate)
}

/**
 * Nominee status: true/false only when the source actually says so.
 * Absent data stays undefined, otherwise every account without nominee
 * info would trigger a "missing nominee" alert.
 */
function nomineeStatus(account: any): { hasNominee?: boolean; nomineeName?: string } {
  if (account.nominee?.name) return { hasNominee: true, nomineeName: String(account.nominee.name) }

  const holders = account.profile?.holders?.holder
  const list: any[] = Array.isArray(holders) ? holders : holders ? [holders] : []
  const flags = list
    .map(h => String(h?.nominee ?? '').toUpperCase())
    .filter(Boolean)
  if (flags.includes('REGISTERED'))     return { hasNominee: true }
  if (flags.includes('NOT-REGISTERED') || flags.includes('NOT_REGISTERED')) return { hasNominee: false }
  return {}
}

export function normaliseAAData(
  userId: string,
  raw: any
): CanonicalAsset[] {
  const assets: CanonicalAsset[] = []
  const accounts: any[] = Array.isArray(raw?.accounts) ? raw.accounts : []

  for (const account of accounts) {
    const fiType     = String(account.fiType ?? account.type ?? '').toUpperCase() || undefined
    const assetClass = mapAssetClass(fiType, account)
    const summary    = account.summary ?? {}

    // Values: units × NAV for funds, else the reported current value/balance
    const units    = toNumber(summary.units ?? account.units)
    const navValue = toNumber(summary.navValue ?? summary.nav ?? account.nav)
    const currentValuePaise = units !== undefined && navValue !== undefined
      ? Math.round(units * navValue * 100)
      : toPaise(summary.currentValue ?? summary.currentBalance ?? account.balance)

    const investedValuePaise = toPaise(
      summary.investedAmount ?? summary.costValue ??
      summary.investmentValue ?? summary.totalInvestment
    )

    const lastTx        = latestTransactionDate(account)
    const dormantMonths = monthsSince(lastTx)
    const accountRef    = account.maskedAccNumber ?? account.accountRef ?? account.linkRefNumber
    const sourceId      = account.linkRefNumber ?? account.accountRef ?? account.maskedAccNumber ?? account.id

    assets.push({
      userId,
      assetClass,
      primarySource:      'setu_aa',
      secondarySources:   [],
      sourceRecordIds:    sourceId ? { setu_aa: String(sourceId) } : {},

      institutionName:    account.fipName ?? account.institutionName ?? account.fipId,
      institutionType:    fiType,
      institutionIfsc:    summary.ifscCode ?? summary.ifsc ?? account.ifsc,

      accountRef:         accountRef ? String(accountRef) : undefined,
      policyNumber:       account.policyNumber ?? summary.policyNumber,
      folioNumber:        account.folioNumber ?? summary.folioNo,

      currentValuePaise,
      investedValuePaise,
      gainLossPaise:      toPaise(summary.gainLoss),
      gainLossPct:        toNumber(summary.gainLossPct),
      currency:           summary.currency ?? 'INR',

      assetName:          account.planName ?? account.productName ??
                          account.scheme ?? summary.schemeName ?? account.fipName,
      assetSubtype:       account.policyType ?? account.fundCategory ??
                          summary.type ?? account.accountType,
      quantity:           units,
      unit:               units !== undefined ? 'units' : undefined,

      isActive:           String(summary.status ?? 'ACTIVE').toUpperCase() !== 'CLOSED',
      isDormant:          dormantMonths !== null && dormantMonths >= 12,
      ...nomineeStatus(account),

      openedDate:         toIsoDate(summary.openingDate ?? account.policyStartDate),
      maturityDate:       toIsoDate(summary.maturityDate ?? account.policyEndDate),
      lastTransactionDate:lastTx,
      valuationDate:      toIsoDate(summary.valuationDate ?? summary.balanceDateTime),

      documentAvailable:  false,
      rawData:            account,
    })
  }

  return assets
}
