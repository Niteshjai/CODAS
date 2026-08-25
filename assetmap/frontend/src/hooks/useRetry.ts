import { useState, useCallback, useEffect } from 'react'

interface RetryOptions {
  maxAttempts:    number
  initialDelayMs: number
  backoffFactor:  number   // multiply delay by this each attempt
  maxDelayMs:     number
  onRetry?:       (attempt: number, delay: number) => void
}

interface RetryState {
  attempt:      number
  nextRetryIn:  number   // seconds countdown
  isRetrying:   boolean
  hasExhausted: boolean
}

export function useRetry(
  fn:      () => Promise<any>,
  options: RetryOptions = {
    maxAttempts:    4,
    initialDelayMs: 1000,
    backoffFactor:  2,
    maxDelayMs:     30000,
  }
): RetryState & { retry: () => void; reset: () => void } {
  const [attempt,    setAttempt]    = useState(0)
  const [countdown,  setCountdown]  = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const retry = useCallback(() => {
    const nextAttempt = attempt + 1
    if (nextAttempt > options.maxAttempts) return

    const delay = Math.min(
      options.initialDelayMs * Math.pow(options.backoffFactor, attempt),
      options.maxDelayMs
    )
    const delaySec = Math.ceil(delay / 1000)

    options.onRetry?.(nextAttempt, delaySec)
    setIsRetrying(true)
    setCountdown(delaySec)

    // Countdown display
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)

    setTimeout(async () => {
      setAttempt(nextAttempt)
      setIsRetrying(false)
      try {
        await fn()
      } catch {
        // Error handled by parent
      }
    }, delay)
  }, [attempt, fn, options])

  const reset = useCallback(() => {
    setAttempt(0)
    setCountdown(0)
    setIsRetrying(false)
  }, [])

  return {
    attempt,
    nextRetryIn:  countdown,
    isRetrying,
    hasExhausted: attempt >= options.maxAttempts,
    retry,
    reset,
  }
}
