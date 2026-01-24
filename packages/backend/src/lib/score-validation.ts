/**
 * Score Validation
 *
 * Validates game score values before submission to ensure data integrity.
 * Provides type checking, range validation, and clear error messages.
 *
 * @module lib/score-validation
 */

// ============================================================================
// Constants
// ============================================================================

/**
 * Maximum reasonable score for any game.
 * This is a safety limit to prevent data corruption or abuse.
 * Individual games can have lower per-game limits.
 */
export const MAX_SCORE = 999_999_999;

/**
 * Score limits by game type.
 * These represent reasonable maximum scores based on game mechanics.
 */
export const GAME_SCORE_LIMITS: Record<string, { min: number; max: number }> = {
  snake: { min: 0, max: 100_000 },
  tetris: { min: 0, max: 10_000_000 },
  pong: { min: 0, max: 21 }, // Typically 11 to win, max 21 for extended play
  breakout: { min: 0, max: 1_000_000 },
  'space-invaders': { min: 0, max: 1_000_000 },
  // Fallback for unknown games
  default: { min: 0, max: MAX_SCORE },
};

// ============================================================================
// Types
// ============================================================================

/**
 * Result of score validation
 */
export interface ScoreValidationResult {
  /** Whether the score is valid */
  valid: boolean;
  /** Validation error message if invalid */
  error?: string;
  /** Error code for programmatic handling */
  code?: ScoreValidationErrorCode;
  /** The validated score (only set if valid) */
  score?: number;
}

/**
 * Score validation error codes
 */
export type ScoreValidationErrorCode =
  | 'INVALID_TYPE'
  | 'NOT_A_NUMBER'
  | 'NEGATIVE_SCORE'
  | 'NOT_INTEGER'
  | 'EXCEEDS_MAXIMUM'
  | 'BELOW_MINIMUM';

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a value is a valid score type
 *
 * @param value - The value to check
 * @returns true if the value is a number (not string, null, undefined, etc.)
 *
 * @example
 * ```typescript
 * isValidScoreType(100)       // => true
 * isValidScoreType(0)         // => true
 * isValidScoreType('100')     // => false
 * isValidScoreType(null)      // => false
 * isValidScoreType(undefined) // => false
 * ```
 */
export function isValidScoreType(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Check if a number is a valid score value
 *
 * A valid score must be:
 * - A finite number (not NaN, Infinity)
 * - A non-negative integer
 * - Within the maximum score limit
 *
 * @param score - The score to validate
 * @returns true if the score is valid
 *
 * @example
 * ```typescript
 * isValidScore(100)      // => true
 * isValidScore(0)        // => true
 * isValidScore(-1)       // => false
 * isValidScore(1.5)      // => false
 * isValidScore(NaN)      // => false
 * isValidScore(Infinity) // => false
 * ```
 */
export function isValidScore(score: number): boolean {
  return (
    Number.isFinite(score) &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= MAX_SCORE
  );
}

/**
 * Validate a score value with detailed result
 *
 * Performs comprehensive validation and returns detailed information
 * about why validation failed (if applicable).
 *
 * @param value - The value to validate as a score
 * @param gameType - Optional game type for game-specific limits
 * @returns Validation result with error details if invalid
 *
 * @example
 * ```typescript
 * // Valid score
 * validateScore(100)
 * // => { valid: true, score: 100 }
 *
 * // Invalid type
 * validateScore('100')
 * // => { valid: false, error: '...', code: 'INVALID_TYPE' }
 *
 * // Game-specific validation
 * validateScore(100, 'pong')
 * // => { valid: false, error: '...', code: 'EXCEEDS_MAXIMUM' } (pong max is 21)
 * ```
 */
export function validateScore(
  value: unknown,
  gameType?: string
): ScoreValidationResult {
  // Step 1: Type validation
  if (!isValidScoreType(value)) {
    return {
      valid: false,
      error: `Score must be a number, got ${typeof value}`,
      code: 'INVALID_TYPE',
    };
  }

  // Step 2: NaN/Infinity check
  if (!Number.isFinite(value)) {
    return {
      valid: false,
      error: `Score must be a finite number, got ${value}`,
      code: 'NOT_A_NUMBER',
    };
  }

  // Step 3: Non-negative check
  if (value < 0) {
    return {
      valid: false,
      error: `Score must be non-negative, got ${value}`,
      code: 'NEGATIVE_SCORE',
    };
  }

  // Step 4: Integer check
  if (!Number.isInteger(value)) {
    return {
      valid: false,
      error: `Score must be an integer, got ${value}`,
      code: 'NOT_INTEGER',
    };
  }

  // Step 5: Get limits for game type
  const limits = gameType ? (GAME_SCORE_LIMITS[gameType] || GAME_SCORE_LIMITS.default) : GAME_SCORE_LIMITS.default;

  // Step 6: Minimum check (should always be 0, but for completeness)
  if (value < limits.min) {
    return {
      valid: false,
      error: `Score ${value} is below minimum ${limits.min} for ${gameType || 'game'}`,
      code: 'BELOW_MINIMUM',
    };
  }

  // Step 7: Maximum check
  if (value > limits.max) {
    return {
      valid: false,
      error: `Score ${value} exceeds maximum ${limits.max} for ${gameType || 'game'}`,
      code: 'EXCEEDS_MAXIMUM',
    };
  }

  // Valid!
  return {
    valid: true,
    score: value,
  };
}

/**
 * Validate and return the score, throwing on invalid
 *
 * Convenience function that throws a ScoreValidationError
 * if the score is invalid, otherwise returns the validated score.
 *
 * @param value - The value to validate as a score
 * @param gameType - Optional game type for game-specific limits
 * @returns The validated score
 * @throws {ScoreValidationError} If the score is invalid
 *
 * @example
 * ```typescript
 * // Valid score
 * const score = assertValidScore(100);  // => 100
 *
 * // Invalid score throws
 * assertValidScore(-5);  // throws ScoreValidationError
 * ```
 */
export function assertValidScore(value: unknown, gameType?: string): number {
  const result = validateScore(value, gameType);
  if (!result.valid) {
    throw new ScoreValidationError(
      result.error || 'Invalid score',
      result.code || 'INVALID_TYPE',
      value
    );
  }
  return result.score!;
}

// ============================================================================
// Error Class
// ============================================================================

/**
 * Error thrown when score validation fails
 */
export class ScoreValidationError extends Error {
  /** Error code for programmatic handling */
  readonly code: ScoreValidationErrorCode;

  /** The invalid value that was provided */
  readonly invalidValue: unknown;

  /**
   * Create a new ScoreValidationError
   *
   * @param message - Error message
   * @param code - Error code
   * @param invalidValue - The invalid value that was provided
   */
  constructor(
    message: string,
    code: ScoreValidationErrorCode,
    invalidValue: unknown
  ) {
    super(message);
    this.name = 'ScoreValidationError';
    this.code = code;
    this.invalidValue = invalidValue;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ScoreValidationError);
    }
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON(): {
    error: string;
    code: ScoreValidationErrorCode;
    invalidValue: unknown;
  } {
    return {
      error: this.message,
      code: this.code,
      invalidValue: this.invalidValue,
    };
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  MAX_SCORE,
  GAME_SCORE_LIMITS,
  isValidScoreType,
  isValidScore,
  validateScore,
  assertValidScore,
  ScoreValidationError,
};
