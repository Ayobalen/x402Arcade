/**
 * Tests for Game Descriptions Utility
 */

import { describe, it, expect } from 'vitest';
import {
  describeSnakeGame,
  describeTetrisGame,
  describeTetromino,
  getRelativePosition,
  describeGameCanvas,
  describeGameControls,
  formatScore,
  describeRank,
  getOrdinalSuffix,
  generateGameStateSummary,
} from '../gameDescriptions';
import type { SnakeGameState, TetrisGameState } from '../gameDescriptions';

describe('gameDescriptions', () => {
  describe('describeSnakeGame', () => {
    it('should describe basic Snake game state', () => {
      const state: SnakeGameState = {
        score: 150,
        level: 3,
        snakeLength: 12,
      };

      const description = describeSnakeGame(state);

      expect(description).toContain('Snake game');
      expect(description).toContain('Score: 150');
      expect(description).toContain('Level: 3');
      expect(description).toContain('Snake length: 12');
    });

    it('should include direction when provided', () => {
      const state: SnakeGameState = {
        score: 100,
        level: 2,
        snakeLength: 8,
        direction: 'right',
      };

      const description = describeSnakeGame(state);

      expect(description).toContain('Moving right');
    });

    it('should indicate paused state', () => {
      const state: SnakeGameState = {
        score: 50,
        level: 1,
        snakeLength: 5,
        isPaused: true,
      };

      const description = describeSnakeGame(state);

      expect(description).toContain('Game paused');
    });

    it('should indicate game over state', () => {
      const state: SnakeGameState = {
        score: 200,
        level: 5,
        snakeLength: 15,
        isGameOver: true,
      };

      const description = describeSnakeGame(state);

      expect(description).toContain('Game over');
    });

    it('should describe food position relative to snake', () => {
      const state: SnakeGameState = {
        score: 100,
        level: 2,
        snakeLength: 8,
        snakePosition: { x: 5, y: 5 },
        foodPosition: { x: 8, y: 3 },
      };

      const description = describeSnakeGame(state);

      expect(description).toContain('Food is');
    });

    it('should handle all directions', () => {
      const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];

      directions.forEach((dir) => {
        const state: SnakeGameState = {
          score: 0,
          level: 1,
          snakeLength: 3,
          direction: dir,
        };

        const description = describeSnakeGame(state);
        expect(description).toContain(`Moving ${dir}`);
      });
    });
  });

  describe('describeTetrisGame', () => {
    it('should describe basic Tetris game state', () => {
      const state: TetrisGameState = {
        score: 2400,
        level: 5,
        linesCleared: 24,
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Tetris game');
      expect(description).toContain('Score: 2400');
      expect(description).toContain('Level: 5');
      expect(description).toContain('Lines cleared: 24');
    });

    it('should describe current piece', () => {
      const state: TetrisGameState = {
        score: 1000,
        level: 3,
        linesCleared: 10,
        currentPiece: 'I',
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Current piece: I-shaped');
    });

    it('should describe next piece', () => {
      const state: TetrisGameState = {
        score: 1000,
        level: 3,
        linesCleared: 10,
        nextPiece: 'L',
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Next piece: L-shaped');
    });

    it('should describe both current and next pieces', () => {
      const state: TetrisGameState = {
        score: 1500,
        level: 4,
        linesCleared: 15,
        currentPiece: 'T',
        nextPiece: 'O',
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Current piece: T-shaped');
      expect(description).toContain('Next piece: O-shaped');
    });

    it('should indicate paused state', () => {
      const state: TetrisGameState = {
        score: 500,
        level: 1,
        linesCleared: 5,
        isPaused: true,
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Game paused');
    });

    it('should indicate game over state', () => {
      const state: TetrisGameState = {
        score: 3000,
        level: 6,
        linesCleared: 30,
        isGameOver: true,
      };

      const description = describeTetrisGame(state);

      expect(description).toContain('Game over');
    });
  });

  describe('describeTetromino', () => {
    it('should describe all standard tetrominoes', () => {
      expect(describeTetromino('I')).toBe('I-shaped (straight line)');
      expect(describeTetromino('J')).toBe('J-shaped');
      expect(describeTetromino('L')).toBe('L-shaped');
      expect(describeTetromino('O')).toBe('O-shaped (square)');
      expect(describeTetromino('S')).toBe('S-shaped');
      expect(describeTetromino('T')).toBe('T-shaped');
      expect(describeTetromino('Z')).toBe('Z-shaped');
    });

    it('should handle lowercase letters', () => {
      expect(describeTetromino('i')).toBe('I-shaped (straight line)');
      expect(describeTetromino('l')).toBe('L-shaped');
    });

    it('should handle unknown pieces', () => {
      expect(describeTetromino('X')).toBe('X-shaped');
    });
  });

  describe('getRelativePosition', () => {
    it('should describe position to the right', () => {
      const result = getRelativePosition({ x: 5, y: 5 }, { x: 8, y: 5 });
      expect(result).toBe('to the right');
    });

    it('should describe position to the left', () => {
      const result = getRelativePosition({ x: 5, y: 5 }, { x: 2, y: 5 });
      expect(result).toBe('to the left');
    });

    it('should describe position above', () => {
      const result = getRelativePosition({ x: 5, y: 5 }, { x: 5, y: 2 });
      expect(result).toBe('above');
    });

    it('should describe position below', () => {
      const result = getRelativePosition({ x: 5, y: 5 }, { x: 5, y: 8 });
      expect(result).toBe('below');
    });

    it('should describe diagonal positions', () => {
      expect(getRelativePosition({ x: 5, y: 5 }, { x: 8, y: 3 })).toBe('to the right and above');
      expect(getRelativePosition({ x: 5, y: 5 }, { x: 8, y: 8 })).toBe('to the right and below');
      expect(getRelativePosition({ x: 5, y: 5 }, { x: 2, y: 3 })).toBe('to the left and above');
      expect(getRelativePosition({ x: 5, y: 5 }, { x: 2, y: 8 })).toBe('to the left and below');
    });

    it('should describe same position', () => {
      const result = getRelativePosition({ x: 5, y: 5 }, { x: 5, y: 5 });
      expect(result).toBe('at the same position');
    });
  });

  describe('describeGameCanvas', () => {
    it('should describe canvas without state', () => {
      const description = describeGameCanvas('Snake');
      expect(description).toBe('Snake game canvas');
    });

    it('should describe canvas with state', () => {
      const description = describeGameCanvas('Snake', 'Score: 100, Level: 2');
      expect(description).toBe('Snake game canvas. Score: 100, Level: 2');
    });

    it('should work with different game names', () => {
      expect(describeGameCanvas('Tetris')).toBe('Tetris game canvas');
      expect(describeGameCanvas('Pong')).toBe('Pong game canvas');
    });
  });

  describe('describeGameControls', () => {
    it('should describe Snake controls', () => {
      const controls = describeGameControls('Snake');
      expect(controls).toContain('arrow keys');
      expect(controls).toContain('WASD');
      expect(controls).toContain('Space');
      expect(controls).toContain('Escape');
    });

    it('should describe Tetris controls', () => {
      const controls = describeGameControls('Tetris');
      expect(controls).toContain('left and right arrows');
      expect(controls).toContain('rotate');
      expect(controls).toContain('Space');
      expect(controls).toContain('hard drop');
    });

    it('should provide generic controls for unknown games', () => {
      const controls = describeGameControls('UnknownGame');
      expect(controls).toBe('Use keyboard to control the game.');
    });
  });

  describe('formatScore', () => {
    it('should format score with commas', () => {
      expect(formatScore(1000)).toBe('1,000');
      expect(formatScore(1500)).toBe('1,500');
      expect(formatScore(1000000)).toBe('1,000,000');
    });

    it('should format small scores without commas', () => {
      expect(formatScore(100)).toBe('100');
      expect(formatScore(0)).toBe('0');
    });

    it('should format score with maximum', () => {
      expect(formatScore(1500, 5000)).toBe('1,500 out of 5,000');
    });

    it('should handle zero scores', () => {
      expect(formatScore(0, 1000)).toBe('0 out of 1,000');
    });
  });

  describe('describeRank', () => {
    it('should describe rank with ordinal suffix', () => {
      expect(describeRank(1)).toBe('1st place');
      expect(describeRank(2)).toBe('2nd place');
      expect(describeRank(3)).toBe('3rd place');
      expect(describeRank(4)).toBe('4th place');
    });

    it('should describe rank with total players', () => {
      expect(describeRank(1, 100)).toBe('1st place out of 100 players');
      expect(describeRank(42, 100)).toBe('42nd place out of 100 players');
    });

    it('should handle special ordinal cases', () => {
      expect(describeRank(11)).toBe('11th place');
      expect(describeRank(12)).toBe('12th place');
      expect(describeRank(13)).toBe('13th place');
      expect(describeRank(21)).toBe('21st place');
      expect(describeRank(22)).toBe('22nd place');
      expect(describeRank(23)).toBe('23rd place');
    });
  });

  describe('getOrdinalSuffix', () => {
    it('should return correct suffix for 1st, 2nd, 3rd', () => {
      expect(getOrdinalSuffix(1)).toBe('st');
      expect(getOrdinalSuffix(2)).toBe('nd');
      expect(getOrdinalSuffix(3)).toBe('rd');
    });

    it('should return "th" for 4-10', () => {
      for (let i = 4; i <= 10; i++) {
        expect(getOrdinalSuffix(i)).toBe('th');
      }
    });

    it('should handle special cases 11-13', () => {
      expect(getOrdinalSuffix(11)).toBe('th');
      expect(getOrdinalSuffix(12)).toBe('th');
      expect(getOrdinalSuffix(13)).toBe('th');
    });

    it('should return correct suffix for 21-23', () => {
      expect(getOrdinalSuffix(21)).toBe('st');
      expect(getOrdinalSuffix(22)).toBe('nd');
      expect(getOrdinalSuffix(23)).toBe('rd');
    });

    it('should handle large numbers', () => {
      expect(getOrdinalSuffix(101)).toBe('st');
      expect(getOrdinalSuffix(111)).toBe('th');
      expect(getOrdinalSuffix(121)).toBe('st');
    });
  });

  describe('generateGameStateSummary', () => {
    it('should generate summary for Snake game', () => {
      const state: SnakeGameState = {
        score: 150,
        level: 3,
        snakeLength: 12,
        direction: 'right',
      };

      const summary = generateGameStateSummary('Snake', state);

      expect(summary).toContain('Snake game');
      expect(summary).toContain('Score: 150');
      expect(summary).toContain('Level: 3');
    });

    it('should generate summary for Tetris game', () => {
      const state: TetrisGameState = {
        score: 2400,
        level: 5,
        linesCleared: 24,
        currentPiece: 'I',
      };

      const summary = generateGameStateSummary('Tetris', state);

      expect(summary).toContain('Tetris game');
      expect(summary).toContain('Score: 2400');
      expect(summary).toContain('Level: 5');
    });

    it('should provide generic summary for unknown games', () => {
      const state: SnakeGameState = {
        score: 100,
        level: 2,
        snakeLength: 8,
      };

      const summary = generateGameStateSummary('UnknownGame', state);

      expect(summary).toContain('UnknownGame game');
      expect(summary).toContain('Score: 100');
      expect(summary).toContain('Level: 2');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values gracefully', () => {
      const snakeState: SnakeGameState = {
        score: 0,
        level: 0,
        snakeLength: 0,
      };

      const description = describeSnakeGame(snakeState);
      expect(description).toContain('Score: 0');
    });

    it('should handle very large scores', () => {
      expect(formatScore(999999999)).toBe('999,999,999');
    });

    it('should handle both paused and game over (game over takes precedence)', () => {
      const state: SnakeGameState = {
        score: 100,
        level: 2,
        snakeLength: 8,
        isPaused: true,
        isGameOver: true,
      };

      const description = describeSnakeGame(state);
      // Game over should appear (implementation may vary)
      expect(description).toContain('Game over');
    });
  });
});
