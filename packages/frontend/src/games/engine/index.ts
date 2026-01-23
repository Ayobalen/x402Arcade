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
  createVisibilityHandler,
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

// Export collision detection utilities
export {
  // AABB collision
  aabbIntersects,
  aabbOverlap,
  aabbMTV,
  aabbCollisionNormal,
  aabbContactPoint,
  pointInAABB,
  expandAABB,
  aabbContains,
  mergeAABB,
  aabbArea,
  aabbPerimeter,
  // Circle collision
  circleIntersects,
  circlePenetrationDepth,
  circleCollisionNormal,
  circleMTV,
  circleAABBIntersects,
  pointInCircle,
  // Line collision
  lineIntersects,
  lineIntersectionPoint,
  lineAABBIntersects,
  // Collision response
  calculateCollisionResponse,
  reflectVelocity,
  // Utility functions
  boundsToAABB,
  createAABBFromCenter,
  getAABBCenter,
  buildAABBCollisionResult,
  // Types
  type AABB,
  type LineSegment,
  type CollisionResponseOptions,
} from './collision'

// Export input manager utilities
export {
  createInputManager,
  isDirectionPressed,
  getPrimaryDirection,
  getDirectionsArray,
  hasAnyInput,
  mergeInputs,
  DEFAULT_KEY_MAPPING,
  DEFAULT_INPUT_CONFIG,
  type InputManager,
  type InputManagerConfig,
  type InputSource,
  type InputAction,
  type InputHandler,
  type RegisteredHandler,
  type KeyMapping,
  type InputState,
} from './input-manager'

// Export audio manager utilities
export {
  createAudioManager,
  getGlobalAudioManager,
  disposeGlobalAudioManager,
  DEFAULT_AUDIO_CONFIG,
  type AudioManager,
  type AudioManagerConfig,
  type SoundConfig,
  type SoundCategory,
  type LoadedSound,
  type PlayingSound,
} from './audio-manager'

// Default export for convenient importing
export { default as types } from '../types'
