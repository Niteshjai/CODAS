export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'
export type ErrorCategory =
  | 'network'      // no internet, timeout
  | 'auth'         // 401, 403, session expired
  | 'plan'         // 402, feature gate
  | 'validation'   // 400, bad input
  | 'not_found'    // 404
  | 'server'       // 5xx
  | 'client'       // React crash, JS error
  | 'unknown'      // anything else

export class AppError extends Error {
  public readonly code:       string
  public readonly category:   ErrorCategory
  public readonly severity:   ErrorSeverity
  public readonly statusCode: number | null
  public readonly isRetryable:boolean
  public readonly userMessage:string
  public readonly detail?:    Record<string, any>
  public readonly timestamp:  Date

  constructor(params: {
    message:     string
    code:        string
    category:    ErrorCategory
    severity?:   ErrorSeverity
    statusCode?: number
    isRetryable?:boolean
    userMessage?:string
    detail?:     Record<string, any>
  }) {
    super(params.message)
    this.name         = 'AppError'
    this.code         = params.code
    this.category     = params.category
    this.severity     = params.severity     ?? 'error'
    this.statusCode   = params.statusCode   ?? null
    this.isRetryable  = params.isRetryable  ?? false
    this.userMessage  = params.userMessage  ?? params.message
    this.detail       = params.detail
    this.timestamp    = new Date()
  }

  // Quick constructors
  static network(detail?: string): AppError {
    return new AppError({
      message:    'Network request failed',
      code:       'NETWORK_ERROR',
      category:   'network',
      severity:   'warning',
      isRetryable:true,
      userMessage:detail ?? 'Check your internet connection and try again.',
    })
  }

  static timeout(): AppError {
    return new AppError({
      message:    'Request timed out',
      code:       'TIMEOUT',
      category:   'network',
      severity:   'warning',
      isRetryable:true,
      userMessage:'The server took too long to respond. Try again.',
    })
  }

  static unauthorized(): AppError {
    return new AppError({
      message:    'Session expired',
      code:       'UNAUTHORIZED',
      category:   'auth',
      severity:   'warning',
      statusCode: 401,
      isRetryable:false,
      userMessage:'Your session has expired. Please log in again.',
    })
  }

  static planGate(feature: string, requiredPlan: string): AppError {
    return new AppError({
      message:    `Feature requires ${requiredPlan} plan`,
      code:       'PLAN_GATE',
      category:   'plan',
      severity:   'info',
      statusCode: 402,
      isRetryable:false,
      userMessage:`This feature requires the ${requiredPlan} plan.`,
      detail:     { feature, requiredPlan },
    })
  }

  static server(statusCode: number): AppError {
    return new AppError({
      message:    `Server error ${statusCode}`,
      code:       'SERVER_ERROR',
      category:   'server',
      severity:   'error',
      statusCode,
      isRetryable:statusCode >= 500 && statusCode < 600,
      userMessage:'Something went wrong on our end. We\'ve been notified.',
    })
  }

  static unknown(originalError?: unknown): AppError {
    return new AppError({
      message:    'An unexpected error occurred',
      code:       'UNKNOWN',
      category:   'unknown',
      severity:   'error',
      isRetryable:true,
      userMessage:'Something went wrong. Please try again.',
      detail:     originalError instanceof Error
        ? { originalMessage: originalError.message }
        : undefined,
    })
  }
}
