/**
 * SpaceInvadersSounds - Pre-configured sound effects for the Space Invaders game
 *
 * Features:
 * - Laser shoot sound (player and alien)
 * - Alien movement sound with progressive tempo (gets faster as aliens are destroyed)
 * - Alien death/explosion sound (with type variation)
 * - UFO flyby sound (continuous looping while active)
 * - Shield hit sound
 * - Player explosion sound
 * - Game start/end sounds
 * - Level complete sound
 *
 * All sounds are managed through SFXEngine with SFX category and appropriate priority.
 *
 * @module games/space-invaders/SpaceInvadersSounds
 */

import { type SoundAsset, SoundPriority } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';
import type { AlienType } from './types';

/**
 * Space Invaders game sound types
 */
export enum SpaceInvadersSoundType {
  // Core gameplay sounds - shooting
  PLAYER_SHOOT = 'spaceinvaders:player:shoot',
  ALIEN_SHOOT = 'spaceinvaders:alien:shoot',

  // Alien movement sounds (progressive tempo)
  ALIEN_MOVE_1 = 'spaceinvaders:alien:move:1', // Slowest
  ALIEN_MOVE_2 = 'spaceinvaders:alien:move:2',
  ALIEN_MOVE_3 = 'spaceinvaders:alien:move:3',
  ALIEN_MOVE_4 = 'spaceinvaders:alien:move:4', // Fastest

  // Alien death sounds (type-specific)
  ALIEN_DEATH = 'spaceinvaders:alien:death',
  ALIEN_DEATH_SQUID = 'spaceinvaders:alien:death:squid',
  ALIEN_DEATH_CRAB = 'spaceinvaders:alien:death:crab',
  ALIEN_DEATH_OCTOPUS = 'spaceinvaders:alien:death:octopus',

  // UFO sounds
  UFO_FLYBY = 'spaceinvaders:ufo:flyby', // Looping while UFO is active
  UFO_DEATH = 'spaceinvaders:ufo:death',

  // Shield sounds
  SHIELD_HIT = 'spaceinvaders:shield:hit',
  SHIELD_DESTROY = 'spaceinvaders:shield:destroy',

  // Player sounds
  PLAYER_DEATH = 'spaceinvaders:player:death',
  PLAYER_EXPLOSION = 'spaceinvaders:player:explosion',

  // Game flow sounds
  GAME_START = 'spaceinvaders:game:start',
  WAVE_COMPLETE = 'spaceinvaders:wave:complete',
  WAVE_START = 'spaceinvaders:wave:start',
  GAME_OVER = 'spaceinvaders:game:over',

  // Extra sounds
  EXTRA_LIFE = 'spaceinvaders:extralife',
  BONUS_POINTS = 'spaceinvaders:bonus',
}

/**
 * Space Invaders sound asset definitions
 *
 * Note: These paths point to audio files that should be placed in public/sounds/games/space-invaders/
 * For development, you can:
 * 1. Use jsfxr (https://sfxr.me/) to generate retro game sounds
 * 2. Use free sound libraries like freesound.org
 * 3. Use royalty-free 8-bit/retro sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 30KB per sound (Space Invaders sounds should be short and crisp)
 *
 * Sound design guidelines:
 * - Player shoot: Sharp "pew" or "zap" (100-200ms)
 * - Alien shoot: Similar but lower pitch (100-200ms)
 * - Alien movement: 4 iconic bass tones in sequence (200-300ms each)
 * - Alien death: Short explosion or "pop" (150-300ms)
 * - UFO flyby: Continuous warbling siren (loops while active)
 * - UFO death: Satisfying explosion (300-500ms)
 * - Shield hit: Metallic "ping" or "clang" (100-200ms)
 * - Player death: Dramatic explosion with descending pitch (500-1000ms)
 */
export const SPACE_INVADERS_SOUND_ASSETS: SoundAsset[] = [
  // ========================================
  // Core gameplay sounds - shooting
  // ========================================

  {
    id: SpaceInvadersSoundType.PLAYER_SHOOT,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/player-shoot.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 3,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_SHOOT,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-shoot.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 3,
    preload: true,
  },

  // ========================================
  // Alien movement sounds (progressive tempo)
  // ========================================
  // The iconic Space Invaders bass line that speeds up as aliens are destroyed

  {
    id: SpaceInvadersSoundType.ALIEN_MOVE_1,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-move-1.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_MOVE_2,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-move-2.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_MOVE_3,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-move-3.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_MOVE_4,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-move-4.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Alien death sounds
  // ========================================

  // Generic alien death (fallback)
  {
    id: SpaceInvadersSoundType.ALIEN_DEATH,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-death.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // Type-specific death sounds (optional variation)
  {
    id: SpaceInvadersSoundType.ALIEN_DEATH_SQUID,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-death-squid.mp3',
    volume: 0.7,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_DEATH_CRAB,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-death-crab.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.ALIEN_DEATH_OCTOPUS,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/alien-death-octopus.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // ========================================
  // UFO sounds
  // ========================================

  {
    id: SpaceInvadersSoundType.UFO_FLYBY,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/ufo-flyby.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.UFO_DEATH,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/ufo-death.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Shield sounds
  // ========================================

  {
    id: SpaceInvadersSoundType.SHIELD_HIT,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/shield-hit.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.SHIELD_DESTROY,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/shield-destroy.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Player sounds
  // ========================================

  {
    id: SpaceInvadersSoundType.PLAYER_DEATH,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/player-death.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.PLAYER_EXPLOSION,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/player-explosion.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Game flow sounds
  // ========================================

  {
    id: SpaceInvadersSoundType.GAME_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/game-start.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.WAVE_COMPLETE,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/wave-complete.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.WAVE_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/wave-start.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.GAME_OVER,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/game-over.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Extra sounds
  // ========================================

  {
    id: SpaceInvadersSoundType.EXTRA_LIFE,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/extra-life.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: SpaceInvadersSoundType.BONUS_POINTS,
    category: AudioCategory.SFX,
    src: '/sounds/games/space-invaders/bonus-points.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to initialize Space Invaders sounds in the SFX Engine
 *
 * Call this once when the Space Invaders game component mounts.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * import { useSFX } from '@/hooks/useSFX';
 * import { initializeSpaceInvadersSounds } from './SpaceInvadersSounds';
 *
 * function SpaceInvadersGame() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     initializeSpaceInvadersSounds(sfx);
 *   }, []);
 * }
 * ```
 */
export function initializeSpaceInvadersSounds(sfxEngine: {
  addSounds: (assets: SoundAsset[]) => void;
}): void {
  sfxEngine.addSounds(SPACE_INVADERS_SOUND_ASSETS);
}

/**
 * Helper to play player shoot sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playPlayerShootSound(sfx);
 * ```
 */
export function playPlayerShootSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.PLAYER_SHOOT,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play alien shoot sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playAlienShootSound(sfx);
 * ```
 */
export function playAlienShootSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.ALIEN_SHOOT,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play alien movement sound with progressive tempo
 *
 * The classic Space Invaders bass line that speeds up as aliens are destroyed.
 * Pass in the number of remaining aliens to automatically select the correct tempo.
 *
 * @param sfxEngine - The SFX Engine instance
 * @param remainingAliens - Number of aliens still alive
 * @param totalAliens - Total number of aliens at start of wave (default: 55)
 *
 * @example
 * ```tsx
 * // Play movement sound based on how many aliens remain
 * playAlienMovementSound(sfx, state.aliens.filter(a => a.isAlive).length);
 * ```
 */
export function playAlienMovementSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  remainingAliens: number,
  totalAliens: number = 55
): void {
  // Calculate tempo based on percentage of aliens destroyed
  // More aliens destroyed = faster tempo
  const percentDestroyed = 1 - remainingAliens / totalAliens;

  let soundId: SpaceInvadersSoundType;

  if (percentDestroyed < 0.25) {
    // 0-25% destroyed: Slowest (Move 1)
    soundId = SpaceInvadersSoundType.ALIEN_MOVE_1;
  } else if (percentDestroyed < 0.5) {
    // 25-50% destroyed: Slow (Move 2)
    soundId = SpaceInvadersSoundType.ALIEN_MOVE_2;
  } else if (percentDestroyed < 0.75) {
    // 50-75% destroyed: Fast (Move 3)
    soundId = SpaceInvadersSoundType.ALIEN_MOVE_3;
  } else {
    // 75-100% destroyed: Fastest (Move 4)
    soundId = SpaceInvadersSoundType.ALIEN_MOVE_4;
  }

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play alien death sound with type-specific variation
 *
 * @param sfxEngine - The SFX Engine instance
 * @param alienType - Type of alien that died
 *
 * @example
 * ```tsx
 * playAlienDeathSound(sfx, 'squid');
 * ```
 */
export function playAlienDeathSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  alienType: AlienType
): void {
  let soundId: SpaceInvadersSoundType;

  switch (alienType) {
    case 'squid':
      soundId = SpaceInvadersSoundType.ALIEN_DEATH_SQUID;
      break;
    case 'crab':
      soundId = SpaceInvadersSoundType.ALIEN_DEATH_CRAB;
      break;
    case 'octopus':
      soundId = SpaceInvadersSoundType.ALIEN_DEATH_OCTOPUS;
      break;
    default:
      soundId = SpaceInvadersSoundType.ALIEN_DEATH;
  }

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play/loop UFO flyby sound
 *
 * Call this when UFO appears. The sound should loop until stopped.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // Start UFO sound when UFO spawns
 * playUFOFlybySound(sfx);
 * ```
 */
export function playUFOFlybySound(sfxEngine: {
  play: (request: { id: string; priority?: number; loop?: boolean }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.UFO_FLYBY,
    priority: SoundPriority.MEDIUM,
    loop: true,
  });
}

/**
 * Helper to stop UFO flyby sound
 *
 * Call this when UFO is destroyed or leaves the screen.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // Stop UFO sound when UFO is destroyed or leaves screen
 * stopUFOFlybySound(sfx);
 * ```
 */
export function stopUFOFlybySound(sfxEngine: { stop: (id: string) => void }): void {
  sfxEngine.stop(SpaceInvadersSoundType.UFO_FLYBY);
}

/**
 * Helper to play UFO death sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playUFODeathSound(sfx);
 * ```
 */
export function playUFODeathSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.UFO_DEATH,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play shield hit sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playShieldHitSound(sfx);
 * ```
 */
export function playShieldHitSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.SHIELD_HIT,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play shield destroy sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playShieldDestroySound(sfx);
 * ```
 */
export function playShieldDestroySound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.SHIELD_DESTROY,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play player death sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playPlayerDeathSound(sfx);
 * ```
 */
export function playPlayerDeathSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  // Play both death and explosion sounds for layered effect
  sfxEngine.play({
    id: SpaceInvadersSoundType.PLAYER_DEATH,
    priority: SoundPriority.HIGH,
  });

  // Explosion sound plays shortly after death
  setTimeout(() => {
    sfxEngine.play({
      id: SpaceInvadersSoundType.PLAYER_EXPLOSION,
      priority: SoundPriority.HIGH,
    });
  }, 100);
}

/**
 * Helper to play wave complete sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playWaveCompleteSound(sfx);
 * ```
 */
export function playWaveCompleteSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.WAVE_COMPLETE,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play wave start sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playWaveStartSound(sfx);
 * ```
 */
export function playWaveStartSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.WAVE_START,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play game over sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playGameOverSound(sfx);
 * ```
 */
export function playGameOverSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.GAME_OVER,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play extra life sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playExtraLifeSound(sfx);
 * ```
 */
export function playExtraLifeSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.EXTRA_LIFE,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play bonus points sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playBonusPointsSound(sfx);
 * ```
 */
export function playBonusPointsSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: SpaceInvadersSoundType.BONUS_POINTS,
    priority: SoundPriority.MEDIUM,
  });
}

// Export all sound types and helpers
export default {
  SpaceInvadersSoundType,
  SPACE_INVADERS_SOUND_ASSETS,
  initializeSpaceInvadersSounds,
  playPlayerShootSound,
  playAlienShootSound,
  playAlienMovementSound,
  playAlienDeathSound,
  playUFOFlybySound,
  stopUFOFlybySound,
  playUFODeathSound,
  playShieldHitSound,
  playShieldDestroySound,
  playPlayerDeathSound,
  playWaveCompleteSound,
  playWaveStartSound,
  playGameOverSound,
  playExtraLifeSound,
  playBonusPointsSound,
};
