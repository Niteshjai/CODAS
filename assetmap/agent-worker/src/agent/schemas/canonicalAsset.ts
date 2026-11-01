import { z } from 'zod'

// ─────────────────────────────────────────────
// Canonical Asset Schema
// The unified schema that ALL platform features
// consume. Never read directly from external APIs.
// ─────────────────────────────────────────────

export const AssetClassEnum = z.enum([
  'BANK_ACCOUNT', 'FIXED_DEPOSIT', 'MUTUAL_FUND',
  'EQUITY', 'NPS', 'INSURANCE_LIFE', 'INSURANCE_HEALTH',
  'INSURANCE_OTHER', 'LAND', 'PROPERTY', 'EPF', 'PPF',
  'BOND', 'GOLD', 'VEHICLE', 'UNCLAIMED', 'OTHER'
])

export const PrimarySourceEnum = z.enum([
  'setu_aa', 'surepass', 'digilocker',
  'iepf', 'epfo', 'mca21', 'irdai', 'manual'
])

export const RiskLevelEnum = z.enum([
  'very_low', 'low', 'medium', 'high', 'very_high'
])

export const CanonicalAssetSchema = z.object({
  userId:             z.string().uuid(),
  runId:              z.string().uuid().optional(),

  assetClass:         AssetClassEnum,

  primarySource:      PrimarySourceEnum,
  secondarySources:   z.array(z.string()).default([]),
  sourceRecordIds:    z.record(z.string()).default({}),

  institutionName:    z.string().optional(),
  institutionType:    z.string().optional(),
  institutionIfsc:    z.string().optional(),

  accountRef:         z.string().optional(),
  policyNumber:       z.string().optional(),
  folioNumber:        z.string().optional(),

  currentValuePaise:  z.number().int().min(0).default(0),
  investedValuePaise: z.number().int().min(0).default(0),
  gainLossPaise:      z.number().int().default(0),
  gainLossPct:        z.number().optional(),
  currency:           z.string().default('INR'),

  assetName:          z.string().optional(),
  assetSubtype:       z.string().optional(),
  quantity:           z.number().optional(),
  unit:               z.string().optional(),

  isActive:           z.boolean().default(true),
  isDormant:          z.boolean().default(false),
  hasNominee:         z.boolean().optional(),
  nomineeName:        z.string().optional(),
  titleStatus:        z.string().optional(),
  ownershipType:      z.string().optional(),

  openedDate:         z.string().optional(),
  maturityDate:       z.string().optional(),
  lastTransactionDate:z.string().optional(),
  valuationDate:      z.string().optional(),

  digilockerUri:      z.string().optional(),
  documentAvailable:  z.boolean().default(false),

  dedupHash:          z.string().optional(),

  // Populated by enrich_with_ai step
  ai_category_label:  z.string().optional(),
  ai_risk_level:      RiskLevelEnum.optional(),
  ai_liquidity_score: z.number().int().min(0).max(100).optional(),
  ai_anomaly_flag:    z.boolean().optional(),
  ai_anomaly_reason:  z.string().nullable().optional(),
  ai_recommendations: z.array(z.string()).optional(),
  ai_summary:         z.string().optional(),
  ai_enriched_at:     z.string().optional(),

  rawData:            z.record(z.any()).default({}),
})

export type CanonicalAsset = z.infer<typeof CanonicalAssetSchema>

/** Derive gain/loss when the source API omits it. */
export function withComputedGainLoss(asset: CanonicalAsset): CanonicalAsset {
  if (
    asset.gainLossPaise === 0 &&
    asset.investedValuePaise > 0 &&
    asset.currentValuePaise > 0
  ) {
    const gainLossPaise = asset.currentValuePaise - asset.investedValuePaise
    return {
      ...asset,
      gainLossPaise,
      gainLossPct: Math.round(
        (gainLossPaise / asset.investedValuePaise) * 10000
      ) / 100,
    }
  }
  return asset
}

// ─────────────────────────────────────────────
// Agent Run Context Schema
// Passed to the orchestrator on every run.
// ─────────────────────────────────────────────

export const ALL_SOURCES = [
  'setu_aa', 'surepass', 'digilocker', 'iepf_epfo', 'mca21',
] as const

export const TriggerTypeEnum = z.enum([
  'consent_granted', 'cron_scheduled', 'user_refresh',
  'estate_case', 'manual_admin', 'webhook'
])

export const AgentOptionsSchema = z.object({
  forceRefresh:       z.boolean().default(false),
  skipCache:          z.boolean().default(false),
  enrichWithAI:       z.boolean().default(true),
  detectAnomalies:    z.boolean().default(true),
  triggerAlerts:      z.boolean().default(true),
  isEstateCase:       z.boolean().default(false),
})

export const AgentContextSchema = z.object({
  runId:          z.string().uuid(),
  userId:         z.string().uuid(),
  triggerType:    TriggerTypeEnum,
  triggerMetadata:z.record(z.any()).default({}),
  consentId:      z.string().optional(),
  userProfile:    z.object({
    name:         z.string(),
    mobile:       z.string(),
    pan:          z.string().optional(),
    aadhaarHash:  z.string().optional(),
    // Needed for land-record search. When absent the land fetch is
    // skipped rather than letting the model guess a state.
    state:        z.string().optional(),
    stateCode:    z.string().optional(),
    district:     z.string().optional(),
  }),
  // Source keys match the raw-data keys the orchestrator collects.
  // 'iepf' / 'epfo' are accepted as aliases for 'iepf_epfo'.
  sourcesToFetch: z.array(z.string()).default([...ALL_SOURCES]),
  options: AgentOptionsSchema.default({
    forceRefresh: false,
    skipCache: false,
    enrichWithAI: true,
    detectAnomalies: true,
    triggerAlerts: true,
    isEstateCase: false,
  }),
})

export type AgentContext = z.infer<typeof AgentContextSchema>
