import { AppError }        from '../errors/AppError'
import { getErrorMessage } from '../errors/errorMessages'
import { errorLogger }     from '../errors/errorLogger'
import { useToastStore }   from '../store/toastStore'

const API_TIMEOUT_MS = 30000   // 30 seconds

interface RequestOptions extends RequestInit {
  timeout?:        number
  silent?:         boolean   // don't show toast on error
  retries?:        number    // auto-retry on network error
  context?:        string    // for error logging
}

export async function apiRequest<T = any>(
  url:     string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    timeout   = API_TIMEOUT_MS,
    silent    = false,
    retries   = 0,
    context   = url,
    ...fetchOptions
  } = options

  // Check network before attempting
  if (!navigator.onLine) {
    const error = AppError.network('You are offline')
    if (!silent) {
      useToastStore.getState().add({
        type:    'error',
        title:   'No internet connection',
        message: 'Check your connection and try again.',
      })
    }
    throw error
  }

  // Merge default headers
  const headers = new Headers(fetchOptions.headers)
  if (!headers.has('Content-Type') && fetchOptions.body) {
    headers.set('Content-Type', 'application/json')
  }

  // Add JWT from localStorage
  const token = localStorage.getItem('access_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  // Abort controller for timeout
  const controller  = new AbortController()
  const timeoutId   = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Capture rotated tokens from response headers
    const newAccessToken = response.headers.get('x-access-token')
    if (newAccessToken) {
      localStorage.setItem('access_token', newAccessToken)
    }
    const newRefreshToken = response.headers.get('x-refresh-token')
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken)
    }

    return await handleResponse<T>(response, silent, context)

  } catch (err) {
    clearTimeout(timeoutId)

    // Handle abort (timeout)
    if (err instanceof DOMException && err.name === 'AbortError') {
      const error = AppError.timeout()
      errorLogger.log({ error, context })
      if (!silent) {
        useToastStore.getState().add({
          type:    'error',
          title:   'Request timed out',
          message: 'The server is taking too long. Try again.',
        })
      }
      throw error
    }

    // Handle network failure
    if (err instanceof TypeError && err.message.includes('fetch')) {
      const error = AppError.network()

      if (!silent) {
        useToastStore.getState().add({
          type:    'error',
          title:   'Connection failed',
          message: 'Check your internet and try again.',
        })
      }

      // Auto-retry if requested
      if (retries > 0) {
        await sleep(1000)
        return apiRequest<T>(url, { ...options, retries: retries - 1 })
      }

      throw error
    }

    // Re-throw AppErrors as-is
    if (err instanceof AppError) throw err

    // Unknown error
    const error = AppError.unknown(err)
    errorLogger.log({ error, context })
    throw error
  }
}

async function handleResponse<T>(
  response: Response,
  silent:   boolean,
  context:  string
): Promise<T> {
  const toast = useToastStore.getState()

  // Parse body
  let body: any
  const contentType = response.headers.get('content-type')
  try {
    if (contentType?.includes('application/json')) {
      body = await response.json()
    } else {
      body = await response.text()
    }
  } catch {
    body = null
  }

  // 200–299 — success
  if (response.ok) {
    return body as T
  }

  // Error responses
  const errorCode = body?.error?.code ?? codeFromStatus(response.status)
  const apiMessage = body?.error?.message

  switch (response.status) {

    case 401: {
      // Session expired — clear token and redirect
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      if (!silent) {
        toast.add({
          type:    'warning',
          title:   'Session expired',
          message: 'Signing you out. Please log in again.',
        })
      }
      setTimeout(() => { window.location.href = '/' }, 1500)
      throw AppError.unauthorized()
    }

    case 402: {
      // Plan gate — dispatch event for PlanGateModal
      const detail = body?.error ?? {}
      if (errorCode === 'PLAN_GATE' || errorCode === 'FEATURE_NOT_IN_PLAN') {
        window.dispatchEvent(new CustomEvent('plan-gate', { detail }))
        throw AppError.planGate(detail.feature, detail.requiredPlan ?? 'Plus')
      }
      // Usage limit
      if (errorCode === 'USAGE_LIMIT_REACHED') {
        window.dispatchEvent(new CustomEvent('usage-limit', { detail }))
      }
      // Upgrade required (existing behavior)
      window.dispatchEvent(new CustomEvent('upgrade-required', {
        detail: { message: 'This feature is not available on your current plan.' }
      }))
      const msg = getErrorMessage(errorCode)
      if (!silent) {
        toast.add({ type:'warning', title:msg.title, message:msg.body })
      }
      throw new AppError({
        message:     apiMessage ?? msg.body,
        code:        errorCode,
        category:    'plan',
        statusCode:  402,
        isRetryable: false,
        userMessage: apiMessage ?? msg.body,
        detail:      body?.error,
      })
    }

    case 403: {
      if (errorCode === 'TWO_FACTOR_REQUIRED') {
        window.location.href = '/settings/2fa'
        throw AppError.unauthorized()
      }
      const msg = getErrorMessage(errorCode)
      if (!silent) toast.add({ type:'error', title:msg.title, message:msg.body })
      throw new AppError({
        message:     apiMessage ?? msg.body,
        code:        errorCode,
        category:    'auth',
        statusCode:  403,
        isRetryable: false,
        userMessage: apiMessage ?? msg.body,
      })
    }

    case 404: {
      // 404s are usually handled inline — don't toast by default
      throw new AppError({
        message:     apiMessage ?? 'Not found',
        code:        errorCode ?? 'NOT_FOUND',
        category:    'not_found',
        statusCode:  404,
        isRetryable: false,
        userMessage: apiMessage ?? 'This item was not found.',
      })
    }

    case 422:
    case 400: {
      const msg = getErrorMessage(errorCode ?? 'VALIDATION_ERROR')
      if (!silent) {
        toast.add({
          type:    'warning',
          title:   msg.title,
          message: apiMessage ?? msg.body,
        })
      }
      throw new AppError({
        message:     apiMessage ?? 'Validation failed',
        code:        errorCode ?? 'VALIDATION_ERROR',
        category:    'validation',
        statusCode:  response.status,
        isRetryable: false,
        userMessage: apiMessage ?? msg.body,
        detail:      body?.error,
      })
    }

    case 429: {
      const msg = getErrorMessage('RATE_LIMIT')
      const retryAfter = response.headers.get('Retry-After')
      if (!silent) {
        toast.add({
          type:    'warning',
          title:   msg.title,
          message: retryAfter
            ? `Try again in ${retryAfter} seconds.`
            : msg.body,
        })
      }
      throw new AppError({
        message:     'Rate limited',
        code:        'RATE_LIMIT',
        category:    'network',
        statusCode:  429,
        isRetryable: true,
        userMessage: msg.body,
        detail:      { retryAfter },
      })
    }

    default: {
      // 500, 502, 503, 504 etc.
      if (response.status >= 500) {
        errorLogger.log({
          error:   new Error(`Server error ${response.status}`),
          context,
          extra:   { status: response.status, body },
        })
        const msg = getErrorMessage('SERVER_ERROR')
        if (!silent) {
          toast.add({
            type:      'error',
            title:     msg.title,
            message:   response.status === 503
              ? 'Service is temporarily unavailable.'
              : msg.body,
            duration:  8000,
          })
        }
        throw AppError.server(response.status)
      }

      const msg = getErrorMessage(errorCode ?? 'UNKNOWN')
      if (!silent) {
        toast.add({ type:'error', title:msg.title, message:msg.body })
      }
      throw new AppError({
        message:     apiMessage ?? 'Request failed',
        code:        errorCode ?? 'UNKNOWN',
        category:    'unknown',
        statusCode:  response.status,
        isRetryable: true,
        userMessage: apiMessage ?? msg.body,
      })
    }
  }
}

function codeFromStatus(status: number): string {
  if (status === 401) return 'UNAUTHENTICATED'
  if (status === 403) return 'UNAUTHORIZED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 429) return 'RATE_LIMIT'
  if (status >= 500)  return 'SERVER_ERROR'
  return 'UNKNOWN'
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Convenience wrappers
export const api = {
  get:    <T>(url: string, opts?: RequestOptions) =>
    apiRequest<T>(url, { ...opts, method:'GET' }),

  post:   <T>(url: string, body?: any, opts?: RequestOptions) =>
    apiRequest<T>(url, {
      ...opts, method:'POST',
      body: body ? JSON.stringify(body) : undefined
    }),

  patch:  <T>(url: string, body?: any, opts?: RequestOptions) =>
    apiRequest<T>(url, {
      ...opts, method:'PATCH',
      body: body ? JSON.stringify(body) : undefined
    }),

  put:    <T>(url: string, body?: any, opts?: RequestOptions) =>
    apiRequest<T>(url, {
      ...opts, method:'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),

  delete: <T>(url: string, opts?: RequestOptions) =>
    apiRequest<T>(url, { ...opts, method:'DELETE' }),
}
