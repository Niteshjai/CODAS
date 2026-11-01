import Anthropic    from '@anthropic-ai/sdk'
import { Pool }     from 'pg'
import { CanonicalAsset, RiskLevelEnum } from '../schemas/canonicalAsset'
import { clamp } from '../../utils/sanitize'

const MODEL      = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
/** Assets per Claude call — keeps each JSON reply well under max_tokens. */
const BATCH_SIZE = 25
const MAX_TOKENS = 16000

let anthropic: Anthropic | undefined
function client(): Anthropic {
  anthropic ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return anthropic
}

export type EnrichedAsset = CanonicalAsset & {
  ai_category_label:  string
  ai_risk_level:      CanonicalAsset['ai_risk_level']
  ai_liquidity_score: number
  ai_anomaly_flag:    boolean
  ai_anomaly_reason:  string | null
  ai_recommendations: string[]
  ai_summary:         string
  ai_enriched_at:     string
}

export interface EnrichResult {
  assets:            EnrichedAsset[]
  anomaliesDetected: number
  tokensUsed:        number
  aiCalls:           number
  usedFallback:      boolean
}

function defaultEnrichment(asset: CanonicalAsset): EnrichedAsset {
  return {
    ...asset,
    ai_category_label:  asset.assetName ?? asset.assetClass,
    ai_risk_level:      'medium',
    ai_liquidity_score: 50,
    ai_anomaly_flag:    false,
    ai_anomaly_reason:  null,
    ai_recommendations: [],
    ai_summary:         `${asset.assetClass} at ${asset.institutionName ?? 'unknown institution'}`,
    ai_enriched_at:     new Date().toISOString(),
  }
}

function buildPrompt(batch: Array<{ index: number; asset: CanonicalAsset }>, prevByClass: unknown): string {
  // Only non-identifying fields go to the model — no account, policy or folio numbers.
  const assetSummary = batch.map(({ index, asset: a }) => ({
    index,
    assetClass:       a.assetClass,
    institution:      a.institutionName,
    name:             a.assetName,
    valuePaise:       a.currentValuePaise,
    isDormant:        a.isDormant,
    hasNominee:       a.hasNominee,
    lastTransaction:  a.lastTransactionDate,
    source:           a.primarySource,
    subtype:          a.assetSubtype,
    quantity:         a.quantity,
    unit:             a.unit,
  }))

  return `
You are a financial analyst AI enriching asset data for an Indian user.
Analyse each asset and return structured enrichment data.

ASSETS TO ENRICH (${batch.length} in this batch):
${JSON.stringify(assetSummary, null, 2)}

PREVIOUS SNAPSHOT — total value in paise and count per asset class (for anomaly detection):
${JSON.stringify(prevByClass, null, 2)}

For each asset, return a JSON array with this exact structure:
[
  {
    "index": <number matching the asset index above>,
    "ai_category_label": "<human readable label under 100 characters e.g. 'Savings account - SBI'>",
    "ai_risk_level": "<one of: very_low, low, medium, high, very_high>",
    "ai_liquidity_score": <integer 0-100, 100=instantly liquid>,
    "ai_anomaly_flag": <boolean>,
    "ai_anomaly_reason": "<string or null>",
    "ai_recommendations": ["<short action item>"],
    "ai_summary": "<one sentence plain English description>"
  }
]

RISK LEVEL GUIDE:
- very_low: savings account, FD at major bank
- low: debt mutual fund, government bonds, NPS
- medium: balanced fund, blue chip equity, gold
- high: small cap equity, sectoral fund, ULIP
- very_high: penny stocks, illiquid assets

LIQUIDITY SCORE GUIDE:
- 95-100: savings account, liquid fund
- 80-90: mutual fund (T+3 redemption)
- 60-80: equity (T+2 settlement)
- 40-60: FD (premature withdrawal penalty)
- 10-40: NPS (partial withdrawal rules)
- 0-20: land, property, illiquid assets

ANOMALY DETECTION:
- Flag if the asset class total dropped > 30% vs previous snapshot
- Flag if a new account of unknown institution appears
- Flag if a dormant account suddenly has recent transactions
- Flag if land record ownership has changed
- Flag if value is implausibly high or zero for the asset type

Return ONLY the JSON array. No preamble, no explanation, no markdown.
`.trim()
}

/** Pull the JSON array out of the reply even if the model wrapped it in prose or fences. */
function parseEnrichments(text: string): any[] {
  const start = text.indexOf('[')
  const end   = text.lastIndexOf(']')
  if (start === -1 || end <= start) throw new Error('No JSON array in response')
  const parsed = JSON.parse(text.slice(start, end + 1))
  if (!Array.isArray(parsed)) throw new Error('Response JSON is not an array')
  return parsed
}

function applyEnrichment(asset: CanonicalAsset, e: any): EnrichedAsset {
  const riskLevel   = RiskLevelEnum.safeParse(e?.ai_risk_level)
  const liquidity   = clamp(e?.ai_liquidity_score, 0, 100)
  const recs        = Array.isArray(e?.ai_recommendations)
    ? e.ai_recommendations.filter((r: unknown) => typeof r === 'string' && r.trim()).slice(0, 10)
    : []

  return {
    ...asset,
    ai_category_label:  typeof e?.ai_category_label === 'string' && e.ai_category_label.trim()
      ? e.ai_category_label : (asset.assetName ?? asset.assetClass),
    ai_risk_level:      riskLevel.success ? riskLevel.data : 'medium',
    // INTEGER column — a float like 85.5 or a string would abort the insert
    ai_liquidity_score: liquidity === undefined ? 50 : Math.round(liquidity),
    ai_anomaly_flag:    e?.ai_anomaly_flag === true,
    ai_anomaly_reason:  typeof e?.ai_anomaly_reason === 'string' ? e.ai_anomaly_reason : null,
    ai_recommendations: recs,
    ai_summary:         typeof e?.ai_summary === 'string' ? e.ai_summary : '',
    ai_enriched_at:     new Date().toISOString(),
  }
}

export async function enrichWithAITool(
  pool: Pool,
  userId: string,
  assets: CanonicalAsset[],
  runId: string,
  options: { enrichWithAI?: boolean; detectAnomalies?: boolean } = {}
): Promise<EnrichResult> {
  const { enrichWithAI = true, detectAnomalies = true } = options

  if (!enrichWithAI || assets.length === 0) {
    return { assets: assets.map(defaultEnrichment), anomaliesDetected: 0, tokensUsed: 0, aiCalls: 0, usedFallback: false }
  }

  // Previous snapshot for anomaly detection
  const prevSnapshot = await pool.query(`
    SELECT asset_class, SUM(current_value_paise) AS total_value,
           COUNT(*) AS count
    FROM canonical_assets
    WHERE user_id = $1 AND is_active = true
    AND created_at < NOW() - INTERVAL '1 day'
    GROUP BY asset_class
  `, [userId])

  const prevByClass = Object.fromEntries(
    prevSnapshot.rows.map(r => [
      r.asset_class,
      { totalValue: Number(r.total_value), count: Number(r.count) }
    ])
  )

  const enriched: EnrichedAsset[] = assets.map(defaultEnrichment)
  let tokensUsed   = 0
  let aiCalls      = 0
  let usedFallback = false

  for (let offset = 0; offset < assets.length; offset += BATCH_SIZE) {
    const batch = assets
      .slice(offset, offset + BATCH_SIZE)
      .map((asset, i) => ({ index: offset + i, asset }))

    try {
      const response = await client().messages.create({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        messages:   [{ role: 'user', content: buildPrompt(batch, prevByClass) }],
      })
      aiCalls++
      tokensUsed += response.usage.input_tokens + response.usage.output_tokens

      if (response.stop_reason !== 'end_turn') {
        throw new Error(`Unexpected stop_reason: ${response.stop_reason}`)
      }

      const text = response.content
        .map(b => (b.type === 'text' ? b.text : ''))
        .join('')

      const byIndex = new Map<number, any>()
      for (const e of parseEnrichments(text)) {
        const idx = Number(e?.index)
        if (Number.isInteger(idx)) byIndex.set(idx, e)
      }

      for (const { index, asset } of batch) {
        const e = byIndex.get(index)
        if (e) enriched[index] = applyEnrichment(asset, e)
      }
    } catch (err: any) {
      // One failed batch must not lose the run — keep default enrichment for it
      usedFallback = true
      console.error(`[EnrichWithAI] Batch at ${offset} failed, using defaults:`, err.message)
    }
  }

  const anomalies = enriched.filter(a => a.ai_anomaly_flag)

  if (detectAnomalies) {
    // BullMQ retries reuse the same runId — clear this run's anomalies first
    // so a retry does not duplicate them.
    await pool.query(`DELETE FROM asset_anomalies WHERE run_id = $1`, [runId])
    for (const asset of anomalies) {
      await pool.query(`
        INSERT INTO asset_anomalies (
          run_id, user_id,
          anomaly_type, severity,
          description, ai_explanation
        ) VALUES ($1,$2,$3,$4,$5,$6)
      `, [
        runId, userId,
        'suspicious_pattern',
        'warning',
        `Anomaly detected in ${asset.assetClass} at ${asset.institutionName ?? 'unknown institution'}`,
        asset.ai_anomaly_reason,
      ])
    }
  }

  return {
    assets: enriched,
    anomaliesDetected: anomalies.length,
    tokensUsed,
    aiCalls,
    usedFallback,
  }
}
