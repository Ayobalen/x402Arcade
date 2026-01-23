/**
 * Snake Game Logic
 *
 * Pure functions for Snake game state manipulation.
 * All functions are side-effect free and return new state objects.
 *
 * @module games/snake/logic
 */

import type {
  Position,
  SnakeSegment,
  Food,
  FoodType,
  SnakeGameSpecificState,
  SnakeState,
  SnakeConfig,
  DirectionVector,
  OppositeDirection,
} from './types'
import type { SnakeDirection } from './constants'
import {
  GRID_SIZE,
  INITIAL_TICK_INTERVAL,
  MIN_SPEED,
  SPEED_INCREASE_PERCENT,
  BASE_FOOD_SCORE,
  LEVEL_SCORE_MULTIPLIER,
  INITIAL_SNAKE_LENGTH,
  INITIAL_DIRECTION,
} from './constants'

// ============================================================================
// Direction Utilities
// ============================================================================

/**
 * Direction vectors for movement.
 * Maps direction to the grid offset for moving in that direction.
 */
export const DIRECTION_VECTORS: DirectionVector = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

/**
 * Opposite direction mapping.
 * Used to prevent snake from reversing into itself.
 */
export const OPPOSITE_DIRECTIONS: OppositeDirection = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

/**
 * Check if two directions are opposite.
 *
 * @param dir1 - First direction
 * @param dir2 - Second direction
 * @returns True if directions are opposite
 */
export function areOppositeDirections(
  dir1: SnakeDirection,
  dir2: SnakeDirection
): boolean {
  return OPPOSITE_DIRECTIONS[dir1] === dir2
}

/**
 * Check if a direction change is valid (not reversing).
 *
 * @param currentDirection - Current snake direction
 * @param newDirection - Requested new direction
 * @returns True if the direction change is allowed
 */
export function isValidDirectionChange(
  currentDirection: SnakeDirection,
  newDirection: SnakeDirection
): boolean {
  // Same direction is always valid (no change)
  if (currentDirection === newDirection) return true
  // Opposite direction is not valid (would reverse into self)
  return !areOppositeDirections(currentDirection, newDirection)
}

// ============================================================================
// Position Utilities
// ============================================================================

/**
 * Check if two positions are equal.
 *
 * @param a - First position
 * @param b - Second position
 * @returns True if positions have same x and y
 */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}

/**
 * Check if a position is within the grid bounds.
 *
 * @param pos - Position to check
 * @param gridSize - Grid size (cells per side)
 * @returns True if position is within bounds
 */
export function isWithinBounds(
  pos: Position,
  gridSize: number = GRID_SIZE
): boolean {
  return pos.x >= 0 && pos.x < gridSize && pos.y >= 0 && pos.y < gridSize
}

/**
 * Wrap a position around the grid edges (for wrap mode).
 *
 * @param pos - Position to wrap
 * @param gridSize - Grid size (cells per side)
 * @returns Wrapped position
 */
export function wrapPosition(
  pos: Position,
  gridSize: number = GRID_SIZE
): Position {
  return {
    x: ((pos.x % gridSize) + gridSize) % gridSize,
    y: ((pos.y % gridSize) + gridSize) % gridSize,
  }
}

/**
 * Calculate the next position based on current position and direction.
 *
 * @param pos - Current position
 * @param direction - Direction to move
 * @returns New position after moving
 */
export function getNextPosition(
  pos: Position,
  direction: SnakeDirection
): Position {
  const vector = DIRECTION_VECTORS[direction]
  return {
    x: pos.x + vector.x,
    y: pos.y + vector.y,
  }
}

// ============================================================================
// Snake Utilities
// ============================================================================

/**
 * Get the snake head position.
 *
 * @param segments - Snake body segments
 * @returns Head position (first segment)
 */
export function getSnakeHead(segments: SnakeSegment[]): Position {
  return segments[0]
}

/**
 * Get the snake tail position.
 *
 * @param segments - Snake body segments
 * @returns Tail position (last segment)
 */
export function getSnakeTail(segments: SnakeSegment[]): Position {
  return segments[segments.length - 1]
}

/**
 * Check if a position collides with the snake body.
 *
 * @param pos - Position to check
 * @param segments - Snake body segments
 * @param excludeHead - Whether to exclude the head from collision check
 * @returns True if position collides with snake
 */
export function collidesWithSnake(
  pos: Position,
  segments: SnakeSegment[],
  excludeHead: boolean = false
): boolean {
  const startIndex = excludeHead ? 1 : 0
  return segments.slice(startIndex).some((segment) => positionsEqual(pos, segment))
}

/**
 * Check if the snake head collides with its body.
 *
 * @param segments - Snake body segments
 * @returns True if snake has collided with itself
 */
export function checkSelfCollision(segments: SnakeSegment[]): boolean {
  if (segments.length < 2) return false
  const head = getSnakeHead(segments)
  return collidesWithSnake(head, segments, true)
}

/**
 * Create initial snake segments.
 *
 * @param length - Initial snake length
 * @param startPosition - Starting head position
 * @param direction - Initial facing direction
 * @returns Array of snake segments
 */
export function createInitialSnake(
  length: number = INITIAL_SNAKE_LENGTH,
  startPosition: Position = { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
  direction: SnakeDirection = INITIAL_DIRECTION
): SnakeSegment[] {
  const oppositeVector = DIRECTION_VECTORS[OPPOSITE_DIRECTIONS[direction]]
  const segments: SnakeSegment[] = []

  for (let i = 0; i < length; i++) {
    segments.push({
      x: startPosition.x + oppositeVector.x * i,
      y: startPosition.y + oppositeVector.y * i,
      isHead: i === 0,
      isTail: i === length - 1,
    })
  }

  return segments
}

/**
 * Move the snake in the given direction.
 *
 * @param segments - Current snake segments
 * @param direction - Direction to move
 * @param grow - Whether the snake should grow (don't remove tail)
 * @param wrapEnabled - Whether to wrap around grid edges
 * @param gridSize - Grid size for wrapping
 * @returns New snake segments array
 */
export function moveSnake(
  segments: SnakeSegment[],
  direction: SnakeDirection,
  grow: boolean = false,
  wrapEnabled: boolean = false,
  gridSize: number = GRID_SIZE
): SnakeSegment[] {
  const head = getSnakeHead(segments)
  let newHeadPos = getNextPosition(head, direction)

  // Wrap position if enabled
  if (wrapEnabled) {
    newHeadPos = wrapPosition(newHeadPos, gridSize)
  }

  // Create new head segment
  const newHead: SnakeSegment = {
    ...newHeadPos,
    isHead: true,
    isTail: false,
  }

  // Create new segments array
  const newSegments = [newHead]

  // Add existing segments (shifted)
  for (let i = 0; i < segments.length - (grow ? 0 : 1); i++) {
    newSegments.push({
      ...segments[i],
      isHead: false,
      isTail: i === segments.length - (grow ? 1 : 2),
    })
  }

  return newSegments
}

// ============================================================================
// Food Utilities
// ============================================================================

/**
 * Generate a random position on the grid.
 *
 * @param gridSize - Grid size (cells per side)
 * @returns Random position within grid bounds
 */
export function getRandomPosition(gridSize: number = GRID_SIZE): Position {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize),
  }
}

/**
 * Spawn food at a random position that doesn't collide with the snake.
 *
 * @param segments - Snake body segments to avoid
 * @param gridSize - Grid size (cells per side)
 * @param type - Type of food to spawn
 * @returns Food object at a valid position
 */
export function spawnFood(
  segments: SnakeSegment[],
  gridSize: number = GRID_SIZE,
  type: FoodType = 'standard'
): Food {
  let position: Position
  let attempts = 0
  const maxAttempts = gridSize * gridSize

  // Find a position that doesn't collide with the snake
  do {
    position = getRandomPosition(gridSize)
    attempts++
  } while (collidesWithSnake(position, segments) && attempts < maxAttempts)

  // Calculate points based on food type
  const pointsMap: Record<FoodType, number> = {
    standard: BASE_FOOD_SCORE,
    bonus: BASE_FOOD_SCORE * 5,
    speed: BASE_FOOD_SCORE * 2,
    slow: BASE_FOOD_SCORE * 2,
  }

  return {
    ...position,
    type,
    points: pointsMap[type],
    hasEffect: type !== 'standard',
    timeRemaining: type === 'bonus' ? 5000 : undefined, // 5 seconds for bonus food
  }
}

/**
 * Generate food at a random valid position.
 *
 * This is a simplified version of spawnFood that returns only a Position.
 * Food must not appear on the snake body.
 *
 * @param snake - Array of snake body positions to avoid
 * @param gridSize - Grid size (cells per side)
 * @returns Position object at a valid location
 */
export function generateFood(
  snake: Position[],
  gridSize: number = GRID_SIZE
): Position {
  let position: Position
  let attempts = 0
  const maxAttempts = gridSize * gridSize

  // Find a position that doesn't collide with the snake
  do {
    position = getRandomPosition(gridSize)
    attempts++
  } while (
    snake.some((segment) => positionsEqual(position, segment)) &&
    attempts < maxAttempts
  )

  return position
}

/**
 * Check if the snake head is eating food.
 *
 * @param segments - Snake body segments
 * @param food - Food position
 * @returns True if snake head is on food
 */
export function isEatingFood(segments: SnakeSegment[], food: Food): boolean {
  const head = getSnakeHead(segments)
  return positionsEqual(head, food)
}

// ============================================================================
// Score Utilities
// ============================================================================

/**
 * Calculate score for eating food.
 *
 * @param food - Food being eaten
 * @param level - Current game level
 * @param combo - Current combo count
 * @returns Points earned
 */
export function calculateScore(
  food: Food,
  level: number = 1,
  combo: number = 0
): number {
  const basePoints = food.points
  const levelMultiplier = 1 + (level - 1) * LEVEL_SCORE_MULTIPLIER
  const comboMultiplier = 1 + combo * 0.1 // 10% bonus per combo
  return Math.round(basePoints * levelMultiplier * comboMultiplier)
}

/**
 * Calculate the game speed (tick interval) for a given level.
 *
 * @param level - Current game level
 * @param baseSpeed - Base tick interval
 * @returns Tick interval in milliseconds (never below MIN_SPEED)
 */
export function calculateSpeed(
  level: number,
  baseSpeed: number = INITIAL_TICK_INTERVAL
): number {
  const reduction = baseSpeed * (SPEED_INCREASE_PERCENT / 100) * (level - 1)
  return Math.max(MIN_SPEED, baseSpeed - reduction)
}

// ============================================================================
// State-Level Game Functions
// ============================================================================

/**
 * Process one snake move and return updated game state.
 *
 * This is the main game tick function that handles:
 * - Snake movement in the current direction
 * - Wall and self collision detection
 * - Food eating and growth
 * - Score and level updates
 *
 * @param state - Current full snake game state
 * @returns New game state after processing one move (immutable update)
 */
export function processSnakeMove(state: SnakeState): SnakeState {
  // Return unchanged state if game is paused or over
  if (state.isPaused || state.isGameOver || !state.isPlaying) {
    return state
  }

  const gameSpecific = state.gameSpecific
  if (!gameSpecific) {
    return state
  }

  // Get current state values
  const { segments, nextDirection, food, wallsWrap, currentSpeed } = gameSpecific
  const gridSize = GRID_SIZE

  // Calculate next head position
  const head = getSnakeHead(segments)
  let newHeadPos = getNextPosition(head, nextDirection)

  // Handle wall wrapping or collision
  if (wallsWrap) {
    newHeadPos = wrapPosition(newHeadPos, gridSize)
  } else if (!isWithinBounds(newHeadPos, gridSize)) {
    // Wall collision - game over
    return {
      ...state,
      isPlaying: false,
      isGameOver: true,
      highScore: Math.max(state.highScore, state.score),
    }
  }

  // Check for self collision (check against current body, not the new head position)
  const wouldCollideWithSelf = collidesWithSnake(newHeadPos, segments, false)
  if (wouldCollideWithSelf) {
    // Self collision - game over
    return {
      ...state,
      isPlaying: false,
      isGameOver: true,
      highScore: Math.max(state.highScore, state.score),
    }
  }

  // Check if eating food
  const eating = positionsEqual(newHeadPos, food)

  // Move the snake (grow if eating)
  const newSegments = moveSnake(segments, nextDirection, eating, wallsWrap, gridSize)

  // Calculate new score and food if eating
  let newScore = state.score
  let newFood = food
  let newFoodEatenThisLevel = gameSpecific.foodEatenThisLevel
  let newTotalFoodEaten = gameSpecific.totalFoodEaten
  let newCombo = gameSpecific.currentCombo
  let newMaxCombo = gameSpecific.maxCombo
  let newLevel = state.level
  let newSpeed = currentSpeed

  if (eating) {
    // Calculate score with combo bonus
    newCombo += 1
    newMaxCombo = Math.max(newMaxCombo, newCombo)
    newScore += calculateScore(food, state.level, newCombo)

    // Update food counters
    newFoodEatenThisLevel += 1
    newTotalFoodEaten += 1

    // Check for level up (every 10 food)
    if (newFoodEatenThisLevel >= 10) {
      newLevel += 1
      newFoodEatenThisLevel = 0
      newSpeed = calculateSpeed(newLevel)
    }

    // Spawn new food
    newFood = spawnFood(newSegments, gridSize)
  } else {
    // Reset combo if not eating
    newCombo = 0
  }

  // Return new state
  return {
    ...state,
    score: newScore,
    level: newLevel,
    highScore: Math.max(state.highScore, newScore),
    gameSpecific: {
      ...gameSpecific,
      segments: newSegments,
      direction: nextDirection,
      food: newFood,
      currentSpeed: newSpeed,
      foodEatenThisLevel: newFoodEatenThisLevel,
      totalFoodEaten: newTotalFoodEaten,
      currentCombo: newCombo,
      maxCombo: newMaxCombo,
      timeSinceLastMove: 0,
    },
  }
}

/**
 * Change the snake's direction.
 *
 * Validates that the new direction is allowed (not reversing into self)
 * and queues the direction change for the next move.
 *
 * @param state - Current full snake game state
 * @param newDirection - The new direction to change to
 * @returns New game state with updated nextDirection, or unchanged if invalid
 */
export function changeDirection(
  state: SnakeState,
  newDirection: SnakeDirection
): SnakeState {
  // Return unchanged state if game is paused or over
  if (state.isPaused || state.isGameOver || !state.isPlaying) {
    return state
  }

  const gameSpecific = state.gameSpecific
  if (!gameSpecific) {
    return state
  }

  // Validate the direction is a valid SnakeDirection
  const validDirections: SnakeDirection[] = ['up', 'down', 'left', 'right']
  if (!validDirections.includes(newDirection)) {
    return state
  }

  // Check if direction change is allowed (can't reverse into self)
  const currentDirection = gameSpecific.direction
  if (!isValidDirectionChange(currentDirection, newDirection)) {
    return state
  }

  // Return new state with updated nextDirection
  return {
    ...state,
    gameSpecific: {
      ...gameSpecific,
      nextDirection: newDirection,
    },
  }
}

// ============================================================================
// State Creation
// ============================================================================

/**
 * Create initial snake game specific state.
 *
 * @param config - Game configuration
 * @returns Initial game-specific state
 */
export function createInitialSnakeState(
  config?: Partial<SnakeConfig>
): SnakeGameSpecificState {
  const gridSize = config?.gameSpecificConfig?.gridSize ?? GRID_SIZE
  const initialSpeed = config?.gameSpecificConfig?.initialSpeed ?? INITIAL_TICK_INTERVAL
  const initialLength = config?.gameSpecificConfig?.initialLength ?? INITIAL_SNAKE_LENGTH
  const wallsWrap = config?.gameSpecificConfig?.wallsWrap ?? false

  const segments = createInitialSnake(initialLength)
  const food = spawnFood(segments, gridSize)

  return {
    segments,
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food,
    currentSpeed: initialSpeed,
    wallsWrap,
    timeSinceLastMove: 0,
    foodEatenThisLevel: 0,
    totalFoodEaten: 0,
    maxCombo: 0,
    currentCombo: 0,
    activePowerUps: [],
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  // Direction utilities
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  areOppositeDirections,
  isValidDirectionChange,
  // Position utilities
  positionsEqual,
  isWithinBounds,
  wrapPosition,
  getNextPosition,
  // Snake utilities
  getSnakeHead,
  getSnakeTail,
  collidesWithSnake,
  checkSelfCollision,
  createInitialSnake,
  moveSnake,
  // Food utilities
  getRandomPosition,
  generateFood,
  spawnFood,
  isEatingFood,
  // Score utilities
  calculateScore,
  calculateSpeed,
  // State-level functions
  processSnakeMove,
  changeDirection,
  // State creation
  createInitialSnakeState,
}
