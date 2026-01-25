/**
 * TetrisSounds - Pre-configured sound effects for the Tetris game
 *
 * Features:
 * - Piece rotation sound
 * - Piece drop/lock sound (soft drop and hard drop)
 * - Line clear sound (with combo and Tetris variants)
 * - Level up sound
 * - Game over sound
 * - T-Spin special sound
 * - Hold piece sound
 *
 * All sounds are managed through SFXEngine with SFX category and appropriate priority.
 *
 * @module games/tetris/TetrisSounds
 */

import { type SoundAsset, SoundPriority } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';

/**
 * Tetris game sound types
 */
export enum TetrisSoundType {
  // Core gameplay sounds
  ROTATE = 'tetris:rotate',
  MOVE = 'tetris:move',
  SOFT_DROP = 'tetris:softdrop',
  HARD_DROP = 'tetris:harddrop',
  LOCK = 'tetris:lock',
  HOLD = 'tetris:hold',

  // Line clear sounds
  CLEAR_SINGLE = 'tetris:clear:single',
  CLEAR_DOUBLE = 'tetris:clear:double',
  CLEAR_TRIPLE = 'tetris:clear:triple',
  CLEAR_TETRIS = 'tetris:clear:tetris', // 4-line clear (special!)

  // Special clears
  TSPIN = 'tetris:tspin',
  BACK_TO_BACK = 'tetris:backtoback',

  // Combo sounds
  COMBO_START = 'tetris:combo:start',
  COMBO_CONTINUE = 'tetris:combo:continue',
  COMBO_BREAK = 'tetris:combo:break',

  // Game flow sounds
  LEVEL_UP = 'tetris:levelup',
  GAME_START = 'tetris:game:start',
  GAME_OVER = 'tetris:game:over',
  TOP_OUT = 'tetris:topout', // When blocks reach the top
}

/**
 * Tetris sound asset definitions
 *
 * Note: These paths point to audio files that should be placed in public/sounds/games/tetris/
 * For development, you can:
 * 1. Use jsfxr (https://sfxr.me/) to generate retro game sounds
 * 2. Use free sound libraries like freesound.org
 * 3. Use royalty-free 8-bit/retro sound packs
 *
 * Recommended format: .mp3 or .ogg for cross-browser compatibility
 * Recommended size: < 50KB per sound
 *
 * Sound design guidelines:
 * - Rotate: Quick click or beep (50-100ms)
 * - Lock: Satisfying "thunk" or "lock" sound (100-150ms)
 * - Line clear: Ascending tones, intensity based on lines cleared
 * - Tetris (4-line): Triumphant fanfare (500-800ms)
 * - T-Spin: Special effect sound (300-500ms)
 * - Level up: Ascending arpeggio (500-1000ms)
 * - Game over: Descending tone (1000-2000ms)
 */
export const TETRIS_SOUND_ASSETS: SoundAsset[] = [
  // Core gameplay sounds
  {
    id: TetrisSoundType.ROTATE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/rotate.mp3',
    volume: 0.3,
    priority: SoundPriority.LOW,
    maxInstances: 3,
    preload: true,
  },
  {
    id: TetrisSoundType.MOVE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/move.mp3',
    volume: 0.2,
    priority: SoundPriority.LOW,
    maxInstances: 2,
    preload: false, // Optional sound, not critical
  },
  {
    id: TetrisSoundType.SOFT_DROP,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/soft-drop.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.HARD_DROP,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/hard-drop.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.LOCK,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/lock.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.HOLD,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/hold.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 1,
    preload: true,
  },

  // Line clear sounds
  {
    id: TetrisSoundType.CLEAR_SINGLE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/clear-single.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.CLEAR_DOUBLE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/clear-double.mp3',
    volume: 0.7,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.CLEAR_TRIPLE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/clear-triple.mp3',
    volume: 0.75,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.CLEAR_TETRIS,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/clear-tetris.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },

  // Special clears
  {
    id: TetrisSoundType.TSPIN,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/tspin.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.BACK_TO_BACK,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/back-to-back.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },

  // Combo sounds
  {
    id: TetrisSoundType.COMBO_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/combo-start.mp3',
    volume: 0.5,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.COMBO_CONTINUE,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/combo-continue.mp3',
    volume: 0.6,
    priority: SoundPriority.NORMAL,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.COMBO_BREAK,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/combo-break.mp3',
    volume: 0.4,
    priority: SoundPriority.LOW,
    maxInstances: 1,
    preload: false,
  },

  // Game flow sounds
  {
    id: TetrisSoundType.LEVEL_UP,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/level-up.mp3',
    volume: 0.8,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.GAME_START,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/game-start.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.GAME_OVER,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/game-over.mp3',
    volume: 0.7,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
  {
    id: TetrisSoundType.TOP_OUT,
    category: AudioCategory.SFX,
    src: '/sounds/games/tetris/top-out.mp3',
    volume: 0.6,
    priority: SoundPriority.HIGH,
    maxInstances: 1,
    preload: true,
  },
];

/**
 * Helper to initialize Tetris sounds in the SFX Engine
 *
 * Call this once when the Tetris game component mounts.
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * import { useSFX } from '@/hooks/useSFX';
 * import { initializeTetrisSounds } from './TetrisSounds';
 *
 * function TetrisGame() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     initializeTetrisSounds(sfx);
 *   }, []);
 * }
 * ```
 */
export function initializeTetrisSounds(sfxEngine: {
  addSounds: (assets: SoundAsset[]) => void;
}): void {
  sfxEngine.addSounds(TETRIS_SOUND_ASSETS);
}

/**
 * Helper to play rotation sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playRotateSound(sfx);
 * ```
 */
export function playRotateSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: TetrisSoundType.ROTATE,
    priority: SoundPriority.LOW,
  });
}

/**
 * Helper to play piece lock sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playLockSound(sfx);
 * ```
 */
export function playLockSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: TetrisSoundType.LOCK,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play hard drop sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playHardDropSound(sfx);
 * ```
 */
export function playHardDropSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: TetrisSoundType.HARD_DROP,
    priority: SoundPriority.NORMAL,
  });
}

/**
 * Helper to play line clear sound with intensity variation
 *
 * Plays different sound based on number of lines cleared:
 * - 1 line: Single clear sound
 * - 2 lines: Double clear sound
 * - 3 lines: Triple clear sound
 * - 4 lines: Tetris! (special celebration sound)
 *
 * @param sfxEngine - The SFX Engine instance
 * @param linesCleared - Number of lines cleared (1-4)
 * @param isTSpin - Whether this was a T-Spin clear
 * @param isBackToBack - Whether this was a back-to-back difficult clear
 *
 * @example
 * ```tsx
 * // Regular single line clear
 * playLineClearSound(sfx, 1, false, false);
 *
 * // Tetris (4 lines)!
 * playLineClearSound(sfx, 4, false, false);
 *
 * // T-Spin Triple!
 * playLineClearSound(sfx, 3, true, false);
 * ```
 */
export function playLineClearSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  linesCleared: number,
  isTSpin: boolean = false,
  isBackToBack: boolean = false
): void {
  // T-Spin sound has highest priority
  if (isTSpin) {
    sfxEngine.play({
      id: TetrisSoundType.TSPIN,
      priority: SoundPriority.HIGH,
    });
    return;
  }

  // Select sound based on lines cleared
  let soundId: TetrisSoundType;
  let priority = SoundPriority.NORMAL;

  switch (linesCleared) {
    case 4:
      soundId = TetrisSoundType.CLEAR_TETRIS;
      priority = SoundPriority.HIGH; // Tetris is special!
      break;
    case 3:
      soundId = TetrisSoundType.CLEAR_TRIPLE;
      break;
    case 2:
      soundId = TetrisSoundType.CLEAR_DOUBLE;
      break;
    case 1:
    default:
      soundId = TetrisSoundType.CLEAR_SINGLE;
      break;
  }

  sfxEngine.play({
    id: soundId,
    priority,
  });

  // Play back-to-back sound if applicable
  if (isBackToBack && linesCleared >= 4) {
    setTimeout(() => {
      sfxEngine.play({
        id: TetrisSoundType.BACK_TO_BACK,
        priority: SoundPriority.NORMAL,
      });
    }, 200); // Slight delay for layered effect
  }
}

/**
 * Helper to play combo sound
 *
 * Plays different sound based on combo count for progression feedback.
 *
 * @param sfxEngine - The SFX Engine instance
 * @param combo - Current combo count
 * @param comboJustBroke - Whether combo just ended
 *
 * @example
 * ```tsx
 * // First combo
 * playComboSound(sfx, 1, false);
 *
 * // Combo continuing
 * playComboSound(sfx, 5, false);
 *
 * // Combo broke
 * playComboSound(sfx, 0, true);
 * ```
 */
export function playComboSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  combo: number,
  comboJustBroke: boolean = false
): void {
  if (comboJustBroke && combo === 0) {
    sfxEngine.play({
      id: TetrisSoundType.COMBO_BREAK,
      priority: SoundPriority.LOW,
    });
    return;
  }

  if (combo === 1) {
    sfxEngine.play({
      id: TetrisSoundType.COMBO_START,
      priority: SoundPriority.NORMAL,
    });
  } else if (combo > 1 && combo % 3 === 0) {
    // Every 3rd combo
    sfxEngine.play({
      id: TetrisSoundType.COMBO_CONTINUE,
      priority: SoundPriority.NORMAL,
    });
  }
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
    id: TetrisSoundType.LEVEL_UP,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play game start sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playGameStartSound(sfx);
 * ```
 */
export function playGameStartSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: TetrisSoundType.GAME_START,
    priority: SoundPriority.HIGH,
  });
}

/**
 * Helper to play game over sound
 *
 * @param sfxEngine - The SFX Engine instance
 * @param isTopOut - Whether game ended from top-out (blocks reached top)
 *
 * @example
 * ```tsx
 * // Normal game over
 * playGameOverSound(sfx, false);
 *
 * // Top-out game over
 * playGameOverSound(sfx, true);
 * ```
 */
export function playGameOverSound(
  sfxEngine: { play: (request: { id: string; priority?: number }) => void },
  isTopOut: boolean = false
): void {
  if (isTopOut) {
    // Play top-out sound first
    sfxEngine.play({
      id: TetrisSoundType.TOP_OUT,
      priority: SoundPriority.HIGH,
    });

    // Follow with game over sound
    setTimeout(() => {
      sfxEngine.play({
        id: TetrisSoundType.GAME_OVER,
        priority: SoundPriority.HIGH,
      });
    }, 300);
  } else {
    sfxEngine.play({
      id: TetrisSoundType.GAME_OVER,
      priority: SoundPriority.HIGH,
    });
  }
}

/**
 * Helper to play hold piece sound
 *
 * @param sfxEngine - The SFX Engine instance
 *
 * @example
 * ```tsx
 * playHoldSound(sfx);
 * ```
 */
export function playHoldSound(sfxEngine: {
  play: (request: { id: string; priority?: number }) => void;
}): void {
  sfxEngine.play({
    id: TetrisSoundType.HOLD,
    priority: SoundPriority.LOW,
  });
}

// Export all sound types and helpers
export default {
  TetrisSoundType,
  TETRIS_SOUND_ASSETS,
  initializeTetrisSounds,
  playRotateSound,
  playLockSound,
  playHardDropSound,
  playLineClearSound,
  playComboSound,
  playLevelUpSound,
  playGameStartSound,
  playGameOverSound,
  playHoldSound,
};
