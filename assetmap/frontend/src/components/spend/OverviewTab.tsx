import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard } from '../errors/ErrorCard'
import { CardSkeleton } from '../loading/CardSkeleton'
import { ChartSkeleton } from '../loading/ChartSkeleton'
import { useSpendStore } from '../../store/spendStore'
import { monthLabel, pct, rupees } from './format'
import { BucketBreakdown, CategoryBars } from './BucketBreakdown'
import { InsightsPanel } from './InsightsPanel'
import { AskSpending } from './AskSpending'
import type { AiAvailability, Analysis, Breakdown } from './types'

function Tile({ label, value, sub, subTone = 'muted' }: { label: string; value: ReactNode; sub?: ReactNode; subTone?: 'muted' | 'good' | 'warn' }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">{value}</p>
      {sub && (
        <p className={cn('mt-1 text-xs line-clamp-2',
          subTone === 'good' ? 'text-[var(--spend-good)]' : subTone === 'warn' ? 'text-[var(--spend-warn)]' : 'text-muted-foreground')}>
          {sub}
        </p>
      )}
    </div>
  )
}

function KpiTiles({ a }: { a: Analysis }) {
  const t = a.totals
  const prevSpending = a.monthOverMonth.filter((r) => r.category !== 'INVESTMENTS').reduce((s, r) => s + r.previousPaise, 0)
  const delta = t.spendingPaise - prevSpending
  const deltaPct = prevSpending > 0 ? Math.round((delta / prevSpending) * 100) : null
  const rate = a.savings.savingsRatePct
  const momWords = `${delta > 0 ? 'more than' : delta < 0 ? 'less than' : 'same as'} last month${a.isCurrentMonth ? ' so far' : ''}`
  const momText = deltaPct != null && delta !== 0
    ? `${delta > 0 ? '+' : '−'}${Math.abs(deltaPct)}% · ${momWords}`
    : momWords.charAt(0).toUpperCase() + momWords.slice(1)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile
        label={a.isCurrentMonth ? 'Spent so far' : 'Spent'}
        value={rupees(t.spendingPaise)}
        sub={t.investedPaise > 0 ? `+ ${rupees(t.investedPaise)} invested` : 'Excludes investments'}
      />
      <Tile
        label="Income"
        value={t.incomePaise > 0 ? rupees(t.incomePaise) : '—'}
        sub={t.incomePaise > 0 ? (t.refundsPaise > 0 ? `+ ${rupees(t.refundsPaise)} refunds` : 'Salary, interest and other income') : 'No income recorded this month'}
      />
      <Tile
        label="Savings rate"
        value={rate == null ? '—' : pct(rate)}
        sub={rate == null ? 'Needs income to calculate' : `Target ${a.savings.targetPct}%`}
        subTone={rate == null ? 'muted' : rate >= a.savings.targetPct ? 'good' : 'warn'}
      />
      <Tile
        label={`vs ${monthLabel(a.previousMonth, true)}`}
        value={prevSpending > 0
          ? <span className="inline-flex items-center gap-1">
              {delta > 0 ? <ArrowUpRight className="size-5" aria-hidden /> : delta < 0 ? <ArrowDownRight className="size-5" aria-hidden /> : <Minus className="size-5" aria-hidden />}
              {rupees(Math.abs(delta))}
            </span>
          : '—'}
        sub={prevSpending > 0
          // Percentage first so it survives on narrow tiles
          ? momText
          : `No spending data for ${monthLabel(a.previousMonth, true)}`}
        subTone={prevSpending > 0 ? (delta > 0 ? 'warn' : 'good') : 'muted'}
      />
    </div>
  )
}

export default function OverviewTab({ month, aiAvailability, onAnalyze, analyzing, onEditNeeds, onOpenCategory }: {
  month: string
  aiAvailability: AiAvailability
  onAnalyze: () => void
  analyzing: boolean
  onEditNeeds: () => void
  onOpenCategory: (category: string) => void
}) {
  const revision = useSpendStore((s) => s.revision)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
  const [error, setError] = useState<unknown>(null)

  const [nonce, setNonce] = useState(0)

  // Month switch: show skeletons rather than last month's numbers under the new heading
  useEffect(() => { setAnalysis(null); setBreakdown(null) }, [month])

  useEffect(() => {
    let live = true
    setError(null)
    Promise.all([
      api.get('/spend/analysis', { params: { month } }),
      api.get('/spend/breakdown', { params: { month } }),
    ]).then(([a, b]) => {
      if (!live) return
      setAnalysis(a.data.data as Analysis)
      setBreakdown(b.data.data as Breakdown)
    }).catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [month, revision, nonce])

  if (error && !analysis) {
    return <ErrorCard error={error} title="We couldn't load this month's spending" onRetry={() => setNonce((n) => n + 1)} />
  }

  return (
    <div className="space-y-4">
      {analysis ? <KpiTiles a={analysis} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} rows={1} />)}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          {breakdown ? (
            <>
              <BucketBreakdown data={breakdown} onEditNeeds={onEditNeeds} onOpenCategory={onOpenCategory} />
              <CategoryBars data={breakdown} onOpenCategory={onOpenCategory} />
            </>
          ) : <><ChartSkeleton /><ChartSkeleton /></>}
        </div>
        <div className="space-y-4 min-w-0">
          <InsightsPanel month={month} aiAvailability={aiAvailability} onAnalyze={onAnalyze} analyzing={analyzing} />
          {/* Keyed by month: earlier answers were about another month */}
          <AskSpending key={month} month={month} />
        </div>
      </div>
    </div>
  )
}
