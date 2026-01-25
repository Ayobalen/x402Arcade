/**
 * Three.js LOD (Level of Detail) System
 *
 * Provides automatic level of detail management for 3D models based on
 * camera distance and device performance. Supports:
 * - Distance-based LOD switching
 * - Performance-based quality adaptation
 * - Smooth LOD transitions
 * - Custom LOD configurations
 *
 * @example
 * ```tsx
 * import { useLODModel } from '@/3d/LODSystem';
 *
 * function Character({ position }) {
 *   const { currentLOD, lodGroup } = useLODModel({
 *     levels: [
 *       { geometry: highDetailGeo, distance: 0 },
 *       { geometry: mediumDetailGeo, distance: 10 },
 *       { geometry: lowDetailGeo, distance: 25 },
 *     ],
 *     material: characterMaterial,
 *     position,
 *   });
 *
 *   return <primitive object={lodGroup} />;
 * }
 * ```
 *
 * @module 3d/LODSystem
 */

import {
  LOD,
  type Object3D,
  Mesh,
  type Camera,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { useRef, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

// ============================================================================
// Types
// ============================================================================

/**
 * LOD level configuration
 */
export interface LODLevel {
  /** Geometry for this LOD level */
  geometry: BufferGeometry;
  /** Distance at which this LOD becomes active */
  distance: number;
  /** Optional custom material for this level */
  material?: Material;
  /** Optional mesh name */
  name?: string;
}

/**
 * LOD configuration
 */
export interface LODConfig {
  /** Array of LOD levels, sorted by distance (nearest first) */
  levels: LODLevel[];
  /** Shared material (used if level doesn't specify its own) */
  material?: Material;
  /** Initial position [x, y, z] */
  position?: [number, number, number];
  /** Enable auto-update on camera move */
  autoUpdate?: boolean;
  /** Hysteresis to prevent flickering (default: 0.5) */
  hysteresis?: number;
}

/**
 * LOD state
 */
export interface LODState {
  /** Currently active LOD level index */
  currentLevel: number;
  /** Distance to camera */
  distance: number;
  /** Whether LOD is currently transitioning */
  transitioning: boolean;
}

/**
 * Quality levels for performance-based LOD
 */
export type QualityLevel = 'ultra' | 'high' | 'medium' | 'low' | 'minimal';

/**
 * Performance-based LOD configuration
 */
export interface PerformanceLODConfig {
  /** Current quality level */
  quality: QualityLevel;
  /** Distance multipliers for each quality level */
  distanceMultipliers?: Record<QualityLevel, number>;
  /** Geometry detail multipliers for each quality level */
  detailMultipliers?: Record<QualityLevel, number>;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default distance multipliers for quality levels
 * Higher multiplier = LOD switches at closer distance
 */
export const DEFAULT_DISTANCE_MULTIPLIERS: Record<QualityLevel, number> = {
  ultra: 1.5, // Use high detail longer
  high: 1.0, // Default
  medium: 0.7, // Switch sooner
  low: 0.5, // Switch much sooner
  minimal: 0.3, // Use lowest detail almost always
};

/**
 * Default detail multipliers for quality levels
 * Used when generating reduced detail geometry
 */
export const DEFAULT_DETAIL_MULTIPLIERS: Record<QualityLevel, number> = {
  ultra: 1.0,
  high: 0.8,
  medium: 0.6,
  low: 0.4,
  minimal: 0.2,
};

/**
 * Preset LOD configurations for common use cases
 */
export const LOD_PRESETS = {
  /** Close-up object (character, interactive items) */
  closeUp: {
    levels: [
      { distance: 0 }, // High detail
      { distance: 5 }, // Medium detail
      { distance: 15 }, // Low detail
      { distance: 30 }, // Billboard or hidden
    ],
    hysteresis: 0.5,
  },
  /** Mid-range object (props, obstacles) */
  midRange: {
    levels: [{ distance: 0 }, { distance: 10 }, { distance: 25 }, { distance: 50 }],
    hysteresis: 1.0,
  },
  /** Far object (background, decorations) */
  background: {
    levels: [{ distance: 0 }, { distance: 20 }, { distance: 50 }, { distance: 100 }],
    hysteresis: 2.0,
  },
  /** Game entity (enemies, projectiles) */
  gameEntity: {
    levels: [{ distance: 0 }, { distance: 8 }, { distance: 20 }],
    hysteresis: 0.3,
  },
} as const;

// ============================================================================
// LOD Manager Class
// ============================================================================

/**
 * Manages LOD for multiple objects in a scene
 */
export class LODManager {
  private lodObjects: Map<string, LOD> = new Map();
  private camera: Camera | null = null;
  private qualityLevel: QualityLevel = 'high';
  private distanceMultipliers: Record<QualityLevel, number>;
  private lastUpdateTime = 0;
  private updateInterval = 100; // ms between LOD updates

  constructor(config?: { quality?: QualityLevel; updateInterval?: number }) {
    this.qualityLevel = config?.quality || 'high';
    this.updateInterval = config?.updateInterval || 100;
    this.distanceMultipliers = { ...DEFAULT_DISTANCE_MULTIPLIERS };
  }

  /**
   * Set the camera for LOD calculations
   */
  setCamera(camera: Camera): void {
    this.camera = camera;
  }

  /**
   * Set the quality level
   */
  setQuality(quality: QualityLevel): void {
    this.qualityLevel = quality;
  }

  /**
   * Register a LOD object
   */
  register(id: string, lod: LOD): void {
    this.lodObjects.set(id, lod);
  }

  /**
   * Unregister a LOD object
   */
  unregister(id: string): void {
    this.lodObjects.delete(id);
  }

  /**
   * Create a LOD object from levels
   */
  createLOD(levels: LODLevel[], sharedMaterial?: Material): LOD {
    const lod = new LOD();
    const multiplier = this.distanceMultipliers[this.qualityLevel];

    for (const level of levels) {
      const mesh = new Mesh(level.geometry, level.material || sharedMaterial);
      mesh.name = level.name || `lod-${level.distance}`;

      // Apply quality-based distance adjustment
      const adjustedDistance = level.distance * multiplier;
      lod.addLevel(mesh, adjustedDistance);
    }

    return lod;
  }

  /**
   * Update all LOD objects
   */
  update(time: number = performance.now()): void {
    // Throttle updates
    if (time - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = time;

    if (!this.camera) return;

    for (const lod of this.lodObjects.values()) {
      lod.update(this.camera);
    }
  }

  /**
   * Force update a specific LOD
   */
  updateOne(id: string): void {
    if (!this.camera) return;

    const lod = this.lodObjects.get(id);
    if (lod) {
      lod.update(this.camera);
    }
  }

  /**
   * Get current LOD level for an object
   */
  getCurrentLevel(id: string): number {
    const lod = this.lodObjects.get(id);
    if (!lod || !this.camera) return -1;

    const distance = lod
      .getWorldPosition(new Vector3())
      .distanceTo(this.camera.getWorldPosition(new Vector3()));

    // Find active level
    const levels = lod.levels;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (distance >= levels[i].distance) {
        return i;
      }
    }

    return 0;
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalObjects: number;
    levelDistribution: number[];
    quality: QualityLevel;
  } {
    const levelDistribution: number[] = [];

    for (const id of this.lodObjects.keys()) {
      const level = this.getCurrentLevel(id);
      if (level >= 0) {
        levelDistribution[level] = (levelDistribution[level] || 0) + 1;
      }
    }

    return {
      totalObjects: this.lodObjects.size,
      levelDistribution,
      quality: this.qualityLevel,
    };
  }

  /**
   * Clear all LOD objects
   */
  clear(): void {
    this.lodObjects.clear();
  }

  /**
   * Dispose all LOD objects
   */
  dispose(): void {
    for (const lod of this.lodObjects.values()) {
      lod.traverse((child) => {
        if (child instanceof Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }
    this.lodObjects.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let lodManagerInstance: LODManager | null = null;

/**
 * Get the global LOD manager instance
 */
export function getLODManager(): LODManager {
  if (!lodManagerInstance) {
    lodManagerInstance = new LODManager();
  }
  return lodManagerInstance;
}

/**
 * Reset the LOD manager (for testing)
 */
export function resetLODManager(): void {
  lodManagerInstance?.dispose();
  lodManagerInstance = null;
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook for using LOD in a component
 */
export function useLOD(config: LODConfig): {
  lodGroup: LOD;
  currentLevel: number;
  distance: number;
} {
  const { camera } = useThree();
  const lodRef = useRef<LOD | null>(null);
  const [state, setState] = useState<LODState>({
    currentLevel: 0,
    distance: 0,
    transitioning: false,
  });

  // Create LOD object
  const lodGroup = useMemo(() => {
    const lod = new LOD();

    for (const level of config.levels) {
      const mesh = new Mesh(level.geometry, level.material || config.material);
      mesh.name = level.name || `lod-${level.distance}`;
      lod.addLevel(mesh, level.distance);
    }

    if (config.position) {
      lod.position.set(...config.position);
    }

    lodRef.current = lod;
    return lod;
  }, [config.levels, config.material, config.position]);

  // Update LOD each frame
  useFrame(() => {
    if (!lodRef.current || !camera) return;

    lodRef.current.update(camera);

    // Calculate distance and current level
    const distance = lodRef.current
      .getWorldPosition(new Vector3())
      .distanceTo(camera.getWorldPosition(new Vector3()));

    const levels = lodRef.current.levels;
    let currentLevel = 0;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (distance >= levels[i].distance) {
        currentLevel = i;
        break;
      }
    }

    setState((prev) => {
      if (prev.currentLevel !== currentLevel || prev.distance !== distance) {
        return { currentLevel, distance, transitioning: false };
      }
      return prev;
    });
  });

  return {
    lodGroup,
    currentLevel: state.currentLevel,
    distance: state.distance,
  };
}

/**
 * Hook for LOD model with automatic registration
 */
export function useLODModel(config: LODConfig & { id?: string }): {
  lodGroup: LOD;
  currentLevel: number;
  distance: number;
} {
  const id = config.id || `lod-${Math.random().toString(36).substr(2, 9)}`;
  const { camera } = useThree();
  const manager = getLODManager();

  // Set camera on manager
  useEffect(() => {
    manager.setCamera(camera);
  }, [camera, manager]);

  const result = useLOD(config);

  // Register with manager
  useEffect(() => {
    manager.register(id, result.lodGroup);
    return () => {
      manager.unregister(id);
    };
  }, [id, result.lodGroup, manager]);

  return result;
}

/**
 * Hook for performance-based LOD quality
 */
export function useAdaptiveLOD(
  baseConfig: LODConfig,
  performanceConfig?: PerformanceLODConfig
): {
  lodGroup: LOD;
  currentLevel: number;
  distance: number;
  quality: QualityLevel;
} {
  const quality = performanceConfig?.quality || 'high';
  const multipliers = {
    ...DEFAULT_DISTANCE_MULTIPLIERS,
    ...performanceConfig?.distanceMultipliers,
  };

  // Adjust distances based on quality
  const adjustedConfig = useMemo<LODConfig>(() => {
    const multiplier = multipliers[quality];

    return {
      ...baseConfig,
      levels: baseConfig.levels.map((level) => ({
        ...level,
        distance: level.distance * multiplier,
      })),
    };
  }, [baseConfig, quality, multipliers]);

  const result = useLOD(adjustedConfig);

  return {
    ...result,
    quality,
  };
}

/**
 * Hook for FPS-based automatic quality adjustment
 */
export function useAutoQuality(
  fpsHistory: number[],
  thresholds: { high: number; medium: number; low: number } = {
    high: 55,
    medium: 40,
    low: 25,
  }
): QualityLevel {
  const [quality, setQuality] = useState<QualityLevel>('high');

  useEffect(() => {
    if (fpsHistory.length < 30) return;

    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

    let newQuality: QualityLevel;
    if (avgFps >= thresholds.high) {
      newQuality = 'high';
    } else if (avgFps >= thresholds.medium) {
      newQuality = 'medium';
    } else if (avgFps >= thresholds.low) {
      newQuality = 'low';
    } else {
      newQuality = 'minimal';
    }

    setQuality(newQuality);
  }, [fpsHistory, thresholds]);

  return quality;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a billboard LOD level (always faces camera)
 */
export function createBillboardLevel(
  geometry: BufferGeometry,
  material: Material,
  _distance: number
): Object3D {
  const mesh = new Mesh(geometry, material);

  // Will be updated to face camera
  mesh.userData.isBillboard = true;

  return mesh;
}

/**
 * Calculate recommended LOD distances based on object size
 */
export function calculateLODDistances(objectSize: number, levelCount: number = 4): number[] {
  const distances: number[] = [];

  for (let i = 0; i < levelCount; i++) {
    // Exponential distance progression
    const factor = Math.pow(2.5, i);
    distances.push(objectSize * factor);
  }

  distances[0] = 0; // First level always at 0

  return distances;
}

/**
 * Get LOD preset by name
 */
export function getLODPreset(
  presetName: keyof typeof LOD_PRESETS
): (typeof LOD_PRESETS)[typeof presetName] {
  return LOD_PRESETS[presetName];
}

// ============================================================================
// Exports
// ============================================================================

// Note: LOD_PRESETS, DEFAULT_DISTANCE_MULTIPLIERS, and DEFAULT_DETAIL_MULTIPLIERS
// are exported inline with their declarations above.

export default {
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
};
