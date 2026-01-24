/**
 * Error Types and Categories
 *
 * Centralized error type definitions for the x402Arcade application.
 * Categorizes errors into wallet, payment, and game errors with appropriate
 * recovery suggestions.
 *
 * @module types/errors
 */

// ============================================================================
// Error Categories
// ============================================================================

/**
 * Error category for grouping related errors
 */
export type ErrorCategory = 'wallet' | 'payment' | 'game' | 'network' | 'system'

/**
 * Error severity level
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical'

// ============================================================================
// Wallet Error Codes
// ============================================================================

/**
 * Wallet-related error codes
 */
export type WalletErrorCode =
  | 'WALLET_NOT_CONNECTED'       // User hasn't connected wallet
  | 'WALLET_CONNECTION_REJECTED' // User rejected connection request
  | 'WALLET_NOT_FOUND'           // No wallet extension detected
  | 'WALLET_CHAIN_MISMATCH'      // Wrong blockchain network
  | 'WALLET_ACCOUNT_CHANGED'     // User switched accounts
  | 'WALLET_DISCONNECTED'        // Wallet disconnected unexpectedly
  | 'WALLET_SIGNATURE_REJECTED'  // User rejected signature request
  | 'WALLET_TRANSACTION_REJECTED' // User rejected transaction
  | 'WALLET_UNSUPPORTED'         // Wallet doesn't support required features

// ============================================================================
// Payment Error Codes
// ============================================================================

/**
 * Payment-related error codes
 */
export type PaymentErrorCode =
  // x402 Protocol Errors
  | 'PAYMENT_REQUIRED'           // 402 - Payment needed
  | 'PAYMENT_INVALID'            // Malformed payment payload
  | 'PAYMENT_REJECTED'           // Payment validation failed
  | 'PAYMENT_EXPIRED'            // Authorization expired
  | 'PAYMENT_INSUFFICIENT'       // Amount too low
  | 'PAYMENT_DUPLICATE'          // Nonce already used
  // Balance & Funds
  | 'INSUFFICIENT_BALANCE'       // Not enough USDC
  | 'INSUFFICIENT_ALLOWANCE'     // Not enough token allowance
  // Settlement
  | 'SETTLEMENT_FAILED'          // Facilitator rejected
  | 'SETTLEMENT_TIMEOUT'         // Settlement took too long
  | 'FACILITATOR_ERROR'          // Facilitator service error
  | 'FACILITATOR_UNAVAILABLE'    // Facilitator offline
  // Signature
  | 'INVALID_SIGNATURE'          // Signature validation failed
  | 'SIGNATURE_REJECTED'         // User rejected signing
  // Network
  | 'NETWORK_ERROR'              // Network request failed
  | 'RPC_ERROR'                  // RPC endpoint error

// ============================================================================
// Game Error Codes
// ============================================================================

/**
 * Game-related error codes
 */
export type GameErrorCode =
  | 'GAME_NOT_FOUND'             // Invalid game ID
  | 'GAME_SESSION_EXPIRED'       // Session timed out
  | 'GAME_SESSION_INVALID'       // Invalid session ID
  | 'GAME_ALREADY_STARTED'       // Can't start duplicate session
  | 'GAME_NOT_STARTED'           // No active session
  | 'GAME_SCORE_INVALID'         // Score validation failed
  | 'GAME_SCORE_TOO_HIGH'        // Suspiciously high score
  | 'GAME_CONFIG_ERROR'          // Game configuration error
  | 'GAME_LOAD_FAILED'           // Failed to load game assets

// ============================================================================
// Network Error Codes
// ============================================================================

/**
 * Network-related error codes
 */
export type NetworkErrorCode =
  | 'NETWORK_OFFLINE'            // No internet connection
  | 'NETWORK_TIMEOUT'            // Request timed out
  | 'NETWORK_ERROR'              // Generic network error
  | 'API_ERROR'                  // API returned error
  | 'API_UNAVAILABLE'            // API is down
  | 'RATE_LIMITED'               // Too many requests

// ============================================================================
// System Error Codes
// ============================================================================

/**
 * System-related error codes
 */
export type SystemErrorCode =
  | 'UNKNOWN_ERROR'              // Unhandled error
  | 'INTERNAL_ERROR'             // Internal application error
  | 'VALIDATION_ERROR'           // Input validation failed
  | 'NOT_IMPLEMENTED'            // Feature not yet implemented

/**
 * All error codes combined
 */
export type AppErrorCode =
  | WalletErrorCode
  | PaymentErrorCode
  | GameErrorCode
  | NetworkErrorCode
  | SystemErrorCode

// ============================================================================
// Recovery Action Types
// ============================================================================

/**
 * Actions the user can take to recover from an error
 */
export type RecoveryAction =
  | 'RETRY'                      // Retry the same operation
  | 'RECONNECT_WALLET'           // Connect wallet again
  | 'SWITCH_NETWORK'             // Switch to correct network
  | 'ADD_FUNDS'                  // Add USDC to wallet
  | 'REFRESH_PAGE'               // Reload the page
  | 'CONTACT_SUPPORT'            // Contact support team
  | 'WAIT_AND_RETRY'             // Wait before retrying
  | 'DISMISS'                    // Just dismiss the error

/**
 * Recovery suggestion with action and description
 */
export interface RecoverySuggestion {
  /** The action to take */
  action: RecoveryAction
  /** Human-readable description of the action */
  description: string
  /** Whether this is the primary recommended action */
  primary?: boolean
  /** URL to navigate to (if applicable) */
  href?: string
}

// ============================================================================
// App Error Interface
// ============================================================================

/**
 * Standardized application error
 *
 * All errors throughout the application should be converted to this format
 * for consistent handling and display.
 */
export interface AppError {
  /** Error category for grouping */
  category: ErrorCategory
  /** Specific error code for programmatic handling */
  code: AppErrorCode
  /** Human-readable error message for users */
  message: string
  /** Technical details for developers (not shown to users) */
  technicalMessage?: string
  /** Severity level */
  severity: ErrorSeverity
  /** Whether the operation can be retried */
  retryable: boolean
  /** Suggested recovery actions */
  recoverySuggestions: RecoverySuggestion[]
  /** Additional context data */
  context?: Record<string, unknown>
  /** Timestamp when error occurred */
  timestamp: Date
  /** Original error object (for debugging) */
  originalError?: unknown
}

// ============================================================================
// Error Category Map
// ============================================================================

/**
 * Map error codes to their categories
 */
export function getErrorCategory(code: AppErrorCode): ErrorCategory {
  // Wallet errors
  if (code.startsWith('WALLET_')) {
    return 'wallet'
  }

  // Payment errors
  if (
    code.startsWith('PAYMENT_') ||
    code === 'INSUFFICIENT_BALANCE' ||
    code === 'INSUFFICIENT_ALLOWANCE' ||
    code.startsWith('SETTLEMENT_') ||
    code.startsWith('FACILITATOR_') ||
    code === 'INVALID_SIGNATURE' ||
    code === 'SIGNATURE_REJECTED'
  ) {
    return 'payment'
  }

  // Game errors
  if (code.startsWith('GAME_')) {
    return 'game'
  }

  // Network errors
  if (
    code.startsWith('NETWORK_') ||
    code.startsWith('API_') ||
    code === 'RATE_LIMITED' ||
    code === 'RPC_ERROR'
  ) {
    return 'network'
  }

  // System errors (default)
  return 'system'
}

// ============================================================================
// Error Severity Map
// ============================================================================

/**
 * Determine error severity from code
 */
export function getErrorSeverity(code: AppErrorCode): ErrorSeverity {
  // Critical errors that block core functionality
  const critical: AppErrorCode[] = [
    'WALLET_NOT_FOUND',
    'API_UNAVAILABLE',
    'FACILITATOR_UNAVAILABLE',
  ]

  if (critical.includes(code)) {
    return 'critical'
  }

  // Errors that prevent operation but are recoverable
  const error: AppErrorCode[] = [
    'WALLET_NOT_CONNECTED',
    'INSUFFICIENT_BALANCE',
    'PAYMENT_REJECTED',
    'SETTLEMENT_FAILED',
    'GAME_SESSION_EXPIRED',
  ]

  if (error.includes(code)) {
    return 'error'
  }

  // Warnings that should be addressed
  const warning: AppErrorCode[] = [
    'WALLET_CHAIN_MISMATCH',
    'PAYMENT_INSUFFICIENT',
    'RATE_LIMITED',
  ]

  if (warning.includes(code)) {
    return 'warning'
  }

  // Informational messages
  return 'info'
}

// ============================================================================
// Retryable Error Check
// ============================================================================

/**
 * Determine if an error can be retried
 */
export function isRetryable(code: AppErrorCode): boolean {
  // Non-retryable errors
  const nonRetryable: AppErrorCode[] = [
    'WALLET_NOT_FOUND',
    'WALLET_UNSUPPORTED',
    'WALLET_CONNECTION_REJECTED',
    'WALLET_SIGNATURE_REJECTED',
    'WALLET_TRANSACTION_REJECTED',
    'SIGNATURE_REJECTED',
    'PAYMENT_INVALID',
    'INVALID_SIGNATURE',
    'GAME_NOT_FOUND',
    'GAME_SCORE_TOO_HIGH',
    'VALIDATION_ERROR',
    'NOT_IMPLEMENTED',
  ]

  return !nonRetryable.includes(code)
}
