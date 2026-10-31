import { AppError } from '../../errors/AppError'
import { RetryButton } from '../feedback/RetryButton'

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

export function ErrorCard({ error, onRetry, isRetrying = false, compact = false, title }: Props) {
  const isNetwork = error instanceof AppError && error.category === 'network'
  const heading = title ?? userFacingMessage(error)
  const detail = title
    ? userFacingMessage(error)
    : isNetwork
      ? 'Check your connection and try again.'
      : 'Please try again in a moment.'

  return (
    <div
      role="alert"
      style={{
        padding:      compact ? 16 : 24,
        background:   'var(--tone-danger-bg)',
        border:       '1px solid var(--tone-danger-border)',
        borderRadius: 12,
        display:      'flex',
        flexDirection:compact ? 'row' : 'column',
        alignItems:   compact ? 'center' : 'flex-start',
        gap:          compact ? 16 : 12,
        textAlign:    'left'
      }}
    >
      <div aria-hidden="true" style={{ fontSize: compact ? 20 : 28, lineHeight: 1 }}>
        {isNetwork ? '📡' : '⚠️'}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{
          fontSize:  14,
          fontWeight:600,
          color:     'var(--tone-danger-fg)',
          marginBottom:4
        }}>
          {heading}
        </h4>
        {!compact && (
          <p style={{ fontSize:13, color:'var(--tone-danger-fg)', opacity:0.85, lineHeight:1.4 }}>
            {detail}
          </p>
        )}
      </div>

      {onRetry && (
        <RetryButton
          onClick={onRetry}
          isRetrying={isRetrying}
          style={{
            background:'var(--tone-danger-fg)',
            color:'var(--card)',
            border:'none',
            padding:'8px 16px',
            borderRadius:6,
            fontSize:13,
            fontWeight:500,
          }}
        />
      )}
    </div>
  )
}
