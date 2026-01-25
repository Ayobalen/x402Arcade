/**
 * Tests for Tetris Game Constants
 *
 * @module games/tetris/__tests__/constants.test
 */

import { describe, it, expect } from 'vitest';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  CELL_SIZE,
  INITIAL_DROP_SPEED,
  LEVEL_SPEED_MULTIPLIER,
  TETROMINO_SHAPES,
  TETROMINO_TYPES,
  TETROMINO_COLORS,
  TetrominoType,
} from '../constants';

describe('Tetris Constants', () => {
  describe('Board Dimensions', () => {
    it('should define BOARD_WIDTH as 10', () => {
      expect(BOARD_WIDTH).toBe(10);
    });

    it('should define BOARD_HEIGHT as 20', () => {
      expect(BOARD_HEIGHT).toBe(20);
    });

    it('should define CELL_SIZE as 24', () => {
      expect(CELL_SIZE).toBe(24);
    });
  });

  describe('Timing Constants', () => {
    it('should define INITIAL_DROP_SPEED as 1000ms', () => {
      expect(INITIAL_DROP_SPEED).toBe(1000);
    });

    it('should define LEVEL_SPEED_MULTIPLIER as 0.9', () => {
      expect(LEVEL_SPEED_MULTIPLIER).toBe(0.9);
    });

    it('should calculate speed progression correctly', () => {
      // Level 1: 1000ms
      const level1Speed = INITIAL_DROP_SPEED * Math.pow(LEVEL_SPEED_MULTIPLIER, 0);
      expect(level1Speed).toBe(1000);

      // Level 2: 900ms (10% faster)
      const level2Speed = INITIAL_DROP_SPEED * Math.pow(LEVEL_SPEED_MULTIPLIER, 1);
      expect(level2Speed).toBe(900);

      // Level 3: 810ms
      const level3Speed = INITIAL_DROP_SPEED * Math.pow(LEVEL_SPEED_MULTIPLIER, 2);
      expect(level3Speed).toBe(810);
    });
  });

  describe('Tetromino Types', () => {
    it('should define all 7 tetromino types', () => {
      expect(TETROMINO_TYPES).toEqual(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
    });

    it('should have 7 tetromino types', () => {
      expect(TETROMINO_TYPES).toHaveLength(7);
    });

    it('should have unique tetromino types', () => {
      const uniqueTypes = new Set(TETROMINO_TYPES);
      expect(uniqueTypes.size).toBe(TETROMINO_TYPES.length);
    });
  });

  describe('Tetromino Shapes', () => {
    it('should define shapes for all 7 tetromino types', () => {
      expect(Object.keys(TETROMINO_SHAPES)).toHaveLength(7);
      expect(TETROMINO_SHAPES).toHaveProperty('I');
      expect(TETROMINO_SHAPES).toHaveProperty('O');
      expect(TETROMINO_SHAPES).toHaveProperty('T');
      expect(TETROMINO_SHAPES).toHaveProperty('S');
      expect(TETROMINO_SHAPES).toHaveProperty('Z');
      expect(TETROMINO_SHAPES).toHaveProperty('J');
      expect(TETROMINO_SHAPES).toHaveProperty('L');
    });

    describe('I piece (4x1 line)', () => {
      it('should be a 4x4 grid', () => {
        expect(TETROMINO_SHAPES.I).toHaveLength(4);
        expect(TETROMINO_SHAPES.I[0]).toHaveLength(4);
      });

      it('should have 4 filled cells in a horizontal line', () => {
        const flatShape = TETROMINO_SHAPES.I.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should be a horizontal line in the middle row', () => {
        expect(TETROMINO_SHAPES.I[1]).toEqual([1, 1, 1, 1]);
      });
    });

    describe('O piece (2x2 square)', () => {
      it('should be a 2x2 grid', () => {
        expect(TETROMINO_SHAPES.O).toHaveLength(2);
        expect(TETROMINO_SHAPES.O[0]).toHaveLength(2);
      });

      it('should have 4 filled cells in a square', () => {
        const flatShape = TETROMINO_SHAPES.O.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should be completely filled', () => {
        expect(TETROMINO_SHAPES.O).toEqual([
          [1, 1],
          [1, 1],
        ]);
      });
    });

    describe('T piece (T-shape)', () => {
      it('should be a 3x3 grid', () => {
        expect(TETROMINO_SHAPES.T).toHaveLength(3);
        expect(TETROMINO_SHAPES.T[0]).toHaveLength(3);
      });

      it('should have 4 filled cells in T-shape', () => {
        const flatShape = TETROMINO_SHAPES.T.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should form a T-shape', () => {
        expect(TETROMINO_SHAPES.T).toEqual([
          [0, 1, 0],
          [1, 1, 1],
          [0, 0, 0],
        ]);
      });
    });

    describe('S piece (S-zigzag)', () => {
      it('should be a 3x3 grid', () => {
        expect(TETROMINO_SHAPES.S).toHaveLength(3);
        expect(TETROMINO_SHAPES.S[0]).toHaveLength(3);
      });

      it('should have 4 filled cells', () => {
        const flatShape = TETROMINO_SHAPES.S.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should form an S-shape', () => {
        expect(TETROMINO_SHAPES.S).toEqual([
          [0, 1, 1],
          [1, 1, 0],
          [0, 0, 0],
        ]);
      });
    });

    describe('Z piece (Z-zigzag)', () => {
      it('should be a 3x3 grid', () => {
        expect(TETROMINO_SHAPES.Z).toHaveLength(3);
        expect(TETROMINO_SHAPES.Z[0]).toHaveLength(3);
      });

      it('should have 4 filled cells', () => {
        const flatShape = TETROMINO_SHAPES.Z.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should form a Z-shape', () => {
        expect(TETROMINO_SHAPES.Z).toEqual([
          [1, 1, 0],
          [0, 1, 1],
          [0, 0, 0],
        ]);
      });
    });

    describe('J piece (J-shape)', () => {
      it('should be a 3x3 grid', () => {
        expect(TETROMINO_SHAPES.J).toHaveLength(3);
        expect(TETROMINO_SHAPES.J[0]).toHaveLength(3);
      });

      it('should have 4 filled cells', () => {
        const flatShape = TETROMINO_SHAPES.J.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should form a J-shape', () => {
        expect(TETROMINO_SHAPES.J).toEqual([
          [1, 0, 0],
          [1, 1, 1],
          [0, 0, 0],
        ]);
      });
    });

    describe('L piece (L-shape)', () => {
      it('should be a 3x3 grid', () => {
        expect(TETROMINO_SHAPES.L).toHaveLength(3);
        expect(TETROMINO_SHAPES.L[0]).toHaveLength(3);
      });

      it('should have 4 filled cells', () => {
        const flatShape = TETROMINO_SHAPES.L.flat();
        const filledCells = flatShape.filter((cell) => cell === 1);
        expect(filledCells).toHaveLength(4);
      });

      it('should form an L-shape', () => {
        expect(TETROMINO_SHAPES.L).toEqual([
          [0, 0, 1],
          [1, 1, 1],
          [0, 0, 0],
        ]);
      });
    });
  });

  describe('Tetromino Colors', () => {
    it('should define colors for all 7 tetromino types', () => {
      expect(Object.keys(TETROMINO_COLORS)).toHaveLength(7);
    });

    it('should define I piece color as cyan', () => {
      expect(TETROMINO_COLORS.I).toBe('#00FFFF');
    });

    it('should define O piece color as yellow', () => {
      expect(TETROMINO_COLORS.O).toBe('#FFFF00');
    });

    it('should define T piece color as purple (design system)', () => {
      expect(TETROMINO_COLORS.T).toBe('#8B5CF6');
    });

    it('should define S piece color as green', () => {
      expect(TETROMINO_COLORS.S).toBe('#00FF00');
    });

    it('should define Z piece color as red', () => {
      expect(TETROMINO_COLORS.Z).toBe('#FF0000');
    });

    it('should define J piece color as blue', () => {
      expect(TETROMINO_COLORS.J).toBe('#0000FF');
    });

    it('should define L piece color as orange', () => {
      expect(TETROMINO_COLORS.L).toBe('#FFA500');
    });

    it('should have valid hex color format', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      Object.values(TETROMINO_COLORS).forEach((color) => {
        expect(color).toMatch(hexColorRegex);
      });
    });
  });

  describe('Type Consistency', () => {
    it('should have shapes for all defined types', () => {
      TETROMINO_TYPES.forEach((type) => {
        expect(TETROMINO_SHAPES[type]).toBeDefined();
      });
    });

    it('should have colors for all defined types', () => {
      TETROMINO_TYPES.forEach((type) => {
        expect(TETROMINO_COLORS[type]).toBeDefined();
      });
    });
  });
});
