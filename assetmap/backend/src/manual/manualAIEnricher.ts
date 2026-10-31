// ═══════════════════════════════════════════════════════════════
// AssetMap — Manual Asset AI Enricher
// Uses Claude to classify risk, liquidity, and generate suggestions
// Fire-and-forget — does not block asset creation
// ═══════════════════════════════════════════════════════════════

import { pool } from '../db/connection'
import { ASSET_CATEGORIES } from './assetCategories'
import { logger } from '../utils/logger'
import { CLAUDE_MODELS, generateJSON, describeClaudeError } from '../ai/claudeClient'

interface Enrichment {
  ai_category_label:  string
  ai_risk_level:      'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  ai_liquidity_score: number
  ai_summary:         string
  ai_suggestions:     string[]
}

const ENRICHMENT_SCHEMA = {
  type: 'object',
  properties: {
    ai_category_label:  { type: 'string' },
    ai_risk_level:      { type: 'string', enum: ['very_low', 'low', 'medium', 'high', 'very_high'] },
    ai_liquidity_score: { type: 'integer' },
    ai_summary:         { type: 'string' },
    ai_suggestions:     { type: 'array', items: { type: 'string' } },
  },
  required: ['ai_category_label', 'ai_risk_level', 'ai_liquidity_score', 'ai_summary', 'ai_suggestions'],
  additionalProperties: false,
}


// extra_fields keys that describe the asset without identifying a person, property or entity
const AI_SAFE_EXTRA_FIELDS = new Set([
  'property_type', 'monthly_rent', 'city', 'state', 'area_sqft', 'area_acres', 'land_type',
  'year', 'year_created', 'weight_grams', 'purity', 'form', 'item_type', 'is_hallmarked',
  'has_certificate', 'quantity', 'vehicle_type', 'make', 'model', 'fuel_type',
  'token_symbol', 'token_name', 'purchase_price_per_token', 'exchange_name', 'storage_type',
  'title_status', 'ownership_type', 'ownership_pct', 'stake_type', 'stake_pct',
  'number_of_shares', 'vesting_schedule', 'last_funding_round', 'industry', 'business_type',
  'annual_revenue', 'annual_profit', 'generates_revenue', 'relationship', 'recovery_confidence',
  'loan_date', 'loan_outstanding', 'interest_rate_pct', 'expected_repayment_date',
  'has_written_agreement', 'has_home_loan', 'is_self_occupied', 'is_rented', 'is_insured', 'insured',
  'months_completed', 'monthly_contribution', 'duration_months', 'chit_value', 'already_received_prize',
  'ip_type', 'expiry_date', 'currency', 'foreign_currency', 'amount_in_foreign_currency',
  'country', 'fema_compliant', 'asset_type',
])

export const manualAIEnricher = {

  async enrich(
    userId:  string,
    assetId: string
  ): Promise<void> {
    const asset = await pool.query(
      'SELECT * FROM manual_assets WHERE id = $1 AND user_id = $2',
      [assetId, userId]
    )
    if (!asset.rows[0]) return

    const a      = asset.rows[0]
    const config = ASSET_CATEGORIES[a.asset_category]

    // Skip if no API key configured
    if (!process.env.ANTHROPIC_API_KEY) {
      logger.info('[ManualAIEnricher] Skipped — no ANTHROPIC_API_KEY configured')
      return
    }

    // Data minimisation: only non-identifying structured fields leave our systems.
    // Free text (name, description) and identifiers (borrower name, registration/survey numbers,
    // CIN, GSTIN, exact locations) are never sent to the LLM provider.
    const extraFields = Object.fromEntries(
      Object.entries((a.extra_fields ?? {}) as Record<string, unknown>)
        .filter(([key]) => AI_SAFE_EXTRA_FIELDS.has(key))
    )

    const prompt = `
You are a financial advisor analysing a manually entered asset for an Indian user.

Asset details:
Category:      ${config?.label ?? a.asset_category}
Current value: ₹${Math.round(a.current_value_paise / 100).toLocaleString('en-IN')}
Purchase value:₹${Math.round((a.purchase_value_paise ?? 0) / 100).toLocaleString('en-IN')}
Extra details: ${JSON.stringify(extraFields)}
Valuation:     ${a.valuation_method}

Return these fields:
{
  "ai_category_label": "<emoji + descriptive label, e.g. '🥇 22K Gold Jewellery — 50g'>",
  "ai_risk_level": "<very_low|low|medium|high|very_high>",
  "ai_liquidity_score": <0-100>,
  "ai_summary": "<one sentence plain English description>",
  "ai_suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>"]
}
`.trim()

    try {
      const enrichment = await generateJSON<Enrichment>({
        model:     CLAUDE_MODELS.standard,
        prompt,
        schema:    ENRICHMENT_SCHEMA,
        maxTokens: 4000,
        effort:    'low',
      })
      const liquidity = Math.min(100, Math.max(0, Math.round(enrichment.ai_liquidity_score)))

      await pool.query(`
        UPDATE manual_assets SET
          ai_category_label  = $2,
          ai_risk_level      = $3,
          ai_liquidity_score = $4,
          ai_summary         = $5,
          ai_suggestions     = $6,
          ai_enriched_at     = NOW()
        WHERE id = $1
      `, [
        assetId,
        enrichment.ai_category_label,
        enrichment.ai_risk_level,
        liquidity,
        enrichment.ai_summary,
        enrichment.ai_suggestions ?? [],
      ])

      logger.info('[ManualAIEnricher] Enriched asset', { assetId })
    } catch (err) {
      logger.error('[ManualAIEnricher] Failed', { error: describeClaudeError(err) })
      // Don't throw — enrichment failure should not block asset creation
    }
  },
}
