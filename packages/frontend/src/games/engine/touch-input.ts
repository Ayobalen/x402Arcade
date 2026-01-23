/**
 * Touch Input Handler
 *
 * Provides touch input handling for mobile gameplay, including single touch,
 * swipe gesture detection, and touch position tracking relative to canvas.
 *
 * @module games/engine/touch-input
 */

import type { Vector2D } from './types'
import type { Direction } from '../types'

// ============================================================================
// Touch Input Types
// ============================================================================

/**
 * Touch point data with position and timing
 */
export interface TouchPoint {
  /** Touch identifier */
  id: number
  /** Current position relative to canvas */
  position: Vector2D
  /** Start position when touch began */
  startPosition: Vector2D
  /** Time when touch started (ms) */
  startTime: number
  /** Whether this touch is currently active */
  active: boolean
}

/**
 * Swipe gesture data
 */
export interface SwipeGesture {
  /** Direction of the swipe */
  direction: Direction
  /** Distance traveled in pixels */
  distance: number
  /** Duration of the swipe in milliseconds */
  duration: number
  /** Velocity in pixels per second */
  velocity: number
  /** Start position */
  startPosition: Vector2D
  /** End position */
  endPosition: Vector2D
}

/**
 * Touch input state
 */
export interface TouchInputState {
  /** All currently active touches */
  touches: Map<number, TouchPoint>
  /** Primary touch (first touch) */
  primaryTouch: TouchPoint | null
  /** Whether any touch is currently active */
  isTouching: boolean
  /** Number of active touches */
  touchCount: number
  /** Last detected swipe gesture */
  lastSwipe: SwipeGesture | null
  /** Whether a swipe was just detected this frame */
  swipeDetected: boolean
}

/**
 * Touch input configuration
 */
export interface TouchInputConfig {
  /** Minimum distance to register as a swipe (pixels) */
  swipeThreshold: number
  /** Maximum duration for a swipe gesture (ms) */
  swipeMaxDuration: number
  /** Minimum velocity for a swipe (pixels/second) */
  swipeMinVelocity: number
  /** Whether to prevent default touch behavior */
  preventDefault: boolean
  /** Whether to stop event propagation */
  stopPropagation: boolean
}

/**
 * Touch event callbacks
 */
export interface TouchInputCallbacks {
  /** Called when a touch starts */
  onTouchStart?: (touch: TouchPoint, event: TouchEvent) => void
  /** Called when a touch moves */
  onTouchMove?: (touch: TouchPoint, event: TouchEvent) => void
  /** Called when a touch ends */
  onTouchEnd?: (touch: TouchPoint, event: TouchEvent) => void
  /** Called when a swipe is detected */
  onSwipe?: (swipe: SwipeGesture, event: TouchEvent) => void
  /** Called when a tap is detected */
  onTap?: (position: Vector2D, event: TouchEvent) => void
}

/**
 * Touch input handler interface
 */
export interface TouchInputHandler {
  /** Get current touch state */
  getState: () => TouchInputState
  /** Get primary touch position (or null) */
  getPosition: () => Vector2D | null
  /** Check if currently touching */
  isTouching: () => boolean
  /** Get swipe direction if just swiped */
  getSwipeDirection: () => Direction | null
  /** Clear swipe detection flag (call after processing) */
  clearSwipe: () => void
  /** Update callbacks */
  setCallbacks: (callbacks: Partial<TouchInputCallbacks>) => void
  /** Attach to a canvas element */
  attach: (canvas: HTMLCanvasElement) => void
  /** Detach from canvas */
  detach: () => void
  /** Reset touch state */
  reset: () => void
  /** Clean up and remove all listeners */
  dispose: () => void
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default touch input configuration
 */
export const DEFAULT_TOUCH_CONFIG: TouchInputConfig = {
  swipeThreshold: 30, // 30 pixels minimum for swipe
  swipeMaxDuration: 300, // 300ms max for swipe gesture
  swipeMinVelocity: 100, // 100 pixels/second minimum
  preventDefault: true,
  stopPropagation: true,
}

// ============================================================================
// Touch Input Implementation
// ============================================================================

/**
 * Creates a touch input handler for a canvas element
 *
 * @param config - Optional configuration overrides
 * @param callbacks - Optional event callbacks
 * @returns TouchInputHandler instance
 *
 * @example
 * ```ts
 * const touchInput = createTouchInputHandler({
 *   swipeThreshold: 50,
 * });
 *
 * touchInput.setCallbacks({
 *   onSwipe: (swipe) => {
 *     if (swipe.direction === 'left') {
 *       snake.turnLeft();
 *     }
 *   }
 * });
 *
 * touchInput.attach(canvasElement);
 *
 * // In game loop:
 * const swipeDir = touchInput.getSwipeDirection();
 * if (swipeDir) {
 *   handleDirection(swipeDir);
 *   touchInput.clearSwipe();
 * }
 * ```
 */
export function createTouchInputHandler(
  config: Partial<TouchInputConfig> = {},
  callbacks: TouchInputCallbacks = {}
): TouchInputHandler {
  const fullConfig: TouchInputConfig = {
    ...DEFAULT_TOUCH_CONFIG,
    ...config,
  }

  // State
  const state: TouchInputState = {
    touches: new Map(),
    primaryTouch: null,
    isTouching: false,
    touchCount: 0,
    lastSwipe: null,
    swipeDetected: false,
  }

  // Callbacks
  let currentCallbacks: TouchInputCallbacks = { ...callbacks }

  // Canvas reference
  let canvas: HTMLCanvasElement | null = null

  // Bound event handlers (for proper cleanup)
  let boundHandlers: {
    touchstart: (e: TouchEvent) => void
    touchmove: (e: TouchEvent) => void
    touchend: (e: TouchEvent) => void
    touchcancel: (e: TouchEvent) => void
  } | null = null

  /**
   * Calculate touch position relative to canvas
   */
  function getTouchPosition(touch: Touch, targetCanvas: HTMLCanvasElement): Vector2D {
    const rect = targetCanvas.getBoundingClientRect()

    // Calculate position relative to canvas, accounting for scaling
    const scaleX = targetCanvas.width / rect.width
    const scaleY = targetCanvas.height / rect.height

    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  /**
   * Detect swipe direction from start and end positions
   */
  function detectSwipeDirection(
    start: Vector2D,
    end: Vector2D
  ): Direction | null {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Check if distance meets threshold
    if (distance < fullConfig.swipeThreshold) {
      return null
    }

    // Determine direction based on angle
    const angle = Math.atan2(dy, dx)
    const degrees = angle * (180 / Math.PI)

    // Horizontal swipes have more tolerance (wider angle range)
    if (degrees >= -45 && degrees < 45) {
      return 'right'
    } else if (degrees >= 45 && degrees < 135) {
      return 'down'
    } else if (degrees >= -135 && degrees < -45) {
      return 'up'
    } else {
      return 'left'
    }
  }

  /**
   * Create swipe gesture data
   */
  function createSwipeGesture(
    touchPoint: TouchPoint,
    endPosition: Vector2D,
    endTime: number
  ): SwipeGesture | null {
    const dx = endPosition.x - touchPoint.startPosition.x
    const dy = endPosition.y - touchPoint.startPosition.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = endTime - touchPoint.startTime

    // Check minimum distance
    if (distance < fullConfig.swipeThreshold) {
      return null
    }

    // Check max duration
    if (duration > fullConfig.swipeMaxDuration) {
      return null
    }

    const velocity = (distance / duration) * 1000 // pixels per second

    // Check minimum velocity
    if (velocity < fullConfig.swipeMinVelocity) {
      return null
    }

    const direction = detectSwipeDirection(touchPoint.startPosition, endPosition)
    if (!direction) {
      return null
    }

    return {
      direction,
      distance,
      duration,
      velocity,
      startPosition: { ...touchPoint.startPosition },
      endPosition: { ...endPosition },
    }
  }

  /**
   * Update state from current touches
   */
  function updateState(): void {
    state.touchCount = state.touches.size
    state.isTouching = state.touchCount > 0

    // Update primary touch
    if (state.touchCount > 0) {
      // Get the touch with the lowest ID (first touch)
      const minId = Math.min(...state.touches.keys())
      state.primaryTouch = state.touches.get(minId) ?? null
    } else {
      state.primaryTouch = null
    }
  }

  /**
   * Handle touchstart event
   */
  function handleTouchStart(event: TouchEvent): void {
    if (!canvas) return

    if (fullConfig.preventDefault) {
      event.preventDefault()
    }
    if (fullConfig.stopPropagation) {
      event.stopPropagation()
    }

    const now = performance.now()

    // Process each changed touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      const position = getTouchPosition(touch, canvas)

      const touchPoint: TouchPoint = {
        id: touch.identifier,
        position: { ...position },
        startPosition: { ...position },
        startTime: now,
        active: true,
      }

      state.touches.set(touch.identifier, touchPoint)

      // Callback
      currentCallbacks.onTouchStart?.(touchPoint, event)
    }

    updateState()
  }

  /**
   * Handle touchmove event
   */
  function handleTouchMove(event: TouchEvent): void {
    if (!canvas) return

    if (fullConfig.preventDefault) {
      event.preventDefault()
    }
    if (fullConfig.stopPropagation) {
      event.stopPropagation()
    }

    // Process each changed touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      const touchPoint = state.touches.get(touch.identifier)

      if (touchPoint) {
        touchPoint.position = getTouchPosition(touch, canvas)

        // Callback
        currentCallbacks.onTouchMove?.(touchPoint, event)
      }
    }

    updateState()
  }

  /**
   * Handle touchend event
   */
  function handleTouchEnd(event: TouchEvent): void {
    if (!canvas) return

    if (fullConfig.preventDefault) {
      event.preventDefault()
    }
    if (fullConfig.stopPropagation) {
      event.stopPropagation()
    }

    const now = performance.now()

    // Process each changed touch
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      const touchPoint = state.touches.get(touch.identifier)

      if (touchPoint) {
        const endPosition = getTouchPosition(touch, canvas)
        touchPoint.position = endPosition
        touchPoint.active = false

        // Check for swipe
        const swipe = createSwipeGesture(touchPoint, endPosition, now)
        if (swipe) {
          state.lastSwipe = swipe
          state.swipeDetected = true
          currentCallbacks.onSwipe?.(swipe, event)
        } else {
          // Check for tap (short duration, minimal movement)
          const duration = now - touchPoint.startTime
          const dx = endPosition.x - touchPoint.startPosition.x
          const dy = endPosition.y - touchPoint.startPosition.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (duration < 200 && distance < 10) {
            currentCallbacks.onTap?.(endPosition, event)
          }
        }

        // Callback
        currentCallbacks.onTouchEnd?.(touchPoint, event)

        // Remove touch
        state.touches.delete(touch.identifier)
      }
    }

    updateState()
  }

  /**
   * Handle touchcancel event (same as touchend but no gesture detection)
   */
  function handleTouchCancel(event: TouchEvent): void {
    if (fullConfig.preventDefault) {
      event.preventDefault()
    }
    if (fullConfig.stopPropagation) {
      event.stopPropagation()
    }

    // Remove all cancelled touches
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i]
      state.touches.delete(touch.identifier)
    }

    updateState()
  }

  return {
    getState(): TouchInputState {
      return { ...state, touches: new Map(state.touches) }
    },

    getPosition(): Vector2D | null {
      return state.primaryTouch ? { ...state.primaryTouch.position } : null
    },

    isTouching(): boolean {
      return state.isTouching
    },

    getSwipeDirection(): Direction | null {
      return state.swipeDetected && state.lastSwipe
        ? state.lastSwipe.direction
        : null
    },

    clearSwipe(): void {
      state.swipeDetected = false
    },

    setCallbacks(callbacks: Partial<TouchInputCallbacks>): void {
      currentCallbacks = { ...currentCallbacks, ...callbacks }
    },

    attach(targetCanvas: HTMLCanvasElement): void {
      // Detach from previous canvas if any
      this.detach()

      canvas = targetCanvas

      // Create bound handlers
      boundHandlers = {
        touchstart: handleTouchStart,
        touchmove: handleTouchMove,
        touchend: handleTouchEnd,
        touchcancel: handleTouchCancel,
      }

      // Add event listeners with passive: false to allow preventDefault
      canvas.addEventListener('touchstart', boundHandlers.touchstart, { passive: false })
      canvas.addEventListener('touchmove', boundHandlers.touchmove, { passive: false })
      canvas.addEventListener('touchend', boundHandlers.touchend, { passive: false })
      canvas.addEventListener('touchcancel', boundHandlers.touchcancel, { passive: false })
    },

    detach(): void {
      if (canvas && boundHandlers) {
        canvas.removeEventListener('touchstart', boundHandlers.touchstart)
        canvas.removeEventListener('touchmove', boundHandlers.touchmove)
        canvas.removeEventListener('touchend', boundHandlers.touchend)
        canvas.removeEventListener('touchcancel', boundHandlers.touchcancel)
      }

      canvas = null
      boundHandlers = null
    },

    reset(): void {
      state.touches.clear()
      state.primaryTouch = null
      state.isTouching = false
      state.touchCount = 0
      state.lastSwipe = null
      state.swipeDetected = false
    },

    dispose(): void {
      this.detach()
      this.reset()
      currentCallbacks = {}
    },
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a touch position to a direction (for directional games)
 *
 * Divides the canvas into regions and returns the direction based on
 * which region the touch is in relative to the center.
 *
 * @param position - Touch position relative to canvas
 * @param canvasWidth - Canvas width
 * @param canvasHeight - Canvas height
 * @param deadZone - Percentage of center area that returns null (0-1)
 * @returns Direction or null if in dead zone
 */
export function touchPositionToDirection(
  position: Vector2D,
  canvasWidth: number,
  canvasHeight: number,
  deadZone: number = 0.2
): Direction | null {
  const centerX = canvasWidth / 2
  const centerY = canvasHeight / 2

  const dx = position.x - centerX
  const dy = position.y - centerY

  // Check if in dead zone
  const deadZoneWidth = canvasWidth * deadZone
  const deadZoneHeight = canvasHeight * deadZone
  if (
    Math.abs(dx) < deadZoneWidth / 2 &&
    Math.abs(dy) < deadZoneHeight / 2
  ) {
    return null
  }

  // Determine direction based on angle
  const angle = Math.atan2(dy, dx) * (180 / Math.PI)

  if (angle >= -45 && angle < 45) {
    return 'right'
  } else if (angle >= 45 && angle < 135) {
    return 'down'
  } else if (angle >= -135 && angle < -45) {
    return 'up'
  } else {
    return 'left'
  }
}

/**
 * Calculate swipe velocity and distance
 *
 * @param start - Start position
 * @param end - End position
 * @param durationMs - Duration in milliseconds
 * @returns Velocity (pixels/second) and distance (pixels)
 */
export function calculateSwipeMetrics(
  start: Vector2D,
  end: Vector2D,
  durationMs: number
): { velocity: number; distance: number } {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const velocity = durationMs > 0 ? (distance / durationMs) * 1000 : 0

  return { velocity, distance }
}

/**
 * Check if touch is within a rectangular region
 *
 * @param position - Touch position
 * @param x - Region left edge
 * @param y - Region top edge
 * @param width - Region width
 * @param height - Region height
 * @returns True if position is within region
 */
export function isTouchInRegion(
  position: Vector2D,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return (
    position.x >= x &&
    position.x <= x + width &&
    position.y >= y &&
    position.y <= y + height
  )
}

/**
 * Check if device supports touch events
 *
 * @returns True if touch events are supported
 */
export function isTouchSupported(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).msMaxTouchPoints > 0
  )
}

// ============================================================================
// Exports
// ============================================================================

export {
  type TouchInputHandler,
  type TouchInputConfig,
  type TouchInputState,
  type TouchInputCallbacks,
  type TouchPoint,
  type SwipeGesture,
}
