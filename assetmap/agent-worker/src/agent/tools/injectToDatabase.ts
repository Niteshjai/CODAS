import { Pool }             from 'pg'
import { AgentContext, CanonicalAsset } from '../schemas/canonicalAsset'
import { encrypt, encryptOptional }  from '../../utils/encryption'
import { toInt, toNumber, clamp, truncate, toIsoDate } from '../../utils/sanitize'
import { netWorthTracker }  from '../../services/netWorthTracker'
import { nomineeChecker }   from '../../services/nomineeChecker'
import { dormantAccountFinder } from '../../services/dormantAccountFinder'

/** How long until an asset is considered due for re-sync. */
const SYNC_INTERVAL = '24 hours'

/**
 * Column → value mapping for one asset. Placeholders are generated from this
 * list, so the column count and the parameter count can never drift apart
 * (the previous hand-written VALUES clause had 42 placeholders for 43 columns
 * and every injection failed).
 *
 * Lengths match the VARCHAR sizes in backend migration 032; anything bound for a
 * DATE / INTEGER / DECIMAL column is sanitised so one bad record cannot abort
 * the whole transaction.
 */
function assetRow(userId: string, runId: string, asset: CanonicalAsset): Array<[string, unknown]> {
  const gainLossPct = toNumber(asset.gainLossPct)
  const quantity    = toNumber(asset.quantity)

  return [
    ['user_id',               userId],
    ['run_id',                runId],
    ['asset_class',           asset.assetClass],
    ['primary_source',        asset.primarySource],
    ['secondary_sources',     asset.secondarySources ?? []],
    ['source_record_ids',     JSON.stringify(asset.sourceRecordIds ?? {})],
    // institution_name is NOT NULL in AssetMap's canonical_assets
    ['institution_name',      truncate(asset.institutionName, 200) ?? 'Unknown'],
    ['institution_type',      truncate(asset.institutionType, 50) ?? null],
    ['institution_ifsc',      truncate(asset.institutionIfsc, 20) ?? null],
    ['account_ref_enc',       encryptOptional(asset.accountRef)],
    ['policy_number_enc',     encryptOptional(asset.policyNumber)],
    ['folio_number_enc',      encryptOptional(asset.folioNumber)],
    ['current_value_paise',   toInt(asset.currentValuePaise)],
    ['invested_value_paise',  toInt(asset.investedValuePaise)],
    ['gain_loss_paise',       toInt(asset.gainLossPaise)],
    // DECIMAL(8,4): values beyond ±9999.9999 overflow
    ['gain_loss_pct',         gainLossPct !== undefined && Math.abs(gainLossPct) < 10000 ? gainLossPct : null],
    ['currency',              truncate(asset.currency, 5) ?? 'INR'],
    ['asset_name',            truncate(asset.assetName, 300) ?? null],
    ['asset_subtype',         truncate(asset.assetSubtype, 100) ?? null],
    ['quantity',              quantity !== undefined && Math.abs(quantity) < 1e14 ? quantity : null],
    ['unit',                  truncate(asset.unit, 20) ?? null],
    ['is_active',             asset.isActive ?? true],
    ['is_dormant',            asset.isDormant ?? false],
    ['has_nominee',           asset.hasNominee ?? null],
    ['nominee_name_enc',      encryptOptional(asset.nomineeName)],
    ['title_status',          truncate(asset.titleStatus, 30) ?? null],
    ['ownership_type',        truncate(asset.ownershipType, 30) ?? null],
    ['opened_date',           toIsoDate(asset.openedDate) ?? null],
    ['maturity_date',         toIsoDate(asset.maturityDate) ?? null],
    ['last_transaction_date', toIsoDate(asset.lastTransactionDate) ?? null],
    ['valuation_date',        toIsoDate(asset.valuationDate) ?? null],
    ['ai_category_label',     truncate(asset.ai_category_label, 100) ?? null],
    ['ai_risk_level',         asset.ai_risk_level ?? null],
    ['ai_liquidity_score',    (() => { const s = clamp(asset.ai_liquidity_score, 0, 100); return s === undefined ? null : Math.round(s) })()],
    ['ai_anomaly_flag',       asset.ai_anomaly_flag ?? false],
    ['ai_anomaly_reason',     asset.ai_anomaly_reason ?? null],
    ['ai_recommendations',    asset.ai_recommendations ?? []],
    ['ai_summary',            asset.ai_summary ?? null],
    ['ai_enriched_at',        asset.ai_enriched_at ?? new Date().toISOString()],
    ['dedup_hash',            asset.dedupHash ?? null],
    ['digilocker_uri',        asset.digilockerUri ?? null],
    ['document_available',    asset.documentAvailable ?? false],
    ['raw_data_enc',          Object.keys(asset.rawData ?? {}).length > 0
                                ? encrypt(JSON.stringify(asset.rawData))
                                : null],
  ]
}

/** Columns refreshed when an existing asset is seen again. */
const UPDATE_COLUMNS = [
  'run_id', 'secondary_sources', 'source_record_ids',
  'institution_name', 'institution_type', 'institution_ifsc',
  'account_ref_enc', 'policy_number_enc', 'folio_number_enc',
  'current_value_paise', 'invested_value_paise', 'gain_loss_paise', 'gain_loss_pct',
  'asset_name', 'asset_subtype', 'quantity', 'unit',
  'is_active', 'is_dormant', 'has_nominee', 'nominee_name_enc',
  'title_status', 'ownership_type',
  'opened_date', 'maturity_date', 'last_transaction_date', 'valuation_date',
  'ai_category_label', 'ai_risk_level', 'ai_liquidity_score',
  'ai_anomaly_flag', 'ai_anomaly_reason', 'ai_recommendations', 'ai_summary', 'ai_enriched_at',
  'digilocker_uri', 'document_available', 'raw_data_enc',
]

export async function injectToDatabaseTool(
  pool: Pool,
  userId: string,
  runId: string,
  enrichedAssets: CanonicalAsset[],
  context: AgentContext
): Promise<{
  created: number
  updated: number
}> {
  let created = 0
  let updated = 0

  console.log(`[InjectDB] Starting DB injection for ${enrichedAssets.length} assets...`)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    for (const asset of enrichedAssets) {
      const row          = assetRow(userId, runId, asset)
      const columns      = row.map(([c]) => c)
      const values       = row.map(([, v]) => v)
      const placeholders = values.map((_, i) => `$${i + 1}`)

      const res = await client.query(`
        INSERT INTO canonical_assets (${columns.join(', ')}, last_synced_at, next_sync_at, is_stale)
        VALUES (${placeholders.join(', ')}, NOW(), NOW() + INTERVAL '${SYNC_INTERVAL}', false)
        ON CONFLICT (dedup_hash) DO UPDATE SET
          ${UPDATE_COLUMNS.map(c => `${c} = EXCLUDED.${c}`).join(',\n          ')},
          last_synced_at = NOW(),
          next_sync_at   = NOW() + INTERVAL '${SYNC_INTERVAL}',
          is_stale       = false
        WHERE canonical_assets.user_id = EXCLUDED.user_id
        RETURNING id, (xmax = 0) AS is_new
      `, values)

      // dedup_hash is globally unique (AssetMap's ancestral search relies on
      // ON CONFLICT (dedup_hash)). Hashes include the user id, but if one
      // ever matched another user's row the WHERE above blocks the update
      // and no row comes back — fail loudly instead of corrupting data.
      if (res.rows.length === 0) {
        throw new Error(`dedup_hash ${asset.dedupHash} belongs to a different user; refusing to overwrite`)
      }

      if (res.rows[0].is_new) created++
      else updated++
    }

    await client.query('COMMIT')
    console.log(`[InjectDB] Injection complete. Created: ${created}, Updated: ${updated}`)
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {})
    console.error(`[InjectDB] Error during injection, rolled back:`, error.message)
    throw error
  } finally {
    client.release()
  }

  // Downstream services run after the commit. A failure here must not
  // surface as an injection failure (the data is already persisted, and
  // the old code issued ROLLBACK after COMMIT and marked the run failed).
  if (context.options.triggerAlerts) {
    const results = await Promise.allSettled([
      netWorthTracker.takeSnapshot(pool, userId, enrichedAssets),
      nomineeChecker.check(userId, enrichedAssets),
      dormantAccountFinder.scan(userId, enrichedAssets),
    ])
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[InjectDB] Downstream service failed:', r.reason?.message ?? r.reason)
      }
    }
  }

  return { created, updated }
}
