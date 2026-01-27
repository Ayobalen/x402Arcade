/**
 * useAudio - React hook for audio management
 *
 * Features:
 * - Auto-initialization on mount
 * - User interaction tracking for audio unlock
 * - Reactive state updates
 * - Easy sound loading and playback
 *
 * @module useAudio
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { audioManager, AudioOptions, AudioCategory } from '../utils/AudioManager';

/**
 * Audio state interface
 */
interface AudioState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isMuted: boolean;
  isEnabled: boolean;
  masterVolume: number;
}

/**
 * Hook return type
 */
interface UseAudioReturn extends AudioState {
  initialize: () => Promise<boolean>;
  unlock: () => Promise<boolean>;
  play: (id: string, options?: AudioOptions) => number | null;
  stop: (id: string, soundId?: number) => void;
  pause: (id: string, soundId?: number) => void;
  resume: (id: string, soundId?: number) => void;
  loadSound: (id: string, src: string | string[], options?: AudioOptions) => Promise<void>;
  unloadSound: (id: string) => void;
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  getCategoryVolume: (category: AudioCategory) => number;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => boolean;
  enable: () => void;
  disable: () => void;
  stopAll: () => void;
  unloadAll: () => void;
}

/**
 * Main audio hook
 *
 * @param autoInitialize - Whether to auto-initialize on mount (default: true)
 * @param autoUnlock - Whether to auto-unlock on first user interaction (default: true)
 * @returns Audio state and control functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const audio = useAudio();
 *
 *   useEffect(() => {
 *     audio.loadSound('click', '/sounds/click.mp3', { category: AudioCategory.UI });
 *   }, []);
 *
 *   const handleClick = () => {
 *     audio.play('click');
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useAudio(
  autoInitialize = true,
  autoUnlock = true
): UseAudioReturn {
  const [state, setState] = useState<AudioState>({
    isInitialized: audioManager.getIsInitialized(),
    isUnlocked: audioManager.getIsUnlocked(),
    isMuted: audioManager.getIsMuted(),
    isEnabled: audioManager.getIsEnabled(),
    masterVolume: audioManager.getMasterVolume(),
  });

  const hasAttemptedUnlock = useRef(false);

  /**
   * Update state from audio manager
   */
  const updateState = useCallback(() => {
    setState({
      isInitialized: audioManager.getIsInitialized(),
      isUnlocked: audioManager.getIsUnlocked(),
      isMuted: audioManager.getIsMuted(),
      isEnabled: audioManager.getIsEnabled(),
      masterVolume: audioManager.getMasterVolume(),
    });
  }, []);

  /**
   * Initialize audio
   */
  const initialize = useCallback(async () => {
    const success = await audioManager.initialize();
    updateState();
    return success;
  }, [updateState]);

  /**
   * Unlock audio
   */
  const unlock = useCallback(async () => {
    const success = await audioManager.unlock();
    updateState();
    return success;
  }, [updateState]);

  /**
   * Play sound
   */
  const play = useCallback((id: string, options?: AudioOptions) => {
    return audioManager.play(id, options);
  }, []);

  /**
   * Stop sound
   */
  const stop = useCallback((id: string, soundId?: number) => {
    audioManager.stop(id, soundId);
  }, []);

  /**
   * Pause sound
   */
  const pause = useCallback((id: string, soundId?: number) => {
    audioManager.pause(id, soundId);
  }, []);

  /**
   * Resume sound
   */
  const resume = useCallback((id: string, soundId?: number) => {
    audioManager.resume(id, soundId);
  }, []);

  /**
   * Load sound
   */
  const loadSound = useCallback(
    async (id: string, src: string | string[], options?: AudioOptions) => {
      await audioManager.loadSound(id, src, options);
    },
    []
  );

  /**
   * Unload sound
   */
  const unloadSound = useCallback((id: string) => {
    audioManager.unloadSound(id);
  }, []);

  /**
   * Set master volume
   */
  const setMasterVolume = useCallback(
    (volume: number) => {
      audioManager.setMasterVolume(volume);
      updateState();
    },
    [updateState]
  );

  /**
   * Set category volume
   */
  const setCategoryVolume = useCallback((category: AudioCategory, volume: number) => {
    audioManager.setCategoryVolume(category, volume);
  }, []);

  /**
   * Get category volume
   */
  const getCategoryVolume = useCallback((category: AudioCategory) => {
    return audioManager.getCategoryVolume(category);
  }, []);

  /**
   * Mute audio - optimized for instant UI update
   */
  const mute = useCallback(() => {
    audioManager.mute();
    // Optimized: Only update muted state, don't read all properties
    flushSync(() => {
      setState((prev) => ({ ...prev, isMuted: true }));
    });
  }, []);

  /**
   * Unmute audio - optimized for instant UI update
   */
  const unmute = useCallback(() => {
    audioManager.unmute();
    // Optimized: Only update muted state, don't read all properties
    flushSync(() => {
      setState((prev) => ({ ...prev, isMuted: false }));
    });
  }, []);

  /**
   * Toggle mute - optimized for instant UI update
   */
  const toggleMute = useCallback(() => {
    const muted = audioManager.toggleMute();
    // Optimized: Only update muted state, don't read all properties
    flushSync(() => {
      setState((prev) => ({ ...prev, isMuted: muted }));
    });
    return muted;
  }, []);

  /**
   * Enable audio
   */
  const enable = useCallback(() => {
    audioManager.enable();
    updateState();
  }, [updateState]);

  /**
   * Disable audio
   */
  const disable = useCallback(() => {
    audioManager.disable();
    updateState();
  }, [updateState]);

  /**
   * Stop all sounds
   */
  const stopAll = useCallback(() => {
    audioManager.stopAll();
  }, []);

  /**
   * Unload all sounds
   */
  const unloadAll = useCallback(() => {
    audioManager.unloadAll();
  }, []);

  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInitialize && !state.isInitialized) {
      initialize();
    }
  }, [autoInitialize, state.isInitialized, initialize]);

  /**
   * Auto-unlock on first user interaction
   */
  useEffect(() => {
    if (!autoUnlock || state.isUnlocked || hasAttemptedUnlock.current) {
      return;
    }

    const unlockOnInteraction = async () => {
      if (hasAttemptedUnlock.current) return;

      hasAttemptedUnlock.current = true;
      await unlock();

      // Remove listeners after first unlock
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
    };

    // Listen for user interactions
    document.addEventListener('click', unlockOnInteraction, { once: true });
    document.addEventListener('touchstart', unlockOnInteraction, { once: true });
    document.addEventListener('keydown', unlockOnInteraction, { once: true });

    return () => {
      document.removeEventListener('click', unlockOnInteraction);
      document.removeEventListener('touchstart', unlockOnInteraction);
      document.removeEventListener('keydown', unlockOnInteraction);
    };
  }, [autoUnlock, state.isUnlocked, unlock]);

  return {
    ...state,
    initialize,
    unlock,
    play,
    stop,
    pause,
    resume,
    loadSound,
    unloadSound,
    setMasterVolume,
    setCategoryVolume,
    getCategoryVolume,
    mute,
    unmute,
    toggleMute,
    enable,
    disable,
    stopAll,
    unloadAll,
  };
}

/**
 * Hook for loading a single sound
 *
 * @param id - Sound identifier
 * @param src - Sound file path(s)
 * @param options - Audio options
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { play, isLoaded } = useSound('click', '/sounds/click.mp3', {
 *     category: AudioCategory.UI,
 *   });
 *
 *   return (
 *     <button onClick={() => play()} disabled={!isLoaded}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useSound(
  id: string,
  src: string | string[],
  options?: AudioOptions
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Load sound on mount
   */
  useEffect(() => {
    let mounted = true;

    audioManager
      .loadSound(id, src, options)
      .then(() => {
        if (mounted) {
          setIsLoaded(true);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
        }
      });

    return () => {
      mounted = false;
      audioManager.unloadSound(id);
    };
  }, [id, src, options]);

  /**
   * Play sound
   */
  const play = useCallback(
    (playOptions?: AudioOptions) => {
      return audioManager.play(id, playOptions);
    },
    [id]
  );

  /**
   * Stop sound
   */
  const stop = useCallback(
    (soundId?: number) => {
      audioManager.stop(id, soundId);
    },
    [id]
  );

  /**
   * Pause sound
   */
  const pause = useCallback(
    (soundId?: number) => {
      audioManager.pause(id, soundId);
    },
    [id]
  );

  /**
   * Resume sound
   */
  const resume = useCallback(
    (soundId?: number) => {
      audioManager.resume(id, soundId);
    },
    [id]
  );

  return {
    play,
    stop,
    pause,
    resume,
    isLoaded,
    error,
  };
}

/**
 * Hook for background music management
 *
 * @param id - Music track identifier
 * @param src - Music file path(s)
 * @param options - Audio options (loop is enabled by default)
 *
 * @example
 * ```tsx
 * function Game() {
 *   const music = useBackgroundMusic('game-music', '/music/game-theme.mp3');
 *
 *   useEffect(() => {
 *     music.play();
 *     return () => music.stop();
 *   }, []);
 *
 *   return <div>Game content...</div>;
 * }
 * ```
 */
export function useBackgroundMusic(
  id: string,
  src: string | string[],
  options?: Omit<AudioOptions, 'loop' | 'category'>
) {
  return useSound(id, src, {
    ...options,
    loop: true,
    category: AudioCategory.MUSIC,
  });
}

/**
 * Hook for UI sound effects
 *
 * @param sounds - Map of sound IDs to file paths
 *
 * @example
 * ```tsx
 * function Menu() {
 *   const sfx = useUISounds({
 *     click: '/sounds/click.mp3',
 *     hover: '/sounds/hover.mp3',
 *     success: '/sounds/success.mp3',
 *   });
 *
 *   return (
 *     <button
 *       onClick={() => sfx.play('click')}
 *       onMouseEnter={() => sfx.play('hover')}
 *     >
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */
export function useUISounds(sounds: Record<string, string | string[]>) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      const promises = Object.entries(sounds).map(([id, src]) =>
        audioManager.loadSound(id, src, { category: AudioCategory.UI })
      );

      try {
        await Promise.all(promises);
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('[useUISounds] Failed to load sounds:', error);
      }
    };

    loadAll();

    return () => {
      mounted = false;
      Object.keys(sounds).forEach((id) => {
        audioManager.unloadSound(id);
      });
    };
  }, [sounds]);

  const play = useCallback(
    (id: string, options?: AudioOptions) => {
      return audioManager.play(id, { ...options, category: AudioCategory.UI });
    },
    []
  );

  return { play, isLoaded };
}
