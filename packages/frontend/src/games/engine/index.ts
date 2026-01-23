/**
 * Game Engine Module
 *
 * This module exports all game engine types, utilities, and core functionality
 * for the x402 Arcade game engine.
 *
 * @module games/engine
 */

// Export all types from types.ts
export * from './types'

// Export game loop utilities
export {
  createGameLoop,
  createDeltaTimeCalculator,
  createFpsCounter,
  deltaToSeconds,
  deltaToMs,
  calculateInterpolationAlpha,
  DEFAULT_GAME_LOOP_CONFIG,
  type DeltaTimeCalculator,
  type FpsCounter,
} from './game-loop'

// Export state machine utilities
export {
  createStateMachine,
  createGameStateMachine,
  GAME_STATES,
  GAME_STATE_TRANSITIONS,
  type StateDefinition,
  type TransitionDefinition,
  type StateChangeEvent,
  type StateEventListener,
  type StateMachineConfig,
  type StateMachine,
  type GameStateName,
} from './state-machine'

// Export touch input utilities
export {
  createTouchInputHandler,
  touchPositionToDirection,
  calculateSwipeMetrics,
  isTouchInRegion,
  isTouchSupported,
  DEFAULT_TOUCH_CONFIG,
  type TouchInputHandler,
  type TouchInputConfig,
  type TouchInputState,
  type TouchInputCallbacks,
  type TouchPoint,
  type SwipeGesture,
} from './touch-input'

// Default export for convenient importing
export { default as types } from '../types'
