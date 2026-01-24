/**
 * usePerformanceScaling Hook
 *
 * Monitors frame rate and automatically adjusts visual effect quality to maintain
 * smooth performance. Implements progressive degradation strategy where expensive
 * effects are reduced or disabled when FPS drops below thresholds.
 *
 * Features:
 * - Continuous FPS monitoring with rolling average
 * - Configurable quality levels (high, medium, low, minimal)
 * - Automatic quality adjustment based on FPS thresholds
 * - Smooth transitions between quality levels with hysteresis
 * - Manual quality override option
 * - Performance statistics and metrics
 *
 * @example
 * // Basic usage with automatic scaling
 * const { quality, stats } = usePerformanceScaling();
 *
 * @example
 * // With custom thresholds
 * const { quality, settings } = usePerformanceScaling({
 *   highQualityFps: 55,
 *   mediumQualityFps: 40,
 *   lowQualityFps: 25,
 * });
 *
 * @example
 * // With manual override
 * const { quality, setManualQuality } = usePerformanceScaling();
 * setManualQuality('low'); // Force low quality
 *
 * @module hooks/usePerformanceScaling
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Quality level for visual effects
 */
export type QualityLevel = 'high' | 'medium' | 'low' | 'minimal';

/**
 * Performance scaling configuration
 */
export interface PerformanceScalingConfig {
  /**
   * Minimum FPS for high quality (default: 50)
   * Above this FPS, use highest quality settings
   */
  highQualityFps?: number;

  /**
   * Minimum FPS for medium quality (default: 35)
   * Between medium and high FPS thresholds
   */
  mediumQualityFps?: number;

  /**
   * Minimum FPS for low quality (default: 20)
   * Between low and medium FPS thresholds
   */
  lowQualityFps?: number;

  /**
   * Below this FPS, use minimal quality (default: 20)
   */
  minimalQualityFps?: number;

  /**
   * Hysteresis margin to prevent rapid quality switching (default: 3)
   * FPS must change by this amount before switching quality levels
   */
  hysteresis?: number;

  /**
   * Number of frames to average for FPS calculation (default: 60)
   */
  sampleSize?: number;

  /**
   * Whether to enable automatic quality scaling (default: true)
   */
  enabled?: boolean;

  /**
   * Interval in ms to check FPS and adjust quality (default: 2000)
   */
  checkInterval?: number;
}

/**
 * Quality settings for each quality level
 */
export interface QualitySettings {
  /** Enable background glow effects */
  backgroundGlows: boolean;
  /** Glow intensity: 'low' | 'medium' | 'high' */
  glowIntensity: 'low' | 'medium' | 'high';
  /** Enable animated glows */
  animateGlows: boolean;
  /** Enable noise overlay */
  noiseOverlay: boolean;
  /** Noise animation FPS */
  noiseFps: number;
  /** Enable bloom post-processing */
  bloom: boolean;
  /** Bloom preset */
  bloomPreset: 'subtle' | 'moderate' | 'intense' | 'off';
  /** Enable chromatic aberration */
  chromaticAberration: boolean;
  /** Chromatic aberration intensity */
  chromaticAberrationIntensity: number;
  /** Enable vignette effect */
  vignette: boolean;
  /** Vignette intensity */
  vignetteIntensity: number;
  /** Enable scanlines */
  scanlines: boolean;
  /** Scanline opacity */
  scanlinesOpacity: number;
  /** Particle count multiplier (0-1) */
  particleMultiplier: number;
  /** Enable particle animations */
  particleAnimations: boolean;
  /** 3D effect quality */
  effect3dQuality: 'high' | 'medium' | 'low';
}

/**
 * Performance statistics
 */
export interface PerformanceStats {
  /** Current FPS */
  currentFps: number;
  /** Average FPS over last sample period */
  averageFps: number;
  /** Minimum FPS in last sample period */
  minFps: number;
  /** Maximum FPS in last sample period */
  maxFps: number;
  /** Current quality level */
  quality: QualityLevel;
  /** Whether quality was adjusted automatically */
  autoAdjusted: boolean;
  /** Number of quality adjustments made */
  adjustmentCount: number;
}

/**
 * Return value from usePerformanceScaling hook
 */
export interface UsePerformanceScalingResult {
  /** Current quality level */
  quality: QualityLevel;
  /** Quality settings for current level */
  settings: QualitySettings;
  /** Performance statistics */
  stats: PerformanceStats;
  /** Manually set quality level (disables auto-scaling) */
  setManualQuality: (quality: QualityLevel | null) => void;
  /** Re-enable automatic quality scaling */
  enableAutoScaling: () => void;
}

// ============================================================================
// Quality Presets
// ============================================================================

/**
 * Quality settings for each quality level
 */
const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    backgroundGlows: true,
    glowIntensity: 'high',
    animateGlows: true,
    noiseOverlay: true,
    noiseFps: 24,
    bloom: true,
    bloomPreset: 'intense',
    chromaticAberration: true,
    chromaticAberrationIntensity: 0.003,
    vignette: true,
    vignetteIntensity: 0.5,
    scanlines: true,
    scanlinesOpacity: 0.15,
    particleMultiplier: 1.0,
    particleAnimations: true,
    effect3dQuality: 'high',
  },
  medium: {
    backgroundGlows: true,
    glowIntensity: 'medium',
    animateGlows: false, // Disable animations
    noiseOverlay: true,
    noiseFps: 12, // Reduce FPS
    bloom: true,
    bloomPreset: 'moderate',
    chromaticAberration: true,
    chromaticAberrationIntensity: 0.002,
    vignette: true,
    vignetteIntensity: 0.4,
    scanlines: true,
    scanlinesOpacity: 0.1,
    particleMultiplier: 0.6,
    particleAnimations: true,
    effect3dQuality: 'medium',
  },
  low: {
    backgroundGlows: true,
    glowIntensity: 'low',
    animateGlows: false,
    noiseOverlay: true,
    noiseFps: 6, // Very low FPS
    bloom: true,
    bloomPreset: 'subtle',
    chromaticAberration: false, // Disable expensive effect
    chromaticAberrationIntensity: 0,
    vignette: true,
    vignetteIntensity: 0.3,
    scanlines: false, // Disable scanlines
    scanlinesOpacity: 0,
    particleMultiplier: 0.3,
    particleAnimations: false,
    effect3dQuality: 'low',
  },
  minimal: {
    backgroundGlows: false, // Disable all glows
    glowIntensity: 'low',
    animateGlows: false,
    noiseOverlay: false, // Disable noise
    noiseFps: 0,
    bloom: false, // Disable bloom
    bloomPreset: 'off',
    chromaticAberration: false,
    chromaticAberrationIntensity: 0,
    vignette: false, // Disable vignette
    vignetteIntensity: 0,
    scanlines: false,
    scanlinesOpacity: 0,
    particleMultiplier: 0, // No particles
    particleAnimations: false,
    effect3dQuality: 'low',
  },
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<PerformanceScalingConfig> = {
  highQualityFps: 50,
  mediumQualityFps: 35,
  lowQualityFps: 20,
  minimalQualityFps: 20,
  hysteresis: 3,
  sampleSize: 60,
  enabled: true,
  checkInterval: 2000,
};

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Performance scaling hook
 *
 * Monitors FPS and automatically adjusts effect quality to maintain performance.
 */
export function usePerformanceScaling(
  config: PerformanceScalingConfig = {}
): UsePerformanceScalingResult {
  // Merge config with defaults
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  // State
  const [quality, setQuality] = useState<QualityLevel>('high');
  const [manualQuality, setManualQuality] = useState<QualityLevel | null>(null);
  const [stats, setStats] = useState<PerformanceStats>({
    currentFps: 60,
    averageFps: 60,
    minFps: 60,
    maxFps: 60,
    quality: 'high',
    autoAdjusted: false,
    adjustmentCount: 0,
  });

  // Refs for FPS tracking
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const frameIdRef = useRef<number>(0);
  const adjustmentCountRef = useRef<number>(0);
  const lastQualityRef = useRef<QualityLevel>('high');

  /**
   * Calculate FPS from frame times
   */
  const calculateFps = useCallback((frameTimes: number[]): number => {
    if (frameTimes.length === 0) return 60;

    const avgFrameTime =
      frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
    return Math.round(1000 / avgFrameTime);
  }, []);

  /**
   * Determine quality level from FPS with hysteresis
   */
  const determineQuality = useCallback(
    (fps: number, currentQuality: QualityLevel): QualityLevel => {
      const { highQualityFps, mediumQualityFps, lowQualityFps, hysteresis } = fullConfig;

      // Apply hysteresis based on current quality
      const adjustedHighThreshold =
        currentQuality === 'high' ? highQualityFps - hysteresis : highQualityFps;
      const adjustedMediumThreshold =
        currentQuality === 'medium' ? mediumQualityFps - hysteresis : mediumQualityFps;
      const adjustedLowThreshold =
        currentQuality === 'low' ? lowQualityFps - hysteresis : lowQualityFps;

      // Determine new quality
      if (fps >= adjustedHighThreshold) return 'high';
      if (fps >= adjustedMediumThreshold) return 'medium';
      if (fps >= adjustedLowThreshold) return 'low';
      return 'minimal';
    },
    [fullConfig]
  );

  /**
   * FPS measurement loop
   */
  useEffect(() => {
    if (!fullConfig.enabled) return;

    const measureFps = (timestamp: number) => {
      // Calculate frame time
      const frameTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;

      // Add to rolling window
      frameTimesRef.current.push(frameTime);
      if (frameTimesRef.current.length > fullConfig.sampleSize) {
        frameTimesRef.current.shift();
      }

      // Continue loop
      frameIdRef.current = requestAnimationFrame(measureFps);
    };

    frameIdRef.current = requestAnimationFrame(measureFps);

    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [fullConfig.enabled, fullConfig.sampleSize]);

  /**
   * Quality adjustment interval
   */
  useEffect(() => {
    if (!fullConfig.enabled || manualQuality !== null) return;

    const interval = setInterval(() => {
      const frameTimes = frameTimesRef.current;
      if (frameTimes.length === 0) return;

      // Calculate stats
      const currentFps = calculateFps([frameTimes[frameTimes.length - 1]]);
      const averageFps = calculateFps(frameTimes);
      const minFps = Math.min(...frameTimes.map((t) => Math.round(1000 / t)));
      const maxFps = Math.max(...frameTimes.map((t) => Math.round(1000 / t)));

      // Determine new quality
      const newQuality = determineQuality(averageFps, quality);

      // Update quality if changed
      if (newQuality !== quality) {
        setQuality(newQuality);
        adjustmentCountRef.current++;
        lastQualityRef.current = newQuality;
      }

      // Update stats
      setStats({
        currentFps,
        averageFps,
        minFps,
        maxFps,
        quality: newQuality,
        autoAdjusted: newQuality !== lastQualityRef.current,
        adjustmentCount: adjustmentCountRef.current,
      });
    }, fullConfig.checkInterval);

    return () => {
      clearInterval(interval);
    };
  }, [
    fullConfig.enabled,
    fullConfig.checkInterval,
    manualQuality,
    quality,
    calculateFps,
    determineQuality,
  ]);

  /**
   * Handle manual quality override
   */
  const handleSetManualQuality = useCallback((newQuality: QualityLevel | null) => {
    setManualQuality(newQuality);
    if (newQuality !== null) {
      setQuality(newQuality);
    }
  }, []);

  /**
   * Re-enable automatic scaling
   */
  const enableAutoScaling = useCallback(() => {
    setManualQuality(null);
  }, []);

  // Use manual quality if set, otherwise use automatic quality
  const effectiveQuality = manualQuality ?? quality;
  const settings = QUALITY_PRESETS[effectiveQuality];

  return {
    quality: effectiveQuality,
    settings,
    stats,
    setManualQuality: handleSetManualQuality,
    enableAutoScaling,
  };
}

export default usePerformanceScaling;
