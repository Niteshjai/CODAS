import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '../../services/api'
import { ErrorCard, userFacingMessage } from '../errors/ErrorCard'
import { ListSkeleton } from '../loading/ListSkeleton'
import { useSpendStore, categoryById } from '../../store/spendStore'
import { rupees, shortDate } from './format'
import { EmptyBlock, Panel, SourceBadge, pillBtn, primaryBtn } from './SpendUi'
import RecategoriseDialog, { describeSaved, hasRealMerchant } from './RecategoriseDialog'
import type { CorrectionResult, ReviewItem } from './types'

const PAGE = 25

function ReviewCard({ item, onChoose, onConfirmed }: { item: ReviewItem; onChoose: () => void; onConfirmed: () => void }) {
  const categories = useSpendStore((s) => s.categories)
  const invalidate = useSpendStore((s) => s.invalidate)
  const markChanged = useSpendStore((s) => s.markChanged)
  const suggested = categoryById(categories, item.suggestedCategory)
  const merchant = hasRealMerchant(item.merchantName) ? item.merchantName! : null
  const [applyAll, setApplyAll] = useState(item.sameMerchantCount > 0)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      const body: Record<string, unknown> = { category: item.suggestedCategory, applyToMerchant: Boolean(merchant) && applyAll }
      if (item.suggestedSubcategory) body.subcategory = item.suggestedSubcategory
      const res = await api.post(`/spend/review/${item.id}`, body)
      toast.success(describeSaved(res.data.data as CorrectionResult, suggested?.label ?? item.categoryLabel))
      onConfirmed()
      markChanged()
      invalidate()
    } catch (err) {
      toast.error(userFacingMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-sm" data-tx-id={item.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{merchant ?? 'Unrecognised payee'}</p>
          <p className="text-xs text-muted-foreground">
            {item.type === 'debit' ? 'Paid' : 'Received'} on {shortDate(item.date, new Date().getFullYear())}{item.mode ? ` · ${item.mode}` : ''}{item.bankName ? ` · ${item.bankName}` : ''}
          </p>
        </div>
        <p className={cn('shrink-0 text-base font-semibold tabular', item.type === 'credit' ? 'text-[var(--spend-good)]' : 'text-foreground')}>
          {item.type === 'credit' ? '+' : '−'}{rupees(item.amountPaise)}
        </p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground font-mono break-words">{item.narration}</p>
      {item.reviewReason && <p className="mt-2 text-sm text-foreground">{item.reviewReason}</p>}

      <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
        Our best guess:
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground">
          <span aria-hidden>{suggested?.emoji ?? '🏷️'}</span> {suggested?.label ?? item.categoryLabel}
          {item.suggestedSubcategory && <span className="text-muted-foreground">· {item.suggestedSubcategory}</span>}
        </span>
        <SourceBadge by={item.classifiedBy} confidence={item.confidence} needsReview reason={item.reason} />
      </div>

      {merchant && item.sameMerchantCount > 0 && (
        <label className="mt-3 flex items-center gap-2 text-xs text-foreground cursor-pointer">
          <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="size-4 accent-[var(--foreground)]" />
          Also apply to {item.sameMerchantCount} other transaction{item.sameMerchantCount === 1 ? '' : 's'} from {merchant}
        </label>
      )}

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <button type="button" className={primaryBtn} onClick={confirm} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Yes, it's {suggested?.label ?? item.categoryLabel}
        </button>
        <button type="button" className={pillBtn} onClick={onChoose} disabled={busy}>Choose another category</button>
      </div>
    </li>
  )
}

export default function ReviewTab() {
  const revision = useSpendStore((s) => s.revision)
  const [data, setData] = useState<{ items: ReviewItem[]; total: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [error, setError] = useState<unknown>(null)
  const [nonce, setNonce] = useState(0)
  const [editing, setEditing] = useState<ReviewItem | null>(null)

  useEffect(() => {
    let live = true
    setError(null)
    api.get('/spend/review', { params: { limit: String(PAGE), offset: String(offset) } })
      .then((res) => {
        if (!live) return
        const d = res.data.data as { items: ReviewItem[]; total: number }
        // Resolving the last item on a later page: step back a page instead of showing nothing
        if (d.items.length === 0 && offset > 0) setOffset(Math.max(0, offset - PAGE))
        else setData(d)
      })
      .catch((err) => { if (live) setError(err) })
    return () => { live = false }
  }, [offset, revision, nonce])

  const removeLocal = (id: string) =>
    setData((d) => (d ? { items: d.items.filter((i) => i.id !== id), total: Math.max(0, d.total - 1) } : d))

  return (
    <div className="space-y-3">
      <Panel
        title="Needs your review"
        subtitle="When we're less than 70% sure, we ask you instead of guessing. Each answer teaches the analyser for next time."
      >
        {error && !data ? (
          <ErrorCard compact error={error} title="We couldn't load the review queue" onRetry={() => setNonce((n) => n + 1)} />
        ) : !data ? (
          <ListSkeleton rows={3} />
        ) : data.items.length === 0 ? (
          <EmptyBlock
            icon={<CheckCircle2 className="size-7 text-[var(--spend-good)]" />}
            title="All caught up"
            body="Every transaction has a category we're confident about. New uncertain ones will show up here."
          />
        ) : (
          <p className="text-sm text-foreground"><span className="font-semibold">{data.total}</span> transaction{data.total === 1 ? '' : 's'} to check, largest first.</p>
        )}
      </Panel>

      {data && data.items.length > 0 && (
        <ul className="space-y-3">
          {data.items.map((item) => (
            <ReviewCard key={item.id} item={item} onChoose={() => setEditing(item)} onConfirmed={() => removeLocal(item.id)} />
          ))}
        </ul>
      )}

      {data && data.total > PAGE && (
        <div className="flex items-center justify-center gap-3">
          <button type="button" className={pillBtn} disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Previous</button>
          <span className="text-xs text-muted-foreground">{offset + 1}–{Math.min(offset + PAGE, data.total)} of {data.total}</span>
          <button type="button" className={pillBtn} disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>Next</button>
        </div>
      )}

      <RecategoriseDialog
        tx={editing}
        via="review"
        sameMerchantCount={editing?.sameMerchantCount}
        initialCategory={editing?.suggestedCategory}
        onClose={() => setEditing(null)}
        onSaved={() => { if (editing) removeLocal(editing.id) }}
      />
    </div>
  )
}
