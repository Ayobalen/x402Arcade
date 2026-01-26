/**
 * Space Invaders Game Metadata
 *
 * Classic alien shooter arcade game configuration.
 *
 * @module games/space-invaders/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const spaceInvadersMetadata: GameMetadata = createGameMetadata({
  id: 'space-invaders',
  name: 'space-invaders',
  displayName: 'Space Invaders',
  icon: '👾',
  description: 'Defend Earth from alien invaders. Shoot them down before they reach you',

  controls: {
    primary: ['ArrowLeft', 'ArrowRight', ' '],
    secondary: ['a', 'd', 'w'],
    pause: 'Escape',
  },

  difficulty: {
    default: 'normal',
    available: ['easy', 'normal', 'hard', 'expert'],
  },

  pricing: {
    baseCost: 0.025,
    difficultyMultiplier: {
      easy: 0.6,
      normal: 1.0,
      hard: 1.5,
      expert: 2.0,
    },
  },

  tags: ['classic', 'arcade', 'shooter', 'aliens', 'retro'],
  averageDuration: 240, // 4 minutes

  settings: {
    hasLives: true,
    hasLevels: true,
    hasPowerUps: false,
    isPvP: false,
    isEndless: false,
    hasTimeLimit: false,
  },

  tutorial: `
**How to Play:**

Command your laser cannon and defend Earth from descending alien invaders.

**Controls:**
- **←/→ or A/D** - Move cannon left/right
- **Space or W** - Fire laser
- **Escape** - Pause game

**Rules:**
- Destroy all aliens to advance to next wave
- Aliens speed up as you eliminate them
- Don't let aliens reach the bottom
- Hide behind shields for protection
- Defeat UFO for bonus points

**Enemies:**
- **Top Row** (squid): 30 points
- **Middle Rows** (crab): 20 points
- **Bottom Rows** (octopus): 10 points
- **Mystery UFO**: 50-300 points (random)

**Lives:**
- Start with 3 lives
- Lose a life when hit by alien projectile
- Lose a life if aliens reach bottom
- Game over when all lives lost

**Strategy:**
- Eliminate side columns first for more space
- Use shields strategically - they degrade
- Time your shots during alien fire patterns
- Aim for the UFO when it appears
- Create safe passages through shields

**Scoring:**
- Higher rows = more points
- Combo kills = score multiplier
- Perfect wave = 1000 point bonus
- No damage wave = extra life

Protect the planet and become a galactic hero!
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default spaceInvadersMetadata;
