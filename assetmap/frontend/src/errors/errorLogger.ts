import { AppError } from './AppError'

interface LogPayload {
  error:     Error | AppError | unknown
  context?:  string
  userId?:   string
  url?:      string
  extra?:    Record<string, any>
}

export const errorLogger = {

  log(payload: LogPayload): void {
    const { error, context, userId, url, extra } = payload

    const isAppError = error instanceof AppError

    const log = {
      timestamp:  new Date().toISOString(),
      context:    context ?? 'unknown',
      userId,
      // Origin + path only: query strings and fragments can carry tokens or PII
      url:        (url ?? `${window.location.origin}${window.location.pathname}`).split(/[?#]/)[0],
      errorCode:  isAppError ? error.code : 'JS_ERROR',
      category:   isAppError ? error.category : 'client',
      severity:   isAppError ? error.severity : 'error',
      message:    error instanceof Error ? error.message : String(error),
      stack:      error instanceof Error ? error.stack : undefined,
      extra,
    }

    // Always log to console in dev
    if (import.meta.env.DEV) {
      console.group(`[AssetMap Error] ${log.errorCode}`)
      console.error('Message:', log.message)
      console.info('Context:', log.context)
      if (log.extra) console.info('Extra:', log.extra)
      console.groupEnd()
    }

    // Send to backend error tracking
    if (import.meta.env.PROD) {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/logs/frontend`, {
        method:  'POST',
        headers: { 'Content-Type':'application/json' },
        body:    JSON.stringify(log),
        keepalive:true,
      }).catch(() => {})
    }
  },

  warn(message: string, context?: string): void {
    if (import.meta.env.DEV) {
      console.warn(`[AssetMap Warning] ${context ?? ''}: ${message}`)
    }
  }
}
