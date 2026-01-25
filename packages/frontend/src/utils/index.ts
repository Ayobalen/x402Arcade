/**
 * Utility Functions for x402 Arcade
 *
 * This module exports all utility functions used throughout the application.
 */

export {
  detectWebGLCapabilities,
  isWebGLAvailable,
  isWebGL2Available,
  getCapabilitySummary,
  type WebGLVersionSupport,
  type WebGLLimits,
  type WebGLExtensionSupport,
  type WebGLCapabilities,
} from './webglCapabilities';

export {
  ObjectPool,
  EffectThrottle,
  BatchProcessor,
  FrameBudgetTracker,
  RenderSkipController,
  LODManager,
  type Poolable,
  type ObjectPoolConfig,
  type PoolStats,
  type ThrottleConfig,
  type BatchConfig,
  type FrameBudgetConfig,
  type LODLevel,
} from './performance';

export {
  createAppError,
  fromUnknownError,
  isAppError,
  getRecoverySuggestions,
  getUserMessage,
  formatErrorMessage,
  getPrimaryRecovery,
  getSeverityClass,
  getCategoryIcon,
} from './errors';

export {
  ErrorLogger,
  getErrorLogger,
  initializeErrorLogging,
  logError,
  setErrorUserContext,
  clearErrorUserContext,
  type UserContext as ErrorUserContext,
  type PageContext as ErrorPageContext,
  type ErrorLogEntry,
  type ErrorLoggerConfig,
} from './errorLogger';

export {
  SentryManager,
  getSentry,
  initializeSentry,
  captureError,
  captureMessage,
  setSentryUser,
  setSentryTags,
  addBreadcrumb,
  trackNavigation,
  trackClick,
  trackApiCall,
  trackGameEvent,
  trackWalletAction,
  trackPayment,
  type SentryConfig,
  type SentryUser,
  type SentryTags,
  type Breadcrumb,
  type BreadcrumbType,
} from './sentry';

export {
  NetworkError,
  createNetworkErrorFromFetch,
  createNetworkErrorFromResponse,
  isOffline,
  isRetryableError,
  isNetworkError,
  getNetworkErrorMessage,
  waitForOnline,
  type NetworkErrorType,
  type NetworkErrorSeverity,
  type NetworkErrorMetadata,
} from './networkErrors';

export {
  calculateBackoff,
  retryAsync,
  withRetry,
  fetchWithRetry,
  RetryController,
  type RetryOptions,
  type RetryState,
  type RetryResult,
} from './retry';
