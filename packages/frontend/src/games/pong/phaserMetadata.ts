/**
 * Pong Phaser Game Metadata
 *
 * Phaser 3 version of Pong - demonstrates library-based implementation.
 *
 * @module games/pong/phaserMetadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const pongPhaserMetadata: GameMetadata = createGameMetadata({
  id: 'pong-phaser',
  name: 'pong-phaser',
  displayName: 'Pong (Phaser)',
  icon: '<®',
  description: 'Phaser 3 version of classic Pong. Demonstrates library-based implementation.',

  controls: {
    primary: ['Mouse'],
    secondary: ['ArrowUp', 'ArrowDown'],
    pause: 'Esc',
  },

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard', 'expert'],
  },

  pricing: {
    baseCost: 0.01,
    difficultyMultiplier: {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      expert: 2.0,
    },
  },

  tags: ['classic', 'arcade', 'pong', 'phaser', 'library-demo'],
  averageDuration: 240, // 4 minutes

  settings: {
    hasLives: false,
    hasLevels: false,
    hasPowerUps: false,
    isPvP: false, // PvE (Player vs AI)
    isEndless: false,
    hasTimeLimit: false,
  },

  tutorial: `
**How to Play:**

Control your paddle using the mouse or arrow keys to hit the ball back to your opponent.

**Rules:**
- First to 11 points wins
- Ball speeds up slightly after each hit
- Missing the ball gives opponent a point

**Controls:**
- **Mouse** - Move paddle vertically
- **‘/“** - Move paddle up/down
- **Esc** - Pause game

**Difficulty Levels:**
- **Easy**: Slow AI with 400ms reaction delay
- **Normal**: Balanced AI with 200ms delay
- **Hard**: Fast AI with 100ms delay
- **Expert**: Lightning-fast AI with 50ms delay

**Phaser 3 Implementation:**
This version uses the Phaser 3 game framework, demonstrating how to integrate professional game libraries with the x402 Arcade payment system.

Beat the AI and climb the leaderboard!
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default pongPhaserMetadata;
