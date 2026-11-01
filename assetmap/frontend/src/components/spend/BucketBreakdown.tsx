import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, SlidersHorizontal, ArrowDownRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { BUCKET_HINT, BUCKET_LABEL, BUCKET_ORDER, bucketVar, pct, rupees, monthLabel } from './format'
import { Meter, Panel, pillBtn } from './SpendUi'
import type { Breakdown, Bucket } from './types'

type Tone = 'good' | 'warn' | 'neutral'

function comparisonTone(group: 'needs' | 'wants' | 'savings', status: 'on_target' | 'over' | 'under'): Tone {
  if (status === 'on_target') return 'good'
  if (group === 'savings') return status === 'under' ? 'warn' : 'good'
  return status === 'over' ? 'warn' : 'good'
}

function StatusChip({ tone, text }: { tone: Tone; text: string }) {
  const Icon = tone === 'warn' ? AlertTriangle : tone === 'good' ? CheckCircle2 : ArrowDownRight
  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap',
      tone === 'warn' ? 'text-[var(--spend-warn)]' : tone === 'good' ? 'text-[var(--spend-good)]' : 'text-muted-foreground',
    )}>
      <Icon className="size-3.5" aria-hidden /> {text}
    </span>
  )
}

export function BucketBreakdown({ data, onEditNeeds, onOpenCategory }: {
  data: Breakdown
  onEditNeeds: () => void
  onOpenCategory: (category: string) => void
}) {
  const categories = useSpendStore((s) => s.categories)
  const [open, setOpen] = useState<Bucket | null>(null)
  const byBucket = new Map(data.buckets.map((b) => [b.bucket, b]))
  const base = data.basis === 'income' ? data.incomePaise : data.totalOutflowPaise
  // Stacked bar shares (savings on an income basis already includes unspent income)
  const segments = BUCKET_ORDER.map((b) => ({ bucket: b, paise: byBucket.get(b)?.amountPaise ?? 0 })).filter((s) => s.paise > 0)
  const segTotal = segments.reduce((s, x) => s + x.paise, 0)

  return (
    <Panel
      id="spend-breakdown"
      title="Needs-based breakdown"
      subtitle={data.basis === 'income'
        ? `Compared with your income of ${rupees(data.incomePaise)} in ${monthLabel(data.month)}`
        : `No income recorded in ${monthLabel(data.month)}, so this is a share of what you spent (${rupees(data.totalOutflowPaise)})`}
      action={
        <button type="button" className={cn(pillBtn, 'h-8 px-3 text-xs')} onClick={onEditNeeds}>
          <SlidersHorizontal className="size-3.5" /> Your needs
        </button>
      }
    >
      {!data.profileConfigured && (
        <button
          type="button"
          onClick={onEditNeeds}
          className="mb-4 w-full rounded-xl border border-dashed border-border bg-muted/50 px-3 py-2.5 text-left text-xs text-muted-foreground hover:bg-muted transition"
        >
          Using the standard <span className="font-semibold text-foreground">50 / 30 / 20</span> split and default buckets.{' '}
          <span className="font-semibold text-foreground underline underline-offset-2">Tell us what matters to you</span> to tailor it.
        </button>
      )}

      {/* Actual vs target */}
      <div className="space-y-4">
        {data.comparison.map((c) => {
          // Say what the numbers say: for needs/wants staying under the target is fine, for savings it isn't
          const gap = c.actualPaise - c.targetPaise
          const isGood = c.group === 'savings' ? gap >= 0 : gap <= 0
          const tone: Tone = c.status === 'on_target' || isGood ? 'good' : comparisonTone(c.group, c.status)
          const text = c.group === 'savings'
            ? (gap >= 0 ? 'Target met' : `${rupees(-gap)} short of target`)
            : (gap <= 0 ? `Within target · ${rupees(-gap)} to spare` : `${rupees(gap)} over target`)
          return (
            <div key={c.group}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-sm font-medium text-foreground min-w-0">{c.label}</span>
                <span className="text-sm text-foreground tabular shrink-0">
                  <span className="font-semibold">{pct(c.actualPct)}</span>
                  <span className="text-muted-foreground"> / target {c.targetPct}%</span>
                </span>
              </div>
              <Meter
                pct={c.actualPct}
                marker={c.targetPct}
                color={bucketVar(c.group)}
                label={`${c.label}: ${pct(c.actualPct)} of ${data.basis === 'income' ? 'income' : 'spending'} against a ${c.targetPct}% target`}
              />
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 mt-1.5">
                <span className="text-xs text-muted-foreground tabular">{rupees(c.actualPaise)} of {rupees(c.targetPaise)} target</span>
                <StatusChip tone={tone} text={text} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Where it went: one stacked bar in fixed bucket order, with legend + direct labels */}
      {segTotal > 0 && (
        <div className="mt-6">
          <div className="flex h-3 w-full gap-[2px] rounded-full overflow-hidden" role="img"
            aria-label={segments.map((s) => `${BUCKET_LABEL[s.bucket]} ${rupees(s.paise)}`).join(', ')}>
            {segments.map((s) => (
              <div key={s.bucket} title={`${BUCKET_LABEL[s.bucket]}: ${rupees(s.paise)}`}
                style={{ width: `${(s.paise / segTotal) * 100}%`, background: bucketVar(s.bucket), minWidth: 4 }} />
            ))}
          </div>
        </div>
      )}

      {/* Bucket rows → categories */}
      <ul className="mt-4 divide-y divide-border">
        {BUCKET_ORDER.map((b) => {
          const row = byBucket.get(b)
          if (!row) return null
          const isOpen = open === b
          const hasCats = row.categories.length > 0
          return (
            <li key={b}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : b)}
                disabled={!hasCats && !(b === 'savings' && data.unspentPaise > 0)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-3 py-3 text-left disabled:cursor-default group"
              >
                <span className="size-2.5 rounded-full shrink-0" style={{ background: bucketVar(b) }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{BUCKET_LABEL[b]}</span>
                  <span className="block text-xs text-muted-foreground">{BUCKET_HINT[b]}</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-sm font-semibold text-foreground tabular">{rupees(row.amountPaise)}</span>
                  <span className="block text-xs text-muted-foreground tabular">{pct(row.pctOfBase)} of {data.basis === 'income' ? 'income' : 'spend'}</span>
                </span>
                <ChevronDown className={cn('size-4 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-180', !hasCats && 'invisible')} aria-hidden />
              </button>
              {isOpen && (
                <ul className="pb-3 pl-5 space-y-1">
                  {row.categories.map((c) => {
                    const cat = categoryById(categories, c.category)
                    return (
                      <li key={c.category}>
                        <button
                          type="button"
                          onClick={() => onOpenCategory(c.category)}
                          className="w-full rounded-xl px-2.5 py-2 text-left hover:bg-muted transition flex items-start gap-2"
                        >
                          <span aria-hidden className="pt-0.5">{cat?.emoji ?? '🏷️'}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm text-foreground">{c.label}</span>
                              {c.bucketSource === 'custom' && <span className="rounded-full border border-border px-1.5 text-[10px] text-muted-foreground">your choice</span>}
                              {c.budgetUsedPct != null && (
                                <span className={cn('text-[11px]', c.budgetUsedPct > 100 ? 'text-[var(--spend-warn)] font-medium' : 'text-muted-foreground')}>
                                  {c.budgetUsedPct}% of budget
                                </span>
                              )}
                            </span>
                            {c.subcategories.length > 0 && (
                              <span className="block text-xs text-muted-foreground truncate">
                                {c.subcategories.slice(0, 4).map((s) => `${s.name} ${rupees(s.amountPaise)}`).join(' · ')}
                              </span>
                            )}
                          </span>
                          <span className="text-right shrink-0">
                            <span className="block text-sm text-foreground tabular">{rupees(c.amountPaise)}</span>
                            <span className="block text-[11px] text-muted-foreground">{c.txCount} txn{c.txCount === 1 ? '' : 's'}</span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                  {b === 'savings' && data.basis === 'income' && data.unspentPaise > 0 && (
                    <li className="px-2.5 py-2 flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Income not spent this month</span>
                      <span className="text-foreground tabular">{rupees(data.unspentPaise)}</span>
                    </li>
                  )}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      {data.transfersOutPaise > 0 && (
        // Not a spending bucket, but it left the account: it is not shown as savings either
        <button
          type="button"
          onClick={() => onOpenCategory('TRANSFERS')}
          className="mt-1 w-full flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5 text-left hover:bg-muted transition"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-foreground">Sent to people & card bills</span>
            <span className="block text-xs text-muted-foreground">Not a spending bucket, and not counted as savings. Tap to see or categorise them.</span>
          </span>
          <span className="shrink-0 text-sm font-semibold text-foreground tabular">{rupees(data.transfersOutPaise)}</span>
        </button>
      )}
      {base > 0 && data.needsReviewCount > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {data.needsReviewCount} transaction{data.needsReviewCount === 1 ? '' : 's'} this month still need{data.needsReviewCount === 1 ? 's' : ''} your review, so these numbers may shift.
        </p>
      )}
    </Panel>
  )
}

/** Category magnitudes as thin horizontal bars, coloured by the bucket each category falls in. */
export function CategoryBars({ data, onOpenCategory }: { data: Breakdown; onOpenCategory: (category: string) => void }) {
  const categories = useSpendStore((s) => s.categories)
  const flat = data.buckets.flatMap((b) => b.categories.map((c) => ({ ...c, bucket: b.bucket })))
  // A category can straddle buckets (Groceries are needs, delivery is a want): name the part shown
  const splitCats = new Set(flat.filter((r, i) => flat.findIndex((x) => x.category === r.category) !== i).map((r) => r.category))
  const rows = flat
    .map((r) => ({
      ...r,
      key: `${r.category}:${r.bucket}`,
      label: splitCats.has(r.category) && r.subcategories.length
        ? `${r.label} · ${r.subcategories.map((s) => s.name).slice(0, 2).join(', ')}`
        : r.label,
    }))
    .sort((a, b) => b.amountPaise - a.amountPaise)
  const top = rows.slice(0, 8)
  const rest = rows.slice(8)
  const restPaise = rest.reduce((s, r) => s + r.amountPaise, 0)
  const max = Math.max(1, ...top.map((r) => r.amountPaise), restPaise, data.transfersOutPaise)
  const usedBuckets = BUCKET_ORDER.filter((b) => rows.some((r) => r.bucket === b))

  return (
    <Panel
      title="Where your money went"
      subtitle={`${monthLabel(data.month)} · spending, investments and EMIs${data.transfersOutPaise > 0 ? '; money sent to people and card bills is shown separately' : ''}`}
    >
      {rows.length === 0 && data.transfersOutPaise === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No money went out in {monthLabel(data.month)}.</p>
      ) : (
        <>
          {usedBuckets.length > 1 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3" aria-label="Legend">
              {usedBuckets.map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ background: bucketVar(b) }} aria-hidden /> {BUCKET_LABEL[b]}
                </span>
              ))}
            </div>
          )}
          <ul className="space-y-1">
            {top.map((r) => {
              const cat = categoryById(categories, r.category)
              return (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => onOpenCategory(r.category)}
                    title={`${r.label}: ${rupees(r.amountPaise)} across ${r.txCount} transaction${r.txCount === 1 ? '' : 's'} (${BUCKET_LABEL[r.bucket]})`}
                    className="w-full rounded-lg px-1.5 py-1.5 hover:bg-muted transition text-left"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm mb-1">
                      <span className="min-w-0 truncate text-foreground"><span aria-hidden>{cat?.emoji ?? '🏷️'}</span> {r.label}</span>
                      <span className="shrink-0 tabular text-foreground font-medium">{rupees(r.amountPaise)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--spend-track)]">
                      <div className="h-full rounded-full" style={{ width: `${(r.amountPaise / max) * 100}%`, minWidth: 4, background: bucketVar(r.bucket) }} />
                    </div>
                  </button>
                </li>
              )
            })}
            {rest.length > 0 && (
              <li className="px-1.5 py-1.5">
                <div className="flex items-center justify-between gap-2 text-sm mb-1">
                  <span className="text-muted-foreground">{rest.length} other categor{rest.length === 1 ? 'y' : 'ies'}</span>
                  <span className="tabular text-foreground">{rupees(restPaise)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--spend-track)]">
                  <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${(restPaise / max) * 100}%`, minWidth: 4 }} />
                </div>
              </li>
            )}
            {data.transfersOutPaise > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => onOpenCategory('TRANSFERS')}
                  title="Transfers to people and credit-card bill payments: not a spending category"
                  className="w-full rounded-lg px-1.5 py-1.5 hover:bg-muted transition text-left"
                >
                  <div className="flex items-center justify-between gap-2 text-sm mb-1">
                    <span className="min-w-0 truncate text-muted-foreground"><span aria-hidden>↔️</span> Sent to people & card bills</span>
                    <span className="shrink-0 tabular text-foreground">{rupees(data.transfersOutPaise)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--spend-track)]">
                    <div className="h-full rounded-full bg-muted-foreground/50" style={{ width: `${(data.transfersOutPaise / max) * 100}%`, minWidth: 4 }} />
                  </div>
                </button>
              </li>
            )}
          </ul>
        </>
      )}
    </Panel>
  )
}
