/* eslint-disable no-console */
/**
 * Memory Management Utilities
 *
 * Tools for preventing and detecting memory leaks in the application,
 * with special focus on Three.js resource cleanup, event listener management,
 * and subscription tracking.
 *
 * Common memory leak sources addressed:
 * - Three.js geometries, materials, textures not disposed
 * - Event listeners not removed on cleanup
 * - Subscriptions (Zustand, RxJS) not unsubscribed
 * - Timers and intervals not cleared
 * - Detached DOM nodes from stale references
 *
 * Note: console.* is intentionally used for warning/error logging in this module.
 *
 * @example
 * ```tsx
 * import { useResourceTracker } from '@/utils/memoryManagement';
 *
 * function My3DComponent() {
 *   const tracker = useResourceTracker('My3DComponent');
 *
 *   useEffect(() => {
 *     const geometry = new BoxGeometry();
 *     const material = new MeshBasicMaterial();
 *     tracker.track(geometry, 'geometry');
 *     tracker.track(material, 'material');
 *
 *     return () => {
 *       // All tracked resources are disposed automatically
 *       tracker.disposeAll();
 *     };
 *   }, [tracker]);
 * }
 * ```
 *
 * @module utils/memoryManagement
 */

import type { Material, BufferGeometry, Texture, Object3D } from 'three';

// ============================================================================
// Types
// ============================================================================

/**
 * Disposable resource interface
 */
export interface Disposable {
  dispose: () => void;
}

/**
 * Resource tracking entry
 */
export interface TrackedResource {
  resource: Disposable | (() => void);
  type: string;
  name?: string;
  createdAt: number;
  disposed: boolean;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  trackedResources: number;
  disposedResources: number;
  activeResources: number;
  resourcesByType: Record<string, number>;
  estimatedMemoryMB: number;
  jsHeapSizeMB: number | null;
  jsHeapLimitMB: number | null;
}

/**
 * Three.js specific resource types
 */
export type ThreeResource = Material | BufferGeometry | Texture | Object3D;

/**
 * Subscription cleanup function
 */
export type UnsubscribeFn = () => void;

// ============================================================================
// Resource Tracker Class
// ============================================================================

/**
 * Tracks and manages disposable resources
 */
export class ResourceTracker {
  private resources: Map<Disposable | (() => void), TrackedResource> = new Map();
  private componentName: string;
  private disposed = false;

  constructor(componentName: string) {
    this.componentName = componentName;
  }

  /**
   * Track a disposable resource
   */
  track<T extends Disposable>(resource: T, type: string, name?: string): T {
    if (this.disposed) {
      console.warn(`[ResourceTracker:${this.componentName}] Tracking resource after disposal`);
    }

    this.resources.set(resource, {
      resource,
      type,
      name,
      createdAt: Date.now(),
      disposed: false,
    });

    return resource;
  }

  /**
   * Track a cleanup function
   */
  trackCleanup(cleanupFn: () => void, type: string, name?: string): void {
    this.resources.set(cleanupFn, {
      resource: cleanupFn,
      type,
      name,
      createdAt: Date.now(),
      disposed: false,
    });
  }

  /**
   * Track a Three.js resource
   */
  trackThree<T extends ThreeResource>(resource: T, name?: string): T {
    const type = this.getThreeResourceType(resource);
    return this.track(resource as unknown as Disposable, type, name) as unknown as T;
  }

  /**
   * Track an event listener
   */
  trackEventListener(
    element: EventTarget,
    eventType: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ): UnsubscribeFn {
    element.addEventListener(eventType, handler, options);

    const cleanup = () => {
      element.removeEventListener(eventType, handler, options);
    };

    this.trackCleanup(cleanup, 'eventListener', `${eventType}`);
    return cleanup;
  }

  /**
   * Track a timer (setTimeout)
   */
  trackTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const timerId = setTimeout(callback, delay);

    const cleanup = () => {
      clearTimeout(timerId);
    };

    this.trackCleanup(cleanup, 'timeout', `${delay}ms`);
    return timerId;
  }

  /**
   * Track an interval (setInterval)
   */
  trackInterval(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const timerId = setInterval(callback, delay);

    const cleanup = () => {
      clearInterval(timerId);
    };

    this.trackCleanup(cleanup, 'interval', `${delay}ms`);
    return timerId;
  }

  /**
   * Track a subscription (Zustand, RxJS, etc.)
   */
  trackSubscription(unsubscribe: UnsubscribeFn, name?: string): void {
    this.trackCleanup(unsubscribe, 'subscription', name);
  }

  /**
   * Track an animation frame
   */
  trackAnimationFrame(frameId: number): void {
    const cleanup = () => {
      cancelAnimationFrame(frameId);
    };

    this.trackCleanup(cleanup, 'animationFrame', `${frameId}`);
  }

  /**
   * Dispose a single resource
   */
  dispose(resource: Disposable | (() => void)): void {
    const entry = this.resources.get(resource);
    if (!entry || entry.disposed) return;

    try {
      if (typeof resource === 'function') {
        resource();
      } else {
        resource.dispose();
      }
      entry.disposed = true;
    } catch (error) {
      console.error(
        `[ResourceTracker:${this.componentName}] Error disposing ${entry.type}:`,
        error
      );
    }
  }

  /**
   * Dispose all tracked resources
   */
  disposeAll(): void {
    if (this.disposed) return;

    let errors = 0;

    for (const [resource, entry] of this.resources) {
      if (entry.disposed) continue;

      try {
        if (typeof resource === 'function') {
          resource();
        } else {
          resource.dispose();
        }
        entry.disposed = true;
      } catch {
        errors++;
      }
    }

    this.disposed = true;

    if (errors > 0) {
      console.warn(`[ResourceTracker:${this.componentName}] ${errors} errors during disposal`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    disposed: number;
    active: number;
    byType: Record<string, number>;
  } {
    const byType: Record<string, number> = {};
    let disposed = 0;

    for (const entry of this.resources.values()) {
      if (entry.disposed) {
        disposed++;
      } else {
        byType[entry.type] = (byType[entry.type] || 0) + 1;
      }
    }

    return {
      total: this.resources.size,
      disposed,
      active: this.resources.size - disposed,
      byType,
    };
  }

  /**
   * Get Three.js resource type
   */
  private getThreeResourceType(resource: ThreeResource): string {
    const constructor = resource.constructor.name;
    if (constructor.includes('Geometry')) return 'geometry';
    if (constructor.includes('Material')) return 'material';
    if (constructor.includes('Texture')) return 'texture';
    if (constructor.includes('Mesh') || constructor.includes('Object3D')) return 'object3D';
    return 'threeResource';
  }
}

// ============================================================================
// Three.js Cleanup Utilities
// ============================================================================

/**
 * Recursively dispose all Three.js resources in an object
 */
export function disposeThreeObject(object: Object3D): void {
  object.traverse((child) => {
    // Dispose geometry
    if ('geometry' in child && child.geometry) {
      (child.geometry as BufferGeometry).dispose();
    }

    // Dispose material(s)
    if ('material' in child) {
      const material = child.material as Material | Material[];
      if (Array.isArray(material)) {
        material.forEach((m) => disposeMaterial(m));
      } else if (material) {
        disposeMaterial(material);
      }
    }
  });

  // Remove from parent
  if (object.parent) {
    object.parent.remove(object);
  }
}

/**
 * Dispose a material and its textures
 */
export function disposeMaterial(material: Material): void {
  // Dispose any textures
  const textureKeys = [
    'map',
    'lightMap',
    'bumpMap',
    'normalMap',
    'displacementMap',
    'roughnessMap',
    'metalnessMap',
    'alphaMap',
    'emissiveMap',
    'envMap',
    'aoMap',
  ];

  for (const key of textureKeys) {
    const texture = (material as unknown as Record<string, unknown>)[key] as Texture | undefined;
    if (texture && typeof texture.dispose === 'function') {
      texture.dispose();
    }
  }

  // Dispose the material itself
  material.dispose();
}

/**
 * Dispose a texture
 */
export function disposeTexture(texture: Texture): void {
  texture.dispose();
}

// ============================================================================
// Memory Monitoring
// ============================================================================

/**
 * Get current memory statistics
 */
export function getMemoryStats(trackers: ResourceTracker[] = []): MemoryStats {
  const resourcesByType: Record<string, number> = {};
  let trackedResources = 0;
  let disposedResources = 0;

  for (const tracker of trackers) {
    const stats = tracker.getStats();
    trackedResources += stats.total;
    disposedResources += stats.disposed;

    for (const [type, count] of Object.entries(stats.byType)) {
      resourcesByType[type] = (resourcesByType[type] || 0) + count;
    }
  }

  // Browser memory info (Chrome-specific)
  let jsHeapSizeMB: number | null = null;
  let jsHeapLimitMB: number | null = null;

  if ('memory' in performance) {
    const memory = (
      performance as unknown as {
        memory: {
          usedJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;
    jsHeapSizeMB = memory.usedJSHeapSize / (1024 * 1024);
    jsHeapLimitMB = memory.jsHeapSizeLimit / (1024 * 1024);
  }

  // Estimate memory usage (very rough)
  const estimatedMemoryMB =
    (resourcesByType['geometry'] || 0) * 0.5 + // ~500KB per geometry
    (resourcesByType['texture'] || 0) * 2 + // ~2MB per texture
    (resourcesByType['material'] || 0) * 0.1; // ~100KB per material

  return {
    trackedResources,
    disposedResources,
    activeResources: trackedResources - disposedResources,
    resourcesByType,
    estimatedMemoryMB,
    jsHeapSizeMB,
    jsHeapLimitMB,
  };
}

/**
 * Log memory warning if heap is above threshold
 */
export function checkMemoryUsage(thresholdMB: number = 100): boolean {
  if ('memory' in performance) {
    const memory = (
      performance as unknown as {
        memory: {
          usedJSHeapSize: number;
        };
      }
    ).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);

    if (usedMB > thresholdMB) {
      console.warn(`[MemoryCheck] High memory usage: ${usedMB.toFixed(1)}MB`);
      return true;
    }
  }

  return false;
}

// ============================================================================
// Leak Detection
// ============================================================================

/**
 * Detect potential memory leaks by tracking object counts
 */
export class LeakDetector {
  private snapshots: Map<string, number>[] = [];
  private maxSnapshots = 10;
  private componentCounts: Map<string, number> = new Map();

  /**
   * Register a component mount
   */
  registerMount(componentName: string): void {
    const count = this.componentCounts.get(componentName) || 0;
    this.componentCounts.set(componentName, count + 1);
  }

  /**
   * Register a component unmount
   */
  registerUnmount(componentName: string): void {
    const count = this.componentCounts.get(componentName) || 0;
    this.componentCounts.set(componentName, Math.max(0, count - 1));
  }

  /**
   * Take a snapshot of current object counts
   */
  takeSnapshot(): void {
    const snapshot = new Map(this.componentCounts);
    this.snapshots.push(snapshot);

    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }
  }

  /**
   * Detect potential leaks by comparing snapshots
   */
  detectLeaks(): Array<{ component: string; growth: number }> {
    if (this.snapshots.length < 2) return [];

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];

    const leaks: Array<{ component: string; growth: number }> = [];

    for (const [component, lastCount] of last) {
      const firstCount = first.get(component) || 0;
      const growth = lastCount - firstCount;

      if (growth > 0) {
        leaks.push({ component, growth });
      }
    }

    return leaks.sort((a, b) => b.growth - a.growth);
  }

  /**
   * Reset detector
   */
  reset(): void {
    this.snapshots = [];
    this.componentCounts.clear();
  }

  /**
   * Get current counts
   */
  getCounts(): Map<string, number> {
    return new Map(this.componentCounts);
  }
}

// Singleton leak detector
export const leakDetector = new LeakDetector();

// ============================================================================
// React Hooks
// ============================================================================

import { useRef, useEffect } from 'react';

/**
 * Hook for resource tracking in components
 */
export function useResourceTracker(componentName: string): ResourceTracker {
  const trackerRef = useRef<ResourceTracker | null>(null);

  if (!trackerRef.current) {
    trackerRef.current = new ResourceTracker(componentName);
  }

  useEffect(() => {
    // Register mount
    leakDetector.registerMount(componentName);

    return () => {
      // Dispose all resources on unmount
      trackerRef.current?.disposeAll();
      leakDetector.registerUnmount(componentName);
    };
  }, [componentName]);

  return trackerRef.current;
}

/**
 * Hook for cleanup on unmount
 */
export function useCleanup(cleanupFn: () => void): void {
  useEffect(() => {
    return cleanupFn;
  }, [cleanupFn]);
}

/**
 * Hook for safe event listener
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  element: EventTarget = window,
  options?: AddEventListenerOptions
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const listener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);
    element.addEventListener(eventType, listener, options);

    return () => {
      element.removeEventListener(eventType, listener, options);
    };
  }, [eventType, element, options]);
}

/**
 * Hook for safe interval
 */
export function useSafeInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Hook for safe timeout
 */
export function useSafeTimeout(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const id = setTimeout(() => savedCallback.current(), delay);
    return () => clearTimeout(id);
  }, [delay]);
}

/**
 * Hook for safe animation frame
 */
export function useAnimationFrame(
  callback: (deltaTime: number) => void,
  active: boolean = true
): void {
  const savedCallback = useRef(callback);
  const previousTimeRef = useRef<number | null>(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) {
      previousTimeRef.current = null;
      return;
    }

    let frameId: number;

    const animate = (time: number) => {
      if (previousTimeRef.current !== null) {
        const deltaTime = time - previousTimeRef.current;
        savedCallback.current(deltaTime);
      }
      previousTimeRef.current = time;
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      previousTimeRef.current = null;
    };
  }, [active]);
}

/**
 * Hook for Three.js object cleanup
 */
export function useThreeCleanup(object: Object3D | null): void {
  useEffect(() => {
    return () => {
      if (object) {
        disposeThreeObject(object);
      }
    };
  }, [object]);
}

/**
 * Hook to get memory statistics
 */
export function useMemoryStats(trackers: ResourceTracker[] = []): MemoryStats {
  const [stats, setStats] = React.useState<MemoryStats>(() => getMemoryStats(trackers));

  useSafeInterval(() => {
    setStats(getMemoryStats(trackers));
  }, 2000);

  return stats;
}

// Need React for useState
import React from 'react';

// ============================================================================
// Exports
// ============================================================================

export default {
  ResourceTracker,
  disposeThreeObject,
  disposeMaterial,
  disposeTexture,
  getMemoryStats,
  checkMemoryUsage,
  LeakDetector,
  leakDetector,
  useResourceTracker,
  useCleanup,
  useEventListener,
  useSafeInterval,
  useSafeTimeout,
  useAnimationFrame,
  useThreeCleanup,
  useMemoryStats,
};
