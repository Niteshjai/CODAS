import { CloudOff, Lock, RefreshCw, SearchX, ServerCrash, Sparkles, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react'
import { AppError, type ErrorCategory } from '../../errors/AppError'

interface Props {
  error:      unknown
  onRetry?:   () => void
  isRetrying?:boolean
  compact?:   boolean
  title?:     string   // e.g. "Couldn't load your assets"
}

/** Message safe to show users: api.ts errors are AppErrors with sanitised copy; anything else is generic. */
export function userFacingMessage(error: unknown): string {
  if (error instanceof AppError) return error.userMessage
  return 'Something went wrong. Please try again.'
}

type Tone = 'danger' | 'warning' | 'info'

// Icon + accent per failure kind, so a dropped connection doesn't look like a server crash.
const LOOK: Record<ErrorCategory, { icon: LucideIcon; tone: Tone; hint: string }> = {
  network:    { icon: WifiOff,       tone: 'warning', hint: 'Check your internet connection, then try again.' },
  server:     { icon: ServerCrash,   tone: 'danger',  hint: "This is on us, not you. Your data is safe — try again in a moment." },
  not_found:  { icon: SearchX,       tone: 'info',    hint: 'It may have been removed or the link is out of date.' },
  auth:       { icon: Lock,          tone: 'info',    hint: 'Sign in again to continue.' },
  plan:       { icon: Sparkles,      tone: 'info',    hint: 'Upgrade your plan to unlock this.' },
  validation: { icon: TriangleAlert, tone: 'warning', hint: 'Please check the details and try again.' },
  client:     { icon: TriangleAlert, tone: 'danger',  hint: 'Reloading usually fixes this.' },
  unknown:    { icon: CloudOff,      tone: 'danger',  hint: 'Please try again in a moment.' },
}

const toneVars = (tone: Tone) => ({
  bg:     `var(--tone-${tone}-bg)`,
  fg:     `var(--tone-${tone}-fg)`,
  border: `var(--tone-${tone}-border)`,
})

export function ErrorCard({ error, onRetry, isRetrying = false, compact = false, title }: Props) {
  const category: ErrorCategory = error instanceof AppError ? error.category : 'unknown'
  const look = LOOK[category] ?? LOOK.unknown
  const Icon = look.icon
  const tone = toneVars(look.tone)
  const status = error instanceof AppError ? error.statusCode : undefined

  const heading = title ?? userFacingMessage(error)
  // With a title, the sanitised message becomes the explanation; otherwise fall back to the category hint.
  const detail = title ? userFacingMessage(error) : look.hint

  const retryButton = onRetry && (
    <button
      type="button"
      onClick={onRetry}
      disabled={isRetrying}
      className={
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-foreground font-semibold text-background ' +
        'shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ' +
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
        (compact ? 'h-8 px-3.5 text-xs' : 'h-10 px-5 text-sm')
      }
    >
      <RefreshCw aria-hidden="true" className={`${compact ? 'size-3.5' : 'size-4'} ${isRetrying ? 'motion-safe:animate-spin' : ''}`} />
      {isRetrying ? 'Retrying…' : 'Try again'}
    </button>
  )

  if (compact) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm"
        style={{ borderLeft: `3px solid ${tone.border}` }}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: tone.bg, color: tone.fg }}
        >
          <Icon className="size-4.5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{heading}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
        {retryButton}
      </div>
    )
  }

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12"
    >
      {/* soft tinted glow behind the icon, theme-aware through the tone tokens */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${tone.bg} 0%, transparent 100%)` }}
      />

      <div className="relative mx-auto flex max-w-[26rem] flex-col items-center">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-2xl border"
          style={{
            background:  tone.bg,
            color:       tone.fg,
            borderColor: tone.border,
            boxShadow:   `0 0 0 6px color-mix(in oklab, ${tone.bg} 55%, transparent)`,
          }}
        >
          <Icon className="size-6" strokeWidth={1.9} />
        </span>

        <h4 className="mt-5 text-base font-semibold tracking-tight text-foreground text-balance sm:text-lg">
          {heading}
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-balance">
          {detail}
        </p>

        {retryButton && <div className="mt-6">{retryButton}</div>}

        {status ? (
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 tabular-nums">
            Error {status}
          </p>
        ) : null}
      </div>
    </div>
  )
}
