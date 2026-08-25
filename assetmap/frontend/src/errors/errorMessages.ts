// Map every AssetMap API error code to a
// user-friendly message and suggested action

interface ErrorMessage {
  title:      string
  body:       string
  action?:    string
  actionUrl?: string
  isRetryable:boolean
  severity:   'info' | 'warning' | 'error'
}

export const ERROR_MESSAGES: Record<string, ErrorMessage> = {

  // ── Network
  NETWORK_ERROR: {
    title:       'No internet connection',
    body:        'Check your Wi-Fi or mobile data and try again.',
    action:      'Retry',
    isRetryable: true,
    severity:    'warning',
  },
  TIMEOUT: {
    title:       'Request timed out',
    body:        'The server is taking too long. Try again in a moment.',
    action:      'Retry',
    isRetryable: true,
    severity:    'warning',
  },
  OFFLINE: {
    title:       'You\'re offline',
    body:        'AssetMap needs an internet connection to fetch your financial data.',
    isRetryable: true,
    severity:    'warning',
  },

  // ── Authentication
  UNAUTHENTICATED: {
    title:       'Session expired',
    body:        'You\'ve been logged out. Please sign in again.',
    action:      'Sign in',
    actionUrl:   '/login',
    isRetryable: false,
    severity:    'warning',
  },
  UNAUTHORIZED: {
    title:       'Access denied',
    body:        'You don\'t have permission to do this.',
    isRetryable: false,
    severity:    'error',
  },
  TWO_FACTOR_REQUIRED: {
    title:       '2FA verification needed',
    body:        'Complete your 2-factor authentication to continue.',
    action:      'Verify',
    actionUrl:   '/auth/2fa-challenge',
    isRetryable: false,
    severity:    'info',
  },

  // ── Plan gates
  PLAN_GATE: {
    title:       'Upgrade required',
    body:        'This feature is not available on your current plan.',
    action:      'See plans',
    actionUrl:   '/pricing',
    isRetryable: false,
    severity:    'info',
  },
  FEATURE_NOT_IN_PLAN: {
    title:       'Feature locked',
    body:        'Upgrade your plan to unlock this feature.',
    action:      'Upgrade',
    actionUrl:   '/pricing',
    isRetryable: false,
    severity:    'info',
  },
  USAGE_LIMIT_REACHED: {
    title:       'Monthly limit reached',
    body:        'You\'ve reached your plan limit for this feature. Upgrade for more.',
    action:      'Upgrade',
    actionUrl:   '/pricing',
    isRetryable: false,
    severity:    'warning',
  },
  MANUAL_ASSET_LIMIT: {
    title:       'Asset limit reached',
    body:        'Free plan allows 5 manual assets. Upgrade to Plus for 25.',
    action:      'Upgrade to Plus',
    actionUrl:   '/pricing',
    isRetryable: false,
    severity:    'warning',
  },

  // ── Validation
  VALIDATION_ERROR: {
    title:       'Invalid input',
    body:        'Please check the form and correct any errors.',
    isRetryable: false,
    severity:    'warning',
  },
  INVALID_TOKEN: {
    title:       'Invalid code',
    body:        'The code you entered is incorrect or has expired. Try again.',
    isRetryable: true,
    severity:    'warning',
  },
  INVALID_OTP: {
    title:       'Incorrect OTP',
    body:        'The OTP you entered is wrong or expired. Request a new one.',
    isRetryable: true,
    severity:    'warning',
  },
  INVALID_ADDRESS: {
    title:       'Invalid wallet address',
    body:        'The wallet address format is incorrect. Check and try again.',
    isRetryable: false,
    severity:    'warning',
  },

  // ── Not found
  NOT_FOUND: {
    title:       'Not found',
    body:        'This item doesn\'t exist or may have been deleted.',
    isRetryable: false,
    severity:    'error',
  },
  NO_VAULT: {
    title:       'No family vault',
    body:        'Your family vault hasn\'t been set up yet.',
    action:      'Set up vault',
    isRetryable: false,
    severity:    'info',
  },
  NO_BATCH_FOUND: {
    title:       'No nominee update found',
    body:        'Start a nominee update from the Nominee section.',
    isRetryable: false,
    severity:    'info',
  },

  // ── Rate limits
  RATE_LIMIT: {
    title:       'Too many requests',
    body:        'You\'ve made too many requests. Wait a moment and try again.',
    action:      'Retry in 60s',
    isRetryable: true,
    severity:    'warning',
  },
  OTP_RATE_LIMIT: {
    title:       'Too many OTP requests',
    body:        'You can request 3 OTPs per hour. Wait before requesting another.',
    isRetryable: false,
    severity:    'warning',
  },
  TWO_FACTOR_LOCKED: {
    title:       'Account temporarily locked',
    body:        'Too many wrong attempts. Try again in 30 minutes.',
    isRetryable: false,
    severity:    'error',
  },

  // ── Business logic
  ALREADY_SUBSCRIBED: {
    title:       'Already subscribed',
    body:        'You already have an active subscription. Manage it in Billing.',
    action:      'Manage billing',
    actionUrl:   '/settings/billing',
    isRetryable: false,
    severity:    'info',
  },
  INVITE_FAILED: {
    title:       'Invite failed',
    body:        'Could not send the invite. Check the mobile number and try again.',
    isRetryable: true,
    severity:    'warning',
  },
  RECOVERY_FAILED: {
    title:       'Recovery failed',
    body:        'Something went wrong starting this recovery. Try again.',
    isRetryable: true,
    severity:    'error',
  },
  SIGNATURE_MISMATCH: {
    title:       'Signature doesn\'t match',
    body:        'The wallet signature could not be verified. Make sure you signed the correct message.',
    isRetryable: true,
    severity:    'warning',
  },

  // ── Server errors
  SERVER_ERROR: {
    title:       'Something went wrong',
    body:        'We\'re having trouble right now. Our team has been notified.',
    action:      'Retry',
    isRetryable: true,
    severity:    'error',
  },
  SERVICE_UNAVAILABLE: {
    title:       'Service temporarily unavailable',
    body:        'AssetMap is under maintenance. We\'ll be back shortly.',
    isRetryable: true,
    severity:    'error',
  },

  // ── External services
  AA_FETCH_FAILED: {
    title:       'Could not fetch bank data',
    body:        'Your bank\'s Account Aggregator connection timed out. Try refreshing later.',
    action:      'Retry later',
    isRetryable: true,
    severity:    'warning',
  },
  LAND_FETCH_FAILED: {
    title:       'Land records unavailable',
    body:        'The state land portal is currently unavailable. Your existing records are intact.',
    isRetryable: true,
    severity:    'warning',
  },
  SUREPASS_UNAVAILABLE: {
    title:       'Land data service offline',
    body:        'Surepass land records API is temporarily unavailable.',
    isRetryable: true,
    severity:    'warning',
  },
  CAMS_UNAVAILABLE: {
    title:       'Mutual fund service offline',
    body:        'CAMS API is temporarily unavailable. Nominee update will retry automatically.',
    isRetryable: true,
    severity:    'warning',
  },

  // ── Fallback
  UNKNOWN: {
    title:       'Unexpected error',
    body:        'Something went wrong. Try again or contact support if it persists.',
    action:      'Retry',
    isRetryable: true,
    severity:    'error',
  },
}

export function getErrorMessage(code: string): ErrorMessage {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN
}
