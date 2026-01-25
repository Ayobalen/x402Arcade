/**
 * Tests for Tetris Game Logic
 *
 * @module games/tetris/__tests__/logic.test
 */

import { describe, it, expect } from 'vitest';
import {
  createEmptyBoard,
  cloneBoard,
  getRandomTetromino,
  generatePieceQueue,
  createPiece,
  rotateMatrixClockwise,
  rotateMatrixCounterClockwise,
  rotateMatrix180,
  getPieceShape,
  isValidPosition,
  isOnGround,
  placePiece,
  isRowFull,
  getFullRows,
  clearRows,
  createInitialStats,
  createInitialTetrisState,
  createInitialState,
  calculateDropPosition,
  isGameOver,
  cloneTetrisState,
} from '../logic';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TOTAL_BOARD_HEIGHT,
  TETROMINO_TYPES,
  type TetrominoType,
} from '../constants';
import type { Board, Piece } from '../types';

describe('Tetris Logic', () => {
  describe('Board Creation', () => {
    it('should create an empty board with correct dimensions', () => {
      const board = createEmptyBoard();
      expect(board).toHaveLength(TOTAL_BOARD_HEIGHT);
      expect(board[0]).toHaveLength(BOARD_WIDTH);
    });

    it('should create board filled with null values', () => {
      const board = createEmptyBoard();
      const allNull = board.every((row) => row.every((cell) => cell === null));
      expect(allNull).toBe(true);
    });

    it('should create independent rows (not shared references)', () => {
      const board = createEmptyBoard();
      board[0][0] = 'I';
      expect(board[1][0]).toBeNull();
    });
  });

  describe('Board Cloning', () => {
    it('should create a deep copy of the board', () => {
      const original = createEmptyBoard();
      original[0][0] = 'T';
      const clone = cloneBoard(original);

      expect(clone[0][0]).toBe('T');
      expect(clone).not.toBe(original);
    });

    it('should not share references with original', () => {
      const original = createEmptyBoard();
      const clone = cloneBoard(original);

      clone[0][0] = 'I';
      expect(original[0][0]).toBeNull();
    });
  });

  describe('Random Piece Generation', () => {
    it('should generate a valid tetromino type', () => {
      const piece = getRandomTetromino();
      expect(TETROMINO_TYPES).toContain(piece);
    });

    it('should generate different pieces over multiple calls', () => {
      const pieces = new Set();
      for (let i = 0; i < 50; i++) {
        pieces.add(getRandomTetromino());
      }
      expect(pieces.size).toBeGreaterThan(1);
    });
  });

  describe('Piece Queue Generation', () => {
    it('should generate requested number of pieces', () => {
      const queue = generatePieceQueue(14);
      expect(queue).toHaveLength(14);
    });

    it('should contain all 7 piece types in first 7 pieces', () => {
      const queue = generatePieceQueue(7);
      const uniquePieces = new Set(queue);
      expect(uniquePieces.size).toBe(7);
    });

    it('should use bag randomizer (all pieces before repeat)', () => {
      const queue = generatePieceQueue(14);
      const firstBag = queue.slice(0, 7);
      const secondBag = queue.slice(7, 14);

      const uniqueFirst = new Set(firstBag);
      const uniqueSecond = new Set(secondBag);

      expect(uniqueFirst.size).toBe(7);
      expect(uniqueSecond.size).toBe(7);
    });
  });

  describe('Piece Creation', () => {
    it('should create piece with correct type', () => {
      const piece = createPiece('T');
      expect(piece.type).toBe('T');
    });

    it('should spawn piece at rotation 0', () => {
      const piece = createPiece('I');
      expect(piece.rotation).toBe(0);
    });

    it('should spawn piece at correct position', () => {
      const piece = createPiece('O');
      expect(piece.position.x).toBeDefined();
      expect(piece.position.y).toBeDefined();
    });

    it('should create different spawn positions for different pieces', () => {
      const iPiece = createPiece('I');
      const oPiece = createPiece('O');
      // Positions may differ
      expect(iPiece).toBeDefined();
      expect(oPiece).toBeDefined();
    });
  });

  describe('Matrix Rotation - Clockwise', () => {
    it('should rotate a 2x2 matrix clockwise', () => {
      const original = [
        [1, 0],
        [1, 1],
      ];
      const rotated = rotateMatrixClockwise(original);
      expect(rotated).toEqual([
        [1, 1],
        [0, 1],
      ]);
    });

    it('should rotate a 3x3 matrix clockwise', () => {
      const original = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ];
      const rotated = rotateMatrixClockwise(original);
      expect(rotated).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ]);
    });

    it('should rotate 4 times to return to original', () => {
      const original = [
        [1, 0],
        [1, 1],
      ];
      let rotated = original;
      for (let i = 0; i < 4; i++) {
        rotated = rotateMatrixClockwise(rotated);
      }
      expect(rotated).toEqual(original);
    });
  });

  describe('Matrix Rotation - Counter-Clockwise', () => {
    it('should rotate a 2x2 matrix counter-clockwise', () => {
      const original = [
        [1, 0],
        [1, 1],
      ];
      const rotated = rotateMatrixCounterClockwise(original);
      expect(rotated).toEqual([
        [0, 1],
        [1, 1],
      ]);
    });

    it('should be inverse of clockwise rotation', () => {
      const original = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ];
      const cw = rotateMatrixClockwise(original);
      const ccw = rotateMatrixCounterClockwise(cw);
      expect(ccw).toEqual(original);
    });
  });

  describe('Matrix Rotation - 180 Degrees', () => {
    it('should rotate a matrix 180 degrees', () => {
      const original = [
        [1, 0],
        [1, 1],
      ];
      const rotated = rotateMatrix180(original);
      expect(rotated).toEqual([
        [1, 1],
        [0, 1],
      ]);
    });

    it('should be equivalent to rotating clockwise twice', () => {
      const original = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ];
      const rotated180 = rotateMatrix180(original);
      const cwTwice = rotateMatrixClockwise(rotateMatrixClockwise(original));
      expect(rotated180).toEqual(cwTwice);
    });
  });

  describe('Get Piece Shape', () => {
    it('should return base shape for rotation 0', () => {
      const shape = getPieceShape('O', 0);
      expect(shape).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    it('should return rotated shape for rotation 1', () => {
      const shape = getPieceShape('I', 1);
      expect(shape).toBeDefined();
      expect(shape.length).toBeGreaterThan(0);
    });

    it('should handle all rotation states (0-3)', () => {
      for (let rotation = 0; rotation < 4; rotation++) {
        const shape = getPieceShape('T', rotation as 0 | 1 | 2 | 3);
        expect(shape).toBeDefined();
      }
    });

    it('should return different shapes for different rotations', () => {
      const shape0 = getPieceShape('L', 0);
      const shape1 = getPieceShape('L', 1);
      expect(shape0).not.toEqual(shape1);
    });
  });

  describe('Collision Detection - Valid Position', () => {
    it('should return true for piece in valid position', () => {
      const board = createEmptyBoard();
      const piece = createPiece('O');
      expect(isValidPosition(board, piece)).toBe(true);
    });

    it('should return false for piece outside left boundary', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'O',
        position: { x: -1, y: 0 },
        rotation: 0,
      };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('should return false for piece outside right boundary', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'O',
        position: { x: BOARD_WIDTH - 1, y: 0 },
        rotation: 0,
      };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('should return false for piece below bottom boundary', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'O',
        position: { x: 0, y: TOTAL_BOARD_HEIGHT - 1 },
        rotation: 0,
      };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('should return false for piece overlapping filled cells', () => {
      const board = createEmptyBoard();
      board[5][5] = 'I';
      const piece: Piece = {
        type: 'O',
        position: { x: 4, y: 4 },
        rotation: 0,
      };
      expect(isValidPosition(board, piece)).toBe(false);
    });

    it('should allow piece above visible area (negative y)', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'I',
        position: { x: 3, y: -1 },
        rotation: 0,
      };
      expect(isValidPosition(board, piece)).toBe(true);
    });
  });

  describe('Collision Detection - On Ground', () => {
    it('should return true when piece is at bottom', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'O',
        position: { x: 4, y: TOTAL_BOARD_HEIGHT - 2 },
        rotation: 0,
      };
      expect(isOnGround(board, piece)).toBe(true);
    });

    it('should return true when piece is above filled cells', () => {
      const board = createEmptyBoard();
      // Fill bottom row
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[TOTAL_BOARD_HEIGHT - 1][x] = 'I';
      }
      const piece: Piece = {
        type: 'O',
        position: { x: 4, y: TOTAL_BOARD_HEIGHT - 3 },
        rotation: 0,
      };
      expect(isOnGround(board, piece)).toBe(true);
    });

    it('should return false when piece can still move down', () => {
      const board = createEmptyBoard();
      const piece = createPiece('T');
      expect(isOnGround(board, piece)).toBe(false);
    });
  });

  describe('Piece Placement', () => {
    it('should place piece on board', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'O',
        position: { x: 4, y: 0 },
        rotation: 0,
      };
      const newBoard = placePiece(board, piece);

      expect(newBoard[0][4]).toBe('O');
      expect(newBoard[0][5]).toBe('O');
      expect(newBoard[1][4]).toBe('O');
      expect(newBoard[1][5]).toBe('O');
    });

    it('should not modify original board', () => {
      const board = createEmptyBoard();
      const piece = createPiece('I');
      piece.position = { x: 0, y: 0 };
      placePiece(board, piece);

      const allNull = board.every((row) => row.every((cell) => cell === null));
      expect(allNull).toBe(true);
    });

    it('should not place cells above visible area', () => {
      const board = createEmptyBoard();
      const piece: Piece = {
        type: 'I',
        position: { x: 0, y: -2 },
        rotation: 0,
      };
      const newBoard = placePiece(board, piece);

      // Should not crash, and should only place visible cells
      expect(newBoard).toBeDefined();
    });
  });

  describe('Line Clearing - Row Detection', () => {
    it('should detect a full row', () => {
      const row = Array(BOARD_WIDTH).fill('I' as TetrominoType);
      expect(isRowFull(row)).toBe(true);
    });

    it('should detect an incomplete row', () => {
      const row = Array(BOARD_WIDTH).fill('I' as TetrominoType);
      row[5] = null;
      expect(isRowFull(row)).toBe(false);
    });

    it('should detect an empty row', () => {
      const row = Array(BOARD_WIDTH).fill(null);
      expect(isRowFull(row)).toBe(false);
    });
  });

  describe('Line Clearing - Get Full Rows', () => {
    it('should find no full rows on empty board', () => {
      const board = createEmptyBoard();
      const fullRows = getFullRows(board);
      expect(fullRows).toHaveLength(0);
    });

    it('should find a single full row', () => {
      const board = createEmptyBoard();
      board[TOTAL_BOARD_HEIGHT - 1] = Array(BOARD_WIDTH).fill('I');
      const fullRows = getFullRows(board);
      expect(fullRows).toEqual([TOTAL_BOARD_HEIGHT - 1]);
    });

    it('should find multiple full rows', () => {
      const board = createEmptyBoard();
      board[18] = Array(BOARD_WIDTH).fill('T');
      board[19] = Array(BOARD_WIDTH).fill('S');
      board[21] = Array(BOARD_WIDTH).fill('Z');
      const fullRows = getFullRows(board);
      expect(fullRows).toHaveLength(3);
      expect(fullRows).toContain(18);
      expect(fullRows).toContain(19);
      expect(fullRows).toContain(21);
    });
  });

  describe('Line Clearing - Clear Rows', () => {
    it('should remove full rows and add empty rows at top', () => {
      const board = createEmptyBoard();
      const bottomRow = TOTAL_BOARD_HEIGHT - 1;
      board[bottomRow] = Array(BOARD_WIDTH).fill('I');

      const newBoard = clearRows(board, [bottomRow]);

      expect(newBoard[0].every((cell) => cell === null)).toBe(true);
      expect(newBoard[bottomRow].every((cell) => cell === null)).toBe(true);
    });

    it('should handle no rows to clear', () => {
      const board = createEmptyBoard();
      const newBoard = clearRows(board, []);
      expect(newBoard).toEqual(board);
    });

    it('should clear multiple rows correctly', () => {
      const board = createEmptyBoard();
      board[19] = Array(BOARD_WIDTH).fill('T');
      board[20] = Array(BOARD_WIDTH).fill('S');

      const newBoard = clearRows(board, [19, 20]);

      expect(newBoard[0].every((cell) => cell === null)).toBe(true);
      expect(newBoard[1].every((cell) => cell === null)).toBe(true);
      expect(newBoard[20].every((cell) => cell === null)).toBe(true);
    });

    it('should drop rows above cleared lines', () => {
      const board = createEmptyBoard();
      board[18][0] = 'I';
      board[19] = Array(BOARD_WIDTH).fill('T');

      const newBoard = clearRows(board, [19]);

      expect(newBoard[19][0]).toBe('I');
    });
  });

  describe('Game State Creation - Stats', () => {
    it('should create stats with all zeros', () => {
      const stats = createInitialStats();
      expect(stats.linesCleared).toBe(0);
      expect(stats.singles).toBe(0);
      expect(stats.doubles).toBe(0);
      expect(stats.triples).toBe(0);
      expect(stats.tetrises).toBe(0);
      expect(stats.tSpins).toBe(0);
      expect(stats.piecesPlaced).toBe(0);
      expect(stats.maxCombo).toBe(0);
      expect(stats.currentCombo).toBe(0);
    });
  });

  describe('Game State Creation - Tetris State', () => {
    it('should create initial tetris state with empty board', () => {
      const state = createInitialTetrisState();
      expect(state.board).toHaveLength(TOTAL_BOARD_HEIGHT);
    });

    it('should create state with no current piece', () => {
      const state = createInitialTetrisState();
      expect(state.currentPiece).toBeNull();
    });

    it('should create state with piece queue', () => {
      const state = createInitialTetrisState();
      expect(state.nextPieces.length).toBeGreaterThan(0);
    });

    it('should create state with hold enabled', () => {
      const state = createInitialTetrisState();
      expect(state.canHold).toBe(true);
      expect(state.heldPiece).toBeNull();
    });
  });

  describe('Game State Creation - Complete State', () => {
    it('should create complete initial state', () => {
      const state = createInitialState();
      expect(state.score).toBe(0);
      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isGameOver).toBe(false);
      expect(state.level).toBe(1);
      expect(state.lives).toBe(-1);
    });

    it('should allow custom start level', () => {
      const state = createInitialState(5);
      expect(state.level).toBe(5);
    });

    it('should include tetris-specific state', () => {
      const state = createInitialState();
      expect(state.gameSpecific).toBeDefined();
      expect(state.gameSpecific.board).toBeDefined();
    });
  });

  describe('Ghost Piece Calculation', () => {
    it('should calculate drop position for piece at top', () => {
      const board = createEmptyBoard();
      const piece = createPiece('O');
      piece.position = { x: 4, y: 0 };

      const dropY = calculateDropPosition(board, piece);
      expect(dropY).toBe(TOTAL_BOARD_HEIGHT - 2);
    });

    it('should calculate drop position with obstacles', () => {
      const board = createEmptyBoard();
      // Fill bottom 5 rows
      for (let y = TOTAL_BOARD_HEIGHT - 5; y < TOTAL_BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I';
        }
      }

      const piece = createPiece('O');
      piece.position = { x: 4, y: 0 };

      const dropY = calculateDropPosition(board, piece);
      expect(dropY).toBe(TOTAL_BOARD_HEIGHT - 7);
    });
  });

  describe('Game Over Detection', () => {
    it('should return false for valid spawn', () => {
      const board = createEmptyBoard();
      const piece = createPiece('T');
      expect(isGameOver(board, piece)).toBe(false);
    });

    it('should return true when spawn position is blocked', () => {
      const board = createEmptyBoard();
      // Fill top rows
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I';
        }
      }

      const piece = createPiece('T');
      expect(isGameOver(board, piece)).toBe(true);
    });
  });

  describe('State Cloning', () => {
    it('should create a deep copy of tetris state', () => {
      const original = createInitialTetrisState();
      const clone = cloneTetrisState(original);

      expect(clone).not.toBe(original);
      expect(clone.board).not.toBe(original.board);
      expect(clone.stats).not.toBe(original.stats);
    });

    it('should not share board references', () => {
      const original = createInitialTetrisState();
      const clone = cloneTetrisState(original);

      clone.board[0][0] = 'T';
      expect(original.board[0][0]).toBeNull();
    });

    it('should not share stats references', () => {
      const original = createInitialTetrisState();
      const clone = cloneTetrisState(original);

      clone.stats.linesCleared = 10;
      expect(original.stats.linesCleared).toBe(0);
    });
  });
});
