/**
 * Pong Game Metadata
 *
 * Classic arcade Pong configuration for GameWrapper system.
 *
 * @module games/pong/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const pongMetadata: GameMetadata = createGameMetadata({
  id: 'pong',
  name: 'pong',
  displayName: 'Retro Pong',
  icon: '🏓',
  description: 'Classic arcade pong. Keep the ball in play and beat the AI opponent',

  controls: {
    primary: ['ArrowUp', 'ArrowDown'],
    secondary: ['w', 's'],
    pause: ' ',
  },

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard'],
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

  tags: ['classic', 'arcade', 'pong', 'vs-ai'],
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

Control your paddle using arrow keys or WS to hit the ball back to your opponent.

**Rules:**
- First to 11 points wins
- Ball speeds up after each hit
- Missing the ball gives opponent a point

**Controls:**
- **↑/W** - Move paddle up
- **↓/S** - Move paddle down
- **Space** - Pause game

**Difficulty:**
- **Easy**: Slower AI, larger paddle
- **Normal**: Balanced gameplay
- **Hard**: Fast AI, smaller paddle

Beat the AI and climb the leaderboard!
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default pongMetadata;
