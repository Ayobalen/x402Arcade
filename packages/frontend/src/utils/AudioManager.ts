/**
 * AudioManager - Singleton for managing audio across the application
 *
 * Features:
 * - Cross-browser audio context management (Safari, Firefox, Chrome)
 * - User interaction handling for audio unlock (required by browsers)
 * - Howler.js integration for robust audio playback
 * - Master volume control and mute functionality
 * - Audio state persistence (localStorage)
 * - Browser compatibility checks
 *
 * @module AudioManager
 */

import { Howl, Howler } from 'howler';

/**
 * Audio state interface for persistence
 */
interface AudioState {
  masterVolume: number;
  isMuted: boolean;
  isEnabled: boolean;
}

/**
 * Audio categories for different types of sounds
 */
export enum AudioCategory {
  SFX = 'sfx',
  MUSIC = 'music',
  VOICE = 'voice',
  UI = 'ui',
}

/**
 * Audio playback options
 */
export interface AudioOptions {
  volume?: number;
  loop?: boolean;
  rate?: number;
  sprite?: string;
  category?: AudioCategory;
}

/**
 * Loaded sound interface
 */
interface LoadedSound {
  howl: Howl;
  category: AudioCategory;
}

/**
 * Browser compatibility info
 */
interface BrowserCompatibility {
  supportsWebAudio: boolean;
  supportsHTML5Audio: boolean;
  requiresUserInteraction: boolean;
  browser: string;
  version: string;
}

/**
 * AudioManager Singleton Class
 *
 * Manages all audio in the application using Howler.js
 */
class AudioManager {
  private static instance: AudioManager | null = null;

  // Audio context state
  private isInitialized = false;
  private isUnlocked = false;
  private audioContext: AudioContext | null = null;

  // Audio state
  private masterVolume = 1.0;
  private isMuted = false;
  private isEnabled = true;

  // Sound library
  private sounds = new Map<string, LoadedSound>();

  // Category volumes
  private categoryVolumes = new Map<AudioCategory, number>([
    [AudioCategory.SFX, 1.0],
    [AudioCategory.MUSIC, 0.7],
    [AudioCategory.VOICE, 1.0],
    [AudioCategory.UI, 0.8],
  ]);

  // Browser compatibility
  private compatibility: BrowserCompatibility;

  // Storage key
  private readonly STORAGE_KEY = 'x402arcade_audio_state';

  /**
   * Private constructor (singleton pattern)
   */
  private constructor() {
    this.compatibility = this.detectBrowserCompatibility();
    this.loadState();
    this.setupHowler();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Detect browser compatibility
   */
  private detectBrowserCompatibility(): BrowserCompatibility {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    let version = 'Unknown';

    // Detect browser
    if (ua.indexOf('Firefox') > -1) {
      browser = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Chrome') > -1) {
      browser = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Safari') > -1) {
      browser = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else if (ua.indexOf('Edge') > -1) {
      browser = 'Edge';
      const match = ua.match(/Edge\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }

    // Check for Web Audio API support
    const supportsWebAudio = !!(
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    );

    // Check for HTML5 Audio support
    const supportsHTML5Audio = !!document.createElement('audio').canPlayType;

    // Safari and iOS always require user interaction
    const requiresUserInteraction = browser === 'Safari' || /iPad|iPhone|iPod/.test(ua);

    return {
      supportsWebAudio,
      supportsHTML5Audio,
      requiresUserInteraction,
      browser,
      version,
    };
  }

  /**
   * Setup Howler global settings
   */
  private setupHowler(): void {
    // Set master volume
    Howler.volume(this.masterVolume);

    // Mute if needed
    Howler.mute(this.isMuted);

    // Setup auto-unlock for mobile browsers
    Howler.autoUnlock = true;

    // Setup HTML5 audio pooling
    Howler.html5PoolSize = 10;
  }

  /**
   * Initialize audio context (call on user interaction)
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Create audio context if supported
      if (this.compatibility.supportsWebAudio) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioContext = new AudioContextClass();

          // Resume context if suspended (required by some browsers)
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
        }
      }

      // Setup Howler's audio context
      if (this.audioContext) {
        Howler.ctx = this.audioContext;
      }

      this.isInitialized = true;
      this.isUnlocked = true;

      console.log('[AudioManager] Initialized successfully', {
        browser: this.compatibility.browser,
        webAudio: this.compatibility.supportsWebAudio,
        html5Audio: this.compatibility.supportsHTML5Audio,
      });

      return true;
    } catch (error) {
      console.error('[AudioManager] Failed to initialize:', error);
      return false;
    }
  }

  /**
   * Unlock audio (call on first user interaction)
   * Required by browsers to prevent autoplay abuse
   */
  public async unlock(): Promise<boolean> {
    if (this.isUnlocked) {
      return true;
    }

    // Initialize if not already done
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Resume audio context if suspended
      if (this.audioContext && this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Play a silent sound to unlock iOS audio
      if (this.compatibility.requiresUserInteraction) {
        const silentSound = new Howl({
          src: ['data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'],
          volume: 0,
        });
        silentSound.play();
      }

      this.isUnlocked = true;
      console.log('[AudioManager] Audio unlocked');

      return true;
    } catch (error) {
      console.error('[AudioManager] Failed to unlock audio:', error);
      return false;
    }
  }

  /**
   * Load a sound file
   */
  public loadSound(
    id: string,
    src: string | string[],
    options: AudioOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const category = options.category || AudioCategory.SFX;

      const howl = new Howl({
        src: Array.isArray(src) ? src : [src],
        volume: options.volume ?? this.categoryVolumes.get(category) ?? 1.0,
        loop: options.loop ?? false,
        rate: options.rate ?? 1.0,
        html5: false, // Use Web Audio API for better performance
        preload: true,
        onload: () => {
          this.sounds.set(id, { howl, category });
          console.log(`[AudioManager] Loaded sound: ${id}`);
          resolve();
        },
        onloaderror: (_id, error) => {
          console.error(`[AudioManager] Failed to load sound: ${id}`, error);
          reject(new Error(`Failed to load sound: ${id}`));
        },
      });
    });
  }

  /**
   * Play a sound
   */
  public play(id: string, options: AudioOptions = {}): number | null {
    if (!this.isEnabled || this.isMuted) {
      return null;
    }

    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[AudioManager] Sound not found: ${id}`);
      return null;
    }

    const { howl, category } = sound;

    // Apply category volume
    const categoryVolume = this.categoryVolumes.get(category) ?? 1.0;
    const finalVolume = (options.volume ?? 1.0) * categoryVolume * this.masterVolume;

    howl.volume(finalVolume);

    if (options.rate !== undefined) {
      howl.rate(options.rate);
    }

    if (options.loop !== undefined) {
      howl.loop(options.loop);
    }

    return howl.play(options.sprite);
  }

  /**
   * Stop a sound
   */
  public stop(id: string, soundId?: number): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.stop(soundId);
    }
  }

  /**
   * Pause a sound
   */
  public pause(id: string, soundId?: number): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.pause(soundId);
    }
  }

  /**
   * Resume a sound
   */
  public resume(id: string, soundId?: number): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.play(soundId);
    }
  }

  /**
   * Unload a sound from memory
   */
  public unloadSound(id: string): void {
    const sound = this.sounds.get(id);
    if (sound) {
      sound.howl.unload();
      this.sounds.delete(id);
      console.log(`[AudioManager] Unloaded sound: ${id}`);
    }
  }

  /**
   * Set master volume (0.0 - 1.0)
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
    this.saveState();
  }

  /**
   * Get master volume
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Set category volume (0.0 - 1.0)
   */
  public setCategoryVolume(category: AudioCategory, volume: number): void {
    this.categoryVolumes.set(category, Math.max(0, Math.min(1, volume)));
    this.saveState();
  }

  /**
   * Get category volume
   */
  public getCategoryVolume(category: AudioCategory): number {
    return this.categoryVolumes.get(category) ?? 1.0;
  }

  /**
   * Mute all audio
   */
  public mute(): void {
    this.isMuted = true;
    Howler.mute(true);
    this.saveState();
  }

  /**
   * Unmute all audio
   */
  public unmute(): void {
    this.isMuted = false;
    Howler.mute(false);
    this.saveState();
  }

  /**
   * Toggle mute
   */
  public toggleMute(): boolean {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.isMuted;
  }

  /**
   * Check if audio is muted
   */
  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Enable audio
   */
  public enable(): void {
    this.isEnabled = true;
    this.saveState();
  }

  /**
   * Disable audio
   */
  public disable(): void {
    this.isEnabled = false;
    Howler.stop();
    this.saveState();
  }

  /**
   * Check if audio is enabled
   */
  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if audio is initialized
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if audio is unlocked
   */
  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Get browser compatibility info
   */
  public getCompatibility(): BrowserCompatibility {
    return { ...this.compatibility };
  }

  /**
   * Stop all sounds
   */
  public stopAll(): void {
    Howler.stop();
  }

  /**
   * Unload all sounds
   */
  public unloadAll(): void {
    this.sounds.forEach((sound) => {
      sound.howl.unload();
    });
    this.sounds.clear();
    console.log('[AudioManager] Unloaded all sounds');
  }

  /**
   * Save audio state to localStorage
   */
  private saveState(): void {
    try {
      const state: AudioState = {
        masterVolume: this.masterVolume,
        isMuted: this.isMuted,
        isEnabled: this.isEnabled,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[AudioManager] Failed to save state:', error);
    }
  }

  /**
   * Load audio state from localStorage
   */
  private loadState(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const state: AudioState = JSON.parse(stored);
        this.masterVolume = state.masterVolume ?? 1.0;
        this.isMuted = state.isMuted ?? false;
        this.isEnabled = state.isEnabled ?? true;

        // Apply loaded state
        Howler.volume(this.masterVolume);
        Howler.mute(this.isMuted);
      }
    } catch (error) {
      console.warn('[AudioManager] Failed to load state:', error);
    }
  }

  /**
   * Reset to default state
   */
  public reset(): void {
    this.masterVolume = 1.0;
    this.isMuted = false;
    this.isEnabled = true;
    this.categoryVolumes.set(AudioCategory.SFX, 1.0);
    this.categoryVolumes.set(AudioCategory.MUSIC, 0.7);
    this.categoryVolumes.set(AudioCategory.VOICE, 1.0);
    this.categoryVolumes.set(AudioCategory.UI, 0.8);

    Howler.volume(this.masterVolume);
    Howler.mute(this.isMuted);

    this.saveState();
  }
}

// Export singleton instance
export const audioManager = AudioManager.getInstance();

// Export class for type checking
export default AudioManager;
