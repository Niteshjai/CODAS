import { Pool } from 'pg'
import { CATEGORY_BY_ID } from '../classifier/categoryConfig'
import { computeBreakdown, Breakdown, NeedsProfile, getNeedsProfile, SpendRow } from './needsProfile'
import { daysInMonth, shiftMonth } from './spendError'

// ═══════════════════════════════════════════════════════════════
// Deterministic analysis engine. Every number an insight may mention is computed here;
// the AI layer only narrates these facts.
// ═══════════════════════════════════════════════════════════════

export interface AnalysisTx {
  id:          string
  date:        string            // YYYY-MM-DD
  amountPaise: number
  type:        'debit' | 'credit'
  category:    string
  subcategory: string | null
  group:       string            // expense | revenue | transfer | ignore
  merchant:    string
  needsReview: boolean
}

export interface AnalysisInput {
  month:   string                 // YYYY-MM being analysed
  asOf:    string                 // YYYY-MM-DD "today" (for burn-rate projection)
  txs:     AnalysisTx[]           // lookback window up to the end of `month`
  budgets: Map<string, number>
  profile: NeedsProfile
}

export const INCOME_CATEGORIES = new Set(['SALARY', 'BUSINESS_INCOME', 'INVESTMENT_RETURN', 'OTHER_INCOME'])
const NOT_ANOMALY_CATEGORIES = new Set(['INVESTMENTS', 'EMI'])
const NOT_RECURRING_MERCHANTS = new Set(['UNKNOWN', 'ATM CASH'])

export interface MonthTotals {
  incomePaise: number
  refundsPaise: number
  outflowPaise: number            // all expense-group debits (incl. investments, EMIs)
  spendingPaise: number           // outflow excluding investments
  investedPaise: number
  /** Money sent to people / paid to credit cards (transfer group, not self-transfers). Not spending, but not saved either. */
  transfersOutPaise: number
  byCategory: Map<string, { paise: number; count: number }>
}

export interface MomRow { category: string; label: string; currentPaise: number; previousPaise: number; deltaPaise: number; deltaPct: number | null }
export interface RecurringSeries {
  merchant: string; category: string; label: string; occurrences: number; avgAmountPaise: number
  avgIntervalDays: number; firstDate: string; lastDate: string; nextExpectedDate: string; active: boolean
  isNew: boolean; monthlyEquivalentPaise: number
}
export interface NewMerchant { merchant: string; category: string; totalPaise: number; count: number; firstDate: string }
export interface Anomaly {
  txId: string; date: string; merchant: string; category: string; label: string; amountPaise: number
  meanPaise: number; medianPaise: number; stdDevPaise: number; historyCount: number
  rule: 'sigma' | 'median'; multipleOfMedian: number
}
export interface BudgetBurn {
  category: string; label: string; budgetPaise: number; spentPaise: number; usedPct: number
  daysElapsed: number; daysInMonth: number; daysLeft: number; projectedPaise: number; projectedOverPaise: number
  status: 'on_track' | 'at_risk' | 'over'
}
export interface SavingsSummary {
  incomePaise: number; spendingPaise: number; investedPaise: number; transfersOutPaise: number
  savingsRatePct: number | null; targetPct: number
}
export interface IncomeDip { incomePaise: number; avgPreviousPaise: number; dropPct: number; monthsCompared: number }

export interface AnalysisResult {
  month: string
  asOf: string
  isCurrentMonth: boolean
  hasData: boolean
  totals: Omit<MonthTotals, 'byCategory'> & { byCategory: Array<{ category: string; label: string; paise: number; count: number }> }
  previousMonth: string
  monthOverMonth: MomRow[]
  recurring: RecurringSeries[]
  newMerchants: NewMerchant[]
  anomalies: Anomaly[]
  budgets: BudgetBurn[]
  savings: SavingsSummary
  incomeDip: IncomeDip | null
  breakdown: Breakdown
  needsReviewCount: number
  coverage: { firstDate: string | null; lastDate: string | null; monthsWithData: number }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const toUTC = (d: string) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10))
export const dayDiff = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 86_400_000)
const addDays = (d: string, n: number) => new Date(toUTC(d) + n * 86_400_000).toISOString().slice(0, 10)
const label = (c: string) => CATEGORY_BY_ID.get(c)?.label ?? c
const inMonth = (tx: AnalysisTx, month: string) => tx.date.startsWith(month)
const isOutflow = (tx: AnalysisTx) => tx.type === 'debit' && tx.group === 'expense'
/** Outgoing transfers that leave the user's money (to people, card bills) — moving money to their own account doesn't. */
export const isTransferOut = (tx: Pick<AnalysisTx, 'type' | 'group' | 'subcategory'>) =>
  tx.type === 'debit' && tx.group === 'transfer' && tx.subcategory !== 'Self'

export function median(xs: number[]): number {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
function mean(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0 }
function stdDev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1))
}

// ─── building blocks (pure) ──────────────────────────────────────────────────

export function computeMonthTotals(txs: AnalysisTx[], month: string): MonthTotals {
  const t: MonthTotals = { incomePaise: 0, refundsPaise: 0, outflowPaise: 0, spendingPaise: 0, investedPaise: 0, transfersOutPaise: 0, byCategory: new Map() }
  for (const tx of txs) {
    if (!inMonth(tx, month)) continue
    if (tx.type === 'credit' && tx.group === 'revenue') {
      if (INCOME_CATEGORIES.has(tx.category)) t.incomePaise += tx.amountPaise
      else if (tx.category === 'REFUNDS') t.refundsPaise += tx.amountPaise
      continue
    }
    if (isTransferOut(tx)) { t.transfersOutPaise += tx.amountPaise; continue }
    if (!isOutflow(tx)) continue
    t.outflowPaise += tx.amountPaise
    if (tx.category === 'INVESTMENTS') t.investedPaise += tx.amountPaise
    else t.spendingPaise += tx.amountPaise
    const c = t.byCategory.get(tx.category) ?? { paise: 0, count: 0 }
    c.paise += tx.amountPaise; c.count++
    t.byCategory.set(tx.category, c)
  }
  return t
}

export function monthOverMonth(txs: AnalysisTx[], month: string): MomRow[] {
  const cur = computeMonthTotals(txs, month).byCategory
  const prev = computeMonthTotals(txs, shiftMonth(month, -1)).byCategory
  const cats = new Set([...cur.keys(), ...prev.keys()])
  return Array.from(cats).map((c) => {
    const currentPaise = cur.get(c)?.paise ?? 0
    const previousPaise = prev.get(c)?.paise ?? 0
    return {
      category: c, label: label(c), currentPaise, previousPaise, deltaPaise: currentPaise - previousPaise,
      deltaPct: previousPaise > 0 ? Math.round(((currentPaise - previousPaise) / previousPaise) * 100) : null,
    }
  }).sort((a, b) => b.deltaPaise - a.deltaPaise)
}

/**
 * Recurring payments: same merchant, amount within ±10% of the series' first amount,
 * consecutive gaps of 25–35 days, at least 2 occurrences.
 */
export function detectRecurring(txs: AnalysisTx[], asOf: string): RecurringSeries[] {
  // "New" needs history before the series started; otherwise it is just where our data begins
  const dataStart = txs.reduce((min, t) => (t.date < min ? t.date : min), asOf)
  const byMerchant = new Map<string, AnalysisTx[]>()
  for (const tx of txs) {
    if (tx.type !== 'debit' || tx.group === 'revenue') continue
    const key = tx.merchant.toUpperCase()
    if (!key || NOT_RECURRING_MERCHANTS.has(key)) continue
    const list = byMerchant.get(key) ?? []
    list.push(tx)
    byMerchant.set(key, list)
  }

  const out: RecurringSeries[] = []
  for (const list of byMerchant.values()) {
    if (list.length < 2) continue
    list.sort((a, b) => a.date.localeCompare(b.date))
    let best: AnalysisTx[] = []
    for (let start = 0; start < list.length; start++) {
      const chain = [list[start]]
      const ref = list[start].amountPaise
      for (let j = start + 1; j < list.length; j++) {
        const gap = dayDiff(chain[chain.length - 1].date, list[j].date)
        if (gap > 35) break
        if (gap >= 25 && Math.abs(list[j].amountPaise - ref) <= ref * 0.1) chain.push(list[j])
      }
      if (chain.length > best.length) best = chain
    }
    if (best.length < 2) continue
    // A merchant you pay many times a month (food delivery) isn't a subscription even if two orders line up
    const span = list.filter((t) => t.date >= best[0].date)
    if (span.length > best.length * 2) continue

    const gaps = best.slice(1).map((t, i) => dayDiff(best[i].date, t.date))
    const avgInterval = Math.round(mean(gaps))
    const avgAmount = Math.round(mean(best.map((t) => t.amountPaise)))
    const last = best[best.length - 1].date
    const first = best[0].date
    out.push({
      merchant: best[0].merchant, category: best[best.length - 1].category, label: label(best[best.length - 1].category),
      occurrences: best.length, avgAmountPaise: avgAmount, avgIntervalDays: avgInterval,
      firstDate: first, lastDate: last, nextExpectedDate: addDays(last, avgInterval),
      active: dayDiff(last, asOf) <= avgInterval + 10,
      isNew: best.length === 2 && dayDiff(first, asOf) <= 75 && dayDiff(dataStart, first) > 45,
      monthlyEquivalentPaise: Math.round((avgAmount * 30) / Math.max(avgInterval, 1)),
    })
  }
  return out.sort((a, b) => b.monthlyEquivalentPaise - a.monthlyEquivalentPaise)
}

export function detectNewMerchants(txs: AnalysisTx[], month: string): NewMerchant[] {
  const monthStart = `${month}-01`
  const hasHistory = txs.some((t) => t.date < monthStart)
  if (!hasHistory) return []
  const seenBefore = new Set(txs.filter((t) => t.date < monthStart).map((t) => t.merchant.toUpperCase()))
  const fresh = new Map<string, NewMerchant>()
  for (const tx of txs) {
    if (!inMonth(tx, month) || !isOutflow(tx)) continue
    const key = tx.merchant.toUpperCase()
    if (seenBefore.has(key) || NOT_RECURRING_MERCHANTS.has(key)) continue
    const m = fresh.get(key) ?? { merchant: tx.merchant, category: tx.category, totalPaise: 0, count: 0, firstDate: tx.date }
    m.totalPaise += tx.amountPaise; m.count++
    if (tx.date < m.firstDate) m.firstDate = tx.date
    fresh.set(key, m)
  }
  return Array.from(fresh.values()).sort((a, b) => b.totalPaise - a.totalPaise)
}

/**
 * Anomaly = amount > mean + 3σ of the user's earlier payments in that category (≥ 5 of them),
 * or > 3× their median (≥ 3 of them). Ignores payments under ₹1,000.
 */
export function detectAnomalies(txs: AnalysisTx[], month: string): Anomaly[] {
  const out: Anomaly[] = []
  for (const tx of txs) {
    if (!inMonth(tx, month) || !isOutflow(tx) || NOT_ANOMALY_CATEGORIES.has(tx.category)) continue
    if (tx.amountPaise < 100_000) continue
    const earlier = txs.filter((h) => h.id !== tx.id && isOutflow(h) && h.category === tx.category && h.date < tx.date)
    // Compare like with like: a grocery shop against groceries, not against coffee orders
    const sameSub = tx.subcategory ? earlier.filter((h) => h.subcategory === tx.subcategory) : []
    const history = (sameSub.length >= 3 ? sameSub : earlier).map((h) => h.amountPaise)
    if (history.length < 3) continue
    // A usual-sized payment to a merchant you already pay isn't an anomaly
    const fromMerchant = earlier.filter((h) => h.merchant.toUpperCase() === tx.merchant.toUpperCase()).map((h) => h.amountPaise)
    if (fromMerchant.length > 0 && tx.amountPaise <= Math.max(...fromMerchant) * 1.5) continue
    const med = median(history)
    const m = mean(history)
    const sd = stdDev(history)
    const sigmaHit = history.length >= 5 && sd > 0 && tx.amountPaise > m + 3 * sd
    const medianHit = med > 0 && tx.amountPaise > 3 * med
    if (!sigmaHit && !medianHit) continue
    out.push({
      txId: tx.id, date: tx.date, merchant: tx.merchant, category: tx.category, label: label(tx.category),
      amountPaise: tx.amountPaise, meanPaise: Math.round(m), medianPaise: Math.round(med), stdDevPaise: Math.round(sd),
      historyCount: history.length, rule: sigmaHit ? 'sigma' : 'median',
      multipleOfMedian: med > 0 ? Math.round((tx.amountPaise / med) * 10) / 10 : 0,
    })
  }
  return out.sort((a, b) => b.amountPaise - a.amountPaise)
}

export function budgetBurn(
  budgets: Map<string, number>, totals: MonthTotals, month: string, asOf: string,
): BudgetBurn[] {
  const dim = daysInMonth(month)
  const isCurrent = asOf.startsWith(month)
  const isFuture = asOf < `${month}-01`
  const daysElapsed = isFuture ? 0 : isCurrent ? Math.max(1, +asOf.slice(8, 10)) : dim
  const out: BudgetBurn[] = []
  for (const [category, budgetPaise] of budgets) {
    if (budgetPaise <= 0) continue
    const spent = totals.byCategory.get(category)?.paise ?? 0
    const projected = daysElapsed > 0 ? Math.round((spent / daysElapsed) * dim) : 0
    const status: BudgetBurn['status'] =
      spent > budgetPaise ? 'over' : (isCurrent && daysElapsed >= 7 && projected > budgetPaise) ? 'at_risk' : 'on_track'
    out.push({
      category, label: label(category), budgetPaise, spentPaise: spent,
      usedPct: Math.round((spent / budgetPaise) * 100), daysElapsed, daysInMonth: dim, daysLeft: dim - daysElapsed,
      projectedPaise: projected, projectedOverPaise: Math.max(0, projected - budgetPaise), status,
    })
  }
  return out.sort((a, b) => b.usedPct - a.usedPct)
}

export function savingsSummary(totals: MonthTotals, targetPct: number): SavingsSummary {
  return {
    incomePaise: totals.incomePaise, spendingPaise: totals.spendingPaise, investedPaise: totals.investedPaise,
    transfersOutPaise: totals.transfersOutPaise,
    // Money sent to people / card bills left the account: it isn't savings even though it isn't 'spending'
    savingsRatePct: totals.incomePaise > 0
      ? Math.round(((totals.incomePaise - totals.spendingPaise - totals.transfersOutPaise) / totals.incomePaise) * 100)
      : null,
    targetPct,
  }
}

/** Only judged on a completed month (or the last days of the current one) so a salary that hasn't landed yet isn't a "dip". */
export function detectIncomeDip(txs: AnalysisTx[], month: string, asOf: string): IncomeDip | null {
  const isCurrent = asOf.startsWith(month)
  if (isCurrent && +asOf.slice(8, 10) < daysInMonth(month) - 2) return null
  const income = computeMonthTotals(txs, month).incomePaise
  const prev = [1, 2, 3].map((k) => computeMonthTotals(txs, shiftMonth(month, -k)).incomePaise).filter((v) => v > 0)
  if (prev.length < 2) return null
  const avg = Math.round(mean(prev))
  if (income >= avg * 0.8) return null
  return { incomePaise: income, avgPreviousPaise: avg, dropPct: Math.round(((avg - income) / avg) * 100), monthsCompared: prev.length }
}

export function spendRowsForMonth(txs: AnalysisTx[], month: string): SpendRow[] {
  const rows = new Map<string, SpendRow>()
  for (const tx of txs) {
    if (!inMonth(tx, month) || !isOutflow(tx)) continue
    const key = `${tx.category}|${tx.subcategory ?? ''}`
    const r = rows.get(key) ?? { category: tx.category, subcategory: tx.subcategory, amountPaise: 0, count: 0 }
    r.amountPaise += tx.amountPaise; r.count++
    rows.set(key, r)
  }
  return Array.from(rows.values())
}

export function analyseMonth(input: AnalysisInput): AnalysisResult {
  const { month, asOf, txs, budgets, profile } = input
  const totals = computeMonthTotals(txs, month)
  const monthTxs = txs.filter((t) => inMonth(t, month))
  const months = new Set(txs.map((t) => t.date.slice(0, 7)))
  const dates = txs.map((t) => t.date).sort()
  const monthEnd = `${month}-${String(daysInMonth(month)).padStart(2, '0')}`
  return {
    month, asOf,
    isCurrentMonth: asOf.startsWith(month),
    hasData: monthTxs.length > 0,
    totals: {
      ...totals,
      byCategory: Array.from(totals.byCategory.entries())
        .map(([category, v]) => ({ category, label: label(category), ...v }))
        .sort((a, b) => b.paise - a.paise),
    },
    previousMonth: shiftMonth(month, -1),
    monthOverMonth: monthOverMonth(txs, month),
    recurring: detectRecurring(txs.filter((t) => t.date <= monthEnd), asOf < monthEnd ? asOf : monthEnd),
    newMerchants: detectNewMerchants(txs, month),
    anomalies: detectAnomalies(txs, month),
    budgets: budgetBurn(budgets, totals, month, asOf),
    savings: savingsSummary(totals, profile.targetSplit.savings),
    incomeDip: detectIncomeDip(txs, month, asOf),
    breakdown: computeBreakdown(spendRowsForMonth(txs, month), totals.incomePaise, profile, budgets, totals.transfersOutPaise),
    needsReviewCount: monthTxs.filter((t) => t.needsReview).length,
    coverage: { firstDate: dates[0] ?? null, lastDate: dates[dates.length - 1] ?? null, monthsWithData: months.size },
  }
}

// ─── DB loader ───────────────────────────────────────────────────────────────

export const LOOKBACK_MONTHS = 6

export async function loadAnalysisTxs(pool: Pool, userId: string, month: string, lookbackMonths = LOOKBACK_MONTHS): Promise<AnalysisTx[]> {
  const from = `${shiftMonth(month, -lookbackMonths)}-01`
  const to = `${shiftMonth(month, 1)}-01`
  const res = await pool.query(`
    SELECT id, to_char(transaction_date, 'YYYY-MM-DD') AS d, amount_paise, transaction_type,
           category, subcategory, category_group, COALESCE(merchant_name, 'Unknown') AS merchant, needs_review
      FROM classified_transactions
     WHERE user_id = $1 AND is_ignored = false
       AND transaction_date >= $2::date AND transaction_date < $3::date
     ORDER BY transaction_date ASC
  `, [userId, from, to])
  return res.rows.map((r: any) => ({
    id: r.id, date: r.d, amountPaise: Number(r.amount_paise), type: r.transaction_type,
    category: r.category, subcategory: r.subcategory, group: r.category_group,
    merchant: r.merchant, needsReview: r.needs_review,
  }))
}

export async function loadBudgets(pool: Pool, userId: string): Promise<Map<string, number>> {
  const res = await pool.query(
    'SELECT category, budget_paise FROM category_budgets WHERE user_id = $1 AND is_active = true', [userId])
  return new Map(res.rows.map((r: any) => [r.category, Number(r.budget_paise)]))
}

export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export async function runAnalysis(pool: Pool, userId: string, month: string, asOf = todayISO()): Promise<AnalysisResult> {
  const [txs, budgets, profile] = await Promise.all([
    loadAnalysisTxs(pool, userId, month),
    loadBudgets(pool, userId),
    getNeedsProfile(pool, userId),
  ])
  return analyseMonth({ month, asOf, txs, budgets, profile })
}

/** Most recent month that has classified transactions, or null. */
export async function latestDataMonth(pool: Pool, userId: string): Promise<string | null> {
  const res = await pool.query(
    `SELECT to_char(MAX(transaction_date), 'YYYY-MM') AS m FROM classified_transactions WHERE user_id = $1 AND is_ignored = false`,
    [userId])
  return res.rows[0]?.m ?? null
}
