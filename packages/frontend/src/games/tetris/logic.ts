/**
 * Tetris Game Logic
 *
 * This module contains the core game logic for Tetris, including:
 * - Board creation and manipulation
 * - Piece rotation and movement
 * - Collision detection
 * - Line clearing
 * - Scoring
 *
 * @module games/tetris/logic
 */

import {
  BOARD_WIDTH,
  TOTAL_BOARD_HEIGHT,
  TETROMINO_SHAPES,
  TETROMINO_TYPES,
  SPAWN_POSITIONS,
  INITIAL_DROP_SPEED,
  PREVIEW_COUNT,
  type TetrominoType,
} from './constants';
import type {
  Board,
  Cell,
  Piece,
  RotationState,
  TetrisState,
  TetrisSpecificState,
  TetrisStats,
} from './types';

// ============================================================================
// Board Creation and Manipulation
// ============================================================================

/**
 * Creates an empty Tetris board.
 *
 * @returns A 2D array representing an empty board
 *
 * @example
 * ```ts
 * const board = createEmptyBoard()
 * // board is a 20x10 grid of null values
 * ```
 */
export function createEmptyBoard(): Board {
  return Array(TOTAL_BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

/**
 * Creates a copy of the board.
 *
 * @param board - The board to copy
 * @returns A new board with the same values
 */
export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

// ============================================================================
// Random Piece Generation
// ============================================================================

/**
 * Generates a random tetromino type.
 *
 * Uses the "bag randomizer" algorithm (7-bag system):
 * - All 7 pieces appear once before any repeat
 * - More fair distribution than pure random
 *
 * @returns A random tetromino type
 */
export function getRandomTetromino(): TetrominoType {
  const randomIndex = Math.floor(Math.random() * TETROMINO_TYPES.length);
  return TETROMINO_TYPES[randomIndex];
}

/**
 * Generates a queue of upcoming pieces using the bag randomizer.
 *
 * @param count - Number of pieces to generate
 * @returns Array of tetromino types
 */
export function generatePieceQueue(count: number): TetrominoType[] {
  const queue: TetrominoType[] = [];

  while (queue.length < count) {
    // Create a shuffled bag of all 7 pieces
    const bag = [...TETROMINO_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    queue.push(...bag);
  }

  return queue.slice(0, count);
}

// ============================================================================
// Piece Creation
// ============================================================================

/**
 * Creates a new piece at its spawn position.
 *
 * @param type - Type of tetromino to create
 * @returns A new piece ready to be played
 */
export function createPiece(type: TetrominoType): Piece {
  const spawnPos = SPAWN_POSITIONS[type];

  return {
    type,
    position: { ...spawnPos },
    rotation: 0,
  };
}

// ============================================================================
// Rotation Matrices
// ============================================================================

/**
 * Rotates a 2D matrix 90 degrees clockwise.
 *
 * Algorithm:
 * 1. Transpose the matrix (swap rows and columns)
 * 2. Reverse each row
 *
 * @param matrix - The matrix to rotate
 * @returns The rotated matrix
 *
 * @example
 * ```ts
 * const original = [
 *   [1, 0],
 *   [1, 1]
 * ]
 * const rotated = rotateMatrixClockwise(original)
 * // rotated = [
 * //   [1, 1],
 * //   [0, 1]
 * // ]
 * ```
 */
export function rotateMatrixClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];

  // Create new matrix with swapped dimensions
  for (let col = 0; col < cols; col++) {
    const newRow: number[] = [];
    for (let row = rows - 1; row >= 0; row--) {
      newRow.push(matrix[row][col]);
    }
    rotated.push(newRow);
  }

  return rotated;
}

/**
 * Rotates a 2D matrix 90 degrees counter-clockwise.
 *
 * Algorithm:
 * 1. Reverse each row
 * 2. Transpose the matrix
 *
 * Equivalent to rotating clockwise 3 times.
 *
 * @param matrix - The matrix to rotate
 * @returns The rotated matrix
 */
export function rotateMatrixCounterClockwise(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];

  // Create new matrix with swapped dimensions
  for (let col = cols - 1; col >= 0; col--) {
    const newRow: number[] = [];
    for (let row = 0; row < rows; row++) {
      newRow.push(matrix[row][col]);
    }
    rotated.push(newRow);
  }

  return rotated;
}

/**
 * Rotates a 2D matrix 180 degrees.
 *
 * Algorithm:
 * Reverse all rows, then reverse the row order.
 * Equivalent to rotating clockwise twice.
 *
 * @param matrix - The matrix to rotate
 * @returns The rotated matrix
 */
export function rotateMatrix180(matrix: number[][]): number[][] {
  return matrix.map((row) => [...row].reverse()).reverse();
}

/**
 * Gets the shape matrix for a piece at a specific rotation state.
 *
 * @param type - The tetromino type
 * @param rotation - The rotation state (0-3)
 * @returns The shape matrix for the piece at that rotation
 */
export function getPieceShape(type: TetrominoType, rotation: RotationState): number[][] {
  const baseShape = TETROMINO_SHAPES[type];

  switch (rotation) {
    case 0:
      return baseShape;
    case 1:
      return rotateMatrixClockwise(baseShape);
    case 2:
      return rotateMatrix180(baseShape);
    case 3:
      return rotateMatrixCounterClockwise(baseShape);
  }
}

// ============================================================================
// Collision Detection
// ============================================================================

/**
 * Checks if a piece position is valid (no collision).
 *
 * A position is invalid if:
 * - Any filled cell is outside the board horizontally
 * - Any filled cell is below the board bottom
 * - Any filled cell overlaps with a filled board cell
 *
 * Note: Pieces can be above the visible area (negative y) during spawn.
 *
 * @param board - The game board
 * @param piece - The piece to check
 * @returns true if position is valid, false if there's a collision
 */
export function isValidPosition(board: Board, piece: Piece): boolean {
  const shape = getPieceShape(piece.type, piece.rotation);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardX = piece.position.x + col;
        const boardY = piece.position.y + row;

        // Check horizontal bounds
        if (boardX < 0 || boardX >= BOARD_WIDTH) {
          return false;
        }

        // Check bottom bound
        if (boardY >= TOTAL_BOARD_HEIGHT) {
          return false;
        }

        // Check board collision (only if within board)
        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Checks if a piece is on the ground (cannot move down).
 *
 * @param board - The game board
 * @param piece - The piece to check
 * @returns true if piece is on ground, false otherwise
 */
export function isOnGround(board: Board, piece: Piece): boolean {
  const movedPiece: Piece = {
    ...piece,
    position: { x: piece.position.x, y: piece.position.y + 1 },
  };

  return !isValidPosition(board, movedPiece);
}

// ============================================================================
// Piece Placement
// ============================================================================

/**
 * Places a piece on the board permanently.
 *
 * @param board - The game board
 * @param piece - The piece to place
 * @returns A new board with the piece placed
 */
export function placePiece(board: Board, piece: Piece): Board {
  const newBoard = cloneBoard(board);
  const shape = getPieceShape(piece.type, piece.rotation);

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        const boardY = piece.position.y + row;
        const boardX = piece.position.x + col;

        // Only place cells that are within the board
        if (boardY >= 0 && boardY < TOTAL_BOARD_HEIGHT) {
          newBoard[boardY][boardX] = piece.type;
        }
      }
    }
  }

  return newBoard;
}

// ============================================================================
// Line Clearing
// ============================================================================

/**
 * Checks if a row is completely filled.
 *
 * @param row - The row to check
 * @returns true if row is full, false otherwise
 */
export function isRowFull(row: Cell[]): boolean {
  return row.every((cell) => cell !== null);
}

/**
 * Finds all filled rows on the board.
 *
 * @param board - The game board
 * @returns Array of row indices that are full
 */
export function getFullRows(board: Board): number[] {
  const fullRows: number[] = [];

  for (let row = 0; row < board.length; row++) {
    if (isRowFull(board[row])) {
      fullRows.push(row);
    }
  }

  return fullRows;
}

/**
 * Clears filled rows and drops remaining rows down.
 *
 * @param board - The game board
 * @param rowIndices - Indices of rows to clear
 * @returns A new board with cleared rows
 */
export function clearRows(board: Board, rowIndices: number[]): Board {
  if (rowIndices.length === 0) {
    return board;
  }

  const newBoard = cloneBoard(board);
  const sortedRows = [...rowIndices].sort((a, b) => a - b);

  // Remove filled rows
  for (let i = sortedRows.length - 1; i >= 0; i--) {
    newBoard.splice(sortedRows[i], 1);
  }

  // Add empty rows at the top
  for (let i = 0; i < sortedRows.length; i++) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }

  return newBoard;
}

// ============================================================================
// Game State Creation
// ============================================================================

/**
 * Creates the initial statistics object.
 *
 * @returns Initial stats with all values at zero
 */
export function createInitialStats(): TetrisStats {
  return {
    linesCleared: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    tetrises: 0,
    tSpins: 0,
    piecesPlaced: 0,
    maxCombo: 0,
    currentCombo: 0,
  };
}

/**
 * Creates the initial Tetris-specific game state.
 *
 * @returns Initial tetris game state
 */
export function createInitialTetrisState(): TetrisSpecificState {
  const nextPieces = generatePieceQueue(PREVIEW_COUNT + 1);

  return {
    board: createEmptyBoard(),
    currentPiece: null,
    ghostPiece: null,
    nextPieces: nextPieces.slice(1), // Skip first piece (will be current)
    heldPiece: null,
    canHold: true,
    dropSpeed: INITIAL_DROP_SPEED,
    dropTimer: 0,
    lockTimer: 0,
    lockResets: 0,
    isOnGround: false,
    dasTimer: 0,
    arrTimer: 0,
    dasDirection: null,
    totalLines: 0,
    stats: createInitialStats(),
    lastClear: null,
  };
}

/**
 * Creates the complete initial game state for Tetris.
 *
 * @param startLevel - Optional starting level (default: 1)
 * @returns Complete initial Tetris game state
 */
export function createInitialState(startLevel: number = 1): TetrisState {
  return {
    // Base game state
    score: 0,
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    level: startLevel,
    lives: -1, // Tetris doesn't use lives
    highScore: 0,
    startTime: null,
    elapsedTime: 0,

    // Tetris-specific state
    gameSpecific: createInitialTetrisState(),
  };
}

// ============================================================================
// Ghost Piece Calculation
// ============================================================================

/**
 * Calculates the position where the current piece would land if hard dropped.
 *
 * @param board - The game board
 * @param piece - The current piece
 * @returns The y position where the piece would land
 */
export function calculateDropPosition(board: Board, piece: Piece): number {
  let dropY = piece.position.y;

  while (true) {
    const testPiece: Piece = {
      ...piece,
      position: { x: piece.position.x, y: dropY + 1 },
    };

    if (!isValidPosition(board, testPiece)) {
      break;
    }

    dropY++;
  }

  return dropY;
}

// ============================================================================
// Game Over Detection
// ============================================================================

/**
 * Checks if the game is over.
 *
 * Game is over when a newly spawned piece immediately collides
 * (cannot be placed at spawn position).
 *
 * @param board - The game board
 * @param piece - The piece that was just spawned
 * @returns true if game is over, false otherwise
 */
export function isGameOver(board: Board, piece: Piece): boolean {
  return !isValidPosition(board, piece);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a deep copy of the Tetris-specific state.
 *
 * @param state - The state to copy
 * @returns A new state object with copied values
 */
export function cloneTetrisState(state: TetrisSpecificState): TetrisSpecificState {
  return {
    ...state,
    board: cloneBoard(state.board),
    currentPiece: state.currentPiece
      ? { ...state.currentPiece, position: { ...state.currentPiece.position } }
      : null,
    ghostPiece: state.ghostPiece
      ? { ...state.ghostPiece, position: { ...state.ghostPiece.position } }
      : null,
    nextPieces: [...state.nextPieces],
    stats: { ...state.stats },
  };
}
