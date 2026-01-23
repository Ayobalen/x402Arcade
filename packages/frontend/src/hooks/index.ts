/**
 * Custom Hooks for x402 Arcade
 *
 * This module exports all custom React hooks used throughout the application.
 */

export {
  usePerformanceMonitor,
  usePerformanceMonitorStandalone,
  type PerformanceMetrics,
  type UsePerformanceMonitorOptions,
  type UsePerformanceMonitorResult,
} from './usePerformanceMonitor'

export {
  useGracefulDegradation,
  QUALITY_TIERS,
  type QualityTier,
  type QualitySettings,
  type GracefulDegradationState,
  type UseGracefulDegradationResult,
  type UseGracefulDegradationOptions,
} from './useGracefulDegradation'
