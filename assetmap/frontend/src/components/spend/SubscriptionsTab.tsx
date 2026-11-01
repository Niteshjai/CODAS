import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { api } from '../../services/api'
import { ErrorCard } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { monthLabel, rupees, shortDate } from './format'
import { EmptyBlock, Panel } from './SpendUi'
import type { Analysis, RecurringSeries } from './types'

// Same split as the Ask answer to "which subscriptions…" (backend spendAsk SUBSCRIPTION_EXCLUDED)
const COMMITMENTS = new Set(['EMI', 'INVESTMENTS', 'INSURANCE'])
// Repeating payments to people, rent and cash withdrawals aren't subscriptions to cancel
const PEOPLE_AND_HOUSING = new Set(['TRANSFERS', 'RENT', 'ATM'])

function SeriesRow({ r, refYear }: { r: RecurringSeries; refYear: number }) {
  const categories = useSpendStore((s) => s.categories)
  const navigate = useNavigate()
  const cat = categoryById(categories, r.category)
  const every = r.avgIntervalDays >= 27 && r.avgIntervalDays <= 33 ? 'monthly' : `every ~${r.avgIntervalDays} days`
  return (
    <li className="py-3 flex items-start gap-3" data-merchant={r.merchant}>
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-base" aria-hidden>{cat?.emoji ?? '🔁'}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground truncate">
            {r.merchant}
            {r.isNew && <span className="ml-1.5 rounded-full border border-foreground/30 px-1.5 text-[10px] font-semibold text-foreground align-middle">New</span>}
          </p>
          <p className="shrink-0 text-sm font-semibold text-foreground tabular">{rupees(r.avgAmountPaise)}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {r.label} · {every} · charged {r.occurrences} times since {shortDate(r.firstDate, refYear)}
        </p>
        <p className="text-xs mt-0.5">
          {r.active
            ? <span className="text-muted-foreground">Next expected around <span className="text-foreground">{shortDate(r.nextExpectedDate, refYear)}</span></span>
            : <span className="text-[var(--spend-warn)]">No similar charge since {shortDate(r.lastDate, refYear)}. It may have stopped or changed amount.</span>}
          {' · '}
          <button type="button" className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            onClick={() => navigate(`/dashboard?tab=analytics&view=transactions&range=all&q=${encodeURIComponent(r.merchant)}`)}>
            See payments
          </button>
        </p>
      </div>
    </li>
  )
}

function Group({ title, subtitle, rows, refYear }: { title: string; subtitle: string; rows: RecurringSeries[]; refYear: number }) {
  const active = rows.filter((r) => r.active)
  const monthly = active.reduce((s, r) => s + r.monthlyEquivalentPaise, 0)
  return (
    <Panel
      title={title}
      subtitle={subtitle}
      action={active.length > 0 ? (
        <div className="text-right">
          <p className="text-base font-semibold text-foreground tabular">{rupees(monthly)}</p>
          <p className="text-[11px] text-muted-foreground">a month · {active.length} active</p>
        </div>
      ) : undefined}
    >
      <ul className="divide-y divide-border -my-3">
        {rows.map((r) => <SeriesRow key={`${r.merchant}-${r.firstDate}`} r={r} refYear={refYear} />)}
      </ul>
    </Panel>
  )
}

export default function SubscriptionsTab({ month }: { month: string }) {
  const revision = useSpendStore((s) => s.revision)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    let live = true
    setError(null)
    api.get('/spend/analysis', { params: { month } })
      .then((res) => { if (live) setAnalysis(res.data.data) })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [month, revision, nonce])

  if (error && !analysis) return <ErrorCard error={error} title="We couldn't load your recurring payments" onRetry={() => setNonce((n) => n + 1)} />
  if (!analysis) return <ListSkeleton rows={4} />

  const refYear = Number(month.slice(0, 4))
  const subs = analysis.recurring.filter((r) => !COMMITMENTS.has(r.category) && !PEOPLE_AND_HOUSING.has(r.category))
  const commitments = analysis.recurring.filter((r) => COMMITMENTS.has(r.category))
  const peopleAndHousing = analysis.recurring.filter((r) => PEOPLE_AND_HOUSING.has(r.category))
  const rule = 'Same merchant, a similar amount (within 10%), about a month apart (25–35 days), at least twice.'

  if (analysis.recurring.length === 0) {
    return (
      <Panel>
        <EmptyBlock
          icon={<Repeat className="size-7" />}
          title="No recurring payments found yet"
          body={<>We look for: {rule.charAt(0).toLowerCase() + rule.slice(1)} With data from {analysis.coverage.monthsWithData} month{analysis.coverage.monthsWithData === 1 ? '' : 's'} up to {monthLabel(month)}, nothing matched.</>}
        />
      </Panel>
    )
  }

  return (
    <div className="space-y-4">
      {subs.length > 0 && (
        <Group title="Subscriptions & regular bills" subtitle="Payments that repeat about once a month. Worth checking you still need each one." rows={subs} refYear={refYear} />
      )}
      {commitments.length > 0 && (
        <Group title="Loans, SIPs & insurance" subtitle="Regular commitments: EMIs, investments and premiums" rows={commitments} refYear={refYear} />
      )}
      {peopleAndHousing.length > 0 && (
        <Group
          title="Rent & regular transfers"
          subtitle="Repeating payments to the same person or for housing, and regular cash withdrawals. Not counted as subscriptions."
          rows={peopleAndHousing}
          refYear={refYear}
        />
      )}
      <p className="text-xs text-muted-foreground px-1">How we detect these: {rule} Based on transactions up to {monthLabel(month)}.</p>
    </div>
  )
}
