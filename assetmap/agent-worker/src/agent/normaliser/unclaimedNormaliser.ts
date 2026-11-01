import { CanonicalAsset } from '../schemas/canonicalAsset'
import { toNumber, toPaise } from '../../utils/sanitize'

// ─────────────────────────────────────────────
// Unclaimed Assets Normaliser
// Maps IEPF unclaimed dividends/shares and
// EPFO provident fund data to canonical assets.
// ─────────────────────────────────────────────

export function normaliseUnclaimedData(
  userId: string,
  raw: any
): CanonicalAsset[] {
  const assets: CanonicalAsset[] = []

  // ── IEPF Unclaimed Dividends & Shares ──
  if (raw?.iepf?.records) {
    for (const record of raw.iepf.records) {
      const recordType = record.type?.toUpperCase()

      if (recordType === 'DIVIDEND' || recordType === 'UNCLAIMED_DIVIDEND') {
        assets.push({
          userId,
          assetClass:         'UNCLAIMED',
          primarySource:      'iepf',
          secondarySources:   [],
          sourceRecordIds:    {
            iepf: String(record.source_ref ?? record.reference_number ?? record.id ?? record.investor_id)
          },

          institutionName:    record.company_name ?? record.issuer,
          institutionType:    'IEPF',

          currentValuePaise:  toPaise(record.amount ?? record.unclaimed_amount),
          investedValuePaise: 0,
          gainLossPaise:      0,
          currency:           'INR',

          assetName:          `Unclaimed Dividend — ${record.company_name ?? 'Unknown'}`,
          assetSubtype:       'unclaimed_dividend',

          isActive:           true,
          isDormant:          true,

          openedDate:         record.dividend_date ?? record.transfer_date,
          lastTransactionDate:record.last_claim_date,
          valuationDate:      new Date().toISOString().split('T')[0],

          documentAvailable:  false,
          rawData:            record,
        })
      }

      if (recordType === 'SHARE' || recordType === 'UNCLAIMED_SHARE') {
        const quantity = record.number_of_shares ?? record.quantity ?? 0
        const faceValue = record.face_value ?? 10
        const valuePaise = Math.round(
          (record.current_value ?? quantity * faceValue) * 100
        )

        assets.push({
          userId,
          assetClass:         'UNCLAIMED',
          primarySource:      'iepf',
          secondarySources:   [],
          sourceRecordIds:    {
            iepf: String(record.source_ref ?? record.reference_number ?? record.id)
          },

          institutionName:    record.company_name ?? record.issuer,
          institutionType:    'IEPF',

          currentValuePaise:  valuePaise,
          investedValuePaise: Math.round(quantity * faceValue * 100),
          gainLossPaise:      valuePaise - Math.round(quantity * faceValue * 100),
          currency:           'INR',

          assetName:          `Unclaimed Shares — ${record.company_name ?? 'Unknown'}`,
          assetSubtype:       'unclaimed_share',
          quantity,
          unit:               'shares',

          isActive:           true,
          isDormant:          true,

          openedDate:         record.transfer_date,
          valuationDate:      new Date().toISOString().split('T')[0],

          documentAvailable:  false,
          rawData:            record,
        })
      }
    }
  }

  // ── EPFO Provident Fund ──
  if (raw?.epfo?.accounts) {
    for (const account of raw.epfo.accounts) {
      // EPFO returns numeric strings; `"5000" + "3000"` concatenated to
      // "50003000", and a missing employee_share produced NaN, which aborts
      // the whole DB transaction.
      const totalBalance = toNumber(account.total_balance) ??
        ((toNumber(account.employee_share) ?? 0) + (toNumber(account.employer_share) ?? 0))

      assets.push({
        userId,
        assetClass:         'EPF',
        primarySource:      'epfo',
        secondarySources:   [],
        sourceRecordIds:    {
          // Opaque ref when available: source_record_ids is not encrypted
          epfo: String(account.source_ref ?? account.uan ?? account.member_id ?? account.id)
        },

        institutionName:    account.establishment_name ?? account.company_name,
        institutionType:    'EPFO',

        accountRef:         account.uan ?? account.member_id,

        currentValuePaise:  Math.round(
          (totalBalance ?? 0) * 100
        ),
        investedValuePaise: toPaise(account.employee_share),
        gainLossPaise:      toPaise(account.interest_earned),
        currency:           'INR',

        assetName:          `EPF — ${account.establishment_name ?? account.uan ?? 'Unknown'}`,
        assetSubtype:       account.account_type ?? 'epf',

        isActive:           account.status !== 'SETTLED' &&
                            account.status !== 'CLOSED',
        isDormant:          account.status === 'INOPERATIVE',
        // Unknown unless the source names a nominee (never claim "no nominee" without data)
        hasNominee:         account.nominee_name ? true : undefined,
        nomineeName:        account.nominee_name,

        openedDate:         account.date_of_joining ?? account.start_date,
        lastTransactionDate:account.last_contribution_date,
        valuationDate:      account.balance_as_on ?? new Date().toISOString().split('T')[0],

        documentAvailable:  false,
        rawData:            account,
      })
    }
  }

  // ── EPFO Pension (EPS) ──
  if (raw?.epfo?.pension) {
    for (const pension of raw.epfo.pension) {
      assets.push({
        userId,
        assetClass:         'EPF',
        primarySource:      'epfo',
        secondarySources:   [],
        sourceRecordIds:    {
          epfo: `eps_${pension.source_ref ?? pension.uan ?? pension.member_id}`
        },

        institutionName:    pension.establishment_name ?? pension.company_name,
        institutionType:    'EPFO',

        accountRef:         pension.uan ?? pension.member_id,

        currentValuePaise:  Math.round(
          (pension.pension_amount ?? pension.balance ?? 0) * 100
        ),
        investedValuePaise: 0,
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          `EPS Pension — ${pension.establishment_name ?? 'Unknown'}`,
        assetSubtype:       'eps_pension',

        isActive:           pension.status !== 'SETTLED',
        isDormant:          false,
        hasNominee:         pension.nominee_name ? true : undefined,
        nomineeName:        pension.nominee_name,

        openedDate:         pension.date_of_joining,
        valuationDate:      new Date().toISOString().split('T')[0],

        documentAvailable:  false,
        rawData:            pension,
      })
    }
  }

  // ── IRDAI unclaimed insurance amounts ──
  if (Array.isArray(raw?.irdai?.records)) {
    for (const record of raw.irdai.records) {
      assets.push({
        userId,
        assetClass:         'UNCLAIMED',
        primarySource:      'irdai',
        secondarySources:   [],
        sourceRecordIds:    { irdai: String(record.source_ref ?? record.id ?? '') },

        institutionName:    record.company_name ?? 'Insurer',
        institutionType:    'IRDAI',
        policyNumber:       record.policy_number,

        currentValuePaise:  toPaise(record.amount),
        investedValuePaise: 0,
        gainLossPaise:      0,
        currency:           'INR',

        assetName:          `Unclaimed Insurance — ${record.company_name ?? 'Unknown'}`,
        assetSubtype:       'unclaimed_insurance',

        isActive:           true,
        isDormant:          true,

        valuationDate:      new Date().toISOString().split('T')[0],

        documentAvailable:  false,
        rawData:            record,
      })
    }
  }

  return assets
}
