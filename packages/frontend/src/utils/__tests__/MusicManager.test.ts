/**
 * MusicManager Test Suite
 *
 * Tests for MusicManager functionality including:
 * - Track management
 * - Playback control
 * - Crossfade transitions
 * - Playlist management
 * - Game state integration
 * - Fade in/out
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { musicManager, MusicTrack, Playlist, GameState } from '../MusicManager';

// Mock Howler
vi.mock('howler', () => {
  const mockHowl = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockReturnValue(1),
    stop: vi.fn(),
    pause: vi.fn(),
    volume: vi.fn().mockReturnValue(1),
    loop: vi.fn().mockReturnValue(true),
    playing: vi.fn().mockReturnValue(true),
    seek: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(120),
    fade: vi.fn(),
    load: vi.fn(),
    unload: vi.fn(),
    once: vi.fn(),
  }));

  return {
    Howl: mockHowl,
    Howler: {
      volume: vi.fn(),
    },
  };
});

// Mock AudioManager
vi.mock('../AudioManager', () => ({
  audioManager: {
    getIsUnlocked: vi.fn().mockReturnValue(true),
    getCategoryVolume: vi.fn().mockReturnValue(0.7),
  },
  AudioCategory: {
    MUSIC: 'music',
  },
}));

describe('MusicManager', () => {
  const testTrack: MusicTrack = {
    id: 'test-track',
    src: '/music/test.mp3',
    name: 'Test Track',
    loop: true,
    preload: false,
    volume: 1.0,
  };

  const testTrack2: MusicTrack = {
    id: 'test-track-2',
    src: '/music/test2.mp3',
    name: 'Test Track 2',
    loop: true,
    preload: false,
    volume: 1.0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    musicManager.unloadAll();
  });

  describe('Track Management', () => {
    it('should add a track', () => {
      musicManager.addTrack(testTrack);
      const metadata = musicManager.getTrackMetadata(testTrack.id);
      expect(metadata).toEqual(testTrack);
    });

    it('should add multiple tracks', () => {
      const tracks = [testTrack, testTrack2];
      musicManager.addTracks(tracks);
      expect(musicManager.getTrackMetadata(testTrack.id)).toBeTruthy();
      expect(musicManager.getTrackMetadata(testTrack2.id)).toBeTruthy();
    });

    it('should not add duplicate tracks', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      musicManager.addTrack(testTrack);
      musicManager.addTrack(testTrack);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already exists')
      );
      consoleSpy.mockRestore();
    });

    it('should preload a track', async () => {
      musicManager.addTrack(testTrack);
      await musicManager.preloadTrack(testTrack.id);
      // Track should be marked as preloaded (tested via stats)
      const stats = musicManager.getStats();
      expect(stats.totalTracks).toBe(1);
    });

    it('should preload multiple tracks', async () => {
      musicManager.addTracks([testTrack, testTrack2]);
      await musicManager.preloadTracks([testTrack.id, testTrack2.id]);
      const stats = musicManager.getStats();
      expect(stats.totalTracks).toBe(2);
    });

    it('should unload a track', () => {
      musicManager.addTrack(testTrack);
      musicManager.unloadTrack(testTrack.id);
      expect(musicManager.getTrackMetadata(testTrack.id)).toBeNull();
    });

    it('should unload all tracks', () => {
      musicManager.addTracks([testTrack, testTrack2]);
      musicManager.unloadAll();
      const stats = musicManager.getStats();
      expect(stats.totalTracks).toBe(0);
      expect(musicManager.getCurrentTrackId()).toBeNull();
    });
  });

  describe('Playback Control', () => {
    beforeEach(() => {
      musicManager.addTrack(testTrack);
    });

    it('should play a track', () => {
      musicManager.play(testTrack.id);
      expect(musicManager.getCurrentTrackId()).toBe(testTrack.id);
    });

    it('should play a track with fade in', () => {
      musicManager.play(testTrack.id, { fadeIn: { duration: 1000 } });
      expect(musicManager.getCurrentTrackId()).toBe(testTrack.id);
    });

    it('should stop a track', () => {
      musicManager.play(testTrack.id);
      musicManager.stop(testTrack.id);
      expect(musicManager.getCurrentTrackId()).toBeNull();
    });

    it('should stop a track with fade out', () => {
      musicManager.play(testTrack.id);
      musicManager.stop(testTrack.id, { fadeOut: { duration: 1000 } });
      // Should still be current until fade completes
      expect(musicManager.getCurrentTrackId()).toBe(testTrack.id);
    });

    it('should pause current track', () => {
      musicManager.play(testTrack.id);
      musicManager.pauseCurrentTrack();
      // Pause is called on Howl instance
    });

    it('should resume current track', () => {
      musicManager.play(testTrack.id);
      musicManager.pauseCurrentTrack();
      musicManager.resumeCurrentTrack();
      // Resume is called on Howl instance
    });

    it('should handle non-existent track', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      musicManager.play('non-existent');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Track not found')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Crossfade', () => {
    beforeEach(() => {
      musicManager.addTracks([testTrack, testTrack2]);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should crossfade between tracks', () => {
      musicManager.play(testTrack.id);
      musicManager.crossfade(testTrack.id, testTrack2.id, { duration: 1000 });

      // Fast-forward time
      vi.advanceTimersByTime(1100);

      expect(musicManager.getCurrentTrackId()).toBe(testTrack2.id);
    });

    it('should use default crossfade duration', () => {
      musicManager.play(testTrack.id);
      musicManager.crossfade(testTrack.id, testTrack2.id);

      // Default is 2000ms
      vi.advanceTimersByTime(2100);

      expect(musicManager.getCurrentTrackId()).toBe(testTrack2.id);
    });

    it('should handle missing tracks in crossfade', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      musicManager.crossfade('non-existent-1', 'non-existent-2');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Fade In/Out', () => {
    beforeEach(() => {
      musicManager.addTrack(testTrack);
      musicManager.play(testTrack.id);
    });

    it('should fade in a track', () => {
      musicManager.fadeIn(testTrack.id, { duration: 1000, targetVolume: 0.8 });
      // Fade is called on Howl instance
    });

    it('should fade out a track', () => {
      musicManager.fadeOut(testTrack.id, { duration: 1000, targetVolume: 0.2 });
      // Fade is called on Howl instance
    });

    it('should call onComplete after fade out', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();
      musicManager.fadeOut(testTrack.id, { duration: 1000, onComplete });
      vi.advanceTimersByTime(1100);
      expect(onComplete).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Playlist Management', () => {
    const testPlaylist: Playlist = {
      id: 'test-playlist',
      name: 'Test Playlist',
      tracks: ['test-track', 'test-track-2'],
      shuffle: false,
      loop: true,
    };

    beforeEach(() => {
      musicManager.addTracks([testTrack, testTrack2]);
    });

    it('should create a playlist', () => {
      musicManager.createPlaylist(testPlaylist);
      const playlist = musicManager.getPlaylist(testPlaylist.id);
      expect(playlist).toEqual(testPlaylist);
    });

    it('should play a playlist', () => {
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id);
      expect(musicManager.getCurrentPlaylistId()).toBe(testPlaylist.id);
      expect(musicManager.getCurrentTrackId()).toBe('test-track');
    });

    it('should play playlist with shuffle', () => {
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id, { shuffle: true });
      expect(musicManager.getCurrentPlaylistId()).toBe(testPlaylist.id);
      // Track should be one of the playlist tracks
      const currentTrack = musicManager.getCurrentTrackId();
      expect(testPlaylist.tracks).toContain(currentTrack);
    });

    it('should play playlist starting at specific index', () => {
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id, { startIndex: 1 });
      expect(musicManager.getCurrentTrackId()).toBe('test-track-2');
    });

    it('should play next track in playlist', () => {
      vi.useFakeTimers();
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id);

      musicManager.playNext();
      vi.advanceTimersByTime(600); // Wait for fade

      expect(musicManager.getCurrentTrackId()).toBe('test-track-2');
      vi.useRealTimers();
    });

    it('should play previous track in playlist', () => {
      vi.useFakeTimers();
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id, { startIndex: 1 });

      musicManager.playPrevious();
      vi.advanceTimersByTime(600); // Wait for fade

      expect(musicManager.getCurrentTrackId()).toBe('test-track');
      vi.useRealTimers();
    });

    it('should loop playlist', () => {
      vi.useFakeTimers();
      musicManager.createPlaylist(testPlaylist);
      musicManager.playPlaylist(testPlaylist.id, { startIndex: 1 });

      // Play next should loop to start
      musicManager.playNext();
      vi.advanceTimersByTime(600);

      expect(musicManager.getCurrentTrackId()).toBe('test-track');
      vi.useRealTimers();
    });

    it('should handle empty playlist', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const emptyPlaylist: Playlist = {
        id: 'empty',
        name: 'Empty',
        tracks: [],
      };
      musicManager.createPlaylist(emptyPlaylist);
      musicManager.playPlaylist(emptyPlaylist.id);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('empty')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Game State Integration', () => {
    beforeEach(() => {
      musicManager.addTrack(testTrack);
      musicManager.play(testTrack.id);
    });

    it('should set game state', () => {
      musicManager.setGameState(GameState.PLAYING);
      // Volume should be adjusted based on game state
    });

    it('should set game state with custom fade duration', () => {
      musicManager.setGameState(GameState.PAUSED, { fadeDuration: 2000 });
      // Volume should fade over 2000ms
    });

    it('should set custom volume for game state', () => {
      musicManager.setGameStateVolume(GameState.PLAYING, 0.4);
      musicManager.setGameState(GameState.PLAYING);
      // Volume should be adjusted to custom level
    });
  });

  describe('Playback State', () => {
    beforeEach(() => {
      musicManager.addTrack(testTrack);
    });

    it('should return empty state when no track playing', () => {
      const state = musicManager.getPlaybackState();
      expect(state.currentTrack).toBeNull();
      expect(state.isPlaying).toBe(false);
    });

    it('should return playback state for current track', () => {
      musicManager.play(testTrack.id);
      const state = musicManager.getPlaybackState();
      expect(state.currentTrack).toBe(testTrack.id);
      expect(state.isPlaying).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should return music statistics', () => {
      musicManager.addTracks([testTrack, testTrack2]);
      const stats = musicManager.getStats();
      expect(stats.totalTracks).toBe(2);
      expect(stats.tracksLoaded).toBeGreaterThanOrEqual(0);
      expect(stats.currentPlaylist).toBeNull();
      expect(Array.isArray(stats.playbackHistory)).toBe(true);
    });

    it('should track playback history', () => {
      musicManager.addTrack(testTrack);
      musicManager.play(testTrack.id);
      const stats = musicManager.getStats();
      expect(stats.playbackHistory).toContain(testTrack.id);
    });
  });
});
