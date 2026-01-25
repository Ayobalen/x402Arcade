/**
 * Tetris Game Types
 *
 * This module defines all TypeScript interfaces and types for the Tetris game,
 * including the game state, piece representation, and movement types.
 *
 * @module games/tetris/types
 */

import type { GameState } from '../types';
import type { TetrominoType } from './constants';

// ============================================================================
// Position Types
// ============================================================================

/**
 * 2D position on the game board.
 */
export interface Position {
  /** X coordinate (column, 0-indexed from left) */
  x: number;
  /** Y coordinate (row, 0-indexed from top) */
  y: number;
}

/**
 * Rotation state for tetrominoes.
 *
 * Using SRS (Super Rotation System) states:
 * - 0: Spawn state
 * - 1: Clockwise rotation from spawn (90° CW)
 * - 2: 180° rotation from spawn
 * - 3: Counter-clockwise rotation from spawn (90° CCW / 270° CW)
 */
export type RotationState = 0 | 1 | 2 | 3;

// ============================================================================
// Piece Types
// ============================================================================

/**
 * A tetromino piece with position and rotation.
 *
 * Represents the currently active piece being controlled by the player.
 */
export interface Piece {
  /** Type of tetromino (I, O, T, S, Z, J, L) */
  type: TetrominoType;
  /** Position on the board (top-left of bounding box) */
  position: Position;
  /** Current rotation state (0-3) */
  rotation: RotationState;
}

/**
 * Ghost piece for showing where the current piece will land.
 */
export interface GhostPiece {
  /** Type of tetromino (same as current piece) */
  type: TetrominoType;
  /** Position where piece will land */
  position: Position;
  /** Current rotation state (same as current piece) */
  rotation: RotationState;
}

// ============================================================================
// Board Types
// ============================================================================

/**
 * A single cell on the game board.
 *
 * null = empty cell
 * TetrominoType = filled cell with that piece's color
 */
export type Cell = TetrominoType | null;

/**
 * The game board represented as a 2D array of cells.
 *
 * board[row][col] where:
 * - row 0 is the top
 * - row BOARD_HEIGHT-1 is the bottom
 * - col 0 is the left
 * - col BOARD_WIDTH-1 is the right
 */
export type Board = Cell[][];

// ============================================================================
// Movement Types
// ============================================================================

/**
 * Direction for piece movement.
 */
export type MoveDirection = 'left' | 'right' | 'down';

/**
 * Rotation direction.
 */
export type RotateDirection = 'cw' | 'ccw' | '180';

/**
 * Movement input from the player.
 */
export interface MovementInput {
  /** Move piece in a direction */
  move?: MoveDirection;
  /** Rotate piece */
  rotate?: RotateDirection;
  /** Hard drop (instant drop to bottom) */
  hardDrop?: boolean;
  /** Soft drop (accelerated drop) */
  softDrop?: boolean;
  /** Hold current piece */
  hold?: boolean;
}

// ============================================================================
// Scoring Types
// ============================================================================

/**
 * Line clear result with scoring information.
 */
export interface LineClearResult {
  /** Number of lines cleared (1-4) */
  linesCleared: number;
  /** Whether this was a back-to-back Tetris/T-Spin */
  isBackToBack: boolean;
  /** Whether this involved a T-Spin */
  isTSpin: boolean;
  /** Whether this was a mini T-Spin */
  isMiniTSpin: boolean;
  /** Points earned from this clear */
  points: number;
  /** Combo count (consecutive line clears) */
  combo: number;
}

/**
 * Statistics tracked during gameplay.
 */
export interface TetrisStats {
  /** Total lines cleared */
  linesCleared: number;
  /** Single line clears */
  singles: number;
  /** Double line clears */
  doubles: number;
  /** Triple line clears */
  triples: number;
  /** Tetris (4-line) clears */
  tetrises: number;
  /** T-Spin clears */
  tSpins: number;
  /** Total pieces placed */
  piecesPlaced: number;
  /** Max combo achieved */
  maxCombo: number;
  /** Current combo count */
  currentCombo: number;
}

// ============================================================================
// Tetris-Specific State
// ============================================================================

/**
 * Tetris-specific game state properties.
 *
 * These are the properties unique to Tetris that extend the base GameState.
 */
export interface TetrisSpecificState {
  /** The game board grid */
  board: Board;
  /** Currently active piece being controlled */
  currentPiece: Piece | null;
  /** Ghost piece showing landing position */
  ghostPiece: GhostPiece | null;
  /** Queue of upcoming pieces */
  nextPieces: TetrominoType[];
  /** Held piece (can be swapped once per drop) */
  heldPiece: TetrominoType | null;
  /** Whether hold has been used for current piece */
  canHold: boolean;
  /** Current drop speed in milliseconds */
  dropSpeed: number;
  /** Time since last automatic drop */
  dropTimer: number;
  /** Lock delay timer (time until piece locks after landing) */
  lockTimer: number;
  /** Number of lock delay resets used */
  lockResets: number;
  /** Whether piece is on the ground */
  isOnGround: boolean;
  /** DAS (Delayed Auto Shift) timer for horizontal movement */
  dasTimer: number;
  /** ARR (Auto Repeat Rate) timer */
  arrTimer: number;
  /** Direction currently held for DAS */
  dasDirection: 'left' | 'right' | null;
  /** Total lines cleared in current game */
  totalLines: number;
  /** Game statistics */
  stats: TetrisStats;
  /** Last line clear result (for displaying combos/back-to-back) */
  lastClear: LineClearResult | null;
  /** Row indices currently being cleared (for animation) */
  clearingLines: number[];
  /** Timer for line clear animation */
  clearingTimer: number;
}

// ============================================================================
// Tetris Game State
// ============================================================================

/**
 * Complete Tetris game state.
 *
 * Extends the base GameState with Tetris-specific properties.
 * This is the main state interface used throughout the Tetris game.
 *
 * @example
 * ```ts
 * const initialState: TetrisState = {
 *   // Base GameState properties
 *   score: 0,
 *   isPlaying: false,
 *   isPaused: false,
 *   isGameOver: false,
 *   level: 1,
 *   lives: -1, // Tetris doesn't use lives
 *   highScore: 0,
 *   startTime: null,
 *   elapsedTime: 0,
 *   // Tetris-specific properties
 *   gameSpecific: {
 *     board: createEmptyBoard(),
 *     currentPiece: null,
 *     // ... etc
 *   }
 * }
 * ```
 */
export interface TetrisState extends GameState<TetrisSpecificState> {
  /** Tetris games don't use traditional lives */
  lives: -1;
}

// ============================================================================
// Factory Functions Types
// ============================================================================

/**
 * Options for creating a new Tetris game.
 */
export interface TetrisGameOptions {
  /** Starting level (1-15) */
  startLevel?: number;
  /** Difficulty preset */
  difficulty?: 'easy' | 'normal' | 'hard' | 'expert';
  /** Enable ghost piece preview */
  ghostEnabled?: boolean;
  /** Enable hold piece feature */
  holdEnabled?: boolean;
  /** Number of next pieces to show */
  previewCount?: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Tetris-specific game events.
 */
export type TetrisEvent =
  | { type: 'PIECE_SPAWNED'; piece: TetrominoType }
  | { type: 'PIECE_MOVED'; direction: MoveDirection }
  | { type: 'PIECE_ROTATED'; direction: RotateDirection }
  | { type: 'PIECE_LOCKED'; piece: Piece }
  | { type: 'PIECE_HELD'; heldPiece: TetrominoType; swappedWith: TetrominoType | null }
  | { type: 'HARD_DROP'; cells: number }
  | { type: 'SOFT_DROP'; cells: number }
  | { type: 'LINES_CLEARED'; result: LineClearResult }
  | { type: 'LEVEL_UP'; newLevel: number }
  | { type: 'TOP_OUT' }; // Game over by reaching top

// ============================================================================
// Type Exports
// ============================================================================

export type { TetrominoType } from './constants';
