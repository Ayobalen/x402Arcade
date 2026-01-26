/**
 * Game Types Index
 *
 * Central export point for all game-related types.
 * Import from here instead of individual files.
 *
 * @example
 * ```typescript
 * import type { IGame, GameMetadata, GameDifficulty } from '@/games/types';
 * ```
 */

// Core types
export type {
  GameId,
  GameDifficulty,
  GameState,
  PaymentStatus,
  KeyAction,
  GameSound,
  LeaderboardEntry,
  GameSession,
  PaymentData,
  GameControls,
  DifficultyConfig,
  PricingConfig,
  GameErrorCodeType,
} from './GameTypes';

export { GameError, GameErrorCode } from './GameTypes';

// Game interface
export type { IGame, GameFactory } from './IGame';

// Game metadata
export type { GameMetadata } from './GameMetadata';
export { isValidGameMetadata, createGameMetadata } from './GameMetadata';
