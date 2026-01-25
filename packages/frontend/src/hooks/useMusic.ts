/**
 * useMusic - React hooks for music management
 *
 * Provides hooks for:
 * - Music playback control
 * - Playlist management
 * - Track transitions and crossfades
 * - Game state integration
 * - Real-time playback state
 *
 * @module useMusic
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  musicManager,
  MusicTrack,
  Playlist,
  CrossfadeOptions,
  FadeOptions,
  GameState,
  PlaybackState,
  MusicStats,
} from '../utils/MusicManager';

/**
 * Main music hook return type
 */
interface UseMusicReturn {
  // Track management
  addTrack: (track: MusicTrack) => void;
  addTracks: (tracks: MusicTrack[]) => void;
  preloadTrack: (trackId: string) => Promise<void>;
  preloadTracks: (trackIds: string[]) => Promise<void>;
  unloadTrack: (trackId: string) => void;
  unloadAll: () => void;

  // Playback control
  play: (trackId: string, options?: { fadeIn?: FadeOptions }) => void;
  stop: (trackId: string, options?: { fadeOut?: FadeOptions }) => void;
  pause: () => void;
  resume: () => void;
  crossfade: (fromTrackId: string, toTrackId: string, options?: CrossfadeOptions) => void;
  fadeIn: (trackId: string, options?: FadeOptions) => void;
  fadeOut: (trackId: string, options?: FadeOptions) => void;

  // Playlist management
  createPlaylist: (playlist: Playlist) => void;
  playPlaylist: (playlistId: string, options?: { shuffle?: boolean; startIndex?: number }) => void;
  playNext: () => void;
  playPrevious: () => void;

  // Game state integration
  setGameState: (state: GameState, options?: { fadeDuration?: number }) => void;
  setGameStateVolume: (state: GameState, volume: number) => void;

  // State
  playbackState: PlaybackState;
  stats: MusicStats;
  currentTrackId: string | null;
  currentPlaylistId: string | null;
}

/**
 * Main music hook
 *
 * Provides full access to music management functionality
 *
 * @returns Music control functions and state
 *
 * @example
 * ```tsx
 * function GameMusic() {
 *   const music = useMusic();
 *
 *   useEffect(() => {
 *     music.addTrack({
 *       id: 'game-theme',
 *       src: '/music/game-theme.mp3',
 *       name: 'Game Theme',
 *       loop: true,
 *     });
 *     music.play('game-theme', { fadeIn: { duration: 1000 } });
 *   }, []);
 *
 *   return <div>Now playing: {music.playbackState.currentTrack}</div>;
 * }
 * ```
 */
export function useMusic(): UseMusicReturn {
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    musicManager.getPlaybackState()
  );
  const [stats, setStats] = useState<MusicStats>(musicManager.getStats());
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(
    musicManager.getCurrentTrackId()
  );
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(
    musicManager.getCurrentPlaylistId()
  );

  // Update state periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaybackState(musicManager.getPlaybackState());
      setStats(musicManager.getStats());
      setCurrentTrackId(musicManager.getCurrentTrackId());
      setCurrentPlaylistId(musicManager.getCurrentPlaylistId());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Track management callbacks
  const addTrack = useCallback((track: MusicTrack) => {
    musicManager.addTrack(track);
  }, []);

  const addTracks = useCallback((tracks: MusicTrack[]) => {
    musicManager.addTracks(tracks);
  }, []);

  const preloadTrack = useCallback(async (trackId: string) => {
    await musicManager.preloadTrack(trackId);
  }, []);

  const preloadTracks = useCallback(async (trackIds: string[]) => {
    await musicManager.preloadTracks(trackIds);
  }, []);

  const unloadTrack = useCallback((trackId: string) => {
    musicManager.unloadTrack(trackId);
  }, []);

  const unloadAll = useCallback(() => {
    musicManager.unloadAll();
  }, []);

  // Playback control callbacks
  const play = useCallback((trackId: string, options?: { fadeIn?: FadeOptions }) => {
    musicManager.play(trackId, options);
  }, []);

  const stop = useCallback((trackId: string, options?: { fadeOut?: FadeOptions }) => {
    musicManager.stop(trackId, options);
  }, []);

  const pause = useCallback(() => {
    musicManager.pauseCurrentTrack();
  }, []);

  const resume = useCallback(() => {
    musicManager.resumeCurrentTrack();
  }, []);

  const crossfade = useCallback(
    (fromTrackId: string, toTrackId: string, options?: CrossfadeOptions) => {
      musicManager.crossfade(fromTrackId, toTrackId, options);
    },
    []
  );

  const fadeIn = useCallback((trackId: string, options?: FadeOptions) => {
    musicManager.fadeIn(trackId, options);
  }, []);

  const fadeOut = useCallback((trackId: string, options?: FadeOptions) => {
    musicManager.fadeOut(trackId, options);
  }, []);

  // Playlist management callbacks
  const createPlaylist = useCallback((playlist: Playlist) => {
    musicManager.createPlaylist(playlist);
  }, []);

  const playPlaylist = useCallback(
    (playlistId: string, options?: { shuffle?: boolean; startIndex?: number }) => {
      musicManager.playPlaylist(playlistId, options);
    },
    []
  );

  const playNext = useCallback(() => {
    musicManager.playNext();
  }, []);

  const playPrevious = useCallback(() => {
    musicManager.playPrevious();
  }, []);

  // Game state integration callbacks
  const setGameState = useCallback(
    (state: GameState, options?: { fadeDuration?: number }) => {
      musicManager.setGameState(state, options);
    },
    []
  );

  const setGameStateVolume = useCallback((state: GameState, volume: number) => {
    musicManager.setGameStateVolume(state, volume);
  }, []);

  return {
    addTrack,
    addTracks,
    preloadTrack,
    preloadTracks,
    unloadTrack,
    unloadAll,
    play,
    stop,
    pause,
    resume,
    crossfade,
    fadeIn,
    fadeOut,
    createPlaylist,
    playPlaylist,
    playNext,
    playPrevious,
    setGameState,
    setGameStateVolume,
    playbackState,
    stats,
    currentTrackId,
    currentPlaylistId,
  };
}

/**
 * Hook for managing a single music track
 *
 * Auto-loads track on mount and unloads on unmount
 *
 * @param track - Music track to manage
 * @param autoPlay - Whether to auto-play on mount (default: false)
 * @returns Playback controls and state
 *
 * @example
 * ```tsx
 * function MenuMusic() {
 *   const track = useMusicTrack({
 *     id: 'menu-theme',
 *     src: '/music/menu.mp3',
 *     name: 'Menu Theme',
 *     loop: true,
 *   }, true);
 *
 *   return (
 *     <div>
 *       {track.isPlaying ? 'Playing' : 'Stopped'}
 *       <button onClick={track.play}>Play</button>
 *       <button onClick={track.stop}>Stop</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMusicTrack(
  track: MusicTrack,
  autoPlay = false
): {
  play: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  fadeIn: (options?: FadeOptions) => void;
  fadeOut: (options?: FadeOptions) => void;
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
} {
  const [isLoaded, setIsLoaded] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(
    musicManager.getPlaybackState()
  );

  useEffect(() => {
    // Add track
    musicManager.addTrack(track);

    // Preload
    musicManager.preloadTrack(track.id).then(() => {
      setIsLoaded(true);
      if (autoPlay) {
        musicManager.play(track.id);
      }
    });

    // Update state interval
    const interval = setInterval(() => {
      setPlaybackState(musicManager.getPlaybackState());
    }, 100);

    // Cleanup
    return () => {
      clearInterval(interval);
      musicManager.stop(track.id);
      musicManager.unloadTrack(track.id);
    };
  }, [track.id, autoPlay]);

  const play = useCallback(() => {
    musicManager.play(track.id);
  }, [track.id]);

  const stop = useCallback(() => {
    musicManager.stop(track.id);
  }, [track.id]);

  const pause = useCallback(() => {
    if (musicManager.getCurrentTrackId() === track.id) {
      musicManager.pauseCurrentTrack();
    }
  }, [track.id]);

  const resume = useCallback(() => {
    if (musicManager.getCurrentTrackId() === track.id) {
      musicManager.resumeCurrentTrack();
    }
  }, [track.id]);

  const fadeIn = useCallback(
    (options?: FadeOptions) => {
      musicManager.fadeIn(track.id, options);
    },
    [track.id]
  );

  const fadeOut = useCallback(
    (options?: FadeOptions) => {
      musicManager.fadeOut(track.id, options);
    },
    [track.id]
  );

  return {
    play,
    stop,
    pause,
    resume,
    fadeIn,
    fadeOut,
    isPlaying: playbackState.currentTrack === track.id && playbackState.isPlaying,
    isPaused: playbackState.currentTrack === track.id && playbackState.isPaused,
    isLoaded,
  };
}

/**
 * Hook for managing a playlist
 *
 * @param playlist - Playlist configuration
 * @param autoPlay - Whether to auto-play on mount (default: false)
 * @returns Playlist controls and state
 *
 * @example
 * ```tsx
 * function GameplayMusic() {
 *   const playlist = usePlaylist({
 *     id: 'gameplay',
 *     name: 'Gameplay Mix',
 *     tracks: ['track1', 'track2', 'track3'],
 *     shuffle: true,
 *     loop: true,
 *   }, true);
 *
 *   return (
 *     <div>
 *       <button onClick={playlist.playNext}>Next</button>
 *       <button onClick={playlist.playPrevious}>Previous</button>
 *       <button onClick={playlist.pause}>Pause</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlaylist(
  playlist: Playlist,
  autoPlay = false
): {
  play: (options?: { shuffle?: boolean; startIndex?: number }) => void;
  playNext: () => void;
  playPrevious: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isActive: boolean;
  currentTrackId: string | null;
} {
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);

  useEffect(() => {
    // Create playlist
    musicManager.createPlaylist(playlist);

    if (autoPlay) {
      musicManager.playPlaylist(playlist.id);
    }

    // Update state interval
    const interval = setInterval(() => {
      setCurrentPlaylistId(musicManager.getCurrentPlaylistId());
      setCurrentTrackId(musicManager.getCurrentTrackId());
    }, 100);

    return () => {
      clearInterval(interval);
      if (musicManager.getCurrentPlaylistId() === playlist.id) {
        const trackId = musicManager.getCurrentTrackId();
        if (trackId) {
          musicManager.stop(trackId);
        }
      }
    };
  }, [playlist.id, autoPlay]);

  const play = useCallback(
    (options?: { shuffle?: boolean; startIndex?: number }) => {
      musicManager.playPlaylist(playlist.id, options);
    },
    [playlist.id]
  );

  const playNext = useCallback(() => {
    if (currentPlaylistId === playlist.id) {
      musicManager.playNext();
    }
  }, [playlist.id, currentPlaylistId]);

  const playPrevious = useCallback(() => {
    if (currentPlaylistId === playlist.id) {
      musicManager.playPrevious();
    }
  }, [playlist.id, currentPlaylistId]);

  const pause = useCallback(() => {
    if (currentPlaylistId === playlist.id) {
      musicManager.pauseCurrentTrack();
    }
  }, [playlist.id, currentPlaylistId]);

  const resume = useCallback(() => {
    if (currentPlaylistId === playlist.id) {
      musicManager.resumeCurrentTrack();
    }
  }, [playlist.id, currentPlaylistId]);

  const stop = useCallback(() => {
    if (currentPlaylistId === playlist.id && currentTrackId) {
      musicManager.stop(currentTrackId);
    }
  }, [playlist.id, currentPlaylistId, currentTrackId]);

  return {
    play,
    playNext,
    playPrevious,
    pause,
    resume,
    stop,
    isActive: currentPlaylistId === playlist.id,
    currentTrackId,
  };
}

/**
 * Hook for game state music integration
 *
 * Automatically adjusts music volume based on game state changes
 *
 * @param tracksByState - Map of game states to track IDs
 * @param options - Configuration options
 * @returns Game state setter
 *
 * @example
 * ```tsx
 * function GameWithMusic() {
 *   const { setGameState } = useGameStateMusic({
 *     [GameState.MENU]: 'menu-theme',
 *     [GameState.PLAYING]: 'gameplay-theme',
 *     [GameState.PAUSED]: 'gameplay-theme', // Same track, different volume
 *     [GameState.GAME_OVER]: 'gameover-theme',
 *   }, {
 *     crossfadeDuration: 2000,
 *     volumes: {
 *       [GameState.MENU]: 0.7,
 *       [GameState.PLAYING]: 0.5,
 *       [GameState.PAUSED]: 0.3,
 *       [GameState.GAME_OVER]: 0.6,
 *     },
 *   });
 *
 *   const handleStartGame = () => {
 *     setGameState(GameState.PLAYING);
 *   };
 *
 *   return <button onClick={handleStartGame}>Start</button>;
 * }
 * ```
 */
export function useGameStateMusic(
  tracksByState: Partial<Record<GameState, string>>,
  options?: {
    crossfadeDuration?: number;
    volumes?: Partial<Record<GameState, number>>;
    preloadAll?: boolean;
  }
): {
  setGameState: (state: GameState) => void;
  currentState: GameState;
} {
  const [currentState, setCurrentState] = useState<GameState>(GameState.MENU);
  const previousTrackRef = useRef<string | null>(null);

  useEffect(() => {
    // Set custom volumes if provided
    if (options?.volumes) {
      Object.entries(options.volumes).forEach(([state, volume]) => {
        musicManager.setGameStateVolume(state as GameState, volume);
      });
    }

    // Preload all tracks if requested
    if (options?.preloadAll) {
      const trackIds = Object.values(tracksByState).filter((id): id is string => !!id);
      musicManager.preloadTracks(trackIds);
    }
  }, [tracksByState, options]);

  const setGameState = useCallback(
    (state: GameState) => {
      const trackId = tracksByState[state];
      const previousTrackId = previousTrackRef.current;

      if (trackId) {
        if (previousTrackId && previousTrackId !== trackId) {
          // Crossfade to new track
          musicManager.crossfade(previousTrackId, trackId, {
            duration: options?.crossfadeDuration,
          });
        } else if (!previousTrackId) {
          // Play new track with fade in
          musicManager.play(trackId, {
            fadeIn: { duration: options?.crossfadeDuration ?? 1000 },
          });
        }
        previousTrackRef.current = trackId;
      }

      // Update game state (adjusts volume)
      musicManager.setGameState(state);
      setCurrentState(state);
    },
    [tracksByState, options?.crossfadeDuration]
  );

  return {
    setGameState,
    currentState,
  };
}

/**
 * Hook for music playback statistics
 *
 * @param updateInterval - Update interval in milliseconds (default: 1000)
 * @returns Real-time music statistics
 *
 * @example
 * ```tsx
 * function MusicDebugPanel() {
 *   const stats = useMusicStats(500);
 *
 *   return (
 *     <div>
 *       <p>Tracks: {stats.tracksLoaded}/{stats.totalTracks}</p>
 *       <p>Memory: {(stats.memoryUsage / 1024).toFixed(2)} KB</p>
 *       <p>Playlist: {stats.currentPlaylist || 'None'}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMusicStats(updateInterval = 1000): MusicStats {
  const [stats, setStats] = useState<MusicStats>(musicManager.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(musicManager.getStats());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return stats;
}
