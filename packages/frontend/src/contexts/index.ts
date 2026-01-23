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
