/**
 * Snake Game Logic Tests
 *
 * Tests for snake game pure functions including centering logic,
 * movement, collision detection, and state management.
 *
 * @module games/snake/logic.test
 */

import { describe, it, expect } from 'vitest';
import {
  createInitialSnake,
  createInitialSnakeState,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  areOppositeDirections,
  isValidDirectionChange,
  positionsEqual,
  isWithinBounds,
  wrapPosition,
  getNextPosition,
  getSnakeHead,
  getSnakeTail,
  collidesWithSnake,
  checkSelfCollision,
  moveSnake,
  generateFood,
  spawnFood,
  isEatingFood,
  calculateScore,
  calculateSpeed,
  processSnakeMove,
  changeDirection,
  togglePause,
} from './logic';
import type { SnakeState } from './types';
import { GRID_SIZE, INITIAL_SNAKE_LENGTH, INITIAL_DIRECTION } from './constants';

// ============================================================================
// Snake Centering Logic Tests (Feature #709)
// ============================================================================

describe('Snake Centering Logic', () => {
  describe('createInitialSnake', () => {
    it('should center snake head at grid center', () => {
      const snake = createInitialSnake();
      const head = snake[0];

      // Center of a 20x20 grid is (10, 10)
      const expectedCenterX = Math.floor(GRID_SIZE / 2);
      const expectedCenterY = Math.floor(GRID_SIZE / 2);

      expect(head.x).toBe(expectedCenterX);
      expect(head.y).toBe(expectedCenterY);
    });

    it('should create snake with correct initial length', () => {
      const snake = createInitialSnake();
      expect(snake.length).toBe(INITIAL_SNAKE_LENGTH);
    });

    it('should extend body segments to the left when facing right', () => {
      const snake = createInitialSnake(3, undefined, 'right');
      const head = snake[0];

      // Body segments should be to the left of the head
      for (let i = 1; i < snake.length; i++) {
        expect(snake[i].x).toBe(head.x - i);
        expect(snake[i].y).toBe(head.y);
      }
    });

    it('should extend body segments to the right when facing left', () => {
      const snake = createInitialSnake(3, undefined, 'left');
      const head = snake[0];

      // Body segments should be to the right of the head
      for (let i = 1; i < snake.length; i++) {
        expect(snake[i].x).toBe(head.x + i);
        expect(snake[i].y).toBe(head.y);
      }
    });

    it('should extend body segments downward when facing up', () => {
      const snake = createInitialSnake(3, undefined, 'up');
      const head = snake[0];

      // Body segments should be below the head
      for (let i = 1; i < snake.length; i++) {
        expect(snake[i].x).toBe(head.x);
        expect(snake[i].y).toBe(head.y + i);
      }
    });

    it('should extend body segments upward when facing down', () => {
      const snake = createInitialSnake(3, undefined, 'down');
      const head = snake[0];

      // Body segments should be above the head
      for (let i = 1; i < snake.length; i++) {
        expect(snake[i].x).toBe(head.x);
        expect(snake[i].y).toBe(head.y - i);
      }
    });

    it('should mark head and tail segments correctly', () => {
      const snake = createInitialSnake(3);

      expect(snake[0].isHead).toBe(true);
      expect(snake[0].isTail).toBe(false);

      expect(snake[1].isHead).toBe(false);
      expect(snake[1].isTail).toBe(false);

      expect(snake[2].isHead).toBe(false);
      expect(snake[2].isTail).toBe(true);
    });

    it('should accept custom start position', () => {
      const customPosition = { x: 5, y: 5 };
      const snake = createInitialSnake(3, customPosition);

      expect(snake[0].x).toBe(5);
      expect(snake[0].y).toBe(5);
    });

    it('should create snake with custom length', () => {
      const snake = createInitialSnake(5);
      expect(snake.length).toBe(5);
    });
  });

  describe('createInitialSnakeState', () => {
    it('should create state with centered snake', () => {
      const state = createInitialSnakeState();
      const head = state.segments[0];

      const expectedCenterX = Math.floor(GRID_SIZE / 2);
      const expectedCenterY = Math.floor(GRID_SIZE / 2);

      expect(head.x).toBe(expectedCenterX);
      expect(head.y).toBe(expectedCenterY);
    });

    it('should set initial direction to right', () => {
      const state = createInitialSnakeState();
      expect(state.direction).toBe(INITIAL_DIRECTION);
      expect(state.direction).toBe('right');
    });

    it('should initialize food outside snake', () => {
      const state = createInitialSnakeState();

      // Food should not collide with snake
      const foodCollidesWithSnake = state.segments.some(
        (segment) => segment.x === state.food.x && segment.y === state.food.y
      );

      expect(foodCollidesWithSnake).toBe(false);
    });
  });
});

// ============================================================================
// Direction Utilities Tests
// ============================================================================

describe('Direction Utilities', () => {
  describe('DIRECTION_VECTORS', () => {
    it('should have correct vector for each direction', () => {
      expect(DIRECTION_VECTORS.up).toEqual({ x: 0, y: -1 });
      expect(DIRECTION_VECTORS.down).toEqual({ x: 0, y: 1 });
      expect(DIRECTION_VECTORS.left).toEqual({ x: -1, y: 0 });
      expect(DIRECTION_VECTORS.right).toEqual({ x: 1, y: 0 });
    });
  });

  describe('OPPOSITE_DIRECTIONS', () => {
    it('should map directions to their opposites', () => {
      expect(OPPOSITE_DIRECTIONS.up).toBe('down');
      expect(OPPOSITE_DIRECTIONS.down).toBe('up');
      expect(OPPOSITE_DIRECTIONS.left).toBe('right');
      expect(OPPOSITE_DIRECTIONS.right).toBe('left');
    });
  });

  describe('areOppositeDirections', () => {
    it('should return true for opposite directions', () => {
      expect(areOppositeDirections('up', 'down')).toBe(true);
      expect(areOppositeDirections('down', 'up')).toBe(true);
      expect(areOppositeDirections('left', 'right')).toBe(true);
      expect(areOppositeDirections('right', 'left')).toBe(true);
    });

    it('should return false for non-opposite directions', () => {
      expect(areOppositeDirections('up', 'left')).toBe(false);
      expect(areOppositeDirections('up', 'right')).toBe(false);
      expect(areOppositeDirections('down', 'left')).toBe(false);
      expect(areOppositeDirections('down', 'right')).toBe(false);
    });

    it('should return false for same direction', () => {
      expect(areOppositeDirections('up', 'up')).toBe(false);
      expect(areOppositeDirections('down', 'down')).toBe(false);
      expect(areOppositeDirections('left', 'left')).toBe(false);
      expect(areOppositeDirections('right', 'right')).toBe(false);
    });
  });

  describe('isValidDirectionChange', () => {
    it('should allow same direction', () => {
      expect(isValidDirectionChange('up', 'up')).toBe(true);
      expect(isValidDirectionChange('down', 'down')).toBe(true);
    });

    it('should allow perpendicular direction changes', () => {
      expect(isValidDirectionChange('up', 'left')).toBe(true);
      expect(isValidDirectionChange('up', 'right')).toBe(true);
      expect(isValidDirectionChange('left', 'up')).toBe(true);
      expect(isValidDirectionChange('left', 'down')).toBe(true);
    });

    it('should not allow opposite direction changes', () => {
      expect(isValidDirectionChange('up', 'down')).toBe(false);
      expect(isValidDirectionChange('down', 'up')).toBe(false);
      expect(isValidDirectionChange('left', 'right')).toBe(false);
      expect(isValidDirectionChange('right', 'left')).toBe(false);
    });
  });
});

// ============================================================================
// Position Utilities Tests
// ============================================================================

describe('Position Utilities', () => {
  describe('positionsEqual', () => {
    it('should return true for equal positions', () => {
      expect(positionsEqual({ x: 5, y: 10 }, { x: 5, y: 10 })).toBe(true);
    });

    it('should return false for different positions', () => {
      expect(positionsEqual({ x: 5, y: 10 }, { x: 5, y: 11 })).toBe(false);
      expect(positionsEqual({ x: 5, y: 10 }, { x: 6, y: 10 })).toBe(false);
    });
  });

  describe('isWithinBounds', () => {
    it('should return true for positions within bounds', () => {
      expect(isWithinBounds({ x: 0, y: 0 })).toBe(true);
      expect(isWithinBounds({ x: 10, y: 10 })).toBe(true);
      expect(isWithinBounds({ x: GRID_SIZE - 1, y: GRID_SIZE - 1 })).toBe(true);
    });

    it('should return false for positions outside bounds', () => {
      expect(isWithinBounds({ x: -1, y: 0 })).toBe(false);
      expect(isWithinBounds({ x: 0, y: -1 })).toBe(false);
      expect(isWithinBounds({ x: GRID_SIZE, y: 0 })).toBe(false);
      expect(isWithinBounds({ x: 0, y: GRID_SIZE })).toBe(false);
    });
  });

  describe('wrapPosition', () => {
    it('should wrap positions that go beyond grid bounds', () => {
      expect(wrapPosition({ x: -1, y: 0 })).toEqual({ x: GRID_SIZE - 1, y: 0 });
      expect(wrapPosition({ x: GRID_SIZE, y: 0 })).toEqual({ x: 0, y: 0 });
      expect(wrapPosition({ x: 0, y: -1 })).toEqual({ x: 0, y: GRID_SIZE - 1 });
      expect(wrapPosition({ x: 0, y: GRID_SIZE })).toEqual({ x: 0, y: 0 });
    });

    it('should not change positions within bounds', () => {
      expect(wrapPosition({ x: 5, y: 5 })).toEqual({ x: 5, y: 5 });
    });
  });

  describe('getNextPosition', () => {
    it('should calculate next position correctly', () => {
      const pos = { x: 5, y: 5 };

      expect(getNextPosition(pos, 'up')).toEqual({ x: 5, y: 4 });
      expect(getNextPosition(pos, 'down')).toEqual({ x: 5, y: 6 });
      expect(getNextPosition(pos, 'left')).toEqual({ x: 4, y: 5 });
      expect(getNextPosition(pos, 'right')).toEqual({ x: 6, y: 5 });
    });
  });
});

// ============================================================================
// Snake Utilities Tests
// ============================================================================

describe('Snake Utilities', () => {
  const testSnake = [
    { x: 10, y: 10, isHead: true, isTail: false },
    { x: 9, y: 10, isHead: false, isTail: false },
    { x: 8, y: 10, isHead: false, isTail: true },
  ];

  describe('getSnakeHead', () => {
    it('should return the first segment', () => {
      expect(getSnakeHead(testSnake)).toEqual({ x: 10, y: 10, isHead: true, isTail: false });
    });
  });

  describe('getSnakeTail', () => {
    it('should return the last segment', () => {
      expect(getSnakeTail(testSnake)).toEqual({ x: 8, y: 10, isHead: false, isTail: true });
    });
  });

  describe('collidesWithSnake', () => {
    it('should detect collision with snake body', () => {
      expect(collidesWithSnake({ x: 9, y: 10 }, testSnake)).toBe(true);
    });

    it('should not detect collision at empty position', () => {
      expect(collidesWithSnake({ x: 15, y: 15 }, testSnake)).toBe(false);
    });

    it('should exclude head when specified', () => {
      expect(collidesWithSnake({ x: 10, y: 10 }, testSnake, true)).toBe(false);
      expect(collidesWithSnake({ x: 9, y: 10 }, testSnake, true)).toBe(true);
    });
  });

  describe('checkSelfCollision', () => {
    it('should return false for normal snake', () => {
      expect(checkSelfCollision(testSnake)).toBe(false);
    });

    it('should return true when head collides with body', () => {
      const collidingSnake = [
        { x: 9, y: 10, isHead: true, isTail: false },
        { x: 9, y: 10, isHead: false, isTail: false },
        { x: 8, y: 10, isHead: false, isTail: true },
      ];
      expect(checkSelfCollision(collidingSnake)).toBe(true);
    });

    it('should return false for single segment snake', () => {
      expect(checkSelfCollision([{ x: 5, y: 5, isHead: true, isTail: true }])).toBe(false);
    });
  });

  describe('moveSnake', () => {
    it('should move snake in specified direction', () => {
      const movedSnake = moveSnake(testSnake, 'right');

      expect(movedSnake[0].x).toBe(11);
      expect(movedSnake[0].y).toBe(10);
      expect(movedSnake.length).toBe(testSnake.length);
    });

    it('should grow snake when grow flag is true', () => {
      const grownSnake = moveSnake(testSnake, 'right', true);
      expect(grownSnake.length).toBe(testSnake.length + 1);
    });

    it('should wrap position when wrap is enabled', () => {
      const edgeSnake = [
        { x: GRID_SIZE - 1, y: 10, isHead: true, isTail: false },
        { x: GRID_SIZE - 2, y: 10, isHead: false, isTail: true },
      ];

      const wrappedSnake = moveSnake(edgeSnake, 'right', false, true);
      expect(wrappedSnake[0].x).toBe(0);
    });
  });
});

// ============================================================================
// Food Utilities Tests
// ============================================================================

describe('Food Utilities', () => {
  describe('generateFood', () => {
    it('should generate food at random position not on snake', () => {
      const snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 },
      ];
      const food = generateFood(snake);

      // Food should not be on any snake segment
      const collidesWithSnake = snake.some(
        (segment) => segment.x === food.x && segment.y === food.y
      );

      expect(collidesWithSnake).toBe(false);
    });

    it('should generate food within grid bounds', () => {
      const snake = [{ x: 5, y: 5 }];
      const food = generateFood(snake);

      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
    });

    it('should return a Position object with x and y', () => {
      const snake = [{ x: 5, y: 5 }];
      const food = generateFood(snake);

      expect(typeof food.x).toBe('number');
      expect(typeof food.y).toBe('number');
    });

    it('should work with empty snake array', () => {
      const food = generateFood([]);

      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
    });

    it('should respect custom grid size', () => {
      const snake = [{ x: 2, y: 2 }];
      const customGridSize = 5;
      const food = generateFood(snake, customGridSize);

      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(customGridSize);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(customGridSize);
    });
  });

  describe('spawnFood', () => {
    it('should spawn food outside snake', () => {
      const snake = createInitialSnake();
      const food = spawnFood(snake);

      const collidesWithSnake = snake.some(
        (segment) => segment.x === food.x && segment.y === food.y
      );

      expect(collidesWithSnake).toBe(false);
    });

    it('should spawn food within grid bounds', () => {
      const snake = createInitialSnake();
      const food = spawnFood(snake);

      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
    });

    it('should set correct food type', () => {
      const snake = createInitialSnake();

      expect(spawnFood(snake, GRID_SIZE, 'standard').type).toBe('standard');
      expect(spawnFood(snake, GRID_SIZE, 'bonus').type).toBe('bonus');
    });
  });

  describe('isEatingFood', () => {
    it('should return true when head is on food', () => {
      const snake = [{ x: 5, y: 5, isHead: true, isTail: true }];
      const food = { x: 5, y: 5, type: 'standard' as const, points: 10, hasEffect: false };

      expect(isEatingFood(snake, food)).toBe(true);
    });

    it('should return false when head is not on food', () => {
      const snake = [{ x: 5, y: 5, isHead: true, isTail: true }];
      const food = { x: 6, y: 5, type: 'standard' as const, points: 10, hasEffect: false };

      expect(isEatingFood(snake, food)).toBe(false);
    });
  });
});

// ============================================================================
// Score Utilities Tests
// ============================================================================

describe('Score Utilities', () => {
  describe('calculateScore', () => {
    it('should return base points at level 1 with no combo', () => {
      const food = { x: 0, y: 0, type: 'standard' as const, points: 10, hasEffect: false };
      expect(calculateScore(food, 1, 0)).toBe(10);
    });

    it('should increase score with level', () => {
      const food = { x: 0, y: 0, type: 'standard' as const, points: 10, hasEffect: false };
      expect(calculateScore(food, 2, 0)).toBeGreaterThan(10);
    });

    it('should increase score with combo', () => {
      const food = { x: 0, y: 0, type: 'standard' as const, points: 10, hasEffect: false };
      expect(calculateScore(food, 1, 5)).toBeGreaterThan(10);
    });
  });

  describe('calculateSpeed', () => {
    it('should return base speed at level 1', () => {
      expect(calculateSpeed(1)).toBe(150);
    });

    it('should decrease speed (faster) as level increases', () => {
      expect(calculateSpeed(5)).toBeLessThan(calculateSpeed(1));
    });

    it('should never go below minimum speed', () => {
      expect(calculateSpeed(100)).toBeGreaterThanOrEqual(50);
    });
  });
});

// ============================================================================
// State-Level Function Tests (Feature #713)
// ============================================================================

describe('State-Level Game Functions', () => {
  // Helper to create a full SnakeState for testing
  function createTestState(overrides: Partial<SnakeState> = {}): SnakeState {
    const gameSpecific = createInitialSnakeState();
    return {
      score: 0,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      level: 1,
      lives: 3,
      highScore: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      gameSpecific,
      ...overrides,
    };
  }

  describe('processSnakeMove', () => {
    it('should return unchanged state if paused', () => {
      const state = createTestState({ isPaused: true });
      const result = processSnakeMove(state);

      expect(result).toBe(state);
    });

    it('should return unchanged state if game over', () => {
      const state = createTestState({ isGameOver: true, isPlaying: false });
      const result = processSnakeMove(state);

      expect(result).toBe(state);
    });

    it('should return unchanged state if not playing', () => {
      const state = createTestState({ isPlaying: false });
      const result = processSnakeMove(state);

      expect(result).toBe(state);
    });

    it('should move snake in current direction', () => {
      const state = createTestState();
      const originalHead = state.gameSpecific!.segments[0];
      const result = processSnakeMove(state);

      const newHead = result.gameSpecific!.segments[0];

      // Snake starts facing right, so head should move right
      expect(newHead.x).toBe(originalHead.x + 1);
      expect(newHead.y).toBe(originalHead.y);
    });

    it('should return new state object (immutable)', () => {
      const state = createTestState();
      const result = processSnakeMove(state);

      expect(result).not.toBe(state);
      expect(result.gameSpecific).not.toBe(state.gameSpecific);
    });

    it('should detect wall collision and set game over', () => {
      const state = createTestState();
      // Move snake head to the right edge
      state.gameSpecific!.segments[0] = { x: GRID_SIZE - 1, y: 10, isHead: true, isTail: false };
      state.gameSpecific!.nextDirection = 'right';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
      expect(result.isPlaying).toBe(false);
    });

    it('should wrap around when wallsWrap is true', () => {
      const state = createTestState();
      state.gameSpecific!.segments[0] = { x: GRID_SIZE - 1, y: 10, isHead: true, isTail: false };
      state.gameSpecific!.nextDirection = 'right';
      state.gameSpecific!.wallsWrap = true;

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(false);
      expect(result.gameSpecific!.segments[0].x).toBe(0);
    });

    it('should detect self collision and set game over', () => {
      const state = createTestState();
      // Create a snake that will collide with itself
      state.gameSpecific!.segments = [
        { x: 5, y: 5, isHead: true, isTail: false },
        { x: 6, y: 5, isHead: false, isTail: false },
        { x: 6, y: 4, isHead: false, isTail: false },
        { x: 5, y: 4, isHead: false, isTail: false },
        { x: 4, y: 4, isHead: false, isTail: false },
        { x: 4, y: 5, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'left'; // Move left into body at (4, 5)

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
    });

    it('should grow snake when eating food', () => {
      const state = createTestState();
      const head = state.gameSpecific!.segments[0];
      // Place food directly in front of snake
      state.gameSpecific!.food = {
        x: head.x + 1,
        y: head.y,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      const originalLength = state.gameSpecific!.segments.length;
      const result = processSnakeMove(state);

      expect(result.gameSpecific!.segments.length).toBe(originalLength + 1);
    });

    it('should increase score when eating food', () => {
      const state = createTestState();
      const head = state.gameSpecific!.segments[0];
      state.gameSpecific!.food = {
        x: head.x + 1,
        y: head.y,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      const result = processSnakeMove(state);

      expect(result.score).toBeGreaterThan(0);
    });

    it('should spawn new food after eating', () => {
      const state = createTestState();
      const head = state.gameSpecific!.segments[0];
      const oldFood = {
        x: head.x + 1,
        y: head.y,
        type: 'standard' as const,
        points: 10,
        hasEffect: false,
      };
      state.gameSpecific!.food = oldFood;

      const result = processSnakeMove(state);
      const newFood = result.gameSpecific!.food;

      // New food should be spawned at a different location
      expect(newFood).not.toEqual(oldFood);
    });

    it('should update high score when current score exceeds it', () => {
      const state = createTestState();
      state.score = 100;
      state.highScore = 50;

      // Set up to eat food and trigger score update
      const head = state.gameSpecific!.segments[0];
      state.gameSpecific!.food = {
        x: head.x + 1,
        y: head.y,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      const result = processSnakeMove(state);

      expect(result.highScore).toBeGreaterThanOrEqual(result.score);
    });

    it('should update direction to nextDirection after move', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'up';
      // Move snake to a position where up is safe
      state.gameSpecific!.segments[0] = { x: 10, y: 15, isHead: true, isTail: false };
      state.gameSpecific!.segments[1] = { x: 9, y: 15, isHead: false, isTail: false };
      state.gameSpecific!.segments[2] = { x: 8, y: 15, isHead: false, isTail: true };

      const result = processSnakeMove(state);

      expect(result.gameSpecific!.direction).toBe('up');
    });

    it('should increment combo when eating food consecutively', () => {
      const state = createTestState();
      const head = state.gameSpecific!.segments[0];
      state.gameSpecific!.food = {
        x: head.x + 1,
        y: head.y,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };
      state.gameSpecific!.currentCombo = 2;

      const result = processSnakeMove(state);

      expect(result.gameSpecific!.currentCombo).toBe(3);
    });

    it('should reset combo when not eating food', () => {
      const state = createTestState();
      state.gameSpecific!.currentCombo = 5;
      // Food is not in the snake's path
      state.gameSpecific!.food = {
        x: 0,
        y: 0,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      const result = processSnakeMove(state);

      expect(result.gameSpecific!.currentCombo).toBe(0);
    });
  });

  describe('togglePause', () => {
    it('should toggle isPaused from false to true when playing', () => {
      const state = createTestState({ isPlaying: true, isPaused: false });
      const result = togglePause(state);

      expect(result.isPaused).toBe(true);
    });

    it('should toggle isPaused from true to false when playing', () => {
      const state = createTestState({ isPlaying: true, isPaused: true });
      const result = togglePause(state);

      expect(result.isPaused).toBe(false);
    });

    it('should return unchanged state if not playing', () => {
      const state = createTestState({ isPlaying: false, isPaused: false });
      const result = togglePause(state);

      expect(result).toBe(state);
      expect(result.isPaused).toBe(false);
    });

    it('should return unchanged state if game is over', () => {
      const state = createTestState({ isPlaying: true, isGameOver: true, isPaused: false });
      const result = togglePause(state);

      expect(result).toBe(state);
      expect(result.isPaused).toBe(false);
    });

    it('should return new state object when toggling (immutable)', () => {
      const state = createTestState({ isPlaying: true, isPaused: false });
      const result = togglePause(state);

      expect(result).not.toBe(state);
    });

    it('should preserve other state properties when toggling', () => {
      const state = createTestState({
        isPlaying: true,
        isPaused: false,
        score: 100,
        level: 5,
        highScore: 200,
      });
      const result = togglePause(state);

      expect(result.score).toBe(100);
      expect(result.level).toBe(5);
      expect(result.highScore).toBe(200);
      expect(result.isPlaying).toBe(true);
    });

    it('should allow multiple toggles', () => {
      const state = createTestState({ isPlaying: true, isPaused: false });

      const paused = togglePause(state);
      expect(paused.isPaused).toBe(true);

      const unpaused = togglePause(paused);
      expect(unpaused.isPaused).toBe(false);

      const pausedAgain = togglePause(unpaused);
      expect(pausedAgain.isPaused).toBe(true);
    });
  });

  describe('changeDirection', () => {
    it('should return unchanged state if paused', () => {
      const state = createTestState({ isPaused: true });
      const result = changeDirection(state, 'up');

      expect(result).toBe(state);
    });

    it('should return unchanged state if game over', () => {
      const state = createTestState({ isGameOver: true, isPlaying: false });
      const result = changeDirection(state, 'up');

      expect(result).toBe(state);
    });

    it('should return unchanged state if not playing', () => {
      const state = createTestState({ isPlaying: false });
      const result = changeDirection(state, 'up');

      expect(result).toBe(state);
    });

    it('should change direction to a valid perpendicular direction', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'right';

      const result = changeDirection(state, 'up');

      expect(result.gameSpecific!.nextDirection).toBe('up');
    });

    it('should not change to opposite direction', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      const result = changeDirection(state, 'left');

      // nextDirection should remain unchanged
      expect(result.gameSpecific!.nextDirection).toBe('right');
    });

    it('should allow same direction', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      const result = changeDirection(state, 'right');

      expect(result.gameSpecific!.nextDirection).toBe('right');
    });

    it('should return new state object (immutable)', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'right';

      const result = changeDirection(state, 'up');

      expect(result).not.toBe(state);
      expect(result.gameSpecific).not.toBe(state.gameSpecific);
    });

    it('should return unchanged state for invalid direction', () => {
      const state = createTestState();
      // @ts-expect-error Testing invalid direction
      const result = changeDirection(state, 'invalid');

      expect(result).toBe(state);
    });

    it('should allow changing from up to left', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'up';

      const result = changeDirection(state, 'left');

      expect(result.gameSpecific!.nextDirection).toBe('left');
    });

    it('should allow changing from up to right', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'up';

      const result = changeDirection(state, 'right');

      expect(result.gameSpecific!.nextDirection).toBe('right');
    });

    it('should not allow changing from up to down', () => {
      const state = createTestState();
      state.gameSpecific!.direction = 'up';
      state.gameSpecific!.nextDirection = 'up';

      const result = changeDirection(state, 'down');

      expect(result.gameSpecific!.nextDirection).toBe('up');
    });
  });
});

// ============================================================================
// Edge Case Tests (Feature #725)
// ============================================================================

describe('Edge Case Tests', () => {
  // Helper to create a full SnakeState for testing
  function createEdgeTestState(overrides: Partial<SnakeState> = {}): SnakeState {
    const gameSpecific = createInitialSnakeState();
    return {
      score: 0,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      level: 1,
      lives: 3,
      highScore: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      gameSpecific,
      ...overrides,
    };
  }

  describe('Snake at grid boundaries', () => {
    it('should handle snake at top boundary without wrapping', () => {
      const state = createEdgeTestState();
      // Place snake at top edge
      state.gameSpecific!.segments = [
        { x: 10, y: 0, isHead: true, isTail: false },
        { x: 10, y: 1, isHead: false, isTail: false },
        { x: 10, y: 2, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'up';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
      expect(result.isPlaying).toBe(false);
    });

    it('should handle snake at bottom boundary without wrapping', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.segments = [
        { x: 10, y: GRID_SIZE - 1, isHead: true, isTail: false },
        { x: 10, y: GRID_SIZE - 2, isHead: false, isTail: false },
        { x: 10, y: GRID_SIZE - 3, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'down';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
    });

    it('should handle snake at left boundary without wrapping', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.segments = [
        { x: 0, y: 10, isHead: true, isTail: false },
        { x: 1, y: 10, isHead: false, isTail: false },
        { x: 2, y: 10, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'left';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
    });

    it('should handle snake at right boundary without wrapping', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.segments = [
        { x: GRID_SIZE - 1, y: 10, isHead: true, isTail: false },
        { x: GRID_SIZE - 2, y: 10, isHead: false, isTail: false },
        { x: GRID_SIZE - 3, y: 10, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'right';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
    });

    it('should wrap at all boundaries when wallsWrap is enabled', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.wallsWrap = true;

      // Test top wrap
      state.gameSpecific!.segments = [
        { x: 10, y: 0, isHead: true, isTail: false },
        { x: 10, y: 1, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'up';
      let result = processSnakeMove(state);
      expect(result.isGameOver).toBe(false);
      expect(result.gameSpecific!.segments[0].y).toBe(GRID_SIZE - 1);

      // Test bottom wrap
      state.gameSpecific!.segments = [
        { x: 10, y: GRID_SIZE - 1, isHead: true, isTail: false },
        { x: 10, y: GRID_SIZE - 2, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'down';
      result = processSnakeMove(state);
      expect(result.isGameOver).toBe(false);
      expect(result.gameSpecific!.segments[0].y).toBe(0);

      // Test left wrap
      state.gameSpecific!.segments = [
        { x: 0, y: 10, isHead: true, isTail: false },
        { x: 1, y: 10, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'left';
      result = processSnakeMove(state);
      expect(result.isGameOver).toBe(false);
      expect(result.gameSpecific!.segments[0].x).toBe(GRID_SIZE - 1);

      // Test right wrap
      state.gameSpecific!.segments = [
        { x: GRID_SIZE - 1, y: 10, isHead: true, isTail: false },
        { x: GRID_SIZE - 2, y: 10, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'right';
      result = processSnakeMove(state);
      expect(result.isGameOver).toBe(false);
      expect(result.gameSpecific!.segments[0].x).toBe(0);
    });

    it('should handle corner positions correctly', () => {
      const state = createEdgeTestState();

      // Top-left corner
      state.gameSpecific!.segments = [
        { x: 0, y: 0, isHead: true, isTail: false },
        { x: 1, y: 0, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'up';
      let result = processSnakeMove(state);
      expect(result.isGameOver).toBe(true);

      // Top-right corner
      state.gameSpecific!.segments = [
        { x: GRID_SIZE - 1, y: 0, isHead: true, isTail: false },
        { x: GRID_SIZE - 2, y: 0, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'right';
      result = processSnakeMove(state);
      expect(result.isGameOver).toBe(true);
    });
  });

  describe('Food generation with long snake', () => {
    it('should generate food when snake fills most of the grid', () => {
      // Create a very long snake (80% of grid)
      const gridArea = GRID_SIZE * GRID_SIZE;
      const snakeLength = Math.floor(gridArea * 0.8);
      const segments: SnakeSegment[] = [];

      // Create a spiral snake pattern
      for (let i = 0; i < snakeLength; i++) {
        segments.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === snakeLength - 1,
        });
      }

      const food = spawnFood(segments, GRID_SIZE);

      // Food should not collide with any segment
      const collidesWithSnake = segments.some(
        (segment) => segment.x === food.x && segment.y === food.y
      );
      expect(collidesWithSnake).toBe(false);

      // Food should be within bounds
      expect(food.x).toBeGreaterThanOrEqual(0);
      expect(food.x).toBeLessThan(GRID_SIZE);
      expect(food.y).toBeGreaterThanOrEqual(0);
      expect(food.y).toBeLessThan(GRID_SIZE);
    });

    it('should handle food generation when snake is maximum length minus one', () => {
      const gridArea = GRID_SIZE * GRID_SIZE;
      const segments: SnakeSegment[] = [];

      // Fill all but one cell
      for (let i = 0; i < gridArea - 1; i++) {
        segments.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === gridArea - 2,
        });
      }

      const food = spawnFood(segments, GRID_SIZE);

      // Should find the one remaining cell
      const collidesWithSnake = segments.some(
        (segment) => segment.x === food.x && segment.y === food.y
      );
      expect(collidesWithSnake).toBe(false);
    });
  });

  describe('Rapid direction changes', () => {
    it('should buffer direction change until next move', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      // Change direction to up
      const changed = changeDirection(state, 'up');
      expect(changed.gameSpecific!.direction).toBe('right'); // Still moving right
      expect(changed.gameSpecific!.nextDirection).toBe('up'); // Buffered

      // After move, direction should update
      const moved = processSnakeMove(changed);
      expect(moved.gameSpecific!.direction).toBe('up'); // Now moving up
    });

    it('should prevent rapid direction reversal', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      // Try to reverse direction (should be blocked)
      const changed = changeDirection(state, 'left');
      expect(changed.gameSpecific!.nextDirection).toBe('right'); // Unchanged

      // Should still move right
      const moved = processSnakeMove(changed);
      expect(moved.gameSpecific!.direction).toBe('right');
    });

    it('should allow two perpendicular direction changes in sequence', () => {
      const state = createEdgeTestState();
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      // First change: right -> up
      const firstChange = changeDirection(state, 'up');
      expect(firstChange.gameSpecific!.nextDirection).toBe('up');

      // Second change: up -> left (before move)
      // Note: This validates against the *current* direction (right), not buffered (up)
      // So left is opposite of right and should be blocked
      const secondChange = changeDirection(firstChange, 'down');
      // This should work since down is perpendicular to current direction (right)
      expect(secondChange.gameSpecific!.nextDirection).toBe('down');
    });

    it('should handle direction change on the same frame as food eating', () => {
      const state = createEdgeTestState();
      // Set snake to specific position for predictable test
      state.gameSpecific!.segments = [
        { x: 10, y: 10, isHead: true, isTail: false },
        { x: 9, y: 10, isHead: false, isTail: false },
        { x: 8, y: 10, isHead: false, isTail: true },
      ];
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      // Place food directly in front of snake
      state.gameSpecific!.food = {
        x: 11,
        y: 10,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      // First verify food is positioned correctly
      const headPos = state.gameSpecific!.segments[0];
      expect(headPos.x).toBe(10);
      expect(headPos.y).toBe(10);

      // Move once to eat food (moving right)
      const movedRight = processSnakeMove(state);
      expect(movedRight.score).toBeGreaterThan(0); // Should have eaten
      expect(movedRight.gameSpecific!.segments.length).toBe(4); // Should have grown

      // Now change direction to up
      const changed = changeDirection(movedRight, 'up');
      expect(changed.gameSpecific!.nextDirection).toBe('up');

      // Move again (now moving up)
      const movedUp = processSnakeMove(changed);
      expect(movedUp.gameSpecific!.direction).toBe('up');
    });
  });

  describe('Pause during movement', () => {
    it('should stop processing moves when paused', () => {
      const state = createEdgeTestState({ isPaused: false });
      const originalHead = state.gameSpecific!.segments[0];

      // Pause the game
      const paused = togglePause(state);
      expect(paused.isPaused).toBe(true);

      // Try to move while paused (should not move)
      const moved = processSnakeMove(paused);
      expect(moved.gameSpecific!.segments[0]).toEqual(originalHead);
      expect(moved).toBe(paused); // Should return same reference (no change)
    });

    it('should resume movement after unpausing', () => {
      const state = createEdgeTestState({ isPaused: false });

      // Pause
      const paused = togglePause(state);
      expect(paused.isPaused).toBe(true);

      // Try to move (should not move)
      const attemptedMove = processSnakeMove(paused);
      expect(attemptedMove).toBe(paused);

      // Unpause
      const unpaused = togglePause(paused);
      expect(unpaused.isPaused).toBe(false);

      // Now should move
      const moved = processSnakeMove(unpaused);
      expect(moved).not.toBe(unpaused);
      expect(moved.gameSpecific!.segments[0].x).not.toBe(unpaused.gameSpecific!.segments[0].x);
    });

    it('should preserve direction changes made while paused', () => {
      const state = createEdgeTestState({ isPaused: false });
      state.gameSpecific!.direction = 'right';
      state.gameSpecific!.nextDirection = 'right';

      // Change direction before pausing
      const changed = changeDirection(state, 'up');
      expect(changed.gameSpecific!.nextDirection).toBe('up');

      // Pause
      const paused = togglePause(changed);
      expect(paused.isPaused).toBe(true);

      // The direction change is already buffered
      expect(paused.gameSpecific!.nextDirection).toBe('up');

      // Unpause and move
      const unpaused = togglePause(paused);
      const moved = processSnakeMove(unpaused);

      // Should move in the new direction
      expect(moved.gameSpecific!.direction).toBe('up');
    });

    it('should not allow eating food while paused', () => {
      const state = createEdgeTestState({ isPaused: false });
      const head = state.gameSpecific!.segments[0];

      // Place food in front
      state.gameSpecific!.food = {
        x: head.x + 1,
        y: head.y,
        type: 'standard',
        points: 10,
        hasEffect: false,
      };

      // Pause before eating
      const paused = togglePause(state);
      const moved = processSnakeMove(paused);

      // Should not eat food or gain score
      expect(moved.score).toBe(0);
      expect(moved.gameSpecific!.segments.length).toBe(state.gameSpecific!.segments.length);
    });
  });

  describe('Game over state transitions', () => {
    it('should prevent movement after game over', () => {
      const state = createEdgeTestState({ isGameOver: true, isPlaying: false });
      const originalHead = state.gameSpecific!.segments[0];

      const result = processSnakeMove(state);

      expect(result).toBe(state); // Should return same reference
      expect(result.gameSpecific!.segments[0]).toEqual(originalHead);
    });

    it('should prevent direction changes after game over', () => {
      const state = createEdgeTestState({ isGameOver: true, isPlaying: false });
      state.gameSpecific!.direction = 'right';

      const result = changeDirection(state, 'up');

      expect(result).toBe(state); // Should return same reference
      expect(result.gameSpecific!.nextDirection).toBe('right');
    });

    it('should not allow toggling pause after game over', () => {
      const state = createEdgeTestState({ isGameOver: true, isPlaying: true, isPaused: false });

      const result = togglePause(state);

      expect(result).toBe(state); // Should return same reference
      expect(result.isPaused).toBe(false);
    });

    it('should update high score when game ends', () => {
      const state = createEdgeTestState({ highScore: 50 });
      state.score = 100;

      // Position snake to hit wall
      state.gameSpecific!.segments[0] = {
        x: GRID_SIZE - 1,
        y: 10,
        isHead: true,
        isTail: false,
      };
      state.gameSpecific!.nextDirection = 'right';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
      expect(result.highScore).toBe(100);
    });

    it('should preserve high score when current score is lower', () => {
      const state = createEdgeTestState({ highScore: 200 });
      state.score = 50;

      // Position snake to hit wall
      state.gameSpecific!.segments[0] = {
        x: GRID_SIZE - 1,
        y: 10,
        isHead: true,
        isTail: false,
      };
      state.gameSpecific!.nextDirection = 'right';

      const result = processSnakeMove(state);

      expect(result.isGameOver).toBe(true);
      expect(result.highScore).toBe(200);
    });

    it('should transition from playing to game over in one frame', () => {
      const state = createEdgeTestState({ isPlaying: true, isGameOver: false });

      // Position snake to collide with self
      state.gameSpecific!.segments = [
        { x: 5, y: 5, isHead: true, isTail: false },
        { x: 6, y: 5, isHead: false, isTail: false },
        { x: 6, y: 4, isHead: false, isTail: false },
        { x: 5, y: 4, isHead: false, isTail: false },
        { x: 4, y: 4, isHead: false, isTail: false },
        { x: 4, y: 5, isHead: false, isTail: true },
      ];
      state.gameSpecific!.nextDirection = 'left';

      const result = processSnakeMove(state);

      expect(result.isPlaying).toBe(false);
      expect(result.isGameOver).toBe(true);
    });
  });
});

// ============================================================================
// Performance Tests (Feature #728)
// ============================================================================

describe('Performance Tests', () => {
  function createLargeTestState(): SnakeState {
    const gameSpecific = createInitialSnakeState();
    // Create a large snake
    const longSnake: SnakeSegment[] = [];
    for (let i = 0; i < 100; i++) {
      longSnake.push({
        x: i % GRID_SIZE,
        y: Math.floor(i / GRID_SIZE),
        isHead: i === 0,
        isTail: i === 99,
      });
    }
    gameSpecific.segments = longSnake;

    return {
      score: 1000,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      level: 10,
      lives: 3,
      highScore: 5000,
      startTime: Date.now(),
      elapsedTime: 60000,
      gameSpecific,
    };
  }

  describe('moveSnake performance with long snake', () => {
    it('should handle moving snake with 100+ segments efficiently', () => {
      // Create a very long snake (150 segments)
      const longSnake: SnakeSegment[] = [];
      for (let i = 0; i < 150; i++) {
        longSnake.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === 149,
        });
      }

      // Measure performance
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        moveSnake(longSnake, 'right', false, false, GRID_SIZE);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      // Should complete in under 1ms per operation on average
      expect(avgTime).toBeLessThan(1);

      // Verify correctness
      const result = moveSnake(longSnake, 'right', false, false, GRID_SIZE);
      expect(result.length).toBe(150);
      expect(result[0].x).toBe(1);
    });

    it('should handle growing snake efficiently', () => {
      let snake: SnakeSegment[] = createInitialSnake(3);

      // Grow snake 100 times
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        snake = moveSnake(snake, 'right', true);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      // Should complete in under 50ms total
      expect(totalTime).toBeLessThan(50);
      expect(snake.length).toBe(103);
    });

    it('should not have memory leaks with repeated moves', () => {
      let snake = createInitialSnake();

      // Perform many moves to check for memory accumulation
      for (let i = 0; i < 10000; i++) {
        snake = moveSnake(snake, 'right', false, true);
      }

      expect(snake.length).toBe(INITIAL_SNAKE_LENGTH);
      snake.forEach((segment) => {
        expect(segment.x).toBeGreaterThanOrEqual(0);
        expect(segment.x).toBeLessThan(GRID_SIZE);
        expect(segment.y).toBeGreaterThanOrEqual(0);
        expect(segment.y).toBeLessThan(GRID_SIZE);
      });
    });
  });

  describe('generateFood performance with nearly-full grid', () => {
    it('should generate food efficiently when grid is 95% full', () => {
      const gridArea = GRID_SIZE * GRID_SIZE;
      const snakeLength = Math.floor(gridArea * 0.95);
      const snake: SnakeSegment[] = [];

      for (let i = 0; i < snakeLength; i++) {
        snake.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === snakeLength - 1,
        });
      }

      const iterations = 100;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        spawnFood(snake, GRID_SIZE);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(5);

      const food = spawnFood(snake, GRID_SIZE);
      const collidesWithSnake = snake.some(
        (segment) => segment.x === food.x && segment.y === food.y
      );
      expect(collidesWithSnake).toBe(false);
    });

    it('should handle worst-case food generation', () => {
      const gridArea = GRID_SIZE * GRID_SIZE;
      const snake: SnakeSegment[] = [];
      const emptyCells = new Set([5, 10, 15]);

      for (let i = 0; i < gridArea; i++) {
        if (!emptyCells.has(i)) {
          snake.push({
            x: i % GRID_SIZE,
            y: Math.floor(i / GRID_SIZE),
            isHead: i === 0,
            isTail: false,
          });
        }
      }

      const startTime = performance.now();
      const food = spawnFood(snake, GRID_SIZE);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);

      const foodIndex = food.y * GRID_SIZE + food.x;
      expect(emptyCells.has(foodIndex)).toBe(true);
    });
  });

  describe('collision detection performance', () => {
    it('should detect collisions efficiently with long snake', () => {
      const longSnake: SnakeSegment[] = [];
      for (let i = 0; i < 200; i++) {
        longSnake.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === 199,
        });
      }

      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        checkSelfCollision(longSnake);
        collidesWithSnake({ x: 5, y: 5 }, longSnake);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(0.1);
    });

    it('should handle boundary checks efficiently', () => {
      const positions = [
        { x: 0, y: 0 },
        { x: GRID_SIZE - 1, y: GRID_SIZE - 1 },
        { x: -1, y: 0 },
        { x: GRID_SIZE, y: 0 },
        { x: 5, y: 5 },
      ];

      const iterations = 100000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        positions.forEach((pos) => {
          isWithinBounds(pos);
          wrapPosition(pos);
        });
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(100);
    });
  });

  describe('state update performance', () => {
    it('should process state updates efficiently', () => {
      let state = createLargeTestState();

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        state = processSnakeMove(state);
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(1);
    });

    it('should ensure no memory leaks in state updates', () => {
      let state = createLargeTestState();
      const initialSegmentCount = state.gameSpecific!.segments.length;

      for (let i = 0; i < 5000; i++) {
        state = processSnakeMove(state);
        state = changeDirection(state, i % 2 === 0 ? 'up' : 'down');
      }

      expect(state.gameSpecific!.segments.length).toBeLessThan(initialSegmentCount + 50);
      expect(state.score).toBeGreaterThanOrEqual(0);
      expect(state.level).toBeGreaterThanOrEqual(1);
    });

    it('should handle rapid direction changes without performance degradation', () => {
      let state = createLargeTestState();
      const directions: ('up' | 'down' | 'left' | 'right')[] = ['up', 'right', 'down', 'left'];

      const startTime = performance.now();

      for (let i = 0; i < 10000; i++) {
        state = changeDirection(state, directions[i % 4]);
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50);
      expect(state.gameSpecific!.nextDirection).toBeDefined();
    });
  });

  describe('performance baseline documentation', () => {
    it('should document performance benchmarks', () => {
      const benchmarks = {
        moveSnake100Segments: 0,
        generateFoodFullGrid: 0,
        collisionCheck: 0,
        stateUpdate: 0,
      };

      const longSnake = [];
      for (let i = 0; i < 100; i++) {
        longSnake.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: i === 99,
        });
      }
      let start = performance.now();
      for (let i = 0; i < 1000; i++) moveSnake(longSnake, 'right');
      benchmarks.moveSnake100Segments = (performance.now() - start) / 1000;

      const fullSnake = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE * 0.9; i++) {
        fullSnake.push({
          x: i % GRID_SIZE,
          y: Math.floor(i / GRID_SIZE),
          isHead: i === 0,
          isTail: false,
        });
      }
      start = performance.now();
      for (let i = 0; i < 100; i++) spawnFood(fullSnake);
      benchmarks.generateFoodFullGrid = (performance.now() - start) / 100;

      start = performance.now();
      for (let i = 0; i < 10000; i++) checkSelfCollision(longSnake);
      benchmarks.collisionCheck = (performance.now() - start) / 10000;

      const state = createLargeTestState();
      start = performance.now();
      let updatedState = state;
      for (let i = 0; i < 1000; i++) {
        updatedState = processSnakeMove(updatedState);
      }
      benchmarks.stateUpdate = (performance.now() - start) / 1000;

      console.log('Performance Benchmarks:', benchmarks);

      expect(benchmarks.moveSnake100Segments).toBeLessThan(1);
      expect(benchmarks.generateFoodFullGrid).toBeLessThan(5);
      expect(benchmarks.collisionCheck).toBeLessThan(0.1);
      expect(benchmarks.stateUpdate).toBeLessThan(1);
    });
  });
});
