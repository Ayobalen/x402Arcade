/**
 * Tests for SFX hooks
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useSFX,
  useSoundEffect,
  useGameSounds,
  useSFXStats,
  useSoundVariants,
  useUISound,
} from '../useSFX';
import { SFXEngine } from '../../utils/SFXEngine';
import { AudioCategory } from '../../utils/AudioManager';

// Mock SFXEngine
vi.mock('../../utils/SFXEngine', () => {
  const mockEngine = {
    addSound: vi.fn().mockResolvedValue(undefined),
    addSounds: vi.fn().mockResolvedValue(undefined),
    play: vi.fn().mockResolvedValue(1),
    stop: vi.fn(),
    stopAll: vi.fn(),
    load: vi.fn().mockResolvedValue(undefined),
    unload: vi.fn(),
    unloadAll: vi.fn(),
    preloadForGame: vi.fn().mockResolvedValue(undefined),
    isLoaded: vi.fn().mockReturnValue(true),
    isPlaying: vi.fn().mockReturnValue(false),
    getCacheStats: vi.fn().mockReturnValue({
      loaded: 5,
      maxSize: 50,
      memoryUsage: 1024 * 1024,
      evictions: 0,
      hits: 10,
      misses: 2,
      hitRate: 0.833,
    }),
    getPlaybackStats: vi.fn().mockReturnValue({
      totalPlays: 100,
      activeSounds: 2,
      queuedByPriority: { 0: 0, 1: 1, 2: 0, 3: 0 },
      topSounds: [{ id: 'test', plays: 50 }],
    }),
  };

  return {
    SFXEngine: {
      getInstance: vi.fn(() => mockEngine),
      resetInstance: vi.fn(),
    },
    getSFXEngine: vi.fn(() => mockEngine),
    SoundPriority: {
      LOW: 0,
      NORMAL: 1,
      HIGH: 2,
      CRITICAL: 3,
    },
  };
});

// Mock AudioManager
vi.mock('../../utils/AudioManager', () => ({
  AudioManager: {
    getInstance: vi.fn(() => ({})),
  },
  AudioCategory: {
    SFX: 'sfx',
    MUSIC: 'music',
    VOICE: 'voice',
    UI: 'ui',
  },
}));

describe('useSFX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide SFX engine methods', () => {
    const { result } = renderHook(() => useSFX());

    expect(result.current).toHaveProperty('addSound');
    expect(result.current).toHaveProperty('addSounds');
    expect(result.current).toHaveProperty('play');
    expect(result.current).toHaveProperty('stop');
    expect(result.current).toHaveProperty('stopAll');
    expect(result.current).toHaveProperty('load');
    expect(result.current).toHaveProperty('unload');
    expect(result.current).toHaveProperty('unloadAll');
    expect(result.current).toHaveProperty('preloadForGame');
    expect(result.current).toHaveProperty('isLoaded');
    expect(result.current).toHaveProperty('isPlaying');
    expect(result.current).toHaveProperty('getCacheStats');
    expect(result.current).toHaveProperty('getPlaybackStats');
  });

  it('should call engine methods', async () => {
    const { result } = renderHook(() => useSFX());
    const mockEngine = SFXEngine.getInstance();

    await result.current.addSound({
      id: 'test',
      src: '/test.mp3',
    });

    expect(mockEngine.addSound).toHaveBeenCalledWith({
      id: 'test',
      src: '/test.mp3',
    });
  });

  it('should play sounds', async () => {
    const { result } = renderHook(() => useSFX());
    const mockEngine = SFXEngine.getInstance();

    await result.current.play({ id: 'test' });

    expect(mockEngine.play).toHaveBeenCalledWith({ id: 'test' });
  });
});

describe('useSoundEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load sound on mount', async () => {
    const mockEngine = SFXEngine.getInstance();

    renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSound).toHaveBeenCalledWith({
        id: 'test-sound',
        src: '/sounds/test.mp3',
        preload: true,
      });
    });
  });

  it('should provide loading state', async () => {
    const { result } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isLoaded).toBe(true);
    });
  });

  it('should play sound', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await result.current.play();

    expect(mockEngine.play).toHaveBeenCalledWith({
      id: 'test-sound',
    });
  });

  it('should play with options', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await result.current.play({
      volume: 0.5,
      rate: 1.5,
    });

    expect(mockEngine.play).toHaveBeenCalledWith({
      id: 'test-sound',
      volume: 0.5,
      rate: 1.5,
    });
  });

  it('should stop sound', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    result.current.stop(1);

    expect(mockEngine.stop).toHaveBeenCalledWith('test-sound', 1);
  });

  it('should unload sound on unmount', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { unmount } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSound).toHaveBeenCalled();
    });

    unmount();

    expect(mockEngine.unload).toHaveBeenCalledWith('test-sound');
  });

  it('should handle errors', async () => {
    const mockEngine = SFXEngine.getInstance();
    (mockEngine.addSound as any).mockRejectedValueOnce(new Error('Failed to load'));

    const { result } = renderHook(() =>
      useSoundEffect({
        id: 'test-sound',
        src: '/sounds/test.mp3',
      })
    );

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.message).toBe('Failed to load');
    });
  });
});

describe('useGameSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load game sounds on mount', async () => {
    const mockEngine = SFXEngine.getInstance();

    renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
        crash: {
          id: 'snake-crash',
          src: '/sounds/snake/crash.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSounds).toHaveBeenCalled();
      expect(mockEngine.preloadForGame).toHaveBeenCalledWith('snake', ['snake-eat', 'snake-crash']);
    });
  });

  it('should provide ready state', async () => {
    const { result } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
      })
    );

    expect(result.current.isReady).toBe(false);

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });

  it('should play sound by key', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await result.current.play('eat');

    expect(mockEngine.play).toHaveBeenCalledWith({
      id: 'snake-eat',
    });
  });

  it('should stop sound by key', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    result.current.stop('eat');

    expect(mockEngine.stop).toHaveBeenCalledWith('snake-eat');
  });

  it('should stop all game sounds', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
        crash: {
          id: 'snake-crash',
          src: '/sounds/snake/crash.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    result.current.stopAll();

    expect(mockEngine.stop).toHaveBeenCalledWith('snake-eat');
    expect(mockEngine.stop).toHaveBeenCalledWith('snake-crash');
  });

  it('should unload sounds on unmount', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { unmount } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSounds).toHaveBeenCalled();
    });

    unmount();

    expect(mockEngine.unload).toHaveBeenCalledWith('snake-eat');
  });

  it('should handle non-existent sound key', async () => {
    const { result } = renderHook(() =>
      useGameSounds('snake', {
        eat: {
          id: 'snake-eat',
          src: '/sounds/snake/eat.mp3',
        },
      })
    );

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    // Should not throw error
    const soundId = await result.current.play('non-existent');
    expect(soundId).toBeNull();
  });
});

describe('useSFXStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide initial stats', () => {
    const { result } = renderHook(() => useSFXStats());

    expect(result.current.cache).toBeDefined();
    expect(result.current.playback).toBeDefined();
    expect(result.current.cache.loaded).toBe(5);
    expect(result.current.playback.totalPlays).toBe(100);
  });

  it('should update stats at interval', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() => useSFXStats(1000));

    // Initial values
    expect(result.current.cache.loaded).toBe(5);

    // Change mock return value
    (mockEngine.getCacheStats as any).mockReturnValue({
      loaded: 10,
      maxSize: 50,
      memoryUsage: 2 * 1024 * 1024,
      evictions: 1,
      hits: 20,
      misses: 3,
      hitRate: 0.87,
    });

    // Advance timers
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(result.current.cache.loaded).toBe(10);
    });
  });

  it('should use custom update interval', () => {
    const { rerender } = renderHook(({ interval }) => useSFXStats(interval), {
      initialProps: { interval: 500 },
    });

    const mockEngine = SFXEngine.getInstance();

    vi.advanceTimersByTime(500);

    expect(mockEngine.getCacheStats).toHaveBeenCalled();
    expect(mockEngine.getPlaybackStats).toHaveBeenCalled();
  });
});

describe('useSoundVariants', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load sound variants', async () => {
    const mockEngine = SFXEngine.getInstance();

    renderHook(() =>
      useSoundVariants({
        id: 'footstep',
        variants: [
          { id: 'step1', src: '/sounds/step1.mp3', weight: 1 },
          { id: 'step2', src: '/sounds/step2.mp3', weight: 1 },
        ],
        preload: true,
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSound).toHaveBeenCalledWith({
        id: 'footstep',
        variants: [
          { id: 'step1', src: '/sounds/step1.mp3', weight: 1 },
          { id: 'step2', src: '/sounds/step2.mp3', weight: 1 },
        ],
        preload: true,
      });
    });
  });

  it('should play random variant', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useSoundVariants({
        id: 'footstep',
        variants: [
          { id: 'step1', src: '/sounds/step1.mp3' },
          { id: 'step2', src: '/sounds/step2.mp3' },
        ],
        preload: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await result.current.play();

    expect(mockEngine.play).toHaveBeenCalledWith({
      id: 'footstep',
    });
  });

  it('should play specific variant', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useSoundVariants({
        id: 'footstep',
        variants: [
          { id: 'step1', src: '/sounds/step1.mp3' },
          { id: 'step2', src: '/sounds/step2.mp3' },
        ],
        preload: true,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    await result.current.playVariant('step1');

    expect(mockEngine.play).toHaveBeenCalledWith({
      id: 'footstep',
      variantId: 'step1',
    });
  });
});

describe('useUISound', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load UI sound', async () => {
    const mockEngine = SFXEngine.getInstance();

    renderHook(() =>
      useUISound({
        id: 'ui-click',
        src: '/sounds/ui/click.mp3',
      })
    );

    await waitFor(() => {
      expect(mockEngine.addSound).toHaveBeenCalled();
    });
  });

  it('should return play function', async () => {
    const { result } = renderHook(() =>
      useUISound({
        id: 'ui-click',
        src: '/sounds/ui/click.mp3',
      })
    );

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });
  });

  it('should play with low priority', async () => {
    const mockEngine = SFXEngine.getInstance();
    const { result } = renderHook(() =>
      useUISound({
        id: 'ui-click',
        src: '/sounds/ui/click.mp3',
      })
    );

    await waitFor(() => {
      expect(typeof result.current).toBe('function');
    });

    result.current();

    await waitFor(() => {
      expect(mockEngine.play).toHaveBeenCalled();
    });
  });
});
