/**
 * Context Providers Index
 *
 * Central export point for all React contexts in the x402Arcade frontend.
 */

// WebGL Context
export {
  WebGLContext,
  WebGLProvider,
  useWebGL,
  useWebGLSafe,
  QUALITY_PRESETS,
  DEFAULT_CAPABILITIES,
} from './WebGLContext';

export type {
  WebGLContextType,
  WebGLCapabilities,
  WebGLQualitySettings,
  WebGLProviderProps,
  QualityPreset,
  WebGLQualityPreset,
} from './WebGLContext';

// Animation Context
export {
  AnimationContext,
  AnimationProvider,
  useAnimationContext,
  useAnimationDuration,
} from './AnimationContext';

export type { AnimationContextType, AnimationProviderProps } from './AnimationContext';

// Quality Context
export {
  QualityContext,
  QualityProvider,
  useQuality,
  useQualitySafe,
  useQualitySettings,
  useQualityFeatures,
  useFpsReporter,
  QUALITY_PRESETS as QUALITY_3D_PRESETS,
} from './QualityContext';

export type {
  QualityPreset as Quality3DPreset,
  ResolvedQuality,
  Quality3DSettings,
  QualityContextState,
  QualityContextMethods,
  QualityContextType,
  QualityProviderProps,
} from './QualityContext';

// Audio Context
export { AudioProvider, useAudioContext } from './AudioContext';
export { default as AudioContext } from './AudioContext';
