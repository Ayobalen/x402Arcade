/**
 * Tetris Game Metadata
 *
 * Classic block-stacking puzzle game configuration.
 *
 * @module games/tetris/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const tetrisMetadata: GameMetadata = createGameMetadata({
  id: 'tetris',
  name: 'tetris',
  displayName: 'Classic Tetris',
  icon: '🟦',
  description: 'Stack falling blocks to clear lines. Speed increases as you progress',

  controls: {
    primary: ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'],
    secondary: ['a', 'd', 's', 'w'],
    pause: ' ',
  },

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard', 'expert'],
  },

  pricing: {
    baseCost: 0.02,
    difficultyMultiplier: {
      easy: 0.5,
      normal: 1.0,
      hard: 1.5,
      expert: 2.5,
    },
  },

  tags: ['classic', 'puzzle', 'tetris', 'high-score'],
  averageDuration: 300, // 5 minutes

  settings: {
    hasLives: false,
    hasLevels: true,
    hasPowerUps: false,
    isPvP: false,
    isEndless: true,
    hasTimeLimit: false,
  },

  tutorial: `
**How to Play:**

Control falling tetrominoes (blocks) to create complete horizontal lines.

**Controls:**
- **←/→ or A/D** - Move block left/right
- **↓ or S** - Soft drop (move down faster)
- **↑ or W** - Rotate block clockwise
- **Space** - Pause game

**Rules:**
- Complete lines disappear and earn points
- Game ends when blocks reach the top
- Speed increases every 10 lines cleared
- Score multiplier increases with combos

**Scoring:**
- Single line: 100 points × level
- Double lines: 300 points × level
- Triple lines: 500 points × level
- Tetris (4 lines): 800 points × level

**Strategy:**
- Save the I-piece for Tetris clears
- Keep the playing field low
- Learn T-spins for bonus points
- Plan ahead for the next piece

Master the stack and dominate the leaderboard!
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default tetrisMetadata;
