/**
 * Quality Context - Global 3D Quality Settings System
 *
 * Provides a unified quality management system for 3D rendering across the app.
 * Features:
 * - Automatic quality detection based on device capabilities
 * - Manual quality presets (low, medium, high, auto)
 * - Persistent settings via localStorage
 * - FPS-based dynamic quality adjustment
 * - Integration with LOD, particle, and post-processing systems
 *
 * @module contexts/QualityContext
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { detectWebGLCapabilities, type WebGLCapabilities } from '../utils/webglCapabilities';
import { GAME_PERFORMANCE_BUDGET } from '../config/performanceBudget';

// ============================================================================
// Types
// ============================================================================

/**
 * Quality preset levels
 */
export type QualityPreset = 'low' | 'medium' | 'high' | 'auto';

/**
 * Internal quality level (auto resolves to one of these)
 */
export type ResolvedQuality = 'low' | 'medium' | 'high';

/**
 * 3D rendering quality settings
 */
export interface Quality3DSettings {
  /** Quality preset name */
  preset: ResolvedQuality;
  /** Device pixel ratio multiplier (0.5-2.0) */
  pixelRatio: number;
  /** Enable anti-aliasing */
  antialias: boolean;
  /** Enable shadows */
  shadows: boolean;
  /** Shadow map resolution (256, 512, 1024, 2048) */
  shadowMapSize: number;
  /** Enable post-processing effects */
  postProcessing: boolean;
  /** Enable bloom effect */
  bloom: boolean;
  /** Bloom intensity (0-1) */
  bloomIntensity: number;
  /** Enable CRT/scanline effect */
  crtEffect: boolean;
  /** Enable chromatic aberration */
  chromaticAberration: boolean;
  /** Enable vignette */
  vignette: boolean;
  /** Enable particles */
  particles: boolean;
  /** Maximum particle count */
  maxParticles: number;
  /** Particle detail multiplier (0-1) */
  particleDetail: number;
  /** Enable LOD (Level of Detail) */
  lod: boolean;
  /** LOD distance multiplier */
  lodDistanceMultiplier: number;
  /** Maximum texture resolution */
  maxTextureSize: number;
  /** Enable ambient occlusion */
  ambientOcclusion: boolean;
  /** Enable reflections */
  reflections: boolean;
  /** Geometry detail level (0-1) */
  geometryDetail: number;
  /** Animation quality (0-1) */
  animationQuality: number;
  /** Target FPS */
  targetFps: number;
}

/**
 * Quality context state
 */
export interface QualityContextState {
  /** Current quality preset (user selection) */
  preset: QualityPreset;
  /** Resolved quality settings */
  settings: Quality3DSettings;
  /** Whether auto mode is active */
  isAuto: boolean;
  /** Current FPS (when monitoring) */
  currentFps: number | null;
  /** Average FPS over sampling period */
  averageFps: number | null;
  /** Detected device capabilities */
  capabilities: WebGLCapabilities | null;
  /** Whether quality was auto-degraded */
  isDegraded: boolean;
  /** Whether settings have loaded */
  isReady: boolean;
  /** Detected device tier (1=low, 2=medium, 3=high) */
  deviceTier: 1 | 2 | 3;
}

/**
 * Quality context methods
 */
export interface QualityContextMethods {
  /** Set quality preset */
  setPreset: (preset: QualityPreset) => void;
  /** Report current FPS (for auto adjustment) */
  reportFps: (fps: number) => void;
  /** Force re-detection of capabilities */
  redetect: () => void;
  /** Reset to auto-detected settings */
  resetToAuto: () => void;
  /** Get a specific setting value */
  getSetting: <K extends keyof Quality3DSettings>(key: K) => Quality3DSettings[K];
  /** Check if a feature is enabled */
  isEnabled: (feature: keyof Quality3DSettings) => boolean;
}

/**
 * Complete quality context type
 */
export type QualityContextType = QualityContextState & QualityContextMethods;

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY = 'x402-quality-preset';
const FPS_SAMPLE_SIZE = 60;
const _FPS_CHECK_INTERVAL = 2000; // ms - reserved for future interval-based monitoring
const DEGRADE_FPS_THRESHOLD = 35;
const UPGRADE_FPS_THRESHOLD = 55;
const QUALITY_CHANGE_COOLDOWN = 5000; // ms

/**
 * Quality preset definitions
 */
export const QUALITY_PRESETS: Record<ResolvedQuality, Quality3DSettings> = {
  low: {
    preset: 'low',
    pixelRatio: 0.75,
    antialias: false,
    shadows: false,
    shadowMapSize: 256,
    postProcessing: false,
    bloom: false,
    bloomIntensity: 0,
    crtEffect: false,
    chromaticAberration: false,
    vignette: false,
    particles: false,
    maxParticles: 0,
    particleDetail: 0,
    lod: true,
    lodDistanceMultiplier: 0.5,
    maxTextureSize: 512,
    ambientOcclusion: false,
    reflections: false,
    geometryDetail: 0.5,
    animationQuality: 0.5,
    targetFps: 30,
  },
  medium: {
    preset: 'medium',
    pixelRatio: 1,
    antialias: true,
    shadows: false,
    shadowMapSize: 512,
    postProcessing: true,
    bloom: false,
    bloomIntensity: 0.3,
    crtEffect: true,
    chromaticAberration: false,
    vignette: true,
    particles: true,
    maxParticles: 500,
    particleDetail: 0.5,
    lod: true,
    lodDistanceMultiplier: 0.75,
    maxTextureSize: 1024,
    ambientOcclusion: false,
    reflections: false,
    geometryDetail: 0.75,
    animationQuality: 0.75,
    targetFps: 45,
  },
  high: {
    preset: 'high',
    pixelRatio: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    postProcessing: true,
    bloom: true,
    bloomIntensity: 0.5,
    crtEffect: true,
    chromaticAberration: true,
    vignette: true,
    particles: true,
    maxParticles: 2000,
    particleDetail: 1,
    lod: true,
    lodDistanceMultiplier: 1,
    maxTextureSize: 2048,
    ambientOcclusion: true,
    reflections: true,
    geometryDetail: 1,
    animationQuality: 1,
    targetFps: 60,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load persisted preset from localStorage
 */
function loadPersistedPreset(): QualityPreset | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['low', 'medium', 'high', 'auto'].includes(stored)) {
      return stored as QualityPreset;
    }
  } catch {
    // localStorage not available
  }
  return null;
}

/**
 * Save preset to localStorage
 */
function persistPreset(preset: QualityPreset): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, preset);
  } catch {
    // localStorage not available
  }
}

/**
 * Determine device tier from capabilities
 */
function getDeviceTier(capabilities: WebGLCapabilities | null): 1 | 2 | 3 {
  if (!capabilities || !capabilities.supported) return 1;
  return capabilities.performanceTier;
}

/**
 * Get recommended quality based on device capabilities
 */
function getRecommendedQuality(capabilities: WebGLCapabilities | null): ResolvedQuality {
  if (!capabilities || !capabilities.supported) return 'low';

  switch (capabilities.recommendedQuality) {
    case 'ultra':
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Get quality level below current
 */
function getLowerQuality(current: ResolvedQuality): ResolvedQuality {
  switch (current) {
    case 'high':
      return 'medium';
    case 'medium':
    case 'low':
      return 'low';
  }
}

/**
 * Get quality level above current
 */
function getHigherQuality(current: ResolvedQuality, maxQuality: ResolvedQuality): ResolvedQuality {
  const order: ResolvedQuality[] = ['low', 'medium', 'high'];
  const currentIndex = order.indexOf(current);
  const maxIndex = order.indexOf(maxQuality);
  const nextIndex = Math.min(currentIndex + 1, maxIndex);
  return order[nextIndex];
}

// ============================================================================
// Context
// ============================================================================

const QualityContext = createContext<QualityContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface QualityProviderProps {
  children: ReactNode;
  /** Initial preset (defaults to auto) */
  initialPreset?: QualityPreset;
  /** Enable FPS-based auto adjustment */
  enableAutoAdjust?: boolean;
  /** Callback when quality changes */
  onQualityChange?: (settings: Quality3DSettings) => void;
}

export function QualityProvider({
  children,
  initialPreset,
  enableAutoAdjust = true,
  onQualityChange,
}: QualityProviderProps) {
  // Refs for FPS tracking
  const fpsHistoryRef = useRef<number[]>([]);
  const lastQualityChangeRef = useRef(0);
  const maxAutoQualityRef = useRef<ResolvedQuality>('high');

  // State - use lazy initialization for capabilities
  const [capabilities] = useState<WebGLCapabilities | null>(() => {
    // Detect on initial render (SSR-safe)
    if (typeof window === 'undefined') return null;
    return detectWebGLCapabilities();
  });

  const [preset, setPresetState] = useState<QualityPreset>(() => {
    // Check for persisted preset
    const persisted = loadPersistedPreset();
    if (persisted) return persisted;
    return initialPreset ?? 'auto';
  });

  const [resolvedQuality, setResolvedQuality] = useState<ResolvedQuality>(() => {
    // Initialize based on preset and capabilities
    const caps = typeof window !== 'undefined' ? detectWebGLCapabilities() : null;
    const recommended = getRecommendedQuality(caps);
    const persisted = loadPersistedPreset();
    const effectivePreset = persisted ?? initialPreset ?? 'auto';

    if (effectivePreset === 'auto') {
      return recommended;
    }
    return effectivePreset as ResolvedQuality;
  });

  const [currentFps, setCurrentFps] = useState<number | null>(null);
  const [averageFps, setAverageFps] = useState<number | null>(null);
  const [isDegraded, setIsDegraded] = useState(false);
  const [isReady] = useState(() => typeof window !== 'undefined');

  // Set max auto quality ref on mount
  useEffect(() => {
    const recommended = getRecommendedQuality(capabilities);
    maxAutoQualityRef.current = recommended;
  }, [capabilities]);

  // Get current settings
  const settings = QUALITY_PRESETS[resolvedQuality];
  const deviceTier = getDeviceTier(capabilities);

  // Notify on quality change
  useEffect(() => {
    if (isReady) {
      onQualityChange?.(settings);
    }
  }, [settings, isReady, onQualityChange]);

  // Set preset
  const setPreset = useCallback((newPreset: QualityPreset) => {
    setPresetState(newPreset);
    persistPreset(newPreset);

    if (newPreset === 'auto') {
      const caps = detectWebGLCapabilities();
      const recommended = getRecommendedQuality(caps);
      setResolvedQuality(recommended);
      setIsDegraded(false);
    } else {
      setResolvedQuality(newPreset as ResolvedQuality);
      setIsDegraded(false);
    }

    // Reset FPS history on manual change
    fpsHistoryRef.current = [];
    lastQualityChangeRef.current = Date.now();
  }, []);

  // Report FPS for auto adjustment
  const reportFps = useCallback(
    (fps: number) => {
      setCurrentFps(fps);

      // Skip if not in auto mode or auto-adjust disabled
      if (preset !== 'auto' || !enableAutoAdjust) return;

      // Add to history
      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > FPS_SAMPLE_SIZE) {
        fpsHistoryRef.current.shift();
      }

      // Need enough samples
      if (fpsHistoryRef.current.length < FPS_SAMPLE_SIZE / 2) return;

      // Check cooldown
      const now = Date.now();
      if (now - lastQualityChangeRef.current < QUALITY_CHANGE_COOLDOWN) return;

      // Calculate average FPS
      const avgFps =
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
      setAverageFps(avgFps);

      // Check for degradation
      if (avgFps < DEGRADE_FPS_THRESHOLD && resolvedQuality !== 'low') {
        const newQuality = getLowerQuality(resolvedQuality);
        setResolvedQuality(newQuality);
        setIsDegraded(true);
        lastQualityChangeRef.current = now;
        fpsHistoryRef.current = [];
        return;
      }

      // Check for upgrade (only if we were degraded)
      if (isDegraded && avgFps > UPGRADE_FPS_THRESHOLD) {
        const newQuality = getHigherQuality(resolvedQuality, maxAutoQualityRef.current);
        if (newQuality !== resolvedQuality) {
          setResolvedQuality(newQuality);
          lastQualityChangeRef.current = now;
          fpsHistoryRef.current = [];

          // Clear degraded flag if back to recommended
          if (newQuality === maxAutoQualityRef.current) {
            setIsDegraded(false);
          }
        }
      }
    },
    [preset, enableAutoAdjust, resolvedQuality, isDegraded]
  );

  // Force re-detection
  const redetect = useCallback(() => {
    const caps = detectWebGLCapabilities();
    setCapabilities(caps);

    const recommended = getRecommendedQuality(caps);
    maxAutoQualityRef.current = recommended;

    if (preset === 'auto') {
      setResolvedQuality(recommended);
      setIsDegraded(false);
    }
  }, [preset]);

  // Reset to auto
  const resetToAuto = useCallback(() => {
    setPreset('auto');
  }, [setPreset]);

  // Get specific setting
  const getSetting = useCallback(
    <K extends keyof Quality3DSettings>(key: K): Quality3DSettings[K] => {
      return settings[key];
    },
    [settings]
  );

  // Check if feature is enabled
  const isEnabled = useCallback(
    (feature: keyof Quality3DSettings): boolean => {
      const value = settings[feature];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value > 0;
      return !!value;
    },
    [settings]
  );

  const value: QualityContextType = {
    // State
    preset,
    settings,
    isAuto: preset === 'auto',
    currentFps,
    averageFps,
    capabilities,
    isDegraded,
    isReady,
    deviceTier,
    // Methods
    setPreset,
    reportFps,
    redetect,
    resetToAuto,
    getSetting,
    isEnabled,
  };

  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access quality context
 * @throws Error if used outside QualityProvider
 */
export function useQuality(): QualityContextType {
  const context = useContext(QualityContext);
  if (!context) {
    throw new Error('useQuality must be used within a QualityProvider');
  }
  return context;
}

/**
 * Safe hook that returns null outside provider
 */
export function useQualitySafe(): QualityContextType | null {
  return useContext(QualityContext);
}

/**
 * Hook for just the quality settings (memoized)
 */
export function useQualitySettings(): Quality3DSettings {
  const { settings } = useQuality();
  return settings;
}

/**
 * Hook for checking if specific features are enabled
 */
export function useQualityFeatures(): {
  shadows: boolean;
  bloom: boolean;
  particles: boolean;
  postProcessing: boolean;
  crtEffect: boolean;
  reflections: boolean;
  ambientOcclusion: boolean;
} {
  const { settings } = useQuality();
  return {
    shadows: settings.shadows,
    bloom: settings.bloom,
    particles: settings.particles,
    postProcessing: settings.postProcessing,
    crtEffect: settings.crtEffect,
    reflections: settings.reflections,
    ambientOcclusion: settings.ambientOcclusion,
  };
}

/**
 * Hook for FPS reporting (returns a stable callback)
 */
export function useFpsReporter(): (fps: number) => void {
  const { reportFps } = useQuality();
  return reportFps;
}

// ============================================================================
// Exports
// ============================================================================

export { QualityContext, GAME_PERFORMANCE_BUDGET };
export default QualityProvider;
