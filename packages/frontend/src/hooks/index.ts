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
} from './usePerformanceMonitor';

export {
  useGracefulDegradation,
  QUALITY_TIERS,
  type QualityTier,
  type QualitySettings,
  type GracefulDegradationState,
  type UseGracefulDegradationResult,
  type UseGracefulDegradationOptions,
} from './useGracefulDegradation';

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
} from './useCameraControls';

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
} from './useX402';

export {
  useWallet,
  formatAddress,
  isValidAddress,
  type WalletStatus,
  type WalletError,
  type WalletClient,
  type SignTypedDataParams,
  type UseWalletState,
  type UseWalletActions,
  type UseWalletOptions,
  type UseWalletResult,
} from './useWallet';

export {
  useAutoChainSwitch,
  type ChainSwitchStatus,
  type UseAutoChainSwitchOptions,
  type UseAutoChainSwitchResult,
} from './useAutoChainSwitch';

export {
  usePerformanceScaling,
  type QualityLevel,
  type PerformanceScalingConfig,
  type QualitySettings as PerformanceQualitySettings,
  type PerformanceStats,
  type UsePerformanceScalingResult,
} from './usePerformanceScaling';

export { useReducedMotion, useMotionConfig } from './useReducedMotion';

export { useAnimation, type ExtendedAnimationControls } from './useAnimation';

export {
  useScrollRestoration,
  clearScrollPositions,
  __testing as scrollRestorationTesting,
} from './useScrollRestoration';

export {
  useScoreSubmission,
  type SubmissionStatus,
  type SubmissionError,
  type UseScoreSubmissionReturn,
} from './useScoreSubmission';

export { useFocusTrap, FOCUSABLE_SELECTORS, type UseFocusTrapOptions } from './useFocusTrap';

export {
  useLiveAnnouncer,
  type AnnouncementOptions,
  type UseLiveAnnouncerReturn,
} from './useLiveAnnouncer';

export {
  useGameAnnouncements,
  type GameEvent,
  type GameAnnouncementOptions,
  type UseGameAnnouncementsReturn,
} from './useGameAnnouncements';

export {
  useColorScheme,
  getColorSchemeInitScript,
  type ColorScheme,
  type ColorSchemePreference,
  type UseColorSchemeResult,
  type UseColorSchemeOptions,
} from './useColorScheme';

export {
  useGameLoader,
  useGamePreload,
  type UseGameLoaderState,
  type UseGameLoaderOptions,
  type UseGamePreloadOptions,
} from './useGameLoader';

export {
  useServiceWorker,
  type ServiceWorkerState,
  type UseServiceWorkerOptions,
  type UseServiceWorkerReturn,
} from './useServiceWorker';

export {
  useApiCache,
  invalidateCache,
  getCacheStorageUsage,
  CACHE_KEYS,
  CACHE_TTL,
  type CacheOptions,
  type UseApiCacheReturn,
} from './useApiCache';

export {
  useAutoQualityDetection,
  type DeviceType,
  type ConnectionQuality,
  type BatteryStatus,
  type DeviceCapabilities,
  type QualityRecommendation,
  type FpsMonitorState,
  type UseAutoQualityDetectionOptions,
  type UseAutoQualityDetectionResult,
} from './useAutoQualityDetection';

export {
  useErrorTracking,
  useGameErrorTracking,
  useWalletErrorTracking,
  usePaymentErrorTracking,
  useErrorTrackingUser,
  useInitializeErrorTracking,
  type ErrorTrackingOptions,
  type ErrorTrackingMethods,
} from './useErrorTracking';
