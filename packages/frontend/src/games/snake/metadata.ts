/**
 * Snake Game Metadata
 *
 * Game configuration metadata for the Snake game.
 * This metadata is used by the GameWrapper to provide payment flow,
 * session management, and UI elements.
 *
 * @module games/snake/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

/**
 * Snake game metadata
 *
 * Defines all configuration for the Snake game including:
 * - Game identification and display information
 * - Control scheme
 * - Difficulty options
 * - Pricing configuration
 * - Game settings and features
 */
export const snakeMetadata: GameMetadata = createGameMetadata({
  // ========================================
  // Identification
  // ========================================

  id: 'snake',
  name: 'snake',
  displayName: 'Classic Snake',

  // ========================================
  // Description & Icon
  // ========================================

  icon: '🐍',
  description: 'Eat food, grow longer, avoid walls and yourself',

  // ========================================
  // Control Scheme
  // ========================================

  controls: {
    primary: ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'],
    secondary: ['w', 'a', 's', 'd'],
    pause: ' ', // Spacebar
    restart: 'r',
  },

  // ========================================
  // Difficulty Configuration
  // ========================================

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard'],
  },

  // ========================================
  // Pricing
  // ========================================

  pricing: {
    baseCost: 0.01, // $0.01 USDC
    difficultyMultiplier: {
      easy: 0.5, // $0.005 USDC
      normal: 1.0, // $0.01 USDC
      hard: 2.0, // $0.02 USDC
      expert: 3.0, // Not available for Snake, but included for type safety
    },
  },

  // ========================================
  // Categories & Tags
  // ========================================

  tags: ['classic', 'arcade', 'single-player', 'high-score'],

  // ========================================
  // Player Configuration
  // ========================================

  minPlayers: 1,
  maxPlayers: 1,

  // ========================================
  // Game Duration
  // ========================================

  averageDuration: 180, // 3 minutes average game

  // ========================================
  // Input Methods
  // ========================================

  touchSupported: false, // Keyboard only for now
  mouseRequired: false, // Keyboard only

  // ========================================
  // Game Features
  // ========================================

  settings: {
    hasLives: false, // One life - hit wall = game over
    hasLevels: true, // Progressive difficulty with levels
    hasPowerUps: false, // No power-ups in classic mode
    isPvP: false, // Single player
    isEndless: true, // Play until game over
    hasTimeLimit: false, // No time limit
  },

  // ========================================
  // Tutorial Text
  // ========================================

  tutorial: `
**How to Play:**

Use arrow keys or WASD to control the snake's direction.

- Eat food (cyan squares) to grow longer and earn points
- Each food eaten increases your score by 10 points × level
- Every 100 points, you advance to the next level
- Each level increases the snake's speed

**Game Over Conditions:**

- Hitting the walls
- Running into your own body

**Difficulty Levels:**

- **Easy**: Slower speed, smaller grid, lower score multiplier
- **Normal**: Balanced speed and scoring
- **Hard**: Faster speed, larger grid, higher score multiplier

**Tips:**

- Plan your moves ahead - the snake moves constantly
- Use the edges strategically to create space
- Watch out for your tail as you grow longer
- Higher levels = higher scores but faster gameplay

Good luck!
  `.trim(),

  // ========================================
  // Version & Author
  // ========================================

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default snakeMetadata;
