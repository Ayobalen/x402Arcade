/**
 * Snake Game Types
 *
 * This module defines TypeScript types and interfaces specific to the Snake game.
 * It extends the core game engine types with snake-specific state and configuration.
 *
 * @module games/snake/types
 */

import type { GameState, GameConfig } from '../types'
import type { SnakeDirection, SnakeDifficulty } from './constants'

// ============================================================================
// Position Types
// ============================================================================

/**
 * Grid position in cell coordinates (not pixels).
 *
 * This interface represents a position on the game grid using cell indices,
 * NOT pixel coordinates. The origin (0,0) is at the top-left corner of the grid.
 *
 * @description
 * - x: Column index, ranges from 0 to GRID_SIZE - 1 (left to right)
 * - y: Row index, ranges from 0 to GRID_SIZE - 1 (top to bottom)
 *
 * To convert to pixel coordinates:
 * - pixelX = x * CELL_SIZE
 * - pixelY = y * CELL_SIZE
 *
 * @example
 * ```ts
 * // Create a position at grid cell (5, 10)
 * const pos: Position = { x: 5, y: 10 }
 *
 * // Check if position is within grid bounds
 * const isValid = pos.x >= 0 && pos.x < GRID_SIZE &&
 *                 pos.y >= 0 && pos.y < GRID_SIZE
 *
 * // Convert to pixel coordinates for rendering
 * const pixelX = pos.x * CELL_SIZE
 * const pixelY = pos.y * CELL_SIZE
 * ```
 */
export interface Position {
  /** Column index (0 to GRID_SIZE - 1), left to right */
  x: number
  /** Row index (0 to GRID_SIZE - 1), top to bottom */
  y: number
}

/**
 * Alias for Position - grid position in cell coordinates.
 * @deprecated Use Position instead for consistency
 */
export type GridPosition = Position

/**
 * Snake segment with position and optional metadata.
 */
export interface SnakeSegment extends Position {
  /** Unique identifier for this segment */
  id?: string
  /** Whether this is the head segment */
  isHead?: boolean
  /** Whether this is the tail segment */
  isTail?: boolean
}

// ============================================================================
// Food Types
// ============================================================================

/**
 * Food type enumeration.
 */
export type FoodType = 'standard' | 'bonus' | 'speed' | 'slow'

/**
 * Food item on the grid.
 */
export interface Food extends GridPosition {
  /** Type of food */
  type: FoodType
  /** Point value of this food */
  points: number
  /** Whether food has special effects */
  hasEffect: boolean
  /** Time remaining before food disappears (for bonus food) */
  timeRemaining?: number
}

// ============================================================================
// Snake Game State
// ============================================================================

/**
 * Snake-specific game state.
 * Extends the base GameState with snake game properties.
 */
export interface SnakeGameSpecificState {
  /** Snake body segments, head is first element */
  segments: SnakeSegment[]
  /** Current movement direction */
  direction: SnakeDirection
  /** Queued direction (for buffered input) */
  nextDirection: SnakeDirection
  /** Current food position */
  food: Food
  /** Current game speed (tick interval in ms) */
  currentSpeed: number
  /** Whether walls wrap around (easy mode) */
  wallsWrap: boolean
  /** Time since last move (for tick timing) */
  timeSinceLastMove: number
  /** Number of food eaten this level */
  foodEatenThisLevel: number
  /** Total food eaten this game */
  totalFoodEaten: number
  /** Highest combo achieved */
  maxCombo: number
  /** Current combo count */
  currentCombo: number
  /** Active power-ups */
  activePowerUps: ActivePowerUp[]
  /** Current difficulty level */
  difficulty?: SnakeDifficulty
}

/**
 * Active power-up state.
 */
export interface ActivePowerUp {
  /** Power-up type identifier */
  type: string
  /** Remaining duration in milliseconds */
  remainingTime: number
  /** Effect multiplier or value */
  value: number
}

/**
 * Complete Snake game state.
 */
export type SnakeState = GameState<SnakeGameSpecificState>

// ============================================================================
// Snake Game Configuration
// ============================================================================

/**
 * Snake-specific configuration options.
 */
export interface SnakeGameSpecificConfig {
  /** Grid size (cells per side) */
  gridSize: number
  /** Cell size in pixels */
  cellSize: number
  /** Initial snake length */
  initialLength: number
  /** Initial game speed (tick interval in ms) */
  initialSpeed: number
  /** Speed increase per level (ms reduction) */
  speedIncreasePerLevel: number
  /** Whether walls kill or wrap */
  wallsWrap: boolean
  /** Difficulty level */
  difficulty: SnakeDifficulty
  /** Enable bonus food spawns */
  enableBonusFood: boolean
  /** Bonus food spawn chance (0-1) */
  bonusFoodChance: number
  /** Food value multiplier */
  foodValueMultiplier: number
  /** Enable screen wrap (snake comes out other side) */
  enableScreenWrap: boolean
  /** Enable self-collision (can die by hitting self) */
  enableSelfCollision: boolean
}

/**
 * Complete Snake game configuration.
 */
export type SnakeConfig = GameConfig<SnakeGameSpecificConfig>

// ============================================================================
// Snake Game Actions
// ============================================================================

/**
 * Snake-specific game actions.
 */
export type SnakeAction =
  | { type: 'CHANGE_DIRECTION'; direction: SnakeDirection }
  | { type: 'MOVE' }
  | { type: 'EAT_FOOD'; food: Food }
  | { type: 'SPAWN_FOOD' }
  | { type: 'GROW' }
  | { type: 'SPEED_UP' }
  | { type: 'COLLISION'; collisionType: 'wall' | 'self' }
  | { type: 'POWER_UP_COLLECTED'; powerUpType: string }
  | { type: 'POWER_UP_EXPIRED'; powerUpType: string }

// ============================================================================
// Snake Game Events
// ============================================================================

/**
 * Snake-specific game events for UI and audio.
 */
export type SnakeEvent =
  | { type: 'SNAKE_MOVED'; position: GridPosition; direction: SnakeDirection }
  | { type: 'FOOD_EATEN'; food: Food; newLength: number }
  | { type: 'SNAKE_GREW'; newLength: number }
  | { type: 'WALL_HIT'; position: GridPosition }
  | { type: 'SELF_HIT'; position: GridPosition }
  | { type: 'DIRECTION_CHANGED'; from: SnakeDirection; to: SnakeDirection }
  | { type: 'SPEED_INCREASED'; newSpeed: number }
  | { type: 'BONUS_FOOD_SPAWNED'; food: Food }
  | { type: 'BONUS_FOOD_EXPIRED'; position: GridPosition }

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Direction vector for movement calculations.
 * Maps direction to grid offset.
 */
export type DirectionVector = Record<SnakeDirection, GridPosition>

/**
 * Opposite direction mapping.
 */
export type OppositeDirection = Record<SnakeDirection, SnakeDirection>

/**
 * High score entry for leaderboard.
 */
export interface SnakeHighScore {
  /** Player identifier */
  playerId: string
  /** Player display name */
  playerName: string
  /** Score achieved */
  score: number
  /** Level reached */
  level: number
  /** Snake length at game end */
  snakeLength: number
  /** Total food eaten */
  foodEaten: number
  /** Game duration in seconds */
  duration: number
  /** Difficulty played */
  difficulty: SnakeDifficulty
  /** Timestamp */
  timestamp: number
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type { SnakeDirection, SnakeDifficulty } from './constants'
export type { Direction } from '../types'
export type { Vector2D } from '../engine/types'
