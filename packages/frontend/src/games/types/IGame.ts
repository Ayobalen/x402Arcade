/**
 * IGame Interface
 *
 * Contract that all game implementations must follow.
 * This interface defines the required methods and callbacks for games
 * to work with the GameTemplate system.
 *
 * Every game (Snake, Pong, Tetris, etc.) must implement this interface.
 */

import type { GameDifficulty, GameState, KeyAction } from './GameTypes';

/**
 * Game interface that all games must implement
 *
 * @example
 * ```typescript
 * class SnakeGame implements IGame {
 *   private canvas: HTMLCanvasElement;
 *   private score = 0;
 *   private gameState: GameState = 'idle';
 *
 *   initialize(canvas: HTMLCanvasElement, difficulty: GameDifficulty) {
 *     this.canvas = canvas;
 *     this.difficulty = difficulty;
 *     // Setup game objects, load assets, etc.
 *   }
 *
 *   start() {
 *     this.gameState = 'playing';
 *     this.gameLoop();
 *   }
 *
 *   // ... implement other methods
 * }
 * ```
 */
export interface IGame {
  /**
   * Initialize the game
   * Called once when the game is first created, before rendering starts.
   *
   * @param canvas - The canvas element to render the game on
   * @param difficulty - The difficulty level selected by the user
   *
   * @remarks
   * Use this to set up your game state, load assets, configure
   * physics, etc. Don't start the game loop here - that happens in start().
   */
  initialize(canvas: HTMLCanvasElement, difficulty: GameDifficulty): void;

  /**
   * Start the game
   * Begins the game loop and allows user input.
   * Called after successful payment when user clicks "Start Game".
   */
  start(): void;

  /**
   * Pause the game
   * Stops the game loop but maintains state.
   * User can resume later without losing progress.
   */
  pause(): void;

  /**
   * Resume the game
   * Continues the game loop after being paused.
   */
  resume(): void;

  /**
   * Reset the game
   * Returns to initial state, clears score, resets positions.
   * Used for "Play Again" functionality.
   */
  reset(): void;

  /**
   * Handle keyboard/touch input
   * Called by the template when user presses/releases keys.
   *
   * @param key - The key that was pressed (e.g., 'ArrowUp', 'w', ' ')
   * @param action - Whether key was pressed ('down') or released ('up')
   *
   * @example
   * ```typescript
   * handleInput(key: string, action: 'down' | 'up') {
   *   if (action === 'down') {
   *     if (key === 'ArrowUp') this.direction = 'up';
   *     if (key === 'ArrowDown') this.direction = 'down';
   *   }
   * }
   * ```
   */
  handleInput(key: string, action: KeyAction): void;

  /**
   * Get current score
   * Called by the template to display score in HUD.
   *
   * @returns Current score value
   */
  getCurrentScore(): number;

  /**
   * Get current game state
   * Called by the template to determine what UI to show.
   *
   * @returns Current state: 'idle', 'playing', 'paused', or 'over'
   */
  getGameState(): GameState;

  /**
   * Get current level
   * Optional - return 1 if your game doesn't have levels.
   *
   * @returns Current level number (1-indexed)
   */
  getLevel(): number;

  /**
   * Cleanup resources
   * Called when game is unmounted or user leaves the page.
   * Use this to stop animation loops, clear intervals, etc.
   */
  destroy(): void;

  // ============================================
  // OPTIONAL CALLBACKS
  // ============================================

  /**
   * Called whenever the score changes
   * Optional callback to notify template of score updates.
   *
   * @param score - New score value
   *
   * @remarks
   * Set this callback in your initialize() method:
   * ```typescript
   * initialize(canvas, difficulty) {
   *   this.onScoreChange = (score) => {
   *     // Template will update HUD automatically
   *   };
   * }
   * ```
   */
  onScoreChange?: (score: number) => void;

  /**
   * Called when the game ends
   * Optional callback to notify template of game over.
   *
   * @param finalScore - Final score achieved
   *
   * @remarks
   * Call this when your game ends:
   * ```typescript
   * private endGame() {
   *   this.gameState = 'over';
   *   if (this.onGameOver) {
   *     this.onGameOver(this.score);
   *   }
   * }
   * ```
   */
  onGameOver?: (finalScore: number) => void;

  /**
   * Called when player levels up
   * Optional callback for games with level progression.
   *
   * @param level - New level number
   */
  onLevelUp?: (level: number) => void;

  /**
   * Called when player loses a life
   * Optional callback for games with lives system.
   *
   * @param livesRemaining - Number of lives left
   */
  onLifeLost?: (livesRemaining: number) => void;

  /**
   * Called when player gains a life
   * Optional callback for games with lives system.
   *
   * @param livesRemaining - Number of lives now
   */
  onLifeGained?: (livesRemaining: number) => void;

  /**
   * Called on every game tick/frame
   * Optional callback for external systems that need to sync with game loop.
   *
   * @param deltaTime - Time since last frame in milliseconds
   */
  onTick?: (deltaTime: number) => void;
}

/**
 * Factory function type for creating game instances
 * Used by GameTemplate to instantiate games.
 *
 * @param canvas - Canvas element to render on
 * @returns New game instance implementing IGame
 *
 * @example
 * ```typescript
 * const snakeFactory: GameFactory = (canvas) => new SnakeGame(canvas);
 * ```
 */
export type GameFactory = (canvas: HTMLCanvasElement) => IGame;
