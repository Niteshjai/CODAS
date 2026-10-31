import { useEffect, useState } from 'react'
import { WifiOff, CloudOff, Gauge, RefreshCw, X } from 'lucide-react'
import { useNetworkStore } from '../../store/networkStore'

function formatDuration(since: Date | null, now: number): string | null {
  if (!since) return null
  const seconds = Math.floor((now - since.getTime()) / 1000)
  if (seconds < 10) return null
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes} min`
}

/**
 * Sticky connectivity bar:
 *   offline     → device has no network
 *   unreachable → network up but AssetMap can't be reached (auto-retrying with backoff)
 *   slow        → requests succeed but slowly (dismissible)
 */
export function OfflineBanner() {
  const { isOnline, serverReachable, isSlow, offlineSince, checking, checkConnectivity } = useNetworkStore()
  const [now, setNow] = useState(() => Date.now())
  const [slowDismissed, setSlowDismissed] = useState(false)

  const isDown = !isOnline || !serverReachable

  // Keep the "offline for …" counter live while a problem is shown
  useEffect(() => {
    if (!isDown) return
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(t)
  }, [isDown])

  // A new slow spell after recovering should be announced again
  useEffect(() => { if (!isSlow) setSlowDismissed(false) }, [isSlow])

  if (!isDown && (!isSlow || slowDismissed)) return null

  const duration = formatDuration(offlineSince, now)

  const variant = !isOnline
    ? {
        Icon: WifiOff,
        title: 'No internet connection',
        body: 'Check your Wi-Fi or mobile data. We’ll reconnect automatically.',
        tone: 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/80 dark:text-amber-100',
      }
    : !serverReachable
    ? {
        Icon: CloudOff,
        title: 'Can’t reach AssetMap',
        body: 'Your connection may be unstable. Retrying automatically…',
        tone: 'border-orange-300 bg-orange-50 text-orange-950 dark:border-orange-500/40 dark:bg-orange-950/80 dark:text-orange-100',
      }
    : {
        Icon: Gauge,
        title: 'Slow connection',
        body: 'Things may take a little longer to load.',
        tone: 'border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-950/80 dark:text-sky-100',
      }

  const { Icon } = variant

  return (
    <div
      role={isDown ? 'alert' : 'status'}
      aria-live={isDown ? 'assertive' : 'polite'}
      className={`sticky top-0 z-[200] flex items-center justify-center gap-3 border-b px-4 py-2.5 text-[13px] backdrop-blur ${variant.tone}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0">
        <strong className="font-semibold">{variant.title}</strong>
        {isDown && duration && <span className="opacity-75"> · {duration}</span>}
        <span className="hidden sm:inline"> — {variant.body}</span>
      </p>

      {isOnline && !serverReachable && (
        <button
          type="button"
          onClick={() => void checkConnectivity()}
          disabled={checking}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-current/30 px-3 py-1 font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} aria-hidden="true" />
          {checking ? 'Checking…' : 'Retry now'}
        </button>
      )}

      {!isDown && (
        <button
          type="button"
          onClick={() => setSlowDismissed(true)}
          aria-label="Dismiss slow connection notice"
          className="shrink-0 rounded-full p-1 transition-opacity hover:opacity-70"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
