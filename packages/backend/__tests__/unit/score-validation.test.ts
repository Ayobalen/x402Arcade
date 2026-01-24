/**
 * Unit tests for score validation module
 *
 * @module __tests__/unit/score-validation.test
 */

import {
  MAX_SCORE,
  GAME_SCORE_LIMITS,
  isValidScoreType,
  isValidScore,
  validateScore,
  assertValidScore,
  ScoreValidationError,
} from '../../src/lib/score-validation';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Score Validation Constants', () => {
  describe('MAX_SCORE', () => {
    it('should be defined', () => {
      expect(MAX_SCORE).toBeDefined();
    });

    it('should be a positive number', () => {
      expect(MAX_SCORE).toBeGreaterThan(0);
    });

    it('should be 999,999,999', () => {
      expect(MAX_SCORE).toBe(999_999_999);
    });
  });

  describe('GAME_SCORE_LIMITS', () => {
    it('should have limits for snake', () => {
      expect(GAME_SCORE_LIMITS.snake).toBeDefined();
      expect(GAME_SCORE_LIMITS.snake.min).toBe(0);
      expect(GAME_SCORE_LIMITS.snake.max).toBeGreaterThan(0);
    });

    it('should have limits for tetris', () => {
      expect(GAME_SCORE_LIMITS.tetris).toBeDefined();
      expect(GAME_SCORE_LIMITS.tetris.min).toBe(0);
      expect(GAME_SCORE_LIMITS.tetris.max).toBeGreaterThan(0);
    });

    it('should have limits for pong', () => {
      expect(GAME_SCORE_LIMITS.pong).toBeDefined();
      expect(GAME_SCORE_LIMITS.pong.min).toBe(0);
      expect(GAME_SCORE_LIMITS.pong.max).toBe(21);
    });

    it('should have default limits', () => {
      expect(GAME_SCORE_LIMITS.default).toBeDefined();
      expect(GAME_SCORE_LIMITS.default.max).toBe(MAX_SCORE);
    });
  });
});

// ============================================================================
// isValidScoreType Tests
// ============================================================================

describe('isValidScoreType', () => {
  describe('valid types', () => {
    it('should return true for positive integer', () => {
      expect(isValidScoreType(100)).toBe(true);
    });

    it('should return true for zero', () => {
      expect(isValidScoreType(0)).toBe(true);
    });

    it('should return true for decimal number', () => {
      expect(isValidScoreType(1.5)).toBe(true);
    });

    it('should return true for negative number', () => {
      expect(isValidScoreType(-5)).toBe(true);
    });
  });

  describe('invalid types', () => {
    it('should return false for string', () => {
      expect(isValidScoreType('100')).toBe(false);
    });

    it('should return false for numeric string', () => {
      expect(isValidScoreType('0')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidScoreType(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidScoreType(undefined)).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isValidScoreType(true)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isValidScoreType({ score: 100 })).toBe(false);
    });

    it('should return false for array', () => {
      expect(isValidScoreType([100])).toBe(false);
    });
  });
});

// ============================================================================
// isValidScore Tests
// ============================================================================

describe('isValidScore', () => {
  describe('valid scores', () => {
    it('should return true for zero', () => {
      expect(isValidScore(0)).toBe(true);
    });

    it('should return true for positive integer', () => {
      expect(isValidScore(100)).toBe(true);
    });

    it('should return true for large score', () => {
      expect(isValidScore(1_000_000)).toBe(true);
    });

    it('should return true for max score', () => {
      expect(isValidScore(MAX_SCORE)).toBe(true);
    });
  });

  describe('invalid scores', () => {
    it('should return false for negative score', () => {
      expect(isValidScore(-1)).toBe(false);
    });

    it('should return false for decimal score', () => {
      expect(isValidScore(1.5)).toBe(false);
    });

    it('should return false for NaN', () => {
      expect(isValidScore(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isValidScore(Infinity)).toBe(false);
    });

    it('should return false for -Infinity', () => {
      expect(isValidScore(-Infinity)).toBe(false);
    });

    it('should return false for score exceeding max', () => {
      expect(isValidScore(MAX_SCORE + 1)).toBe(false);
    });
  });
});

// ============================================================================
// validateScore Tests
// ============================================================================

describe('validateScore', () => {
  describe('valid scores', () => {
    it('should return valid for zero', () => {
      const result = validateScore(0);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(0);
    });

    it('should return valid for positive integer', () => {
      const result = validateScore(100);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should return valid for max score', () => {
      const result = validateScore(MAX_SCORE);
      expect(result.valid).toBe(true);
      expect(result.score).toBe(MAX_SCORE);
    });
  });

  describe('type validation', () => {
    it('should return INVALID_TYPE for string', () => {
      const result = validateScore('100');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_TYPE');
      expect(result.error).toContain('string');
    });

    it('should return INVALID_TYPE for null', () => {
      const result = validateScore(null);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_TYPE');
    });

    it('should return INVALID_TYPE for undefined', () => {
      const result = validateScore(undefined);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_TYPE');
    });

    it('should return INVALID_TYPE for object', () => {
      const result = validateScore({ score: 100 });
      expect(result.valid).toBe(false);
      expect(result.code).toBe('INVALID_TYPE');
    });
  });

  describe('number validation', () => {
    it('should return NOT_A_NUMBER for NaN', () => {
      const result = validateScore(NaN);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('NOT_A_NUMBER');
    });

    it('should return NOT_A_NUMBER for Infinity', () => {
      const result = validateScore(Infinity);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('NOT_A_NUMBER');
    });
  });

  describe('range validation', () => {
    it('should return NEGATIVE_SCORE for negative', () => {
      const result = validateScore(-1);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('NEGATIVE_SCORE');
    });

    it('should return NOT_INTEGER for decimal', () => {
      const result = validateScore(1.5);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('NOT_INTEGER');
    });

    it('should return EXCEEDS_MAXIMUM for score over max', () => {
      const result = validateScore(MAX_SCORE + 1);
      expect(result.valid).toBe(false);
      expect(result.code).toBe('EXCEEDS_MAXIMUM');
    });
  });

  describe('game-specific limits', () => {
    it('should validate against pong max (21)', () => {
      // Score of 25 is over pong limit of 21
      const result = validateScore(25, 'pong');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('EXCEEDS_MAXIMUM');
      expect(result.error).toContain('21');
    });

    it('should allow valid pong score', () => {
      const result = validateScore(11, 'pong');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(11);
    });

    it('should validate against snake max', () => {
      const result = validateScore(50000, 'snake');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(50000);
    });

    it('should reject over snake max', () => {
      const snakeMax = GAME_SCORE_LIMITS.snake.max;
      const result = validateScore(snakeMax + 1, 'snake');
      expect(result.valid).toBe(false);
      expect(result.code).toBe('EXCEEDS_MAXIMUM');
    });

    it('should use default limits for unknown game', () => {
      const result = validateScore(1000000, 'unknown-game');
      expect(result.valid).toBe(true);
      expect(result.score).toBe(1000000);
    });
  });
});

// ============================================================================
// assertValidScore Tests
// ============================================================================

describe('assertValidScore', () => {
  describe('valid scores', () => {
    it('should return the score for valid input', () => {
      expect(assertValidScore(100)).toBe(100);
    });

    it('should return zero for zero input', () => {
      expect(assertValidScore(0)).toBe(0);
    });

    it('should return the score for large valid input', () => {
      expect(assertValidScore(1000000)).toBe(1000000);
    });
  });

  describe('invalid scores', () => {
    it('should throw ScoreValidationError for string', () => {
      expect(() => assertValidScore('100')).toThrow(ScoreValidationError);
    });

    it('should throw ScoreValidationError for negative', () => {
      expect(() => assertValidScore(-5)).toThrow(ScoreValidationError);
    });

    it('should throw ScoreValidationError for decimal', () => {
      expect(() => assertValidScore(1.5)).toThrow(ScoreValidationError);
    });

    it('should throw ScoreValidationError for NaN', () => {
      expect(() => assertValidScore(NaN)).toThrow(ScoreValidationError);
    });

    it('should throw with correct error code', () => {
      try {
        assertValidScore('100');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ScoreValidationError);
        expect((error as ScoreValidationError).code).toBe('INVALID_TYPE');
      }
    });
  });

  describe('game-specific validation', () => {
    it('should throw for pong score over 21', () => {
      expect(() => assertValidScore(25, 'pong')).toThrow(ScoreValidationError);
    });

    it('should return score for valid pong score', () => {
      expect(assertValidScore(11, 'pong')).toBe(11);
    });
  });
});

// ============================================================================
// ScoreValidationError Tests
// ============================================================================

describe('ScoreValidationError', () => {
  it('should be an instance of Error', () => {
    const error = new ScoreValidationError('Test error', 'INVALID_TYPE', 'test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name "ScoreValidationError"', () => {
    const error = new ScoreValidationError('Test error', 'INVALID_TYPE', 'test');
    expect(error.name).toBe('ScoreValidationError');
  });

  it('should store the error code', () => {
    const error = new ScoreValidationError('Test error', 'NEGATIVE_SCORE', -5);
    expect(error.code).toBe('NEGATIVE_SCORE');
  });

  it('should store the invalid value', () => {
    const error = new ScoreValidationError('Test error', 'INVALID_TYPE', 'bad');
    expect(error.invalidValue).toBe('bad');
  });

  it('should have toJSON method', () => {
    const error = new ScoreValidationError('Test error', 'NOT_INTEGER', 1.5);
    const json = error.toJSON();

    expect(json.error).toBe('Test error');
    expect(json.code).toBe('NOT_INTEGER');
    expect(json.invalidValue).toBe(1.5);
  });
});
