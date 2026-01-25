/**
 * WebGL Context Pool Manager
 *
 * Manages a pool of WebGL contexts to prevent context exhaustion and enable
 * context sharing between different 3D scenes. Browsers typically limit the
 * number of active WebGL contexts (usually 8-16), so pooling is essential
 * for applications with multiple canvases.
 *
 * Features:
 * - Context pooling and reuse
 * - Automatic context loss/restoration handling
 * - Maximum context limit enforcement
 * - LRU-based context eviction
 * - Performance metrics tracking
 *
 * @example
 * // Get the singleton pool instance
 * const pool = WebGLContextPool.getInstance();
 *
 * // Acquire a context for a canvas
 * const context = pool.acquire(canvas, { alpha: true });
 *
 * // Release when done (e.g., component unmount)
 * pool.release(canvas);
 *
 * @module 3d/WebGLContextPool
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Context options for WebGL context creation
 */
export interface WebGLContextOptions {
  /** Whether the canvas contains an alpha buffer (default: true) */
  alpha?: boolean;
  /** Whether to perform anti-aliasing (default: true) */
  antialias?: boolean;
  /** Whether to use a depth buffer (default: true) */
  depth?: boolean;
  /** Whether to fail if the system performance is low (default: false) */
  failIfMajorPerformanceCaveat?: boolean;
  /** Whether to use a stencil buffer (default: false) */
  stencil?: boolean;
  /** Whether the drawing buffer should be preserved (default: false) */
  preserveDrawingBuffer?: boolean;
  /** Hint for power preference (default: 'high-performance') */
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  /** Whether to request a desynchronized context for lower latency (default: false) */
  desynchronized?: boolean;
  /** Whether to prefer WebGL 2 (default: true) */
  preferWebGL2?: boolean;
}

/**
 * Pooled context entry
 */
interface PooledContext {
  /** The WebGL context */
  context: WebGLRenderingContext | WebGL2RenderingContext;
  /** The canvas element */
  canvas: HTMLCanvasElement;
  /** Whether this is WebGL 2 */
  isWebGL2: boolean;
  /** Whether the context is currently in use */
  inUse: boolean;
  /** Last access timestamp for LRU eviction */
  lastAccess: number;
  /** Context creation options */
  options: WebGLContextOptions;
  /** Whether context has been lost */
  isLost: boolean;
  /** Context ID for tracking */
  id: number;
}

/**
 * Pool statistics
 */
export interface PoolStats {
  /** Total contexts in pool */
  totalContexts: number;
  /** Contexts currently in use */
  activeContexts: number;
  /** Contexts available for reuse */
  availableContexts: number;
  /** Contexts that have been lost */
  lostContexts: number;
  /** Maximum allowed contexts */
  maxContexts: number;
  /** Number of context acquisitions */
  acquisitions: number;
  /** Number of context releases */
  releases: number;
  /** Number of forced evictions */
  evictions: number;
  /** Number of context restorations */
  restorations: number;
}

/**
 * Event callbacks for pool events
 */
export interface PoolEventCallbacks {
  /** Called when a context is lost */
  onContextLost?: (canvas: HTMLCanvasElement, id: number) => void;
  /** Called when a context is restored */
  onContextRestored?: (canvas: HTMLCanvasElement, id: number) => void;
  /** Called when a context is evicted due to limit */
  onContextEvicted?: (canvas: HTMLCanvasElement, id: number) => void;
  /** Called when pool reaches max capacity */
  onPoolExhausted?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default maximum number of WebGL contexts
 * Most browsers limit to 8-16, so we use a conservative default
 */
const DEFAULT_MAX_CONTEXTS = 8;

/**
 * Default context options
 */
const DEFAULT_CONTEXT_OPTIONS: Required<WebGLContextOptions> = {
  alpha: true,
  antialias: true,
  depth: true,
  failIfMajorPerformanceCaveat: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: 'high-performance',
  desynchronized: false,
  preferWebGL2: true,
};

// ============================================================================
// WebGL Context Pool Implementation
// ============================================================================

/**
 * Singleton WebGL Context Pool Manager
 */
export class WebGLContextPool {
  private static instance: WebGLContextPool | null = null;

  /** Map of canvas element to pooled context */
  private contexts: Map<HTMLCanvasElement, PooledContext> = new Map();

  /** Maximum number of contexts allowed */
  private maxContexts: number;

  /** Auto-incrementing context ID */
  private nextContextId = 1;

  /** Pool statistics */
  private stats: PoolStats = {
    totalContexts: 0,
    activeContexts: 0,
    availableContexts: 0,
    lostContexts: 0,
    maxContexts: DEFAULT_MAX_CONTEXTS,
    acquisitions: 0,
    releases: 0,
    evictions: 0,
    restorations: 0,
  };

  /** Event callbacks */
  private callbacks: PoolEventCallbacks = {};

  /** Context loss handlers by canvas */
  private lossHandlers: WeakMap<HTMLCanvasElement, () => void> = new WeakMap();

  /** Context restore handlers by canvas */
  private restoreHandlers: WeakMap<HTMLCanvasElement, () => void> = new WeakMap();

  /**
   * Private constructor for singleton pattern
   */
  private constructor(maxContexts: number = DEFAULT_MAX_CONTEXTS) {
    this.maxContexts = maxContexts;
    this.stats.maxContexts = maxContexts;
  }

  /**
   * Get the singleton pool instance
   */
  public static getInstance(maxContexts?: number): WebGLContextPool {
    if (!WebGLContextPool.instance) {
      WebGLContextPool.instance = new WebGLContextPool(maxContexts);
    } else if (maxContexts !== undefined && maxContexts !== WebGLContextPool.instance.maxContexts) {
      // Update max contexts if different
      WebGLContextPool.instance.setMaxContexts(maxContexts);
    }
    return WebGLContextPool.instance;
  }

  /**
   * Reset the singleton instance (mainly for testing)
   */
  public static resetInstance(): void {
    if (WebGLContextPool.instance) {
      WebGLContextPool.instance.dispose();
      WebGLContextPool.instance = null;
    }
  }

  /**
   * Set event callbacks
   */
  public setCallbacks(callbacks: PoolEventCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Update maximum contexts allowed
   */
  public setMaxContexts(max: number): void {
    this.maxContexts = Math.max(1, max);
    this.stats.maxContexts = this.maxContexts;

    // Evict excess contexts if over limit
    this.evictExcessContexts();
  }

  /**
   * Acquire a WebGL context for a canvas
   */
  public acquire(
    canvas: HTMLCanvasElement,
    options: WebGLContextOptions = {}
  ): WebGLRenderingContext | WebGL2RenderingContext | null {
    // Check if canvas already has a context
    const existing = this.contexts.get(canvas);
    if (existing) {
      existing.inUse = true;
      existing.lastAccess = Date.now();
      this.stats.acquisitions++;
      this.updateStats();
      return existing.isLost ? null : existing.context;
    }

    // Check if we need to evict contexts
    if (this.contexts.size >= this.maxContexts) {
      const evicted = this.evictLRU();
      if (!evicted) {
        this.callbacks.onPoolExhausted?.();
        return null;
      }
    }

    // Create new context
    const mergedOptions = { ...DEFAULT_CONTEXT_OPTIONS, ...options };
    const context = this.createContext(canvas, mergedOptions);

    if (!context) {
      return null;
    }

    // Create pooled context entry
    const pooled: PooledContext = {
      context,
      canvas,
      isWebGL2: context instanceof WebGL2RenderingContext,
      inUse: true,
      lastAccess: Date.now(),
      options: mergedOptions,
      isLost: false,
      id: this.nextContextId++,
    };

    // Set up event listeners
    this.setupContextListeners(canvas, pooled);

    // Add to pool
    this.contexts.set(canvas, pooled);
    this.stats.acquisitions++;
    this.updateStats();

    return context;
  }

  /**
   * Release a context (mark as available for reuse)
   */
  public release(canvas: HTMLCanvasElement): void {
    const pooled = this.contexts.get(canvas);
    if (pooled) {
      pooled.inUse = false;
      pooled.lastAccess = Date.now();
      this.stats.releases++;
      this.updateStats();
    }
  }

  /**
   * Fully remove a context from the pool
   */
  public remove(canvas: HTMLCanvasElement): void {
    const pooled = this.contexts.get(canvas);
    if (pooled) {
      this.cleanupContext(pooled);
      this.contexts.delete(canvas);
      this.updateStats();
    }
  }

  /**
   * Get a specific context by canvas
   */
  public get(canvas: HTMLCanvasElement): WebGLRenderingContext | WebGL2RenderingContext | null {
    const pooled = this.contexts.get(canvas);
    if (pooled && !pooled.isLost) {
      pooled.lastAccess = Date.now();
      return pooled.context;
    }
    return null;
  }

  /**
   * Check if a canvas has a pooled context
   */
  public has(canvas: HTMLCanvasElement): boolean {
    return this.contexts.has(canvas);
  }

  /**
   * Get pool statistics
   */
  public getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Attempt to restore all lost contexts
   */
  public restoreAllLost(): void {
    for (const [canvas, pooled] of this.contexts) {
      if (pooled.isLost) {
        this.tryRestoreContext(canvas, pooled);
      }
    }
  }

  /**
   * Get all active context IDs
   */
  public getActiveContextIds(): number[] {
    return Array.from(this.contexts.values())
      .filter((p) => p.inUse && !p.isLost)
      .map((p) => p.id);
  }

  /**
   * Dispose all contexts and clean up
   */
  public dispose(): void {
    for (const pooled of this.contexts.values()) {
      this.cleanupContext(pooled);
    }
    this.contexts.clear();
    this.updateStats();
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create a WebGL context
   */
  private createContext(
    canvas: HTMLCanvasElement,
    options: Required<WebGLContextOptions>
  ): WebGLRenderingContext | WebGL2RenderingContext | null {
    // Extract WebGL-specific options
    const contextOptions: WebGLContextAttributes = {
      alpha: options.alpha,
      antialias: options.antialias,
      depth: options.depth,
      failIfMajorPerformanceCaveat: options.failIfMajorPerformanceCaveat,
      stencil: options.stencil,
      preserveDrawingBuffer: options.preserveDrawingBuffer,
      powerPreference: options.powerPreference,
      desynchronized: options.desynchronized,
    };

    // Try WebGL 2 first if preferred
    if (options.preferWebGL2) {
      const gl2 = canvas.getContext('webgl2', contextOptions);
      if (gl2) {
        return gl2;
      }
    }

    // Fall back to WebGL 1
    const gl = canvas.getContext('webgl', contextOptions);
    return gl;
  }

  /**
   * Set up context loss/restore event listeners
   */
  private setupContextListeners(canvas: HTMLCanvasElement, pooled: PooledContext): void {
    const handleContextLost = () => {
      pooled.isLost = true;
      this.stats.lostContexts++;
      this.updateStats();
      this.callbacks.onContextLost?.(canvas, pooled.id);
    };

    const handleContextRestored = () => {
      pooled.isLost = false;
      this.stats.lostContexts = Math.max(0, this.stats.lostContexts - 1);
      this.stats.restorations++;
      this.updateStats();
      this.callbacks.onContextRestored?.(canvas, pooled.id);
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    this.lossHandlers.set(canvas, handleContextLost);
    this.restoreHandlers.set(canvas, handleContextRestored);
  }

  /**
   * Clean up a pooled context
   */
  private cleanupContext(pooled: PooledContext): void {
    const canvas = pooled.canvas;

    // Remove event listeners
    const lossHandler = this.lossHandlers.get(canvas);
    const restoreHandler = this.restoreHandlers.get(canvas);

    if (lossHandler) {
      canvas.removeEventListener('webglcontextlost', lossHandler);
      this.lossHandlers.delete(canvas);
    }

    if (restoreHandler) {
      canvas.removeEventListener('webglcontextrestored', restoreHandler);
      this.restoreHandlers.delete(canvas);
    }

    // Lose context extension to free resources
    const ext = pooled.context.getExtension('WEBGL_lose_context');
    if (ext) {
      ext.loseContext();
    }
  }

  /**
   * Evict the least recently used context
   */
  private evictLRU(): boolean {
    let oldest: PooledContext | null = null;
    let oldestCanvas: HTMLCanvasElement | null = null;

    for (const [canvas, pooled] of this.contexts) {
      // Only evict contexts not in use
      if (!pooled.inUse) {
        if (!oldest || pooled.lastAccess < oldest.lastAccess) {
          oldest = pooled;
          oldestCanvas = canvas;
        }
      }
    }

    if (oldest && oldestCanvas) {
      this.callbacks.onContextEvicted?.(oldestCanvas, oldest.id);
      this.cleanupContext(oldest);
      this.contexts.delete(oldestCanvas);
      this.stats.evictions++;
      this.updateStats();
      return true;
    }

    return false;
  }

  /**
   * Evict contexts if over the maximum limit
   */
  private evictExcessContexts(): void {
    while (this.contexts.size > this.maxContexts) {
      if (!this.evictLRU()) {
        // No contexts available to evict
        break;
      }
    }
  }

  /**
   * Try to restore a lost context
   */
  private tryRestoreContext(_canvas: HTMLCanvasElement, pooled: PooledContext): void {
    const ext = pooled.context.getExtension('WEBGL_lose_context');
    if (ext) {
      try {
        ext.restoreContext();
      } catch {
        // Context restoration may fail, ignore
      }
    }
  }

  /**
   * Update pool statistics
   */
  private updateStats(): void {
    let active = 0;
    let available = 0;
    let lost = 0;

    for (const pooled of this.contexts.values()) {
      if (pooled.isLost) {
        lost++;
      } else if (pooled.inUse) {
        active++;
      } else {
        available++;
      }
    }

    this.stats.totalContexts = this.contexts.size;
    this.stats.activeContexts = active;
    this.stats.availableContexts = available;
    this.stats.lostContexts = lost;
  }
}

// ============================================================================
// React Hook for WebGL Context Pool
// ============================================================================

import { useRef, useEffect, useCallback } from 'react';

/**
 * Hook return type for useWebGLContextPool
 */
export interface UseWebGLContextPoolResult {
  /** Acquire a context for a canvas */
  acquire: (
    canvas: HTMLCanvasElement,
    options?: WebGLContextOptions
  ) => WebGLRenderingContext | WebGL2RenderingContext | null;
  /** Release a context */
  release: (canvas: HTMLCanvasElement) => void;
  /** Get pool statistics */
  getStats: () => PoolStats;
  /** Check if a canvas has a context */
  has: (canvas: HTMLCanvasElement) => boolean;
}

/**
 * React hook for accessing the WebGL context pool
 *
 * @example
 * ```tsx
 * function My3DComponent() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   const { acquire, release } = useWebGLContextPool();
 *
 *   useEffect(() => {
 *     if (canvasRef.current) {
 *       const gl = acquire(canvasRef.current);
 *       // Use gl...
 *       return () => release(canvasRef.current!);
 *     }
 *   }, []);
 *
 *   return <canvas ref={canvasRef} />;
 * }
 * ```
 */
export function useWebGLContextPool(maxContexts?: number): UseWebGLContextPoolResult {
  const poolRef = useRef<WebGLContextPool | null>(null);

  // Initialize pool on first render
  if (!poolRef.current) {
    poolRef.current = WebGLContextPool.getInstance(maxContexts);
  }

  const acquire = useCallback((canvas: HTMLCanvasElement, options?: WebGLContextOptions) => {
    return poolRef.current!.acquire(canvas, options);
  }, []);

  const release = useCallback((canvas: HTMLCanvasElement) => {
    poolRef.current!.release(canvas);
  }, []);

  const getStats = useCallback(() => {
    return poolRef.current!.getStats();
  }, []);

  const has = useCallback((canvas: HTMLCanvasElement) => {
    return poolRef.current!.has(canvas);
  }, []);

  return {
    acquire,
    release,
    getStats,
    has,
  };
}

// ============================================================================
// Canvas Pool Hook for React Three Fiber
// ============================================================================

/**
 * Props for usePooledCanvas
 */
export interface UsePooledCanvasOptions extends WebGLContextOptions {
  /** Callback when context is lost */
  onContextLost?: () => void;
  /** Callback when context is restored */
  onContextRestored?: () => void;
}

/**
 * Hook for managing a pooled canvas in React Three Fiber
 *
 * @example
 * ```tsx
 * function Game3D() {
 *   const { canvasRef, contextReady, isLost } = usePooledCanvas({
 *     antialias: true,
 *     onContextLost: () => console.log('Context lost!'),
 *   });
 *
 *   if (!contextReady) return <div>Loading WebGL...</div>;
 *   if (isLost) return <div>WebGL context lost. Please refresh.</div>;
 *
 *   return (
 *     <Canvas gl={canvasRef.current ? undefined : undefined}>
 *       <Scene />
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function usePooledCanvas(options: UsePooledCanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const [contextReady, setContextReady] = React.useState(false);
  const [isLost, setIsLost] = React.useState(false);

  const pool = useWebGLContextPool();

  const { onContextLost, onContextRestored, ...contextOptions } = options;

  useEffect(() => {
    const pool = WebGLContextPool.getInstance();

    // Set up callbacks
    pool.setCallbacks({
      onContextLost: (canvas) => {
        if (canvas === canvasRef.current) {
          setIsLost(true);
          onContextLost?.();
        }
      },
      onContextRestored: (canvas) => {
        if (canvas === canvasRef.current) {
          setIsLost(false);
          onContextRestored?.();
        }
      },
    });

    return () => {
      // Clean up on unmount
      if (canvasRef.current) {
        pool.release(canvasRef.current);
      }
    };
  }, [onContextLost, onContextRestored]);

  const initCanvas = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (canvas && canvas !== canvasRef.current) {
        // Release old canvas if exists
        if (canvasRef.current) {
          pool.release(canvasRef.current);
        }

        canvasRef.current = canvas;
        const context = pool.acquire(canvas, contextOptions);
        contextRef.current = context;
        setContextReady(!!context);
        setIsLost(!context);
      }
    },
    [pool, contextOptions]
  );

  return {
    canvasRef,
    initCanvas,
    context: contextRef.current,
    contextReady,
    isLost,
    stats: pool.getStats,
  };
}

// Need React for the useState
import React from 'react';

// ============================================================================
// Exports
// ============================================================================

export default WebGLContextPool;
