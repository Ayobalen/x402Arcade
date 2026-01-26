/**
 * Game Type Validation
 *
 * Defines and validates game types for the x402 Arcade backend.
 * This module ensures game type parameters are validated before payment processing.
 *
 * @module lib/game-types
 */

// ============================================================================
// Game Type Definition
// ============================================================================

/**
 * Supported game types in the arcade
 *
 * @description Union type of all valid game identifiers.
 * Each game type has an associated price and metadata.
 */
export type GameType = 'snake' | 'tetris' | 'pong' | 'pong-phaser' | 'breakout' | 'space-invaders';

/**
 * Game type metadata interface
 */
export interface GameTypeInfo {
  /** Unique game identifier */
  id: GameType;
  /** Display name for the game */
  name: string;
  /** Game description */
  description: string;
  /** Price to play in USDC (human-readable, e.g., 0.01) */
  priceUsdc: number;
  /** Price to play in smallest units (e.g., 10000 for $0.01 USDC) */
  priceUnits: bigint;
  /** Icon/emoji for the game */
  icon: string;
}

// ============================================================================
// Game Types Registry
// ============================================================================

/**
 * Registry of all supported game types with their metadata
 *
 * @description Contains pricing and display information for each game.
 * Prices are defined in both human-readable USDC and smallest units.
 */
export const GAME_TYPES: Record<GameType, GameTypeInfo> = {
  snake: {
    id: 'snake',
    name: 'Snake',
    description: 'Guide the snake to eat food and grow longer without hitting walls or yourself.',
    priceUsdc: 0.01,
    priceUnits: 10000n, // $0.01 in USDC smallest units (6 decimals)
    icon: '🐍',
  },
  tetris: {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack falling blocks to complete lines and score points.',
    priceUsdc: 0.02,
    priceUnits: 20000n, // $0.02 in USDC smallest units
    icon: '🧱',
  },
  pong: {
    id: 'pong',
    name: 'Pong',
    description: 'Classic paddle game. First to 11 points wins!',
    priceUsdc: 0.01,
    priceUnits: 10000n,
    icon: '🏓',
  },
  breakout: {
    id: 'breakout',
    name: 'Breakout',
    description: 'Break all the bricks by bouncing the ball with your paddle.',
    priceUsdc: 0.01,
    priceUnits: 10000n,
    icon: '🧱',
  },
  'space-invaders': {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'Defend Earth from waves of alien invaders.',
    priceUsdc: 0.02,
    priceUnits: 20000n,
    icon: '👾',
  },
  'pong-phaser': {
    id: 'pong-phaser',
    name: 'Pong (Phaser)',
    description: 'Phaser 3 version of classic Pong. Demonstrates library-based implementation.',
    priceUsdc: 0.01,
    priceUnits: 10000n,
    icon: '🎮',
  },
};

/**
 * Array of all valid game type identifiers
 */
export const VALID_GAME_TYPES: readonly GameType[] = Object.keys(GAME_TYPES) as GameType[];

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a value is a valid game type
 *
 * @param value - The value to check
 * @returns true if the value is a valid GameType
 *
 * @example
 * ```typescript
 * isValidGameType('snake')     // => true
 * isValidGameType('tetris')    // => true
 * isValidGameType('invalid')   // => false
 * isValidGameType(null)        // => false
 * ```
 */
export function isValidGameType(value: unknown): value is GameType {
  return typeof value === 'string' && value in GAME_TYPES;
}

/**
 * Validate game type and throw error if invalid
 *
 * @param value - The value to validate
 * @throws {GameTypeValidationError} If the game type is invalid
 * @returns The validated game type
 *
 * @example
 * ```typescript
 * const gameType = validateGameType('snake');  // => 'snake'
 * validateGameType('invalid');  // throws GameTypeValidationError
 * ```
 */
export function validateGameType(value: unknown): GameType {
  if (!isValidGameType(value)) {
    throw new GameTypeValidationError(value);
  }
  return value;
}

/**
 * Get game info for a game type
 *
 * @param gameType - The game type to look up
 * @returns Game type information including price
 * @throws {GameTypeValidationError} If the game type is invalid
 *
 * @example
 * ```typescript
 * const info = getGameTypeInfo('snake');
 * console.log(info.priceUsdc);  // 0.01
 * console.log(info.priceUnits); // 10000n
 * ```
 */
export function getGameTypeInfo(gameType: unknown): GameTypeInfo {
  const validated = validateGameType(gameType);
  return GAME_TYPES[validated];
}

/**
 * Get payment amount for a game type in smallest units
 *
 * @param gameType - The game type
 * @returns Payment amount in token's smallest units (bigint)
 * @throws {GameTypeValidationError} If the game type is invalid
 *
 * @example
 * ```typescript
 * getPaymentAmount('snake')     // => 10000n ($0.01)
 * getPaymentAmount('tetris')    // => 20000n ($0.02)
 * ```
 */
export function getPaymentAmount(gameType: unknown): bigint {
  return getGameTypeInfo(gameType).priceUnits;
}

/**
 * Get payment amount for a game type in human-readable USDC
 *
 * @param gameType - The game type
 * @returns Payment amount in USDC (number)
 * @throws {GameTypeValidationError} If the game type is invalid
 *
 * @example
 * ```typescript
 * getPaymentAmountUsdc('snake')   // => 0.01
 * getPaymentAmountUsdc('tetris')  // => 0.02
 * ```
 */
export function getPaymentAmountUsdc(gameType: unknown): number {
  return getGameTypeInfo(gameType).priceUsdc;
}

// ============================================================================
// Error Class
// ============================================================================

/**
 * Error thrown when game type validation fails
 */
export class GameTypeValidationError extends Error {
  /** The invalid value that was provided */
  readonly invalidValue: unknown;

  /** List of valid game types */
  readonly validGameTypes: readonly string[];

  /**
   * Create a new GameTypeValidationError
   *
   * @param invalidValue - The invalid value that was provided
   */
  constructor(invalidValue: unknown) {
    const valueStr =
      invalidValue === null
        ? 'null'
        : invalidValue === undefined
          ? 'undefined'
          : JSON.stringify(invalidValue);

    const validList = VALID_GAME_TYPES.map((t) => `'${t}'`).join(', ');

    super(`Invalid game type: ${valueStr}. ` + `Valid game types are: ${validList}`);

    this.name = 'GameTypeValidationError';
    this.invalidValue = invalidValue;
    this.validGameTypes = VALID_GAME_TYPES;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GameTypeValidationError);
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON(): {
    error: string;
    code: string;
    invalidValue: unknown;
    validGameTypes: readonly string[];
  } {
    return {
      error: this.message,
      code: 'INVALID_GAME_TYPE',
      invalidValue: this.invalidValue,
      validGameTypes: this.validGameTypes,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  GAME_TYPES,
  VALID_GAME_TYPES,
  isValidGameType,
  validateGameType,
  getGameTypeInfo,
  getPaymentAmount,
  getPaymentAmountUsdc,
  GameTypeValidationError,
};
