/**
 * useMusic Hooks Test Suite
 *
 * Tests for music-related React hooks:
 * - useMusic
 * - useMusicTrack
 * - usePlaylist
 * - useGameStateMusic
 * - useMusicStats
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useMusic,
  useMusicTrack,
  usePlaylist,
  useGameStateMusic,
  useMusicStats,
} from '../useMusic';
import { GameState, MusicTrack, Playlist } from '../../utils/MusicManager';

// Mock MusicManager
const mockPlay = vi.fn();
const mockStop = vi.fn();
const mockPause = vi.fn();
const mockResume = vi.fn();
const mockCrossfade = vi.fn();
const mockFadeIn = vi.fn();
const mockFadeOut = vi.fn();
const mockAddTrack = vi.fn();
const mockAddTracks = vi.fn();
const mockPreloadTrack = vi.fn().mockResolvedValue(undefined);
const mockPreloadTracks = vi.fn().mockResolvedValue(undefined);
const mockUnloadTrack = vi.fn();
const mockUnloadAll = vi.fn();
const mockCreatePlaylist = vi.fn();
const mockPlayPlaylist = vi.fn();
const mockPlayNext = vi.fn();
const mockPlayPrevious = vi.fn();
const mockSetGameState = vi.fn();
const mockSetGameStateVolume = vi.fn();
const mockGetPlaybackState = vi.fn().mockReturnValue({
  currentTrack: null,
  isPlaying: false,
  isPaused: false,
  currentTime: 0,
  duration: 0,
  volume: 0,
  isLooping: false,
});
const mockGetStats = vi.fn().mockReturnValue({
  tracksLoaded: 0,
  totalTracks: 0,
  currentPlaylist: null,
  playbackHistory: [],
  memoryUsage: 0,
});
const mockGetCurrentTrackId = vi.fn().mockReturnValue(null);
const mockGetCurrentPlaylistId = vi.fn().mockReturnValue(null);

vi.mock('../../utils/MusicManager', () => ({
  musicManager: {
    play: mockPlay,
    stop: mockStop,
    pauseCurrentTrack: mockPause,
    resumeCurrentTrack: mockResume,
    crossfade: mockCrossfade,
    fadeIn: mockFadeIn,
    fadeOut: mockFadeOut,
    addTrack: mockAddTrack,
    addTracks: mockAddTracks,
    preloadTrack: mockPreloadTrack,
    preloadTracks: mockPreloadTracks,
    unloadTrack: mockUnloadTrack,
    unloadAll: mockUnloadAll,
    createPlaylist: mockCreatePlaylist,
    playPlaylist: mockPlayPlaylist,
    playNext: mockPlayNext,
    playPrevious: mockPlayPrevious,
    setGameState: mockSetGameState,
    setGameStateVolume: mockSetGameStateVolume,
    getPlaybackState: mockGetPlaybackState,
    getStats: mockGetStats,
    getCurrentTrackId: mockGetCurrentTrackId,
    getCurrentPlaylistId: mockGetCurrentPlaylistId,
  },
  GameState: {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
  },
}));

describe('useMusic Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMusic());

    expect(result.current.playbackState).toBeDefined();
    expect(result.current.stats).toBeDefined();
    expect(result.current.currentTrackId).toBeNull();
    expect(result.current.currentPlaylistId).toBeNull();
  });

  it('should provide track management functions', () => {
    const { result } = renderHook(() => useMusic());

    expect(typeof result.current.addTrack).toBe('function');
    expect(typeof result.current.addTracks).toBe('function');
    expect(typeof result.current.preloadTrack).toBe('function');
    expect(typeof result.current.preloadTracks).toBe('function');
    expect(typeof result.current.unloadTrack).toBe('function');
    expect(typeof result.current.unloadAll).toBe('function');
  });

  it('should provide playback control functions', () => {
    const { result } = renderHook(() => useMusic());

    expect(typeof result.current.play).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.pause).toBe('function');
    expect(typeof result.current.resume).toBe('function');
    expect(typeof result.current.crossfade).toBe('function');
    expect(typeof result.current.fadeIn).toBe('function');
    expect(typeof result.current.fadeOut).toBe('function');
  });

  it('should provide playlist management functions', () => {
    const { result } = renderHook(() => useMusic());

    expect(typeof result.current.createPlaylist).toBe('function');
    expect(typeof result.current.playPlaylist).toBe('function');
    expect(typeof result.current.playNext).toBe('function');
    expect(typeof result.current.playPrevious).toBe('function');
  });

  it('should provide game state functions', () => {
    const { result } = renderHook(() => useMusic());

    expect(typeof result.current.setGameState).toBe('function');
    expect(typeof result.current.setGameStateVolume).toBe('function');
  });

  it('should call addTrack', () => {
    const { result } = renderHook(() => useMusic());
    const track: MusicTrack = {
      id: 'test',
      src: '/test.mp3',
      name: 'Test',
    };

    act(() => {
      result.current.addTrack(track);
    });

    expect(mockAddTrack).toHaveBeenCalledWith(track);
  });

  it('should call play', () => {
    const { result } = renderHook(() => useMusic());

    act(() => {
      result.current.play('test-track');
    });

    expect(mockPlay).toHaveBeenCalledWith('test-track', undefined);
  });

  it('should call play with fade in options', () => {
    const { result } = renderHook(() => useMusic());
    const options = { fadeIn: { duration: 1000 } };

    act(() => {
      result.current.play('test-track', options);
    });

    expect(mockPlay).toHaveBeenCalledWith('test-track', options);
  });

  it('should call crossfade', () => {
    const { result } = renderHook(() => useMusic());

    act(() => {
      result.current.crossfade('track1', 'track2', { duration: 2000 });
    });

    expect(mockCrossfade).toHaveBeenCalledWith('track1', 'track2', {
      duration: 2000,
    });
  });

  it('should update state periodically', async () => {
    vi.useFakeTimers();

    mockGetPlaybackState.mockReturnValue({
      currentTrack: 'test-track',
      isPlaying: true,
      isPaused: false,
      currentTime: 10,
      duration: 120,
      volume: 0.7,
      isLooping: true,
    });

    const { result } = renderHook(() => useMusic());

    // Advance timers to trigger state update
    act(() => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.playbackState.currentTrack).toBe('test-track');
    });

    vi.useRealTimers();
  });
});

describe('useMusicTrack Hook', () => {
  const testTrack: MusicTrack = {
    id: 'test-track',
    src: '/music/test.mp3',
    name: 'Test Track',
    loop: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add and preload track on mount', async () => {
    renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(mockAddTrack).toHaveBeenCalledWith(testTrack);
      expect(mockPreloadTrack).toHaveBeenCalledWith(testTrack.id);
    });
  });

  it('should auto-play if specified', async () => {
    renderHook(() => useMusicTrack(testTrack, true));

    await waitFor(() => {
      expect(mockPlay).toHaveBeenCalledWith(testTrack.id);
    });
  });

  it('should provide play function', async () => {
    const { result } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.play();
    });

    expect(mockPlay).toHaveBeenCalledWith(testTrack.id);
  });

  it('should provide stop function', async () => {
    const { result } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.stop();
    });

    expect(mockStop).toHaveBeenCalledWith(testTrack.id);
  });

  it('should provide pause function', async () => {
    mockGetCurrentTrackId.mockReturnValue(testTrack.id);
    const { result } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.pause();
    });

    expect(mockPause).toHaveBeenCalled();
  });

  it('should provide resume function', async () => {
    mockGetCurrentTrackId.mockReturnValue(testTrack.id);
    const { result } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      result.current.resume();
    });

    expect(mockResume).toHaveBeenCalled();
  });

  it('should cleanup on unmount', async () => {
    const { unmount } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(mockAddTrack).toHaveBeenCalled();
    });

    unmount();

    expect(mockStop).toHaveBeenCalledWith(testTrack.id);
    expect(mockUnloadTrack).toHaveBeenCalledWith(testTrack.id);
  });

  it('should report playing state correctly', async () => {
    vi.useFakeTimers();

    mockGetPlaybackState.mockReturnValue({
      currentTrack: testTrack.id,
      isPlaying: true,
      isPaused: false,
      currentTime: 10,
      duration: 120,
      volume: 0.7,
      isLooping: true,
    });

    const { result } = renderHook(() => useMusicTrack(testTrack));

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.isPlaying).toBe(true);
    });

    vi.useRealTimers();
  });
});

describe('usePlaylist Hook', () => {
  const testPlaylist: Playlist = {
    id: 'test-playlist',
    name: 'Test Playlist',
    tracks: ['track1', 'track2', 'track3'],
    shuffle: false,
    loop: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create playlist on mount', () => {
    renderHook(() => usePlaylist(testPlaylist));

    expect(mockCreatePlaylist).toHaveBeenCalledWith(testPlaylist);
  });

  it('should auto-play if specified', () => {
    renderHook(() => usePlaylist(testPlaylist, true));

    expect(mockPlayPlaylist).toHaveBeenCalledWith(testPlaylist.id);
  });

  it('should provide play function', () => {
    const { result } = renderHook(() => usePlaylist(testPlaylist));

    act(() => {
      result.current.play({ shuffle: true, startIndex: 1 });
    });

    expect(mockPlayPlaylist).toHaveBeenCalledWith(testPlaylist.id, {
      shuffle: true,
      startIndex: 1,
    });
  });

  it('should provide playNext function', () => {
    mockGetCurrentPlaylistId.mockReturnValue(testPlaylist.id);
    const { result } = renderHook(() => usePlaylist(testPlaylist));

    act(() => {
      result.current.playNext();
    });

    expect(mockPlayNext).toHaveBeenCalled();
  });

  it('should provide playPrevious function', () => {
    mockGetCurrentPlaylistId.mockReturnValue(testPlaylist.id);
    const { result } = renderHook(() => usePlaylist(testPlaylist));

    act(() => {
      result.current.playPrevious();
    });

    expect(mockPlayPrevious).toHaveBeenCalled();
  });

  it('should not call playNext if playlist not active', () => {
    mockGetCurrentPlaylistId.mockReturnValue('different-playlist');
    const { result } = renderHook(() => usePlaylist(testPlaylist));

    act(() => {
      result.current.playNext();
    });

    expect(mockPlayNext).not.toHaveBeenCalled();
  });

  it('should report active state correctly', async () => {
    vi.useFakeTimers();

    mockGetCurrentPlaylistId.mockReturnValue(testPlaylist.id);
    mockGetCurrentTrackId.mockReturnValue('track1');

    const { result } = renderHook(() => usePlaylist(testPlaylist));

    act(() => {
      vi.advanceTimersByTime(150);
    });

    await waitFor(() => {
      expect(result.current.isActive).toBe(true);
      expect(result.current.currentTrackId).toBe('track1');
    });

    vi.useRealTimers();
  });

  it('should cleanup on unmount', () => {
    mockGetCurrentPlaylistId.mockReturnValue(testPlaylist.id);
    mockGetCurrentTrackId.mockReturnValue('track1');

    const { unmount } = renderHook(() => usePlaylist(testPlaylist));

    unmount();

    expect(mockStop).toHaveBeenCalledWith('track1');
  });
});

describe('useGameStateMusic Hook', () => {
  const tracksByState = {
    [GameState.MENU]: 'menu-theme',
    [GameState.PLAYING]: 'gameplay-theme',
    [GameState.PAUSED]: 'gameplay-theme',
    [GameState.GAME_OVER]: 'gameover-theme',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with menu state', () => {
    const { result } = renderHook(() => useGameStateMusic(tracksByState));

    expect(result.current.currentState).toBe(GameState.MENU);
  });

  it('should set custom volumes on mount', () => {
    const volumes = {
      [GameState.MENU]: 0.8,
      [GameState.PLAYING]: 0.5,
    };

    renderHook(() =>
      useGameStateMusic(tracksByState, { volumes })
    );

    expect(mockSetGameStateVolume).toHaveBeenCalledWith(GameState.MENU, 0.8);
    expect(mockSetGameStateVolume).toHaveBeenCalledWith(GameState.PLAYING, 0.5);
  });

  it('should preload all tracks if specified', () => {
    renderHook(() =>
      useGameStateMusic(tracksByState, { preloadAll: true })
    );

    expect(mockPreloadTracks).toHaveBeenCalledWith([
      'menu-theme',
      'gameplay-theme',
      'gameover-theme',
    ]);
  });

  it('should play track with fade in on first state change', () => {
    const { result } = renderHook(() => useGameStateMusic(tracksByState));

    act(() => {
      result.current.setGameState(GameState.MENU);
    });

    expect(mockPlay).toHaveBeenCalledWith('menu-theme', {
      fadeIn: { duration: 1000 },
    });
    expect(mockSetGameState).toHaveBeenCalledWith(GameState.MENU);
  });

  it('should crossfade when changing to different track', () => {
    const { result } = renderHook(() => useGameStateMusic(tracksByState));

    // Set initial state
    act(() => {
      result.current.setGameState(GameState.MENU);
    });

    // Change to different track
    act(() => {
      result.current.setGameState(GameState.PLAYING);
    });

    expect(mockCrossfade).toHaveBeenCalledWith(
      'menu-theme',
      'gameplay-theme',
      { duration: undefined }
    );
  });

  it('should use custom crossfade duration', () => {
    const { result } = renderHook(() =>
      useGameStateMusic(tracksByState, { crossfadeDuration: 3000 })
    );

    act(() => {
      result.current.setGameState(GameState.MENU);
    });

    act(() => {
      result.current.setGameState(GameState.PLAYING);
    });

    expect(mockCrossfade).toHaveBeenCalledWith(
      'menu-theme',
      'gameplay-theme',
      { duration: 3000 }
    );
  });

  it('should not crossfade when track is the same', () => {
    const { result } = renderHook(() => useGameStateMusic(tracksByState));

    act(() => {
      result.current.setGameState(GameState.PLAYING);
    });

    act(() => {
      result.current.setGameState(GameState.PAUSED); // Same track
    });

    // Only one crossfade call from first transition
    expect(mockCrossfade).not.toHaveBeenCalled();
  });
});

describe('useMusicStats Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial stats', () => {
    const { result } = renderHook(() => useMusicStats());

    expect(result.current).toEqual({
      tracksLoaded: 0,
      totalTracks: 0,
      currentPlaylist: null,
      playbackHistory: [],
      memoryUsage: 0,
    });
  });

  it('should update stats periodically', async () => {
    vi.useFakeTimers();

    mockGetStats.mockReturnValue({
      tracksLoaded: 2,
      totalTracks: 5,
      currentPlaylist: 'test-playlist',
      playbackHistory: ['track1', 'track2'],
      memoryUsage: 1024,
    });

    const { result } = renderHook(() => useMusicStats(500));

    act(() => {
      vi.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(result.current.tracksLoaded).toBe(2);
      expect(result.current.totalTracks).toBe(5);
    });

    vi.useRealTimers();
  });

  it('should use custom update interval', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useMusicStats(2000));

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    // Should not have updated yet
    expect(mockGetStats).toHaveBeenCalledTimes(1); // Initial call

    act(() => {
      vi.advanceTimersByTime(600);
    });

    // Now should have updated
    expect(mockGetStats).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});
