/**
 * MusicManager - Singleton for managing background music
 *
 * Features:
 * - Music playback with loop handling
 * - Crossfade transitions between tracks
 * - Playlist management system
 * - Fade in/out on game state changes
 * - Music preloading and buffering
 * - Per-game music track support
 * - Track history and shuffle mode
 *
 * @module MusicManager
 */

import { Howl } from 'howler';
import { audioManager, AudioCategory } from './AudioManager';

/**
 * Music track interface
 */
export interface MusicTrack {
  id: string;
  src: string | string[];
  name: string;
  artist?: string;
  duration?: number;
  loop?: boolean;
  preload?: boolean;
  volume?: number;
  sprite?: { [key: string]: [number, number, boolean?] };
}

/**
 * Playlist interface
 */
export interface Playlist {
  id: string;
  name: string;
  tracks: string[]; // Track IDs
  shuffle?: boolean;
  loop?: boolean;
}

/**
 * Crossfade options
 */
export interface CrossfadeOptions {
  duration?: number; // Crossfade duration in milliseconds (default: 2000)
  curve?: 'linear' | 'exponential'; // Fade curve type (default: 'exponential')
}

/**
 * Fade options
 */
export interface FadeOptions {
  duration?: number; // Fade duration in milliseconds (default: 1000)
  curve?: 'linear' | 'exponential'; // Fade curve type (default: 'exponential')
  targetVolume?: number; // Target volume (default: 0 for fadeOut, 1 for fadeIn)
}

/**
 * Game state for music management
 */
export enum GameState {
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'gameOver',
}

/**
 * Playback state
 */
export interface PlaybackState {
  currentTrack: string | null;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isLooping: boolean;
}

/**
 * Music statistics
 */
export interface MusicStats {
  tracksLoaded: number;
  totalTracks: number;
  currentPlaylist: string | null;
  playbackHistory: string[];
  memoryUsage: number;
}

/**
 * Loaded track data
 */
interface LoadedTrack {
  howl: Howl;
  metadata: MusicTrack;
  soundId: number | null;
  isPreloaded: boolean;
}

/**
 * MusicManager Singleton Class
 *
 * Manages background music playback with advanced features
 */
class MusicManager {
  private static instance: MusicManager | null = null;

  // Track library
  private tracks = new Map<string, LoadedTrack>();
  private playlists = new Map<string, Playlist>();

  // Playback state
  private currentTrackId: string | null = null;
  private currentPlaylistId: string | null = null;
  private playlistPosition = 0;
  private isShuffleEnabled = false;
  private isRepeatEnabled = false;

  // History
  private playbackHistory: string[] = [];
  private readonly MAX_HISTORY_SIZE = 50;

  // Crossfade state
  private isCrossfading = false;
  private crossfadeInterval: number | null = null;

  // Game state tracking
  private currentGameState: GameState = GameState.MENU;
  private gameStateVolumes = new Map<GameState, number>([
    [GameState.MENU, 0.7],
    [GameState.PLAYING, 0.5],
    [GameState.PAUSED, 0.3],
    [GameState.GAME_OVER, 0.6],
  ]);

  // Configuration
  private defaultCrossfadeDuration = 2000; // 2 seconds
  private defaultFadeDuration = 1000; // 1 second

  /**
   * Private constructor (Singleton pattern)
   */
  private constructor() {
    // Initialize
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MusicManager {
    if (!MusicManager.instance) {
      MusicManager.instance = new MusicManager();
    }
    return MusicManager.instance;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for visibility changes to pause/resume
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseCurrentTrack();
        } else {
          this.resumeCurrentTrack();
        }
      });
    }
  }

  /**
   * Add a music track to the library
   */
  public addTrack(track: MusicTrack): void {
    if (this.tracks.has(track.id)) {
      console.warn(`[MusicManager] Track "${track.id}" already exists. Skipping.`);
      return;
    }

    const howl = new Howl({
      src: Array.isArray(track.src) ? track.src : [track.src],
      loop: track.loop ?? true,
      preload: track.preload ?? false,
      volume: track.volume ?? 1.0,
      sprite: track.sprite,
      html5: true, // Use HTML5 Audio for streaming
      onload: () => {
        console.log(`[MusicManager] Track loaded: ${track.id}`);
        const loadedTrack = this.tracks.get(track.id);
        if (loadedTrack) {
          loadedTrack.isPreloaded = true;
          loadedTrack.metadata.duration = howl.duration();
        }
      },
      onloaderror: (_id: number, error: unknown) => {
        console.error(`[MusicManager] Failed to load track "${track.id}":`, error);
      },
      onplayerror: (_id: number, error: unknown) => {
        console.error(`[MusicManager] Playback error for track "${track.id}":`, error);
        // Try to unlock audio on play error
        howl.once('unlock', () => {
          if (this.currentTrackId === track.id) {
            howl.play();
          }
        });
      },
      onend: () => {
        console.log(`[MusicManager] Track ended: ${track.id}`);
        this.handleTrackEnd(track.id);
      },
    });

    this.tracks.set(track.id, {
      howl,
      metadata: track,
      soundId: null,
      isPreloaded: track.preload ?? false,
    });

    console.log(`[MusicManager] Added track: ${track.id}`);
  }

  /**
   * Add multiple tracks
   */
  public addTracks(tracks: MusicTrack[]): void {
    tracks.forEach((track) => this.addTrack(track));
  }

  /**
   * Preload a track
   */
  public async preloadTrack(trackId: string): Promise<void> {
    const track = this.tracks.get(trackId);
    if (!track) {
      throw new Error(`[MusicManager] Track not found: ${trackId}`);
    }

    if (track.isPreloaded) {
      console.log(`[MusicManager] Track already preloaded: ${trackId}`);
      return;
    }

    return new Promise((resolve, reject) => {
      track.howl.once('load', () => {
        track.isPreloaded = true;
        console.log(`[MusicManager] Track preloaded: ${trackId}`);
        resolve();
      });

      track.howl.once('loaderror', (_id: number, error: unknown) => {
        reject(new Error(`Failed to preload track "${trackId}": ${error}`));
      });

      track.howl.load();
    });
  }

  /**
   * Preload multiple tracks
   */
  public async preloadTracks(trackIds: string[]): Promise<void> {
    await Promise.all(trackIds.map((id) => this.preloadTrack(id)));
  }

  /**
   * Play a track
   */
  public play(trackId: string, options?: { fadeIn?: FadeOptions }): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.error(`[MusicManager] Track not found: ${trackId}`);
      return;
    }

    // Stop current track if playing
    if (this.currentTrackId && this.currentTrackId !== trackId) {
      this.stop(this.currentTrackId);
    }

    // Unlock audio if needed
    if (!audioManager.getIsUnlocked()) {
      console.warn('[MusicManager] Audio not unlocked. Cannot play.');
      return;
    }

    // Get category volume
    const categoryVolume = audioManager.getCategoryVolume(AudioCategory.MUSIC);
    const gameStateVolume = this.gameStateVolumes.get(this.currentGameState) ?? 0.7;
    const trackVolume = track.metadata.volume ?? 1.0;
    const finalVolume = categoryVolume * gameStateVolume * trackVolume;

    // Apply fade in if specified
    if (options?.fadeIn) {
      track.howl.volume(0);
      const soundId = track.howl.play();
      track.soundId = soundId;
      this.fadeIn(trackId, options.fadeIn);
    } else {
      track.howl.volume(finalVolume);
      const soundId = track.howl.play();
      track.soundId = soundId;
    }

    this.currentTrackId = trackId;
    this.addToHistory(trackId);

    console.log(`[MusicManager] Playing track: ${trackId}`);
  }

  /**
   * Stop a track
   */
  public stop(trackId: string, options?: { fadeOut?: FadeOptions }): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.error(`[MusicManager] Track not found: ${trackId}`);
      return;
    }

    if (options?.fadeOut) {
      this.fadeOut(trackId, {
        ...options.fadeOut,
        onComplete: () => {
          track.howl.stop();
          track.soundId = null;
          if (this.currentTrackId === trackId) {
            this.currentTrackId = null;
          }
        },
      });
    } else {
      track.howl.stop();
      track.soundId = null;
      if (this.currentTrackId === trackId) {
        this.currentTrackId = null;
      }
    }

    console.log(`[MusicManager] Stopped track: ${trackId}`);
  }

  /**
   * Pause current track
   */
  public pauseCurrentTrack(): void {
    if (!this.currentTrackId) return;

    const track = this.tracks.get(this.currentTrackId);
    if (!track) return;

    track.howl.pause();
    console.log(`[MusicManager] Paused track: ${this.currentTrackId}`);
  }

  /**
   * Resume current track
   */
  public resumeCurrentTrack(): void {
    if (!this.currentTrackId) return;

    const track = this.tracks.get(this.currentTrackId);
    if (!track) return;

    track.howl.play(track.soundId ?? undefined);
    console.log(`[MusicManager] Resumed track: ${this.currentTrackId}`);
  }

  /**
   * Crossfade between two tracks
   */
  public crossfade(
    fromTrackId: string,
    toTrackId: string,
    options?: CrossfadeOptions
  ): void {
    const fromTrack = this.tracks.get(fromTrackId);
    const toTrack = this.tracks.get(toTrackId);

    if (!fromTrack || !toTrack) {
      console.error('[MusicManager] One or both tracks not found for crossfade');
      return;
    }

    if (this.isCrossfading) {
      console.warn('[MusicManager] Crossfade already in progress');
      return;
    }

    const duration = options?.duration ?? this.defaultCrossfadeDuration;
    const curve = options?.curve ?? 'exponential';

    this.isCrossfading = true;

    // Get volumes
    const fromVolume = fromTrack.howl.volume();
    const categoryVolume = audioManager.getCategoryVolume(AudioCategory.MUSIC);
    const gameStateVolume = this.gameStateVolumes.get(this.currentGameState) ?? 0.7;
    const toTrackVolume = toTrack.metadata.volume ?? 1.0;
    const toVolume = categoryVolume * gameStateVolume * toTrackVolume;

    // Start playing the new track at volume 0
    toTrack.howl.volume(0);
    const soundId = toTrack.howl.play();
    toTrack.soundId = soundId;

    // Crossfade
    const steps = 60; // 60 steps for smooth fade
    const stepDuration = duration / steps;
    let currentStep = 0;

    this.crossfadeInterval = window.setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      // Calculate volumes based on curve
      let fadeOutProgress: number;
      let fadeInProgress: number;

      if (curve === 'exponential') {
        fadeOutProgress = Math.pow(1 - progress, 2);
        fadeInProgress = Math.pow(progress, 2);
      } else {
        fadeOutProgress = 1 - progress;
        fadeInProgress = progress;
      }

      fromTrack.howl.volume(fromVolume * fadeOutProgress);
      toTrack.howl.volume(toVolume * fadeInProgress);

      if (currentStep >= steps) {
        // Crossfade complete
        if (this.crossfadeInterval !== null) {
          clearInterval(this.crossfadeInterval);
          this.crossfadeInterval = null;
        }
        fromTrack.howl.stop();
        fromTrack.soundId = null;
        this.currentTrackId = toTrackId;
        this.isCrossfading = false;
        this.addToHistory(toTrackId);
        console.log(`[MusicManager] Crossfade complete: ${fromTrackId} → ${toTrackId}`);
      }
    }, stepDuration);
  }

  /**
   * Fade in a track
   */
  public fadeIn(trackId: string, options?: FadeOptions): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.error(`[MusicManager] Track not found: ${trackId}`);
      return;
    }

    const duration = options?.duration ?? this.defaultFadeDuration;
    // const curve = options?.curve ?? 'exponential'; // Reserved for future use
    const categoryVolume = audioManager.getCategoryVolume(AudioCategory.MUSIC);
    const gameStateVolume = this.gameStateVolumes.get(this.currentGameState) ?? 0.7;
    const trackVolume = track.metadata.volume ?? 1.0;
    const targetVolume =
      options?.targetVolume ?? categoryVolume * gameStateVolume * trackVolume;

    track.howl.fade(0, targetVolume, duration, track.soundId ?? undefined);
    console.log(`[MusicManager] Fading in track: ${trackId}`);
  }

  /**
   * Fade out a track
   */
  public fadeOut(
    trackId: string,
    options?: FadeOptions & { onComplete?: () => void }
  ): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.error(`[MusicManager] Track not found: ${trackId}`);
      return;
    }

    const duration = options?.duration ?? this.defaultFadeDuration;
    const targetVolume = options?.targetVolume ?? 0;

    track.howl.fade(track.howl.volume(), targetVolume, duration, track.soundId ?? undefined);

    if (options?.onComplete) {
      setTimeout(options.onComplete, duration);
    }

    console.log(`[MusicManager] Fading out track: ${trackId}`);
  }

  /**
   * Create a playlist
   */
  public createPlaylist(playlist: Playlist): void {
    if (this.playlists.has(playlist.id)) {
      console.warn(`[MusicManager] Playlist "${playlist.id}" already exists. Overwriting.`);
    }

    this.playlists.set(playlist.id, playlist);
    console.log(`[MusicManager] Created playlist: ${playlist.id}`);
  }

  /**
   * Play a playlist
   */
  public playPlaylist(playlistId: string, options?: { shuffle?: boolean; startIndex?: number }): void {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) {
      console.error(`[MusicManager] Playlist not found: ${playlistId}`);
      return;
    }

    if (playlist.tracks.length === 0) {
      console.warn(`[MusicManager] Playlist "${playlistId}" is empty`);
      return;
    }

    this.currentPlaylistId = playlistId;
    this.isShuffleEnabled = options?.shuffle ?? playlist.shuffle ?? false;
    this.isRepeatEnabled = playlist.loop ?? false;
    this.playlistPosition = options?.startIndex ?? 0;

    // Play first track
    const trackId = playlist.tracks[this.playlistPosition];
    this.play(trackId);

    console.log(`[MusicManager] Playing playlist: ${playlistId} (track ${this.playlistPosition + 1}/${playlist.tracks.length})`);
  }

  /**
   * Play next track in playlist
   */
  public playNext(): void {
    if (!this.currentPlaylistId) {
      console.warn('[MusicManager] No playlist currently playing');
      return;
    }

    const playlist = this.playlists.get(this.currentPlaylistId);
    if (!playlist) {
      console.error('[MusicManager] Current playlist not found');
      return;
    }

    // Stop current track
    if (this.currentTrackId) {
      this.stop(this.currentTrackId, { fadeOut: { duration: 500 } });
    }

    // Determine next track
    if (this.isShuffleEnabled) {
      // Random track (excluding current)
      const availableIndices = playlist.tracks
        .map((_, index) => index)
        .filter((index) => index !== this.playlistPosition);
      this.playlistPosition =
        availableIndices[Math.floor(Math.random() * availableIndices.length)];
    } else {
      // Next track in order
      this.playlistPosition++;
      if (this.playlistPosition >= playlist.tracks.length) {
        if (this.isRepeatEnabled) {
          this.playlistPosition = 0;
        } else {
          console.log('[MusicManager] Playlist ended');
          this.currentPlaylistId = null;
          return;
        }
      }
    }

    const trackId = playlist.tracks[this.playlistPosition];
    this.play(trackId, { fadeIn: { duration: 500 } });
  }

  /**
   * Play previous track in playlist
   */
  public playPrevious(): void {
    if (!this.currentPlaylistId) {
      console.warn('[MusicManager] No playlist currently playing');
      return;
    }

    const playlist = this.playlists.get(this.currentPlaylistId);
    if (!playlist) {
      console.error('[MusicManager] Current playlist not found');
      return;
    }

    // Stop current track
    if (this.currentTrackId) {
      this.stop(this.currentTrackId, { fadeOut: { duration: 500 } });
    }

    // Previous track
    this.playlistPosition--;
    if (this.playlistPosition < 0) {
      if (this.isRepeatEnabled) {
        this.playlistPosition = playlist.tracks.length - 1;
      } else {
        this.playlistPosition = 0;
      }
    }

    const trackId = playlist.tracks[this.playlistPosition];
    this.play(trackId, { fadeIn: { duration: 500 } });
  }

  /**
   * Handle track end
   */
  private handleTrackEnd(_trackId: string): void {
    // If in a playlist, play next track
    if (this.currentPlaylistId) {
      this.playNext();
    }
  }

  /**
   * Set game state and adjust music volume
   */
  public setGameState(state: GameState, options?: { fadeDuration?: number }): void {
    this.currentGameState = state;
    const fadeDuration = options?.fadeDuration ?? 1000;

    if (this.currentTrackId) {
      const track = this.tracks.get(this.currentTrackId);
      if (track) {
        const categoryVolume = audioManager.getCategoryVolume(AudioCategory.MUSIC);
        const gameStateVolume = this.gameStateVolumes.get(state) ?? 0.7;
        const trackVolume = track.metadata.volume ?? 1.0;
        const targetVolume = categoryVolume * gameStateVolume * trackVolume;

        track.howl.fade(track.howl.volume(), targetVolume, fadeDuration, track.soundId ?? undefined);
      }
    }

    console.log(`[MusicManager] Game state changed: ${state}`);
  }

  /**
   * Set volume for a game state
   */
  public setGameStateVolume(state: GameState, volume: number): void {
    this.gameStateVolumes.set(state, Math.max(0, Math.min(1, volume)));
  }

  /**
   * Add track to playback history
   */
  private addToHistory(trackId: string): void {
    this.playbackHistory.push(trackId);
    if (this.playbackHistory.length > this.MAX_HISTORY_SIZE) {
      this.playbackHistory.shift();
    }
  }

  /**
   * Get playback state
   */
  public getPlaybackState(): PlaybackState {
    if (!this.currentTrackId) {
      return {
        currentTrack: null,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        volume: 0,
        isLooping: false,
      };
    }

    const track = this.tracks.get(this.currentTrackId);
    if (!track) {
      return {
        currentTrack: null,
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        volume: 0,
        isLooping: false,
      };
    }

    return {
      currentTrack: this.currentTrackId,
      isPlaying: track.howl.playing(),
      isPaused: !track.howl.playing() && track.soundId !== null,
      currentTime: track.howl.seek() as number,
      duration: track.howl.duration(),
      volume: track.howl.volume(),
      isLooping: track.howl.loop(),
    };
  }

  /**
   * Get music statistics
   */
  public getStats(): MusicStats {
    const tracksLoaded = Array.from(this.tracks.values()).filter(
      (t) => t.isPreloaded
    ).length;

    let memoryUsage = 0;
    this.tracks.forEach((track) => {
      if (track.metadata.duration) {
        // Rough estimate: 128kbps = 16KB/s
        memoryUsage += track.metadata.duration * 16;
      }
    });

    return {
      tracksLoaded,
      totalTracks: this.tracks.size,
      currentPlaylist: this.currentPlaylistId,
      playbackHistory: [...this.playbackHistory],
      memoryUsage,
    };
  }

  /**
   * Unload a track
   */
  public unloadTrack(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`[MusicManager] Track not found: ${trackId}`);
      return;
    }

    track.howl.unload();
    this.tracks.delete(trackId);
    console.log(`[MusicManager] Unloaded track: ${trackId}`);
  }

  /**
   * Unload all tracks
   */
  public unloadAll(): void {
    this.tracks.forEach((track) => {
      track.howl.unload();
    });
    this.tracks.clear();
    this.currentTrackId = null;
    this.currentPlaylistId = null;
    console.log('[MusicManager] Unloaded all tracks');
  }

  /**
   * Get current track ID
   */
  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  /**
   * Get current playlist ID
   */
  public getCurrentPlaylistId(): string | null {
    return this.currentPlaylistId;
  }

  /**
   * Get track metadata
   */
  public getTrackMetadata(trackId: string): MusicTrack | null {
    const track = this.tracks.get(trackId);
    return track ? track.metadata : null;
  }

  /**
   * Get playlist
   */
  public getPlaylist(playlistId: string): Playlist | null {
    return this.playlists.get(playlistId) ?? null;
  }
}

// Export singleton instance
export const musicManager = MusicManager.getInstance();
