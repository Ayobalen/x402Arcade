/**
 * PongSounds - Pre-configured sound effects for the Pong game
 *
 * Features:
 * - Paddle hit sound (with intensity variation based on ball speed)
 * - Wall bounce sound
 * - Score sound effect (goal scored)
 * - Game start/serve sound
 * - Game end/win sound
 * - Rally milestone sounds (for long rallies)
 *
 * All sounds are managed through SFXEngine with SFX category and appropriate priority.
 *
 * @module games/pong/PongSounds
 */

import { type SoundAsset, SoundPriority } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';

/**
 * Pong game sound types
 */
export enum PongSoundType {
  // Core gameplay sounds
  PADDLE_HIT = 'pong:paddle:hit',
  PADDLE_HIT_HARD = 'pong:paddle:hit:hard', // For high-speed ball hits
  WALL_BOUNCE = 'pong:wall:bounce',
  SCORE = 'pong:score',
  GOAL_OPPONENT = 'pong:goal:opponent', // When opponent scores (negative sound)

  // Game flow sounds
  SERVE = 'pong:serve',
  GAME_START = 'pong:game:start',
  GAME_END_WIN = 'pong:game:end:win',
  GAME_END_LOSE = 'pong:game:end:lose',

  // Achievement sounds
  RALLY_MILESTONE = 'pong:rally:milestone', // Every 10 hits
  LONG_RALLY = 'pong:rally:long', // 20+ hits
  SPEED_UP = 'pong:speedup', // Ball speed increase notification
}

/**
 * Pong sound asset definitions
 *
 * Note: These paths point to audio files that should be placed in public/sounds/games/pong/
 * For development, you can:
 * 1. Use jsfxr (https://sfxr.me/) to generate retro game sounds
 * 2. Use free sound libraries like freesound.org
 * 3. Use royalty-free 8-bit/retro sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 30KB per sound (Pong sounds should be short and crisp)
 *
 * Sound design guidelines:
 * - Paddle hit: Sharp "beep" or "boop" (50-100ms), pitch varies with ball speed
 * - Wall bounce: Similar to paddle hit but slightly softer (50-100ms)
 * - Score: Positive ascending tone or "ding" (200-400ms)
 * - Goal (opponent): Negative descending tone or "buzz" (200-400ms)
 * - Serve: Countdown beep or "ready" tone (150-300ms)
 * - Game start: Brief fanfare or "start" jingle (500-1000ms)
 * - Game end: Victory fanfare or defeat tone (1000-2000ms)
 * - Rally milestone: Quick ascending arpeggio (200-400ms)
 */
export const PONG_SOUND_ASSETS: SoundAsset[] = [
  // Core gameplay sounds - paddle hits
  {
    id: PongSoundType.PADDLE_HIT,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/paddle-hit.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },
  {
    id: PongSoundType.PADDLE_HIT_HARD,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/paddle-hit-hard.mp3',
    volume: 0.7,
    priority: SoundPriority.NORMAL,
    maxInstances: 2,
    preload: true,
  },

  // Core gameplay sounds - wall and scoring
  {
    id: PongSoundType.WALL_BOUNCE,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/wall-bounce.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: true,
  },
  {
    id: PongSoundType.SCORE,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/score.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.GOAL_OPPONENT,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/goal-opponent.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // Game flow sounds
  {
    id: PongSoundType.SERVE,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/serve.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.GAME_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/game-start.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.GAME_END_WIN,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/game-end-win.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.GAME_END_LOSE,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/game-end-lose.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // Achievement sounds
  {
    id: PongSoundType.RALLY_MILESTONE,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/rally-milestone.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.LONG_RALLY,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/long-rally.mp3',
    volume: 0.7,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: PongSoundType.SPEED_UP,
    category: AudioCategory.SFX,
    src: '/sounds/games/pong/speed-up.mp3',
    volume: 0.5,
    priority: SoundPriority.LOW,
    maxInstances: 1,
    preload: false, // Don't preload, not critical
  },
];

/**
 * Helper to initialize Pong sounds in the SFX Engine
 *
 * Call this once when the Pong game component mounts.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * import { useSFX } from '@/hooks/useSFX';
 * import { initializePongSounds } from './PongSounds';
 *
 * function PongGame() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     initializePongSounds(sfx);
 *   }, []);
 * }
 * ```
 */
export function initializePongSounds(sfxEngine: {
  addSounds: (assets: SoundAsset[]) => void;
}): void {
  sfxEngine.addSounds(PONG_SOUND_ASSETS);
}

/**
 * Helper to play paddle hit sound with intensity variation
 *
 * Plays different sound based on ball speed for more dynamic feedback.
 *
 * @param sfxEngine - The SFX Engine instance
 * @param speedMultiplier - Current ball speed multiplier (1.0 = normal speed)
 *
 * @example
 * ```tsx
 * // After paddle collision
 * playPaddleHitSound(sfx, state.gameSpecific.ball.speedMultiplier);
 * ```
 */
export function playPaddleHitSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  speedMultiplier: number = 1.0
): void {
  // Use hard hit sound for high-speed balls (1.5x or faster)
  const soundId = speedMultiplier >= 1.5 ? PongSoundType.PADDLE_HIT_HARD : PongSoundType.PADDLE_HIT;

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
 * // After wall collision
 * playWallBounceSound(sfx);
 * ```
 */
export function playWallBounceSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.WALL_BOUNCE,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play score sound (when player scores)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // When player scores a goal
 * playScoreSound(sfx);
 * ```
 */
export function playScoreSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.SCORE,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play opponent goal sound (when opponent scores)
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // When opponent scores a goal
 * playOpponentScoreSound(sfx);
 * ```
 */
export function playOpponentScoreSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.GOAL_OPPONENT,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play serve sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // When ball is served
 * playServeSound(sfx);
 * ```
 */
export function playServeSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.SERVE,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play game start sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // When game starts
 * playGameStartSound(sfx);
 * ```
 */
export function playGameStartSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.GAME_START,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play game end sound
 *
 * @param sfxEngine - The SFX Engine instance
 * @param didWin - Whether the player won or lost
 *
 * @example
 * ```tsx
 * // When game ends
 * playGameEndSound(sfx, playerWon);
 * ```
 */
export function playGameEndSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  didWin: boolean
): void {
  const soundId = didWin ? PongSoundType.GAME_END_WIN : PongSoundType.GAME_END_LOSE;

  sfxEngine.play({
    id: soundId,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play rally milestone sound
 *
 * Plays different sounds based on rally length for progression feedback.
 *
 * @param sfxEngine - The SFX Engine instance
 * @param rallyCount - Current rally count (number of consecutive hits)
 *
 * @example
 * ```tsx
 * // After each successful rally hit
 * playRallySound(sfx, state.gameSpecific.currentRally);
 * ```
 */
export function playRallySound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  rallyCount: number
): void {
  // Play milestone sound every 10 hits
  if (rallyCount > 0 && rallyCount % 10 === 0) {
    // Long rally sound for 20+ hits
    if (rallyCount >= 20) {
      sfxEngine.play({
        id: PongSoundType.LONG_RALLY,
        priority: SoundPriority.NORMAL,
      });
    } else {
      sfxEngine.play({
        id: PongSoundType.RALLY_MILESTONE,
        priority: SoundPriority.NORMAL,
      });
    }
  }
}

/**
 * Helper to play speed up notification sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * // When ball speed increases significantly
 * playSpeedUpSound(sfx);
 * ```
 */
export function playSpeedUpSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: PongSoundType.SPEED_UP,
    priority: SoundPriority.LOW,
  });
}

// Export all sound types and helpers
export default {
  PongSoundType,
  PONG_SOUND_ASSETS,
  initializePongSounds,
  playPaddleHitSound,
  playWallBounceSound,
  playScoreSound,
  playOpponentScoreSound,
  playServeSound,
  playGameStartSound,
  playGameEndSound,
  playRallySound,
  playSpeedUpSound,
};
