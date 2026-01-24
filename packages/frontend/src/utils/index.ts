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
} from './webglCapabilities'

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
} from './performance'

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
} from './errors'
