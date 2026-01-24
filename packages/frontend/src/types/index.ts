/**
 * Type Definitions Index
 *
 * Central export point for all custom types in the x402Arcade frontend.
 */

// Three.js and 3D-related types
export type {
  RoundedBoxGeometryParams,
  ArcadeCabinetGeometryParams,
  ArcadeScreenUniforms,
  NeonGlowUniforms,
  ArcadeScreenMaterialParams,
  NeonGlowMaterialParams,
  ArcadeCabinetConfig,
  ArcadeCabinetState,
  FloatAnimationParams,
  GlowPulseParams,
  ArcadeSceneConfig,
  ArcadeCameraConfig,
  ArcadeColorPalette,
  Vector3Tuple,
  EulerTuple,
  RGBATuple,
  // Aliases
  RoundedBoxParams,
  CabinetGeometryParams,
  ScreenUniforms,
  GlowUniforms,
} from './three.d';

// Error types
export type {
  ErrorCategory,
  ErrorSeverity,
  AppErrorCode,
  WalletErrorCode,
  PaymentErrorCode,
  GameErrorCode,
  NetworkErrorCode,
  SystemErrorCode,
  RecoveryAction,
  RecoverySuggestion,
  AppError,
} from './errors';
