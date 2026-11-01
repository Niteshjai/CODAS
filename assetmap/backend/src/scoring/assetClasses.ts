/**
 * How the scorecard treats each canonical_assets.asset_class (the CHECK list from migration 032).
 *
 * Classes not listed in any group (INSURANCE_*, UNCLAIMED, AGRICULTURAL_LAND_MANUAL) are NOT
 * counted as assets the borrower can pledge or liquidate:
 *  - INSURANCE_*: current_value_paise is not a holding value. AA rows carry the policy's
 *    current/surrender value (usually 0); document-sourced rows carry the sum assured.
 *  - UNCLAIMED: money found in IEPF/EPFO registries that has not been recovered yet.
 *  - AGRICULTURAL_LAND_MANUAL: an unverified ancestral-search claim with no valuation.
 */
export const LIQUID_CLASSES      = ['BANK_ACCOUNT', 'FIXED_DEPOSIT'] as const
export const INVESTMENT_CLASSES  = ['MUTUAL_FUND', 'EQUITY', 'NPS', 'EPF', 'PPF', 'BOND', 'GOLD'] as const
export const PROPERTY_CLASSES    = ['LAND', 'PROPERTY', 'REAL_ESTATE'] as const
export const OTHER_ASSET_CLASSES = ['VEHICLE', 'OTHER'] as const

/** Every class whose current_value_paise counts towards the borrower's assets. */
export const COUNTED_ASSET_CLASSES: readonly string[] = [
  ...LIQUID_CLASSES, ...INVESTMENT_CLASSES, ...PROPERTY_CLASSES, ...OTHER_ASSET_CLASSES,
]

/**
 * Deterministic liquidity (0–100, 100 = cash today) per class, used when the agent has no AI
 * opinion. Its deterministic fallback writes ai_liquidity_score = 50 for every asset, so 50 is
 * treated as "no opinion" as well as NULL.
 */
export const CLASS_LIQUIDITY: Record<string, number> = {
  BANK_ACCOUNT: 95, FIXED_DEPOSIT: 80, MUTUAL_FUND: 85, EQUITY: 85, GOLD: 70, BOND: 60,
  NPS: 15, EPF: 20, PPF: 20, LAND: 10, PROPERTY: 10, REAL_ESTATE: 10, VEHICLE: 30, OTHER: 40,
}

export const AI_LIQUIDITY_FALLBACK = 50

export function effectiveLiquidity(assetClass: string, aiScore: number | null | undefined): number {
  const ai = aiScore == null ? null : Number(aiScore)
  if (ai !== null && Number.isFinite(ai) && ai !== AI_LIQUIDITY_FALLBACK) return Math.max(0, Math.min(100, ai))
  return CLASS_LIQUIDITY[assetClass] ?? 40
}
