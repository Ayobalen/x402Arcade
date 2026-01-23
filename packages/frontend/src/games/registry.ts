/**
 * Game Registry Module
 *
 * Central registry for all games in the x402 Arcade.
 * Provides runtime registration, lookup, and management of game implementations.
 *
 * @module games/registry
 */

import {
  GameType,
  GameConfig,
  GameEngine,
  GameRenderer,
  GameState,
  GAME_TYPES,
} from './types'

// ============================================================================
// Types
// ============================================================================

/**
 * Factory function to create a game engine instance
 */
export type GameEngineFactory<
  TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
  TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
  TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
> = (config: GameConfig<TGameSpecificConfig>) => GameEngine<TGameSpecific, TGameSpecificConfig, TState>

/**
 * Factory function to create a game renderer instance
 */
export type GameRendererFactory<
  TState extends GameState = GameState,
  TGameSpecificConfig = Record<string, unknown>
> = () => GameRenderer<TState, TGameSpecificConfig>

/**
 * Registered game entry containing all necessary factories and metadata
 */
export interface RegisteredGame<
  TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
  TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
  TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
> {
  /** Unique game type identifier */
  type: GameType
  /** Display name for the game */
  name: string
  /** Game description */
  description: string
  /** Cost to play in USDC */
  priceUsdc: number
  /** Icon for the game (emoji or icon name) */
  icon: string
  /** Factory to create game engine */
  createEngine: GameEngineFactory<TGameSpecific, TGameSpecificConfig, TState>
  /** Factory to create game renderer */
  createRenderer: GameRendererFactory<TState, TGameSpecificConfig>
  /** Default configuration overrides */
  defaultConfig?: Partial<GameConfig<TGameSpecificConfig>>
  /** Whether the game is currently available (not under maintenance) */
  isAvailable: boolean
  /** Minimum players (default 1) */
  minPlayers?: number
  /** Maximum players (default 1) */
  maxPlayers?: number
  /** Tags for filtering/searching */
  tags?: string[]
}

/**
 * Registry options
 */
export interface GameRegistryOptions {
  /** Whether to throw on duplicate registration */
  throwOnDuplicate?: boolean
  /** Whether to log registrations */
  verbose?: boolean
}

// ============================================================================
// Game Registry
// ============================================================================

/**
 * Central game registry for managing game implementations
 */
class GameRegistry {
  private games: Map<GameType, RegisteredGame> = new Map()
  private options: GameRegistryOptions

  constructor(options: GameRegistryOptions = {}) {
    this.options = {
      throwOnDuplicate: true,
      verbose: false,
      ...options,
    }
  }

  /**
   * Register a new game in the registry
   */
  register<
    TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
    TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
    TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
  >(game: RegisteredGame<TGameSpecific, TGameSpecificConfig, TState>): void {
    if (this.games.has(game.type)) {
      if (this.options.throwOnDuplicate) {
        throw new Error(`Game "${game.type}" is already registered`)
      }
      if (this.options.verbose) {
        console.warn(`Game "${game.type}" is being re-registered`)
      }
    }

    this.games.set(game.type, game as unknown as RegisteredGame)

    if (this.options.verbose) {
      console.log(`Registered game: ${game.name} (${game.type})`)
    }
  }

  /**
   * Unregister a game from the registry
   */
  unregister(type: GameType): boolean {
    const removed = this.games.delete(type)
    if (this.options.verbose && removed) {
      console.log(`Unregistered game: ${type}`)
    }
    return removed
  }

  /**
   * Get a registered game by type
   */
  get<
    TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
    TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
    TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
  >(type: GameType): RegisteredGame<TGameSpecific, TGameSpecificConfig, TState> | undefined {
    return this.games.get(type) as RegisteredGame<TGameSpecific, TGameSpecificConfig, TState> | undefined
  }

  /**
   * Check if a game type is registered
   */
  has(type: GameType): boolean {
    return this.games.has(type)
  }

  /**
   * Get all registered games
   */
  getAll(): RegisteredGame[] {
    return Array.from(this.games.values())
  }

  /**
   * Get all available games (not under maintenance)
   */
  getAvailable(): RegisteredGame[] {
    return this.getAll().filter((game) => game.isAvailable)
  }

  /**
   * Get games by tag
   */
  getByTag(tag: string): RegisteredGame[] {
    return this.getAll().filter((game) => game.tags?.includes(tag))
  }

  /**
   * Get game count
   */
  get count(): number {
    return this.games.size
  }

  /**
   * Get available game count
   */
  get availableCount(): number {
    return this.getAvailable().length
  }

  /**
   * Clear all registered games
   */
  clear(): void {
    this.games.clear()
    if (this.options.verbose) {
      console.log('Game registry cleared')
    }
  }

  /**
   * Create a game engine instance for a given game type
   */
  createEngine<
    TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
    TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
    TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
  >(
    type: GameType,
    config: GameConfig<TGameSpecificConfig>
  ): GameEngine<TGameSpecific, TGameSpecificConfig, TState> {
    const game = this.get<TGameSpecific, TGameSpecificConfig, TState>(type)
    if (!game) {
      throw new Error(`Game "${type}" is not registered`)
    }
    if (!game.isAvailable) {
      throw new Error(`Game "${type}" is currently unavailable`)
    }
    return game.createEngine(config)
  }

  /**
   * Create a game renderer instance for a given game type
   */
  createRenderer<
    TState extends GameState = GameState,
    TGameSpecificConfig = Record<string, unknown>
  >(type: GameType): GameRenderer<TState, TGameSpecificConfig> {
    const game = this.get(type)
    if (!game) {
      throw new Error(`Game "${type}" is not registered`)
    }
    return game.createRenderer() as GameRenderer<TState, TGameSpecificConfig>
  }

  /**
   * Get game metadata (from GAME_TYPES) for a registered game
   */
  getMetadata(type: GameType) {
    if (!this.has(type)) {
      return undefined
    }
    return GAME_TYPES[type]
  }
}

// ============================================================================
// Global Registry Instance
// ============================================================================

/**
 * Global game registry instance
 */
export const gameRegistry = new GameRegistry({
  throwOnDuplicate: true,
  verbose: process.env.NODE_ENV === 'development',
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Register a game in the global registry
 */
export function registerGame<
  TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
  TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
  TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
>(game: RegisteredGame<TGameSpecific, TGameSpecificConfig, TState>): void {
  gameRegistry.register(game)
}

/**
 * Get a game from the global registry
 */
export function getGame<
  TGameSpecific extends Record<string, unknown> = Record<string, unknown>,
  TGameSpecificConfig extends Record<string, unknown> = Record<string, unknown>,
  TState extends GameState<TGameSpecific> = GameState<TGameSpecific>
>(type: GameType): RegisteredGame<TGameSpecific, TGameSpecificConfig, TState> | undefined {
  return gameRegistry.get(type)
}

/**
 * Get all available games from the global registry
 */
export function getAvailableGames(): RegisteredGame[] {
  return gameRegistry.getAvailable()
}

/**
 * Check if a game type is registered
 */
export function isGameRegistered(type: GameType): boolean {
  return gameRegistry.has(type)
}

// ============================================================================
// Exports
// ============================================================================

export { GameRegistry }
export default gameRegistry
