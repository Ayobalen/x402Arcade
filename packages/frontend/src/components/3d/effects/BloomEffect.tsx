/**
 * BloomEffect - Post-processing bloom effect
 *
 * Implements bloom/glow post-processing using @react-three/postprocessing
 * to make emissive materials glow realistically. Adds dramatic neon-style
 * lighting to the arcade scene.
 *
 * @module 3d/effects/BloomEffect
 */

import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

// ============================================================================
// Types
// ============================================================================

export interface BloomEffectProps {
  /**
   * Overall bloom intensity (0-10).
   * Higher values create stronger glow.
   * @default 1.0
   */
  intensity?: number;
  /**
   * Luminance threshold (0-1).
   * Only pixels brighter than this threshold will bloom.
   * Lower = more pixels bloom, Higher = only brightest pixels bloom.
   * @default 0.9
   */
  threshold?: number;
  /**
   * Smoothness of threshold cutoff (0-1).
   * Creates a smooth transition between blooming and non-blooming areas.
   * @default 0.3
   */
  smoothing?: number;
  /**
   * Bloom radius/size.
   * Larger values spread glow further.
   * @default 0.5
   */
  radius?: number;
  /**
   * Kernel size for blur algorithm.
   * Larger = better quality but lower performance.
   * @default 'LARGE'
   */
  kernelSize?: 'VERY_SMALL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'VERY_LARGE' | 'HUGE';
  /**
   * Blend function for compositing bloom over scene.
   * @default 'ADD'
   */
  blendFunction?: 'ADD' | 'SCREEN' | 'NORMAL';
  /**
   * Number of mipmaps for multi-resolution bloom.
   * More mipmaps = softer, more diffuse glow.
   * @default 5
   */
  mipmapBlur?: boolean;
  /**
   * Luminance color for bloom calculation.
   * Affects which colors bloom more intensely.
   * @default undefined (uses default luminance)
   */
  luminanceColor?: string;
  /**
   * Use preset configuration.
   */
  preset?: BloomEffectPreset;
  /**
   * Enable/disable the effect entirely.
   * @default true
   */
  enabled?: boolean;
}

export interface BloomEffectHandle {
  /** Set intensity */
  setIntensity: (intensity: number) => void;
  /** Set threshold */
  setThreshold: (threshold: number) => void;
  /** Set radius */
  setRadius: (radius: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: BloomEffectPreset) => void;
}

export type BloomEffectPreset =
  | 'subtle'
  | 'moderate'
  | 'intense'
  | 'neon'
  | 'arcade'
  | 'dramatic'
  | 'off';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_INTENSITY = 1.0;
const DEFAULT_THRESHOLD = 0.9;
const DEFAULT_SMOOTHING = 0.3;
const DEFAULT_RADIUS = 0.5;
const DEFAULT_KERNEL_SIZE = 'LARGE';
const DEFAULT_BLEND_FUNCTION = 'ADD';
const DEFAULT_MIPMAP_BLUR = true;

// ============================================================================
// Presets
// ============================================================================

export const BLOOM_EFFECT_PRESETS: Record<BloomEffectPreset, Partial<BloomEffectProps>> = {
  subtle: {
    intensity: 0.5,
    threshold: 0.95,
    smoothing: 0.2,
    radius: 0.3,
    kernelSize: 'MEDIUM',
    blendFunction: 'ADD',
    mipmapBlur: true,
    enabled: true,
  },
  moderate: {
    intensity: 1.0,
    threshold: 0.9,
    smoothing: 0.3,
    radius: 0.5,
    kernelSize: 'LARGE',
    blendFunction: 'ADD',
    mipmapBlur: true,
    enabled: true,
  },
  intense: {
    intensity: 2.0,
    threshold: 0.85,
    smoothing: 0.4,
    radius: 0.7,
    kernelSize: 'LARGE',
    blendFunction: 'ADD',
    mipmapBlur: true,
    enabled: true,
  },
  neon: {
    intensity: 2.5,
    threshold: 0.8,
    smoothing: 0.5,
    radius: 0.8,
    kernelSize: 'LARGE',
    blendFunction: 'SCREEN',
    mipmapBlur: true,
    enabled: true,
  },
  arcade: {
    intensity: 3.0,
    threshold: 0.75,
    smoothing: 0.6,
    radius: 1.0,
    kernelSize: 'VERY_LARGE',
    blendFunction: 'ADD',
    mipmapBlur: true,
    enabled: true,
  },
  dramatic: {
    intensity: 4.0,
    threshold: 0.7,
    smoothing: 0.7,
    radius: 1.2,
    kernelSize: 'VERY_LARGE',
    blendFunction: 'ADD',
    mipmapBlur: true,
    enabled: true,
  },
  off: {
    enabled: false,
  },
};

/**
 * Get preset configuration by name.
 */
export function getBloomEffectPreset(preset: BloomEffectPreset): Partial<BloomEffectProps> {
  return BLOOM_EFFECT_PRESETS[preset];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert kernel size string to enum value.
 */
function getKernelSizeValue(size: string): KernelSize {
  switch (size) {
    case 'VERY_SMALL':
      return KernelSize.VERY_SMALL;
    case 'SMALL':
      return KernelSize.SMALL;
    case 'MEDIUM':
      return KernelSize.MEDIUM;
    case 'LARGE':
      return KernelSize.LARGE;
    case 'VERY_LARGE':
      return KernelSize.VERY_LARGE;
    case 'HUGE':
      return KernelSize.HUGE;
    default:
      return KernelSize.LARGE;
  }
}

/**
 * Convert blend function string to enum value.
 */
function getBlendFunctionValue(func: string): BlendFunction {
  switch (func) {
    case 'ADD':
      return BlendFunction.ADD;
    case 'SCREEN':
      return BlendFunction.SCREEN;
    case 'NORMAL':
      return BlendFunction.NORMAL;
    default:
      return BlendFunction.ADD;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * BloomEffect - Bloom post-processing effect wrapper
 *
 * This component wraps the EffectComposer and Bloom effect from
 * @react-three/postprocessing to provide a convenient interface for
 * adding bloom/glow to emissive materials in the scene.
 *
 * IMPORTANT: This component must be placed inside a Canvas component
 * from @react-three/fiber.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <Canvas>
 *   <Scene />
 *   <BloomEffect />
 * </Canvas>
 *
 * // Subtle bloom
 * <Canvas>
 *   <Scene />
 *   <BloomEffect preset="subtle" />
 * </Canvas>
 *
 * // Neon arcade aesthetic
 * <Canvas>
 *   <Scene />
 *   <BloomEffect preset="arcade" />
 * </Canvas>
 *
 * // Custom configuration
 * <Canvas>
 *   <Scene />
 *   <BloomEffect
 *     intensity={2.0}
 *     threshold={0.85}
 *     radius={0.7}
 *     kernelSize="LARGE"
 *   />
 * </Canvas>
 *
 * // Programmatic control
 * const bloomRef = useRef<BloomEffectHandle>(null);
 * <BloomEffect ref={bloomRef} />
 * <button onClick={() => bloomRef.current?.setIntensity(3.0)}>Intensify</button>
 * ```
 */
export const BloomEffect = forwardRef<BloomEffectHandle, BloomEffectProps>((props, ref) => {
  // Apply preset if provided
  const presetConfig = props.preset ? getBloomEffectPreset(props.preset) : {};
  const finalProps = { ...presetConfig, ...props };

  const {
    intensity = DEFAULT_INTENSITY,
    threshold = DEFAULT_THRESHOLD,
    smoothing = DEFAULT_SMOOTHING,
    radius = DEFAULT_RADIUS,
    kernelSize = DEFAULT_KERNEL_SIZE,
    blendFunction = DEFAULT_BLEND_FUNCTION,
    mipmapBlur = DEFAULT_MIPMAP_BLUR,
    enabled = true,
  } = finalProps;

  // State for dynamic control
  const [currentIntensity, setCurrentIntensity] = useState(intensity);
  const [currentThreshold, setCurrentThreshold] = useState(threshold);
  const [currentRadius, setCurrentRadius] = useState(radius);
  const [isEnabled, setIsEnabled] = useState(enabled);

  // Convert string values to enums
  const kernelSizeValue = useMemo(() => getKernelSizeValue(kernelSize), [kernelSize]);
  const blendFunctionValue = useMemo(() => getBlendFunctionValue(blendFunction), [blendFunction]);

  // Apply preset handler
  const applyPreset = useCallback((preset: BloomEffectPreset) => {
    const presetConfig = getBloomEffectPreset(preset);
    if (presetConfig.intensity !== undefined) setCurrentIntensity(presetConfig.intensity);
    if (presetConfig.threshold !== undefined) setCurrentThreshold(presetConfig.threshold);
    if (presetConfig.radius !== undefined) setCurrentRadius(presetConfig.radius);
    if (presetConfig.enabled !== undefined) setIsEnabled(presetConfig.enabled);
  }, []);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    setIntensity: (newIntensity: number) => {
      setCurrentIntensity(newIntensity);
    },
    setThreshold: (newThreshold: number) => {
      setCurrentThreshold(newThreshold);
    },
    setRadius: (newRadius: number) => {
      setCurrentRadius(newRadius);
    },
    setEnabled: (newEnabled: boolean) => {
      setIsEnabled(newEnabled);
    },
    applyPreset,
  }));

  // Don't render if disabled
  if (!isEnabled) {
    return null;
  }

  return (
    <EffectComposer>
      <Bloom
        intensity={currentIntensity}
        luminanceThreshold={currentThreshold}
        luminanceSmoothing={smoothing}
        radius={currentRadius}
        kernelSize={kernelSizeValue}
        blendFunction={blendFunctionValue}
        mipmapBlur={mipmapBlur}
      />
    </EffectComposer>
  );
});

BloomEffect.displayName = 'BloomEffect';

// ============================================================================
// Hook for programmatic control
// ============================================================================

export interface UseBloomEffectOptions {
  intensity?: number;
  threshold?: number;
  radius?: number;
  preset?: BloomEffectPreset;
}

export interface UseBloomEffectResult {
  /** Current intensity value */
  intensity: number;
  /** Current threshold value */
  threshold: number;
  /** Current radius value */
  radius: number;
  /** Whether effect is enabled */
  enabled: boolean;
  /** Set intensity */
  setIntensity: (intensity: number) => void;
  /** Set threshold */
  setThreshold: (threshold: number) => void;
  /** Set radius */
  setRadius: (radius: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: BloomEffectPreset) => void;
}

/**
 * Hook for controlling bloom effect programmatically.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const bloom = useBloomEffect({ preset: 'arcade' });
 *
 *   return (
 *     <Canvas>
 *       <Scene />
 *       <BloomEffect
 *         intensity={bloom.intensity}
 *         threshold={bloom.threshold}
 *         radius={bloom.radius}
 *         enabled={bloom.enabled}
 *       />
 *       <button onClick={() => bloom.applyPreset('dramatic')}>
 *         Dramatic Mode
 *       </button>
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function useBloomEffect(options: UseBloomEffectOptions = {}): UseBloomEffectResult {
  const presetConfig = options.preset ? getBloomEffectPreset(options.preset) : {};
  const config = { ...presetConfig, ...options };

  const [intensity, setIntensity] = useState(config.intensity ?? DEFAULT_INTENSITY);
  const [threshold, setThreshold] = useState(config.threshold ?? DEFAULT_THRESHOLD);
  const [radius, setRadius] = useState(config.radius ?? DEFAULT_RADIUS);
  const [enabled, setEnabled] = useState(true);

  const applyPreset = useCallback((preset: BloomEffectPreset) => {
    const presetConfig = getBloomEffectPreset(preset);
    if (presetConfig.intensity !== undefined) setIntensity(presetConfig.intensity);
    if (presetConfig.threshold !== undefined) setThreshold(presetConfig.threshold);
    if (presetConfig.radius !== undefined) setRadius(presetConfig.radius);
    if (presetConfig.enabled !== undefined) setEnabled(presetConfig.enabled);
  }, []);

  return {
    intensity,
    threshold,
    radius,
    enabled,
    setIntensity,
    setThreshold,
    setRadius,
    setEnabled,
    applyPreset,
  };
}

export default BloomEffect;
