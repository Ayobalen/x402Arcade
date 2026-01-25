/**
 * BreakoutSounds - Pre-configured sound effects for the Breakout game
 *
 * Features:
 * - Brick break sound (with pitch variation based on brick type)
 * - Paddle hit sound (with velocity-based intensity)
 * - Wall bounce sound
 * - Power-up collect sound (different sounds for different power-up types)
 * - Power-up drop sound (when power-up appears)
 * - Laser fire sound
 * - Game start/end sounds
 * - Level complete sound
 * - Combo sounds for consecutive brick hits
 *
 * All sounds are managed through SFXEngine with SFX category and appropriate priority.
 *
 * @module games/breakout/BreakoutSounds
 */

import { type SoundAsset, SoundPriority } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';
import type { BrickType, PowerUpType } from './types';

/**
 * Breakout game sound types
 */
export enum BreakoutSoundType {
  // Core gameplay sounds - brick hits
  BRICK_BREAK = 'breakout:brick:break',
  BRICK_BREAK_NORMAL = 'breakout:brick:break:normal',
  BRICK_BREAK_HARD = 'breakout:brick:break:hard',
  BRICK_BREAK_ARMORED = 'breakout:brick:break:armored',
  BRICK_BREAK_EXPLOSIVE = 'breakout:brick:break:explosive',
  BRICK_BREAK_GOLDEN = 'breakout:brick:break:golden',
  BRICK_DAMAGE = 'breakout:brick:damage', // Multi-hit bricks getting damaged but not destroyed

  // Core gameplay sounds - paddle and ball
  PADDLE_HIT = 'breakout:paddle:hit',
  PADDLE_HIT_HARD = 'breakout:paddle:hit:hard', // High-speed ball hits
  WALL_BOUNCE = 'breakout:wall:bounce',

  // Power-up sounds
  POWERUP_DROP = 'breakout:powerup:drop', // When power-up appears from brick
  POWERUP_COLLECT = 'breakout:powerup:collect', // Generic collect sound
  POWERUP_EXPAND = 'breakout:powerup:expand', // Paddle expand
  POWERUP_SHRINK = 'breakout:powerup:shrink', // Paddle shrink
  POWERUP_MULTIBALL = 'breakout:powerup:multiball', // Multi-ball
  POWERUP_LASER = 'breakout:powerup:laser', // Laser power-up
  POWERUP_STICKY = 'breakout:powerup:sticky', // Sticky paddle
  POWERUP_INVINCIBLE = 'breakout:powerup:invincible', // Invincibility
  POWERUP_SPEEDUP = 'breakout:powerup:speedup', // Ball speed increase
  POWERUP_SLOWDOWN = 'breakout:powerup:slowdown', // Ball speed decrease

  // Laser sounds
  LASER_FIRE = 'breakout:laser:fire',
  LASER_HIT = 'breakout:laser:hit',

  // Game flow sounds
  GAME_START = 'breakout:game:start',
  BALL_LAUNCH = 'breakout:ball:launch',
  BALL_LOST = 'breakout:ball:lost',
  LIFE_LOST = 'breakout:life:lost',
  LEVEL_COMPLETE = 'breakout:level:complete',
  GAME_OVER = 'breakout:game:over',

  // Achievement/combo sounds
  COMBO_START = 'breakout:combo:start', // 3+ combo
  COMBO_CONTINUE = 'breakout:combo:continue', // Higher combo
  ALL_CLEAR = 'breakout:allclear', // All bricks destroyed
}

/**
 * Breakout sound asset definitions
 *
 * Note: These paths point to audio files that should be placed in public/sounds/games/breakout/
 * For development, you can:
 * 1. Use jsfxr (https://sfxr.me/) to generate retro game sounds
 * 2. Use free sound libraries like freesound.org
 * 3. Use royalty-free 8-bit/retro sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 30KB per sound (Breakout sounds should be short and punchy)
 *
 * Sound design guidelines:
 * - Brick break: Short "crack" or "pop" (50-150ms), pitch varies by brick type
 * - Paddle hit: Crisp "boop" or "ping" (50-100ms), intensity varies by ball speed
 * - Wall bounce: Similar to paddle but softer (50-100ms)
 * - Power-up collect: Positive "chime" or "ding" (200-400ms)
 * - Laser fire: Quick "zap" or "pew" (100-200ms)
 * - Level complete: Victory fanfare or jingle (1000-2000ms)
 */
export const BREAKOUT_SOUND_ASSETS: SoundAsset[] = [
  // ========================================
  // Core gameplay sounds - brick breaks
  // ========================================

  // Generic brick break (fallback)
  {
    id: BreakoutSoundType.BRICK_BREAK,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // Normal bricks (higher pitch, lighter sound)
  {
    id: BreakoutSoundType.BRICK_BREAK_NORMAL,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break-normal.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // Hard bricks (medium pitch, solid sound)
  {
    id: BreakoutSoundType.BRICK_BREAK_HARD,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break-hard.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // Armored bricks (lower pitch, heavy sound)
  {
    id: BreakoutSoundType.BRICK_BREAK_ARMORED,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break-armored.mp3',
    volume: 0.7,
    priority: SoundPriority.MEDIUM,
    maxInstances: 3,
    preload: true,
  },

  // Explosive bricks (dramatic explosion sound)
  {
    id: BreakoutSoundType.BRICK_BREAK_EXPLOSIVE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break-explosive.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 2,
    preload: true,
  },

  // Golden bricks (special high-value sound)
  {
    id: BreakoutSoundType.BRICK_BREAK_GOLDEN,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-break-golden.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 2,
    preload: true,
  },

  // Brick damage (multi-hit bricks getting hit but not destroyed)
  {
    id: BreakoutSoundType.BRICK_DAMAGE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/brick-damage.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },

  // ========================================
  // Core gameplay sounds - paddle and ball
  // ========================================

  // Normal paddle hit
  {
    id: BreakoutSoundType.PADDLE_HIT,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/paddle-hit.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },

  // Hard paddle hit (high-speed ball)
  {
    id: BreakoutSoundType.PADDLE_HIT_HARD,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/paddle-hit-hard.mp3',
    volume: 0.7,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },

  // Wall bounce
  {
    id: BreakoutSoundType.WALL_BOUNCE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/wall-bounce.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },

  // ========================================
  // Power-up sounds
  // ========================================

  // Power-up drop (when it appears from brick)
  {
    id: BreakoutSoundType.POWERUP_DROP,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-drop.mp3',
    volume: 0.5,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: true,
  },

  // Generic power-up collect
  {
    id: BreakoutSoundType.POWERUP_COLLECT,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-collect.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // Specific power-up sounds
  {
    id: BreakoutSoundType.POWERUP_EXPAND,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-expand.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_SHRINK,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-shrink.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_MULTIBALL,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-multiball.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_LASER,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-laser.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_STICKY,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-sticky.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_INVINCIBLE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-invincible.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_SPEEDUP,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-speedup.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.POWERUP_SLOWDOWN,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/powerup-slowdown.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Laser sounds
  // ========================================

  {
    id: BreakoutSoundType.LASER_FIRE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/laser-fire.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 3,
    preload: true,
  },
  {
    id: BreakoutSoundType.LASER_HIT,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/laser-hit.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },

  // ========================================
  // Game flow sounds
  // ========================================

  {
    id: BreakoutSoundType.GAME_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/game-start.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.BALL_LAUNCH,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/ball-launch.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },
  {
    id: BreakoutSoundType.BALL_LOST,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/ball-lost.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.LIFE_LOST,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/life-lost.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.LEVEL_COMPLETE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/level-complete.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.GAME_OVER,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/game-over.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // ========================================
  // Achievement/combo sounds
  // ========================================

  {
    id: BreakoutSoundType.COMBO_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/combo-start.mp3',
    volume: 0.6,
    priority: SoundPriority.MEDIUM,
    maxInstances: 1,
    preload: true,
  },
  {
    id: BreakoutSoundType.COMBO_CONTINUE,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/combo-continue.mp3',
    volume: 0.7,
    priority: SoundPriority.MEDIUM,
    maxInstances: 2,
    preload: true,
  },
  {
    id: BreakoutSoundType.ALL_CLEAR,
    category: AudioCategory.SFX,
    src: '/sounds/games/breakout/all-clear.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Helper to initialize Breakout sounds in the SFX Engine
 *
 * Call this once when the Breakout game component mounts.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * import { useSFX } from '@/hooks/useSFX';
 * import { initializeBreakoutSounds } from './BreakoutSounds';
 *
 * function BreakoutGame() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     initializeBreakoutSounds(sfx);
 *   }, []);
 * }
 * ```
 */
export function initializeBreakoutSounds(sfxEngine: {
  addSounds: (assets: SoundAsset[]) => void;
}): void {
  sfxEngine.addSounds(BREAKOUT_SOUND_ASSETS);
}

/**
 * Helper to play brick break sound with type-specific variation
 *
 * @param sfxEngine - The SFX Engine instance
 * @param brickType - Type of brick that was broken
 *
 * @example
 * ```tsx
 * playBrickBreakSound(sfx, 'explosive');
 * ```
 */
export function playBrickBreakSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  brickType: BrickType
): void {
  let soundId: BreakoutSoundType;

  switch (brickType) {
    case 'normal':
      soundId = BreakoutSoundType.BRICK_BREAK_NORMAL;
      break;
    case 'hard':
      soundId = BreakoutSoundType.BRICK_BREAK_HARD;
      break;
    case 'armored':
      soundId = BreakoutSoundType.BRICK_BREAK_ARMORED;
      break;
    case 'explosive':
      soundId = BreakoutSoundType.BRICK_BREAK_EXPLOSIVE;
      break;
    case 'golden':
      soundId = BreakoutSoundType.BRICK_BREAK_GOLDEN;
      break;
    default:
      soundId = BreakoutSoundType.BRICK_BREAK;
  }

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play brick damage sound (multi-hit bricks)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playBrickDamageSound(sfx);
 * ```
 */
export function playBrickDamageSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.BRICK_DAMAGE,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play paddle hit sound with velocity-based variation
 *
 * @param sfxEngine - The SFX Engine instance
 * @param ballSpeed - Current ball speed (use for intensity)
 * @param hardHitThreshold - Speed threshold for "hard hit" sound (default: 500)
 *
 * @example
 * ```tsx
 * const speed = Math.sqrt(ball.velocity.vx ** 2 + ball.velocity.vy ** 2);
 * playPaddleHitSound(sfx, speed);
 * ```
 */
export function playPaddleHitSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  ballSpeed: number,
  hardHitThreshold: number = 500
): void {
  const soundId =
    ballSpeed >= hardHitThreshold
      ? BreakoutSoundType.PADDLE_HIT_HARD
      : BreakoutSoundType.PADDLE_HIT;

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play wall bounce sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playWallBounceSound(sfx);
 * ```
 */
export function playWallBounceSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.WALL_BOUNCE,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play power-up drop sound (when power-up appears)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playPowerUpDropSound(sfx);
 * ```
 */
export function playPowerUpDropSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.POWERUP_DROP,
    priority: SoundPriority.MEDIUM,
  });
}

/**
 * Helper to play power-up collection sound with type-specific variation
 *
 * @param sfxEngine - The SFX Engine instance
 * @param powerUpType - Type of power-up collected
 *
 * @example
 * ```tsx
 * playPowerUpCollectSound(sfx, 'expand');
 * ```
 */
export function playPowerUpCollectSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  powerUpType: PowerUpType
): void {
  let soundId: BreakoutSoundType;

  switch (powerUpType) {
    case 'expand':
      soundId = BreakoutSoundType.POWERUP_EXPAND;
      break;
    case 'shrink':
      soundId = BreakoutSoundType.POWERUP_SHRINK;
      break;
    case 'multiball':
      soundId = BreakoutSoundType.POWERUP_MULTIBALL;
      break;
    case 'laser':
      soundId = BreakoutSoundType.POWERUP_LASER;
      break;
    case 'sticky':
      soundId = BreakoutSoundType.POWERUP_STICKY;
      break;
    case 'invincible':
      soundId = BreakoutSoundType.POWERUP_INVINCIBLE;
      break;
    case 'speedup':
      soundId = BreakoutSoundType.POWERUP_SPEEDUP;
      break;
    case 'slowdown':
      soundId = BreakoutSoundType.POWERUP_SLOWDOWN;
      break;
    default:
      soundId = BreakoutSoundType.POWERUP_COLLECT;
  }

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play laser fire sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLaserFireSound(sfx);
 * ```
 */
export function playLaserFireSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.LASER_FIRE,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play laser hit sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLaserHitSound(sfx);
 * ```
 */
export function playLaserHitSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.LASER_HIT,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play ball launch sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playBallLaunchSound(sfx);
 * ```
 */
export function playBallLaunchSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.BALL_LAUNCH,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play ball lost sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playBallLostSound(sfx);
 * ```
 */
export function playBallLostSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.BALL_LOST,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play life lost sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLifeLostSound(sfx);
 * ```
 */
export function playLifeLostSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.LIFE_LOST,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play level complete sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLevelCompleteSound(sfx);
 * ```
 */
export function playLevelCompleteSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.LEVEL_COMPLETE,
    priority: SoundPriority.HIGH,
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
    id: BreakoutSoundType.GAME_OVER,
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
  // Play combo start sound on first combo (3 bricks)
  if (comboCount === 3) {
    sfxEngine.play({
      id: BreakoutSoundType.COMBO_START,
      priority: SoundPriority.MEDIUM,
    });
  }
  // Play combo continue sound on higher combos (every 5)
  else if (comboCount > 3 && comboCount % 5 === 0) {
    sfxEngine.play({
      id: BreakoutSoundType.COMBO_CONTINUE,
      priority: SoundPriority.MEDIUM,
    });
  }
}

/**
 * Helper to play all clear sound (all bricks destroyed)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playAllClearSound(sfx);
 * ```
 */
export function playAllClearSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: BreakoutSoundType.ALL_CLEAR,
    priority: SoundPriority.HIGH,
  });
}

// Export all sound types and helpers
export default {
  BreakoutSoundType,
  BREAKOUT_SOUND_ASSETS,
  initializeBreakoutSounds,
  playBrickBreakSound,
  playBrickDamageSound,
  playPaddleHitSound,
  playWallBounceSound,
  playPowerUpDropSound,
  playPowerUpCollectSound,
  playLaserFireSound,
  playLaserHitSound,
  playBallLaunchSound,
  playBallLostSound,
  playLifeLostSound,
  playLevelCompleteSound,
  playGameOverSound,
  playComboSound,
  playAllClearSound,
};
