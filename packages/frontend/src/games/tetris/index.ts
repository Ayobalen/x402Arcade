/**
 * Tetris Game Module
 *
 * This module contains the complete Tetris game implementation for the x402 Arcade,
 * including:
 * - 7-piece tetromino system (I, O, T, S, Z, J, L)
 * - SRS (Super Rotation System) with wall kicks
 * - Collision detection for grid boundaries
 * - Line clearing algorithm with scoring
 * - Gravity and soft/hard drop mechanics
 *
 * @module games/tetris
 */

// Game constants
export * from './constants';

// Game types
export * from './types';

// Core game logic - includes all gameplay functionality
export {
  // Board manipulation
  createEmptyBoard,
  cloneBoard,

  // Piece generation
  getRandomTetromino,
  generatePieceQueue,
  createPiece,

  // Rotation system
  rotateMatrixClockwise,
  rotateMatrixCounterClockwise,
  rotateMatrix180,
  getPieceShape,

  // Collision detection
  isValidPosition,
  isOnGround,

  // Piece placement
  placePiece,

  // Line clearing
  isRowFull,
  getFullRows,
  clearRows,
  startLineClear,
  completeLineClear,
  isClearing,

  // Game state management
  createInitialStats,
  createInitialTetrisState,
  createInitialState,

  // Ghost piece
  calculateDropPosition,

  // Game over detection
  isGameOver,

  // Piece spawning
  spawnPiece,

  // Piece movement
  movePiece,
  hardDrop,

  // Piece rotation with SRS wall kicks
  rotatePiece,

  // Utility functions
  cloneTetrisState,
} from './logic';

// Game identifier
export const TETRIS_GAME_ID = 'tetris' as const;

// Re-export game type for convenience
export { GAME_TYPES } from '../types';
