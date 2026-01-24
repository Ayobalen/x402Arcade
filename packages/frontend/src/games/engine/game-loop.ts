/**
 * Game Loop Implementation
 *
 * Provides a frame-rate independent game loop with delta time calculation.
 * Supports fixed timestep for physics, variable timestep for rendering,
 * and prevents spiral of death with delta time capping.
 *
 * @module games/engine/game-loop
 */

import type {
  FrameInfo,
  GameLoop,
  GameLoopConfig,
  UpdateCallback,
  RenderCallback,
  FixedUpdateCallback,
} from './types'

// ============================================================================
// Constants
// ============================================================================

/** Default game loop configuration */
export const DEFAULT_GAME_LOOP_CONFIG: GameLoopConfig = {
  /** Target 60 FPS */
  targetFps: 60,
  /** Fixed timestep of 16.67ms (60 FPS) for physics */
  fixedTimestep: 1000 / 60,
  /** Cap delta time at 100ms to prevent spiral of death */
  maxDeltaTime: 100,
  /** Use fixed timestep for physics by default */
  useFixedTimestep: true,
  /** Enable interpolation for smoother rendering */
  interpolate: true,
  /** Auto-pause when tab becomes hidden */
  autoPauseOnHidden: true,
}

// ============================================================================
// Visibility Change Handler
// ============================================================================

/**
 * Creates a visibility change handler that auto-pauses the game loop
 * when the tab becomes hidden and resumes when visible again.
 *
 * @param onHidden - Callback when tab becomes hidden
 * @param onVisible - Callback when tab becomes visible
 * @returns Cleanup function to remove the event listener
 */
export function createVisibilityHandler(
  onHidden: () => void,
  onVisible: () => void
): () => void {
  const handleVisibilityChange = (): void => {
    if (document.hidden) {
      onHidden()
    } else {
      onVisible()
    }
  }

  document.addEventListener('visibilitychange', handleVisibilityChange)

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
}

// ============================================================================
// Delta Time Calculator
// ============================================================================

/**
 * Calculates delta time between frames
 *
 * Implements frame-rate independent game logic by tracking time between frames.
 * Includes safeguards against spiral of death (when updates take longer than
 * the frame time, causing ever-increasing delta times).
 */
export interface DeltaTimeCalculator {
  /** Calculate delta time for the current frame */
  calculate: (currentTime: number) => number
  /** Reset the calculator */
  reset: () => void
  /** Get the raw delta time (uncapped) */
  getRawDeltaTime: () => number
  /** Get the capped delta time */
  getCappedDeltaTime: () => number
  /** Set the maximum allowed delta time */
  setMaxDeltaTime: (maxDeltaTime: number) => void
}

/**
 * Creates a delta time calculator
 *
 * @param maxDeltaTime - Maximum allowed delta time in milliseconds
 * @returns DeltaTimeCalculator instance
 *
 * @example
 * ```ts
 * const deltaCalculator = createDeltaTimeCalculator(100);
 *
 * // In game loop:
 * const deltaTime = deltaCalculator.calculate(performance.now());
 * updateGame(deltaTime);
 * ```
 */
export function createDeltaTimeCalculator(
  maxDeltaTime: number = DEFAULT_GAME_LOOP_CONFIG.maxDeltaTime
): DeltaTimeCalculator {
  // Store previous frame timestamp
  let previousTime: number = 0
  let rawDeltaTime: number = 0
  let cappedDeltaTime: number = 0
  let currentMaxDeltaTime = maxDeltaTime

  return {
    /**
     * Calculate delta time since last frame
     *
     * @param currentTime - Current timestamp (usually from performance.now())
     * @returns Delta time in milliseconds (capped to prevent spiral of death)
     */
    calculate(currentTime: number): number {
      // First frame: initialize previousTime and return 0
      if (previousTime === 0) {
        previousTime = currentTime
        rawDeltaTime = 0
        cappedDeltaTime = 0
        return 0
      }

      // Calculate deltaTime = currentTime - previousTime
      rawDeltaTime = currentTime - previousTime

      // Cap delta time to prevent spiral of death
      // This happens when the game is paused, tab is backgrounded,
      // or updates take longer than frame time
      cappedDeltaTime = Math.min(rawDeltaTime, currentMaxDeltaTime)

      // Update previous time for next frame
      previousTime = currentTime

      return cappedDeltaTime
    },

    /**
     * Reset the calculator (call when restarting game)
     */
    reset(): void {
      previousTime = 0
      rawDeltaTime = 0
      cappedDeltaTime = 0
    },

    /**
     * Get the raw (uncapped) delta time from last calculation
     */
    getRawDeltaTime(): number {
      return rawDeltaTime
    },

    /**
     * Get the capped delta time from last calculation
     */
    getCappedDeltaTime(): number {
      return cappedDeltaTime
    },

    /**
     * Update the maximum allowed delta time
     */
    setMaxDeltaTime(newMaxDeltaTime: number): void {
      currentMaxDeltaTime = newMaxDeltaTime
    },
  }
}

// ============================================================================
// FPS Counter
// ============================================================================

/**
 * FPS counter that tracks actual frame rate
 */
export interface FpsCounter {
  /** Record a frame */
  tick: () => void
  /** Get current FPS */
  getFps: () => number
  /** Get average FPS over last N samples */
  getAverageFps: () => number
  /** Reset the counter */
  reset: () => void
}

/**
 * Creates an FPS counter
 *
 * @param sampleSize - Number of samples to average (default: 60)
 * @returns FpsCounter instance
 */
export function createFpsCounter(sampleSize: number = 60): FpsCounter {
  const frameTimes: number[] = []
  let lastFrameTime = 0
  let currentFps = 0

  return {
    tick(): void {
      const currentTime = performance.now()

      if (lastFrameTime > 0) {
        const frameTime = currentTime - lastFrameTime
        frameTimes.push(frameTime)

        // Keep only the last N samples
        if (frameTimes.length > sampleSize) {
          frameTimes.shift()
        }

        // Calculate FPS from average frame time
        if (frameTimes.length > 0) {
          const avgFrameTime =
            frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
          currentFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0
        }
      }

      lastFrameTime = currentTime
    },

    getFps(): number {
      return Math.round(currentFps)
    },

    getAverageFps(): number {
      if (frameTimes.length === 0) return 0
      const avgFrameTime =
        frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
      return avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 0
    },

    reset(): void {
      frameTimes.length = 0
      lastFrameTime = 0
      currentFps = 0
    },
  }
}

// ============================================================================
// Game Loop Implementation
// ============================================================================

/**
 * Creates a game loop with frame-rate independent timing
 *
 * @param config - Game loop configuration
 * @returns GameLoop instance
 *
 * @example
 * ```ts
 * const loop = createGameLoop({ targetFps: 60 });
 *
 * loop.setUpdateCallback((frameInfo) => {
 *   player.update(frameInfo.deltaTime);
 * });
 *
 * loop.setRenderCallback((frameInfo) => {
 *   renderer.render(gameState);
 * });
 *
 * loop.start();
 * ```
 */
export function createGameLoop(
  config: Partial<GameLoopConfig> = {}
): GameLoop {
  const fullConfig: GameLoopConfig = {
    ...DEFAULT_GAME_LOOP_CONFIG,
    ...config,
  }

  // State
  let running = false
  let paused = false
  let pausedByVisibility = false
  let animationFrameId: number | null = null
  let startTime = 0
  let frameNumber = 0
  let accumulatedTime = 0
  let cleanupVisibility: (() => void) | null = null

  // Timing utilities
  const deltaCalculator = createDeltaTimeCalculator(fullConfig.maxDeltaTime)
  const fpsCounter = createFpsCounter()

  // Callbacks
  let updateCallback: UpdateCallback | null = null
  let fixedUpdateCallback: FixedUpdateCallback | null = null
  let renderCallback: RenderCallback | null = null
  let visibilityCallback: ((visible: boolean) => void) | null = null

  /**
   * Handle visibility change - pause when hidden, resume when visible
   */
  function handleVisibilityHidden(): void {
    if (running && !paused) {
      paused = true
      pausedByVisibility = true
      visibilityCallback?.(false)
    }
  }

  function handleVisibilityVisible(): void {
    if (running && pausedByVisibility) {
      paused = false
      pausedByVisibility = false
      // Reset delta calculator to avoid huge delta on resume
      deltaCalculator.reset()
      visibilityCallback?.(true)
    }
  }

  /**
   * Main loop function - called every animation frame
   */
  function loop(currentTime: number): void {
    if (!running) return

    // Request next frame first to maintain smooth timing
    animationFrameId = requestAnimationFrame(loop)

    // Don't process if paused
    if (paused) return

    // Calculate delta time
    const deltaTime = deltaCalculator.calculate(currentTime)

    // Skip first frame (deltaTime is 0)
    if (deltaTime === 0) return

    // Update FPS counter
    fpsCounter.tick()

    // Calculate total time since start
    const totalTime = currentTime - startTime

    // Create frame info (convert deltaTime to seconds for easier math)
    const frameInfo: FrameInfo = {
      deltaTime, // Keep in milliseconds for consistency
      totalTime,
      frameNumber,
      fps: fpsCounter.getFps(),
      targetFps: fullConfig.targetFps,
    }

    // Fixed timestep physics update
    if (fullConfig.useFixedTimestep && fixedUpdateCallback) {
      accumulatedTime += deltaTime

      // Process fixed updates
      while (accumulatedTime >= fullConfig.fixedTimestep) {
        fixedUpdateCallback(fullConfig.fixedTimestep)
        accumulatedTime -= fullConfig.fixedTimestep
      }
    }

    // Variable timestep update
    if (updateCallback) {
      updateCallback(frameInfo)
    }

    // Render
    if (renderCallback) {
      renderCallback(frameInfo)
    }

    frameNumber++
  }

  return {
    start(): void {
      if (running) return

      running = true
      paused = false
      pausedByVisibility = false
      frameNumber = 0
      accumulatedTime = 0
      startTime = performance.now()

      deltaCalculator.reset()
      fpsCounter.reset()

      // Set up visibility change handling if enabled
      if (fullConfig.autoPauseOnHidden && !cleanupVisibility) {
        cleanupVisibility = createVisibilityHandler(
          handleVisibilityHidden,
          handleVisibilityVisible
        )
      }

      // Start the loop
      animationFrameId = requestAnimationFrame(loop)
    },

    stop(): void {
      running = false
      paused = false
      pausedByVisibility = false

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }

      deltaCalculator.reset()
      fpsCounter.reset()
    },

    pause(): void {
      if (!running || paused) return
      paused = true
    },

    resume(): void {
      if (!running || !paused) return
      paused = false
      // Reset delta calculator to avoid huge delta on resume
      deltaCalculator.reset()
    },

    isRunning(): boolean {
      return running
    },

    isPaused(): boolean {
      return paused
    },

    getFps(): number {
      return fpsCounter.getFps()
    },

    setUpdateCallback(callback: UpdateCallback): void {
      updateCallback = callback
    },

    setFixedUpdateCallback(callback: FixedUpdateCallback): void {
      fixedUpdateCallback = callback
    },

    setRenderCallback(callback: RenderCallback): void {
      renderCallback = callback
    },

    setVisibilityCallback(callback: (visible: boolean) => void): void {
      visibilityCallback = callback
    },

    destroy(): void {
      // Stop the loop first
      this.stop()

      // Clean up visibility handler
      if (cleanupVisibility) {
        cleanupVisibility()
        cleanupVisibility = null
      }

      // Clear all callbacks
      updateCallback = null
      fixedUpdateCallback = null
      renderCallback = null
      visibilityCallback = null
    },
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert delta time from milliseconds to seconds
 * Useful for physics calculations that expect seconds
 *
 * @param deltaTimeMs - Delta time in milliseconds
 * @returns Delta time in seconds
 */
export function deltaToSeconds(deltaTimeMs: number): number {
  return deltaTimeMs / 1000
}

/**
 * Convert delta time from seconds to milliseconds
 *
 * @param deltaTimeSec - Delta time in seconds
 * @returns Delta time in milliseconds
 */
export function deltaToMs(deltaTimeSec: number): number {
  return deltaTimeSec * 1000
}

/**
 * Calculate interpolation alpha for rendering between physics steps
 *
 * @param accumulatedTime - Time accumulated since last physics step
 * @param fixedTimestep - Fixed physics timestep
 * @returns Interpolation alpha (0-1)
 */
export function calculateInterpolationAlpha(
  accumulatedTime: number,
  fixedTimestep: number
): number {
  return Math.min(accumulatedTime / fixedTimestep, 1)
}

// ============================================================================
// Exports
// ============================================================================

export type { GameLoop, GameLoopConfig, FrameInfo }
