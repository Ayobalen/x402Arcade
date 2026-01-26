/**
 * Breakout Game Metadata
 *
 * Classic brick-breaking arcade game configuration.
 *
 * @module games/breakout/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const breakoutMetadata: GameMetadata = createGameMetadata({
  id: 'breakout',
  name: 'breakout',
  displayName: 'Brick Breakout',
  icon: '🧱',
  description: 'Break all the bricks with your paddle and ball. Classic arcade action',

  controls: {
    primary: ['ArrowLeft', 'ArrowRight'],
    secondary: ['a', 'd'],
    pause: ' ',
  },

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard'],
  },

  pricing: {
    baseCost: 0.015,
    difficultyMultiplier: {
      easy: 0.7,
      normal: 1.0,
      hard: 1.3,
      expert: 1.8,
    },
  },

  tags: ['classic', 'arcade', 'breakout', 'action'],
  averageDuration: 180, // 3 minutes

  settings: {
    hasLives: true,
    hasLevels: true,
    hasPowerUps: true,
    isPvP: false,
    isEndless: false,
    hasTimeLimit: false,
  },

  tutorial: `
**How to Play:**

Control the paddle to bounce the ball and break all bricks on screen.

**Controls:**
- **←/→ or A/D** - Move paddle left/right
- **Space** - Launch ball / Pause game

**Rules:**
- Break all bricks to advance to next level
- Don't let the ball fall off screen (lose a life)
- Game ends when all lives are lost
- Some bricks drop power-ups when broken

**Power-Ups:**
- **Expand** - Wider paddle
- **Slow** - Slower ball speed
- **Multi-Ball** - Extra balls in play
- **Laser** - Shoot bricks directly

**Scoring:**
- Each brick: 10-50 points based on color
- Power-up collection: 25 points
- Level completion bonus: 500 points

**Strategy:**
- Aim for the corners to create chaos
- Catch power-ups strategically
- Use paddle edges for angle shots
- Break top bricks first for more control

Clear all levels and set the high score!
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default breakoutMetadata;
