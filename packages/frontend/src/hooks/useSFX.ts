/**
 * React hooks for SFX Engine
 *
 * Provides convenient hooks for managing sound effects in React components
 *
 * @module useSFX
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  type SFXEngine,
  getSFXEngine,
  type SoundAsset,
  type SoundPlayRequest,
  SoundPriority,
  type CacheStats,
  type PlaybackStats,
} from '../utils/SFXEngine';

/**
 * Main SFX hook - provides access to the SFX Engine
 *
 * @example
 * ```tsx
 * function GameComponent() {
 *   const sfx = useSFX();
 *
 *   useEffect(() => {
 *     // Add sounds
 *     sfx.addSound({
 *       id: 'jump',
 *       src: '/sounds/jump.mp3',
 *       category: AudioCategory.SFX,
 *       preload: true,
 *     });
 *   }, []);
 *
 *   const handleJump = () => {
 *     sfx.play({ id: 'jump', priority: SoundPriority.HIGH });
 *   };
 *
 *   return <button onClick={handleJump}>Jump</button>;
 * }
 * ```
 */
export function useSFX() {
  const engineRef = useRef<SFXEngine>(getSFXEngine());
  const engine = engineRef.current;

  return {
    /**
     * Add a sound asset
     */
    addSound: useCallback((asset: SoundAsset) => engine.addSound(asset), [engine]),

    /**
     * Add multiple sound assets
     */
    addSounds: useCallback((assets: SoundAsset[]) => engine.addSounds(assets), [engine]),

    /**
     * Play a sound
     */
    play: useCallback((request: SoundPlayRequest) => engine.play(request), [engine]),

    /**
     * Stop a sound
     */
    stop: useCallback((id: string, soundId?: number) => engine.stop(id, soundId), [engine]),

    /**
     * Stop all sounds
     */
    stopAll: useCallback(() => engine.stopAll(), [engine]),

    /**
     * Load a sound
     */
    load: useCallback((id: string) => engine.load(id), [engine]),

    /**
     * Unload a sound
     */
    unload: useCallback((id: string) => engine.unload(id), [engine]),

    /**
     * Unload all sounds
     */
    unloadAll: useCallback(() => engine.unloadAll(), [engine]),

    /**
     * Preload sounds for a game
     */
    preloadForGame: useCallback(
      (gameId: string, soundIds: string[]) => engine.preloadForGame(gameId, soundIds),
      [engine]
    ),

    /**
     * Check if a sound is loaded
     */
    isLoaded: useCallback((id: string) => engine.isLoaded(id), [engine]),

    /**
     * Check if a sound is playing
     */
    isPlaying: useCallback((id: string) => engine.isPlaying(id), [engine]),

    /**
     * Get cache statistics
     */
    getCacheStats: useCallback(() => engine.getCacheStats(), [engine]),

    /**
     * Get playback statistics
     */
    getPlaybackStats: useCallback(() => engine.getPlaybackStats(), [engine]),
  };
}

/**
 * Hook for a single sound effect
 *
 * Automatically loads the sound on mount and unloads on unmount
 *
 * @example
 * ```tsx
 * function ButtonComponent() {
 *   const { play, isLoading } = useSoundEffect({
 *     id: 'button-click',
 *     src: '/sounds/click.mp3',
 *     preload: true,
 *   });
 *
 *   const handleClick = () => {
 *     play({ priority: SoundPriority.HIGH });
 *   };
 *
 *   return (
 *     <button onClick={handleClick} disabled={isLoading}>
 *       Click me!
 *     </button>
 *   );
 * }
 * ```
 */
export function useSoundEffect(asset: SoundAsset) {
  const engineRef = useRef<SFXEngine>(getSFXEngine());
  const engine = engineRef.current;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load sound on mount
  useEffect(() => {
    let mounted = true;

    const loadSound = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await engine.addSound(asset);
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSound();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (asset.id) {
        engine.unload(asset.id);
      }
    };
  }, [asset.id]); // Only reload if ID changes

  // Play function
  const play = useCallback(
    (options: Omit<SoundPlayRequest, 'id'> = {}) => {
      return engine.play({
        id: asset.id,
        ...options,
      });
    },
    [engine, asset.id]
  );

  // Stop function
  const stop = useCallback(
    (soundId?: number) => {
      engine.stop(asset.id, soundId);
    },
    [engine, asset.id]
  );

  return {
    play,
    stop,
    isLoading,
    isLoaded,
    error,
    isPlaying: engine.isPlaying(asset.id),
  };
}

/**
 * Hook for game-specific sound effects
 *
 * Automatically preloads all sounds for a game and manages cleanup
 *
 * @example
 * ```tsx
 * function SnakeGame() {
 *   const { play, isReady } = useGameSounds('snake', {
 *     eat: {
 *       id: 'snake-eat',
 *       src: '/sounds/snake/eat.mp3',
 *     },
 *     crash: {
 *       id: 'snake-crash',
 *       src: '/sounds/snake/crash.mp3',
 *     },
 *     move: {
 *       id: 'snake-move',
 *       src: '/sounds/snake/move.mp3',
 *     },
 *   });
 *
 *   const handleEat = () => {
 *     play('eat', { priority: SoundPriority.HIGH });
 *   };
 *
 *   if (!isReady) {
 *     return <div>Loading sounds...</div>;
 *   }
 *
 *   return <div onClick={handleEat}>Game</div>;
 * }
 * ```
 */
export function useGameSounds(gameId: string, sounds: Record<string, SoundAsset>) {
  const engineRef = useRef<SFXEngine>(getSFXEngine());
  const engine = engineRef.current;

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load all sounds on mount
  useEffect(() => {
    let mounted = true;

    const loadSounds = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Add all sound assets
        const assets = Object.values(sounds);
        await engine.addSounds(assets);

        // Preload for game
        const soundIds = assets.map((asset) => asset.id);
        await engine.preloadForGame(gameId, soundIds);

        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSounds();

    // Cleanup on unmount
    return () => {
      mounted = false;
      Object.keys(sounds).forEach((key) => {
        const asset = sounds[key];
        if (asset?.id) {
          engine.unload(asset.id);
        }
      });
    };
  }, [gameId]); // Only reload if gameId changes

  // Play function with sound key
  const play = useCallback(
    (key: string, options: Omit<SoundPlayRequest, 'id'> = {}) => {
      const asset = sounds[key];
      if (!asset) {
        // Silent fail for invalid keys
        return null;
      }
      return engine.play({
        id: asset.id,
        ...options,
      });
    },
    [engine, sounds]
  );

  // Stop function with sound key
  const stop = useCallback(
    (key: string, soundId?: number) => {
      const asset = sounds[key];
      if (!asset) {
        // Silent fail for invalid keys
        return;
      }
      engine.stop(asset.id, soundId);
    },
    [engine, sounds]
  );

  // Stop all game sounds
  const stopAll = useCallback(() => {
    Object.keys(sounds).forEach((key) => {
      const asset = sounds[key];
      if (asset?.id) {
        engine.stop(asset.id);
      }
    });
  }, [engine, sounds]);

  return {
    play,
    stop,
    stopAll,
    isReady,
    isLoading,
    error,
  };
}

/**
 * Hook for SFX engine statistics
 *
 * Provides real-time statistics about the SFX engine
 * Updates at specified interval
 *
 * @example
 * ```tsx
 * function DebugPanel() {
 *   const { cache, playback } = useSFXStats(1000); // Update every second
 *
 *   return (
 *     <div>
 *       <h3>Cache</h3>
 *       <p>Loaded: {cache.loaded}/{cache.maxSize}</p>
 *       <p>Hit Rate: {(cache.hitRate * 100).toFixed(1)}%</p>
 *       <p>Memory: {(cache.memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
 *
 *       <h3>Playback</h3>
 *       <p>Active: {playback.activeSounds}</p>
 *       <p>Total Plays: {playback.totalPlays}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSFXStats(updateInterval = 1000) {
  const engineRef = useRef<SFXEngine>(getSFXEngine());
  const engine = engineRef.current;

  const [cache, setCache] = useState<CacheStats>(engine.getCacheStats());
  const [playback, setPlayback] = useState<PlaybackStats>(engine.getPlaybackStats());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCache(engine.getCacheStats());
      setPlayback(engine.getPlaybackStats());
    }, updateInterval);

    return () => clearInterval(intervalId);
  }, [engine, updateInterval]);

  return {
    cache,
    playback,
  };
}

/**
 * Hook for sound variants with random selection
 *
 * Useful for creating variation in repetitive sounds
 *
 * @example
 * ```tsx
 * function FootstepComponent() {
 *   const { play } = useSoundVariants({
 *     id: 'footstep',
 *     variants: [
 *       { id: 'step1', src: '/sounds/step1.mp3', weight: 1 },
 *       { id: 'step2', src: '/sounds/step2.mp3', weight: 1 },
 *       { id: 'step3', src: '/sounds/step3.mp3', weight: 1 },
 *     ],
 *     preload: true,
 *   });
 *
 *   const handleStep = () => {
 *     play(); // Plays random variant
 *   };
 *
 *   return <button onClick={handleStep}>Step</button>;
 * }
 * ```
 */
export function useSoundVariants(asset: SoundAsset) {
  const engineRef = useRef<SFXEngine>(getSFXEngine());
  const engine = engineRef.current;

  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load sound on mount
  useEffect(() => {
    let mounted = true;

    const loadSound = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await engine.addSound(asset);
        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadSound();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (asset.id) {
        engine.unload(asset.id);
      }
    };
  }, [asset.id]);

  // Play random variant
  const play = useCallback(
    (options: Omit<SoundPlayRequest, 'id'> = {}) => {
      return engine.play({
        id: asset.id,
        ...options,
        // variantId is omitted to trigger random selection
      });
    },
    [engine, asset.id]
  );

  // Play specific variant
  const playVariant = useCallback(
    (variantId: string, options: Omit<SoundPlayRequest, 'id' | 'variantId'> = {}) => {
      return engine.play({
        id: asset.id,
        variantId,
        ...options,
      });
    },
    [engine, asset.id]
  );

  return {
    play,
    playVariant,
    isLoading,
    isLoaded,
    error,
  };
}

/**
 * Hook for UI interaction sounds
 *
 * Optimized for UI sounds with lower priority and deduplication
 *
 * @example
 * ```tsx
 * function ButtonComponent() {
 *   const playClick = useUISound({
 *     id: 'ui-click',
 *     src: '/sounds/ui/click.mp3',
 *   });
 *
 *   return <button onClick={playClick}>Click Me</button>;
 * }
 * ```
 */
export function useUISound(asset: SoundAsset) {
  const { play } = useSoundEffect({
    ...asset,
    category: asset.category,
    priority: SoundPriority.LOW,
  });

  const playUI = useCallback(() => {
    play({ priority: SoundPriority.LOW });
  }, [play]);

  return playUI;
}
