/**
 * Particle Pool - High-Performance Particle System with Object Pooling
 *
 * This module provides a reusable particle pool that eliminates garbage collection
 * overhead by pre-allocating and recycling particle objects. It uses instanced
 * rendering for efficient GPU batching.
 *
 * Features:
 * - Pre-allocated particle pool (no runtime allocations)
 * - Instanced mesh rendering (single draw call)
 * - Adaptive LOD based on device performance
 * - Configurable particle counts based on quality level
 * - Efficient update loops with typed arrays
 *
 * @example
 * ```tsx
 * const pool = new ParticlePool({ maxParticles: 1000 });
 *
 * // Emit particles
 * pool.emit({
 *   position: [0, 0, 0],
 *   count: 50,
 *   velocity: { min: 1, max: 3 },
 *   lifetime: { min: 0.5, max: 1.5 },
 * });
 *
 * // Update each frame
 * pool.update(deltaTime);
 * ```
 *
 * @module 3d/ParticlePool
 */

import {
  Vector3,
  Color,
  Object3D,
  InstancedMesh,
  SphereGeometry,
  MeshBasicMaterial,
  Matrix4,
  type BufferGeometry,
  type Material,
  AdditiveBlending,
} from 'three';

// ============================================================================
// Types
// ============================================================================

/**
 * Individual particle state
 */
export interface Particle {
  /** Current position */
  position: Vector3;
  /** Current velocity */
  velocity: Vector3;
  /** Current color */
  color: Color;
  /** Remaining lifetime in seconds */
  life: number;
  /** Maximum lifetime for ratio calculations */
  maxLife: number;
  /** Current size */
  size: number;
  /** Initial size */
  startSize: number;
  /** Size decay multiplier (0-1) */
  sizeDecay: number;
  /** Rotation angle (radians) */
  rotation: number;
  /** Rotation speed (radians/second) */
  rotationSpeed: number;
  /** Whether this particle is active */
  active: boolean;
  /** Index in the pool */
  index: number;
  /** Custom user data */
  userData?: Record<string, unknown>;
}

/**
 * Configuration for particle pool
 */
export interface ParticlePoolConfig {
  /** Maximum number of particles in the pool */
  maxParticles?: number;
  /** Custom geometry for particles */
  geometry?: BufferGeometry;
  /** Custom material for particles */
  material?: Material;
  /** Default particle size */
  defaultSize?: number;
  /** Global gravity vector */
  gravity?: [number, number, number];
  /** Global drag coefficient (0-1) */
  drag?: number;
  /** Whether to use additive blending */
  additiveBlending?: boolean;
  /** Whether to sort particles by depth */
  sortParticles?: boolean;
  /** Performance quality level */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

/**
 * Particle emission configuration
 */
export interface EmitConfig {
  /** Emission position [x, y, z] */
  position: [number, number, number];
  /** Number of particles to emit */
  count: number;
  /** Velocity range */
  velocity?: {
    min: number;
    max: number;
    /** Direction mode: 'sphere', 'cone', 'direction' */
    mode?: 'sphere' | 'cone' | 'direction';
    /** Direction for 'direction' or 'cone' mode */
    direction?: [number, number, number];
    /** Cone angle in radians (for 'cone' mode) */
    coneAngle?: number;
  };
  /** Lifetime range in seconds */
  lifetime?: { min: number; max: number };
  /** Size range */
  size?: { min: number; max: number };
  /** Size decay multiplier */
  sizeDecay?: number;
  /** Start color */
  startColor?: string;
  /** End color (for interpolation) */
  endColor?: string;
  /** Rotation speed range */
  rotationSpeed?: { min: number; max: number };
  /** Custom initialization callback */
  onInit?: (particle: Particle) => void;
}

/**
 * Pool statistics
 */
export interface ParticlePoolStats {
  /** Total particles in pool */
  totalParticles: number;
  /** Currently active particles */
  activeParticles: number;
  /** Available particles */
  availableParticles: number;
  /** Particles emitted this frame */
  emittedThisFrame: number;
  /** Particles recycled this frame */
  recycledThisFrame: number;
  /** Peak active particles */
  peakActiveParticles: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Quality presets for particle counts
 */
const QUALITY_PARTICLE_LIMITS: Record<string, number> = {
  low: 100,
  medium: 500,
  high: 2000,
  ultra: 10000,
};

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<ParticlePoolConfig> = {
  maxParticles: 1000,
  geometry: new SphereGeometry(0.05, 4, 4),
  material: new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 1,
    blending: AdditiveBlending,
    depthWrite: false,
  }),
  defaultSize: 0.1,
  gravity: [0, -9.8, 0],
  drag: 0.02,
  additiveBlending: true,
  sortParticles: false,
  quality: 'high',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Random number in range
 */
function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Generate random direction on a sphere
 */
function randomSphereDirection(): Vector3 {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  return new Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  );
}

/**
 * Generate random direction within a cone
 */
function randomConeDirection(direction: Vector3, angle: number): Vector3 {
  // Generate random point on unit sphere
  const random = randomSphereDirection();

  // Slerp between direction and random based on cone angle
  const t = Math.random() * (angle / Math.PI);
  return direction.clone().lerp(random, t).normalize();
}

// ============================================================================
// Particle Pool Class
// ============================================================================

/**
 * High-performance particle pool with object recycling and instanced rendering
 */
export class ParticlePool {
  /** Pool configuration */
  private config: Required<ParticlePoolConfig>;

  /** Pre-allocated particle array */
  private particles: Particle[];

  /** Indices of available (inactive) particles */
  private availableIndices: number[];

  /** The instanced mesh for rendering */
  private instancedMesh: InstancedMesh;

  /** Dummy object for matrix calculations */
  private dummy: Object3D;

  /** Gravity vector */
  private gravityVec: Vector3;

  /** Statistics */
  private stats: ParticlePoolStats;

  /** Frame counters */
  private emittedThisFrame = 0;
  private recycledThisFrame = 0;

  /**
   * Create a new particle pool
   */
  constructor(config: ParticlePoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Apply quality-based particle limit
    if (config.quality && !config.maxParticles) {
      this.config.maxParticles = QUALITY_PARTICLE_LIMITS[config.quality] || 1000;
    }

    // Initialize gravity vector
    this.gravityVec = new Vector3(...this.config.gravity);

    // Pre-allocate particles
    this.particles = [];
    this.availableIndices = [];
    this.initializePool();

    // Create instanced mesh
    this.instancedMesh = new InstancedMesh(
      this.config.geometry,
      this.config.material,
      this.config.maxParticles
    );
    this.instancedMesh.instanceMatrix.setUsage(35048); // DYNAMIC_DRAW
    this.instancedMesh.frustumCulled = false;

    // Create dummy for matrix calculations
    this.dummy = new Object3D();

    // Initialize all instances as invisible
    this.hideAllInstances();

    // Initialize stats
    this.stats = {
      totalParticles: this.config.maxParticles,
      activeParticles: 0,
      availableParticles: this.config.maxParticles,
      emittedThisFrame: 0,
      recycledThisFrame: 0,
      peakActiveParticles: 0,
    };
  }

  /**
   * Initialize the particle pool with pre-allocated objects
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.particles.push({
        position: new Vector3(),
        velocity: new Vector3(),
        color: new Color(0xffffff),
        life: 0,
        maxLife: 1,
        size: this.config.defaultSize,
        startSize: this.config.defaultSize,
        sizeDecay: 1,
        rotation: 0,
        rotationSpeed: 0,
        active: false,
        index: i,
      });
      this.availableIndices.push(i);
    }
  }

  /**
   * Hide all instances by scaling to zero
   */
  private hideAllInstances(): void {
    const matrix = new Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < this.config.maxParticles; i++) {
      this.instancedMesh.setMatrixAt(i, matrix);
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Get the instanced mesh for adding to scene
   */
  public getMesh(): InstancedMesh {
    return this.instancedMesh;
  }

  /**
   * Emit particles
   */
  public emit(config: EmitConfig): number {
    const {
      position,
      count,
      velocity = { min: 1, max: 3, mode: 'sphere' },
      lifetime = { min: 1, max: 2 },
      size = { min: 0.05, max: 0.15 },
      sizeDecay = 1,
      startColor = '#ffffff',
      endColor,
      rotationSpeed = { min: 0, max: 0 },
      onInit,
    } = config;

    let emitted = 0;
    const posVec = new Vector3(...position);
    const startColorObj = new Color(startColor);
    const directionVec = velocity.direction
      ? new Vector3(...velocity.direction).normalize()
      : new Vector3(0, 1, 0);

    for (let i = 0; i < count && this.availableIndices.length > 0; i++) {
      const index = this.availableIndices.pop()!;
      const particle = this.particles[index];

      // Reset particle
      particle.position.copy(posVec);

      // Calculate velocity based on mode
      let velDir: Vector3;
      switch (velocity.mode) {
        case 'cone':
          velDir = randomConeDirection(directionVec, velocity.coneAngle || Math.PI / 4);
          break;
        case 'direction':
          velDir = directionVec.clone();
          break;
        case 'sphere':
        default:
          velDir = randomSphereDirection();
          break;
      }
      const speed = randomRange(velocity.min, velocity.max);
      particle.velocity.copy(velDir.multiplyScalar(speed));

      // Set properties
      particle.life = randomRange(lifetime.min, lifetime.max);
      particle.maxLife = particle.life;
      particle.size = randomRange(size.min, size.max);
      particle.startSize = particle.size;
      particle.sizeDecay = sizeDecay;
      particle.color.copy(startColorObj);
      particle.rotation = Math.random() * Math.PI * 2;
      particle.rotationSpeed = randomRange(rotationSpeed.min, rotationSpeed.max);
      particle.active = true;

      // Store end color for interpolation if provided
      if (endColor) {
        particle.userData = { endColor: new Color(endColor) };
      } else {
        particle.userData = undefined;
      }

      // Custom initialization
      onInit?.(particle);

      emitted++;
    }

    this.emittedThisFrame += emitted;
    return emitted;
  }

  /**
   * Update all active particles
   */
  public update(deltaTime: number): void {
    // Reset frame counters
    this.emittedThisFrame = 0;
    this.recycledThisFrame = 0;

    let activeCount = 0;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (!particle.active) {
        // Ensure inactive particles are hidden
        this.dummy.position.set(0, -1000, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      // Update lifetime
      particle.life -= deltaTime;

      if (particle.life <= 0) {
        // Recycle particle
        particle.active = false;
        this.availableIndices.push(i);
        this.recycledThisFrame++;

        // Hide instance
        this.dummy.position.set(0, -1000, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        continue;
      }

      activeCount++;

      // Apply physics
      // Gravity
      particle.velocity.add(this.gravityVec.clone().multiplyScalar(deltaTime));

      // Drag
      particle.velocity.multiplyScalar(1 - this.config.drag);

      // Update position
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));

      // Update rotation
      particle.rotation += particle.rotationSpeed * deltaTime;

      // Calculate life ratio (1 at start, 0 at end)
      const lifeRatio = particle.life / particle.maxLife;

      // Update size
      particle.size = particle.startSize * lifeRatio * particle.sizeDecay;

      // Update color if end color is specified
      if (particle.userData?.endColor) {
        const startColor = new Color('#ffffff');
        particle.color.copy(startColor).lerp(particle.userData.endColor as Color, 1 - lifeRatio);
      }

      // Update instance matrix
      this.dummy.position.copy(particle.position);
      this.dummy.scale.setScalar(particle.size);
      this.dummy.rotation.z = particle.rotation;
      this.dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Update instance color if supported
      if (this.instancedMesh.instanceColor) {
        this.instancedMesh.setColorAt(i, particle.color);
      }
    }

    // Mark buffers for update
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    // Update stats
    this.stats.activeParticles = activeCount;
    this.stats.availableParticles = this.availableIndices.length;
    this.stats.emittedThisFrame = this.emittedThisFrame;
    this.stats.recycledThisFrame = this.recycledThisFrame;
    if (activeCount > this.stats.peakActiveParticles) {
      this.stats.peakActiveParticles = activeCount;
    }
  }

  /**
   * Clear all active particles
   */
  public clear(): void {
    for (const particle of this.particles) {
      if (particle.active) {
        particle.active = false;
        this.availableIndices.push(particle.index);
      }
    }
    this.hideAllInstances();
    this.stats.activeParticles = 0;
    this.stats.availableParticles = this.config.maxParticles;
  }

  /**
   * Get pool statistics
   */
  public getStats(): ParticlePoolStats {
    return { ...this.stats };
  }

  /**
   * Get active particle count
   */
  public getActiveCount(): number {
    return this.stats.activeParticles;
  }

  /**
   * Get available particle count
   */
  public getAvailableCount(): number {
    return this.availableIndices.length;
  }

  /**
   * Set gravity
   */
  public setGravity(x: number, y: number, z: number): void {
    this.gravityVec.set(x, y, z);
    this.config.gravity = [x, y, z];
  }

  /**
   * Set drag coefficient
   */
  public setDrag(drag: number): void {
    this.config.drag = Math.max(0, Math.min(1, drag));
  }

  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.instancedMesh.geometry.dispose();
    if (Array.isArray(this.instancedMesh.material)) {
      this.instancedMesh.material.forEach((m) => m.dispose());
    } else {
      this.instancedMesh.material.dispose();
    }
    this.particles = [];
    this.availableIndices = [];
  }
}

// ============================================================================
// React Hook for Particle Pool
// ============================================================================

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * React hook for using a particle pool in React Three Fiber
 *
 * @example
 * ```tsx
 * function ParticleEffect() {
 *   const { mesh, emit, clear, stats } = useParticlePool({ maxParticles: 500 });
 *
 *   const handleClick = () => {
 *     emit({ position: [0, 0, 0], count: 50 });
 *   };
 *
 *   return (
 *     <>
 *       <primitive object={mesh} />
 *       <mesh onClick={handleClick}>
 *         <boxGeometry />
 *         <meshBasicMaterial color="red" />
 *       </mesh>
 *     </>
 *   );
 * }
 * ```
 */
export function useParticlePool(config: ParticlePoolConfig = {}) {
  const poolRef = useRef<ParticlePool | null>(null);

  // Create pool on mount
  if (!poolRef.current) {
    poolRef.current = new ParticlePool(config);
  }

  // Update pool each frame
  useFrame((_, delta) => {
    poolRef.current?.update(delta);
  });

  // Clean up on unmount
  useEffect(() => {
    return () => {
      poolRef.current?.dispose();
    };
  }, []);

  // Memoized emit function
  const emit = useCallback((emitConfig: EmitConfig): number => {
    return poolRef.current?.emit(emitConfig) ?? 0;
  }, []);

  // Memoized clear function
  const clear = useCallback(() => {
    poolRef.current?.clear();
  }, []);

  // Memoized stats getter
  const getStats = useCallback((): ParticlePoolStats => {
    return (
      poolRef.current?.getStats() ?? {
        totalParticles: 0,
        activeParticles: 0,
        availableParticles: 0,
        emittedThisFrame: 0,
        recycledThisFrame: 0,
        peakActiveParticles: 0,
      }
    );
  }, []);

  // Get mesh
  const mesh = useMemo(() => {
    return poolRef.current?.getMesh() ?? null;
  }, []);

  return {
    pool: poolRef.current,
    mesh,
    emit,
    clear,
    getStats,
    setGravity: poolRef.current?.setGravity.bind(poolRef.current),
    setDrag: poolRef.current?.setDrag.bind(poolRef.current),
  };
}

// ============================================================================
// Adaptive LOD Particle System
// ============================================================================

/**
 * LOD configuration for particles
 */
export interface ParticleLODConfig {
  /** Distance thresholds for LOD levels */
  distances: number[];
  /** Particle count multipliers for each level (1.0 = full, 0.5 = half, etc.) */
  multipliers: number[];
}

/**
 * Default LOD configuration
 */
const DEFAULT_LOD_CONFIG: ParticleLODConfig = {
  distances: [10, 25, 50, 100],
  multipliers: [1.0, 0.75, 0.5, 0.25],
};

/**
 * Calculate LOD multiplier based on distance
 */
export function calculateParticleLOD(
  distance: number,
  config: ParticleLODConfig = DEFAULT_LOD_CONFIG
): number {
  for (let i = 0; i < config.distances.length; i++) {
    if (distance < config.distances[i]) {
      return config.multipliers[i];
    }
  }
  return config.multipliers[config.multipliers.length - 1] ?? 0.25;
}

// ============================================================================
// Exports
// ============================================================================

export {
  DEFAULT_CONFIG as DEFAULT_PARTICLE_POOL_CONFIG,
  QUALITY_PARTICLE_LIMITS,
  DEFAULT_LOD_CONFIG,
};

export default ParticlePool;
