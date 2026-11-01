import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ChevronDown, Loader2, Minus, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet'
import { useSpendStore } from '../../store/spendStore'
import { BUCKET_LABEL, BUCKET_ORDER, bucketVar } from './format'
import { pillBtn, primaryBtn } from './SpendUi'
import type { Bucket, ProfileOptions, ProfileResponse, TargetSplit } from './types'

const PRESETS: Array<{ label: string; split: TargetSplit }> = [
  { label: '50 / 30 / 20', split: { needs: 50, wants: 30, savings: 20 } },
  { label: '60 / 20 / 20', split: { needs: 60, wants: 20, savings: 20 } },
  { label: '40 / 30 / 30', split: { needs: 40, wants: 30, savings: 30 } },
  { label: '50 / 20 / 30', split: { needs: 50, wants: 20, savings: 30 } },
]

const MAX_PRIORITIES = 5

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="py-5 border-b border-border last:border-b-0">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

function ChipToggle({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} disabled={disabled}
      className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition text-left disabled:opacity-40 disabled:cursor-not-allowed',
        on ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:bg-muted')}>
      {children}
    </button>
  )
}

function BucketSelect({ value, onChange, label, isCustom }: { value: Bucket; onChange: (b: Bucket) => void; label: string; isCustom: boolean }) {
  return (
    <div className="relative shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-2 rounded-full" style={{ background: bucketVar(value) }} aria-hidden />
      <select
        aria-label={`Bucket for ${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value as Bucket)}
        className={cn('appearance-none rounded-full border bg-card pl-6 pr-7 h-8 text-xs text-foreground outline-none focus:ring-1 focus:ring-foreground cursor-pointer',
          isCustom ? 'border-foreground/50 font-semibold' : 'border-border')}
      >
        {BUCKET_ORDER.map((b) => <option key={b} value={b}>{BUCKET_LABEL[b]}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" aria-hidden />
    </div>
  )
}

export default function NeedsProfileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const invalidate = useSpendStore((s) => s.invalidate)
  const markChanged = useSpendStore((s) => s.markChanged)
  const [options, setOptions] = useState<ProfileOptions | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [householdSize, setHouseholdSize] = useState<number | null>(null)
  const [cityTier, setCityTier] = useState<string | null>(null)
  const [incomeBand, setIncomeBand] = useState<string | null>(null)
  const [priorities, setPriorities] = useState<string[]>([])
  const [goalsNote, setGoalsNote] = useState('')
  const [split, setSplit] = useState<TargetSplit>({ needs: 50, wants: 30, savings: 20 })
  const [overrides, setOverrides] = useState<Record<string, Bucket>>({})

  useEffect(() => {
    if (!open) return
    let live = true
    setError(null)
    setSaveError(null)
    api.get('/spend/profile')
      .then((res) => {
        if (!live) return
        const { profile, options: opts } = res.data.data as ProfileResponse
        setOptions(opts)
        setHouseholdSize(profile.householdSize)
        setCityTier(profile.cityTier)
        setIncomeBand(profile.incomeBand)
        setPriorities(profile.priorities)
        setGoalsNote(profile.goalsNote ?? '')
        setSplit(profile.targetSplit)
        setOverrides(profile.bucketOverrides ?? {})
      })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [open, nonce])

  const splitTotal = split.needs + split.wants + split.savings
  const setSplitPart = (k: keyof TargetSplit, raw: string) => {
    const n = Math.max(0, Math.min(100, Math.round(Number(raw) || 0)))
    setSplit((s) => ({ ...s, [k]: n }))
  }

  // Overrides store only differences from the defaults (the API replaces the whole map)
  const setCategoryBucket = (catId: string, defaultBucket: Bucket, b: Bucket) => {
    setOverrides((o) => {
      const next = { ...o }
      if (b === defaultBucket) delete next[catId]
      else next[catId] = b
      return next
    })
  }
  const setSubBucket = (key: string, inherited: Bucket, b: Bucket) => {
    setOverrides((o) => {
      const next = { ...o }
      if (b === inherited) delete next[key]
      else next[key] = b
      return next
    })
  }

  const save = async () => {
    if (splitTotal !== 100) { setSaveError(`Your targets add up to ${splitTotal}%. They need to add up to 100%.`); return }
    setSaving(true)
    setSaveError(null)
    try {
      await api.put('/spend/profile', {
        householdSize, cityTier, incomeBand, priorities,
        goalsNote: goalsNote.trim() ? goalsNote.trim().slice(0, 300) : null,
        targetSplit: split,
        bucketOverrides: overrides,
      })
      toast.success('Saved. Your breakdown and future insights now follow your needs.')
      markChanged()
      invalidate()
      onOpenChange(false)
    } catch (err) {
      setSaveError(userFacingMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const customCount = Object.keys(overrides).length

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o) }}>
      <SheetContent side="right" className="spend-viz w-full sm:max-w-[34rem] bg-card border-border p-0 flex flex-col gap-0">
        <SheetHeader className="text-left px-5 sm:px-6 pt-5 pb-3 border-b border-border pr-12">
          <SheetTitle className="text-foreground">Your needs</SheetTitle>
          <SheetDescription>
            Tell us what matters to you. We use this to sort your spending into needs, wants, savings and debt, and to pick which insights to show first. Everything is optional.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6">
          {error && !options ? (
            <div className="py-6"><ErrorCard compact error={error} title="We couldn't load your preferences" onRetry={() => setNonce((n) => n + 1)} /></div>
          ) : !options ? (
            <div className="py-6"><ListSkeleton rows={5} /></div>
          ) : (
            <>
              <Section title="Household" hint="How many people does your spending cover?">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="inline-flex items-center rounded-full border border-border">
                    <button type="button" aria-label="Fewer people" className="grid size-9 place-items-center text-foreground disabled:opacity-40"
                      disabled={!householdSize || householdSize <= 1} onClick={() => setHouseholdSize(Math.max(1, (householdSize ?? 1) - 1))}><Minus className="size-4" /></button>
                    <span className="min-w-[4.5rem] text-center text-sm text-foreground tabular" aria-live="polite">
                      {householdSize ? `${householdSize} ${householdSize === 1 ? 'person' : 'people'}` : 'Not set'}
                    </span>
                    <button type="button" aria-label="More people" className="grid size-9 place-items-center text-foreground disabled:opacity-40"
                      disabled={(householdSize ?? 0) >= 20} onClick={() => setHouseholdSize(Math.min(20, (householdSize ?? 0) + 1))}><Plus className="size-4" /></button>
                  </div>
                  {householdSize != null && <button type="button" className="text-xs text-muted-foreground underline underline-offset-2" onClick={() => setHouseholdSize(null)}>Clear</button>}
                </div>
                <p className="text-xs font-medium text-muted-foreground mt-4 mb-2">Where do you live?</p>
                <div className="flex flex-wrap gap-1.5">
                  {options.cityTiers.map((c) => (
                    <ChipToggle key={c.id} on={cityTier === c.id} onClick={() => setCityTier(cityTier === c.id ? null : c.id)}>{c.label}</ChipToggle>
                  ))}
                </div>
              </Section>

              <Section title="Monthly income (optional)" hint="Helps tailor the wording of AI-written insights. Your breakdown and savings rate always use the income seen in your linked accounts. Stored as a range, never an exact figure.">
                <div className="flex flex-wrap gap-1.5">
                  {options.incomeBands.map((b) => (
                    <ChipToggle key={b.id} on={incomeBand === b.id} onClick={() => setIncomeBand(incomeBand === b.id ? null : b.id)}>{b.label}</ChipToggle>
                  ))}
                </div>
              </Section>

              <Section title="What are you working towards?" hint={`Pick up to ${MAX_PRIORITIES}. Insights about these come first.`}>
                <div className="flex flex-wrap gap-1.5">
                  {options.priorities.map((p) => {
                    const on = priorities.includes(p.id)
                    return (
                      <ChipToggle key={p.id} on={on} disabled={!on && priorities.length >= MAX_PRIORITIES}
                        onClick={() => setPriorities(on ? priorities.filter((x) => x !== p.id) : [...priorities, p.id])}>
                        {p.label}
                      </ChipToggle>
                    )
                  })}
                </div>
                <label htmlFor="goals-note" className="block text-xs font-medium text-muted-foreground mt-4 mb-1.5">Anything else? <span className="font-normal">(only you see this, stored encrypted)</span></label>
                <textarea id="goals-note" value={goalsNote} maxLength={300} rows={2} onChange={(e) => setGoalsNote(e.target.value)}
                  placeholder="e.g. Saving for a down payment by 2028"
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground resize-none" />
                <p className="text-[11px] text-muted-foreground text-right">{goalsNote.length}/300</p>
              </Section>

              <Section title="Target split" hint="How you'd like your income divided. Debt repayments count towards needs.">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {PRESETS.map((p) => {
                    const on = p.split.needs === split.needs && p.split.wants === split.wants && p.split.savings === split.savings
                    return <ChipToggle key={p.label} on={on} onClick={() => setSplit(p.split)}>{p.label}</ChipToggle>
                  })}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['needs', 'wants', 'savings'] as const).map((k) => (
                    <label key={k} className="rounded-xl border border-border p-2.5">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: bucketVar(k) }} aria-hidden />
                        {k === 'savings' ? 'Savings' : BUCKET_LABEL[k]}
                      </span>
                      <span className="mt-1 flex items-baseline gap-0.5">
                        <input type="number" min={0} max={100} inputMode="numeric" value={split[k]}
                          onChange={(e) => setSplitPart(k, e.target.value)}
                          aria-label={`${BUCKET_LABEL[k]} target percent`}
                          className="w-full min-w-0 bg-transparent text-lg font-semibold text-foreground outline-none tabular" />
                        <span className="text-sm text-muted-foreground">%</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className={cn('mt-2 text-xs', splitTotal === 100 ? 'text-muted-foreground' : 'text-[var(--spend-warn)] font-medium')} aria-live="polite">
                  {splitTotal === 100 ? 'Adds up to 100%.' : `Adds up to ${splitTotal}%, needs to be 100%.`}
                </p>
              </Section>

              <Section title="Which bucket does each category belong to?" hint="Change anything that doesn't fit your life, e.g. if cabs are how you get to work, make them a need.">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{customCount ? `${customCount} change${customCount === 1 ? '' : 's'} from the defaults` : 'Using the defaults'}</span>
                  {customCount > 0 && (
                    <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setOverrides({})}>
                      <RotateCcw className="size-3" /> Reset all
                    </button>
                  )}
                </div>
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {options.categories.map((c) => {
                    const catBucket = overrides[c.id] ?? c.defaultBucket
                    const isOpen = expanded === c.id
                    const subCustom = c.subcategories.some((s) => overrides[s.key])
                    return (
                      <li key={c.id} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : c.id)}
                            className="min-w-0 flex-1 flex items-center gap-1 text-left text-sm text-foreground">
                            <ChevronDown className={cn('size-3.5 text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-180')} aria-hidden />
                            <span className="truncate">{c.label}</span>
                            {subCustom && <span className="text-[10px] text-muted-foreground shrink-0">· split</span>}
                          </button>
                          <BucketSelect value={catBucket} label={c.label} isCustom={Boolean(overrides[c.id])}
                            onChange={(b) => setCategoryBucket(c.id, c.defaultBucket, b)} />
                        </div>
                        {isOpen && (
                          <ul className="mt-2 mb-1 ml-5 space-y-1.5">
                            {c.subcategories.map((s) => {
                              // Without its own override a subcategory follows the category choice, else its default
                              const inherited = overrides[c.id] ?? s.defaultBucket
                              const value = overrides[s.key] ?? inherited
                              return (
                                <li key={s.key} className="flex items-center justify-between gap-2">
                                  <span className="text-xs text-muted-foreground truncate">{s.name}</span>
                                  <BucketSelect value={value} label={`${c.label}: ${s.name}`} isCustom={Boolean(overrides[s.key])}
                                    onChange={(b) => setSubBucket(s.key, inherited, b)} />
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </Section>
            </>
          )}
        </div>

        <div className="border-t border-border px-5 sm:px-6 py-3 flex flex-col gap-2">
          {saveError && <p role="alert" className="text-xs text-[var(--tone-danger-fg)]">{saveError}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" className={pillBtn} onClick={() => onOpenChange(false)} disabled={saving}>Cancel</button>
            <button type="button" className={primaryBtn} onClick={save} disabled={saving || !options}>
              {saving && <Loader2 className="size-4 animate-spin" />} Save my needs
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
