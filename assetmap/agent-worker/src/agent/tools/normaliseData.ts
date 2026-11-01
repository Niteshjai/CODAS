import { CanonicalAsset, withComputedGainLoss } from '../schemas/canonicalAsset'
import { normaliseAAData }       from '../normaliser/aaDataNormaliser'
import { normaliseLandData }     from '../normaliser/landDataNormaliser'
import { normaliseDocumentData } from '../normaliser/documentNormaliser'
import { normaliseUnclaimedData }from '../normaliser/unclaimedNormaliser'
import { normaliseMCAData }      from '../normaliser/mcaDataNormaliser'
import { createHash }            from 'crypto'

export async function normaliseDataTool(
  userId: string,
  rawData: Record<string, any>
): Promise<CanonicalAsset[]> {

  const all: CanonicalAsset[] = []

  if (rawData.setu_aa)    all.push(...normaliseAAData(userId, rawData.setu_aa))
  if (rawData.surepass)   all.push(...normaliseLandData(userId, rawData.surepass))
  if (rawData.digilocker) all.push(...normaliseDocumentData(userId, rawData.digilocker))
  if (rawData.iepf_epfo)  all.push(...normaliseUnclaimedData(userId, rawData.iepf_epfo))
  if (rawData.mca21)      all.push(...normaliseMCAData(userId, rawData.mca21))

  // Attach dedup hash and derived gain/loss to each asset
  return all.map(asset => {
    const normalized = withComputedGainLoss(asset)
    return {
      ...normalized,
      dedupHash: generateDedupHash(normalized),
    }
  })
}

const norm = (s: string | undefined) =>
  s ? s.toLowerCase().replace(/[\s\-_/]+/g, '') : ''

/**
 * Hash that identifies one asset of one user, so the same asset reported
 * by two sources collapses to one row.
 *
 * - Always scoped by userId: canonical_assets upserts on (user_id, dedup_hash),
 *   and an unscoped hash let one user's run overwrite another user's row.
 * - Policy / folio numbers are globally unique, so they alone identify the
 *   asset — this lets a DigiLocker policy merge with the AA record even when
 *   the two sources spell the insurer differently.
 * - AA account refs are masked (XXXX1234) and collide across banks, so the
 *   institution is part of the key.
 * - Without any identifier, fall back to the source's own record id so that
 *   distinct records (e.g. two unclaimed dividends from one company) do not
 *   collapse into one.
 */
function generateDedupHash(asset: CanonicalAsset): string {
  let parts: string[]

  if (asset.policyNumber || asset.folioNumber) {
    parts = [asset.assetClass, 'id', norm(asset.policyNumber ?? asset.folioNumber)]
  } else if (asset.accountRef) {
    parts = [asset.assetClass, norm(asset.institutionName), 'acct', norm(asset.accountRef)]
  } else {
    const sourceRecordId = asset.sourceRecordIds?.[asset.primarySource]
    parts = [
      asset.assetClass,
      norm(asset.institutionName),
      asset.primarySource,
      sourceRecordId ? `rec:${norm(String(sourceRecordId))}` : `name:${norm(asset.assetName)}`,
    ]
  }

  const key = [asset.userId, ...parts].join(':')
  return createHash('sha256').update(key).digest('hex').slice(0, 32)
}
