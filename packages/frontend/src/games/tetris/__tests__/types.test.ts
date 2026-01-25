/**
 * Tests for Tetris Game Types
 *
 * @module games/tetris/__tests__/types.test
 */

import { describe, it, expect } from 'vitest';
import type {
  Position,
  RotationState,
  Piece,
  GhostPiece,
  Cell,
  Board,
  MoveDirection,
  RotateDirection,
  MovementInput,
  LineClearResult,
  TetrisStats,
  TetrisSpecificState,
  TetrisState,
  TetrisGameOptions,
  TetrisEvent,
} from '../types';
import { BOARD_WIDTH, BOARD_HEIGHT, type TetrominoType } from '../constants';

describe('Tetris Types', () => {
  describe('Position', () => {
    it('should accept valid position objects', () => {
      const position: Position = { x: 5, y: 10 };
      expect(position.x).toBe(5);
      expect(position.y).toBe(10);
    });

    it('should allow negative coordinates (for pieces above visible area)', () => {
      const position: Position = { x: 3, y: -1 };
      expect(position.y).toBeLessThan(0);
    });
  });

  describe('RotationState', () => {
    it('should accept values 0-3', () => {
      const states: RotationState[] = [0, 1, 2, 3];
      expect(states).toHaveLength(4);
    });

    it('should represent spawn state as 0', () => {
      const spawnState: RotationState = 0;
      expect(spawnState).toBe(0);
    });

    it('should represent 90° CW as 1', () => {
      const cwState: RotationState = 1;
      expect(cwState).toBe(1);
    });

    it('should represent 180° as 2', () => {
      const halfState: RotationState = 2;
      expect(halfState).toBe(2);
    });

    it('should represent 270° CW (90° CCW) as 3', () => {
      const ccwState: RotationState = 3;
      expect(ccwState).toBe(3);
    });
  });

  describe('Piece', () => {
    it('should define a piece with type, position, and rotation', () => {
      const piece: Piece = {
        type: 'T' as TetrominoType,
        position: { x: 4, y: 0 },
        rotation: 0,
      };
      expect(piece.type).toBe('T');
      expect(piece.position).toEqual({ x: 4, y: 0 });
      expect(piece.rotation).toBe(0);
    });

    it('should allow all tetromino types', () => {
      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
      types.forEach((type) => {
        const piece: Piece = {
          type,
          position: { x: 0, y: 0 },
          rotation: 0,
        };
        expect(piece.type).toBe(type);
      });
    });
  });

  describe('GhostPiece', () => {
    it('should have same structure as Piece', () => {
      const ghostPiece: GhostPiece = {
        type: 'I' as TetrominoType,
        position: { x: 3, y: 18 },
        rotation: 0,
      };
      expect(ghostPiece).toHaveProperty('type');
      expect(ghostPiece).toHaveProperty('position');
      expect(ghostPiece).toHaveProperty('rotation');
    });
  });

  describe('Cell', () => {
    it('should accept null for empty cells', () => {
      const emptyCell: Cell = null;
      expect(emptyCell).toBeNull();
    });

    it('should accept tetromino types for filled cells', () => {
      const filledCell: Cell = 'T' as TetrominoType;
      expect(filledCell).toBe('T');
    });
  });

  describe('Board', () => {
    it('should be a 2D array of cells', () => {
      const board: Board = Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null));

      expect(board).toHaveLength(BOARD_HEIGHT);
      expect(board[0]).toHaveLength(BOARD_WIDTH);
    });

    it('should allow mixed empty and filled cells', () => {
      const board: Board = Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null));

      // Fill bottom row
      board[BOARD_HEIGHT - 1] = board[BOARD_HEIGHT - 1].map(() => 'I' as TetrominoType);

      expect(board[BOARD_HEIGHT - 1].every((cell) => cell === 'I')).toBe(true);
      expect(board[0].every((cell) => cell === null)).toBe(true);
    });
  });

  describe('MoveDirection', () => {
    it('should accept left, right, down', () => {
      const directions: MoveDirection[] = ['left', 'right', 'down'];
      expect(directions).toHaveLength(3);
    });
  });

  describe('RotateDirection', () => {
    it('should accept cw, ccw, 180', () => {
      const directions: RotateDirection[] = ['cw', 'ccw', '180'];
      expect(directions).toHaveLength(3);
    });
  });

  describe('MovementInput', () => {
    it('should allow empty input', () => {
      const input: MovementInput = {};
      expect(input).toEqual({});
    });

    it('should allow move commands', () => {
      const input: MovementInput = { move: 'left' };
      expect(input.move).toBe('left');
    });

    it('should allow rotate commands', () => {
      const input: MovementInput = { rotate: 'cw' };
      expect(input.rotate).toBe('cw');
    });

    it('should allow hard drop', () => {
      const input: MovementInput = { hardDrop: true };
      expect(input.hardDrop).toBe(true);
    });

    it('should allow soft drop', () => {
      const input: MovementInput = { softDrop: true };
      expect(input.softDrop).toBe(true);
    });

    it('should allow hold', () => {
      const input: MovementInput = { hold: true };
      expect(input.hold).toBe(true);
    });

    it('should allow combined inputs', () => {
      const input: MovementInput = {
        move: 'right',
        softDrop: true,
      };
      expect(input.move).toBe('right');
      expect(input.softDrop).toBe(true);
    });
  });

  describe('LineClearResult', () => {
    it('should track line clear information', () => {
      const result: LineClearResult = {
        linesCleared: 4,
        isBackToBack: true,
        isTSpin: false,
        isMiniTSpin: false,
        points: 1200,
        combo: 3,
      };
      expect(result.linesCleared).toBe(4);
      expect(result.isBackToBack).toBe(true);
      expect(result.points).toBe(1200);
    });
  });

  describe('TetrisStats', () => {
    it('should track all game statistics', () => {
      const stats: TetrisStats = {
        linesCleared: 100,
        singles: 20,
        doubles: 15,
        triples: 8,
        tetrises: 5,
        tSpins: 3,
        piecesPlaced: 250,
        maxCombo: 12,
        currentCombo: 2,
      };
      expect(stats.linesCleared).toBe(100);
      expect(stats.tetrises).toBe(5);
      expect(stats.maxCombo).toBe(12);
    });

    it('should initialize with zeros', () => {
      const stats: TetrisStats = {
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
      expect(stats.linesCleared).toBe(0);
      expect(stats.piecesPlaced).toBe(0);
    });
  });

  describe('TetrisSpecificState', () => {
    it('should contain all required tetris-specific properties', () => {
      const emptyBoard: Board = Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null));

      const state: TetrisSpecificState = {
        board: emptyBoard,
        currentPiece: null,
        ghostPiece: null,
        nextPieces: ['T', 'I', 'O', 'S'],
        heldPiece: null,
        canHold: true,
        dropSpeed: 1000,
        dropTimer: 0,
        lockTimer: 0,
        lockResets: 0,
        isOnGround: false,
        dasTimer: 0,
        arrTimer: 0,
        dasDirection: null,
        totalLines: 0,
        stats: {
          linesCleared: 0,
          singles: 0,
          doubles: 0,
          triples: 0,
          tetrises: 0,
          tSpins: 0,
          piecesPlaced: 0,
          maxCombo: 0,
          currentCombo: 0,
        },
        lastClear: null,
      };

      expect(state.board).toHaveLength(BOARD_HEIGHT);
      expect(state.nextPieces).toHaveLength(4);
      expect(state.canHold).toBe(true);
    });
  });

  describe('TetrisState', () => {
    it('should extend GameState with tetris properties', () => {
      const emptyBoard: Board = Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(null));

      const state: TetrisState = {
        score: 0,
        isPlaying: false,
        isPaused: false,
        isGameOver: false,
        level: 1,
        lives: -1, // Tetris doesn't use lives
        highScore: 0,
        startTime: null,
        elapsedTime: 0,
        gameSpecific: {
          board: emptyBoard,
          currentPiece: null,
          ghostPiece: null,
          nextPieces: [],
          heldPiece: null,
          canHold: true,
          dropSpeed: 1000,
          dropTimer: 0,
          lockTimer: 0,
          lockResets: 0,
          isOnGround: false,
          dasTimer: 0,
          arrTimer: 0,
          dasDirection: null,
          totalLines: 0,
          stats: {
            linesCleared: 0,
            singles: 0,
            doubles: 0,
            triples: 0,
            tetrises: 0,
            tSpins: 0,
            piecesPlaced: 0,
            maxCombo: 0,
            currentCombo: 0,
          },
          lastClear: null,
        },
      };

      expect(state.lives).toBe(-1);
      expect(state.gameSpecific.board).toBeDefined();
    });
  });

  describe('TetrisGameOptions', () => {
    it('should allow empty options', () => {
      const options: TetrisGameOptions = {};
      expect(options).toEqual({});
    });

    it('should allow start level', () => {
      const options: TetrisGameOptions = { startLevel: 5 };
      expect(options.startLevel).toBe(5);
    });

    it('should allow difficulty preset', () => {
      const options: TetrisGameOptions = { difficulty: 'hard' };
      expect(options.difficulty).toBe('hard');
    });

    it('should allow ghost and hold toggles', () => {
      const options: TetrisGameOptions = {
        ghostEnabled: true,
        holdEnabled: false,
      };
      expect(options.ghostEnabled).toBe(true);
      expect(options.holdEnabled).toBe(false);
    });
  });

  describe('TetrisEvent', () => {
    it('should support PIECE_SPAWNED event', () => {
      const event: TetrisEvent = { type: 'PIECE_SPAWNED', piece: 'T' };
      expect(event.type).toBe('PIECE_SPAWNED');
      expect(event.piece).toBe('T');
    });

    it('should support PIECE_MOVED event', () => {
      const event: TetrisEvent = { type: 'PIECE_MOVED', direction: 'left' };
      expect(event.type).toBe('PIECE_MOVED');
      expect(event.direction).toBe('left');
    });

    it('should support PIECE_ROTATED event', () => {
      const event: TetrisEvent = { type: 'PIECE_ROTATED', direction: 'cw' };
      expect(event.type).toBe('PIECE_ROTATED');
      expect(event.direction).toBe('cw');
    });

    it('should support LINES_CLEARED event', () => {
      const result: LineClearResult = {
        linesCleared: 2,
        isBackToBack: false,
        isTSpin: false,
        isMiniTSpin: false,
        points: 300,
        combo: 1,
      };
      const event: TetrisEvent = { type: 'LINES_CLEARED', result };
      expect(event.type).toBe('LINES_CLEARED');
      expect(event.result.linesCleared).toBe(2);
    });

    it('should support TOP_OUT event', () => {
      const event: TetrisEvent = { type: 'TOP_OUT' };
      expect(event.type).toBe('TOP_OUT');
    });
  });
});
