import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { api } from '../../services/api'
import { userFacingMessage } from '../errors/ErrorCard'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Switch } from '../ui/switch'
import { cn } from '@/lib/utils'
import { useSpendStore } from '../../store/spendStore'
import { rupees, shortDate } from './format'
import { primaryBtn, pillBtn } from './SpendUi'
import type { CorrectionResult, SpendTx } from './types'

interface Props {
  tx: SpendTx | null
  /** How many other uncorrected rows share this merchant (review queue knows; otherwise unknown). */
  sameMerchantCount?: number
  /** Review items post to /review/:id; everything else patches the transaction. */
  via?: 'transactions' | 'review'
  initialCategory?: string
  onClose: () => void
  onSaved?: (result: CorrectionResult) => void
}

export function hasRealMerchant(name: string | null | undefined) {
  return Boolean(name && name.trim() && name.trim().toUpperCase() !== 'UNKNOWN')
}

export function describeSaved(r: CorrectionResult, label: string) {
  const parts = [`Saved as ${label}.`]
  if (r.rememberedForMerchant && hasRealMerchant(r.merchantName)) parts.push(`We'll use this for ${r.merchantName} from now on.`)
  if (r.updatedOtherTransactions > 0) parts.push(`Updated ${r.updatedOtherTransactions} other transaction${r.updatedOtherTransactions === 1 ? '' : 's'}.`)
  return parts.join(' ')
}

export default function RecategoriseDialog({ tx, sameMerchantCount, via = 'transactions', initialCategory, onClose, onSaved }: Props) {
  const categories = useSpendStore((s) => s.categories)
  const invalidate = useSpendStore((s) => s.invalidate)
  const markChanged = useSpendStore((s) => s.markChanged)
  const [category, setCategory] = useState<string>('')
  const [subcategory, setSubcategory] = useState<string | null>(null)
  const [applyToMerchant, setApplyToMerchant] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tx) return
    const start = initialCategory ?? tx.category
    setCategory(start)
    setSubcategory(start === tx.category ? tx.subcategory : null)
    setApplyToMerchant(hasRealMerchant(tx.merchantName) && (sameMerchantCount ?? 0) > 0)
    setNotes(tx.notes ?? '')
    setError(null)
  }, [tx, initialCategory, sameMerchantCount])

  // Only categories that fit the money direction (the API rejects e.g. Salary on a debit)
  const options = useMemo(() => {
    if (!tx) return []
    return categories.filter((c) => (tx.type === 'debit' ? c.group !== 'revenue' : c.group !== 'expense'))
  }, [categories, tx])
  const selected = options.find((c) => c.id === category)

  const save = async () => {
    if (!tx || !category) return
    setSaving(true)
    setError(null)
    const body: Record<string, unknown> = { category, applyToMerchant }
    if (subcategory) body.subcategory = subcategory
    // A cleared note is sent as null so the saved one is removed (omitting it keeps the old note)
    if (notes.trim()) body.notes = notes.trim().slice(0, 500)
    else if (tx.notes) body.notes = null
    try {
      const res = via === 'review'
        ? await api.post(`/spend/review/${tx.id}`, body)
        : await api.patch(`/spend/transactions/${tx.id}/category`, body)
      const result = res.data.data as CorrectionResult
      toast.success(describeSaved(result, selected?.label ?? category))
      markChanged()
      invalidate()
      onSaved?.(result)
      onClose()
    } catch (err) {
      setError(userFacingMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const merchant = tx && hasRealMerchant(tx.merchantName) ? tx.merchantName! : null

  return (
    <Dialog open={!!tx} onOpenChange={(o) => { if (!o && !saving) onClose() }}>
      <DialogContent className="spend-viz max-w-[34rem] w-[calc(100vw-2rem)] max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-card border-border p-5 sm:p-6">
        {tx && (
          <>
            <DialogHeader className="pr-8">
              <DialogTitle className="text-foreground">Change category</DialogTitle>
              <DialogDescription>
                {merchant ?? 'This transaction'} · {tx.type === 'debit' ? 'paid' : 'received'} {rupees(tx.amountPaise)} on {shortDate(tx.date, new Date().getFullYear())}
              </DialogDescription>
            </DialogHeader>

            <p className="text-xs text-muted-foreground break-words rounded-lg bg-muted px-3 py-2 font-mono">{tx.narration}</p>

            <fieldset>
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5" role="radiogroup" aria-label="Category">
                {options.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={category === c.id}
                    onClick={() => { setCategory(c.id); setSubcategory(null) }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition min-w-0',
                      category === c.id ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:bg-muted',
                    )}
                  >
                    <span aria-hidden>{c.emoji}</span><span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {selected && selected.subcategories.length > 1 && (
              <fieldset>
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Type <span className="normal-case font-normal">(optional)</span></legend>
                <div className="flex flex-wrap gap-1.5">
                  {selected.subcategories.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={subcategory === s}
                      onClick={() => setSubcategory(subcategory === s ? null : s)}
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-medium transition',
                        subcategory === s ? 'border-foreground bg-foreground text-background' : 'border-border text-foreground hover:bg-muted',
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {merchant && (
              <label className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 cursor-pointer">
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">Apply to all from {merchant}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    {sameMerchantCount != null && sameMerchantCount > 0
                      ? `Also updates ${sameMerchantCount} other transaction${sameMerchantCount === 1 ? '' : 's'} you haven't changed yourself.`
                      : 'Also updates your other transactions from this merchant that you haven\'t changed yourself.'}
                    {' '}Either way, we remember your choice for future payments.
                  </span>
                </span>
                <Switch checked={applyToMerchant} onCheckedChange={setApplyToMerchant} aria-label={`Apply to all from ${merchant}`} />
              </label>
            )}

            <div>
              <label htmlFor="spend-note" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Note <span className="normal-case font-normal">(optional, only you see this)</span></label>
              <textarea
                id="spend-note"
                value={notes}
                maxLength={500}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="e.g. October rent to landlord"
                className="mt-1.5 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground focus:ring-1 focus:ring-foreground resize-none"
              />
            </div>

            {error && <p role="alert" className="text-sm text-[var(--tone-danger-fg)] bg-[var(--tone-danger-bg)] border border-[var(--tone-danger-border)] rounded-lg px-3 py-2">{error}</p>}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
              <button type="button" className={pillBtn} onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className={primaryBtn} onClick={save} disabled={saving || !category}>
                {saving && <Loader2 className="size-4 animate-spin" />} Save category
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
