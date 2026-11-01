import { Pool } from 'pg'
import { createHash } from 'crypto'
import { classifyTransactions, AiBatchClassifier, PipelineTx, AiStatus, ClassificationLayer, claudeBatchClassifier } from '../classifier/classificationPipeline'
import { inferMode } from '../classifier/merchantNormaliser'
import { aiHealth } from '../ai/aiHealth'
import { logger } from '../utils/logger'
import { runAnalysis, latestDataMonth, AnalysisResult } from './spendAnalysis'
import { buildFacts, narrateInsights, storeInsights, mapInsightRow, NarrationFn, claudeNarrator } from './spendInsights'
import { getNeedsProfile } from './needsProfile'

// ═══════════════════════════════════════════════════════════════
// Orchestration: classify → rebuild monthly summary → analyse → insights.
// Runs inline from POST /api/spend/analyze (small backlogs) or in the classifier worker.
// ═══════════════════════════════════════════════════════════════

/** Inline runs above this many unclassified transactions are handed to the worker instead. */
export const INLINE_CLASSIFY_LIMIT = 300
const MAX_PER_RUN = 2000

// Rows created by accountAggregator's non-production "incremental sync" simulation are not real
// bank data; they are never classified, so they can't show up as spending.
const SIMULATED_NARRATIONS = ['Incremental Sync Credit', 'Incremental Sync Debit']

export interface AiDeps {
  classifier?: AiBatchClassifier | null
  narrator?: NarrationFn | null
}

export interface ClassificationSummary {
  classified: number
  reclassified: number
  needsReview: number
  aiStatus: AiStatus
  byLayer: Record<ClassificationLayer, number>
}

export async function countPendingTransactions(pool: Pool, userId: string): Promise<number> {
  const res = await pool.query(`
    SELECT COUNT(*)::int AS n FROM transactions t
     WHERE t.user_id = $1 AND t.narration IS NOT NULL AND t.amount > 0
       AND NOT (t.narration = ANY($2::text[]))
       AND NOT EXISTS (SELECT 1 FROM classified_transactions c WHERE c.user_id = $1 AND c.source_txn_id = t.id)
  `, [userId, SIMULATED_NARRATIONS])
  return res.rows[0].n
}

/** Classify AA transactions that haven't been classified yet (idempotent via source_txn_id). */
export async function classifyPendingTransactions(
  pool: Pool, userId: string, ai: AiBatchClassifier | null = claudeBatchClassifier,
): Promise<ClassificationSummary> {
  const raw = await pool.query(`
    SELECT t.id, to_char(t.date, 'YYYY-MM-DD') AS d, t.narration, t.type, t.amount, t.reference,
           a.institution_name
      FROM transactions t
      LEFT JOIN asset_snapshots_aa a ON a.id = t.account_id
     WHERE t.user_id = $1 AND t.narration IS NOT NULL AND t.amount > 0
       AND NOT (t.narration = ANY($2::text[]))
       AND NOT EXISTS (SELECT 1 FROM classified_transactions c WHERE c.user_id = $1 AND c.source_txn_id = t.id)
     ORDER BY t.date ASC
     LIMIT $3
  `, [userId, SIMULATED_NARRATIONS, MAX_PER_RUN])

  const txs: PipelineTx[] = raw.rows.map((r: any) => ({
    key: r.id,
    narration: r.narration,
    amountPaise: Math.round(parseFloat(r.amount) * 100),
    type: String(r.type).toLowerCase() === 'credit' ? 'credit' : 'debit',
    date: new Date(`${r.d}T00:00:00Z`),
    mode: inferMode(r.narration),
  }))
  const run = await classifyTransactions(pool, userId, txs, { ai })
  const byId = new Map(raw.rows.map((r: any) => [r.id, r]))

  let classified = 0
  for (const tx of txs) {
    const r = run.results.get(tx.key)
    if (!r) continue
    const src = byId.get(tx.key)
    const dedupHash = createHash('sha256').update(`${userId}:${tx.key}`).digest('hex')
    const ins = await pool.query(`
      INSERT INTO classified_transactions (
        user_id, source_txn_id, bank_name, transaction_date, narration, amount_paise,
        transaction_type, reference_number, mode, merchant_name, category, subcategory,
        category_group, confidence, classified_by, classification_reason, is_emi, is_recurring,
        needs_review, review_reason, dedup_hash
      ) VALUES ($1,$2,$3,$4::date,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      ON CONFLICT DO NOTHING
    `, [
      userId, tx.key, src?.institution_name ?? null, src?.d, tx.narration, tx.amountPaise,
      tx.type, src?.reference ?? null, tx.mode ?? null, r.merchantName, r.category, r.subcategory,
      r.categoryGroup, r.confidence, r.classifiedBy, r.reason, r.isEmi, r.isRecurring,
      r.needsReview, r.reviewReason, dedupHash,
    ])
    classified += ins.rowCount ?? 0
  }
  return { classified, reclassified: 0, needsReview: run.needsReview, aiStatus: run.aiStatus, byLayer: run.byLayer }
}

/**
 * Re-run the pipeline over already-classified rows the user hasn't corrected — picks up
 * merchant memory learned since (user corrections, crowd promotions).
 */
export async function reclassifyExisting(
  pool: Pool, userId: string, ai: AiBatchClassifier | null = claudeBatchClassifier,
): Promise<ClassificationSummary> {
  const rows = await pool.query(`
    SELECT id, narration, amount_paise, transaction_type, to_char(transaction_date, 'YYYY-MM-DD') AS d, mode,
           category, needs_review
      FROM classified_transactions
     WHERE user_id = $1 AND user_corrected_at IS NULL AND classified_by <> 'user' AND is_ignored = false
     ORDER BY transaction_date DESC
     LIMIT $2
  `, [userId, MAX_PER_RUN])
  const txs: PipelineTx[] = rows.rows.map((r: any) => ({
    key: r.id, narration: r.narration, amountPaise: Number(r.amount_paise), type: r.transaction_type,
    date: new Date(`${r.d}T00:00:00Z`), mode: r.mode ?? inferMode(r.narration),
  }))
  const run = await classifyTransactions(pool, userId, txs, { ai })
  let changed = 0
  for (const row of rows.rows) {
    const r = run.results.get(row.id)
    if (!r) continue
    const upd = await pool.query(`
      UPDATE classified_transactions
         SET merchant_name = $3, category = $4, subcategory = $5, category_group = $6, confidence = $7,
             classified_by = $8, classification_reason = $9, is_emi = $10, is_recurring = $11,
             needs_review = $12, review_reason = $13, updated_at = NOW()
       WHERE id = $1 AND user_id = $2 AND user_corrected_at IS NULL
         AND (category IS DISTINCT FROM $4 OR needs_review IS DISTINCT FROM $12 OR merchant_name IS DISTINCT FROM $3
              OR review_reason IS DISTINCT FROM $13 OR confidence IS DISTINCT FROM $7)
    `, [row.id, userId, r.merchantName, r.category, r.subcategory, r.categoryGroup, r.confidence,
        r.classifiedBy, r.reason, r.isEmi, r.isRecurring, r.needsReview, r.reviewReason])
    changed += upd.rowCount ?? 0
  }
  return { classified: 0, reclassified: changed, needsReview: run.needsReview, aiStatus: run.aiStatus, byLayer: run.byLayer }
}

/** monthly_spend_summary is a cache of classified_transactions; rebuilt wholesale so corrections can't leave stale rows. */
export async function rebuildMonthlySummary(pool: Pool, userId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Serialise rebuilds per user (corrections, inline /analyze and worker jobs can overlap):
    // without it a second DELETE can't see the first transaction's uncommitted INSERTs and the
    // second INSERT collides with UNIQUE (user_id, month, category).
    await client.query(`SELECT pg_advisory_xact_lock(hashtext('spend_summary:' || $1::text))`, [userId])
    await client.query('DELETE FROM monthly_spend_summary WHERE user_id = $1', [userId])
    await client.query(`
      INSERT INTO monthly_spend_summary (
        user_id, month, category, category_group, total_paise, transaction_count, avg_per_tx_paise, largest_tx_paise
      )
      SELECT user_id, DATE_TRUNC('month', transaction_date)::DATE, category, MIN(category_group),
             SUM(amount_paise), COUNT(*), AVG(amount_paise)::BIGINT, MAX(amount_paise)
        FROM classified_transactions
       WHERE user_id = $1 AND is_ignored = false
         AND ((category_group = 'expense' AND transaction_type = 'debit')
           OR (category_group = 'revenue' AND transaction_type = 'credit'))
       GROUP BY user_id, DATE_TRUNC('month', transaction_date)::DATE, category
    `, [userId])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function listInsights(pool: Pool, userId: string, month: string | null, includeDismissed = false) {
  const res = await pool.query(`
    SELECT *, to_char(month, 'YYYY-MM') AS month_key FROM spend_insights
     WHERE user_id = $1
       AND ($2::date IS NULL AND month >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months' OR month = $2::date)
       AND ($3::boolean OR dismissed_at IS NULL)
     ORDER BY month DESC, priority DESC, created_at DESC
     LIMIT 30
  `, [userId, month ? `${month}-01` : null, includeDismissed])
  return res.rows.map(mapInsightRow)
}

export interface AnalyzeOutcome {
  month: string | null
  hasData: boolean
  classification: ClassificationSummary
  generatedBy: 'ai' | 'template' | 'mixed' | 'none'
  insights: ReturnType<typeof mapInsightRow>[]
  aiAvailability: ReturnType<typeof aiHealth.status>['availability']
  analysis: AnalysisResult | null
}

// Runs for the same user are serialised in this process (workers run in-process, see index.ts):
// an inline /analyze, a queued /analyze and a /reclassify job would otherwise classify the same
// pending rows at once and pay for duplicate Claude batches.
const userRuns = new Map<string, Promise<unknown>>()

function serialisePerUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  const prev = userRuns.get(userId) ?? Promise.resolve()
  const next = prev.catch(() => {}).then(fn)
  userRuns.set(userId, next)
  const cleanup = () => { if (userRuns.get(userId) === next) userRuns.delete(userId) }
  next.then(cleanup, cleanup)
  return next
}

/** Full run for one user. `month` defaults to the latest month with data. */
export function runSpendAnalysis(
  pool: Pool, userId: string,
  opts: { month?: string | null; ai?: AiDeps; reclassify?: boolean } = {},
): Promise<AnalyzeOutcome> {
  return serialisePerUser(userId, () => runSpendAnalysisNow(pool, userId, opts))
}

async function runSpendAnalysisNow(
  pool: Pool, userId: string,
  opts: { month?: string | null; ai?: AiDeps; reclassify?: boolean },
): Promise<AnalyzeOutcome> {
  const classifier = opts.ai?.classifier === undefined ? claudeBatchClassifier : opts.ai.classifier
  const narrator = opts.ai?.narrator === undefined ? claudeNarrator : opts.ai.narrator

  const classification = await classifyPendingTransactions(pool, userId, classifier)
  if (opts.reclassify) {
    const re = await reclassifyExisting(pool, userId, classifier)
    classification.reclassified = re.reclassified
    classification.needsReview += re.needsReview
    if (re.aiStatus !== 'not_needed') classification.aiStatus = re.aiStatus
  }
  await rebuildMonthlySummary(pool, userId)

  const month = opts.month ?? await latestDataMonth(pool, userId)
  if (!month) {
    return { month: null, hasData: false, classification, generatedBy: 'none', insights: [], aiAvailability: aiHealth.status().availability, analysis: null }
  }

  const [analysis, profile] = await Promise.all([runAnalysis(pool, userId, month), getNeedsProfile(pool, userId)])
  const facts = analysis.hasData ? buildFacts(analysis, profile) : []
  const run = await narrateInsights(facts, profile, month, narrator)
  await storeInsights(pool, userId, month, run.insights)
  logger.info('[Spend] Analysis complete', {
    userId, month, classified: classification.classified, needsReview: classification.needsReview,
    facts: facts.length, insights: run.insights.length, generatedBy: run.generatedBy,
  })

  return {
    month, hasData: analysis.hasData, classification, generatedBy: run.generatedBy,
    insights: await listInsights(pool, userId, month),
    aiAvailability: aiHealth.status().availability,
    analysis,
  }
}
