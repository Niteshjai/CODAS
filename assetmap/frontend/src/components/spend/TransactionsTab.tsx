import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import { Switch } from '../ui/switch'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { monthLabel, rupees, shortDate } from './format'
import { CategoryPill, EmptyBlock, Panel, SourceBadge, inputCls, pillBtn } from './SpendUi'
import RecategoriseDialog from './RecategoriseDialog'
import type { SpendSummary, SpendTx } from './types'

const PAGE_SIZE = 30

export function TxRow({ tx, onEdit, refYear }: { tx: SpendTx; onEdit: () => void; refYear: number }) {
  const categories = useSpendStore((s) => s.categories)
  const cat = categoryById(categories, tx.category)
  const merchant = tx.merchantName && tx.merchantName.toUpperCase() !== 'UNKNOWN' ? tx.merchantName : null
  return (
    <li className="flex items-start gap-3 px-3 sm:px-4 py-3" data-tx-id={tx.id}>
      <div className="hidden sm:block w-14 shrink-0 pt-0.5 text-xs text-muted-foreground tabular">{shortDate(tx.date, refYear)}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium text-foreground truncate">{merchant ?? 'Unrecognised payee'}</p>
          <p className={cn('shrink-0 text-sm font-semibold tabular', tx.type === 'credit' ? 'text-[var(--spend-good)]' : 'text-foreground')}>
            {tx.type === 'credit' ? '+' : '−'}{rupees(tx.amountPaise)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground truncate" title={tx.narration}>{tx.narration}</p>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          <CategoryPill category={tx.category} label={tx.categoryLabel} subcategory={tx.subcategory} cat={cat} onClick={onEdit} />
          <SourceBadge by={tx.classifiedBy} confidence={tx.confidence} needsReview={tx.needsReview} reason={tx.reason} />
          {tx.needsReview && (
            <button type="button" onClick={onEdit}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--spend-warn)]/50 px-1.5 py-px text-[10px] font-semibold text-[var(--spend-warn)]"
              title={tx.reviewReason ?? 'We are not sure about this category'}>
              <AlertCircle className="size-3" aria-hidden /> Check
            </button>
          )}
          {tx.isRecurring && <span className="text-[10px] text-muted-foreground">Recurring</span>}
          <span className="sm:hidden text-[11px] text-muted-foreground tabular">{shortDate(tx.date, refYear)}</span>
          {tx.mode && <span className="hidden sm:inline text-[11px] text-muted-foreground">{tx.mode}</span>}
        </div>
        {tx.notes && <p className="mt-1 text-xs text-muted-foreground italic truncate">“{tx.notes}”</p>}
      </div>
    </li>
  )
}

export default function TransactionsTab({ month, category, type, initialSearch = '', initialAllMonths = false, onFiltersChange }: {
  month: string
  category: string | null
  type: 'debit' | 'credit' | null
  initialSearch?: string
  initialAllMonths?: boolean
  onFiltersChange: (f: { category: string | null; type: 'debit' | 'credit' | null }) => void
}) {
  const revision = useSpendStore((s) => s.revision)
  const categories = useSpendStore((s) => s.categories)
  const [allMonths, setAllMonths] = useState(initialAllMonths)
  const [searchInput, setSearchInput] = useState(initialSearch)
  const [search, setSearch] = useState(initialSearch.trim())
  const [onlyReview, setOnlyReview] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ transactions: SpendTx[]; total: number } | null>(null)
  const [summary, setSummary] = useState<SpendSummary | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [editing, setEditing] = useState<SpendTx | null>(null)

  // Debounce search typing
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => { setPage(1) }, [month, allMonths, search, onlyReview, category, type])

  useEffect(() => {
    let live = true
    setError(null)
    const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
    if (!allMonths) params.month = month
    if (category) params.category = category
    if (type) params.type = type
    if (search) params.search = search.slice(0, 100)
    if (onlyReview) params.needsReview = 'true'
    api.get('/spend/transactions', { params })
      .then((res) => { if (live) setData(res.data.data) })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [month, allMonths, search, onlyReview, category, type, page, revision, nonce])

  // Chips: only categories that actually have money in the window
  useEffect(() => {
    let live = true
    api.get('/spend/summary', { params: allMonths ? { month, months: '24' } : { month } })
      .then((res) => { if (live) setSummary(res.data.data) })
      .catch(() => { if (live) setSummary(null) })
    return () => { live = false }
  }, [month, allMonths, revision])

  const chips = useMemo(() => {
    const rows = [...(summary?.expenses ?? []), ...(summary?.revenue ?? [])]
      .filter((r) => !type || (type === 'debit' ? r.category_group === 'expense' : r.category_group === 'revenue'))
      .map((r) => ({ id: r.category, label: r.label, count: r.transaction_count }))
    if (category && !rows.some((r) => r.id === category)) {
      rows.unshift({ id: category, label: categoryById(categories, category)?.label ?? category, count: 0 })
    }
    return rows
  }, [summary, type, category, categories])

  const refYear = Number(month.slice(0, 4))
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1
  const filtered = Boolean(search || category || type || onlyReview)

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden />
            <input
              type="search"
              aria-label="Search transactions"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={100}
              placeholder="Search merchant or description"
              className={cn(inputCls, 'pl-9 rounded-full')}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-full border border-border p-0.5 bg-card" role="group" aria-label="Money direction">
              {([[null, 'All'], ['debit', 'Money out'], ['credit', 'Money in']] as const).map(([v, l]) => (
                <button key={l} type="button" aria-pressed={type === v}
                  onClick={() => onFiltersChange({ category: null, type: v })}
                  className={cn('rounded-full px-3 h-8 text-xs font-medium transition',
                    type === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>
                  {l}
                </button>
              ))}
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <Switch checked={onlyReview} onCheckedChange={setOnlyReview} aria-label="Only show transactions that need review" />
              Needs review
            </label>
            <label className="inline-flex items-center gap-2 text-xs text-foreground cursor-pointer select-none">
              <Switch checked={allMonths} onCheckedChange={setAllMonths} aria-label="Show all months" />
              All months
            </label>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto spend-scroll-x px-1 pb-0.5" role="group" aria-label="Filter by category">
            <button type="button" aria-pressed={!category} onClick={() => onFiltersChange({ category: null, type })}
              className={cn('shrink-0 rounded-full border px-3 h-8 text-xs font-medium transition',
                !category ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:bg-muted')}>
              All categories
            </button>
            {chips.map((c) => {
              const cat = categoryById(categories, c.id)
              const on = category === c.id
              return (
                <button key={c.id} type="button" aria-pressed={on}
                  onClick={() => onFiltersChange({ category: on ? null : c.id, type })}
                  className={cn('shrink-0 inline-flex items-center gap-1 rounded-full border px-3 h-8 text-xs font-medium transition whitespace-nowrap',
                    on ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:bg-muted')}>
                  <span aria-hidden>{cat?.emoji ?? '🏷️'}</span> {c.label}
                  {c.count > 0 && <span className={on ? 'opacity-70' : 'text-muted-foreground'}>{c.count}</span>}
                </button>
              )
            })}
          </div>
        )}
      </Panel>

      <section className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden" aria-label="Transactions">
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-b border-border">
          <p className="text-xs text-muted-foreground">
            {data ? `${data.total.toLocaleString('en-IN')} transaction${data.total === 1 ? '' : 's'}` : 'Loading…'}
            {' · '}{allMonths ? 'all months' : monthLabel(month)}
          </p>
          {filtered && (
            <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => { setSearchInput(''); setOnlyReview(false); onFiltersChange({ category: null, type: null }) }}>
              <X className="size-3.5" /> Clear filters
            </button>
          )}
        </div>
        {error && !data ? (
          <div className="p-4"><ErrorCard error={error} title="We couldn't load your transactions" onRetry={() => setNonce((n) => n + 1)} /></div>
        ) : !data ? (
          <ListSkeleton rows={6} />
        ) : data.transactions.length === 0 ? (
          <EmptyBlock
            icon={<Search className="size-6" />}
            title={filtered ? 'No transactions match these filters' : `No transactions in ${monthLabel(month)}`}
            body={filtered ? 'Try clearing a filter or searching for something else.' : 'Switch on “All months” to see earlier transactions.'}
          />
        ) : (
          <ul className="divide-y divide-border">
            {data.transactions.map((tx) => <TxRow key={tx.id} tx={tx} refYear={refYear} onEdit={() => setEditing(tx)} />)}
          </ul>
        )}
        {data && totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-2.5 border-t border-border">
            <button type="button" className={cn(pillBtn, 'h-8 px-3 text-xs')} disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="size-3.5" /> Newer
            </button>
            <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
            <button type="button" className={cn(pillBtn, 'h-8 px-3 text-xs')} disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Older <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground px-1">
        Tap a category to fix it. Your corrections teach the analyser: the next payment to the same merchant is categorised your way.
      </p>

      <RecategoriseDialog tx={editing} onClose={() => setEditing(null)} />
    </div>
  )
}
