/**
 * Unit tests for game type validation module
 *
 * @module __tests__/unit/game-types.test
 */

import {
  GameType,
  GAME_TYPES,
  VALID_GAME_TYPES,
  isValidGameType,
  validateGameType,
  getGameTypeInfo,
  getPaymentAmount,
  getPaymentAmountUsdc,
  GameTypeValidationError,
} from '../../src/lib/game-types';

// ============================================================================
// Constants Tests
// ============================================================================

describe('Game Types Constants', () => {
  describe('GAME_TYPES', () => {
    it('should contain snake', () => {
      expect(GAME_TYPES.snake).toBeDefined();
      expect(GAME_TYPES.snake.id).toBe('snake');
    });

    it('should contain tetris', () => {
      expect(GAME_TYPES.tetris).toBeDefined();
      expect(GAME_TYPES.tetris.id).toBe('tetris');
    });

    it('should contain pong', () => {
      expect(GAME_TYPES.pong).toBeDefined();
      expect(GAME_TYPES.pong.id).toBe('pong');
    });

    it('should contain breakout', () => {
      expect(GAME_TYPES.breakout).toBeDefined();
      expect(GAME_TYPES.breakout.id).toBe('breakout');
    });

    it('should contain space-invaders', () => {
      expect(GAME_TYPES['space-invaders']).toBeDefined();
      expect(GAME_TYPES['space-invaders'].id).toBe('space-invaders');
    });

    it('should have 5 game types', () => {
      expect(Object.keys(GAME_TYPES)).toHaveLength(5);
    });

    it.each(Object.entries(GAME_TYPES))('%s should have required properties', (_, info) => {
      expect(info.id).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.description).toBeDefined();
      expect(info.priceUsdc).toBeDefined();
      expect(info.priceUnits).toBeDefined();
      expect(info.icon).toBeDefined();
    });
  });

  describe('VALID_GAME_TYPES', () => {
    it('should be an array', () => {
      expect(Array.isArray(VALID_GAME_TYPES)).toBe(true);
    });

    it('should contain all 5 game types', () => {
      expect(VALID_GAME_TYPES).toHaveLength(5);
    });

    it('should include snake', () => {
      expect(VALID_GAME_TYPES).toContain('snake');
    });

    it('should include tetris', () => {
      expect(VALID_GAME_TYPES).toContain('tetris');
    });

    it('should include space-invaders', () => {
      expect(VALID_GAME_TYPES).toContain('space-invaders');
    });
  });
});

// ============================================================================
// Validation Tests
// ============================================================================

describe('isValidGameType', () => {
  describe('valid game types', () => {
    it.each(VALID_GAME_TYPES)('should return true for "%s"', (gameType) => {
      expect(isValidGameType(gameType)).toBe(true);
    });
  });

  describe('invalid game types', () => {
    it('should return false for invalid string', () => {
      expect(isValidGameType('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidGameType('')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidGameType(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidGameType(undefined)).toBe(false);
    });

    it('should return false for number', () => {
      expect(isValidGameType(123)).toBe(false);
    });

    it('should return false for object', () => {
      expect(isValidGameType({ type: 'snake' })).toBe(false);
    });

    it('should return false for array', () => {
      expect(isValidGameType(['snake'])).toBe(false);
    });

    it('should return false for boolean', () => {
      expect(isValidGameType(true)).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isValidGameType('Snake')).toBe(false);
      expect(isValidGameType('SNAKE')).toBe(false);
    });
  });
});

describe('validateGameType', () => {
  describe('valid game types', () => {
    it.each(VALID_GAME_TYPES)('should return "%s" for valid input', (gameType) => {
      expect(validateGameType(gameType)).toBe(gameType);
    });
  });

  describe('invalid game types', () => {
    it('should throw GameTypeValidationError for invalid string', () => {
      expect(() => validateGameType('invalid')).toThrow(GameTypeValidationError);
    });

    it('should throw GameTypeValidationError for null', () => {
      expect(() => validateGameType(null)).toThrow(GameTypeValidationError);
    });

    it('should throw GameTypeValidationError for undefined', () => {
      expect(() => validateGameType(undefined)).toThrow(GameTypeValidationError);
    });

    it('should throw error with descriptive message', () => {
      try {
        validateGameType('invalid-game');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(GameTypeValidationError);
        expect((error as GameTypeValidationError).message).toContain('invalid-game');
        expect((error as GameTypeValidationError).message).toContain('snake');
      }
    });
  });
});

// ============================================================================
// Info Retrieval Tests
// ============================================================================

describe('getGameTypeInfo', () => {
  describe('valid game types', () => {
    it('should return info for snake', () => {
      const info = getGameTypeInfo('snake');
      expect(info.id).toBe('snake');
      expect(info.name).toBe('Snake');
      expect(info.priceUsdc).toBe(0.01);
      expect(info.priceUnits).toBe(10000n);
    });

    it('should return info for tetris', () => {
      const info = getGameTypeInfo('tetris');
      expect(info.id).toBe('tetris');
      expect(info.priceUsdc).toBe(0.02);
      expect(info.priceUnits).toBe(20000n);
    });

    it('should return info for space-invaders', () => {
      const info = getGameTypeInfo('space-invaders');
      expect(info.id).toBe('space-invaders');
      expect(info.name).toBe('Space Invaders');
    });
  });

  describe('invalid game types', () => {
    it('should throw for invalid game type', () => {
      expect(() => getGameTypeInfo('invalid')).toThrow(GameTypeValidationError);
    });
  });
});

describe('getPaymentAmount', () => {
  it('should return 10000n for snake ($0.01)', () => {
    expect(getPaymentAmount('snake')).toBe(10000n);
  });

  it('should return 20000n for tetris ($0.02)', () => {
    expect(getPaymentAmount('tetris')).toBe(20000n);
  });

  it('should return 10000n for pong ($0.01)', () => {
    expect(getPaymentAmount('pong')).toBe(10000n);
  });

  it('should return 10000n for breakout ($0.01)', () => {
    expect(getPaymentAmount('breakout')).toBe(10000n);
  });

  it('should return 20000n for space-invaders ($0.02)', () => {
    expect(getPaymentAmount('space-invaders')).toBe(20000n);
  });

  it('should throw for invalid game type', () => {
    expect(() => getPaymentAmount('invalid')).toThrow(GameTypeValidationError);
  });
});

describe('getPaymentAmountUsdc', () => {
  it('should return 0.01 for snake', () => {
    expect(getPaymentAmountUsdc('snake')).toBe(0.01);
  });

  it('should return 0.02 for tetris', () => {
    expect(getPaymentAmountUsdc('tetris')).toBe(0.02);
  });

  it('should return 0.01 for pong', () => {
    expect(getPaymentAmountUsdc('pong')).toBe(0.01);
  });

  it('should throw for invalid game type', () => {
    expect(() => getPaymentAmountUsdc('invalid')).toThrow(GameTypeValidationError);
  });
});

// ============================================================================
// Error Class Tests
// ============================================================================

describe('GameTypeValidationError', () => {
  it('should be an instance of Error', () => {
    const error = new GameTypeValidationError('invalid');
    expect(error).toBeInstanceOf(Error);
  });

  it('should have name "GameTypeValidationError"', () => {
    const error = new GameTypeValidationError('invalid');
    expect(error.name).toBe('GameTypeValidationError');
  });

  it('should include invalid value in message', () => {
    const error = new GameTypeValidationError('my-invalid-game');
    expect(error.message).toContain('my-invalid-game');
  });

  it('should include valid game types in message', () => {
    const error = new GameTypeValidationError('invalid');
    expect(error.message).toContain('snake');
    expect(error.message).toContain('tetris');
  });

  it('should store invalid value', () => {
    const error = new GameTypeValidationError('invalid');
    expect(error.invalidValue).toBe('invalid');
  });

  it('should store valid game types', () => {
    const error = new GameTypeValidationError('invalid');
    expect(error.validGameTypes).toContain('snake');
    expect(error.validGameTypes).toContain('tetris');
  });

  it('should handle null value', () => {
    const error = new GameTypeValidationError(null);
    expect(error.message).toContain('null');
    expect(error.invalidValue).toBe(null);
  });

  it('should handle undefined value', () => {
    const error = new GameTypeValidationError(undefined);
    expect(error.message).toContain('undefined');
    expect(error.invalidValue).toBe(undefined);
  });

  it('should have toJSON method', () => {
    const error = new GameTypeValidationError('invalid');
    const json = error.toJSON();

    expect(json.error).toContain('Invalid game type');
    expect(json.code).toBe('INVALID_GAME_TYPE');
    expect(json.invalidValue).toBe('invalid');
    expect(json.validGameTypes).toContain('snake');
  });
});
