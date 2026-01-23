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

export {
  useCameraControls,
  CAMERA_PRESETS,
  DEFAULT_CAMERA_POSITION,
  DEFAULT_CAMERA_TARGET,
  DEFAULT_LIMITS,
  DEFAULT_DAMPING,
  DEFAULT_TOUCH,
  DEFAULT_ANIMATION,
  type CameraPosition,
  type CameraTarget,
  type ControlLimits,
  type DampingConfig,
  type TouchConfig,
  type CameraPreset,
  type CameraAnimationConfig,
  type CameraControlsState,
  type UseCameraControlsOptions,
  type UseCameraControlsResult,
  type OrbitControlsProps,
} from './useCameraControls'

export {
  useX402,
  type PaymentStatus,
  type PaymentError,
  type PaymentRequest,
  type PaymentResult,
  type UseX402State,
  type UseX402Actions,
  type UseX402Options,
  type UseX402Result,
} from './useX402'
