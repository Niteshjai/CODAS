import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertCircle, ArrowRight, Landmark, Layers, Loader2, MoreHorizontal, PieChart, Repeat, RotateCw, ShieldCheck, SlidersHorizontal, Sparkles, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard'
import { CardSkeleton } from '../loading/CardSkeleton'
import { ChartSkeleton } from '../loading/ChartSkeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { useSpendStore } from '../../store/spendStore'
import { monthLabel, safeInAppUrl } from './format'
import { pillBtn, primaryBtn } from './SpendUi'
import OverviewTab from './OverviewTab'
import TransactionsTab from './TransactionsTab'
import ReviewTab from './ReviewTab'
import BudgetsTab from './BudgetsTab'
import SubscriptionsTab from './SubscriptionsTab'
import NeedsProfileSheet from './NeedsProfileSheet'
import type { AnalyzeResult, SpendStatus, SpendView } from './types'
import './spend.css'

const VIEWS: Array<{ id: SpendView; label: string; icon: typeof PieChart }> = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'transactions', label: 'Transactions', icon: Layers },
  { id: 'review', label: 'Review', icon: AlertCircle },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
]

function EmptyState({ status, onAnalyze, analyzing }: { status: SpendStatus; onAnalyze: () => void; analyzing: boolean }) {
  const navigate = useNavigate()
  const es = status.emptyState!
  const href = safeInAppUrl(es.actionUrl)
  return (
    <div className="bg-card rounded-3xl border border-border shadow-sm p-6 sm:p-10 max-w-[44rem] mx-auto text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-foreground" aria-hidden>
        <Landmark className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold text-foreground">{es.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-[32rem] mx-auto">{es.body}</p>
      <button
        type="button"
        className={cn(primaryBtn, 'mt-6 h-11 px-6')}
        disabled={analyzing}
        onClick={() => (href ? navigate(href) : onAnalyze())}
      >
        {analyzing ? <Loader2 className="size-4 animate-spin" /> : href ? <ArrowRight className="size-4" /> : <Sparkles className="size-4" />}
        {es.actionLabel}
      </button>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
        {[
          { icon: Layers, title: 'Every payment categorised', body: 'UPI, cards, NACH and bank transfers sorted into categories you can correct.' },
          { icon: Target, title: 'Needs vs wants', body: 'See how your spending compares with the split you choose.' },
          { icon: ShieldCheck, title: 'Private by design', body: 'Only masked descriptions are ever sent to AI. Never your name or account numbers.' },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl bg-muted/60 p-4">
            <f.icon className="size-4 text-foreground" aria-hidden />
            <p className="mt-2 text-sm font-medium text-foreground">{f.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SpendDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, statusError, month, loadStatus, loadCategories, setMonth, invalidate, clearChanged } = useSpendStore()
  const [analyzing, setAnalyzing] = useState(false)
  const [needsOpen, setNeedsOpen] = useState(false)

  const rawView = searchParams.get('view')
  const scrollToBreakdown = rawView === 'breakdown'
  const view: SpendView = VIEWS.some((v) => v.id === rawView) ? (rawView as SpendView) : 'overview'
  const category = searchParams.get('category')
  const typeParam = searchParams.get('type')
  const txType = typeParam === 'debit' || typeParam === 'credit' ? typeParam : null

  useEffect(() => { void loadStatus(); void loadCategories() }, [loadStatus, loadCategories])

  // Insight links like ?view=breakdown land on the overview, scrolled to the breakdown
  useEffect(() => {
    if (!scrollToBreakdown || !status?.hasData) return
    const t = setTimeout(() => document.getElementById('spend-breakdown')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400)
    return () => clearTimeout(t)
  }, [scrollToBreakdown, status?.hasData])

  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev)
      p.set('tab', 'analytics')
      for (const [k, v] of Object.entries(patch)) {
        if (v == null) p.delete(k)
        else p.set(k, v)
      }
      return p
    })
  }, [setSearchParams])

  const setView = (v: SpendView) => updateParams({ view: v === 'overview' ? null : v, category: null, type: null, q: null, range: null })
  const openCategory = (cat: string) => updateParams({ view: 'transactions', category: cat, type: null, q: null, range: null })

  const analyze = async () => {
    setAnalyzing(true)
    try {
      const res = await api.post('/spend/analyze', month ? { month } : {})
      const r = res.data.data as AnalyzeResult
      if (r.queued) {
        toast(r.message ?? 'Analysis queued. Check back in a few minutes.')
      } else {
        clearChanged()
        const c = r.classification
        const parts: string[] = []
        if (c && c.classified > 0) parts.push(`${c.classified} new transaction${c.classified === 1 ? '' : 's'} categorised`)
        if (c && c.needsReview > 0) parts.push(`${c.needsReview} need${c.needsReview === 1 ? 's' : ''} your review`)
        const n = r.insights?.length ?? 0
        const dismissed = r.dismissedCount ?? 0
        // "Nothing unusual" only when there are no facts at all, not when the user dismissed them
        parts.push(n
          ? `${n} insight${n === 1 ? '' : 's'} ready`
          : dismissed > 0
            ? `no new insights (${dismissed} you dismissed still appl${dismissed === 1 ? 'ies' : 'y'})`
            : 'nothing unusual found')
        toast.success(r.hasData === false ? 'No transactions to analyse yet.' : `Analysis done: ${parts.join(', ')}.`, {
          description: r.generatedBy === 'template' && n > 0 ? 'AI wording was unavailable, so insights were written from templates.' : undefined,
        })
      }
      invalidate()
    } catch (err) {
      toast.error(userFacingMessage(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const reclassify = async () => {
    try {
      const res = await api.post('/spend/reclassify')
      toast(res.data.data?.message ?? 'Re-categorisation queued.', { description: "Transactions you've corrected yourself stay as they are." })
    } catch (err) {
      toast.error(userFacingMessage(err))
    }
  }

  // ── Loading / error / empty ──────────────────────────────────────────────
  if (!status && statusError) {
    return (
      <div className="w-full max-w-[36rem] mx-auto py-10">
        <ErrorCard error={statusError} title="We couldn't load your spending" onRetry={() => { void loadStatus() }} />
      </div>
    )
  }
  if (!status) {
    return (
      <div role="status" aria-busy="true" aria-label="Loading spend analysis" className="w-full max-w-[1400px] mx-auto space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <CardSkeleton key={i} rows={1} />)}</div>
        <ChartSkeleton />
      </div>
    )
  }

  const hasData = status.hasData && !!month
  const ai = status.ai.availability
  const aiOff = ai === 'degraded' || ai === 'not_configured'

  return (
    <div className="spend-viz animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both w-full max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">Spend Analyser</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hasData
              ? <>{status.classifiedCount.toLocaleString('en-IN')} transactions categorised from your linked accounts{aiOff && <> · <span title="Insights and answers are calculated without AI wording right now">AI wording off</span></>}</>
              : 'Understand where your money goes, sorted by what matters to you'}
          </p>
        </div>
        {hasData && (
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={month!} onValueChange={(m) => setMonth(m)}>
              <SelectTrigger aria-label="Month" className="h-9 w-auto min-w-[9.5rem] rounded-full border-border bg-card text-foreground font-medium shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[18rem]">
                {status.months.map((m) => (
                  <SelectItem key={m.month} value={m.month} aria-label={`${monthLabel(m.month)}, ${m.txCount} transactions`}>{monthLabel(m.month)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button type="button" className={pillBtn} onClick={() => setNeedsOpen(true)}>
              <SlidersHorizontal className="size-4" /> <span>Your needs</span>
            </button>
            <button type="button" className={primaryBtn} onClick={analyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} Analyse
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className={cn(pillBtn, 'w-9 px-0')} aria-label="More actions"><MoreHorizontal className="size-4" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[16rem]">
                <DropdownMenuItem onSelect={() => { void reclassify() }} className="flex-col items-start gap-0.5">
                  <span className="inline-flex items-center gap-2 font-medium"><RotateCw className="size-4" /> Re-categorise everything</span>
                  <span className="text-xs text-muted-foreground pl-6">Re-runs categories using what you've taught it. Your own corrections are kept.</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {!hasData ? (
        <EmptyState status={status} onAnalyze={analyze} analyzing={analyzing} />
      ) : (
        <>
          {status.pendingCount > 0 && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm shadow-sm">
              <span className="text-foreground">
                {status.pendingCount} new transaction{status.pendingCount === 1 ? '' : 's'} from your bank {status.pendingCount === 1 ? "hasn't" : "haven't"} been categorised yet.
              </span>
              <button type="button" className={cn(pillBtn, 'h-8 text-xs')} onClick={analyze} disabled={analyzing}>Categorise now</button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto spend-scroll-x mb-5 pb-1 -mx-1 px-1" role="tablist" aria-label="Spend Analyser sections">
            {VIEWS.map((t) => {
              const active = view === t.id
              const count = t.id === 'review' ? status.needsReviewCount : 0
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setView(t.id)}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-medium whitespace-nowrap transition active:scale-95',
                    active ? 'bg-foreground text-background shadow-sm' : 'bg-card text-muted-foreground hover:text-foreground border border-border',
                  )}
                >
                  <t.icon className="size-4" aria-hidden />
                  {t.label}
                  {count > 0 && (
                    <span className={cn('ml-0.5 rounded-full px-1.5 text-[11px] font-semibold tabular',
                      active ? 'bg-background/20 text-background' : 'bg-[var(--spend-warn)]/15 text-[var(--spend-warn)]')}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div role="tabpanel">
            {view === 'overview' && (
              <OverviewTab month={month!} aiAvailability={ai} onAnalyze={analyze} analyzing={analyzing}
                onEditNeeds={() => setNeedsOpen(true)} onOpenCategory={openCategory} />
            )}
            {view === 'transactions' && (
              <TransactionsTab
                key={`${searchParams.get('q') ?? ''}|${searchParams.get('range') ?? ''}`}
                month={month!}
                category={category}
                type={txType}
                initialSearch={searchParams.get('q') ?? ''}
                initialAllMonths={searchParams.get('range') === 'all'}
                onFiltersChange={(f) => updateParams({ category: f.category, type: f.type })}
              />
            )}
            {view === 'review' && <ReviewTab />}
            {view === 'budgets' && <BudgetsTab month={month!} />}
            {view === 'subscriptions' && <SubscriptionsTab month={month!} />}
          </div>
        </>
      )}

      <NeedsProfileSheet open={needsOpen} onOpenChange={setNeedsOpen} />
    </div>
  )
}
