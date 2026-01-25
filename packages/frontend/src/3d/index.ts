/**
 * 3D Components and utilities using Three.js / React Three Fiber
 *
 * This module exports all 3D-related components, hooks, and utilities
 * for the x402Arcade project.
 *
 * ## Performance Optimization
 *
 * For better bundle size, prefer importing from './imports' instead of
 * `import * as THREE from 'three'`. See `imports.ts` for available exports.
 *
 * @example
 * // Instead of:
 * import * as THREE from 'three';
 * const vec = new THREE.Vector3();
 *
 * // Use:
 * import { Vector3 } from '@/3d/imports';
 * const vec = new Vector3();
 *
 * @module 3d
 */

// ============================================================================
// Three.js Core (for backwards compatibility)
// ============================================================================

// Note: `import * as THREE` is kept for backwards compatibility and for
// components that need the full namespace. For new code, prefer using
// selective imports from './imports' for better tree shaking.
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';

// Re-export Three.js namespace for use in other modules
export { THREE };

// Re-export React Three Fiber components
export { Canvas, useFrame, useThree };

// Re-export commonly used Drei helpers
export { OrbitControls, PerspectiveCamera, Environment };

// Export a simple test to verify Three.js is working
export const isThreeLoaded = typeof THREE.Vector3 !== 'undefined';
export const threeVersion = THREE.REVISION;

// ============================================================================
// Optimized Three.js Imports (for tree shaking)
// ============================================================================

// Re-export commonly used Three.js classes from the optimized imports module
// These allow tree-shaking when not using the full THREE namespace
export {
  // Core Math
  Vector2,
  Vector3,
  Vector4,
  Matrix4,
  Quaternion,
  Euler,
  Color,
  MathUtils,

  // Core Objects
  Object3D,
  Group,
  Mesh,
  InstancedMesh,
  Points,

  // Common Geometry
  BufferGeometry,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,

  // Buffer Attributes
  BufferAttribute,
  Float32BufferAttribute,
  InstancedBufferAttribute,

  // Common Materials
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  ShaderMaterial,

  // Textures
  Texture,
  TextureLoader,
  CanvasTexture,

  // Lighting
  AmbientLight,
  DirectionalLight,
  PointLight,

  // Cameras
  PerspectiveCamera as PerspectiveCameraClass,
  OrthographicCamera,

  // Scene
  Scene,
  Fog,

  // Constants
  AdditiveBlending,
  NormalBlending,
  FrontSide,
  BackSide,
  DoubleSide,
} from './imports';

// ============================================================================
// WebGL Context Pool
// ============================================================================

export {
  WebGLContextPool,
  useWebGLContextPool,
  usePooledCanvas,
  type WebGLContextOptions,
  type PoolStats,
  type PoolEventCallbacks,
  type UseWebGLContextPoolResult,
  type UsePooledCanvasOptions,
} from './WebGLContextPool';

// ============================================================================
// Particle System
// ============================================================================

export {
  ParticlePool,
  useParticlePool,
  calculateParticleLOD,
  DEFAULT_PARTICLE_POOL_CONFIG,
  QUALITY_PARTICLE_LIMITS,
  DEFAULT_LOD_CONFIG,
  type Particle,
  type ParticlePoolConfig,
  type EmitConfig,
  type ParticlePoolStats,
  type ParticleLODConfig,
} from './ParticlePool';

// ============================================================================
// LOD (Level of Detail) System
// ============================================================================

export {
  LODManager,
  getLODManager,
  resetLODManager,
  useLOD,
  useLODModel,
  useAdaptiveLOD,
  useAutoQuality,
  createBillboardLevel,
  calculateLODDistances,
  getLODPreset,
  LOD_PRESETS,
  DEFAULT_DISTANCE_MULTIPLIERS,
  DEFAULT_DETAIL_MULTIPLIERS,
  type LODLevel,
  type LODConfig,
  type LODState,
  type QualityLevel,
  type PerformanceLODConfig,
} from './LODSystem';
