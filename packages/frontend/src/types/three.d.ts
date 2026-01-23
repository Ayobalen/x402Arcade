/**
 * Three.js Type Definitions for x402Arcade
 *
 * This file contains custom TypeScript type definitions for Three.js components
 * and extends the JSX namespace for React Three Fiber compatibility.
 */

import * as THREE from 'three';
import { ReactThreeFiber } from '@react-three/fiber';

// ===== JSX Namespace Extensions =====
// These extensions allow TypeScript to recognize custom Three.js elements in JSX

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Custom geometry elements
      roundedBoxGeometry: ReactThreeFiber.Object3DNode<
        THREE.BufferGeometry,
        typeof THREE.BufferGeometry
      >;
      arcadeCabinetGeometry: ReactThreeFiber.Object3DNode<
        THREE.BufferGeometry,
        typeof THREE.BufferGeometry
      >;

      // Custom material elements
      arcadeScreenMaterial: ReactThreeFiber.MaterialNode<
        THREE.ShaderMaterial,
        [THREE.ShaderMaterialParameters]
      >;
      neonGlowMaterial: ReactThreeFiber.MaterialNode<
        THREE.ShaderMaterial,
        [THREE.ShaderMaterialParameters]
      >;
    }
  }
}

// ===== Custom Geometry Types =====

/**
 * Parameters for creating a rounded box geometry
 */
export interface RoundedBoxGeometryParams {
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  segments?: number;
}

/**
 * Parameters for creating an arcade cabinet geometry
 */
export interface ArcadeCabinetGeometryParams {
  /** Width of the cabinet base */
  width?: number;
  /** Height of the cabinet */
  height?: number;
  /** Depth of the cabinet */
  depth?: number;
  /** Angle of the screen (in radians) */
  screenAngle?: number;
  /** Width of the screen bezel */
  bezelWidth?: number;
}

// ===== Custom Material Types =====

/**
 * Shader uniforms for arcade screen material
 */
export interface ArcadeScreenUniforms {
  /** The game texture to display */
  gameTexture: { value: THREE.Texture | null };
  /** Time for animations */
  time: { value: number };
  /** Screen curvature amount (0-1) */
  curvature: { value: number };
  /** Scanline intensity (0-1) */
  scanlineIntensity: { value: number };
  /** RGB shift amount for chromatic aberration */
  rgbShift: { value: number };
  /** Screen glow color */
  glowColor: { value: THREE.Color };
  /** Screen glow intensity */
  glowIntensity: { value: number };
}

/**
 * Shader uniforms for neon glow material
 */
export interface NeonGlowUniforms {
  /** Base color of the neon */
  color: { value: THREE.Color };
  /** Glow intensity */
  intensity: { value: number };
  /** Pulse speed (cycles per second) */
  pulseSpeed: { value: number };
  /** Time for animations */
  time: { value: number };
  /** Falloff exponent for glow edge */
  falloff: { value: number };
}

/**
 * Parameters for arcade screen material
 */
export interface ArcadeScreenMaterialParams extends THREE.ShaderMaterialParameters {
  gameTexture?: THREE.Texture;
  curvature?: number;
  scanlineIntensity?: number;
  rgbShift?: number;
  glowColor?: THREE.Color | string | number;
  glowIntensity?: number;
}

/**
 * Parameters for neon glow material
 */
export interface NeonGlowMaterialParams extends THREE.ShaderMaterialParameters {
  color?: THREE.Color | string | number;
  intensity?: number;
  pulseSpeed?: number;
  falloff?: number;
}

// ===== Arcade Cabinet Types =====

/**
 * Complete arcade cabinet configuration
 */
export interface ArcadeCabinetConfig {
  /** Cabinet geometry parameters */
  geometry: ArcadeCabinetGeometryParams;
  /** Screen material parameters */
  screenMaterial: ArcadeScreenMaterialParams;
  /** Cabinet body color */
  bodyColor: THREE.Color | string | number;
  /** Neon trim color */
  neonColor: THREE.Color | string | number;
  /** Game type displayed on cabinet */
  gameType: 'snake' | 'tetris' | 'pong' | 'breakout' | 'space-invaders';
}

/**
 * Arcade cabinet state
 */
export interface ArcadeCabinetState {
  /** Whether the cabinet is powered on */
  isPoweredOn: boolean;
  /** Whether a game is currently playing */
  isPlaying: boolean;
  /** Current game score (if applicable) */
  currentScore?: number;
  /** Animation state */
  animationState: 'idle' | 'attract' | 'playing' | 'game-over';
}

// ===== Animation Types =====

/**
 * Parameters for floating animation
 */
export interface FloatAnimationParams {
  /** Vertical float distance */
  floatHeight?: number;
  /** Float speed (cycles per second) */
  speed?: number;
  /** Rotation amount (in radians) */
  rotationAmount?: number;
  /** Enable rotation on float */
  enableRotation?: boolean;
}

/**
 * Parameters for glow pulse animation
 */
export interface GlowPulseParams {
  /** Minimum glow intensity */
  minIntensity?: number;
  /** Maximum glow intensity */
  maxIntensity?: number;
  /** Pulse speed (cycles per second) */
  speed?: number;
}

// ===== Scene Types =====

/**
 * Arcade scene configuration
 */
export interface ArcadeSceneConfig {
  /** Background color */
  backgroundColor?: THREE.Color | string | number;
  /** Ambient light intensity */
  ambientIntensity?: number;
  /** Enable bloom effect */
  enableBloom?: boolean;
  /** Bloom intensity */
  bloomIntensity?: number;
  /** Enable stars background */
  enableStars?: boolean;
  /** Star count */
  starCount?: number;
}

/**
 * Camera configuration for arcade scene
 */
export interface ArcadeCameraConfig {
  /** Camera position */
  position: [number, number, number];
  /** Look-at target */
  target?: [number, number, number];
  /** Field of view */
  fov?: number;
  /** Enable orbit controls */
  enableOrbitControls?: boolean;
  /** Auto-rotate speed */
  autoRotateSpeed?: number;
}

// ===== Color Palette Types =====

/**
 * Arcade color palette for consistent theming
 */
export interface ArcadeColorPalette {
  /** Primary neon cyan */
  primary: THREE.Color;
  /** Secondary neon magenta */
  secondary: THREE.Color;
  /** Neon green for success/scores */
  success: THREE.Color;
  /** Neon yellow for warnings */
  warning: THREE.Color;
  /** Neon red for errors/game over */
  error: THREE.Color;
  /** Dark background */
  background: THREE.Color;
  /** Surface/card color */
  surface: THREE.Color;
}

// ===== Utility Types =====

/**
 * Vector3 tuple type
 */
export type Vector3Tuple = [number, number, number];

/**
 * Euler rotation tuple type (x, y, z in radians)
 */
export type EulerTuple = [number, number, number];

/**
 * RGBA color tuple type
 */
export type RGBATuple = [number, number, number, number];

// ===== Export all types =====
export type {
  RoundedBoxGeometryParams as RoundedBoxParams,
  ArcadeCabinetGeometryParams as CabinetGeometryParams,
  ArcadeScreenUniforms as ScreenUniforms,
  NeonGlowUniforms as GlowUniforms,
};
