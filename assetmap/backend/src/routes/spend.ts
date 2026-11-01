import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { verifyAccessToken }    from '../middleware/auth'
import { userRateLimit } from '../middleware/userRateLimit'
import { planEnforcer }         from '../plans/planEnforcer'
import { pool }                 from '../db/connection'
import { auditLogger }          from '../services/auditLogger'
import { successResponse, errorResponse, ERROR_CODES } from '../utils/constants'
import { CATEGORIES, CATEGORY_BY_ID } from '../classifier/categoryConfig'
import { applyCorrection }      from '../classifier/merchantLearning'
import { aiHealth }             from '../ai/aiHealth'
import { SpendError, MONTH_PATTERN, currentMonthKey } from '../spend/spendError'
import {
  getNeedsProfile, updateNeedsProfile, profileOptions, computeBreakdown, DEFAULT_BUCKETS,
  PRIORITY_IDS, BUCKETS, ProfilePatch,
} from '../spend/needsProfile'
import {
  runAnalysis, latestDataMonth, loadAnalysisTxs, loadBudgets, spendRowsForMonth, computeMonthTotals, INCOME_CATEGORIES,
} from '../spend/spendAnalysis'
import { askAboutSpending } from '../spend/spendAsk'
import {
  runSpendAnalysis, rebuildMonthlySummary, countPendingTransactions, listInsights, INLINE_CLASSIFY_LIMIT,
} from '../spend/spendOrchestrator'
import { mapInsightRow } from '../spend/spendInsights'

// Spend Analyser API (/api/spend). Every route is user-scoped and gated on the spend_analyser
// plan feature (subscriptions: subscription_detector). See spend/ and classifier/ for the engine.

const UUID = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
const txIdParams = { type: 'object', required: ['txId'], properties: { txId: { type: 'string', pattern: UUID } } }
const monthQuery = {
  type: 'object',
  properties: { month: { type: 'string', pattern: MONTH_PATTERN } },
  additionalProperties: false,
}

function handleError(reply: FastifyReply, err: unknown) {
  if (err instanceof SpendError) return reply.status(err.statusCode).send(errorResponse(err.code, err.message))
  throw err
}

const audit = (req: FastifyRequest, action: 'SPEND_ANALYSIS_RUN' | 'SPEND_CATEGORY_CORRECTED' | 'SPEND_PROFILE_UPDATED',
  entityType: string, entityId: string | undefined, metadata: Record<string, unknown>) =>
  auditLogger.log(req.user!.id, action, entityType, entityId, req.ip, req.headers['user-agent'], metadata)

function mapTx(r: any) {
  return {
    id: r.id,
    date: r.d,
    merchantName: r.merchant_name,
    narration: r.narration,
    amountPaise: Number(r.amount_paise),
    type: r.transaction_type,
    category: r.category,
    categoryLabel: CATEGORY_BY_ID.get(r.category)?.label ?? r.category,
    subcategory: r.subcategory,
    categoryGroup: r.category_group,
    confidence: r.confidence,
    classifiedBy: r.classified_by,
    reason: r.classification_reason,
    needsReview: r.needs_review,
    reviewReason: r.review_reason,
    isRecurring: r.is_recurring,
    isEmi: r.is_emi,
    userCorrected: Boolean(r.user_corrected_at),
    notes: r.user_notes,
    bankName: r.bank_name,
    mode: r.mode,
  }
}

const TX_COLUMNS = `
  id, to_char(transaction_date, 'YYYY-MM-DD') AS d, merchant_name, narration, amount_paise, transaction_type,
  category, subcategory, category_group, confidence, classified_by, classification_reason,
  needs_review, review_reason, is_recurring, is_emi, user_corrected_at, user_notes, bank_name, mode`

export async function spendAnalyticsRoutes(app: FastifyInstance) {
  const gated = [verifyAccessToken, planEnforcer.requireFeature('spend_analyser', pool)]

  // ── Status: does this user have data? (drives the honest empty state) ──────
  app.get('/status', { preHandler: gated }, async (req, reply) => {
    const userId = req.user!.id
    const [counts, months, linked, pending, lastInsight] = await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS classified,
               COUNT(*) FILTER (WHERE needs_review AND NOT is_ignored)::int AS needs_review
          FROM classified_transactions WHERE user_id = $1`, [userId]),
      pool.query(`
        SELECT to_char(DATE_TRUNC('month', transaction_date), 'YYYY-MM') AS month, COUNT(*)::int AS tx_count
          FROM classified_transactions WHERE user_id = $1 AND is_ignored = false
         GROUP BY 1 ORDER BY 1 DESC LIMIT 24`, [userId]),
      pool.query(`SELECT COUNT(*)::int AS n FROM asset_snapshots_aa WHERE user_id = $1 AND fi_type = 'DEPOSIT'`, [userId]),
      countPendingTransactions(pool, userId),
      pool.query(`SELECT MAX(updated_at) AS at FROM spend_insights WHERE user_id = $1`, [userId]),
    ])
    const classified = counts.rows[0].classified
    return reply.send(successResponse({
      hasData: classified > 0,
      classifiedCount: classified,
      needsReviewCount: counts.rows[0].needs_review,
      pendingCount: pending,
      hasLinkedBankAccount: linked.rows[0].n > 0,
      latestMonth: months.rows[0]?.month ?? null,
      months: months.rows.map((r: any) => ({ month: r.month, txCount: r.tx_count })),
      lastAnalyzedAt: lastInsight.rows[0]?.at ? new Date(lastInsight.rows[0].at).toISOString() : null,
      ai: { availability: aiHealth.status().availability },
      emptyState: classified > 0 ? null : {
        title: 'No spending to analyse yet',
        body: pending > 0
          ? 'We have transactions from your linked bank account that haven\'t been analysed yet. Run the analysis to categorise them.'
          : linked.rows[0].n > 0
            ? 'Your linked bank account hasn\'t shared any transactions with us yet. Spending appears here once transactions arrive through Account Aggregator.'
            : 'Your spending appears here after you link a bank account through Account Aggregator. We only read transactions you consent to share.',
        actionLabel: pending > 0 ? 'Analyse my spending' : linked.rows[0].n > 0 ? 'Manage linked accounts' : 'Link a bank account',
        actionUrl: pending > 0 ? null : '/dashboard?tab=discovery',
      },
    }))
  })

  // ── Category catalogue (for pickers) ────────────────────────────────────
  app.get('/categories', { preHandler: gated }, async (_req, reply) => {
    return reply.send(successResponse(CATEGORIES.map((c) => ({
      id: c.id, label: c.label, group: c.group, emoji: c.emoji, color: c.color,
      subcategories: c.subcategories, defaultBucket: c.group === 'expense' ? (DEFAULT_BUCKETS[c.id] ?? 'wants') : null,
    }))))
  })

  // ── Summary for a month (or a trailing window) ──────────────────────────
  app.get('/summary', {
    preHandler: gated,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          month:  { type: 'string', pattern: MONTH_PATTERN },
          months: { type: 'integer', minimum: 1, maximum: 24 },
        },
      },
    },
  }, async (req, reply) => {
    const { month, months = 1 } = req.query as { month?: string; months?: number }
    const target = `${month ?? currentMonthKey()}-01`
    const result = await pool.query(`
      SELECT category, category_group,
             SUM(total_paise)::bigint       AS total_paise,
             SUM(transaction_count)::int    AS transaction_count,
             MAX(largest_tx_paise)::bigint  AS largest_tx_paise
        FROM monthly_spend_summary
       WHERE user_id = $1
         AND month >= ($2::date) - MAKE_INTERVAL(months => $3::int)
         AND month <= $2::date
         AND category_group IN ('expense','revenue')
       GROUP BY category, category_group
       ORDER BY total_paise DESC
    `, [req.user!.id, target, months - 1])
    // Transfers aren't in the summary cache; the savings rate still counts money sent to people / card bills as out
    const transfers = await pool.query(`
      SELECT COALESCE(SUM(amount_paise), 0)::bigint AS paise
        FROM classified_transactions
       WHERE user_id = $1 AND is_ignored = false AND transaction_type = 'debit' AND category_group = 'transfer'
         AND COALESCE(subcategory, '') <> 'Self'
         AND transaction_date >= (($2::date) - MAKE_INTERVAL(months => $3::int))
         AND transaction_date < (($2::date) + INTERVAL '1 month')
    `, [req.user!.id, target, months - 1])
    const transfersOut = Number(transfers.rows[0].paise)

    const rows = result.rows.map((r: any) => ({
      category: r.category, label: CATEGORY_BY_ID.get(r.category)?.label ?? r.category,
      category_group: r.category_group, total_paise: Number(r.total_paise),
      transaction_count: r.transaction_count, largest_tx_paise: Number(r.largest_tx_paise),
    }))
    const expenses = rows.filter((r) => r.category_group === 'expense')
    const revenue  = rows.filter((r) => r.category_group === 'revenue')
    const totalExpense = expenses.reduce((s, r) => s + r.total_paise, 0)
    const totalRevenue = revenue.reduce((s, r) => s + r.total_paise, 0)
    const income = revenue.filter((r) => INCOME_CATEGORIES.has(r.category)).reduce((s, r) => s + r.total_paise, 0)
    const spending = expenses.filter((r) => r.category !== 'INVESTMENTS').reduce((s, r) => s + r.total_paise, 0)
    return reply.send(successResponse({
      period: { months, endMonth: target.slice(0, 7) },
      expenses, revenue,
      totalExpensePaise: totalExpense,
      totalRevenuePaise: totalRevenue,
      netPaise: totalRevenue - totalExpense,
      // Same definition as /analysis (savingsSummary): income categories only (refunds are not
      // income), investments count as saved, transfers to people / card bills as money out
      transfersOutPaise: transfersOut,
      savingsRatePct: income > 0 ? Math.round(((income - spending - transfersOut) / income) * 100) : null,
    }))
  })

  // ── Transactions list ───────────────────────────────────────────────────
  app.get('/transactions', {
    preHandler: gated,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          category:    { type: 'string', maxLength: 50 },
          month:       { type: 'string', pattern: MONTH_PATTERN },
          type:        { type: 'string', enum: ['debit', 'credit'] },
          search:      { type: 'string', maxLength: 100 },
          needsReview: { type: 'boolean' },
          page:        { type: 'integer', minimum: 1, default: 1 },
          limit:       { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        },
      },
    },
  }, async (req, reply) => {
    const { category, month, type, search, needsReview, page = 1, limit = 50 } = req.query as any
    const conditions = ['user_id = $1', 'is_ignored = false']
    const params: any[] = [req.user!.id]
    let idx = 2
    if (category) { conditions.push(`category = $${idx++}`); params.push(category) }
    if (month) { conditions.push(`DATE_TRUNC('month', transaction_date) = $${idx++}::date`); params.push(`${month}-01`) }
    if (type) { conditions.push(`transaction_type = $${idx++}`); params.push(type) }
    if (needsReview !== undefined) { conditions.push(`needs_review = $${idx++}`); params.push(needsReview) }
    if (search) {
      conditions.push(`(LOWER(narration) LIKE $${idx} OR LOWER(merchant_name) LIKE $${idx})`)
      params.push(`%${String(search).toLowerCase().replace(/[%_\\]/g, '\\$&')}%`)
      idx++
    }
    const where = conditions.join(' AND ')
    const [txResult, countResult] = await Promise.all([
      pool.query(`SELECT ${TX_COLUMNS} FROM classified_transactions WHERE ${where}
                  ORDER BY transaction_date DESC, created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
                 [...params, limit, (page - 1) * limit]),
      pool.query(`SELECT COUNT(*)::int AS count FROM classified_transactions WHERE ${where}`, params),
    ])
    return reply.send(successResponse({
      transactions: txResult.rows.map(mapTx), total: countResult.rows[0].count, page, limit,
    }))
  })

  // ── Correct a category (learning loop) ──────────────────────────────────
  const correctionBody = {
    type: 'object',
    required: ['category'],
    properties: {
      category:        { type: 'string', minLength: 2, maxLength: 50 },
      subcategory:     { type: 'string', maxLength: 100 },
      notes:           { type: ['string', 'null'], maxLength: 500 }, // null or '' removes the note
      applyToMerchant: { type: 'boolean', default: false },
    },
    additionalProperties: false,
  }

  const correct = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const { txId } = req.params as { txId: string }
      const body = req.body as { category: string; subcategory?: string; notes?: string | null; applyToMerchant?: boolean }
      const result = await applyCorrection(pool, req.user!.id, txId, body)
      await rebuildMonthlySummary(pool, req.user!.id)
      await audit(req, 'SPEND_CATEGORY_CORRECTED', 'classified_transactions', txId, {
        category: result.transaction.category, applyToMerchant: Boolean(body.applyToMerchant),
        updatedOtherTransactions: result.updatedOtherTransactions,
      })
      const row = await pool.query(`SELECT ${TX_COLUMNS} FROM classified_transactions WHERE id = $1 AND user_id = $2`, [txId, req.user!.id])
      return reply.send(successResponse({ ...result, transaction: mapTx(row.rows[0]) }))
    } catch (err) { return handleError(reply, err) }
  }

  app.patch('/transactions/:txId/category', {
    preHandler: gated, config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    schema: { params: txIdParams, body: correctionBody },
  }, correct)

  // ── Review queue ────────────────────────────────────────────────────────
  app.get('/review', {
    preHandler: gated,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          limit:  { type: 'integer', minimum: 1, maximum: 100, default: 25 },
          offset: { type: 'integer', minimum: 0, default: 0 },
        },
      },
    },
  }, async (req, reply) => {
    const { limit = 25, offset = 0 } = req.query as { limit?: number; offset?: number }
    const userId = req.user!.id
    const [rows, count] = await Promise.all([
      pool.query(`
        SELECT ${TX_COLUMNS},
               (SELECT COUNT(*)::int FROM classified_transactions o
                 WHERE o.user_id = c.user_id AND o.merchant_name = c.merchant_name AND o.id <> c.id
                   AND o.transaction_type = c.transaction_type AND o.user_corrected_at IS NULL) AS same_merchant_count
          FROM classified_transactions c
         WHERE user_id = $1 AND needs_review = true AND is_ignored = false
         ORDER BY amount_paise DESC, transaction_date DESC
         LIMIT $2 OFFSET $3`, [userId, limit, offset]),
      pool.query(`SELECT COUNT(*)::int AS n FROM classified_transactions WHERE user_id = $1 AND needs_review = true AND is_ignored = false`, [userId]),
    ])
    return reply.send(successResponse({
      items: rows.rows.map((r: any) => ({
        ...mapTx(r),
        suggestedCategory: r.category,
        suggestedSubcategory: r.subcategory,
        sameMerchantCount: r.merchant_name && r.merchant_name !== 'Unknown' ? r.same_merchant_count : 0,
      })),
      total: count.rows[0].n, limit, offset,
    }))
  })

  app.post('/review/:txId', {
    preHandler: gated, config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    schema: { params: txIdParams, body: correctionBody },
  }, correct)

  // ── Needs profile ───────────────────────────────────────────────────────
  app.get('/profile', { preHandler: gated }, async (req, reply) => {
    const profile = await getNeedsProfile(pool, req.user!.id)
    return reply.send(successResponse({ profile, options: profileOptions(profile.bucketOverrides) }))
  })

  app.put('/profile', {
    preHandler: gated, config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: {
      body: {
        type: 'object',
        minProperties: 1,
        properties: {
          householdSize: { type: ['integer', 'null'], minimum: 1, maximum: 20 },
          cityTier:      { type: ['string', 'null'], enum: ['metro', 'tier1', 'tier2', 'tier3', null] },
          incomeBand:    { type: ['string', 'null'], enum: ['lt_25k', '25k_50k', '50k_1l', '1l_2l', '2l_5l', 'gt_5l', null] },
          priorities:    { type: 'array', maxItems: 5, uniqueItems: true, items: { type: 'string', enum: PRIORITY_IDS } },
          goalsNote:     { type: ['string', 'null'], maxLength: 300 },
          targetSplit: {
            type: 'object', required: ['needs', 'wants', 'savings'],
            properties: {
              needs:   { type: 'integer', minimum: 0, maximum: 100 },
              wants:   { type: 'integer', minimum: 0, maximum: 100 },
              savings: { type: 'integer', minimum: 0, maximum: 100 },
            },
            additionalProperties: false,
          },
          bucketOverrides: {
            type: 'object', maxProperties: 80,
            additionalProperties: { type: 'string', enum: BUCKETS },
          },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    try {
      const body = req.body as ProfilePatch
      const profile = await updateNeedsProfile(pool, req.user!.id, body)
      await audit(req, 'SPEND_PROFILE_UPDATED', 'spend_needs_profiles', undefined, { fields: Object.keys(body) })
      return reply.send(successResponse({ profile, options: profileOptions(profile.bucketOverrides) }))
    } catch (err) { return handleError(reply, err) }
  })

  // ── Needs-based breakdown ───────────────────────────────────────────────
  app.get('/breakdown', { preHandler: gated, schema: { querystring: monthQuery } }, async (req, reply) => {
    const userId = req.user!.id
    const month = (req.query as { month?: string }).month ?? await latestDataMonth(pool, userId) ?? currentMonthKey()
    const [txs, budgets, profile] = await Promise.all([
      loadAnalysisTxs(pool, userId, month, 0), loadBudgets(pool, userId), getNeedsProfile(pool, userId),
    ])
    const totals = computeMonthTotals(txs, month)
    const breakdown = computeBreakdown(spendRowsForMonth(txs, month), totals.incomePaise, profile, budgets, totals.transfersOutPaise)
    return reply.send(successResponse({
      month,
      hasData: txs.some((t) => t.date.startsWith(month)),
      needsReviewCount: txs.filter((t) => t.date.startsWith(month) && t.needsReview).length,
      profileConfigured: profile.exists,
      ...breakdown,
    }))
  })

  // ── Deterministic analysis (recurring, anomalies, MoM, budgets, savings) ─
  app.get('/analysis', { preHandler: gated, schema: { querystring: monthQuery } }, async (req, reply) => {
    const userId = req.user!.id
    const month = (req.query as { month?: string }).month ?? await latestDataMonth(pool, userId) ?? currentMonthKey()
    const a = await runAnalysis(pool, userId, month)
    const { breakdown: _omit, ...rest } = a
    return reply.send(successResponse(rest))
  })

  // ── Run the pipeline (classify → summary → analysis → insights) ─────────
  app.post('/analyze', {
    preHandler: [...gated, userRateLimit('spend_analyze', 10, 60 * 60)],
    config: { rateLimit: { max: 50, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: ['object', 'null'],
        properties: { month: { type: 'string', pattern: MONTH_PATTERN } },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const userId = req.user!.id
    const month = (req.body as { month?: string } | null)?.month ?? null
    const pending = await countPendingTransactions(pool, userId)
    if (pending > INLINE_CLASSIFY_LIMIT) {
      const { classifierWorkerQueue } = await import('../workers/classifierWorker')
      // One queued analyse per user at a time (runs are also serialised per user in the orchestrator)
      await classifierWorkerQueue.add('analyze', { userId, month }, { deduplication: { id: `spend-analyze:${userId}` } })
      await audit(req, 'SPEND_ANALYSIS_RUN', 'spend_insights', undefined, { mode: 'queued', pending })
      return reply.status(202).send(successResponse({
        queued: true, pendingCount: pending,
        message: `Categorising ${pending} transactions in the background — check back in a few minutes.`,
      }))
    }
    const out = await runSpendAnalysis(pool, userId, { month })
    // Insights the user dismissed still exist as facts; say so instead of 'nothing found'
    const dismissedCount = out.month
      ? (await listInsights(pool, userId, out.month, true)).filter((i) => i.dismissedAt).length
      : 0
    await audit(req, 'SPEND_ANALYSIS_RUN', 'spend_insights', undefined, {
      mode: 'inline', month: out.month, classified: out.classification.classified, generatedBy: out.generatedBy,
    })
    return reply.send(successResponse({
      queued: false,
      month: out.month,
      hasData: out.hasData,
      classification: out.classification,
      generatedBy: out.generatedBy,
      aiAvailability: out.aiAvailability,
      insights: out.insights,
      dismissedCount,
    }))
  })

  // POST re-run classification over existing rows (after learning) — queued
  app.post('/reclassify', {
    preHandler: [...gated, userRateLimit('spend_reclassify', 2, 60 * 60)],
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
  }, async (req, reply) => {
    const { classifierWorkerQueue } = await import('../workers/classifierWorker')
    await classifierWorkerQueue.add('reclassify', { userId: req.user!.id, reclassify: true },
      { deduplication: { id: `spend-reclassify:${req.user!.id}` } })
    await audit(req, 'SPEND_ANALYSIS_RUN', 'classified_transactions', undefined, { mode: 'reclassify' })
    return reply.send(successResponse({ queued: true, message: 'Re-categorisation queued — results in 1–2 minutes' }))
  })

  // ── Insights ────────────────────────────────────────────────────────────
  app.get('/insights', {
    preHandler: gated,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          month:            { type: 'string', pattern: MONTH_PATTERN },
          includeDismissed: { type: 'boolean', default: false },
        },
      },
    },
  }, async (req, reply) => {
    const { month, includeDismissed = false } = req.query as { month?: string; includeDismissed?: boolean }
    return reply.send(successResponse(await listInsights(pool, req.user!.id, month ?? null, includeDismissed)))
  })

  app.patch('/insights/:id', {
    preHandler: gated,
    schema: {
      params: { type: 'object', required: ['id'], properties: { id: { type: 'string', pattern: UUID } } },
      body: {
        type: 'object', minProperties: 1,
        properties: { isRead: { type: 'boolean' }, dismissed: { type: 'boolean' } },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { isRead, dismissed } = req.body as { isRead?: boolean; dismissed?: boolean }
    const res = await pool.query(`
      UPDATE spend_insights
         SET is_read = COALESCE($3, is_read),
             dismissed_at = CASE WHEN $4::boolean IS NULL THEN dismissed_at
                                 WHEN $4::boolean THEN COALESCE(dismissed_at, NOW()) ELSE NULL END
       WHERE id = $1 AND user_id = $2
       RETURNING *, to_char(month, 'YYYY-MM') AS month_key
    `, [id, req.user!.id, isRead ?? null, dismissed ?? null])
    if (!res.rows[0]) return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Insight not found'))
    return reply.send(successResponse(mapInsightRow(res.rows[0])))
  })

  // ── Ask about my spending ───────────────────────────────────────────────
  app.post('/ask', {
    preHandler: [...gated, userRateLimit('spend_ask', 20, 60 * 60)],
    config: { rateLimit: { max: 100, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: 'object', required: ['question'],
        properties: {
          question: { type: 'string', minLength: 3, maxLength: 300 },
          month:    { type: 'string', pattern: MONTH_PATTERN }, // the month the user is viewing
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const { question, month } = req.body as { question: string; month?: string }
    const out = await askAboutSpending(pool, req.user!.id, question.trim(), undefined, undefined, month ?? null)
    return reply.send(successResponse({ ...out, aiAvailability: aiHealth.status().availability }))
  })

  // ── Budgets ─────────────────────────────────────────────────────────────
  app.post('/budgets', {
    preHandler: gated,
    schema: {
      body: {
        type: 'object', required: ['category', 'budgetPaise'],
        properties: {
          category:    { type: 'string', maxLength: 50 },
          budgetPaise: { type: 'integer', minimum: 100, maximum: 100_000_000_00 },
        },
        additionalProperties: false,
      },
    },
  }, async (req, reply) => {
    const { category, budgetPaise } = req.body as { category: string; budgetPaise: number }
    const cat = CATEGORY_BY_ID.get(category)
    if (!cat || cat.group !== 'expense') {
      return reply.status(400).send(errorResponse(ERROR_CODES.VALIDATION_ERROR, `"${category}" is not a spending category`))
    }
    await pool.query(`
      INSERT INTO category_budgets (user_id, category, budget_paise)
      VALUES ($1,$2,$3)
      ON CONFLICT (user_id, category) DO UPDATE SET budget_paise = EXCLUDED.budget_paise, is_active = true
    `, [req.user!.id, category, budgetPaise])
    return reply.send(successResponse({ category, budgetPaise }))
  })

  app.delete('/budgets/:category', {
    preHandler: gated,
    schema: { params: { type: 'object', required: ['category'], properties: { category: { type: 'string', maxLength: 50 } } } },
  }, async (req, reply) => {
    const { category } = req.params as { category: string }
    const res = await pool.query(
      'UPDATE category_budgets SET is_active = false WHERE user_id = $1 AND category = $2 AND is_active = true',
      [req.user!.id, category])
    if (!res.rowCount) return reply.status(404).send(errorResponse(ERROR_CODES.NOT_FOUND, 'Budget not found'))
    return reply.send(successResponse({ category, removed: true }))
  })

  app.get('/budgets', { preHandler: gated, schema: { querystring: monthQuery } }, async (req, reply) => {
    const month = (req.query as { month?: string }).month ?? currentMonthKey()
    const result = await pool.query(`
      SELECT cb.category, cb.budget_paise, COALESCE(ms.total_paise, 0) AS spent_paise
        FROM category_budgets cb
        LEFT JOIN monthly_spend_summary ms
          ON ms.user_id = cb.user_id AND ms.category = cb.category AND ms.month = $2::date
       WHERE cb.user_id = $1 AND cb.is_active = true
    `, [req.user!.id, `${month}-01`])
    const rows = result.rows.map((r: any) => {
      const budget = Number(r.budget_paise), spent = Number(r.spent_paise)
      return {
        category: r.category, label: CATEGORY_BY_ID.get(r.category)?.label ?? r.category,
        budgetPaise: budget, spentPaise: spent, usedPct: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      }
    }).sort((a, b) => b.usedPct - a.usedPct)
    return reply.send(successResponse({ month, budgets: rows }))
  })

  // ── Subscription detector (separate plan feature) ───────────────────────
  app.get('/subscriptions', {
    preHandler: [verifyAccessToken, planEnforcer.requireFeature('subscription_detector', pool)],
  }, async (req, reply) => {
    const result = await pool.query(`
      SELECT merchant_name,
             COUNT(*)::int                       AS occurrences,
             AVG(amount_paise)::bigint           AS avg_amount,
             to_char(MAX(transaction_date), 'YYYY-MM-DD') AS last_charged,
             to_char(MIN(transaction_date), 'YYYY-MM-DD') AS first_charged,
             SUM(amount_paise)::bigint           AS total_spent_ever
        FROM classified_transactions
       WHERE user_id = $1 AND category = 'SUBSCRIPTIONS' AND is_ignored = false
       GROUP BY merchant_name
       ORDER BY occurrences DESC, total_spent_ever DESC
    `, [req.user!.id])
    return reply.send(successResponse(result.rows.map((r: any) => ({
      ...r, avg_amount: Number(r.avg_amount), total_spent_ever: Number(r.total_spent_ever),
    }))))
  })
}
