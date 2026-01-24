/**
 * Tetris Game Constants
 *
 * This module defines all constants for the Tetris game including grid dimensions,
 * timing, scoring, and tetromino definitions.
 *
 * @module games/tetris/constants
 */

// ============================================================================
// Grid Constants
// ============================================================================

/**
 * Number of columns in the Tetris board.
 *
 * Standard Tetris uses a 10-column board.
 *
 * @description This is the horizontal dimension of the play field.
 * All tetrominoes must fit within this width.
 *
 * @example
 * ```ts
 * // Check if piece fits
 * const fitsInBoard = pieceX >= 0 && pieceX + pieceWidth <= BOARD_WIDTH
 * ```
 */
export const BOARD_WIDTH = 10

/**
 * Number of rows in the Tetris board.
 *
 * Standard Tetris uses a 20-row visible board.
 *
 * @description This is the vertical dimension of the play field.
 * The game ends when pieces stack above this height.
 *
 * @example
 * ```ts
 * // Check if game over
 * const isGameOver = board[0].some(cell => cell !== 0)
 * ```
 */
export const BOARD_HEIGHT = 20

/**
 * Size of each cell in pixels when rendered on canvas.
 *
 * Each grid cell is a square with this side length.
 *
 * @default 24 pixels
 */
export const CELL_SIZE = 24

/**
 * Number of hidden rows above the visible board.
 *
 * These rows are used for piece spawning and rotation near the top.
 * Pieces spawn in this hidden area and become visible as they drop.
 */
export const HIDDEN_ROWS = 2

/**
 * Total board height including hidden rows.
 */
export const TOTAL_BOARD_HEIGHT = BOARD_HEIGHT + HIDDEN_ROWS

// ============================================================================
// Canvas Constants (Derived Values)
// ============================================================================

/**
 * Canvas width in pixels.
 *
 * Calculated from BOARD_WIDTH × CELL_SIZE.
 * For default values: 10 × 24 = 240 pixels.
 */
export const CANVAS_WIDTH = BOARD_WIDTH * CELL_SIZE

/**
 * Canvas height in pixels.
 *
 * Calculated from BOARD_HEIGHT × CELL_SIZE.
 * For default values: 20 × 24 = 480 pixels.
 */
export const CANVAS_HEIGHT = BOARD_HEIGHT * CELL_SIZE

// ============================================================================
// Timing Constants
// ============================================================================

/**
 * Initial drop speed in milliseconds.
 *
 * This is the time between automatic downward movements at level 1.
 * Lower values = faster drops.
 *
 * @description Speed at 1000ms means the piece drops 1 row per second.
 * This provides a comfortable starting pace for new players.
 *
 * @example
 * ```ts
 * // Calculate current drop speed
 * const speed = INITIAL_DROP_SPEED * Math.pow(LEVEL_SPEED_MULTIPLIER, level - 1)
 * ```
 */
export const INITIAL_DROP_SPEED = 1000

/**
 * Speed multiplier applied per level.
 *
 * Each level, the drop speed is multiplied by this value.
 * At 0.9, each level is 10% faster than the previous.
 *
 * @description Speed progression:
 * - Level 1: 1000ms
 * - Level 2: 900ms (10% faster)
 * - Level 3: 810ms (19% faster total)
 * - Level 5: 656ms (34% faster total)
 * - Level 10: 387ms (61% faster total)
 * - Level 15: 206ms (79% faster total)
 *
 * @example
 * ```ts
 * const currentSpeed = INITIAL_DROP_SPEED * Math.pow(LEVEL_SPEED_MULTIPLIER, level - 1)
 * ```
 */
export const LEVEL_SPEED_MULTIPLIER = 0.9

/**
 * Minimum drop speed in milliseconds (maximum speed cap).
 *
 * Prevents the game from becoming impossibly fast at high levels.
 * At 50ms, pieces drop 20 rows per second.
 */
export const MIN_DROP_SPEED = 50

/**
 * Soft drop speed multiplier.
 *
 * When holding down, drop speed is divided by this value.
 * At 20, soft drop is 20x faster than normal drop.
 */
export const SOFT_DROP_MULTIPLIER = 20

/**
 * Lock delay in milliseconds.
 *
 * Time a piece sits on the ground before locking in place.
 * Allows for last-second adjustments.
 */
export const LOCK_DELAY = 500

/**
 * Maximum lock delay resets per piece.
 *
 * Each movement resets the lock delay, but only this many times.
 * Prevents infinite stalling.
 */
export const MAX_LOCK_RESETS = 15

/**
 * DAS (Delayed Auto Shift) initial delay in milliseconds.
 *
 * Time to hold left/right before auto-repeat starts.
 */
export const DAS_DELAY = 170

/**
 * ARR (Auto Repeat Rate) in milliseconds.
 *
 * Time between auto-repeat movements after DAS activates.
 */
export const ARR_RATE = 50

// ============================================================================
// Scoring Constants
// ============================================================================

/**
 * Points awarded for clearing lines.
 *
 * Based on original Tetris scoring:
 * - 1 line (Single): 100 × level
 * - 2 lines (Double): 300 × level
 * - 3 lines (Triple): 500 × level
 * - 4 lines (Tetris): 800 × level
 */
export const LINE_CLEAR_SCORES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
} as const

/**
 * Bonus multiplier for back-to-back Tetris clears.
 */
export const BACK_TO_BACK_MULTIPLIER = 1.5

/**
 * Points awarded per cell for soft drop.
 */
export const SOFT_DROP_POINTS = 1

/**
 * Points awarded per cell for hard drop.
 */
export const HARD_DROP_POINTS = 2

/**
 * T-Spin scoring bonuses.
 */
export const T_SPIN_SCORES = {
  /** T-Spin with no line clear */
  none: 400,
  /** T-Spin Single */
  single: 800,
  /** T-Spin Double */
  double: 1200,
  /** T-Spin Triple */
  triple: 1600,
  /** Mini T-Spin */
  mini: 100,
  /** Mini T-Spin Single */
  miniSingle: 200,
} as const

/**
 * Lines required to advance to the next level.
 */
export const LINES_PER_LEVEL = 10

// ============================================================================
// Tetromino Definitions
// ============================================================================

/**
 * Tetromino piece types.
 *
 * Each letter represents the shape of the piece:
 * - I: Long straight piece (4 cells)
 * - O: Square piece (2×2)
 * - T: T-shaped piece
 * - S: S-shaped zigzag
 * - Z: Z-shaped zigzag
 * - J: J-shaped piece
 * - L: L-shaped piece
 */
export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

/**
 * All tetromino types for random generation.
 */
export const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

/**
 * Tetromino color palette.
 *
 * Colors follow the Tetris guideline standard:
 * - I: Cyan
 * - O: Yellow
 * - T: Purple (matching our design system)
 * - S: Green
 * - Z: Red
 * - J: Blue
 * - L: Orange
 */
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: '#00FFFF', // Cyan
  O: '#FFFF00', // Yellow
  T: '#8B5CF6', // Purple (from design system)
  S: '#00FF00', // Green
  Z: '#FF0000', // Red
  J: '#0000FF', // Blue
  L: '#FFA500', // Orange
} as const

/**
 * Tetromino shapes represented as 2D arrays.
 *
 * Each shape is defined in its spawn rotation state.
 * 1 = filled cell, 0 = empty cell.
 */
export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
} as const

/**
 * Spawn positions for each tetromino type.
 *
 * X position is column offset from left.
 * Y position is row offset from top (negative = above visible area).
 */
export const SPAWN_POSITIONS: Record<TetrominoType, { x: number; y: number }> = {
  I: { x: 3, y: -1 },
  O: { x: 4, y: 0 },
  T: { x: 3, y: 0 },
  S: { x: 3, y: 0 },
  Z: { x: 3, y: 0 },
  J: { x: 3, y: 0 },
  L: { x: 3, y: 0 },
} as const

// ============================================================================
// Wall Kick Data (SRS - Super Rotation System)
// ============================================================================

/**
 * Wall kick offsets for J, L, S, T, Z pieces.
 *
 * Format: [rotation_state][test_number] = [x_offset, y_offset]
 * Rotation states: 0 = spawn, 1 = CW, 2 = 180°, 3 = CCW
 */
export const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1->0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1->2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2->1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3->2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3->0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0->3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
} as const

/**
 * Wall kick offsets for I piece.
 *
 * I piece has different kick data due to its unique shape.
 */
export const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
} as const

// ============================================================================
// Visual Constants
// ============================================================================

/**
 * Board visual styling.
 */
export const BOARD_COLORS = {
  /** Background color (from design system) */
  background: '#0F0F1A',
  /** Grid line color */
  gridLine: '#1A1A2E',
  /** Border color */
  border: '#2D2D4A',
  /** Ghost piece opacity */
  ghostOpacity: 0.3,
} as const

/**
 * UI element colors.
 */
export const UI_COLORS = {
  /** Primary accent (from design system) */
  primary: '#8B5CF6',
  /** Primary hover state */
  primaryHover: '#A78BFA',
  /** Text color */
  text: '#F8FAFC',
  /** Muted text */
  textMuted: '#94A3B8',
} as const

// ============================================================================
// Preview Constants
// ============================================================================

/**
 * Number of next pieces to show in preview.
 */
export const PREVIEW_COUNT = 5

/**
 * Size of preview cell in pixels.
 */
export const PREVIEW_CELL_SIZE = 16

// ============================================================================
// Hold Constants
// ============================================================================

/**
 * Whether hold feature is enabled.
 */
export const HOLD_ENABLED = true

/**
 * Size of hold display cell in pixels.
 */
export const HOLD_CELL_SIZE = 20

// ============================================================================
// Difficulty Presets
// ============================================================================

/**
 * Difficulty-specific game settings.
 */
export const DIFFICULTY_SETTINGS = {
  easy: {
    initialDropSpeed: 1200,
    levelSpeedMultiplier: 0.95,
    lockDelay: 700,
    ghostPiece: true,
    holdEnabled: true,
    previewCount: 5,
  },
  normal: {
    initialDropSpeed: 1000,
    levelSpeedMultiplier: 0.9,
    lockDelay: 500,
    ghostPiece: true,
    holdEnabled: true,
    previewCount: 4,
  },
  hard: {
    initialDropSpeed: 700,
    levelSpeedMultiplier: 0.85,
    lockDelay: 300,
    ghostPiece: true,
    holdEnabled: true,
    previewCount: 3,
  },
  expert: {
    initialDropSpeed: 500,
    levelSpeedMultiplier: 0.8,
    lockDelay: 200,
    ghostPiece: false,
    holdEnabled: false,
    previewCount: 1,
  },
} as const

// ============================================================================
// Type Exports
// ============================================================================

export type TetrisDifficulty = keyof typeof DIFFICULTY_SETTINGS
export type LineClearType = 1 | 2 | 3 | 4
