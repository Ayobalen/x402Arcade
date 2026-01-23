/**
 * x402 Payment Middleware
 *
 * HTTP-native micropayments using EIP-3009 signed authorizations.
 * Implements the x402 protocol for gasless payments on Cronos blockchain.
 *
 * @module server/x402
 */

// Export all types
export * from './types.js';

// Export error classes
export * from './errors.js';

// Export middleware factory functions
export {
  createX402Middleware,
  createX402MiddlewareWithOptions,
  createX402MockMiddleware,
  hasPaymentInfo,
  getPaymentInfo,
} from './middleware.js';

// Export header detection utilities
export {
  detectXPaymentHeader,
  hasXPaymentHeader,
  extractXPaymentHeader,
  extractXPaymentHeaderFromRequest,
  type XPaymentHeaderDetectionResult,
} from './header-detection.js';

// Export retry utilities
export {
  withRetry,
  retryableFetch,
  isTransientError,
  isRetryableHttpStatus,
  calculateBackoffDelay,
  logRetryAttempt,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
  type RetryResult,
  type RetryContext,
  type RetryOptions,
} from './retry.js';

// Export nonce store for replay protection
export {
  getDefaultNonceStore,
  setDefaultNonceStore,
  resetDefaultNonceStore,
  createInMemoryNonceStore,
  InMemoryNonceStore,
  type NonceStore,
  type NonceMetadata,
} from './nonce-store.js';
