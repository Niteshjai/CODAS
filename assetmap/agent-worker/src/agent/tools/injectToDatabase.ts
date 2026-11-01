import { createHash } from 'crypto'
import type { PoolClient } from 'pg'
import { CanonicalAsset, SourceKey } from '../schemas/canonicalAsset'
import { encrypt, encryptOptional }  from '../../utils/encryption'
import { toInt, toNumber, clamp, truncate, toIsoDate } from '../../utils/sanitize'
import { normaliseOwnershipType, normaliseTitleStatus } from '../normaliser/landDataNormaliser'

/** How long until an asset is considered due for re-sync. */
const SYNC_INTERVAL = '24 hours'

/** primary_source values each source key writes (used for per-source deactivation). */
export const PRIMARY_SOURCES_BY_SOURCE: Record<SourceKey, string[]> = {
  setu_aa:    ['setu_aa'],
  surepass:   ['surepass'],
  iepf_epfo:  ['iepf', 'epfo', 'irdai'],
  digilocker: ['digilocker'],
  mca21:      ['mca21'],
}

/**
 * Column → value mapping for one asset. Placeholders are generated from this
 * list, so the column count and the parameter count can never drift apart.
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
    // Legacy column (migration 015, default 'AA'): readers such as the family vault and the
    // data export still show it, so keep it equal to primary_source.
    ['source',                asset.primarySource],
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
    // Lower-case enums the backend reads (landCollateralScore: 'clear', 'dispute', 'joint')
    ['title_status',          asset.titleStatus === undefined ? null : normaliseTitleStatus(asset.titleStatus)],
    ['ownership_type',        asset.ownershipType === undefined ? null : normaliseOwnershipType(asset.ownershipType)],
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

/** Columns overwritten from the new values when an existing asset is seen again. */
const UPDATE_COLUMNS = [
  'run_id', 'primary_source', 'source', 'secondary_sources', 'source_record_ids',
  'institution_name', 'institution_type', 'institution_ifsc',
  'account_ref_enc', 'policy_number_enc', 'folio_number_enc',
  'current_value_paise', 'invested_value_paise', 'gain_loss_paise', 'gain_loss_pct',
  'asset_name', 'asset_subtype', 'quantity', 'unit',
  'is_active', 'is_dormant',
  'title_status', 'ownership_type',
  'opened_date', 'maturity_date', 'last_transaction_date', 'valuation_date',
  'ai_category_label', 'ai_risk_level', 'ai_liquidity_score',
  'ai_anomaly_flag', 'ai_anomaly_reason', 'ai_recommendations', 'ai_summary', 'ai_enriched_at',
  'digilocker_uri', 'document_available', 'raw_data_enc',
]

/**
 * Backend-owned nominee state: the nominee verifier sets has_nominee = TRUE.
 * The agent never downgrades a TRUE to NULL/false, and never clears a stored nominee name.
 */
const NOMINEE_MERGE = `
          has_nominee = CASE
            WHEN canonical_assets.has_nominee IS TRUE AND EXCLUDED.has_nominee IS NOT TRUE THEN TRUE
            ELSE COALESCE(EXCLUDED.has_nominee, canonical_assets.has_nominee)
          END,
          nominee_name_enc = COALESCE(EXCLUDED.nominee_name_enc, canonical_assets.nominee_name_enc)`

const UPSERT_SQL = (columns: string[]) => `
        INSERT INTO canonical_assets (${columns.join(', ')}, last_synced_at, next_sync_at, is_stale)
        VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}, NOW(), NOW() + INTERVAL '${SYNC_INTERVAL}', false)
        ON CONFLICT (dedup_hash) DO UPDATE SET
          ${UPDATE_COLUMNS.map(c => `${c} = EXCLUDED.${c}`).join(',\n          ')},${NOMINEE_MERGE},
          last_synced_at = NOW(),
          next_sync_at   = NOW() + INTERVAL '${SYNC_INTERVAL}',
          is_stale       = false,
          updated_at     = NOW()
        WHERE canonical_assets.user_id = EXCLUDED.user_id
        RETURNING id, (xmax = 0) AS is_new
      `

export function anomalyFingerprint(userId: string, anomalyType: string, subject: string): string {
  return createHash('sha256').update(`${userId}|${anomalyType}|${subject}`).digest('hex')
}

export interface InjectResult {
  created:      number
  updated:      number
  deactivated:  number
  anomalies:    number
}

/**
 * Upsert the run's assets, deactivate assets that a successfully loaded source no
 * longer reports, and upsert anomalies with their canonical ids — in one transaction
 * on the run's own connection.
 */
export async function injectToDatabaseTool(
  client: PoolClient,
  userId: string,
  runId: string,
  assets: CanonicalAsset[],
  opts: { loadedSources: SourceKey[]; detectAnomalies: boolean },
): Promise<InjectResult> {
  let created = 0
  let updated = 0
  let deactivated = 0
  let anomalies = 0

  try {
    await client.query('BEGIN')

    const idByHash = new Map<string, string>()
    for (const asset of assets) {
      const row     = assetRow(userId, runId, asset)
      const columns = row.map(([c]) => c)
      const values  = row.map(([, v]) => v)

      const res = await client.query(UPSERT_SQL(columns), values)

      // dedup_hash is globally unique (AssetMap's ancestral search relies on
      // ON CONFLICT (dedup_hash)). Hashes include the user id, but if one
      // ever matched another user's row the WHERE above blocks the update
      // and no row comes back — fail loudly instead of corrupting data.
      if (res.rows.length === 0) {
        throw new Error('A dedup_hash belongs to a different user; refusing to overwrite')
      }

      if (res.rows[0].is_new) created++
      else updated++
      if (asset.dedupHash) idByHash.set(asset.dedupHash, res.rows[0].id)
    }

    // Per-source deactivation: only sources that loaded successfully this run, and only
    // rows this run did not write. Failed / skipped sources keep their rows as they are.
    const primarySources = [...new Set(opts.loadedSources.flatMap(s => PRIMARY_SOURCES_BY_SOURCE[s] ?? []))]
    if (primarySources.length > 0) {
      const res = await client.query(`
        UPDATE canonical_assets
           SET is_active = false, updated_at = NOW()
         WHERE user_id = $1
           AND primary_source = ANY($2::text[])
           AND is_active IS NOT FALSE
           AND run_id IS DISTINCT FROM $3
      `, [userId, primarySources, runId])
      deactivated = res.rowCount ?? 0
    }

    if (opts.detectAnomalies) {
      for (const asset of assets) {
        if (!asset.ai_anomaly_flag) continue
        const anomalyType = 'suspicious_pattern'
        const subject     = asset.dedupHash ?? `${asset.assetClass}|${asset.institutionName ?? ''}`
        await client.query(`
          INSERT INTO asset_anomalies (
            run_id, user_id, canonical_id, anomaly_type, severity,
            description, ai_explanation, fingerprint, last_seen_at, occurrences
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), 1)
          ON CONFLICT (user_id, fingerprint) WHERE fingerprint IS NOT NULL DO UPDATE SET
            last_seen_at   = NOW(),
            -- a retry of the same run must not count the same sighting twice
            occurrences    = asset_anomalies.occurrences +
                             CASE WHEN asset_anomalies.run_id IS NOT DISTINCT FROM EXCLUDED.run_id THEN 0 ELSE 1 END,
            run_id         = EXCLUDED.run_id,
            description    = EXCLUDED.description,
            severity       = EXCLUDED.severity,
            ai_explanation = COALESCE(EXCLUDED.ai_explanation, asset_anomalies.ai_explanation),
            canonical_id   = COALESCE(EXCLUDED.canonical_id, asset_anomalies.canonical_id)
        `, [
          runId, userId,
          asset.dedupHash ? idByHash.get(asset.dedupHash) ?? null : null,
          anomalyType,
          'warning',
          `Anomaly detected in ${asset.assetClass} at ${truncate(asset.institutionName, 200) ?? 'unknown institution'}`,
          asset.ai_anomaly_reason ?? null,
          anomalyFingerprint(userId, anomalyType, subject),
        ])
        anomalies++
      }
    }

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  }

  console.log(`[InjectDB] run ${runId}: created ${created}, updated ${updated}, deactivated ${deactivated}, anomalies ${anomalies}`)
  return { created, updated, deactivated, anomalies }
}
