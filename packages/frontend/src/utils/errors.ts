/**
 * Error Utilities
 *
 * Utilities for creating, categorizing, and handling errors throughout
 * the application. Provides recovery suggestions for different error types.
 *
 * @module utils/errors
 */

import type {
  AppError,
  AppErrorCode,
  ErrorCategory,
  ErrorSeverity,
  RecoverySuggestion,
  RecoveryAction,
} from '../types/errors'
import {
  getErrorCategory,
  getErrorSeverity,
  isRetryable,
} from '../types/errors'

// ============================================================================
// Recovery Suggestion Maps
// ============================================================================

/**
 * Get recovery suggestions for a specific error code
 */
export function getRecoverySuggestions(code: AppErrorCode): RecoverySuggestion[] {
  const suggestions: Partial<Record<AppErrorCode, RecoverySuggestion[]>> = {
    // Wallet Errors
    WALLET_NOT_CONNECTED: [
      {
        action: 'RECONNECT_WALLET',
        description: 'Connect your wallet to continue',
        primary: true,
      },
    ],
    WALLET_CONNECTION_REJECTED: [
      {
        action: 'RECONNECT_WALLET',
        description: 'Try connecting your wallet again',
        primary: true,
      },
      {
        action: 'DISMISS',
        description: 'Continue without connecting',
      },
    ],
    WALLET_NOT_FOUND: [
      {
        action: 'CONTACT_SUPPORT',
        description: 'Install MetaMask or another compatible wallet',
        primary: true,
        href: 'https://metamask.io/download/',
      },
    ],
    WALLET_CHAIN_MISMATCH: [
      {
        action: 'SWITCH_NETWORK',
        description: 'Switch to Cronos Testnet',
        primary: true,
      },
    ],
    WALLET_SIGNATURE_REJECTED: [
      {
        action: 'RETRY',
        description: 'Try signing again',
        primary: true,
      },
      {
        action: 'DISMISS',
        description: 'Cancel this action',
      },
    ],

    // Payment Errors
    INSUFFICIENT_BALANCE: [
      {
        action: 'ADD_FUNDS',
        description: 'Add USDC to your wallet',
        primary: true,
      },
      {
        action: 'CONTACT_SUPPORT',
        description: 'Get testnet tokens from faucet',
        href: 'https://cronos.org/faucet',
      },
    ],
    PAYMENT_EXPIRED: [
      {
        action: 'RETRY',
        description: 'Create a new payment authorization',
        primary: true,
      },
    ],
    PAYMENT_DUPLICATE: [
      {
        action: 'RETRY',
        description: 'Try the payment again with a new nonce',
        primary: true,
      },
    ],
    SETTLEMENT_FAILED: [
      {
        action: 'WAIT_AND_RETRY',
        description: 'Wait a moment and try again',
        primary: true,
      },
      {
        action: 'CONTACT_SUPPORT',
        description: 'Contact support if problem persists',
      },
    ],
    SETTLEMENT_TIMEOUT: [
      {
        action: 'RETRY',
        description: 'Retry the payment',
        primary: true,
      },
    ],
    FACILITATOR_UNAVAILABLE: [
      {
        action: 'WAIT_AND_RETRY',
        description: 'Payment service is temporarily unavailable. Try again in a few minutes.',
        primary: true,
      },
    ],

    // Game Errors
    GAME_SESSION_EXPIRED: [
      {
        action: 'RETRY',
        description: 'Start a new game session',
        primary: true,
      },
    ],
    GAME_NOT_FOUND: [
      {
        action: 'REFRESH_PAGE',
        description: 'Refresh the page',
        primary: true,
      },
    ],
    GAME_LOAD_FAILED: [
      {
        action: 'REFRESH_PAGE',
        description: 'Refresh the page to reload game assets',
        primary: true,
      },
    ],

    // Network Errors
    NETWORK_OFFLINE: [
      {
        action: 'WAIT_AND_RETRY',
        description: 'Check your internet connection and try again',
        primary: true,
      },
    ],
    NETWORK_TIMEOUT: [
      {
        action: 'RETRY',
        description: 'Retry the request',
        primary: true,
      },
    ],
    API_UNAVAILABLE: [
      {
        action: 'WAIT_AND_RETRY',
        description: 'Server is temporarily unavailable. Try again in a few minutes.',
        primary: true,
      },
      {
        action: 'CONTACT_SUPPORT',
        description: 'Check server status',
      },
    ],
    RATE_LIMITED: [
      {
        action: 'WAIT_AND_RETRY',
        description: 'Too many requests. Wait a minute and try again.',
        primary: true,
      },
    ],

    // System Errors
    UNKNOWN_ERROR: [
      {
        action: 'REFRESH_PAGE',
        description: 'Refresh the page',
        primary: true,
      },
      {
        action: 'CONTACT_SUPPORT',
        description: 'Contact support if problem persists',
      },
    ],
  }

  return (
    suggestions[code] || [
      {
        action: 'RETRY',
        description: 'Try again',
        primary: true,
      },
      {
        action: 'CONTACT_SUPPORT',
        description: 'Contact support if problem persists',
      },
    ]
  )
}

// ============================================================================
// User-Friendly Messages
// ============================================================================

/**
 * Get user-friendly error message for display
 */
export function getUserMessage(code: AppErrorCode): string {
  const messages: Partial<Record<AppErrorCode, string>> = {
    // Wallet Errors
    WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
    WALLET_CONNECTION_REJECTED: 'Wallet connection was rejected',
    WALLET_NOT_FOUND:
      'No wallet detected. Please install MetaMask or another compatible wallet.',
    WALLET_CHAIN_MISMATCH:
      'Please switch to Cronos Testnet in your wallet',
    WALLET_ACCOUNT_CHANGED: 'Wallet account was changed',
    WALLET_DISCONNECTED: 'Wallet was disconnected',
    WALLET_SIGNATURE_REJECTED: 'Signature request was rejected',
    WALLET_TRANSACTION_REJECTED: 'Transaction was rejected',
    WALLET_UNSUPPORTED: 'Your wallet does not support required features',

    // Payment Errors
    PAYMENT_REQUIRED: 'Payment is required to continue',
    PAYMENT_INVALID: 'Payment details are invalid',
    PAYMENT_REJECTED: 'Payment was rejected',
    PAYMENT_EXPIRED: 'Payment authorization has expired',
    PAYMENT_INSUFFICIENT: 'Payment amount is too low',
    PAYMENT_DUPLICATE: 'This payment has already been processed',
    INSUFFICIENT_BALANCE:
      'Insufficient USDC balance. Please add funds to your wallet.',
    INSUFFICIENT_ALLOWANCE: 'Insufficient token allowance',
    SETTLEMENT_FAILED: 'Payment settlement failed',
    SETTLEMENT_TIMEOUT: 'Payment settlement timed out',
    FACILITATOR_ERROR: 'Payment service error',
    FACILITATOR_UNAVAILABLE: 'Payment service is temporarily unavailable',
    INVALID_SIGNATURE: 'Payment signature is invalid',
    SIGNATURE_REJECTED: 'Signature request was rejected',
    NETWORK_ERROR: 'Network error occurred',
    RPC_ERROR: 'Blockchain RPC error',

    // Game Errors
    GAME_NOT_FOUND: 'Game not found',
    GAME_SESSION_EXPIRED: 'Game session has expired',
    GAME_SESSION_INVALID: 'Invalid game session',
    GAME_ALREADY_STARTED: 'Game session already exists',
    GAME_NOT_STARTED: 'No active game session',
    GAME_SCORE_INVALID: 'Score validation failed',
    GAME_SCORE_TOO_HIGH: 'Score appears invalid',
    GAME_CONFIG_ERROR: 'Game configuration error',
    GAME_LOAD_FAILED: 'Failed to load game',

    // Network Errors
    NETWORK_OFFLINE: 'No internet connection',
    NETWORK_TIMEOUT: 'Request timed out',
    API_ERROR: 'Server error occurred',
    API_UNAVAILABLE: 'Server is temporarily unavailable',
    RATE_LIMITED: 'Too many requests. Please slow down.',

    // System Errors
    UNKNOWN_ERROR: 'An unexpected error occurred',
    INTERNAL_ERROR: 'Internal application error',
    VALIDATION_ERROR: 'Validation failed',
    NOT_IMPLEMENTED: 'This feature is not yet available',
  }

  return messages[code] || 'An error occurred'
}

// ============================================================================
// Error Creation
// ============================================================================

/**
 * Create a standardized AppError from an error code
 *
 * @param code - The error code
 * @param overrides - Optional overrides for default values
 * @returns Standardized AppError object
 *
 * @example
 * ```typescript
 * const error = createAppError('WALLET_NOT_CONNECTED')
 * const error = createAppError('INSUFFICIENT_BALANCE', {
 *   context: { balance: '0.00', required: '0.01' }
 * })
 * ```
 */
export function createAppError(
  code: AppErrorCode,
  overrides?: Partial<AppError>
): AppError {
  const category = getErrorCategory(code)
  const severity = getErrorSeverity(code)
  const retryable = isRetryable(code)
  const recoverySuggestions = getRecoverySuggestions(code)
  const message = getUserMessage(code)

  return {
    category,
    code,
    message,
    severity,
    retryable,
    recoverySuggestions,
    timestamp: new Date(),
    ...overrides,
  }
}

/**
 * Create an AppError from an unknown error object
 *
 * Attempts to extract meaningful information from various error types.
 *
 * @param error - The error to convert
 * @param defaultCode - Fallback error code if type can't be determined
 * @returns Standardized AppError object
 *
 * @example
 * ```typescript
 * try {
 *   await fetch('/api/games')
 * } catch (e) {
 *   const appError = fromUnknownError(e, 'NETWORK_ERROR')
 * }
 * ```
 */
export function fromUnknownError(
  error: unknown,
  defaultCode: AppErrorCode = 'UNKNOWN_ERROR'
): AppError {
  // If it's already an AppError, return it
  if (isAppError(error)) {
    return error
  }

  // If it's an Error with a code property (common pattern)
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: string | number }

    // Try to map known error codes
    if (errorWithCode.code !== undefined) {
      const mappedCode = mapErrorCode(errorWithCode.code)
      if (mappedCode) {
        return createAppError(mappedCode, {
          technicalMessage: error.message,
          originalError: error,
        })
      }
    }

    // Check for specific error messages
    const message = error.message.toLowerCase()

    if (message.includes('user rejected') || message.includes('user denied')) {
      return createAppError('WALLET_SIGNATURE_REJECTED', {
        technicalMessage: error.message,
        originalError: error,
      })
    }

    if (message.includes('network') || message.includes('fetch')) {
      return createAppError('NETWORK_ERROR', {
        technicalMessage: error.message,
        originalError: error,
      })
    }

    if (message.includes('timeout')) {
      return createAppError('NETWORK_TIMEOUT', {
        technicalMessage: error.message,
        originalError: error,
      })
    }

    if (message.includes('insufficient')) {
      return createAppError('INSUFFICIENT_BALANCE', {
        technicalMessage: error.message,
        originalError: error,
      })
    }

    // Generic error
    return createAppError(defaultCode, {
      message: error.message,
      technicalMessage: error.message,
      originalError: error,
    })
  }

  // If it's a string
  if (typeof error === 'string') {
    return createAppError(defaultCode, {
      message: error,
      technicalMessage: error,
      originalError: error,
    })
  }

  // If it's an object with message/code properties
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    const errorObj = error as { message: string; code?: string | number }
    const code =
      errorObj.code !== undefined
        ? mapErrorCode(errorObj.code) || defaultCode
        : defaultCode

    return createAppError(code, {
      technicalMessage: errorObj.message,
      originalError: error,
    })
  }

  // Fallback for unknown types
  return createAppError(defaultCode, {
    message: 'An unexpected error occurred',
    technicalMessage: String(error),
    originalError: error,
  })
}

/**
 * Map external error codes to AppErrorCode
 */
function mapErrorCode(code: string | number): AppErrorCode | null {
  // Convert to string for consistent lookup
  const codeStr = String(code)

  const codeMap: Record<string, AppErrorCode> = {
    // Wallet/Web3 error codes (numeric)
    '4001': 'WALLET_SIGNATURE_REJECTED',
    '4100': 'WALLET_NOT_CONNECTED',
    '4200': 'WALLET_UNSUPPORTED',
    '4900': 'WALLET_DISCONNECTED',
    '4901': 'WALLET_CHAIN_MISMATCH',

    // HTTP status code mapping
    '402': 'PAYMENT_REQUIRED',
    '429': 'RATE_LIMITED',
    '503': 'API_UNAVAILABLE',

    // Network error codes
    ECONNREFUSED: 'NETWORK_ERROR',
    ECONNRESET: 'NETWORK_ERROR',
    ETIMEDOUT: 'NETWORK_TIMEOUT',
    ENOTFOUND: 'NETWORK_ERROR',

    // String codes from backend
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    INVALID_SIGNATURE: 'INVALID_SIGNATURE',
    PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
    NONCE_ALREADY_USED: 'PAYMENT_DUPLICATE',
    FACILITATOR_ERROR: 'FACILITATOR_ERROR',
    SETTLEMENT_FAILED: 'SETTLEMENT_FAILED',
  }

  return codeMap[codeStr] || null
}

/**
 * Type guard to check if an object is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'category' in error &&
    'code' in error &&
    'message' in error
  )
}

// ============================================================================
// Error Display Helpers
// ============================================================================

/**
 * Get a formatted error message for display
 *
 * @param error - The error to format
 * @param includeCode - Whether to include the error code (default: false)
 * @returns Formatted error message
 */
export function formatErrorMessage(
  error: AppError,
  includeCode = false
): string {
  if (includeCode) {
    return `${error.message} (${error.code})`
  }
  return error.message
}

/**
 * Get the primary recovery action for an error
 *
 * @param error - The error to get action for
 * @returns Primary recovery suggestion or null
 */
export function getPrimaryRecovery(
  error: AppError
): RecoverySuggestion | null {
  const primary = error.recoverySuggestions.find((s) => s.primary)
  return primary || error.recoverySuggestions[0] || null
}

/**
 * Get CSS class name for error severity
 *
 * @param severity - The error severity
 * @returns Tailwind CSS classes
 */
export function getSeverityClass(severity: ErrorSeverity): string {
  const classes: Record<ErrorSeverity, string> = {
    info: 'bg-blue-900/20 border-blue-500/50 text-blue-100',
    warning: 'bg-yellow-900/20 border-yellow-500/50 text-yellow-100',
    error: 'bg-red-900/20 border-red-500/50 text-red-100',
    critical: 'bg-red-900/40 border-red-500 text-red-50',
  }

  return classes[severity]
}

/**
 * Get icon name for error category
 *
 * @param category - The error category
 * @returns Icon name (from lucide-react)
 */
export function getCategoryIcon(category: ErrorCategory): string {
  const icons: Record<ErrorCategory, string> = {
    wallet: 'Wallet',
    payment: 'CreditCard',
    game: 'Gamepad2',
    network: 'Wifi',
    system: 'AlertCircle',
  }

  return icons[category]
}
