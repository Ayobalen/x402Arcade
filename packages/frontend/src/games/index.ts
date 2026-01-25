/**
 * Games Module
 *
 * This module exports all game-related types, utilities, and game implementations
 * for the x402 Arcade.
 */

// Types and interfaces
export {
  // Core interfaces
  type GameState,
  type GameConfig,
  type GameAction,
  type GameInput,
  type GameEvent,
  type GameEventListener,
  type GameRenderer,
  type GameEngine,

  // Type definitions
  type GameType,
  type GameDifficulty,
  type Direction,

  // Constants
  GAME_TYPES,
  DIFFICULTY_LEVELS,
  DIFFICULTY_INFO,

  // Factory functions
  createInitialGameState,
  createDefaultGameConfig,
  createEmptyInput,

  // Type guards
  isGameActive,
  canPause,
  canResume,
  canStart,

  // Difficulty utilities
  isValidDifficulty,
  getDifficultyModifiers,
} from './types';

// Engine types - extended game engine types
export * from './engine';

// Game registry for runtime game registration and management
export {
  gameRegistry,
  registerGame,
  getGame,
  getAvailableGames,
  isGameRegistered,
  GameRegistry,
  type RegisteredGame,
  type GameEngineFactory,
  type GameRendererFactory,
  type GameRegistryOptions,
} from './registry';

// Common game utilities (score, time, grid, random, math)
export * from './common';

// Lazy loading utilities for game engines
export {
  loadSnakeEngine,
  loadTetrisEngine,
  loadGameEngine,
  preloadGameEngine,
  preloadGameEngines,
  getGameLoadStatus,
  getGameLoadTime,
  isGameLoading,
  isGameLoaded,
  clearGameCache,
  getGameCacheStats,
  LazySnakeGame,
  LazyTetrisGame,
  type LazyGameResult,
  type LazyLoadStatus,
  type UseGameLoaderState,
} from './lazy';
