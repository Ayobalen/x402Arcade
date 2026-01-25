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
  WALL_KICKS_I,
  WALL_KICKS_JLSTZ,
  LINES_PER_LEVEL,
  LEVEL_SPEED_MULTIPLIER,
  MIN_DROP_SPEED,
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

  // Step 1: Transpose matrix (columns become rows)
  const transposed: number[][] = [];
  for (let col = 0; col < cols; col++) {
    const newRow: number[] = [];
    for (let row = 0; row < rows; row++) {
      newRow.push(matrix[row][col]);
    }
    transposed.push(newRow);
  }

  // Step 2: Reverse each row for 90° clockwise rotation
  return transposed.map((row) => row.reverse());
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

/**
 * Initiates line clearing by marking lines for animation.
 *
 * This function checks for complete lines and marks them for clearing.
 * The actual removal happens after the animation delay completes.
 *
 * @param state - The current game state
 * @returns Updated state with clearingLines marked, or original state if no lines to clear
 */
export function startLineClear(state: TetrisState): TetrisState {
  const { gameSpecific } = state;
  const fullRows = getFullRows(gameSpecific.board);

  // If no lines to clear, return original state
  if (fullRows.length === 0) {
    return state;
  }

  // Mark lines for clearing
  return {
    ...state,
    gameSpecific: {
      ...gameSpecific,
      clearingLines: fullRows,
      clearingTimer: 0,
    },
  };
}

/**
 * Completes line clearing by removing marked lines and updating score.
 *
 * This should be called after the animation delay has elapsed.
 * Removes the marked lines, updates statistics, and resumes gameplay.
 *
 * @param state - The current game state with clearingLines marked
 * @returns Updated state with lines removed and score updated
 */
export function completeLineClear(state: TetrisState): TetrisState {
  const { gameSpecific } = state;
  const { clearingLines, stats } = gameSpecific;

  // If no lines are being cleared, return original state
  if (clearingLines.length === 0) {
    return state;
  }

  // Remove the cleared lines
  const newBoard = clearRows(gameSpecific.board, clearingLines);

  // Update statistics
  const newStats = { ...stats };
  newStats.linesCleared += clearingLines.length;

  switch (clearingLines.length) {
    case 1:
      newStats.singles++;
      break;
    case 2:
      newStats.doubles++;
      break;
    case 3:
      newStats.triples++;
      break;
    case 4:
      newStats.tetrises++;
      break;
  }

  // Update combo
  newStats.currentCombo++;
  if (newStats.currentCombo > newStats.maxCombo) {
    newStats.maxCombo = newStats.currentCombo;
  }

  // Calculate score (basic scoring)
  const linePoints = [0, 100, 300, 500, 800]; // Points for 0-4 lines
  const points = linePoints[clearingLines.length] * state.level;

  // Calculate new total lines and level
  const newTotalLines = gameSpecific.totalLines + clearingLines.length;
  const newLevel = Math.floor(newTotalLines / LINES_PER_LEVEL) + 1;

  // Calculate new drop speed based on level
  // Use difficulty settings or defaults
  const initialSpeed = INITIAL_DROP_SPEED;
  const speedMultiplier = LEVEL_SPEED_MULTIPLIER;
  const newDropSpeed = Math.max(
    MIN_DROP_SPEED,
    initialSpeed * Math.pow(speedMultiplier, newLevel - 1)
  );

  return {
    ...state,
    score: state.score + points,
    level: newLevel,
    gameSpecific: {
      ...gameSpecific,
      board: newBoard,
      clearingLines: [],
      clearingTimer: 0,
      totalLines: newTotalLines,
      dropSpeed: newDropSpeed,
      stats: newStats,
    },
  };
}

/**
 * Checks if lines are currently being cleared (animation in progress).
 *
 * @param state - The current game state
 * @returns true if line clear animation is in progress, false otherwise
 */
export function isClearing(state: TetrisState): boolean {
  return state.gameSpecific.clearingLines.length > 0;
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
    clearingLines: [],
    clearingTimer: 0,
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
// Piece Spawning
// ============================================================================

/**
 * Spawns a new piece from the queue.
 *
 * Takes the first piece from nextPieces, generates a new piece for the queue,
 * and sets it as the current piece. Also updates the ghost piece.
 *
 * @param state - The current game state
 * @returns Updated state with new current piece, or game over state
 */
export function spawnPiece(state: TetrisState): TetrisState {
  const { gameSpecific } = state;

  // Get the next piece from the queue
  const nextPiece = gameSpecific.nextPieces[0];
  const newPiece = createPiece(nextPiece);

  // Check if spawn position is valid (game over check)
  if (!isValidPosition(gameSpecific.board, newPiece)) {
    return {
      ...state,
      isGameOver: true,
      isPlaying: false,
    };
  }

  // Generate a new piece for the queue
  const newQueue = [...gameSpecific.nextPieces.slice(1)];
  if (newQueue.length < PREVIEW_COUNT) {
    const additionalPieces = generatePieceQueue(PREVIEW_COUNT - newQueue.length + 1);
    newQueue.push(...additionalPieces);
  }

  // Calculate ghost piece position
  const ghostY = calculateDropPosition(gameSpecific.board, newPiece);
  const ghost: Piece = {
    ...newPiece,
    position: { x: newPiece.position.x, y: ghostY },
  };

  return {
    ...state,
    gameSpecific: {
      ...gameSpecific,
      currentPiece: newPiece,
      ghostPiece: ghost,
      nextPieces: newQueue,
      canHold: true, // Reset hold availability
      isOnGround: isOnGround(gameSpecific.board, newPiece),
      lockTimer: 0,
      lockResets: 0,
    },
  };
}

// ============================================================================
// Piece Movement
// ============================================================================

/**
 * Moves a piece in the specified direction.
 *
 * Validates the move before applying. Returns updated state if valid,
 * original state if invalid.
 *
 * @param state - The current game state
 * @param direction - Direction to move ('left', 'right', or 'down')
 * @returns Updated state with moved piece, or original state if invalid
 */
export function movePiece(state: TetrisState, direction: 'left' | 'right' | 'down'): TetrisState {
  const { gameSpecific } = state;
  const { currentPiece, board } = gameSpecific;

  if (!currentPiece) {
    return state;
  }

  // Calculate new position
  let newX = currentPiece.position.x;
  let newY = currentPiece.position.y;

  switch (direction) {
    case 'left':
      newX -= 1;
      break;
    case 'right':
      newX += 1;
      break;
    case 'down':
      newY += 1;
      break;
  }

  // Create test piece with new position
  const movedPiece: Piece = {
    ...currentPiece,
    position: { x: newX, y: newY },
  };

  // Validate new position
  if (!isValidPosition(board, movedPiece)) {
    return state;
  }

  // Update ghost piece position
  const ghostY = calculateDropPosition(board, movedPiece);
  const ghost: Piece = {
    ...movedPiece,
    position: { x: newX, y: ghostY },
  };

  // Update state with moved piece
  return {
    ...state,
    gameSpecific: {
      ...gameSpecific,
      currentPiece: movedPiece,
      ghostPiece: ghost,
      isOnGround: isOnGround(board, movedPiece),
      // Reset lock timer if piece moved horizontally while on ground
      lockTimer: direction !== 'down' && gameSpecific.isOnGround ? 0 : gameSpecific.lockTimer,
      lockResets:
        direction !== 'down' && gameSpecific.isOnGround
          ? gameSpecific.lockResets + 1
          : gameSpecific.lockResets,
    },
  };
}

/**
 * Hard drops the current piece instantly to the bottom.
 *
 * @param state - The current game state
 * @returns Updated state with piece at drop position
 */
export function hardDrop(state: TetrisState): TetrisState {
  const { gameSpecific } = state;
  const { currentPiece, board } = gameSpecific;

  if (!currentPiece) {
    return state;
  }

  const dropY = calculateDropPosition(board, currentPiece);
  const droppedPiece: Piece = {
    ...currentPiece,
    position: { x: currentPiece.position.x, y: dropY },
  };

  return {
    ...state,
    gameSpecific: {
      ...gameSpecific,
      currentPiece: droppedPiece,
      isOnGround: true,
      lockTimer: 0, // Instant lock after hard drop
    },
  };
}

// ============================================================================
// Piece Rotation
// ============================================================================

/**
 * Gets wall kick offsets for a piece type and rotation transition.
 *
 * @param type - The tetromino type
 * @param fromRotation - Current rotation state
 * @param toRotation - Target rotation state
 * @returns Array of [x, y] offset pairs to try
 */
function getWallKickOffsets(
  type: TetrominoType,
  fromRotation: RotationState,
  toRotation: RotationState
): [number, number][] {
  // O piece doesn't rotate
  if (type === 'O') {
    return [[0, 0]];
  }

  const kickTable = type === 'I' ? WALL_KICKS_I : WALL_KICKS_JLSTZ;
  const key = `${fromRotation}->${toRotation}`;

  return kickTable[key] || [[0, 0]];
}

/**
 * Rotates a piece in the specified direction with wall kick support.
 *
 * Uses SRS (Super Rotation System) wall kicks to allow rotation
 * near walls and other pieces.
 *
 * @param state - The current game state
 * @param direction - Rotation direction ('cw', 'ccw', or '180')
 * @returns Updated state with rotated piece, or original state if rotation failed
 */
export function rotatePiece(state: TetrisState, direction: 'cw' | 'ccw' | '180'): TetrisState {
  const { gameSpecific } = state;
  const { currentPiece, board } = gameSpecific;

  if (!currentPiece) {
    return state;
  }

  // O piece doesn't rotate
  if (currentPiece.type === 'O') {
    return state;
  }

  // Calculate new rotation state
  let newRotation: RotationState;
  const currentRotation = currentPiece.rotation;

  switch (direction) {
    case 'cw':
      newRotation = ((currentRotation + 1) % 4) as RotationState;
      break;
    case 'ccw':
      newRotation = ((currentRotation + 3) % 4) as RotationState;
      break;
    case '180':
      newRotation = ((currentRotation + 2) % 4) as RotationState;
      break;
  }

  // Get wall kick offsets to try
  const kickOffsets = getWallKickOffsets(currentPiece.type, currentRotation, newRotation);

  // Try each kick offset until one works
  for (const [offsetX, offsetY] of kickOffsets) {
    const rotatedPiece: Piece = {
      ...currentPiece,
      rotation: newRotation,
      position: {
        x: currentPiece.position.x + offsetX,
        y: currentPiece.position.y + offsetY,
      },
    };

    // If this position is valid, apply the rotation
    if (isValidPosition(board, rotatedPiece)) {
      // Update ghost piece position
      const ghostY = calculateDropPosition(board, rotatedPiece);
      const ghost: Piece = {
        ...rotatedPiece,
        position: { x: rotatedPiece.position.x, y: ghostY },
      };

      return {
        ...state,
        gameSpecific: {
          ...gameSpecific,
          currentPiece: rotatedPiece,
          ghostPiece: ghost,
          isOnGround: isOnGround(board, rotatedPiece),
          // Reset lock timer on successful rotation while on ground
          lockTimer: gameSpecific.isOnGround ? 0 : gameSpecific.lockTimer,
          lockResets: gameSpecific.isOnGround
            ? gameSpecific.lockResets + 1
            : gameSpecific.lockResets,
        },
      };
    }
  }

  // No valid rotation found
  return state;
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
    clearingLines: [...state.clearingLines],
  };
}
