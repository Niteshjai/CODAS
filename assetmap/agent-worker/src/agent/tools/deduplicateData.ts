import { Pool } from 'pg'
import { CanonicalAsset, withComputedGainLoss } from '../schemas/canonicalAsset'

export async function deduplicateDataTool(
  pool: Pool,
  userId: string,
  assets: CanonicalAsset[],
  runId: string
): Promise<CanonicalAsset[]> {

  const seen    = new Map<string, CanonicalAsset>()
  const noHash: CanonicalAsset[] = []

  for (const asset of assets) {
    const hash = asset.dedupHash
    if (!hash) { noHash.push(asset); continue }

    const existing = seen.get(hash)
    if (!existing) {
      seen.set(hash, asset)
      continue
    }

    seen.set(hash, mergeAssets(existing, asset))

    await pool.query(`
      INSERT INTO asset_dedup_log (
        run_id, user_id, duplicate_source,
        duplicate_ref, merge_strategy, merged_fields
      ) VALUES ($1,$2,$3,$4,$5,$6)
    `, [
      runId, userId,
      asset.primarySource,
      String(Object.values(asset.sourceRecordIds ?? {})[0] ?? 'unknown').slice(0, 200),
      'merge_keep_higher_value',
      ['currentValuePaise', 'investedValuePaise', 'secondarySources']
    ])
  }

  return [...seen.values(), ...noHash]
}

function mergeAssets(
  primary: CanonicalAsset,
  secondary: CanonicalAsset
): CanonicalAsset {
  // Keep the valuation from whichever record reports the higher value, and
  // take its invested/gain figures with it so gain/loss stays consistent.
  const valueFrom = secondary.currentValuePaise > primary.currentValuePaise ? secondary : primary

  const secondarySources = [...new Set([
    ...primary.secondarySources,
    secondary.primarySource,
    ...secondary.secondarySources,
  ])].filter(s => s !== primary.primarySource)

  return withComputedGainLoss({
    ...primary,
    currentValuePaise:  valueFrom.currentValuePaise,
    investedValuePaise: valueFrom.investedValuePaise,
    gainLossPaise:      valueFrom.gainLossPaise,
    gainLossPct:        valueFrom.gainLossPct,
    valuationDate:      valueFrom.valuationDate ?? primary.valuationDate,

    secondarySources,
    sourceRecordIds: {
      ...secondary.sourceRecordIds,
      ...primary.sourceRecordIds,
    },

    // Prefer non-null fields from either record
    institutionName: primary.institutionName ?? secondary.institutionName,
    accountRef:      primary.accountRef ?? secondary.accountRef,
    policyNumber:    primary.policyNumber ?? secondary.policyNumber,
    folioNumber:     primary.folioNumber ?? secondary.folioNumber,
    hasNominee:      primary.hasNominee ?? secondary.hasNominee,
    nomineeName:     primary.nomineeName ?? secondary.nomineeName,
    maturityDate:    primary.maturityDate ?? secondary.maturityDate,
    openedDate:      primary.openedDate ?? secondary.openedDate,
    lastTransactionDate: primary.lastTransactionDate ?? secondary.lastTransactionDate,
    documentAvailable:
      primary.documentAvailable || secondary.documentAvailable,
    digilockerUri:   primary.digilockerUri ?? secondary.digilockerUri,
  })
}
