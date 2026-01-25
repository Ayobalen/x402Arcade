/**
 * SnakeSounds - Pre-configured sound effects for the Snake game
 *
 * Features:
 * - Food eating sound (with subtle variation)
 * - Snake collision/death sound
 * - Movement/turn sound (very subtle, optional)
 * - Power-up collection sound (for future enhancements)
 * - Level up sound
 * - Combo sound (for combo streaks)
 *
 * All sounds are managed through SFXEngine with SFX category and appropriate priority.
 *
 * @module games/snake/SnakeSounds
 */

import { type SoundAsset, SoundPriority } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';

/**
 * Snake game sound types
 */
export enum SnakeSoundType {
  // Core gameplay sounds
  EAT_FOOD = 'snake:eat:food',
  EAT_FOOD_COMBO = 'snake:eat:food:combo',
  COLLISION = 'snake:collision',
  DEATH = 'snake:death',

  // Optional movement sounds
  MOVE = 'snake:move',
  TURN = 'snake:turn',

  // Achievement sounds
  LEVEL_UP = 'snake:levelup',
  COMBO_START = 'snake:combo:start',
  COMBO_CONTINUE = 'snake:combo:continue',

  // Future enhancements
  POWER_UP = 'snake:powerup',
  SPEED_BOOST = 'snake:speedboost',
}

/**
 * Snake sound asset definitions
 *
 * Note: These paths point to audio files that should be placed in public/sounds/games/snake/
 * For development, you can:
 * 1. Use jsfxr (https://sfxr.me/) to generate retro game sounds
 * 2. Use free sound libraries like freesound.org
 * 3. Use royalty-free 8-bit/retro sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 30KB per sound (Snake sounds should be short and punchy)
 *
 * Sound design guidelines:
 * - Eat sound: Short, positive "nom" or "beep" (100-200ms)
 * - Collision: Sharp, negative "crash" or "buzz" (150-300ms)
 * - Death: Descending pitch or "game over" tone (300-500ms)
 * - Movement: Very subtle tick or click (50-100ms), low volume
 * - Level up: Ascending arpeggio or fanfare (500-800ms)
 */
export const SNAKE_SOUND_ASSETS: SoundAsset[] = [
  // Core gameplay sounds
  {
    id: SnakeSoundType.EAT_FOOD,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/eat-food.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: true,
  },
  {
    id: SnakeSoundType.EAT_FOOD_COMBO,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/eat-food-combo.mp3',
    volume: 0.7,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: true,
  },
  {
    id: SnakeSoundType.COLLISION,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/collision.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SnakeSoundType.DEATH,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/death.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // Optional movement sounds (disabled by default, can be enabled via settings)
  {
    id: SnakeSoundType.MOVE,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/move.mp3',
    volume: 0.2, // Very subtle
    priority: SoundPriority.LOW,
    maxInstances: 1,
    preload: false, // Don't preload to save bandwidth
  },
  {
    id: SnakeSoundType.TURN,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/turn.mp3',
    volume: 0.3,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: false,
  },

  // Achievement sounds
  {
    id: SnakeSoundType.LEVEL_UP,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/level-up.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SnakeSoundType.COMBO_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/combo-start.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SnakeSoundType.COMBO_CONTINUE,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/combo-continue.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: true,
  },

  // Future power-up sounds
  {
    id: SnakeSoundType.POWER_UP,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/power-up.mp3',
    volume: 0.7,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: false,
  },
  {
    id: SnakeSoundType.SPEED_BOOST,
    category: AudioCategory.SFX,
    src: '/sounds/games/snake/speed-boost.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: false,
  },
];

/**
 * Helper to initialize Snake sounds in the SFX Engine
 *
 * Call this once when the Snake game component mounts.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * import { useSFX } from '@/hooks/useSFX';
 * import { initializeSnakeSounds } from './SnakeSounds';
 *
 * function SnakeGame() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     initializeSnakeSounds(sfx);
 *   }, []);
 * }
 * ```
 */
export function initializeSnakeSounds(sfxEngine: {
  addSounds: (assets: SoundAsset[]) => void;
}): void {
  sfxEngine.addSounds(SNAKE_SOUND_ASSETS);
}

/**
 * Helper to play eat food sound with combo variation
 *
 * Plays different sound based on combo count for more satisfying feedback.
 *
 * @param sfxEngine - The SFX Engine instance
 * @param comboCount - Current combo count (0 = no combo)
 *
 * @example
 * ```tsx
 * playEatSound(sfx, state.gameSpecific.currentCombo);
 * ```
 */
export function playEatSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  comboCount: number = 0
): void {
  // Play combo sound for combos of 3 or more
  const soundId = comboCount >= 3 ? SnakeSoundType.EAT_FOOD_COMBO : SnakeSoundType.EAT_FOOD;

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play collision/death sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playDeathSound(sfx);
 * ```
 */
export function playDeathSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  // Play both collision and death for layered effect
  sfxEngine.play({
    id: SnakeSoundType.COLLISION,
    priority: SoundPriority.HIGH,
  });

  // Death sound plays shortly after collision
  setTimeout(() => {
    sfxEngine.play({
      id: SnakeSoundType.DEATH,
      priority: SoundPriority.HIGH,
    });
  }, 100);
}

/**
 * Helper to play level up sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLevelUpSound(sfx);
 * ```
 */
export function playLevelUpSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SnakeSoundType.LEVEL_UP,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play combo sound
 *
 * @param sfxEngine - The SFX Engine instance
 * @param comboCount - Current combo count
 *
 * @example
 * ```tsx
 * playComboSound(sfx, state.gameSpecific.currentCombo);
 * ```
 */
export function playComboSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  comboCount: number
): void {
  // Play combo start sound on first combo
  if (comboCount === 1) {
    sfxEngine.play({
      id: SnakeSoundType.COMBO_START,
      priority: SoundPriority.MEDIUM,
    });
  }
  // Play combo continue sound on subsequent combos
  else if (comboCount > 1 && comboCount % 5 === 0) {
    // Every 5th combo
    sfxEngine.play({
      id: SnakeSoundType.COMBO_CONTINUE,
      priority: SoundPriority.MEDIUM,
    });
  }
}

/**
 * Helper to play movement sound (very subtle, optional)
 *
 * Note: This can get annoying quickly, use sparingly or allow users to disable it
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // Only play occasionally to avoid spam
 * if (Math.random() < 0.1) {  // 10% of moves
 *   playMoveSound(sfx);
 * }
 * ```
 */
export function playMoveSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SnakeSoundType.MOVE,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play turn sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // Play when snake changes direction
 * playTurnSound(sfx);
 * ```
 */
export function playTurnSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SnakeSoundType.TURN,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play power-up sound (for future features)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playPowerUpSound(sfx);
 * ```
 */
export function playPowerUpSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SnakeSoundType.POWER_UP,
    priority: SoundPriority.MEDIUM,
  });
}

// Export all sound types and helpers
export default {
  SnakeSoundType,
  SNAKE_SOUND_ASSETS,
  initializeSnakeSounds,
  playEatSound,
  playDeathSound,
  playLevelUpSound,
  playComboSound,
  playMoveSound,
  playTurnSound,
  playPowerUpSound,
};
