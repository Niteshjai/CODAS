import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Loader2, Pencil, Target, Trash2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { monthLabel, rupees } from './format'
import { EmptyBlock, Meter, Panel, inputCls, pillBtn, primaryBtn } from './SpendUi'
import type { Analysis, BudgetBurn } from './types'

const STATUS = {
  on_track: { icon: CheckCircle2, label: 'On track', color: 'var(--spend-good)' },
  at_risk: { icon: AlertTriangle, label: 'At risk', color: 'var(--spend-warn)' },
  over: { icon: XCircle, label: 'Over budget', color: 'var(--spend-bad)' },
} as const

/** Rupee text → paise; accepts "5,000" / "5000.50". */
function parseRupees(s: string): number | null {
  const n = Number(s.replace(/[,₹\s]/g, ''))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

function BudgetRow({ b, isCurrentMonth, onSave, onDelete }: {
  b: BudgetBurn; isCurrentMonth: boolean; onSave: (paise: number) => Promise<boolean>; onDelete: () => void
}) {
  const categories = useSpendStore((s) => s.categories)
  const cat = categoryById(categories, b.category)
  const look = STATUS[b.status]
  const Icon = look.icon
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(Math.round(b.budgetPaise / 100)))
  const [busy, setBusy] = useState(false)
  const remaining = b.budgetPaise - b.spentPaise
  const showProjection = isCurrentMonth && b.daysLeft > 0 && b.daysElapsed >= 3

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const paise = parseRupees(value)
    if (!paise) return
    setBusy(true)
    if (await onSave(paise)) setEditing(false)
    setBusy(false)
  }

  return (
    <li className="py-4 first:pt-0 last:pb-0" data-budget={b.category}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate"><span aria-hidden>{cat?.emoji ?? '🏷️'}</span> {b.label}</p>
          <p className="text-xs text-muted-foreground tabular">{rupees(b.spentPaise)} of {rupees(b.budgetPaise)} · {b.usedPct}% used</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium mr-1" style={{ color: look.color }}>
            <Icon className="size-3.5" aria-hidden /> {look.label}
          </span>
          <button type="button" aria-label={`Edit ${b.label} budget`} onClick={() => setEditing(!editing)}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-3.5" />
          </button>
          <button type="button" aria-label={`Remove ${b.label} budget`} onClick={onDelete}
            className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <Meter pct={b.usedPct} color={look.color} label={`${b.label}: ${b.usedPct}% of budget used`} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {remaining >= 0 ? `${rupees(remaining)} left` : `${rupees(-remaining)} over`}
        {showProjection && (
          <> · At this pace you'll spend <span className="text-foreground font-medium">{rupees(b.projectedPaise)}</span> by month end
            {b.projectedOverPaise > 0 && <> ({rupees(b.projectedOverPaise)} over)</>} · {b.daysLeft} day{b.daysLeft === 1 ? '' : 's'} left</>
        )}
      </p>
      {editing && (
        <form onSubmit={submit} className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor={`budget-${b.category}`}>Monthly budget for {b.label} in rupees</label>
          <div className="relative flex-1 max-w-[12rem]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
            <input id={`budget-${b.category}`} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} className={cn(inputCls, 'pl-7 h-9')} autoFocus />
          </div>
          <button type="submit" className={cn(primaryBtn, 'h-9')} disabled={busy || !parseRupees(value)}>
            {busy && <Loader2 className="size-4 animate-spin" />} Save
          </button>
          <button type="button" className={cn(pillBtn, 'h-9')} onClick={() => setEditing(false)}>Cancel</button>
        </form>
      )}
    </li>
  )
}

export default function BudgetsTab({ month }: { month: string }) {
  const revision = useSpendStore((s) => s.revision)
  const categories = useSpendStore((s) => s.categories)
  const invalidate = useSpendStore((s) => s.invalidate)
  const markChanged = useSpendStore((s) => s.markChanged)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [newCat, setNewCat] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<BudgetBurn | null>(null)

  useEffect(() => {
    let live = true
    setError(null)
    api.get('/spend/analysis', { params: { month } })
      .then((res) => { if (live) setAnalysis(res.data.data) })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [month, revision, nonce])

  const budgets = analysis?.budgets ?? []
  const spentBy = useMemo(() => new Map((analysis?.totals.byCategory ?? []).map((c) => [c.category, c])), [analysis])
  const available = categories
    .filter((c) => c.group === 'expense' && c.id !== 'INVESTMENTS' && !budgets.some((b) => b.category === c.id))
    .sort((a, b) => (spentBy.get(b.id)?.paise ?? 0) - (spentBy.get(a.id)?.paise ?? 0))
  const newCatSpent = newCat ? spentBy.get(newCat)?.paise ?? 0 : 0

  const save = async (category: string, budgetPaise: number) => {
    try {
      await api.post('/spend/budgets', { category, budgetPaise })
      markChanged()
      invalidate()
      toast.success(`Budget saved: ${rupees(budgetPaise)} a month for ${categoryById(categories, category)?.label ?? category}`)
      return true
    } catch (err) {
      toast.error(userFacingMessage(err))
      return false
    }
  }

  const add = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const paise = parseRupees(newAmount)
    if (!newCat) { setFormError('Pick a category.'); return }
    if (!paise || paise < 100) { setFormError('Enter a monthly amount of at least ₹1.'); return }
    setAdding(true)
    if (await save(newCat, paise)) { setNewCat(''); setNewAmount('') }
    setAdding(false)
  }

  const remove = async (b: BudgetBurn) => {
    try {
      await api.delete(`/spend/budgets/${encodeURIComponent(b.category)}`)
      markChanged()
      invalidate()
      toast.success(`Removed the ${b.label} budget`)
    } catch (err) {
      toast.error(userFacingMessage(err))
    }
  }

  if (error && !analysis) return <ErrorCard error={error} title="We couldn't load your budgets" onRetry={() => setNonce((n) => n + 1)} />

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
      <Panel
        title={`Budgets · ${monthLabel(month)}`}
        subtitle={analysis?.isCurrentMonth
          ? `Day ${Number(analysis.asOf.slice(8, 10))} of ${new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()}. Projections assume you keep spending at this month's pace.`
          : 'Final figures for this month.'}
      >
        {!analysis ? <ListSkeleton rows={3} /> : budgets.length === 0 ? (
          <EmptyBlock icon={<Target className="size-7" />} title="No budgets yet" body="Set a monthly limit for a category and we'll track how fast you're using it." />
        ) : (
          <ul className="divide-y divide-border">
            {budgets.map((b) => (
              <BudgetRow key={b.category} b={b} isCurrentMonth={analysis.isCurrentMonth}
                onSave={(p) => save(b.category, p)} onDelete={() => setDeleting(b)} />
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Add a budget" subtitle="Monthly limit per spending category">
        <form onSubmit={add} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="budget-cat">Category</label>
            <Select value={newCat} onValueChange={setNewCat}>
              <SelectTrigger id="budget-cat" className="mt-1 h-10 rounded-xl border-border bg-card text-foreground">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[18rem]">
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.emoji} {c.label}{spentBy.get(c.id) ? ` · ${rupees(spentBy.get(c.id)!.paise)} this month` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground" htmlFor="budget-amt">Monthly amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <input id="budget-amt" inputMode="numeric" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="5,000" className={cn(inputCls, 'pl-7')} />
            </div>
            {newCat && (
              <p className="mt-1 text-xs text-muted-foreground">
                {newCatSpent > 0 ? `You spent ${rupees(newCatSpent)} here in ${monthLabel(month)}.` : `No spending here in ${monthLabel(month)}.`}
              </p>
            )}
          </div>
          {formError && <p role="alert" className="text-xs text-[var(--tone-danger-fg)]">{formError}</p>}
          <button type="submit" className={cn(primaryBtn, 'w-full')} disabled={adding}>
            {adding && <Loader2 className="size-4 animate-spin" />} Save budget
          </button>
        </form>
      </Panel>

      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null) }}>
        <AlertDialogContent className="max-w-[26rem] rounded-2xl bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remove the {deleting?.label} budget?</AlertDialogTitle>
            <AlertDialogDescription>We'll stop tracking this limit. Your transactions aren't affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleting) void remove(deleting); setDeleting(null) }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
