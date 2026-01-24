/**
 * Game Engine Core Types
 *
 * This module defines the core interfaces and types that all games
 * in the x402 Arcade must implement. These types ensure consistency
 * across different game implementations and provide a standardized
 * API for the game loop, rendering, and state management.
 *
 * @module games/engine/types
 */

// ============================================================================
// Vector and Position Types
// ============================================================================

/**
 * 2D vector for positions, velocities, and dimensions
 */
export interface Vector2D {
  /** X coordinate */
  x: number
  /** Y coordinate */
  y: number
}

/**
 * Rectangle bounds for collision detection and rendering
 */
export interface Bounds {
  /** Left edge X coordinate */
  x: number
  /** Top edge Y coordinate */
  y: number
  /** Width of the bounds */
  width: number
  /** Height of the bounds */
  height: number
}

/**
 * Circle bounds for collision detection
 */
export interface CircleBounds {
  /** Center X coordinate */
  x: number
  /** Center Y coordinate */
  y: number
  /** Radius of the circle */
  radius: number
}

// ============================================================================
// Game Entity Types
// ============================================================================

/**
 * Base entity interface for all game objects
 */
export interface Entity {
  /** Unique identifier for the entity */
  id: string
  /** Current position */
  position: Vector2D
  /** Whether the entity is active/alive */
  active: boolean
}

/**
 * Entity with physics properties
 */
export interface PhysicsEntity extends Entity {
  /** Current velocity */
  velocity: Vector2D
  /** Current acceleration */
  acceleration: Vector2D
  /** Mass for physics calculations */
  mass: number
  /** Friction coefficient (0-1) */
  friction: number
}

/**
 * Entity with collision bounds
 */
export interface CollidableEntity extends Entity {
  /** Collision bounds */
  bounds: Bounds | CircleBounds
  /** Collision layer for filtering */
  collisionLayer: string
  /** Layers this entity can collide with */
  collidesWith: string[]
}

/**
 * Entity with visual representation
 */
export interface RenderableEntity extends Entity {
  /** Width of the visual representation */
  width: number
  /** Height of the visual representation */
  height: number
  /** Rotation angle in radians */
  rotation: number
  /** Opacity (0-1) */
  opacity: number
  /** Z-index for render ordering */
  zIndex: number
  /** Whether the entity is visible */
  visible: boolean
}

/**
 * Combined game object with all common features
 */
export interface GameObject
  extends PhysicsEntity,
    CollidableEntity,
    RenderableEntity {
  /** Entity type for identification */
  type: string
  /** Entity state (e.g., 'idle', 'moving', 'dying') */
  state: string
  /** Time since state change (ms) */
  stateTime: number
  /** Custom data for game-specific properties */
  data: Record<string, unknown>
}

// ============================================================================
// Game Loop Types
// ============================================================================

/**
 * Frame timing information for game loop
 */
export interface FrameInfo {
  /** Time since last frame in milliseconds */
  deltaTime: number
  /** Time since game started in milliseconds */
  totalTime: number
  /** Current frame number */
  frameNumber: number
  /** Actual FPS based on recent frames */
  fps: number
  /** Target FPS from config */
  targetFps: number
}

/**
 * Game loop callback types
 */
export type UpdateCallback = (frameInfo: FrameInfo) => void
export type RenderCallback = (frameInfo: FrameInfo) => void
export type FixedUpdateCallback = (deltaTime: number) => void

/**
 * Game loop configuration
 */
export interface GameLoopConfig {
  /** Target frames per second */
  targetFps: number
  /** Fixed timestep for physics (ms) */
  fixedTimestep: number
  /** Maximum delta time to prevent spiral of death (ms) */
  maxDeltaTime: number
  /** Whether to use fixed timestep for updates */
  useFixedTimestep: boolean
  /** Whether to interpolate between physics steps */
  interpolate: boolean
  /** Whether to automatically pause when tab becomes hidden */
  autoPauseOnHidden: boolean
}

/**
 * Game loop interface
 */
export interface GameLoop {
  /** Start the game loop */
  start: () => void
  /** Stop the game loop */
  stop: () => void
  /** Pause the game loop */
  pause: () => void
  /** Resume the game loop */
  resume: () => void
  /** Whether the loop is running */
  isRunning: () => boolean
  /** Whether the loop is paused */
  isPaused: () => boolean
  /** Get current FPS */
  getFps: () => number
  /** Set update callback */
  setUpdateCallback: (callback: UpdateCallback) => void
  /** Set fixed update callback (physics) */
  setFixedUpdateCallback: (callback: FixedUpdateCallback) => void
  /** Set render callback */
  setRenderCallback: (callback: RenderCallback) => void
  /** Set visibility change callback (called when tab visibility changes) */
  setVisibilityCallback: (callback: (visible: boolean) => void) => void
  /** Destroy the game loop and cleanup resources */
  destroy: () => void
}

// ============================================================================
// Collision Types
// ============================================================================

/**
 * Collision detection result
 */
export interface CollisionResult {
  /** Whether a collision occurred */
  collided: boolean
  /** First entity in collision */
  entityA: Entity
  /** Second entity in collision */
  entityB: Entity
  /** Collision normal vector */
  normal: Vector2D
  /** Penetration depth */
  depth: number
  /** Contact point */
  contactPoint: Vector2D
}

/**
 * Collision handler callback
 */
export type CollisionHandler = (result: CollisionResult) => void

/**
 * Collision system interface
 */
export interface CollisionSystem {
  /** Add an entity to the collision system */
  addEntity: (entity: CollidableEntity) => void
  /** Remove an entity from the collision system */
  removeEntity: (id: string) => void
  /** Update entity position in the system */
  updateEntity: (entity: CollidableEntity) => void
  /** Check for collisions */
  checkCollisions: () => CollisionResult[]
  /** Register collision handler for specific layer pairs */
  onCollision: (
    layerA: string,
    layerB: string,
    handler: CollisionHandler
  ) => () => void
  /** Clear all entities */
  clear: () => void
}

// ============================================================================
// Particle System Types
// ============================================================================

/**
 * Single particle in a particle system
 */
export interface Particle {
  /** Particle position */
  position: Vector2D
  /** Particle velocity */
  velocity: Vector2D
  /** Particle acceleration */
  acceleration: Vector2D
  /** Current lifetime (ms) */
  age: number
  /** Maximum lifetime (ms) */
  lifetime: number
  /** Particle size */
  size: number
  /** Size change rate */
  sizeVelocity: number
  /** Particle color */
  color: string
  /** Particle opacity (0-1) */
  opacity: number
  /** Opacity change rate */
  opacityVelocity: number
  /** Rotation angle (radians) */
  rotation: number
  /** Rotation velocity */
  rotationVelocity: number
}

/**
 * Particle emitter configuration
 */
export interface ParticleEmitterConfig {
  /** Maximum number of particles */
  maxParticles: number
  /** Emission rate (particles per second) */
  emissionRate: number
  /** Particle lifetime range [min, max] ms */
  lifetime: [number, number]
  /** Initial speed range [min, max] */
  speed: [number, number]
  /** Emission angle range [min, max] radians */
  angle: [number, number]
  /** Initial size range [min, max] */
  size: [number, number]
  /** Size change rate range [min, max] */
  sizeVelocity: [number, number]
  /** Gravity vector */
  gravity: Vector2D
  /** Color(s) to use */
  colors: string[]
  /** Initial opacity range [min, max] */
  opacity: [number, number]
  /** Opacity change rate range [min, max] */
  opacityVelocity: [number, number]
  /** Whether particles should fade out */
  fadeOut: boolean
  /** Whether particles should shrink */
  shrink: boolean
}

/**
 * Particle emitter interface
 */
export interface ParticleEmitter {
  /** Emitter position */
  position: Vector2D
  /** Whether the emitter is active */
  active: boolean
  /** Start emitting particles */
  start: () => void
  /** Stop emitting particles */
  stop: () => void
  /** Emit a burst of particles */
  burst: (count: number) => void
  /** Update all particles */
  update: (deltaTime: number) => void
  /** Get all active particles */
  getParticles: () => Particle[]
  /** Clear all particles */
  clear: () => void
}

// ============================================================================
// Animation Types
// ============================================================================

/**
 * Animation frame definition
 */
export interface AnimationFrame {
  /** Frame duration in milliseconds */
  duration: number
  /** Frame index or sprite region */
  frame: number | Bounds
  /** Optional pivot point offset */
  pivot?: Vector2D
}

/**
 * Animation definition
 */
export interface AnimationDefinition {
  /** Animation name */
  name: string
  /** Array of frames */
  frames: AnimationFrame[]
  /** Whether animation loops */
  loop: boolean
  /** Callback when animation completes */
  onComplete?: () => void
}

/**
 * Animation state
 */
export interface AnimationState {
  /** Current animation name */
  currentAnimation: string
  /** Current frame index */
  currentFrame: number
  /** Time on current frame (ms) */
  frameTime: number
  /** Whether animation is playing */
  playing: boolean
  /** Playback speed multiplier */
  speed: number
}

/**
 * Animation controller interface
 */
export interface AnimationController {
  /** Play an animation */
  play: (name: string, resetIfSame?: boolean) => void
  /** Stop current animation */
  stop: () => void
  /** Pause current animation */
  pause: () => void
  /** Resume paused animation */
  resume: () => void
  /** Update animation state */
  update: (deltaTime: number) => void
  /** Get current animation state */
  getState: () => AnimationState
  /** Get current frame */
  getCurrentFrame: () => AnimationFrame | null
  /** Add animation definition */
  addAnimation: (definition: AnimationDefinition) => void
  /** Remove animation definition */
  removeAnimation: (name: string) => void
  /** Set playback speed */
  setSpeed: (speed: number) => void
}

// ============================================================================
// Score and Combo Types
// ============================================================================

/**
 * Score multiplier configuration
 */
export interface ScoreMultiplierConfig {
  /** Base score multiplier */
  baseMultiplier: number
  /** Combo timeout in milliseconds */
  comboTimeout: number
  /** Maximum combo multiplier */
  maxCombo: number
  /** Score bonus per combo level */
  comboBonus: number
}

/**
 * Score state
 */
export interface ScoreState {
  /** Current score */
  score: number
  /** Current combo count */
  combo: number
  /** Current multiplier */
  multiplier: number
  /** Time since last scoring action (ms) */
  timeSinceLastScore: number
  /** Total points earned this combo */
  comboPoints: number
}

/**
 * Score system interface
 */
export interface ScoreSystem {
  /** Add points */
  addPoints: (basePoints: number) => number
  /** Reset combo */
  resetCombo: () => void
  /** Update score system (for combo timeout) */
  update: (deltaTime: number) => void
  /** Get current score state */
  getState: () => ScoreState
  /** Reset all scores */
  reset: () => void
}

// ============================================================================
// Difficulty Types
// ============================================================================

/**
 * Difficulty level definition
 */
export interface DifficultyLevel {
  /** Difficulty name */
  name: string
  /** Game speed multiplier */
  speedMultiplier: number
  /** Enemy count multiplier */
  enemyMultiplier: number
  /** Score multiplier */
  scoreMultiplier: number
  /** Lives granted */
  lives: number
  /** Custom difficulty parameters */
  parameters: Record<string, number>
}

/**
 * Difficulty progression configuration
 */
export interface DifficultyProgression {
  /** Base difficulty */
  baseDifficulty: DifficultyLevel
  /** How much difficulty increases per level */
  levelScaling: number
  /** Maximum difficulty multiplier */
  maxDifficultyMultiplier: number
  /** Function to calculate current difficulty */
  calculate: (level: number) => DifficultyLevel
}

// ============================================================================
// Power-up Types
// ============================================================================

/**
 * Power-up definition
 */
export interface PowerUp {
  /** Power-up type identifier */
  type: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Duration in milliseconds (0 for instant) */
  duration: number
  /** Effect function */
  apply: (state: unknown) => unknown
  /** Cleanup function */
  remove?: (state: unknown) => unknown
  /** Visual icon or sprite */
  icon: string
  /** Rarity (affects spawn rate) */
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
}

/**
 * Active power-up state
 */
export interface ActivePowerUp {
  /** Power-up type */
  type: string
  /** Remaining duration (ms) */
  remainingTime: number
  /** Total duration (ms) */
  totalDuration: number
  /** When the power-up was activated */
  activatedAt: number
}

// ============================================================================
// Achievement Types
// ============================================================================

/**
 * Achievement definition
 */
export interface Achievement {
  /** Unique achievement ID */
  id: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Achievement icon */
  icon: string
  /** Points awarded */
  points: number
  /** Whether achievement is hidden until unlocked */
  secret: boolean
  /** Condition to check */
  condition: (state: unknown) => boolean
}

/**
 * Achievement progress tracking
 */
export interface AchievementProgress {
  /** Achievement ID */
  achievementId: string
  /** Current progress value */
  current: number
  /** Target value */
  target: number
  /** Whether achievement is unlocked */
  unlocked: boolean
  /** Unlock timestamp */
  unlockedAt: number | null
}

// ============================================================================
// Save/Load Types
// ============================================================================

/**
 * Game save data
 */
export interface SaveData {
  /** Save version for migration */
  version: number
  /** Timestamp of save */
  timestamp: number
  /** High scores per game type */
  highScores: Record<string, number>
  /** Achievement progress */
  achievements: AchievementProgress[]
  /** Total games played */
  gamesPlayed: number
  /** Total score across all games */
  totalScore: number
  /** Total play time in milliseconds */
  totalPlayTime: number
  /** User preferences */
  preferences: Record<string, unknown>
}

/**
 * Save system interface
 */
export interface SaveSystem {
  /** Save current data */
  save: (data: SaveData) => Promise<void>
  /** Load saved data */
  load: () => Promise<SaveData | null>
  /** Check if save exists */
  exists: () => Promise<boolean>
  /** Delete save data */
  delete: () => Promise<void>
  /** Export save as JSON string */
  export: () => Promise<string>
  /** Import save from JSON string */
  import: (data: string) => Promise<void>
}

// ============================================================================
// Re-export Core Types
// ============================================================================

// Re-export types from the main types file for convenience
export type {
  GameState,
  GameConfig,
  GameType,
  GameAction,
  GameInput,
  GameEvent,
  GameEventListener,
  GameRenderer,
  GameEngine,
  Direction,
} from '../types'

export {
  GAME_TYPES,
  createInitialGameState,
  createDefaultGameConfig,
  createEmptyInput,
  isGameActive,
  canPause,
  canResume,
  canStart,
} from '../types'

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type for nested object updates
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Extract the game-specific state type from a GameState
 */
export type GameSpecificState<T> = T extends { gameSpecific?: infer U }
  ? U
  : never

/**
 * Make specific properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Omit specific properties and make them optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>
