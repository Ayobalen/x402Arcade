/**
 * Flappy Bird Game Metadata
 *
 * Addictive one-button mobile game configuration.
 *
 * @module games/flappy-bird/metadata
 */

import { createGameMetadata } from '../types/GameMetadata';
import type { GameMetadata } from '../types/GameMetadata';

export const flappyBirdMetadata: GameMetadata = createGameMetadata({
  id: 'flappy-bird',
  name: 'flappy-bird',
  displayName: 'Flappy Bird',
  icon: '🐦',
  description: "Tap to flap and navigate through pipes. One mistake and it's game over",

  controls: {
    primary: [' ', 'ArrowUp'],
    secondary: ['w'],
    pause: 'Escape',
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

  tags: ['casual', 'arcade', 'one-button', 'reflex', 'addictive'],
  averageDuration: 60, // 1 minute (notoriously difficult!)
  touchSupported: true,

  settings: {
    hasLives: false,
    hasLevels: false,
    hasPowerUps: false,
    isPvP: false,
    isEndless: true,
    hasTimeLimit: false,
  },

  tutorial: `
**How to Play:**

Tap to make the bird flap and navigate through pipe gaps. Don't hit anything!

**Controls:**
- **Space / ↑ / W** - Flap wings (tap)
- **Click / Tap** - Flap wings (touch)
- **Escape** - Pause game

**Rules:**
- One hit = game over
- Gravity constantly pulls bird down
- Each pipe passed = 1 point
- Pipes appear randomly with varying gaps

**Medals:**
- **Bronze**: 10 points
- **Silver**: 20 points
- **Gold**: 30 points
- **Platinum**: 40 points

**Difficulty:**
- **Easy**: Wider pipe gaps, slower speed
- **Normal**: Original game difficulty
- **Hard**: Narrow gaps, faster speed

**Strategy:**
- Tap rhythmically - don't spam
- Stay in the middle vertically
- Look ahead at upcoming pipes
- Practice makes perfect (eventually!)

**Pro Tips:**
- Short taps for small adjustments
- Long taps for big climbs
- Let gravity do the work
- Stay calm and focused

This simple game is deceptively difficult. Can you beat 10 pipes?
  `.trim(),

  version: '1.0.0',
  author: {
    name: 'x402 Arcade',
    url: 'https://x402.dev',
  },
});

export default flappyBirdMetadata;
