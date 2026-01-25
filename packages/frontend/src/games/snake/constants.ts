/**
 * Snake Game Constants
 *
 * This module defines all constants for the Snake game including grid dimensions,
 * timing, colors, and difficulty settings.
 *
 * @module games/snake/constants
 */

// ============================================================================
// Grid Constants
// ============================================================================

/**
 * Number of cells per side of the game grid.
 *
 * The game grid is a square with GRID_SIZE × GRID_SIZE cells.
 * A value of 20 creates a 20×20 grid (400 total cells).
 *
 * @description This value directly impacts game difficulty:
 * - Smaller grid (15-18): Harder - less maneuvering room, food seems closer
 * - Standard grid (20): Balanced - good for most players
 * - Larger grid (22-25): Easier - more space to avoid collisions
 *
 * The grid size also affects scoring - smaller grids give bonus multipliers.
 *
 * @example
 * ```ts
 * // Calculate total cells
 * const totalCells = GRID_SIZE * GRID_SIZE // 400
 *
 * // Calculate cell size for rendering
 * const cellSize = canvasWidth / GRID_SIZE // e.g., 800 / 20 = 40px
 * ```
 */
export const GRID_SIZE = 20;

/**
 * Cell dimensions in pixels when rendered on canvas.
 * Each grid cell is a square with this side length.
 *
 * @default 20 pixels
 */
export const CELL_SIZE = 20;

/**
 * Alias for CELL_SIZE for backward compatibility.
 * @deprecated Use CELL_SIZE instead
 */
export const DEFAULT_CELL_SIZE = CELL_SIZE;

// ============================================================================
// Canvas Constants (Derived Values)
// ============================================================================

/**
 * Canvas width in pixels.
 *
 * This is a derived value calculated from GRID_SIZE × CELL_SIZE.
 * For default values: 20 × 20 = 400 pixels.
 *
 * @description The canvas width determines:
 * - The rendering area for the game
 * - The coordinate space for drawing
 * - Should match the actual canvas element width
 *
 * @example
 * ```ts
 * // Create a canvas with the correct dimensions
 * const canvas = document.createElement('canvas')
 * canvas.width = CANVAS_WIDTH   // 400
 * canvas.height = CANVAS_HEIGHT // 400
 * ```
 */
export const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE;

/**
 * Canvas height in pixels.
 *
 * This is a derived value calculated from GRID_SIZE × CELL_SIZE.
 * For default values: 20 × 20 = 400 pixels.
 *
 * @description Since the grid is square, CANVAS_HEIGHT equals CANVAS_WIDTH.
 * Both use the same calculation: GRID_SIZE × CELL_SIZE.
 *
 * @example
 * ```ts
 * // Calculate center of canvas
 * const centerX = CANVAS_WIDTH / 2   // 200
 * const centerY = CANVAS_HEIGHT / 2  // 200
 * ```
 */
export const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE;

// ============================================================================
// Game Speed Constants
// ============================================================================

/**
 * Initial game tick interval in milliseconds.
 * Lower values = faster snake movement.
 *
 * @description Speed by difficulty:
 * - Easy: 200ms (5 moves/second)
 * - Normal: 150ms (6.67 moves/second)
 * - Hard: 100ms (10 moves/second)
 */
export const INITIAL_TICK_INTERVAL = 150;

/**
 * Minimum tick interval in milliseconds (maximum game speed).
 *
 * This constant prevents the game from becoming impossibly fast.
 * At 50ms between moves, the snake moves 20 times per second,
 * which is challenging but still playable for skilled players.
 *
 * @description Speed calculations:
 * - At MIN_SPEED (50ms): 20 moves/second - maximum difficulty
 * - At 100ms: 10 moves/second - hard mode
 * - At 150ms: 6.67 moves/second - normal mode
 * - At 200ms: 5 moves/second - easy mode
 *
 * The game speed is clamped to never go below this value,
 * regardless of how many levels the player advances.
 *
 * @example
 * ```ts
 * // Calculate current tick interval with speed cap
 * const currentSpeed = Math.max(
 *   MIN_SPEED,
 *   INITIAL_TICK_INTERVAL - (level * SPEED_INCREASE)
 * )
 * ```
 */
export const MIN_SPEED = 50;

/**
 * Alias for MIN_SPEED - minimum tick interval (maximum speed cap).
 * @deprecated Use MIN_SPEED for clarity
 */
export const MIN_TICK_INTERVAL = MIN_SPEED;

/**
 * Speed increase per level (percentage).
 * Each level reduces tick interval by this factor.
 */
export const SPEED_INCREASE_PERCENT = 5;

// ============================================================================
// Scoring Constants
// ============================================================================

/**
 * Base points awarded for eating food.
 */
export const BASE_FOOD_SCORE = 10;

/**
 * Bonus multiplier for each level.
 * Score = BASE_FOOD_SCORE × (1 + (level - 1) × LEVEL_SCORE_MULTIPLIER)
 */
export const LEVEL_SCORE_MULTIPLIER = 0.1;

/**
 * Points needed to advance to next level.
 */
export const POINTS_PER_LEVEL = 100;

// ============================================================================
// Snake Constants
// ============================================================================

/**
 * Initial length of the snake (number of segments).
 */
export const INITIAL_SNAKE_LENGTH = 3;

/**
 * Initial direction the snake faces at game start.
 */
export const INITIAL_DIRECTION = 'right' as const;

// ============================================================================
// Visual Constants
// ============================================================================

/**
 * Snake color palette
 */
export const SNAKE_COLORS = {
  /** Snake head color */
  head: '#00ff00',
  /** Snake body color */
  body: '#00cc00',
  /** Snake body gradient end */
  bodyEnd: '#009900',
  /** Snake outline */
  outline: '#006600',
} as const;

/**
 * Food color palette
 * Uses cyan for the retro arcade theme per design system
 */
export const FOOD_COLORS = {
  /** Standard food color - cyan for retro arcade aesthetic */
  standard: '#00ffff',
  /** Bonus food color (worth more points) - magenta accent */
  bonus: '#ff00ff',
  /** Food glow effect - cyan glow */
  glow: 'rgba(0, 255, 255, 0.3)',
} as const;

/**
 * Grid color palette
 */
export const GRID_COLORS = {
  /** Background color */
  background: '#0F0F1A',
  /** Grid line color */
  gridLine: '#1A1A2E',
  /** Border color */
  border: '#2D2D4A',
} as const;

// ============================================================================
// Difficulty Presets
// ============================================================================

/**
 * Difficulty-specific game settings
 */
export const DIFFICULTY_SETTINGS = {
  easy: {
    tickInterval: 200,
    gridSize: 18,
    scoreMultiplier: 0.5,
    wallsKill: false,
  },
  normal: {
    tickInterval: 150,
    gridSize: 20,
    scoreMultiplier: 1.0,
    wallsKill: true,
  },
  hard: {
    tickInterval: 100,
    gridSize: 22,
    scoreMultiplier: 2.0,
    wallsKill: true,
  },
} as const;

// ============================================================================
// Type Exports
// ============================================================================

export type SnakeDirection = 'up' | 'down' | 'left' | 'right';
export type SnakeDifficulty = keyof typeof DIFFICULTY_SETTINGS;
