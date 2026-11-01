import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Activity, AlertTriangle, ChevronDown, Loader2, PiggyBank, Receipt, RefreshCw, Repeat, RotateCcw, Sparkles, TrendingDown, TrendingUp, X, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { monthLabel, rupees, safeInAppUrl, shortDate } from './format'
import { Panel, pillBtn, primaryBtn } from './SpendUi'
import type { AiAvailability, Insight, InsightType, SpendCategory } from './types'

const TYPE_LOOK: Record<InsightType, { icon: LucideIcon; label: string }> = {
  overspend: { icon: TrendingUp, label: 'Overspending' },
  new_subscription: { icon: Repeat, label: 'New subscription' },
  large_expense: { icon: Receipt, label: 'Large expense' },
  recurring_detected: { icon: Repeat, label: 'Recurring payments' },
  savings_opportunity: { icon: PiggyBank, label: 'Savings' },
  income_dip: { icon: TrendingDown, label: 'Income' },
  unusual_pattern: { icon: Activity, label: 'Unusual' },
}

const byPriority = (a: Insight, b: Insight) => b.priority - a.priority

// ── Evidence: the computed facts an insight was written from ─────────────────
// Only fields that mean something to a person are shown, with plain labels, per evidence kind.

type Fmt = 'money' | 'pct' | 'days' | 'date' | 'count' | 'times'
type Field = [key: string, label: string, fmt: Fmt]

const EVIDENCE_FIELDS: Record<string, Field[]> = {
  month_over_month: [
    ['currentPaise', 'This month', 'money'], ['previousPaise', 'Month before', 'money'],
    ['deltaPaise', 'Increase', 'money'], ['deltaPct', 'Change', 'pct'],
  ],
  budget_burn: [
    ['budgetPaise', 'Your budget', 'money'], ['spentPaise', 'Spent', 'money'], ['usedPct', 'Budget used', 'pct'],
    ['daysLeft', 'Days left in the month', 'days'], ['projectedPaise', 'Expected by month end', 'money'],
    ['projectedOverPaise', 'Expected overspend', 'money'],
  ],
  recurring_new: [
    ['avgAmountPaise', 'Typical payment', 'money'], ['occurrences', 'Payments seen', 'count'],
    ['avgIntervalDays', 'Usual gap', 'days'], ['firstDate', 'First payment', 'date'],
    ['lastDate', 'Latest payment', 'date'], ['nextExpectedDate', 'Next expected', 'date'],
  ],
  recurring_subscriptions: [['count', 'Active subscriptions & plans', 'count']],
  anomaly: [
    ['date', 'Date', 'date'], ['amountPaise', 'This payment', 'money'], ['medianPaise', 'Your typical payment', 'money'],
    ['multipleOfMedian', 'Compared with typical', 'times'], ['historyCount', 'Earlier payments compared', 'count'],
  ],
  savings_rate: [
    ['incomePaise', 'Income', 'money'], ['spendingPaise', 'Spending (not counting investments)', 'money'],
    ['investedPaise', 'Invested', 'money'], ['savingsRatePct', 'Savings rate', 'pct'],
    ['targetPct', 'Your target', 'pct'], ['gapPaise', 'Spend less by', 'money'],
  ],
  wants_share: [
    ['actualPaise', 'Spent on wants', 'money'], ['actualPct', 'Share', 'pct'], ['targetPct', 'Your target', 'pct'],
    ['targetPaise', 'Target amount', 'money'], ['differencePaise', 'Above target', 'money'],
  ],
  priority_food_delivery: [['amountPaise', 'Food delivery', 'money'], ['orders', 'Orders', 'count']],
  income_dip: [
    ['incomePaise', 'Income this month', 'money'], ['avgPreviousPaise', 'Average before', 'money'],
    ['dropPct', 'Drop', 'pct'], ['monthsCompared', 'Months compared', 'count'],
  ],
}

function fmtValue(fmt: Fmt, v: unknown): string | null {
  if (v == null || v === '') return null
  switch (fmt) {
    case 'money': return typeof v === 'number' ? rupees(v) : null
    case 'pct': return typeof v === 'number' ? `${v}%` : null
    case 'days': return typeof v === 'number' ? `${v} day${v === 1 ? '' : 's'}` : null
    case 'count': return typeof v === 'number' ? v.toLocaleString('en-IN') : null
    case 'times': return typeof v === 'number' ? `${Number.isInteger(v) ? v : v.toFixed(1)}×` : null
    case 'date': return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v) ? shortDate(v, new Date().getFullYear()) : null
  }
}

interface EvidenceView { rows: Array<[string, string]>; list: { title: string; items: string[] } | null; note: string | null }

/** Human-readable evidence for one insight, or null when there is nothing worth showing. */
function evidenceView(evidence: Insight['evidence'], categories: SpendCategory[]): EvidenceView | null {
  if (!evidence?.kind) return null
  const e = evidence as Record<string, unknown>
  const catLabel = (id: unknown) => (typeof id === 'string' ? categoryById(categories, id)?.label ?? id : '')
  const rows: Array<[string, string]> = []
  for (const [key, label, fmt] of EVIDENCE_FIELDS[evidence.kind] ?? []) {
    const v = fmtValue(fmt, e[key])
    if (v) rows.push([label, v])
  }
  const topWant = e.topWant as { category?: string; amountPaise?: number } | null | undefined
  if (topWant?.category) rows.push(['Largest want', `${catLabel(topWant.category)}${topWant.amountPaise != null ? ` · ${rupees(topWant.amountPaise)}` : ''}`])

  let list: EvidenceView['list'] = null
  const merchants = Array.isArray(e.merchants) ? (e.merchants as Array<Record<string, unknown>>) : null
  if (merchants?.length) {
    list = {
      title: evidence.kind === 'new_merchants' ? 'First-time payees' : 'Included',
      items: merchants.slice(0, 8).map((m) => {
        const monthly = typeof m.monthlyPaise === 'number' ? `${rupees(m.monthlyPaise)} a month` : null
        const total = typeof m.totalPaise === 'number' ? rupees(m.totalPaise) : null
        return [String(m.merchant ?? ''), catLabel(m.category), monthly ?? total].filter(Boolean).join(' · ')
      }),
    }
  }

  let note: string | null = null
  if (evidence.kind === 'anomaly') {
    note = e.rule === 'median'
      ? 'Flagged because it is more than 3 times your typical payment in this category.'
      : 'Flagged because it is far outside the range of your usual payments in this category.'
  } else if (evidence.kind === 'recurring_new') {
    note = 'Same payee, a similar amount (within 10%), about a month apart.'
  } else if (evidence.kind === 'budget_burn' && e.status === 'at_risk') {
    note = 'The month-end figure assumes you keep spending at the same pace.'
  } else if (evidence.kind === 'wants_share') {
    note = e.basis === 'income' ? 'Share of your income this month.' : 'Share of what you spent this month (no income was recorded).'
  }

  if (!rows.length && !list && !note) return null
  return { rows, list, note }
}

function EvidenceList({ view }: { view: EvidenceView }) {
  return (
    <div className="mt-3 rounded-xl bg-muted/60 p-3 text-xs">
      {view.note && <p className="mb-2 text-muted-foreground">{view.note}</p>}
      {view.rows.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {view.rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-foreground tabular text-right sm:text-left break-words">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {view.list && (
        <div className="mt-2">
          <p className="text-muted-foreground">{view.list.title}</p>
          <ul className="mt-1 space-y-0.5">{view.list.items.map((i) => <li key={i} className="text-foreground">{i}</li>)}</ul>
        </div>
      )}
    </div>
  )
}

function InsightCard({ insight, onDismiss, onRestore, onRead }: {
  insight: Insight; onDismiss: () => void; onRestore: () => void; onRead: () => void
}) {
  const navigate = useNavigate()
  const categories = useSpendStore((s) => s.categories)
  const [showWhy, setShowWhy] = useState(false)
  const look = TYPE_LOOK[insight.insightType] ?? { icon: AlertTriangle, label: 'Insight' }
  const Icon = look.icon
  const href = safeInAppUrl(insight.actionUrl)
  const dismissed = Boolean(insight.dismissedAt)
  const evidence = evidenceView(insight.evidence, categories)

  return (
    <li className={cn('rounded-xl border p-3.5 transition',
      dismissed ? 'border-dashed border-border opacity-80' : insight.isRead ? 'border-border' : 'border-foreground/25 bg-muted/30')}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 hidden sm:grid size-8 shrink-0 place-items-center rounded-full bg-muted text-foreground" aria-hidden>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{look.label}</span>
            {insight.generatedBy === 'ai'
              ? <span className="inline-flex items-center gap-0.5 rounded-full border border-[var(--spend-ai)]/40 px-1.5 text-[10px] font-semibold text-[var(--spend-ai)]" title="Worded by AI from the numbers below; every figure was checked against them"><Sparkles className="size-2.5" /> AI-written</span>
              : <span className="rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground" title="Written from a fixed template using the numbers below">Calculated</span>}
            {dismissed && <span className="rounded-full border border-border px-1.5 text-[10px] font-medium text-muted-foreground">Dismissed</span>}
            {!dismissed && !insight.isRead && <span className="size-1.5 rounded-full bg-foreground" aria-label="Unread" />}
          </div>
          <h3 className="mt-1 text-sm font-semibold text-foreground">{insight.title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{insight.body}</p>

          {showWhy && evidence && <EvidenceList view={evidence} />}

          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            {dismissed ? (
              <button type="button" className={cn(pillBtn, 'h-8 px-3 text-xs')} onClick={onRestore}>
                <RotateCcw className="size-3.5" /> Restore
              </button>
            ) : href && insight.actionLabel && (
              <button
                type="button"
                className={cn(pillBtn, 'h-8 px-3 text-xs')}
                onClick={() => { onRead(); navigate(href) }}
              >
                {insight.actionLabel}
              </button>
            )}
            {evidence && (
              <button
                type="button"
                aria-expanded={showWhy}
                onClick={() => { setShowWhy(!showWhy); if (!insight.isRead && !dismissed) onRead() }}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-1 h-8"
              >
                How we worked this out <ChevronDown className={cn('size-3.5 transition-transform', showWhy && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>
        {!dismissed && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={`Dismiss: ${insight.title}`}
            className="shrink-0 -mr-1 -mt-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </li>
  )
}

export function InsightsPanel({ month, aiAvailability, onAnalyze, analyzing }: {
  month: string
  aiAvailability: AiAvailability
  onAnalyze: () => void
  analyzing: boolean
}) {
  const revision = useSpendStore((s) => s.revision)
  const changedAt = useSpendStore((s) => s.changedAt)
  // Every insight for the month, dismissed ones included, so "all dismissed" isn't shown as "none found"
  const [items, setItems] = useState<Insight[] | null>(null)
  const [showDismissed, setShowDismissed] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const [nonce, setNonce] = useState(0)
  const load = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => { setItems(null); setShowDismissed(false) }, [month])
  useEffect(() => {
    let live = true
    setError(null)
    api.get('/spend/insights', { params: { month, includeDismissed: true } })
      .then((res) => { if (live) setItems((res.data.data as Insight[]).sort(byPriority)) })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [month, revision, nonce])

  const patch = async (id: string, body: { isRead?: boolean; dismissed?: boolean }) => {
    const res = await api.patch(`/spend/insights/${id}`, body)
    return res.data.data as Insight
  }
  const replace = (next: Insight) => setItems((cur) => cur?.map((i) => (i.id === next.id ? next : i)) ?? cur)

  const markRead = (insight: Insight) => {
    if (insight.isRead) return
    replace({ ...insight, isRead: true })
    patch(insight.id, { isRead: true }).catch(() => replace({ ...insight, isRead: false }))
  }

  const restore = (insight: Insight) => {
    replace({ ...insight, dismissedAt: null })
    patch(insight.id, { dismissed: false })
      .then(replace)
      .catch((err) => { replace(insight); toast.error(userFacingMessage(err)) })
  }

  const dismiss = async (insight: Insight) => {
    replace({ ...insight, dismissedAt: new Date().toISOString() })
    try {
      const saved = await patch(insight.id, { dismissed: true })
      replace(saved)
      toast('Insight dismissed', {
        description: "It won't come back when we re-analyse this month. You can restore it from \"Show dismissed\".",
        action: { label: 'Undo', onClick: () => restore(saved) },
      })
    } catch (err) {
      replace(insight)
      toast.error(userFacingMessage(err))
    }
  }

  const active = items?.filter((i) => !i.dismissedAt) ?? []
  const dismissedItems = items?.filter((i) => i.dismissedAt) ?? []
  const aiNote = aiAvailability === 'degraded' || aiAvailability === 'not_configured'
    ? 'AI wording is unavailable right now, so these are written from templates. The numbers are the same.'
    : null
  const anyAi = active.some((i) => i.generatedBy === 'ai')
  // Set by corrections / needs / budget edits in this session, cleared by the next analysis run
  const stale = Boolean(changedAt && items && items.length > 0)

  const dismissedToggle = dismissedItems.length > 0 && (
    <button
      type="button"
      aria-expanded={showDismissed}
      onClick={() => setShowDismissed((v) => !v)}
      className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground h-8"
    >
      {showDismissed ? 'Hide' : 'Show'} {dismissedItems.length} dismissed
      <ChevronDown className={cn('size-3.5 transition-transform', showDismissed && 'rotate-180')} />
    </button>
  )

  return (
    <Panel
      title={<span className="inline-flex items-center gap-1.5"><Sparkles className="size-4 text-[var(--spend-ai)]" aria-hidden /> Insights</span>}
      subtitle={anyAi ? 'Worded by AI from facts we calculated. Every number is checked.' : `Calculated from your ${monthLabel(month)} transactions`}
    >
      {error && items === null ? (
        <ErrorCard compact error={error} title="We couldn't load your insights" onRetry={() => { void load() }} />
      ) : items === null ? (
        <ListSkeleton rows={3} />
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-foreground font-medium">No insights for {monthLabel(month)} yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[22rem] mx-auto">
            Run the analysis to check this month for overspending, new subscriptions, unusual payments and your savings rate.
            If nothing stands out, we won't invent anything.
          </p>
          <button type="button" className={cn(primaryBtn, 'mt-4')} onClick={onAnalyze} disabled={analyzing}>
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyse {monthLabel(month, true)}
          </button>
        </div>
      ) : (
        <>
          {stale && (
            <div className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-[var(--spend-warn)]/40 bg-[var(--spend-warn)]/10 px-3 py-2.5" role="status">
              <p className="text-xs text-foreground">You've made changes since these were written, so some numbers may be out of date.</p>
              <button type="button" className={cn(pillBtn, 'h-8 px-3 text-xs shrink-0')} onClick={onAnalyze} disabled={analyzing}>
                {analyzing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Refresh insights
              </button>
            </div>
          )}
          {active.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-foreground font-medium">
                You've dismissed {dismissedItems.length === 1 ? 'the only insight' : `all ${dismissedItems.length} insights`} for {monthLabel(month)}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[22rem] mx-auto">
                Dismissed insights stay hidden when we re-analyse. Show them to read or restore one.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {active.map((i) => (
                <InsightCard key={i.id} insight={i} onDismiss={() => { void dismiss(i) }} onRestore={() => restore(i)} onRead={() => markRead(i)} />
              ))}
            </ul>
          )}
          {dismissedItems.length > 0 && (
            <div className={cn('mt-2', active.length === 0 && 'flex justify-center')}>{dismissedToggle}</div>
          )}
          {showDismissed && dismissedItems.length > 0 && (
            <ul className="mt-1 space-y-2.5" aria-label="Dismissed insights">
              {dismissedItems.map((i) => (
                <InsightCard key={i.id} insight={i} onDismiss={() => {}} onRestore={() => restore(i)} onRead={() => {}} />
              ))}
            </ul>
          )}
          {aiNote && active.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{aiNote}</p>}
        </>
      )}
    </Panel>
  )
}
