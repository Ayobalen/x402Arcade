/**
 * ChromaticAberrationEffect - Chromatic aberration post-processing
 *
 * Simulates lens chromatic aberration (color fringing) for retro CRT
 * screen effects. Creates subtle RGB channel separation at screen edges.
 *
 * @module 3d/effects/ChromaticAberrationEffect
 */

import { forwardRef, useImperativeHandle, useState, useCallback, useMemo } from 'react';
import { EffectComposer, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

export interface ChromaticAberrationEffectProps {
  /**
   * Offset vector controlling RGB channel separation.
   * X = horizontal offset, Y = vertical offset.
   * Higher values = more color fringing.
   * @default [0.001, 0.001]
   */
  offset?: [number, number];
  /**
   * Radial offset (boolean or number).
   * If true/number, effect is stronger at edges than center.
   * Creates authentic CRT-style edge aberration.
   * @default true
   */
  radialModulation?: boolean | number;
  /**
   * Modulation offset for radial effect.
   * Only used if radialModulation is enabled.
   * @default 0.15
   */
  modulationOffset?: number;
  /**
   * Blend function for compositing effect.
   * @default 'NORMAL'
   */
  blendFunction?: 'NORMAL' | 'ADD' | 'MULTIPLY' | 'SCREEN';
  /**
   * Effect opacity (0-1).
   * @default 1.0
   */
  opacity?: number;
  /**
   * Use preset configuration.
   */
  preset?: ChromaticAberrationEffectPreset;
  /**
   * Enable/disable the effect entirely.
   * @default true
   */
  enabled?: boolean;
}

export interface ChromaticAberrationEffectHandle {
  /** Set offset */
  setOffset: (offset: [number, number]) => void;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: ChromaticAberrationEffectPreset) => void;
}

export type ChromaticAberrationEffectPreset =
  | 'subtle'
  | 'moderate'
  | 'strong'
  | 'crt'
  | 'lens'
  | 'off';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OFFSET: [number, number] = [0.001, 0.001];
const DEFAULT_RADIAL_MODULATION = true;
const DEFAULT_MODULATION_OFFSET = 0.15;
const DEFAULT_BLEND_FUNCTION = 'NORMAL';
const DEFAULT_OPACITY = 1.0;

// ============================================================================
// Presets
// ============================================================================

export const CHROMATIC_ABERRATION_EFFECT_PRESETS: Record<
  ChromaticAberrationEffectPreset,
  Partial<ChromaticAberrationEffectProps>
> = {
  subtle: {
    offset: [0.0005, 0.0005],
    radialModulation: true,
    modulationOffset: 0.15,
    blendFunction: 'NORMAL',
    opacity: 0.7,
    enabled: true,
  },
  moderate: {
    offset: [0.001, 0.001],
    radialModulation: true,
    modulationOffset: 0.15,
    blendFunction: 'NORMAL',
    opacity: 1.0,
    enabled: true,
  },
  strong: {
    offset: [0.002, 0.002],
    radialModulation: true,
    modulationOffset: 0.2,
    blendFunction: 'NORMAL',
    opacity: 1.0,
    enabled: true,
  },
  crt: {
    offset: [0.0015, 0.0015],
    radialModulation: true,
    modulationOffset: 0.25,
    blendFunction: 'NORMAL',
    opacity: 0.9,
    enabled: true,
  },
  lens: {
    offset: [0.003, 0.003],
    radialModulation: true,
    modulationOffset: 0.3,
    blendFunction: 'NORMAL',
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
export function getChromaticAberrationEffectPreset(
  preset: ChromaticAberrationEffectPreset
): Partial<ChromaticAberrationEffectProps> {
  return CHROMATIC_ABERRATION_EFFECT_PRESETS[preset];
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
    case 'ADD':
      return BlendFunction.ADD;
    case 'MULTIPLY':
      return BlendFunction.MULTIPLY;
    case 'SCREEN':
      return BlendFunction.SCREEN;
    default:
      return BlendFunction.NORMAL;
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * ChromaticAberrationEffect - Chromatic aberration post-processing wrapper
 *
 * This component wraps the EffectComposer and ChromaticAberration effect
 * from @react-three/postprocessing to create RGB color channel separation
 * for authentic retro CRT screen effects.
 *
 * IMPORTANT: This component must be placed inside a Canvas component
 * from @react-three/fiber.
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <Canvas>
 *   <Scene />
 *   <ChromaticAberrationEffect />
 * </Canvas>
 *
 * // Subtle CRT effect
 * <Canvas>
 *   <Scene />
 *   <ChromaticAberrationEffect preset="crt" />
 * </Canvas>
 *
 * // Strong lens distortion
 * <Canvas>
 *   <Scene />
 *   <ChromaticAberrationEffect preset="lens" />
 * </Canvas>
 *
 * // Custom configuration
 * <Canvas>
 *   <Scene />
 *   <ChromaticAberrationEffect
 *     offset={[0.002, 0.002]}
 *     radialModulation={true}
 *     modulationOffset={0.2}
 *   />
 * </Canvas>
 *
 * // Programmatic control
 * const aberrationRef = useRef<ChromaticAberrationEffectHandle>(null);
 * <ChromaticAberrationEffect ref={aberrationRef} />
 * <button onClick={() => aberrationRef.current?.setOffset([0.003, 0.003])}>
 *   Increase
 * </button>
 * ```
 */
export const ChromaticAberrationEffect = forwardRef<
  ChromaticAberrationEffectHandle,
  ChromaticAberrationEffectProps
>((props, ref) => {
  // Apply preset if provided
  const presetConfig = props.preset
    ? getChromaticAberrationEffectPreset(props.preset)
    : {};
  const finalProps = { ...presetConfig, ...props };

  const {
    offset = DEFAULT_OFFSET,
    radialModulation = DEFAULT_RADIAL_MODULATION,
    modulationOffset = DEFAULT_MODULATION_OFFSET,
    blendFunction = DEFAULT_BLEND_FUNCTION,
    opacity = DEFAULT_OPACITY,
    enabled = true,
  } = finalProps;

  // State for dynamic control
  const [currentOffset, setCurrentOffset] = useState<[number, number]>(offset);
  const [currentOpacity, setCurrentOpacity] = useState(opacity);
  const [isEnabled, setIsEnabled] = useState(enabled);

  // Convert offset array to Vector2
  const offsetVector = useMemo(
    () => new THREE.Vector2(currentOffset[0], currentOffset[1]),
    [currentOffset]
  );

  // Convert blend function string to enum
  const blendFunctionValue = useMemo(
    () => getBlendFunctionValue(blendFunction),
    [blendFunction]
  );

  // Apply preset handler
  const applyPreset = useCallback((preset: ChromaticAberrationEffectPreset) => {
    const presetConfig = getChromaticAberrationEffectPreset(preset);
    if (presetConfig.offset !== undefined) setCurrentOffset(presetConfig.offset);
    if (presetConfig.opacity !== undefined) setCurrentOpacity(presetConfig.opacity);
    if (presetConfig.enabled !== undefined) setIsEnabled(presetConfig.enabled);
  }, []);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    setOffset: (newOffset: [number, number]) => {
      setCurrentOffset(newOffset);
    },
    setOpacity: (newOpacity: number) => {
      setCurrentOpacity(newOpacity);
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
      <ChromaticAberration
        offset={offsetVector}
        radialModulation={radialModulation === true ? true : false}
        modulationOffset={modulationOffset}
        blendFunction={blendFunctionValue}
        opacity={currentOpacity}
      />
    </EffectComposer>
  );
});

ChromaticAberrationEffect.displayName = 'ChromaticAberrationEffect';

// ============================================================================
// Hook for programmatic control
// ============================================================================

export interface UseChromaticAberrationEffectOptions {
  offset?: [number, number];
  opacity?: number;
  preset?: ChromaticAberrationEffectPreset;
}

export interface UseChromaticAberrationEffectResult {
  /** Current offset value */
  offset: [number, number];
  /** Current opacity value */
  opacity: number;
  /** Whether effect is enabled */
  enabled: boolean;
  /** Set offset */
  setOffset: (offset: [number, number]) => void;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Enable/disable effect */
  setEnabled: (enabled: boolean) => void;
  /** Apply preset */
  applyPreset: (preset: ChromaticAberrationEffectPreset) => void;
}

/**
 * Hook for controlling chromatic aberration effect programmatically.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const aberration = useChromaticAberrationEffect({ preset: 'crt' });
 *
 *   return (
 *     <Canvas>
 *       <Scene />
 *       <ChromaticAberrationEffect
 *         offset={aberration.offset}
 *         opacity={aberration.opacity}
 *         enabled={aberration.enabled}
 *       />
 *       <button onClick={() => aberration.applyPreset('strong')}>
 *         Strong Effect
 *       </button>
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function useChromaticAberrationEffect(
  options: UseChromaticAberrationEffectOptions = {}
): UseChromaticAberrationEffectResult {
  const presetConfig = options.preset
    ? getChromaticAberrationEffectPreset(options.preset)
    : {};
  const config = { ...presetConfig, ...options };

  const [offset, setOffset] = useState<[number, number]>(config.offset ?? DEFAULT_OFFSET);
  const [opacity, setOpacity] = useState(config.opacity ?? DEFAULT_OPACITY);
  const [enabled, setEnabled] = useState(true);

  const applyPreset = useCallback((preset: ChromaticAberrationEffectPreset) => {
    const presetConfig = getChromaticAberrationEffectPreset(preset);
    if (presetConfig.offset !== undefined) setOffset(presetConfig.offset);
    if (presetConfig.opacity !== undefined) setOpacity(presetConfig.opacity);
    if (presetConfig.enabled !== undefined) setEnabled(presetConfig.enabled);
  }, []);

  return {
    offset,
    opacity,
    enabled,
    setOffset,
    setOpacity,
    setEnabled,
    applyPreset,
  };
}

export default ChromaticAberrationEffect;
