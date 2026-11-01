import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SOURCE_BADGE } from './format'
import type { ClassifiedBy, SpendCategory } from './types'

export const pillBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-3.5 h-9 text-sm font-medium text-foreground ' +
  'shadow-sm transition hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-full bg-foreground px-4 h-9 text-sm font-semibold text-background ' +
  'shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

export const inputCls =
  'w-full rounded-xl border border-border bg-card px-3 h-10 text-sm text-foreground placeholder:text-muted-foreground ' +
  'outline-none transition focus:border-foreground focus:ring-1 focus:ring-foreground'

export function Panel({ title, subtitle, action, children, className, id }: {
  title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string
}) {
  return (
    <section id={id} className={cn('bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-sm min-w-0', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function SourceBadge({ by, confidence, needsReview, reason }: {
  by: ClassifiedBy | null; confidence: number | null; needsReview?: boolean; reason?: string | null
}) {
  if (!by) return null
  const b = SOURCE_BADGE[by]
  const showConf = by !== 'user' && confidence != null
  return (
    <span
      // The backend's own reason (e.g. "Known merchant: Uber") says exactly how this row was categorised
      title={`${reason?.trim() || b.title}${showConf ? ` — ${confidence}% confident` : ''}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[10px] font-semibold leading-4 whitespace-nowrap',
        by === 'claude_ai' ? 'border-[var(--spend-ai)]/40 text-[var(--spend-ai)]'
          : by === 'user' ? 'border-foreground/30 text-foreground'
          : 'border-border text-muted-foreground',
      )}
    >
      {b.label}
      {showConf && <span className={cn('font-normal', needsReview ? 'text-[var(--spend-warn)]' : 'opacity-80')}>{confidence}%</span>}
    </span>
  )
}

export function CategoryPill({ category, label, subcategory, cat, onClick, className }: {
  category: string; label: string; subcategory?: string | null; cat?: SpendCategory; onClick?: () => void; className?: string
}) {
  const content = (
    <>
      <span aria-hidden>{cat?.emoji ?? '🏷️'}</span>
      <span className="truncate">{label}{subcategory ? <span className="text-muted-foreground"> · {subcategory}</span> : null}</span>
    </>
  )
  const cls = cn(
    'inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground min-w-0',
    onClick && 'cursor-pointer hover:ring-1 hover:ring-foreground/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    className,
  )
  return onClick
    ? <button type="button" onClick={onClick} className={cls} aria-label={`Category: ${label}${subcategory ? `, ${subcategory}` : ''}. Change category`} data-category={category}>{content}</button>
    : <span className={cls} data-category={category}>{content}</span>
}

export function EmptyBlock({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {body && <p className="text-sm text-muted-foreground mt-1 max-w-[28rem]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Thin horizontal meter. `pct` may exceed 100 (rendered full with an over colour). */
export function Meter({ pct, color, label, marker }: { pct: number; color: string; label: string; marker?: number }) {
  const w = Math.max(0, Math.min(100, pct))
  return (
    <div className="relative h-2 rounded-full bg-[var(--spend-track)]" role="img" aria-label={label}>
      <div className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${w}%`, background: color, minWidth: pct > 0 ? 4 : 0 }} />
      {marker != null && (
        <div
          className="absolute -top-1 -bottom-1 w-0.5 rounded-full bg-[var(--spend-target)]"
          style={{ left: `calc(${Math.max(0, Math.min(100, marker))}% - 1px)` }}
          aria-hidden
        />
      )}
    </div>
  )
}
