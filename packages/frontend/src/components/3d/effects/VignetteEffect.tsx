/**
 * VignetteEffect - Post-processing vignette effect
 *
 * Darkens screen corners to focus attention on the center, creating
 * cinematic framing and depth. Perfect for arcade gaming atmosphere.
 *
 * @module 3d/effects/VignetteEffect
 */

import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import { EffectComposer, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

// ============================================================================
// Types
// ============================================================================

export interface VignetteEffectProps {
  /**
   * Vignette darkness/intensity (0-1).
   * 0 = no effect, 1 = maximum darkness.
   * @default 0.5
   */
  darkness?: number;
  /**
   * Vignette offset from edges (0-1).
   * Lower values = vignette starts closer to edges.
   * Higher values = vignette extends further into center.
   * @default 0.5
   */
  offset?: number;
  /**
   * Blend function for compositing effect.
   * @default 'NORMAL'
   */
  blendFunction?: 'NORMAL' | 'MULTIPLY' | 'DARKEN' | 'OVERLAY';
  /**
   * Effect opacity (0-1).
   * @default 1.0
   */
  opacity?: number;
  /**
   * Use preset configuration.
   */
  preset?: VignetteEffectPreset;
  /**
   * Enable/disable the effect entirely.
   * @default true
   */
  enabled?: boolean;
}

export interface VignetteEffectHandle {
  /** Set darkness/intensity */
  setDarkness: (darkness: number) => void;
  /** Set offset from edges */
  setOffset: (offset: number) => void;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: VignetteEffectPreset) => void;
}

export type VignetteEffectPreset =
  | 'subtle'
  | 'moderate'
  | 'strong'
  | 'cinematic'
  | 'arcade'
  | 'dramatic'
  | 'off';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DARKNESS = 0.5;
const DEFAULT_OFFSET = 0.5;
const DEFAULT_BLEND_FUNCTION = 'NORMAL';
const DEFAULT_OPACITY = 1.0;

// ============================================================================
// Presets
// ============================================================================

export const VIGNETTE_EFFECT_PRESETS: Record<
  VignetteEffectPreset,
  Partial<VignetteEffectProps>
> = {
  subtle: {
    darkness: 0.3,
    offset: 0.5,
    blendFunction: 'NORMAL',
    opacity: 0.8,
    enabled: true,
  },
  moderate: {
    darkness: 0.5,
    offset: 0.5,
    blendFunction: 'NORMAL',
    opacity: 1.0,
    enabled: true,
  },
  strong: {
    darkness: 0.7,
    offset: 0.6,
    blendFunction: 'NORMAL',
    opacity: 1.0,
    enabled: true,
  },
  cinematic: {
    darkness: 0.6,
    offset: 0.4,
    blendFunction: 'MULTIPLY',
    opacity: 1.0,
    enabled: true,
  },
  arcade: {
    darkness: 0.4,
    offset: 0.5,
    blendFunction: 'NORMAL',
    opacity: 0.9,
    enabled: true,
  },
  dramatic: {
    darkness: 0.8,
    offset: 0.7,
    blendFunction: 'MULTIPLY',
    opacity: 1.0,
    enabled: true,
  },
  off: {
    enabled: false,
  },
};

/**
 * Get preset configuration by name.
 */
export function getVignetteEffectPreset(
  preset: VignetteEffectPreset
): Partial<VignetteEffectProps> {
  return VIGNETTE_EFFECT_PRESETS[preset];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert blend function string to enum value.
 */
function getBlendFunctionValue(func: string): BlendFunction {
  switch (func) {
    case 'NORMAL':
      return BlendFunction.NORMAL;
    case 'MULTIPLY':
      return BlendFunction.MULTIPLY;
    case 'DARKEN':
      return BlendFunction.DARKEN;
    case 'OVERLAY':
      return BlendFunction.OVERLAY;
    default:
      return BlendFunction.NORMAL;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * VignetteEffect - Vignette post-processing wrapper
 *
 * This component wraps the EffectComposer and Vignette effect
 * from @react-three/postprocessing to darken screen corners and
 * focus viewer attention on the center.
 *
 * IMPORTANT: This component must be placed inside a Canvas component
 * from @react-three/fiber.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <Canvas>
 *   <Scene />
 *   <VignetteEffect />
 * </Canvas>
 *
 * // Subtle framing
 * <Canvas>
 *   <Scene />
 *   <VignetteEffect preset="subtle" />
 * </Canvas>
 *
 * // Cinematic look
 * <Canvas>
 *   <Scene />
 *   <VignetteEffect preset="cinematic" />
 * </Canvas>
 *
 * // Custom configuration
 * <Canvas>
 *   <Scene />
 *   <VignetteEffect
 *     darkness={0.6}
 *     offset={0.4}
 *     blendFunction="MULTIPLY"
 *   />
 * </Canvas>
 *
 * // Programmatic control
 * const vignetteRef = useRef<VignetteEffectHandle>(null);
 * <VignetteEffect ref={vignetteRef} />
 * <button onClick={() => vignetteRef.current?.setDarkness(0.8)}>
 *   Increase Darkness
 * </button>
 * ```
 */
export const VignetteEffect = forwardRef<VignetteEffectHandle, VignetteEffectProps>(
  (props, ref) => {
    // Apply preset if provided
    const presetConfig = props.preset ? getVignetteEffectPreset(props.preset) : {};
    const finalProps = { ...presetConfig, ...props };

    const {
      darkness = DEFAULT_DARKNESS,
      offset = DEFAULT_OFFSET,
      blendFunction = DEFAULT_BLEND_FUNCTION,
      opacity = DEFAULT_OPACITY,
      enabled = true,
    } = finalProps;

    // State for dynamic control
    const [currentDarkness, setCurrentDarkness] = useState(darkness);
    const [currentOffset, setCurrentOffset] = useState(offset);
    const [currentOpacity, setCurrentOpacity] = useState(opacity);
    const [isEnabled, setIsEnabled] = useState(enabled);

    // Convert blend function string to enum
    const blendFunctionValue = useMemo(
      () => getBlendFunctionValue(blendFunction),
      [blendFunction]
    );

    // Apply preset handler
    const applyPreset = useCallback((preset: VignetteEffectPreset) => {
      const presetConfig = getVignetteEffectPreset(preset);
      if (presetConfig.darkness !== undefined) setCurrentDarkness(presetConfig.darkness);
      if (presetConfig.offset !== undefined) setCurrentOffset(presetConfig.offset);
      if (presetConfig.opacity !== undefined) setCurrentOpacity(presetConfig.opacity);
      if (presetConfig.enabled !== undefined) setIsEnabled(presetConfig.enabled);
    }, []);

    // Imperative handle
    useImperativeHandle(ref, () => ({
      setDarkness: (newDarkness: number) => {
        setCurrentDarkness(Math.max(0, Math.min(1, newDarkness)));
      },
      setOffset: (newOffset: number) => {
        setCurrentOffset(Math.max(0, Math.min(1, newOffset)));
      },
      setOpacity: (newOpacity: number) => {
        setCurrentOpacity(Math.max(0, Math.min(1, newOpacity)));
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
        <Vignette
          darkness={currentDarkness}
          offset={currentOffset}
          blendFunction={blendFunctionValue}
          opacity={currentOpacity}
        />
      </EffectComposer>
    );
  }
);

VignetteEffect.displayName = 'VignetteEffect';

// ============================================================================
// Hook for programmatic control
// ============================================================================

export interface UseVignetteEffectOptions {
  darkness?: number;
  offset?: number;
  opacity?: number;
  preset?: VignetteEffectPreset;
}

export interface UseVignetteEffectResult {
  /** Current darkness value */
  darkness: number;
  /** Current offset value */
  offset: number;
  /** Current opacity value */
  opacity: number;
  /** Whether effect is enabled */
  enabled: boolean;
  /** Set darkness */
  setDarkness: (darkness: number) => void;
  /** Set offset */
  setOffset: (offset: number) => void;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: VignetteEffectPreset) => void;
}

/**
 * Hook for controlling vignette effect programmatically.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const vignette = useVignetteEffect({ preset: 'cinematic' });
 *
 *   return (
 *     <Canvas>
 *       <Scene />
 *       <VignetteEffect
 *         darkness={vignette.darkness}
 *         offset={vignette.offset}
 *         opacity={vignette.opacity}
 *         enabled={vignette.enabled}
 *       />
 *       <button onClick={() => vignette.applyPreset('dramatic')}>
 *         Dramatic Look
 *       </button>
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function useVignetteEffect(
  options: UseVignetteEffectOptions = {}
): UseVignetteEffectResult {
  const presetConfig = options.preset ? getVignetteEffectPreset(options.preset) : {};
  const config = { ...presetConfig, ...options };

  const [darkness, setDarkness] = useState(config.darkness ?? DEFAULT_DARKNESS);
  const [offset, setOffset] = useState(config.offset ?? DEFAULT_OFFSET);
  const [opacity, setOpacity] = useState(config.opacity ?? DEFAULT_OPACITY);
  const [enabled, setEnabled] = useState(true);

  const applyPreset = useCallback((preset: VignetteEffectPreset) => {
    const presetConfig = getVignetteEffectPreset(preset);
    if (presetConfig.darkness !== undefined) setDarkness(presetConfig.darkness);
    if (presetConfig.offset !== undefined) setOffset(presetConfig.offset);
    if (presetConfig.opacity !== undefined) setOpacity(presetConfig.opacity);
    if (presetConfig.enabled !== undefined) setEnabled(presetConfig.enabled);
  }, []);

  return {
    darkness,
    offset,
    opacity,
    enabled,
    setDarkness,
    setOffset,
    setOpacity,
    setEnabled,
    applyPreset,
  };
}

export default VignetteEffect;
