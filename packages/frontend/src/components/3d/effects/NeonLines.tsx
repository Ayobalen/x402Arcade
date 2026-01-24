/**
 * NeonLines - Decorative neon lines and geometric patterns for scene framing
 *
 * Creates glowing neon lines that frame the scene edges with L-shapes,
 * borders, and geometric patterns. Subtle pulse animation adds life to
 * the static decorations.
 *
 * @module 3d/effects/NeonLines
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// Types
// ============================================================================

export type LinePattern = 'corners' | 'frame' | 'grid' | 'diagonal' | 'custom';

export interface LineSegment {
  /** Starting point [x, y, z] */
  start: [number, number, number];
  /** Ending point [x, y, z] */
  end: [number, number, number];
  /** Line color */
  color?: string;
  /** Line width */
  width?: number;
}

export interface NeonLinesProps {
  /**
   * Pattern type to generate.
   * @default 'corners'
   */
  pattern?: LinePattern;
  /**
   * Width/height of the framed area.
   * @default 20
   */
  size?: number;
  /**
   * Depth (Z position) of the lines.
   * @default -10
   */
  depth?: number;
  /**
   * Line thickness.
   * @default 0.05
   */
  lineWidth?: number;
  /**
   * Primary neon color.
   * @default '#8B5CF6' (purple accent)
   */
  primaryColor?: string;
  /**
   * Secondary neon color (used for some patterns).
   * @default '#06B6D4' (cyan)
   */
  secondaryColor?: string;
  /**
   * Glow intensity.
   * @default 1.5
   */
  glowIntensity?: number;
  /**
   * Overall opacity.
   * @default 0.8
   */
  opacity?: number;
  /**
   * Enable subtle pulse animation.
   * @default true
   */
  enablePulse?: boolean;
  /**
   * Pulse speed (cycles per second).
   * @default 0.5
   */
  pulseSpeed?: number;
  /**
   * Pulse amount (0-1).
   * @default 0.3
   */
  pulseAmount?: number;
  /**
   * Corner bracket size (for 'corners' pattern).
   * @default 3
   */
  bracketSize?: number;
  /**
   * Grid divisions (for 'grid' pattern).
   * @default 5
   */
  gridDivisions?: number;
  /**
   * Custom line segments (overrides pattern).
   */
  customSegments?: LineSegment[];
  /**
   * Render order for layering.
   * @default -100
   */
  renderOrder?: number;
}

export interface NeonLinesHandle {
  /** Get the group reference */
  getGroup: () => THREE.Group | null;
  /** Set global opacity */
  setOpacity: (opacity: number) => void;
  /** Set glow intensity */
  setGlowIntensity: (intensity: number) => void;
  /** Set pulse enabled */
  setPulse: (enabled: boolean) => void;
  /** Reset all animations */
  reset: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SIZE = 20;
const DEFAULT_DEPTH = -10;
const DEFAULT_LINE_WIDTH = 0.05;
const DEFAULT_PRIMARY_COLOR = '#8B5CF6'; // Purple accent
const DEFAULT_SECONDARY_COLOR = '#06B6D4'; // Cyan
const DEFAULT_GLOW_INTENSITY = 1.5;
const DEFAULT_OPACITY = 0.8;
const DEFAULT_PULSE_SPEED = 0.5;
const DEFAULT_PULSE_AMOUNT = 0.3;
const DEFAULT_BRACKET_SIZE = 3;
const DEFAULT_GRID_DIVISIONS = 5;

// ============================================================================
// Utilities
// ============================================================================

/**
 * Generate corner brackets (L-shapes at each corner)
 */
function generateCornerBrackets(
  size: number,
  depth: number,
  bracketSize: number,
  color: string
): LineSegment[] {
  const half = size / 2;
  const segments: LineSegment[] = [];

  // Top-left corner
  segments.push(
    { start: [-half, half, depth], end: [-half + bracketSize, half, depth], color },
    { start: [-half, half, depth], end: [-half, half - bracketSize, depth], color }
  );

  // Top-right corner
  segments.push(
    { start: [half, half, depth], end: [half - bracketSize, half, depth], color },
    { start: [half, half, depth], end: [half, half - bracketSize, depth], color }
  );

  // Bottom-left corner
  segments.push(
    { start: [-half, -half, depth], end: [-half + bracketSize, -half, depth], color },
    { start: [-half, -half, depth], end: [-half, -half + bracketSize, depth], color }
  );

  // Bottom-right corner
  segments.push(
    { start: [half, -half, depth], end: [half - bracketSize, -half, depth], color },
    { start: [half, -half, depth], end: [half, -half + bracketSize, depth], color }
  );

  return segments;
}

/**
 * Generate full frame border
 */
function generateFrame(size: number, depth: number, color: string): LineSegment[] {
  const half = size / 2;

  return [
    // Top
    { start: [-half, half, depth], end: [half, half, depth], color },
    // Right
    { start: [half, half, depth], end: [half, -half, depth], color },
    // Bottom
    { start: [half, -half, depth], end: [-half, -half, depth], color },
    // Left
    { start: [-half, -half, depth], end: [-half, half, depth], color },
  ];
}

/**
 * Generate grid pattern
 */
function generateGrid(
  size: number,
  depth: number,
  divisions: number,
  primaryColor: string,
  secondaryColor: string
): LineSegment[] {
  const half = size / 2;
  const step = size / divisions;
  const segments: LineSegment[] = [];

  // Vertical lines
  for (let i = 0; i <= divisions; i++) {
    const x = -half + i * step;
    const color = i % 2 === 0 ? primaryColor : secondaryColor;
    segments.push({
      start: [x, -half, depth],
      end: [x, half, depth],
      color,
    });
  }

  // Horizontal lines
  for (let i = 0; i <= divisions; i++) {
    const y = -half + i * step;
    const color = i % 2 === 0 ? primaryColor : secondaryColor;
    segments.push({
      start: [-half, y, depth],
      end: [half, y, depth],
      color,
    });
  }

  return segments;
}

/**
 * Generate diagonal cross pattern
 */
function generateDiagonal(size: number, depth: number, color: string): LineSegment[] {
  const half = size / 2;

  return [
    // Diagonal from top-left to bottom-right
    { start: [-half, half, depth], end: [half, -half, depth], color },
    // Diagonal from top-right to bottom-left
    { start: [half, half, depth], end: [-half, -half, depth], color },
  ];
}

// ============================================================================
// Line Component
// ============================================================================

interface NeonLineProps {
  segment: LineSegment;
  lineWidth: number;
  glowIntensity: number;
  opacity: number;
  enablePulse: boolean;
  pulseSpeed: number;
  pulseAmount: number;
  renderOrder: number;
  index: number;
}

function NeonLine({
  segment,
  lineWidth,
  glowIntensity,
  opacity,
  enablePulse,
  pulseSpeed,
  pulseAmount,
  renderOrder,
  index,
}: NeonLineProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeOffset = index * 0.1; // Slightly offset each line's pulse

  // Create tube geometry for the line
  const geometry = useMemo(() => {
    const start = new THREE.Vector3(...segment.start);
    const end = new THREE.Vector3(...segment.end);

    // Create a path from start to end
    const path = new THREE.LineCurve3(start, end);

    // Create tube geometry
    return new THREE.TubeGeometry(path, 1, segment.width || lineWidth, 8, false);
  }, [segment, lineWidth]);

  const color = useMemo(
    () => new THREE.Color(segment.color || DEFAULT_PRIMARY_COLOR),
    [segment.color]
  );

  useFrame((state) => {
    if (!meshRef.current || !enablePulse) return;

    const time = state.clock.getElapsedTime() + timeOffset;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;

    if ('emissiveIntensity' in material) {
      const pulse = 1 - pulseAmount + pulseAmount * Math.sin(time * pulseSpeed * Math.PI * 2);
      material.emissiveIntensity = glowIntensity * pulse;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} renderOrder={renderOrder}>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glowIntensity}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * NeonLines - Decorative neon lines for scene framing
 *
 * Creates glowing geometric line patterns that add visual interest
 * to scene edges and corners. Perfect for cyberpunk/retro aesthetics.
 *
 * @example
 * ```tsx
 * // Corner brackets
 * <NeonLines pattern="corners" />
 *
 * // Full frame
 * <NeonLines pattern="frame" primaryColor="#00ffff" />
 *
 * // Grid pattern
 * <NeonLines pattern="grid" gridDivisions={8} />
 *
 * // Custom segments
 * <NeonLines
 *   pattern="custom"
 *   customSegments={[
 *     { start: [0, 0, 0], end: [5, 5, 0], color: '#ff00ff' }
 *   ]}
 * />
 * ```
 */
export const NeonLines = forwardRef<NeonLinesHandle, NeonLinesProps>(function NeonLines(
  {
    pattern = 'corners',
    size = DEFAULT_SIZE,
    depth = DEFAULT_DEPTH,
    lineWidth = DEFAULT_LINE_WIDTH,
    primaryColor = DEFAULT_PRIMARY_COLOR,
    secondaryColor = DEFAULT_SECONDARY_COLOR,
    glowIntensity = DEFAULT_GLOW_INTENSITY,
    opacity = DEFAULT_OPACITY,
    enablePulse = true,
    pulseSpeed = DEFAULT_PULSE_SPEED,
    pulseAmount = DEFAULT_PULSE_AMOUNT,
    bracketSize = DEFAULT_BRACKET_SIZE,
    gridDivisions = DEFAULT_GRID_DIVISIONS,
    customSegments,
    renderOrder = -100,
  },
  ref
) {
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(opacity);
  const glowIntensityRef = useRef(glowIntensity);
  const pulseEnabledRef = useRef(enablePulse);

  // Generate line segments based on pattern
  const segments = useMemo(() => {
    if (customSegments) return customSegments;

    switch (pattern) {
      case 'corners':
        return generateCornerBrackets(size, depth, bracketSize, primaryColor);
      case 'frame':
        return generateFrame(size, depth, primaryColor);
      case 'grid':
        return generateGrid(size, depth, gridDivisions, primaryColor, secondaryColor);
      case 'diagonal':
        return generateDiagonal(size, depth, primaryColor);
      default:
        return generateCornerBrackets(size, depth, bracketSize, primaryColor);
    }
  }, [
    pattern,
    size,
    depth,
    bracketSize,
    gridDivisions,
    primaryColor,
    secondaryColor,
    customSegments,
  ]);

  // Expose imperative handle
  useImperativeHandle(ref, () => ({
    getGroup: () => groupRef.current,
    setOpacity: (newOpacity: number) => {
      opacityRef.current = Math.max(0, Math.min(1, newOpacity));
    },
    setGlowIntensity: (intensity: number) => {
      glowIntensityRef.current = Math.max(0, intensity);
    },
    setPulse: (enabled: boolean) => {
      pulseEnabledRef.current = enabled;
    },
    reset: () => {
      opacityRef.current = opacity;
      glowIntensityRef.current = glowIntensity;
      pulseEnabledRef.current = enablePulse;
    },
  }));

  return (
    <group ref={groupRef} renderOrder={renderOrder}>
      {segments.map((segment, index) => (
        <NeonLine
          key={`line-${index}`}
          segment={segment}
          lineWidth={lineWidth}
          glowIntensity={glowIntensity}
          opacity={opacity}
          enablePulse={enablePulse}
          pulseSpeed={pulseSpeed}
          pulseAmount={pulseAmount}
          renderOrder={renderOrder + index}
          index={index}
        />
      ))}
    </group>
  );
});

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations for common neon line styles
 */
export const NEON_LINES_PRESETS = {
  /** Minimal corner brackets */
  corners: {
    pattern: 'corners' as LinePattern,
    bracketSize: 3,
    glowIntensity: 1.5,
    opacity: 0.8,
  },
  /** Full frame border */
  frame: {
    pattern: 'frame' as LinePattern,
    glowIntensity: 1.2,
    opacity: 0.7,
  },
  /** Subtle grid */
  grid: {
    pattern: 'grid' as LinePattern,
    gridDivisions: 8,
    glowIntensity: 0.8,
    opacity: 0.4,
    lineWidth: 0.03,
  },
  /** Cyberpunk style */
  cyberpunk: {
    pattern: 'corners' as LinePattern,
    bracketSize: 4,
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    glowIntensity: 2,
    opacity: 0.9,
    pulseSpeed: 0.8,
  },
  /** Arcade cabinet style */
  arcade: {
    pattern: 'corners' as LinePattern,
    bracketSize: 3,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    glowIntensity: 1.5,
    opacity: 0.8,
  },
  /** Minimal frame */
  minimal: {
    pattern: 'frame' as LinePattern,
    lineWidth: 0.03,
    glowIntensity: 1,
    opacity: 0.5,
    enablePulse: false,
  },
} as const;

export type NeonLinesPreset = keyof typeof NEON_LINES_PRESETS;

/**
 * Get a neon lines preset configuration
 */
export function getNeonLinesPreset(
  preset: NeonLinesPreset
): (typeof NEON_LINES_PRESETS)[NeonLinesPreset] {
  return NEON_LINES_PRESETS[preset];
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseNeonLinesOptions {
  /** Initial preset to use */
  preset?: NeonLinesPreset;
  /** Override preset values */
  overrides?: Partial<NeonLinesProps>;
}

export interface UseNeonLinesResult {
  /** Ref to attach to NeonLines */
  ref: React.RefObject<NeonLinesHandle>;
  /** Props to spread on NeonLines */
  props: Partial<NeonLinesProps>;
  /** Set global opacity */
  setOpacity: (opacity: number) => void;
  /** Set glow intensity */
  setGlowIntensity: (intensity: number) => void;
  /** Set pulse enabled */
  setPulse: (enabled: boolean) => void;
  /** Reset all animations */
  reset: () => void;
}

/**
 * useNeonLines - Hook for controlling NeonLines component
 *
 * @example
 * ```tsx
 * function Scene3D() {
 *   const lines = useNeonLines({ preset: 'cyberpunk' })
 *
 *   // Dim lines when game is active
 *   const handleGameStart = () => {
 *     lines.setOpacity(0.3)
 *   }
 *
 *   return <NeonLines ref={lines.ref} {...lines.props} />
 * }
 * ```
 */
export function useNeonLines(options: UseNeonLinesOptions = {}): UseNeonLinesResult {
  const { preset = 'corners', overrides = {} } = options;

  const ref = useRef<NeonLinesHandle>(null);

  const props = useMemo<Partial<NeonLinesProps>>(() => {
    const presetProps = preset ? NEON_LINES_PRESETS[preset] : {};
    return { ...presetProps, ...overrides };
  }, [preset, overrides]);

  const setOpacity = (opacity: number) => {
    ref.current?.setOpacity(opacity);
  };

  const setGlowIntensity = (intensity: number) => {
    ref.current?.setGlowIntensity(intensity);
  };

  const setPulse = (enabled: boolean) => {
    ref.current?.setPulse(enabled);
  };

  const reset = () => {
    ref.current?.reset();
  };

  return {
    ref,
    props,
    setOpacity,
    setGlowIntensity,
    setPulse,
    reset,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default NeonLines;
