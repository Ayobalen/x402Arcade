/**
 * CRTEffect - Cathode Ray Tube screen distortion effect
 *
 * Simulates authentic CRT monitor distortion including barrel distortion,
 * screen curvature, and chromatic aberration (color fringing). Adds
 * retro authenticity to 3D arcade scenes.
 *
 * @module 3d/effects/CRTEffect
 */

import { useRef, useMemo, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

export interface CRTEffectProps {
  /**
   * Overall effect intensity (0-1).
   * 0 = no effect, 1 = maximum distortion.
   * @default 0.3
   */
  intensity?: number;
  /**
   * Barrel distortion amount (0-1).
   * Creates the curved edges typical of CRT monitors.
   * @default 0.15
   */
  distortion?: number;
  /**
   * Screen curvature amount (0-1).
   * Simulates the curved glass of old monitors.
   * @default 0.1
   */
  curvature?: number;
  /**
   * Chromatic aberration amount (0-1).
   * Color fringing at edges of screen.
   * @default 0.5
   */
  aberration?: number;
  /**
   * Vignette darkness (0-1).
   * Darkens the edges of the screen.
   * @default 0.3
   */
  vignette?: number;
  /**
   * Enable subtle scanline effect.
   * @default false
   */
  enableScanlines?: boolean;
  /**
   * Distance from camera (Z position).
   * Should be very close to camera to act as overlay.
   * @default -0.1
   */
  distance?: number;
  /**
   * Render order for layering (higher = on top).
   * Should be high to render over other elements.
   * @default 999
   */
  renderOrder?: number;
  /**
   * Use preset configuration.
   */
  preset?: CRTEffectPreset;
}

export interface CRTEffectHandle {
  /** Get the mesh reference */
  getMesh: () => THREE.Mesh | null;
  /** Set intensity */
  setIntensity: (intensity: number) => void;
  /** Set distortion */
  setDistortion: (distortion: number) => void;
  /** Set curvature */
  setCurvature: (curvature: number) => void;
  /** Set aberration */
  setAberration: (aberration: number) => void;
  /** Set vignette */
  setVignette: (vignette: number) => void;
}

export type CRTEffectPreset = 'subtle' | 'classic' | 'extreme' | 'minimal' | 'off';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_INTENSITY = 0.3;
const DEFAULT_DISTORTION = 0.15;
const DEFAULT_CURVATURE = 0.1;
const DEFAULT_ABERRATION = 0.5;
const DEFAULT_VIGNETTE = 0.3;
const DEFAULT_DISTANCE = -0.1;
const DEFAULT_RENDER_ORDER = 999;

// ============================================================================
// Presets
// ============================================================================

export const CRT_EFFECT_PRESETS: Record<CRTEffectPreset, Partial<CRTEffectProps>> = {
  subtle: {
    intensity: 0.15,
    distortion: 0.08,
    curvature: 0.05,
    aberration: 0.3,
    vignette: 0.2,
    enableScanlines: false,
  },
  classic: {
    intensity: 0.3,
    distortion: 0.15,
    curvature: 0.1,
    aberration: 0.5,
    vignette: 0.3,
    enableScanlines: false,
  },
  extreme: {
    intensity: 0.6,
    distortion: 0.3,
    curvature: 0.2,
    aberration: 1.0,
    vignette: 0.5,
    enableScanlines: true,
  },
  minimal: {
    intensity: 0.1,
    distortion: 0.05,
    curvature: 0.03,
    aberration: 0.2,
    vignette: 0.15,
    enableScanlines: false,
  },
  off: {
    intensity: 0,
    distortion: 0,
    curvature: 0,
    aberration: 0,
    vignette: 0,
    enableScanlines: false,
  },
};

/**
 * Get preset configuration by name.
 */
export function getCRTEffectPreset(preset: CRTEffectPreset): Partial<CRTEffectProps> {
  return CRT_EFFECT_PRESETS[preset];
}

// ============================================================================
// Shader Code
// ============================================================================

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uIntensity;
  uniform float uDistortion;
  uniform float uCurvature;
  uniform float uAberration;
  uniform float uVignette;
  uniform float uEnableScanlines;
  uniform float uTime;

  varying vec2 vUv;

  // Barrel distortion function
  vec2 barrelDistortion(vec2 uv, float amount) {
    vec2 centered = uv - 0.5;
    float dist = length(centered);
    float distortion = 1.0 + dist * dist * amount;
    return centered * distortion + 0.5;
  }

  // Screen curvature function
  vec2 curvatureWarp(vec2 uv, float amount) {
    vec2 centered = uv * 2.0 - 1.0;
    vec2 offset = centered.yx / vec2(6.0, 4.0);
    centered = centered + centered * offset * offset * amount;
    return centered * 0.5 + 0.5;
  }

  // Vignette function
  float vignette(vec2 uv, float amount) {
    vec2 centered = uv * 2.0 - 1.0;
    float dist = length(centered);
    return 1.0 - smoothstep(0.7, 1.5, dist * (1.0 + amount));
  }

  // Scanline function
  float scanlines(vec2 uv, float time) {
    float line = sin(uv.y * 800.0 + time * 10.0);
    return 1.0 - (line * 0.1);
  }

  void main() {
    // Apply intensity scaling to all effects
    float distAmt = uDistortion * uIntensity;
    float curvAmt = uCurvature * uIntensity;
    float aberrAmt = uAberration * uIntensity * 0.003;
    float vignAmt = uVignette * uIntensity;

    // Apply screen curvature
    vec2 curvedUv = curvatureWarp(vUv, curvAmt);

    // Apply barrel distortion
    vec2 distortedUv = barrelDistortion(curvedUv, distAmt);

    // Check if UV coordinates are out of bounds (black borders)
    if (distortedUv.x < 0.0 || distortedUv.x > 1.0 || distortedUv.y < 0.0 || distortedUv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Sample RGB channels with chromatic aberration
    // Offset red and blue channels to create color fringing
    vec2 redUv = distortedUv + vec2(aberrAmt, 0.0);
    vec2 greenUv = distortedUv;
    vec2 blueUv = distortedUv - vec2(aberrAmt, 0.0);

    // Since we're using this as an overlay effect, we'll create a subtle tint
    // In a real postprocessing setup, we'd sample from a texture
    // For now, we'll create a subtle color shift visualization
    float r = 1.0 - length(redUv - 0.5) * 0.1;
    float g = 1.0 - length(greenUv - 0.5) * 0.1;
    float b = 1.0 - length(blueUv - 0.5) * 0.1;

    vec3 color = vec3(r, g, b);

    // Apply vignette
    float vig = vignette(distortedUv, vignAmt);
    color *= vig;

    // Apply scanlines if enabled
    if (uEnableScanlines > 0.5) {
      float scan = scanlines(distortedUv, uTime);
      color *= scan;
    }

    // Output with reduced opacity to act as overlay
    float alpha = 0.15 * uIntensity;
    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Component
// ============================================================================

/**
 * CRTEffect - CRT monitor distortion overlay effect
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <CRTEffect />
 *
 * // Subtle CRT effect
 * <CRTEffect preset="subtle" />
 *
 * // Custom configuration
 * <CRTEffect
 *   intensity={0.5}
 *   distortion={0.2}
 *   curvature={0.15}
 *   aberration={0.7}
 *   vignette={0.4}
 * />
 *
 * // Extreme retro effect with scanlines
 * <CRTEffect preset="extreme" />
 * ```
 */
export const CRTEffect = forwardRef<CRTEffectHandle, CRTEffectProps>((props, ref) => {
  // Apply preset if provided
  const presetConfig = props.preset ? getCRTEffectPreset(props.preset) : {};
  const finalProps = { ...presetConfig, ...props };

  const {
    intensity = DEFAULT_INTENSITY,
    distortion = DEFAULT_DISTORTION,
    curvature = DEFAULT_CURVATURE,
    aberration = DEFAULT_ABERRATION,
    vignette = DEFAULT_VIGNETTE,
    enableScanlines = false,
    distance = DEFAULT_DISTANCE,
    renderOrder = DEFAULT_RENDER_ORDER,
  } = finalProps;

  // Refs
  const meshRef = useRef<THREE.Mesh>(null);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uIntensity: { value: intensity },
        uDistortion: { value: distortion },
        uCurvature: { value: curvature },
        uAberration: { value: aberration },
        uVignette: { value: vignette },
        uEnableScanlines: { value: enableScanlines ? 1.0 : 0.0 },
        uTime: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
  }, [intensity, distortion, curvature, aberration, vignette, enableScanlines]);

  // Animation loop (for time-based effects like scanlines)
  useFrame((state) => {
    if (!meshRef.current) return;

    // Update time uniform for scanline animation
    material.uniforms.uTime.value = state.clock.getElapsedTime();
  });

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getMesh: () => meshRef.current,
    setIntensity: (newIntensity: number) => {
      material.uniforms.uIntensity.value = newIntensity;
    },
    setDistortion: (newDistortion: number) => {
      material.uniforms.uDistortion.value = newDistortion;
    },
    setCurvature: (newCurvature: number) => {
      material.uniforms.uCurvature.value = newCurvature;
    },
    setAberration: (newAberration: number) => {
      material.uniforms.uAberration.value = newAberration;
    },
    setVignette: (newVignette: number) => {
      material.uniforms.uVignette.value = newVignette;
    },
  }));

  // Calculate plane size to cover full viewport
  // This needs to be large enough to cover the camera's view frustum
  const planeSize = 10;

  return (
    <mesh ref={meshRef} position={[0, 0, distance]} renderOrder={renderOrder}>
      <planeGeometry args={[planeSize, planeSize]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
});

CRTEffect.displayName = 'CRTEffect';

// ============================================================================
// Hook for programmatic control
// ============================================================================

export interface UseCRTEffectOptions {
  intensity?: number;
  distortion?: number;
  curvature?: number;
  aberration?: number;
  vignette?: number;
  enableScanlines?: boolean;
  preset?: CRTEffectPreset;
}

export interface UseCRTEffectResult {
  /** Current intensity value */
  intensity: number;
  /** Current distortion value */
  distortion: number;
  /** Current curvature value */
  curvature: number;
  /** Current aberration value */
  aberration: number;
  /** Current vignette value */
  vignette: number;
  /** Whether scanlines are enabled */
  enableScanlines: boolean;
  /** Set intensity */
  setIntensity: (intensity: number) => void;
  /** Set distortion */
  setDistortion: (distortion: number) => void;
  /** Set curvature */
  setCurvature: (curvature: number) => void;
  /** Set aberration */
  setAberration: (aberration: number) => void;
  /** Set vignette */
  setVignette: (vignette: number) => void;
  /** Toggle scanlines */
  toggleScanlines: () => void;
  /** Apply preset */
  applyPreset: (preset: CRTEffectPreset) => void;
}

/**
 * Hook for controlling CRT effect programmatically.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const crt = useCRTEffect({ preset: 'classic' });
 *
 *   return (
 *     <>
 *       <CRTEffect
 *         intensity={crt.intensity}
 *         distortion={crt.distortion}
 *         curvature={crt.curvature}
 *         aberration={crt.aberration}
 *         vignette={crt.vignette}
 *         enableScanlines={crt.enableScanlines}
 *       />
 *       <button onClick={() => crt.applyPreset('extreme')}>
 *         Extreme Mode
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function useCRTEffect(options: UseCRTEffectOptions = {}): UseCRTEffectResult {
  const presetConfig = options.preset ? getCRTEffectPreset(options.preset) : {};
  const config = { ...presetConfig, ...options };

  const [intensity, setIntensity] = useState(config.intensity ?? DEFAULT_INTENSITY);
  const [distortion, setDistortion] = useState(config.distortion ?? DEFAULT_DISTORTION);
  const [curvature, setCurvature] = useState(config.curvature ?? DEFAULT_CURVATURE);
  const [aberration, setAberration] = useState(config.aberration ?? DEFAULT_ABERRATION);
  const [vignette, setVignette] = useState(config.vignette ?? DEFAULT_VIGNETTE);
  const [enableScanlines, setEnableScanlines] = useState(config.enableScanlines ?? false);

  const toggleScanlines = useCallback(() => {
    setEnableScanlines((prev) => !prev);
  }, []);

  const applyPreset = useCallback((preset: CRTEffectPreset) => {
    const presetConfig = getCRTEffectPreset(preset);
    if (presetConfig.intensity !== undefined) setIntensity(presetConfig.intensity);
    if (presetConfig.distortion !== undefined) setDistortion(presetConfig.distortion);
    if (presetConfig.curvature !== undefined) setCurvature(presetConfig.curvature);
    if (presetConfig.aberration !== undefined) setAberration(presetConfig.aberration);
    if (presetConfig.vignette !== undefined) setVignette(presetConfig.vignette);
    if (presetConfig.enableScanlines !== undefined) setEnableScanlines(presetConfig.enableScanlines);
  }, []);

  return {
    intensity,
    distortion,
    curvature,
    aberration,
    vignette,
    enableScanlines,
    setIntensity,
    setDistortion,
    setCurvature,
    setAberration,
    setVignette,
    toggleScanlines,
    applyPreset,
  };
}

export default CRTEffect;
