/**
 * Scanlines - CRT-style scanline overlay effect
 *
 * Creates a retro CRT monitor scanline effect with horizontal lines
 * across the entire screen. Adds authentic retro arcade atmosphere
 * with subtle animation and configurable intensity.
 *
 * @module 3d/effects/Scanlines
 */

import { useRef, useMemo, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

export interface ScanlinesProps {
  /**
   * Opacity of the scanlines (0-1).
   * @default 0.15
   */
  opacity?: number;
  /**
   * Number of horizontal scanlines.
   * Higher values = more lines, finer effect.
   * @default 200
   */
  lineCount?: number;
  /**
   * Line thickness (0-1).
   * 0 = thin lines, 1 = thick lines.
   * @default 0.5
   */
  lineWidth?: number;
  /**
   * Enable subtle scrolling animation.
   * @default true
   */
  enableAnimation?: boolean;
  /**
   * Animation speed (pixels per second).
   * @default 0.5
   */
  animationSpeed?: number;
  /**
   * Scanline color.
   * @default '#000000' (black)
   */
  color?: string;
  /**
   * Distance from camera (Z position).
   * Should be very close to camera to act as overlay.
   * @default -0.1
   */
  distance?: number;
  /**
   * Render order for layering (higher = on top).
   * Should be high to render over other elements.
   * @default 1000
   */
  renderOrder?: number;
  /**
   * Use preset configuration.
   */
  preset?: ScanlinesPreset;
}

export interface ScanlinesHandle {
  /** Get the mesh reference */
  getMesh: () => THREE.Mesh | null;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Set animation enabled state */
  setAnimation: (enabled: boolean) => void;
  /** Get current animation offset */
  getOffset: () => number;
  /** Reset animation to start */
  reset: () => void;
}

export type ScanlinesPreset = 'subtle' | 'classic' | 'intense' | 'minimal' | 'off';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPACITY = 0.15;
const DEFAULT_LINE_COUNT = 200;
const DEFAULT_LINE_WIDTH = 0.5;
const DEFAULT_ANIMATION_SPEED = 0.5;
const DEFAULT_COLOR = '#000000';
const DEFAULT_DISTANCE = -0.1;
const DEFAULT_RENDER_ORDER = 1000;

// ============================================================================
// Presets
// ============================================================================

export const SCANLINES_PRESETS: Record<ScanlinesPreset, Partial<ScanlinesProps>> = {
  subtle: {
    opacity: 0.1,
    lineCount: 150,
    lineWidth: 0.3,
    animationSpeed: 0.3,
  },
  classic: {
    opacity: 0.15,
    lineCount: 200,
    lineWidth: 0.5,
    animationSpeed: 0.5,
  },
  intense: {
    opacity: 0.3,
    lineCount: 300,
    lineWidth: 0.7,
    animationSpeed: 1.0,
  },
  minimal: {
    opacity: 0.05,
    lineCount: 100,
    lineWidth: 0.2,
    animationSpeed: 0.2,
  },
  off: {
    opacity: 0,
    enableAnimation: false,
  },
};

/**
 * Get preset configuration by name.
 */
export function getScanlinesPreset(preset: ScanlinesPreset): Partial<ScanlinesProps> {
  return SCANLINES_PRESETS[preset];
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
  uniform float uOpacity;
  uniform float uLineCount;
  uniform float uLineWidth;
  uniform float uOffset;
  uniform vec3 uColor;

  varying vec2 vUv;

  void main() {
    // Calculate scanline pattern
    float line = mod((vUv.y + uOffset) * uLineCount, 1.0);

    // Create sharp scanline edges based on line width
    float scanline = step(uLineWidth, line);

    // Apply color and opacity
    vec3 color = uColor;
    float alpha = (1.0 - scanline) * uOpacity;

    gl_FragColor = vec4(color, alpha);
  }
`;

// ============================================================================
// Component
// ============================================================================

/**
 * Scanlines - CRT-style scanline overlay effect
 *
 * @example
 * ```tsx
 * // Basic usage with defaults
 * <Scanlines />
 *
 * // Subtle scanlines
 * <Scanlines preset="subtle" />
 *
 * // Custom configuration
 * <Scanlines
 *   opacity={0.2}
 *   lineCount={250}
 *   lineWidth={0.6}
 *   animationSpeed={1.0}
 * />
 *
 * // Static scanlines (no animation)
 * <Scanlines enableAnimation={false} />
 * ```
 */
export const Scanlines = forwardRef<ScanlinesHandle, ScanlinesProps>((props, ref) => {
  // Apply preset if provided
  const presetConfig = props.preset ? getScanlinesPreset(props.preset) : {};
  const finalProps = { ...presetConfig, ...props };

  const {
    opacity = DEFAULT_OPACITY,
    lineCount = DEFAULT_LINE_COUNT,
    lineWidth = DEFAULT_LINE_WIDTH,
    enableAnimation = true,
    animationSpeed = DEFAULT_ANIMATION_SPEED,
    color = DEFAULT_COLOR,
    distance = DEFAULT_DISTANCE,
    renderOrder = DEFAULT_RENDER_ORDER,
  } = finalProps;

  // Refs
  const meshRef = useRef<THREE.Mesh>(null);
  const offsetRef = useRef(0);
  const animationEnabledRef = useRef(enableAnimation);

  // Parse color
  const colorRGB = useMemo(() => {
    const threeColor = new THREE.Color(color);
    return threeColor;
  }, [color]);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uOpacity: { value: opacity },
        uLineCount: { value: lineCount },
        uLineWidth: { value: lineWidth },
        uOffset: { value: 0 },
        uColor: { value: colorRGB },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
  }, [opacity, lineCount, lineWidth, colorRGB]);

  // Animation loop
  useFrame((_state, delta) => {
    if (!meshRef.current || !animationEnabledRef.current) return;

    // Update offset for scrolling animation
    offsetRef.current += (delta * animationSpeed) / lineCount;

    // Keep offset in [0, 1) range
    if (offsetRef.current >= 1) {
      offsetRef.current -= 1;
    }

    // Update shader uniform
    material.uniforms.uOffset.value = offsetRef.current;
  });

  // Imperative handle
  useImperativeHandle(ref, () => ({
    getMesh: () => meshRef.current,
    setOpacity: (newOpacity: number) => {
      material.uniforms.uOpacity.value = newOpacity;
    },
    setAnimation: (enabled: boolean) => {
      animationEnabledRef.current = enabled;
    },
    getOffset: () => offsetRef.current,
    reset: () => {
      offsetRef.current = 0;
      material.uniforms.uOffset.value = 0;
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

Scanlines.displayName = 'Scanlines';

// ============================================================================
// Hook for programmatic control
// ============================================================================

export interface UseScanlinesOptions {
  opacity?: number;
  lineCount?: number;
  lineWidth?: number;
  enableAnimation?: boolean;
  animationSpeed?: number;
  preset?: ScanlinesPreset;
}

export interface UseScanlinesResult {
  /** Current opacity value */
  opacity: number;
  /** Current line count */
  lineCount: number;
  /** Current line width */
  lineWidth: number;
  /** Whether animation is enabled */
  enableAnimation: boolean;
  /** Current animation speed */
  animationSpeed: number;
  /** Set opacity */
  setOpacity: (opacity: number) => void;
  /** Set line count */
  setLineCount: (count: number) => void;
  /** Set line width */
  setLineWidth: (width: number) => void;
  /** Toggle animation */
  toggleAnimation: () => void;
  /** Set animation speed */
  setAnimationSpeed: (speed: number) => void;
  /** Apply preset */
  applyPreset: (preset: ScanlinesPreset) => void;
}

/**
 * Hook for controlling scanlines programmatically.
 *
 * @example
 * ```tsx
 * function MyScene() {
 *   const scanlines = useScanlines({ preset: 'classic' });
 *
 *   return (
 *     <>
 *       <Scanlines
 *         opacity={scanlines.opacity}
 *         lineCount={scanlines.lineCount}
 *         enableAnimation={scanlines.enableAnimation}
 *       />
 *       <button onClick={() => scanlines.applyPreset('intense')}>
 *         Intense Mode
 *       </button>
 *     </>
 *   );
 * }
 * ```
 */
export function useScanlines(options: UseScanlinesOptions = {}): UseScanlinesResult {
  const presetConfig = options.preset ? getScanlinesPreset(options.preset) : {};
  const config = { ...presetConfig, ...options };

  const [opacity, setOpacity] = useState(config.opacity ?? DEFAULT_OPACITY);
  const [lineCount, setLineCount] = useState(config.lineCount ?? DEFAULT_LINE_COUNT);
  const [lineWidth, setLineWidth] = useState(config.lineWidth ?? DEFAULT_LINE_WIDTH);
  const [enableAnimation, setEnableAnimation] = useState(config.enableAnimation ?? true);
  const [animationSpeed, setAnimationSpeed] = useState(
    config.animationSpeed ?? DEFAULT_ANIMATION_SPEED
  );

  const toggleAnimation = useCallback(() => {
    setEnableAnimation((prev) => !prev);
  }, []);

  const applyPreset = useCallback((preset: ScanlinesPreset) => {
    const presetConfig = getScanlinesPreset(preset);
    if (presetConfig.opacity !== undefined) setOpacity(presetConfig.opacity);
    if (presetConfig.lineCount !== undefined) setLineCount(presetConfig.lineCount);
    if (presetConfig.lineWidth !== undefined) setLineWidth(presetConfig.lineWidth);
    if (presetConfig.enableAnimation !== undefined)
      setEnableAnimation(presetConfig.enableAnimation);
    if (presetConfig.animationSpeed !== undefined) setAnimationSpeed(presetConfig.animationSpeed);
  }, []);

  return {
    opacity,
    lineCount,
    lineWidth,
    enableAnimation,
    animationSpeed,
    setOpacity,
    setLineCount,
    setLineWidth,
    toggleAnimation,
    setAnimationSpeed,
    applyPreset,
  };
}

export default Scanlines;
