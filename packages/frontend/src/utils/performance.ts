/**
 * Performance Optimization Utilities
 *
 * This module provides utilities for optimizing 3D game performance:
 * - Object pooling for reusable effects
 * - Effect throttling to limit expensive operations
 * - Texture update batching
 * - Draw call reduction helpers
 *
 * @module utils/performance
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Generic poolable object interface
 */
export interface Poolable {
  /** Whether the object is currently in use */
  active: boolean
  /** Reset the object to its initial state */
  reset: () => void
  /** Initialize the object with new parameters */
  init: (...args: unknown[]) => void
}

/**
 * Object pool configuration
 */
export interface ObjectPoolConfig<T> {
  /** Factory function to create new objects */
  create: () => T
  /** Function to reset an object for reuse */
  reset: (obj: T) => void
  /** Initial pool size (default: 10) */
  initialSize?: number
  /** Maximum pool size (default: 100) */
  maxSize?: number
  /** Whether to auto-expand when pool is exhausted (default: true) */
  autoExpand?: boolean
  /** Growth factor when expanding (default: 2) */
  growthFactor?: number
}

/**
 * Object pool statistics
 */
export interface PoolStats {
  /** Total objects in pool */
  totalSize: number
  /** Currently active objects */
  activeCount: number
  /** Available objects */
  availableCount: number
  /** Number of times pool was expanded */
  expansions: number
  /** Number of allocation requests */
  allocations: number
  /** Number of successful reuses */
  reuses: number
}

/**
 * Throttle configuration
 */
export interface ThrottleConfig {
  /** Minimum interval between calls in ms */
  intervalMs: number
  /** Maximum calls per second (alternative to intervalMs) */
  maxCallsPerSecond?: number
  /** Whether to call on leading edge (default: true) */
  leading?: boolean
  /** Whether to call on trailing edge (default: false) */
  trailing?: boolean
}

/**
 * Batched update configuration
 */
export interface BatchConfig {
  /** Maximum batch size before flush */
  maxBatchSize?: number
  /** Maximum wait time in ms before auto-flush */
  maxWaitMs?: number
}

/**
 * Frame budget configuration for performance tracking
 */
export interface FrameBudgetConfig {
  /** Target frame time in ms (default: 16.67 for 60fps) */
  targetFrameTime?: number
  /** Budget for game logic in ms (default: 4) */
  logicBudget?: number
  /** Budget for rendering in ms (default: 8) */
  renderBudget?: number
  /** Budget for physics in ms (default: 2) */
  physicsBudget?: number
  /** Budget for effects in ms (default: 2) */
  effectsBudget?: number
}

// ============================================================================
// Object Pool
// ============================================================================

/**
 * Generic object pool for reusable objects (particles, effects, etc.)
 *
 * @example
 * ```ts
 * const particlePool = new ObjectPool({
 *   create: () => ({ x: 0, y: 0, active: false }),
 *   reset: (p) => { p.x = 0; p.y = 0; p.active = false; },
 *   initialSize: 100,
 *   maxSize: 500
 * });
 *
 * // Get a particle from the pool
 * const particle = particlePool.acquire();
 * particle.x = 100;
 * particle.y = 50;
 * particle.active = true;
 *
 * // Return particle to pool when done
 * particlePool.release(particle);
 * ```
 */
export class ObjectPool<T> {
  private pool: T[] = []
  private active: Set<T> = new Set()
  private create: () => T
  private resetFn: (obj: T) => void
  private maxSize: number
  private autoExpand: boolean
  private growthFactor: number
  private stats: PoolStats = {
    totalSize: 0,
    activeCount: 0,
    availableCount: 0,
    expansions: 0,
    allocations: 0,
    reuses: 0,
  }

  constructor(config: ObjectPoolConfig<T>) {
    this.create = config.create
    this.resetFn = config.reset
    this.maxSize = config.maxSize ?? 100
    this.autoExpand = config.autoExpand ?? true
    this.growthFactor = config.growthFactor ?? 2

    // Pre-populate pool
    const initialSize = config.initialSize ?? 10
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.create())
    }
    this.stats.totalSize = initialSize
    this.stats.availableCount = initialSize
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T | null {
    this.stats.allocations++

    // Try to reuse from pool
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!
      this.active.add(obj)
      this.stats.activeCount++
      this.stats.availableCount--
      this.stats.reuses++
      return obj
    }

    // Pool is empty - try to expand
    if (this.autoExpand && this.stats.totalSize < this.maxSize) {
      const newSize = Math.min(
        Math.floor(this.stats.totalSize * this.growthFactor),
        this.maxSize
      )
      const toCreate = newSize - this.stats.totalSize

      for (let i = 0; i < toCreate - 1; i++) {
        this.pool.push(this.create())
      }

      // Return the last created object directly
      const obj = this.create()
      this.active.add(obj)
      this.stats.totalSize = newSize
      this.stats.activeCount++
      this.stats.availableCount = this.pool.length
      this.stats.expansions++
      return obj
    }

    // Cannot allocate
    return null
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (!this.active.has(obj)) return

    this.resetFn(obj)
    this.active.delete(obj)
    this.pool.push(obj)
    this.stats.activeCount--
    this.stats.availableCount++
  }

  /**
   * Release all active objects
   */
  releaseAll(): void {
    this.active.forEach((obj) => {
      this.resetFn(obj)
      this.pool.push(obj)
    })
    this.stats.availableCount += this.stats.activeCount
    this.stats.activeCount = 0
    this.active.clear()
  }

  /**
   * Get pool statistics
   */
  getStats(): Readonly<PoolStats> {
    return { ...this.stats }
  }

  /**
   * Pre-warm the pool by creating objects up to the specified count
   */
  preWarm(count: number): void {
    const toCreate = Math.min(count, this.maxSize) - this.stats.totalSize
    for (let i = 0; i < toCreate; i++) {
      this.pool.push(this.create())
    }
    this.stats.totalSize += toCreate
    this.stats.availableCount += toCreate
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.active.clear()
    this.pool.length = 0
    this.stats = {
      totalSize: 0,
      activeCount: 0,
      availableCount: 0,
      expansions: this.stats.expansions,
      allocations: this.stats.allocations,
      reuses: this.stats.reuses,
    }
  }
}

// ============================================================================
// Effect Throttle
// ============================================================================

/**
 * Throttle effect calls to maintain performance
 *
 * @example
 * ```ts
 * const throttledExplosion = new EffectThrottle({
 *   intervalMs: 100, // Max one explosion per 100ms
 *   leading: true
 * });
 *
 * // In your game loop
 * if (collision && throttledExplosion.canExecute()) {
 *   throttledExplosion.execute(() => createExplosion());
 * }
 * ```
 */
export class EffectThrottle {
  private lastCallTime = 0
  private pendingCall: (() => void) | null = null
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private intervalMs: number
  private leading: boolean
  private trailing: boolean
  private callCount = 0

  constructor(config: ThrottleConfig) {
    if (config.maxCallsPerSecond) {
      this.intervalMs = 1000 / config.maxCallsPerSecond
    } else {
      this.intervalMs = config.intervalMs
    }
    this.leading = config.leading ?? true
    this.trailing = config.trailing ?? false
  }

  /**
   * Check if enough time has passed to execute
   */
  canExecute(): boolean {
    const now = performance.now()
    return now - this.lastCallTime >= this.intervalMs
  }

  /**
   * Execute a throttled function
   */
  execute<T>(fn: () => T): T | undefined {
    const now = performance.now()
    const elapsed = now - this.lastCallTime
    const remaining = this.intervalMs - elapsed

    // Clear any pending trailing call
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    if (remaining <= 0) {
      // Can execute now
      this.lastCallTime = now
      this.callCount++

      if (this.leading || this.callCount > 1) {
        return fn()
      }
    } else if (this.trailing) {
      // Schedule trailing call
      this.pendingCall = fn as () => void
      this.timeoutId = setTimeout(() => {
        this.lastCallTime = performance.now()
        this.callCount++
        if (this.pendingCall) {
          this.pendingCall()
          this.pendingCall = null
        }
      }, remaining)
    }

    return undefined
  }

  /**
   * Get time remaining until next execution is allowed
   */
  getTimeRemaining(): number {
    const elapsed = performance.now() - this.lastCallTime
    return Math.max(0, this.intervalMs - elapsed)
  }

  /**
   * Reset the throttle state
   */
  reset(): void {
    this.lastCallTime = 0
    this.callCount = 0
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.pendingCall = null
  }

  /**
   * Get call statistics
   */
  getCallCount(): number {
    return this.callCount
  }
}

// ============================================================================
// Batch Processor
// ============================================================================

/**
 * Batch multiple updates together for efficiency
 *
 * @example
 * ```ts
 * const textureBatch = new BatchProcessor<TextureUpdate>({
 *   maxBatchSize: 10,
 *   maxWaitMs: 16 // One frame at 60fps
 * });
 *
 * // Queue texture updates
 * textureBatch.add({ textureId: 1, data: [...] });
 * textureBatch.add({ textureId: 2, data: [...] });
 *
 * // Process all batched updates at once
 * textureBatch.flush(updates => {
 *   gl.batchTextureUpdate(updates);
 * });
 * ```
 */
export class BatchProcessor<T> {
  private batch: T[] = []
  private maxBatchSize: number
  private maxWaitMs: number
  private timeoutId: ReturnType<typeof setTimeout> | null = null
  private processor: ((items: T[]) => void) | null = null

  constructor(config: BatchConfig = {}) {
    this.maxBatchSize = config.maxBatchSize ?? 50
    this.maxWaitMs = config.maxWaitMs ?? 16
  }

  /**
   * Set the batch processor function
   */
  setProcessor(processor: (items: T[]) => void): void {
    this.processor = processor
  }

  /**
   * Add an item to the batch
   */
  add(item: T): void {
    this.batch.push(item)

    // Schedule auto-flush if not already scheduled
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => {
        this.flushInternal()
      }, this.maxWaitMs)
    }

    // Flush immediately if batch is full
    if (this.batch.length >= this.maxBatchSize) {
      this.flushInternal()
    }
  }

  /**
   * Add multiple items to the batch
   */
  addAll(items: T[]): void {
    items.forEach((item) => this.add(item))
  }

  /**
   * Process all batched items immediately
   */
  flush(processor?: (items: T[]) => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }

    const proc = processor ?? this.processor
    if (proc && this.batch.length > 0) {
      proc([...this.batch])
    }
    this.batch.length = 0
  }

  private flushInternal(): void {
    this.timeoutId = null
    if (this.processor && this.batch.length > 0) {
      this.processor([...this.batch])
      this.batch.length = 0
    }
  }

  /**
   * Get current batch size
   */
  size(): number {
    return this.batch.length
  }

  /**
   * Check if batch is empty
   */
  isEmpty(): boolean {
    return this.batch.length === 0
  }

  /**
   * Clear batch without processing
   */
  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
    this.batch.length = 0
  }
}

// ============================================================================
// Frame Budget Tracker
// ============================================================================

/**
 * Track and manage frame time budget
 *
 * @example
 * ```ts
 * const budget = new FrameBudgetTracker({
 *   targetFrameTime: 16.67, // 60fps
 *   logicBudget: 4,
 *   renderBudget: 8
 * });
 *
 * // In your game loop
 * budget.startFrame();
 *
 * budget.startTask('logic');
 * updateGameLogic();
 * budget.endTask('logic');
 *
 * budget.startTask('render');
 * renderScene();
 * budget.endTask('render');
 *
 * const report = budget.endFrame();
 * if (report.overBudget) {
 *   console.warn('Frame exceeded budget!', report);
 * }
 * ```
 */
export class FrameBudgetTracker {
  private config: Required<FrameBudgetConfig>
  private frameStartTime = 0
  private taskStartTimes: Map<string, number> = new Map()
  private taskTimes: Map<string, number> = new Map()
  private frameHistory: number[] = []
  private readonly historySize = 60

  constructor(config: FrameBudgetConfig = {}) {
    this.config = {
      targetFrameTime: config.targetFrameTime ?? 16.67,
      logicBudget: config.logicBudget ?? 4,
      renderBudget: config.renderBudget ?? 8,
      physicsBudget: config.physicsBudget ?? 2,
      effectsBudget: config.effectsBudget ?? 2,
    }
  }

  /**
   * Mark the start of a new frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now()
    this.taskTimes.clear()
  }

  /**
   * Start timing a specific task
   */
  startTask(name: string): void {
    this.taskStartTimes.set(name, performance.now())
  }

  /**
   * End timing a specific task
   */
  endTask(name: string): number {
    const startTime = this.taskStartTimes.get(name)
    if (startTime === undefined) return 0

    const elapsed = performance.now() - startTime
    this.taskTimes.set(name, (this.taskTimes.get(name) ?? 0) + elapsed)
    this.taskStartTimes.delete(name)
    return elapsed
  }

  /**
   * End the current frame and get report
   */
  endFrame(): {
    totalTime: number
    overBudget: boolean
    budgetRemaining: number
    taskBreakdown: Record<string, number>
    avgFrameTime: number
  } {
    const totalTime = performance.now() - this.frameStartTime

    // Track history
    this.frameHistory.push(totalTime)
    if (this.frameHistory.length > this.historySize) {
      this.frameHistory.shift()
    }

    const avgFrameTime =
      this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length

    const taskBreakdown: Record<string, number> = {}
    this.taskTimes.forEach((time, name) => {
      taskBreakdown[name] = time
    })

    return {
      totalTime,
      overBudget: totalTime > this.config.targetFrameTime,
      budgetRemaining: this.config.targetFrameTime - totalTime,
      taskBreakdown,
      avgFrameTime,
    }
  }

  /**
   * Get the time remaining in the current frame budget
   */
  getTimeRemaining(): number {
    return Math.max(
      0,
      this.config.targetFrameTime - (performance.now() - this.frameStartTime)
    )
  }

  /**
   * Check if we have budget for a specific task type
   */
  hasBudgetFor(taskType: 'logic' | 'render' | 'physics' | 'effects'): boolean {
    const budgetKey = `${taskType}Budget` as keyof Required<FrameBudgetConfig>
    const budget = this.config[budgetKey]
    const used = this.taskTimes.get(taskType) ?? 0
    return used < budget
  }

  /**
   * Get average FPS over recent frames
   */
  getAverageFps(): number {
    if (this.frameHistory.length === 0) return 60
    const avgFrameTime =
      this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length
    return avgFrameTime > 0 ? 1000 / avgFrameTime : 60
  }

  /**
   * Reset all tracking data
   */
  reset(): void {
    this.frameHistory.length = 0
    this.taskTimes.clear()
    this.taskStartTimes.clear()
  }
}

// ============================================================================
// Render Skip Controller
// ============================================================================

/**
 * Control which frames to skip rendering for non-essential elements
 *
 * @example
 * ```ts
 * const skipController = new RenderSkipController({
 *   particleSkipRate: 2, // Render particles every 2nd frame
 *   effectSkipRate: 3,   // Render effects every 3rd frame
 * });
 *
 * // In render loop
 * if (skipController.shouldRender('particles')) {
 *   renderParticles();
 * }
 * ```
 */
export class RenderSkipController {
  private frameCount = 0
  private skipRates: Map<string, number> = new Map()
  private categoryFrameOffsets: Map<string, number> = new Map()

  constructor(
    config: Record<string, number> = {}
  ) {
    Object.entries(config).forEach(([category, rate]) => {
      this.setSkipRate(category, rate)
    })
  }

  /**
   * Set skip rate for a category (1 = every frame, 2 = every other, etc.)
   */
  setSkipRate(category: string, rate: number): void {
    this.skipRates.set(category, Math.max(1, Math.floor(rate)))
    // Stagger offsets to avoid all categories skipping the same frames
    const offset = (this.categoryFrameOffsets.size % rate)
    this.categoryFrameOffsets.set(category, offset)
  }

  /**
   * Advance to next frame
   */
  nextFrame(): void {
    this.frameCount++
  }

  /**
   * Check if a category should render this frame
   */
  shouldRender(category: string): boolean {
    const rate = this.skipRates.get(category) ?? 1
    const offset = this.categoryFrameOffsets.get(category) ?? 0
    return (this.frameCount + offset) % rate === 0
  }

  /**
   * Get current frame number
   */
  getFrameCount(): number {
    return this.frameCount
  }

  /**
   * Reset frame counter
   */
  reset(): void {
    this.frameCount = 0
  }
}

// ============================================================================
// LOD (Level of Detail) Manager
// ============================================================================

/**
 * Manage level of detail based on distance or performance
 *
 * @example
 * ```ts
 * const lodManager = new LODManager([
 *   { distance: 0, level: 'high' },
 *   { distance: 10, level: 'medium' },
 *   { distance: 25, level: 'low' },
 *   { distance: 50, level: 'hidden' }
 * ]);
 *
 * // Get LOD for an object at distance 15
 * const lod = lodManager.getLOD(15); // 'medium'
 * ```
 */
export interface LODLevel<T = string> {
  distance: number
  level: T
}

export class LODManager<T = string> {
  private levels: LODLevel<T>[]
  private defaultLevel: T
  private hysteresis: number

  constructor(
    levels: LODLevel<T>[],
    options: { defaultLevel?: T; hysteresis?: number } = {}
  ) {
    // Sort by distance ascending
    this.levels = [...levels].sort((a, b) => a.distance - b.distance)
    this.defaultLevel = options.defaultLevel ?? levels[0]?.level ?? ('medium' as unknown as T)
    this.hysteresis = options.hysteresis ?? 0.5
  }

  /**
   * Get the appropriate LOD level for a given distance
   */
  getLOD(distance: number): T {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (distance >= this.levels[i].distance) {
        return this.levels[i].level
      }
    }
    return this.defaultLevel
  }

  /**
   * Get LOD with hysteresis to prevent flickering
   */
  getLODWithHysteresis(distance: number, currentLevel: T): T {
    const newLevel = this.getLOD(distance)
    if (newLevel === currentLevel) return currentLevel

    // Find current and new level indices
    const currentIndex = this.levels.findIndex((l) => l.level === currentLevel)
    const newIndex = this.levels.findIndex((l) => l.level === newLevel)

    if (currentIndex === -1 || newIndex === -1) return newLevel

    // Apply hysteresis - require larger distance change to switch
    const threshold = this.levels[Math.min(currentIndex, newIndex)].distance
    const hysteresisOffset = currentIndex < newIndex ? this.hysteresis : -this.hysteresis

    if (Math.abs(distance - threshold) > Math.abs(hysteresisOffset)) {
      return newLevel
    }

    return currentLevel
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  ObjectPool,
  EffectThrottle,
  BatchProcessor,
  FrameBudgetTracker,
  RenderSkipController,
  LODManager,
}
