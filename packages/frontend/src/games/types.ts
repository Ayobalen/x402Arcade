/**
 * Game Engine Core Types
 *
 * This module defines the core interfaces and types that all games
 * in the x402 Arcade must implement. These types ensure consistency
 * across different game implementations.
 *
 * @module games/types
 */

// ============================================================================
// Game State Interface
// ============================================================================

/**
 * Base game state interface that all games must implement.
 *
 * This interface defines the minimum required state properties
 * that every game in the arcade needs to track.
 *
 * @typeParam TGameSpecific - Optional type for game-specific state extension
 *
 * @example
 * ```ts
 * // Basic usage
 * const state: GameState = {
 *   score: 0,
 *   isPlaying: false,
 *   isPaused: false,
 *   isGameOver: false,
 *   level: 1,
 *   lives: 3,
 *   highScore: 0,
 *   startTime: null,
 *   elapsedTime: 0
 * };
 *
 * // With game-specific extension
 * interface SnakeState extends GameState<{
 *   snakeBody: { x: number; y: number }[];
 *   direction: 'up' | 'down' | 'left' | 'right';
 *   food: { x: number; y: number };
 * }> {}
 * ```
 */
export interface GameState<TGameSpecific = Record<string, unknown>> {
  /**
   * Current game score
   */
  score: number

  /**
   * Whether the game is currently being played (active gameplay)
   */
  isPlaying: boolean

  /**
   * Whether the game is paused
   * Only relevant when isPlaying is true
   */
  isPaused: boolean

  /**
   * Whether the game has ended
   * When true, isPlaying should be false
   */
  isGameOver: boolean

  /**
   * Current game level (1-indexed)
   * Used for difficulty progression
   */
  level: number

  /**
   * Remaining lives
   * -1 indicates infinite lives mode
   */
  lives: number

  /**
   * Highest score achieved in current session
   */
  highScore: number

  /**
   * Timestamp when the game started
   * null if game hasn't started
   */
  startTime: number | null

  /**
   * Total elapsed time in milliseconds
   * Excludes paused time
   */
  elapsedTime: number

  /**
   * Game-specific state extension
   * Allows individual games to add custom state properties
   */
  gameSpecific?: TGameSpecific
}

// ============================================================================
// Game Configuration Interface
// ============================================================================

/**
 * Difficulty level for games
 *
 * @description Determines the game's challenge level:
 * - 'easy': Slower gameplay, more lives, forgiving mechanics
 * - 'normal': Balanced gameplay, standard settings
 * - 'hard': Faster gameplay, fewer lives, punishing mechanics
 */
export type GameDifficulty = 'easy' | 'normal' | 'hard'

/**
 * Game configuration options
 *
 * Controls game behavior, difficulty settings, and display options.
 * Uses a generic type parameter to allow game-specific configuration
 * options while maintaining a consistent base configuration.
 *
 * @typeParam TGameSpecificConfig - Optional type for game-specific configuration options
 *
 * @example
 * ```ts
 * // Basic usage
 * const config: GameConfig = {
 *   gameType: 'snake',
 *   displayName: 'Snake',
 *   description: 'Classic snake game',
 *   priceUsdc: 0.01,
 *   width: 800,
 *   height: 600,
 *   difficulty: 'normal',
 *   // ... other required properties
 * };
 *
 * // With game-specific configuration
 * interface SnakeSpecificConfig {
 *   gridSize: number;
 *   initialSnakeLength: number;
 *   wallsWrap: boolean;
 * }
 *
 * const snakeConfig: GameConfig<SnakeSpecificConfig> = {
 *   // base config...
 *   gameSpecificConfig: {
 *     gridSize: 20,
 *     initialSnakeLength: 3,
 *     wallsWrap: false
 *   }
 * };
 * ```
 */
export interface GameConfig<TGameSpecificConfig = Record<string, unknown>> {
  /**
   * Unique identifier for the game type
   */
  gameType: GameType

  /**
   * Display name for the game
   */
  displayName: string

  /**
   * Game description shown in the lobby
   */
  description: string

  /**
   * Cost to play in USDC (e.g., 0.01)
   */
  priceUsdc: number

  /**
   * Initial number of lives
   */
  initialLives: number

  /**
   * Starting level
   */
  startLevel: number

  /**
   * Maximum level (for difficulty cap)
   */
  maxLevel: number

  /**
   * Game canvas width in pixels
   *
   * @description Primary property for canvas width.
   * Alias: canvasWidth (deprecated, use width instead)
   */
  width: number

  /**
   * Game canvas height in pixels
   *
   * @description Primary property for canvas height.
   * Alias: canvasHeight (deprecated, use height instead)
   */
  height: number

  /**
   * Game canvas width in pixels
   *
   * @deprecated Use `width` instead. This alias is kept for backward compatibility.
   */
  canvasWidth: number

  /**
   * Game canvas height in pixels
   *
   * @deprecated Use `height` instead. This alias is kept for backward compatibility.
   */
  canvasHeight: number

  /**
   * Game difficulty level
   *
   * @description Affects gameplay speed, lives, and mechanics:
   * - 'easy': More forgiving, slower pace, extra lives
   * - 'normal': Balanced gameplay (default)
   * - 'hard': Challenging, faster pace, fewer lives
   */
  difficulty: GameDifficulty

  /**
   * Target frames per second
   */
  targetFps: number

  /**
   * Enable sound effects
   */
  soundEnabled: boolean

  /**
   * Enable music
   */
  musicEnabled: boolean

  /**
   * Enable vibration feedback (mobile)
   */
  vibrationEnabled: boolean

  /**
   * Show FPS counter (debug mode)
   */
  showFps: boolean

  /**
   * Enable CRT screen effect
   */
  crtEffectEnabled: boolean

  /**
   * Enable screen shake effects
   */
  screenShakeEnabled: boolean

  /**
   * Game-specific configuration options
   *
   * @description Allows individual games to define custom configuration
   * properties while maintaining type safety through the generic parameter.
   */
  gameSpecificConfig?: TGameSpecificConfig
}

// ============================================================================
// Game Type Enum
// ============================================================================

/**
 * Supported game types in the arcade
 */
export type GameType =
  | 'snake'
  | 'tetris'
  | 'pong'
  | 'breakout'
  | 'space-invaders'

/**
 * Game type metadata
 */
export const GAME_TYPES: Record<
  GameType,
  {
    id: GameType
    name: string
    description: string
    priceUsdc: number
    icon: string
  }
> = {
  snake: {
    id: 'snake',
    name: 'Snake',
    description: 'Guide the snake to eat food and grow longer without hitting walls or yourself.',
    priceUsdc: 0.01,
    icon: '🐍',
  },
  tetris: {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack falling blocks to complete lines and score points.',
    priceUsdc: 0.02,
    icon: '🧱',
  },
  pong: {
    id: 'pong',
    name: 'Pong',
    description: 'Classic paddle game. First to 11 points wins!',
    priceUsdc: 0.01,
    icon: '🏓',
  },
  breakout: {
    id: 'breakout',
    name: 'Breakout',
    description: 'Break all the bricks by bouncing the ball with your paddle.',
    priceUsdc: 0.01,
    icon: '🧱',
  },
  'space-invaders': {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'Defend Earth from waves of alien invaders.',
    priceUsdc: 0.02,
    icon: '👾',
  },
}

// ============================================================================
// Game Actions
// ============================================================================

/**
 * Standard game actions that all games should support
 */
export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'END_GAME'; reason: 'win' | 'lose' | 'quit' }
  | { type: 'RESTART_GAME' }
  | { type: 'UPDATE_SCORE'; points: number }
  | { type: 'LEVEL_UP' }
  | { type: 'LOSE_LIFE' }
  | { type: 'GAIN_LIFE' }
  | { type: 'TICK'; deltaTime: number }

// ============================================================================
// Input Types
// ============================================================================

/**
 * Standard input directions for game controls
 */
export type Direction = 'up' | 'down' | 'left' | 'right'

/**
 * Game input state
 */
export interface GameInput {
  /**
   * Currently pressed direction keys
   */
  directions: Set<Direction>

  /**
   * Primary action button pressed (Space, Enter)
   */
  action: boolean

  /**
   * Secondary action button pressed (Shift)
   */
  secondaryAction: boolean

  /**
   * Pause button pressed (Escape, P)
   */
  pause: boolean

  /**
   * Touch/mouse position for touch-enabled games
   */
  pointer: { x: number; y: number } | null

  /**
   * Whether pointer is currently pressed
   */
  pointerDown: boolean
}

// ============================================================================
// Game Events
// ============================================================================

/**
 * Events emitted by games for UI and sound system
 */
export type GameEvent =
  | { type: 'SCORE_CHANGED'; score: number; delta: number }
  | { type: 'LEVEL_CHANGED'; level: number }
  | { type: 'LIFE_LOST'; livesRemaining: number }
  | { type: 'LIFE_GAINED'; livesRemaining: number }
  | { type: 'GAME_STARTED' }
  | { type: 'GAME_PAUSED' }
  | { type: 'GAME_RESUMED' }
  | { type: 'GAME_OVER'; finalScore: number; isHighScore: boolean }
  | { type: 'COMBO'; multiplier: number; points: number }
  | { type: 'POWER_UP_COLLECTED'; powerUpType: string }
  | { type: 'COLLISION'; entityType: string }
  | { type: 'ACHIEVEMENT_UNLOCKED'; achievementId: string }

/**
 * Game event listener callback
 */
export type GameEventListener = (event: GameEvent) => void

// ============================================================================
// Game Renderer Interface
// ============================================================================

/**
 * Interface for game renderers
 *
 * @typeParam TState - The game-specific state type
 * @typeParam TGameSpecificConfig - Game-specific configuration options
 */
export interface GameRenderer<
  TState extends GameState = GameState,
  TGameSpecificConfig = Record<string, unknown>
> {
  /**
   * Initialize the renderer with canvas context
   */
  init: (ctx: CanvasRenderingContext2D, config: GameConfig<TGameSpecificConfig>) => void

  /**
   * Render the current game state
   */
  render: (state: TState, deltaTime: number) => void

  /**
   * Clear the canvas
   */
  clear: () => void

  /**
   * Clean up renderer resources
   */
  dispose: () => void
}

// ============================================================================
// Game Engine Interface
// ============================================================================

/**
 * Core game engine interface that all games implement
 *
 * @typeParam TState - The game-specific state type
 * @typeParam TGameSpecific - Game-specific state properties
 * @typeParam TGameSpecificConfig - Game-specific configuration options
 */
export interface GameEngine<
  TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
  TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
  TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
> {
  /**
   * Get the current game state
   */
  getState: () => TState

  /**
   * Initialize the game with configuration
   */
  init: (config: GameConfig<TGameSpecificConfig>) => void

  /**
   * Start a new game
   */
  start: () => void

  /**
   * Pause the game
   */
  pause: () => void

  /**
   * Resume a paused game
   */
  resume: () => void

  /**
   * End the game
   */
  end: (reason: 'win' | 'lose' | 'quit') => void

  /**
   * Restart the game
   */
  restart: () => void

  /**
   * Update game state for one frame
   */
  update: (deltaTime: number, input: GameInput) => void

  /**
   * Dispatch a game action
   */
  dispatch: (action: GameAction) => void

  /**
   * Subscribe to game events
   */
  subscribe: (listener: GameEventListener) => () => void

  /**
   * Clean up game resources
   */
  dispose: () => void
}

// ============================================================================
// Default Values
// ============================================================================

/**
 * Create an initial game state with default values
 */
export function createInitialGameState<TGameSpecific = Record<string, unknown>>(
  gameSpecific?: TGameSpecific
): GameState<TGameSpecific> {
  return {
    score: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    level: 1,
    lives: 3,
    highScore: 0,
    startTime: null,
    elapsedTime: 0,
    gameSpecific,
  }
}

/**
 * Create a default game configuration
 *
 * @typeParam TGameSpecificConfig - Optional type for game-specific configuration
 * @param gameType - The type of game to create configuration for
 * @param overrides - Optional partial configuration to override defaults
 * @returns A complete GameConfig object with all required properties
 *
 * @example
 * ```ts
 * // Basic usage
 * const config = createDefaultGameConfig('snake');
 *
 * // With overrides
 * const hardConfig = createDefaultGameConfig('tetris', {
 *   difficulty: 'hard',
 *   initialLives: 1
 * });
 *
 * // With game-specific config
 * const snakeConfig = createDefaultGameConfig<{ gridSize: number }>('snake', {
 *   gameSpecificConfig: { gridSize: 25 }
 * });
 * ```
 */
export function createDefaultGameConfig<TGameSpecificConfig = Record<string, unknown>>(
  gameType: GameType,
  overrides: Partial<GameConfig<TGameSpecificConfig>> = {}
): GameConfig<TGameSpecificConfig> {
  const gameInfo = GAME_TYPES[gameType]

  // Default canvas dimensions
  const defaultWidth = 800
  const defaultHeight = 600

  return {
    gameType,
    displayName: gameInfo.name,
    description: gameInfo.description,
    priceUsdc: gameInfo.priceUsdc,
    initialLives: 3,
    startLevel: 1,
    maxLevel: 99,
    // New primary properties
    width: defaultWidth,
    height: defaultHeight,
    // Deprecated aliases (kept for backward compatibility)
    canvasWidth: defaultWidth,
    canvasHeight: defaultHeight,
    // New difficulty property
    difficulty: 'normal',
    targetFps: 60,
    soundEnabled: true,
    musicEnabled: true,
    vibrationEnabled: true,
    showFps: false,
    crtEffectEnabled: true,
    screenShakeEnabled: true,
    ...overrides,
    // Ensure width/height and canvasWidth/canvasHeight stay in sync
    ...(overrides.width !== undefined && {
      canvasWidth: overrides.canvasWidth ?? overrides.width,
    }),
    ...(overrides.height !== undefined && {
      canvasHeight: overrides.canvasHeight ?? overrides.height,
    }),
    ...(overrides.canvasWidth !== undefined && {
      width: overrides.width ?? overrides.canvasWidth,
    }),
    ...(overrides.canvasHeight !== undefined && {
      height: overrides.height ?? overrides.canvasHeight,
    }),
  }
}

/**
 * Create an empty game input state
 */
export function createEmptyInput(): GameInput {
  return {
    directions: new Set<Direction>(),
    action: false,
    secondaryAction: false,
    pause: false,
    pointer: null,
    pointerDown: false,
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a game is currently active (playing and not paused)
 */
export function isGameActive(state: GameState): boolean {
  return state.isPlaying && !state.isPaused && !state.isGameOver
}

/**
 * Check if a game can be paused
 */
export function canPause(state: GameState): boolean {
  return state.isPlaying && !state.isPaused && !state.isGameOver
}

/**
 * Check if a game can be resumed
 */
export function canResume(state: GameState): boolean {
  return state.isPlaying && state.isPaused && !state.isGameOver
}

/**
 * Check if a game can be started
 */
export function canStart(state: GameState): boolean {
  return !state.isPlaying || state.isGameOver
}

// ============================================================================
// Difficulty Utilities
// ============================================================================

/**
 * All valid difficulty levels
 */
export const DIFFICULTY_LEVELS: readonly GameDifficulty[] = ['easy', 'normal', 'hard'] as const

/**
 * Difficulty level metadata
 */
export const DIFFICULTY_INFO: Record<
  GameDifficulty,
  {
    level: GameDifficulty
    name: string
    description: string
    speedMultiplier: number
    livesMultiplier: number
    scoreMultiplier: number
  }
> = {
  easy: {
    level: 'easy',
    name: 'Easy',
    description: 'Relaxed gameplay with extra lives and slower pace',
    speedMultiplier: 0.75,
    livesMultiplier: 1.5,
    scoreMultiplier: 0.5,
  },
  normal: {
    level: 'normal',
    name: 'Normal',
    description: 'Balanced gameplay for most players',
    speedMultiplier: 1.0,
    livesMultiplier: 1.0,
    scoreMultiplier: 1.0,
  },
  hard: {
    level: 'hard',
    name: 'Hard',
    description: 'Challenging gameplay with faster pace and fewer lives',
    speedMultiplier: 1.5,
    livesMultiplier: 0.5,
    scoreMultiplier: 2.0,
  },
}

/**
 * Check if a string is a valid difficulty level
 */
export function isValidDifficulty(value: string): value is GameDifficulty {
  return DIFFICULTY_LEVELS.includes(value as GameDifficulty)
}

/**
 * Get difficulty modifiers for game settings
 */
export function getDifficultyModifiers(difficulty: GameDifficulty): {
  speedMultiplier: number
  livesMultiplier: number
  scoreMultiplier: number
} {
  return {
    speedMultiplier: DIFFICULTY_INFO[difficulty].speedMultiplier,
    livesMultiplier: DIFFICULTY_INFO[difficulty].livesMultiplier,
    scoreMultiplier: DIFFICULTY_INFO[difficulty].scoreMultiplier,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  GAME_TYPES,
  DIFFICULTY_LEVELS,
  DIFFICULTY_INFO,
  createInitialGameState,
  createDefaultGameConfig,
  createEmptyInput,
  isGameActive,
  canPause,
  canResume,
  canStart,
  isValidDifficulty,
  getDifficultyModifiers,
}
