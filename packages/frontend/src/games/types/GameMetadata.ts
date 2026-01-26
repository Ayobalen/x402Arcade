/**
 * Game Metadata
 *
 * Defines metadata for each game including name, description,
 * controls, difficulty options, and pricing.
 *
 * Each game must export a metadata object of this type.
 */

import type { GameId, GameControls, DifficultyConfig, PricingConfig } from './GameTypes';

/**
 * Complete metadata for a game
 * Describes everything the template needs to know about a game
 * without loading the game logic itself.
 *
 * @example
 * ```typescript
 * export const snakeMetadata: GameMetadata = {
 *   id: 'snake',
 *   name: 'Snake',
 *   displayName: 'Classic Snake',
 *   description: 'Eat food, grow longer, avoid walls and yourself',
 *   icon: '🐍',
 *   controls: {
 *     primary: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
 *     secondary: ['w', 'a', 's', 'd'],
 *     pause: ' ',
 *   },
 *   difficulty: {
 *     default: 'normal',
 *     available: ['easy', 'normal', 'hard'],
 *   },
 *   pricing: {
 *     baseCost: 0.01,
 *   },
 *   tags: ['classic', 'arcade', 'single-player'],
 *   minPlayers: 1,
 *   maxPlayers: 1,
 * };
 * ```
 */
export interface GameMetadata {
  /**
   * Unique game identifier
   * Must match the GameId type definition.
   */
  id: GameId;

  /**
   * Short name used in URLs and database
   * Should be lowercase, no spaces.
   * @example 'snake', 'pong', 'tetris'
   */
  name: string;

  /**
   * Display name shown to users
   * Can be more descriptive than 'name'.
   * @example 'Classic Snake', 'Retro Pong', 'Tetris Deluxe'
   */
  displayName: string;

  /**
   * Brief description of gameplay
   * Shown in game selection and game page.
   * Should be 1-2 sentences.
   */
  description: string;

  /**
   * Emoji or icon representing the game
   * Used in UI, cards, and navigation.
   * @example '🐍', '🏓', '🟦'
   */
  icon: string;

  /**
   * Control scheme configuration
   * Defines which keys control the game.
   */
  controls: GameControls;

  /**
   * Difficulty configuration
   * Defines available difficulty levels and default.
   */
  difficulty: DifficultyConfig;

  /**
   * Pricing configuration
   * Defines cost to play the game.
   */
  pricing: PricingConfig;

  /**
   * Optional: Category tags for filtering
   * Used for game discovery and categorization.
   * @example ['classic', 'arcade', 'single-player']
   */
  tags?: string[];

  /**
   * Optional: Minimum number of players
   * For future multiplayer support.
   * @default 1
   */
  minPlayers?: number;

  /**
   * Optional: Maximum number of players
   * For future multiplayer support.
   * @default 1
   */
  maxPlayers?: number;

  /**
   * Optional: Estimated game duration in seconds
   * Used for UI hints like "Average game: 3-5 minutes".
   */
  averageDuration?: number;

  /**
   * Optional: Whether game supports touch controls
   * @default false
   */
  touchSupported?: boolean;

  /**
   * Optional: Whether game requires mouse input
   * @default false
   */
  mouseRequired?: boolean;

  /**
   * Optional: Asset URLs for preview images, thumbnails, etc.
   */
  assets?: {
    thumbnail?: string;
    preview?: string;
    banner?: string;
  };

  /**
   * Optional: Game-specific settings
   * Can be used to configure game behavior.
   */
  settings?: {
    hasLives?: boolean; // Does game use lives system?
    hasLevels?: boolean; // Does game have level progression?
    hasPowerUps?: boolean; // Does game have power-ups?
    isPvP?: boolean; // Is game player vs player?
    isEndless?: boolean; // Does game run until game over?
    hasTimeLimit?: boolean; // Does game have time limit?
  };

  /**
   * Optional: Tutorial/how-to-play text
   * Shown in help overlay or instructions screen.
   */
  tutorial?: string;

  /**
   * Optional: Game version
   * For tracking game updates.
   * @example '1.0.0'
   */
  version?: string;

  /**
   * Optional: Author/developer info
   */
  author?: {
    name: string;
    url?: string;
  };
}

/**
 * Type guard to check if metadata is valid
 *
 * @param metadata - Object to check
 * @returns True if object is valid GameMetadata
 */
export function isValidGameMetadata(metadata: unknown): metadata is GameMetadata {
  if (!metadata || typeof metadata !== 'object') return false;

  const m = metadata as Partial<GameMetadata>;

  return Boolean(
    m.id &&
    m.name &&
    m.displayName &&
    m.description &&
    m.icon &&
    m.controls &&
    m.difficulty &&
    m.pricing
  );
}

/**
 * Helper to create game metadata with defaults
 * Ensures all required fields are present.
 *
 * @param metadata - Partial metadata object
 * @returns Complete metadata with defaults
 *
 * @example
 * ```typescript
 * const metadata = createGameMetadata({
 *   id: 'snake',
 *   name: 'snake',
 *   displayName: 'Classic Snake',
 *   description: 'Eat food and grow',
 *   icon: '🐍',
 *   // ... other required fields
 * });
 * ```
 */
export function createGameMetadata(metadata: GameMetadata): GameMetadata {
  return {
    ...metadata,
    minPlayers: metadata.minPlayers ?? 1,
    maxPlayers: metadata.maxPlayers ?? 1,
    touchSupported: metadata.touchSupported ?? false,
    mouseRequired: metadata.mouseRequired ?? false,
    tags: metadata.tags ?? [],
  };
}
