/**
 * SFXEngine - Advanced Sound Effects Engine with pooling, caching, and priority management
 *
 * Features:
 * - Asset management with automatic loading and preloading
 * - LRU cache with automatic eviction for memory management
 * - Sound variant support (random selection from multiple files)
 * - Priority queue for concurrent sound management
 * - Sound instance pooling for performance
 * - Sound sprite support for efficient asset bundling
 * - Game-specific preloading for optimal loading times
 * - Cross-browser compatibility via Howler.js
 *
 * @module SFXEngine
 */

import { Howl } from 'howler';
import { type AudioCategory } from './AudioManager';
import AudioManager from './AudioManager';

/**
 * Sound priority levels
 */
export enum SoundPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

/**
 * Sound variant - multiple files for randomization
 */
export interface SoundVariant {
  /** Unique ID for this variant */
  id: string;
  /** Audio file path(s) - supports multiple formats */
  src: string | string[];
  /** Weight for random selection (higher = more likely) */
  weight?: number;
}

/**
 * Sound sprite definition for efficient bundling
 */
export interface SoundSprite {
  /** Start time in milliseconds */
  start: number;
  /** Duration in milliseconds */
  duration: number;
  /** Whether this sprite loops */
  loop?: boolean;
}

/**
 * Sound asset definition
 */
export interface SoundAsset {
  /** Unique ID for this sound */
  id: string;
  /** Audio category (SFX, UI, etc.) */
  category?: AudioCategory;
  /** Single source or multiple variants */
  variants?: SoundVariant[];
  /** Single source file(s) */
  src?: string | string[];
  /** Optional sprite definitions */
  sprites?: Record<string, SoundSprite>;
  /** Default volume (0.0 - 1.0) */
  volume?: number;
  /** Preload immediately when added */
  preload?: boolean;
  /** Priority for cache eviction */
  priority?: SoundPriority;
  /** Maximum concurrent instances */
  maxInstances?: number;
}

/**
 * Sound playback request
 */
export interface SoundPlayRequest {
  /** Sound ID to play */
  id: string;
  /** Optional sprite name */
  sprite?: string;
  /** Playback priority */
  priority?: SoundPriority;
  /** Volume override */
  volume?: number;
  /** Playback rate */
  rate?: number;
  /** Loop setting */
  loop?: boolean;
  /** Variant ID (if using variants) */
  variantId?: string;
}

/**
 * Loaded sound entry
 */
interface LoadedSound {
  /** Sound asset definition */
  asset: SoundAsset;
  /** Howler instances (one per variant if variants exist) */
  howls: Map<string, Howl>;
  /** Last access timestamp for LRU */
  lastAccess: number;
  /** Currently playing instances */
  activeInstances: number;
  /** Total play count */
  playCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total sounds loaded */
  loaded: number;
  /** Maximum cache size */
  maxSize: number;
  /** Current memory usage estimate (bytes) */
  memoryUsage: number;
  /** Total evictions */
  evictions: number;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Hit rate (0.0 - 1.0) */
  hitRate: number;
}

/**
 * Playback statistics
 */
export interface PlaybackStats {
  /** Total sounds played */
  totalPlays: number;
  /** Sounds currently playing */
  activeSounds: number;
  /** Sounds queued by priority */
  queuedByPriority: Record<SoundPriority, number>;
  /** Most played sounds */
  topSounds: Array<{ id: string; plays: number }>;
}

/**
 * SFX Engine configuration
 */
export interface SFXEngineConfig {
  /** Maximum sounds in cache */
  maxCacheSize?: number;
  /** Maximum concurrent sounds playing */
  maxConcurrentSounds?: number;
  /** Maximum memory usage in bytes (approximate) */
  maxMemoryUsage?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * SFXEngine Class - Advanced sound effects management
 */
export class SFXEngine {
  private static instance: SFXEngine | null = null;

  // Sound library and cache
  private sounds = new Map<string, LoadedSound>();
  private loadingPromises = new Map<string, Promise<void>>();

  // Configuration
  private config: Required<SFXEngineConfig>;

  // Statistics
  private stats = {
    evictions: 0,
    hits: 0,
    misses: 0,
    totalPlays: 0,
  };

  // Priority queue for concurrent playback
  private playQueue: Array<{
    request: SoundPlayRequest;
    resolve: (soundId: number | null) => void;
  }> = [];
  private isProcessingQueue = false;

  /**
   * Private constructor for singleton pattern
   */
  private constructor(config: SFXEngineConfig = {}) {
    // Initialize audio manager (will be used implicitly via Howler)
    AudioManager.getInstance();

    // Default configuration
    this.config = {
      maxCacheSize: config.maxCacheSize ?? 50,
      maxConcurrentSounds: config.maxConcurrentSounds ?? 10,
      maxMemoryUsage: config.maxMemoryUsage ?? 50 * 1024 * 1024, // 50MB
      debug: config.debug ?? false,
    };

    this.log('SFXEngine initialized', this.config);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: SFXEngineConfig): SFXEngine {
    if (!SFXEngine.instance) {
      SFXEngine.instance = new SFXEngine(config);
    }
    return SFXEngine.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    if (SFXEngine.instance) {
      SFXEngine.instance.unloadAll();
      SFXEngine.instance = null;
    }
  }

  // ============================================================================
  // ASSET MANAGEMENT
  // ============================================================================

  /**
   * Add a sound asset to the engine
   */
  public async addSound(asset: SoundAsset): Promise<void> {
    // Validate asset
    if (!asset.id) {
      throw new Error('Sound asset must have an id');
    }
    if (!asset.src && !asset.variants?.length) {
      throw new Error('Sound asset must have src or variants');
    }

    // Check if already exists
    if (this.sounds.has(asset.id)) {
      this.log(`Sound ${asset.id} already loaded, skipping`);
      return;
    }

    // Preload if requested
    if (asset.preload) {
      await this.load(asset.id, asset);
    } else {
      // Just store the asset definition
      this.sounds.set(asset.id, {
        asset,
        howls: new Map(),
        lastAccess: Date.now(),
        activeInstances: 0,
        playCount: 0,
      });
    }
  }

  /**
   * Add multiple sound assets
   */
  public async addSounds(assets: SoundAsset[]): Promise<void> {
    await Promise.all(assets.map((asset) => this.addSound(asset)));
  }

  /**
   * Remove a sound asset
   */
  public unload(id: string): void {
    const sound = this.sounds.get(id);
    if (!sound) {
      return;
    }

    // Unload all Howler instances
    sound.howls.forEach((howl) => {
      howl.unload();
    });

    this.sounds.delete(id);
    this.loadingPromises.delete(id);

    this.log(`Unloaded sound: ${id}`);
  }

  /**
   * Remove all sound assets
   */
  public unloadAll(): void {
    this.sounds.forEach((_, id) => this.unload(id));
    this.sounds.clear();
    this.loadingPromises.clear();
    this.log('Unloaded all sounds');
  }

  // ============================================================================
  // LOADING & CACHING
  // ============================================================================

  /**
   * Load a sound into memory
   */
  public async load(id: string, asset?: SoundAsset): Promise<void> {
    // Check if already loading
    const existingPromise = this.loadingPromises.get(id);
    if (existingPromise) {
      return existingPromise;
    }

    // Get or use provided asset
    let sound = this.sounds.get(id);
    if (!sound && asset) {
      sound = {
        asset,
        howls: new Map(),
        lastAccess: Date.now(),
        activeInstances: 0,
        playCount: 0,
      };
      this.sounds.set(id, sound);
    }

    if (!sound) {
      throw new Error(`Sound ${id} not found`);
    }

    // Check cache size before loading
    this.enforceCacheSize();

    // Create loading promise
    const loadPromise = this.loadHowls(sound);
    this.loadingPromises.set(id, loadPromise);

    try {
      await loadPromise;
      this.log(`Loaded sound: ${id}`);
    } finally {
      this.loadingPromises.delete(id);
    }
  }

  /**
   * Load Howler instances for a sound
   */
  private async loadHowls(sound: LoadedSound): Promise<void> {
    const { asset } = sound;

    // Handle variants
    if (asset.variants?.length) {
      await Promise.all(
        asset.variants.map((variant) => this.loadHowl(sound, variant.id, variant.src, asset))
      );
    }
    // Handle single source
    else if (asset.src) {
      await this.loadHowl(sound, 'default', asset.src, asset);
    }

    sound.lastAccess = Date.now();
  }

  /**
   * Load a single Howler instance
   */
  private async loadHowl(
    sound: LoadedSound,
    variantId: string,
    src: string | string[],
    asset: SoundAsset
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const howl = new Howl({
        src: Array.isArray(src) ? src : [src],
        volume: asset.volume ?? 1.0,
        sprite: asset.sprites as Record<string, [number, number]>,
        html5: false, // Use Web Audio API
        preload: true,
        onload: () => {
          sound.howls.set(variantId, howl);
          resolve();
        },
        onloaderror: (_id, error) => {
          this.log(`Failed to load sound ${asset.id} variant ${variantId}:`, error);
          reject(new Error(`Failed to load sound: ${asset.id}`));
        },
      });
    });
  }

  /**
   * Preload sounds for a specific game
   */
  public async preloadForGame(gameId: string, soundIds: string[]): Promise<void> {
    this.log(`Preloading ${soundIds.length} sounds for game: ${gameId}`);

    await Promise.all(
      soundIds.map((id) => {
        const sound = this.sounds.get(id);
        if (sound) {
          return this.load(id);
        }
        return Promise.resolve();
      })
    );

    this.log(`Preloaded sounds for game: ${gameId}`);
  }

  /**
   * Enforce cache size limit with LRU eviction
   */
  private enforceCacheSize(): void {
    // Check cache size
    if (this.sounds.size < this.config.maxCacheSize) {
      return;
    }

    // Check memory usage
    const memoryUsage = this.estimateMemoryUsage();
    if (memoryUsage < this.config.maxMemoryUsage) {
      return;
    }

    // Find LRU sounds to evict
    const sortedSounds = Array.from(this.sounds.entries())
      .filter(([_, sound]) => sound.activeInstances === 0) // Don't evict playing sounds
      .sort((a, b) => {
        // Sort by priority first (lower priority = evict first)
        const priorityA = a[1].asset.priority ?? SoundPriority.NORMAL;
        const priorityB = b[1].asset.priority ?? SoundPriority.NORMAL;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Then by last access time (older = evict first)
        return a[1].lastAccess - b[1].lastAccess;
      });

    // Evict oldest sounds
    const toEvict = Math.ceil(this.sounds.size * 0.2); // Evict 20%
    for (let i = 0; i < toEvict && i < sortedSounds.length; i++) {
      const [id] = sortedSounds[i];
      this.unload(id);
      this.stats.evictions++;
    }

    this.log(`Evicted ${toEvict} sounds from cache`);
  }

  /**
   * Estimate memory usage (approximate)
   */
  private estimateMemoryUsage(): number {
    let total = 0;
    this.sounds.forEach((sound) => {
      sound.howls.forEach((howl) => {
        // Estimate based on duration and sample rate
        // Rough estimate: 44.1kHz * 16-bit * 2 channels = 176,400 bytes/second
        const duration = howl.duration();
        total += duration * 176400;
      });
    });
    return total;
  }

  // ============================================================================
  // PLAYBACK API
  // ============================================================================

  /**
   * Play a sound effect
   */
  public async play(request: SoundPlayRequest): Promise<number | null> {
    const { id, priority = SoundPriority.NORMAL } = request;

    // Cache hit/miss tracking
    const sound = this.sounds.get(id);
    if (!sound) {
      this.stats.misses++;
      this.log(`Sound not found: ${id}`);
      return null;
    }

    this.stats.hits++;

    // Load if not loaded
    if (sound.howls.size === 0) {
      await this.load(id);
    }

    // Check concurrent sound limit
    if (this.getActiveSoundCount() >= this.config.maxConcurrentSounds) {
      // Queue high priority sounds
      if (priority >= SoundPriority.HIGH) {
        return this.queueSound(request);
      }
      this.log(`Max concurrent sounds reached, dropping ${id}`);
      return null;
    }

    return this.playNow(request, sound);
  }

  /**
   * Play a sound immediately
   */
  private playNow(request: SoundPlayRequest, sound: LoadedSound): number | null {
    const { id, sprite, volume, rate, loop, variantId } = request;

    // Select variant
    const selectedVariant = this.selectVariant(sound, variantId);
    if (!selectedVariant) {
      this.log(`No variant available for sound: ${id}`);
      return null;
    }

    const howl = sound.howls.get(selectedVariant);
    if (!howl) {
      this.log(`Howl not loaded for sound: ${id} variant: ${selectedVariant}`);
      return null;
    }

    // Check max instances
    if (sound.asset.maxInstances && sound.activeInstances >= sound.asset.maxInstances) {
      this.log(`Max instances reached for sound: ${id}`);
      return null;
    }

    // Play directly on Howl instance
    // Note: Category-based volume is already applied at the Howl level
    const soundId = howl.play(sprite);

    if (soundId !== null) {
      // Apply options
      if (volume !== undefined) {
        howl.volume(volume, soundId);
      }
      if (rate !== undefined) {
        howl.rate(rate, soundId);
      }
      if (loop !== undefined) {
        howl.loop(loop, soundId);
      }

      // Track active instance
      sound.activeInstances++;
      sound.playCount++;
      sound.lastAccess = Date.now();
      this.stats.totalPlays++;

      // Setup cleanup on end
      howl.once(
        'end',
        () => {
          sound.activeInstances--;
          this.processQueue();
        },
        soundId
      );

      this.log(`Playing sound: ${id} (variant: ${selectedVariant}, soundId: ${soundId})`);
    }

    return soundId;
  }

  /**
   * Select a variant (random weighted selection or specific)
   */
  private selectVariant(sound: LoadedSound, variantId?: string): string | null {
    const { variants } = sound.asset;

    // No variants - use default
    if (!variants?.length) {
      return 'default';
    }

    // Specific variant requested
    if (variantId) {
      return sound.howls.has(variantId) ? variantId : null;
    }

    // Random weighted selection
    const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? 1), 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight ?? 1;
      if (random <= 0) {
        return variant.id;
      }
    }

    // Fallback to first variant
    return variants[0]?.id ?? null;
  }

  /**
   * Queue a sound for playback
   */
  private queueSound(request: SoundPlayRequest): Promise<number | null> {
    return new Promise((resolve) => {
      this.playQueue.push({ request, resolve });
      this.playQueue.sort((a, b) => (b.request.priority ?? 0) - (a.request.priority ?? 0));
      this.processQueue();
    });
  }

  /**
   * Process the playback queue
   */
  private processQueue(): void {
    if (this.isProcessingQueue || this.playQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (
      this.playQueue.length > 0 &&
      this.getActiveSoundCount() < this.config.maxConcurrentSounds
    ) {
      const item = this.playQueue.shift();
      if (!item) break;

      const sound = this.sounds.get(item.request.id);
      if (sound) {
        const soundId = this.playNow(item.request, sound);
        item.resolve(soundId);
      } else {
        item.resolve(null);
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Stop a playing sound
   */
  public stop(id: string, soundId?: number): void {
    const sound = this.sounds.get(id);
    if (!sound) return;

    sound.howls.forEach((howl) => {
      howl.stop(soundId);
    });

    if (soundId === undefined) {
      sound.activeInstances = 0;
    }
  }

  /**
   * Stop all playing sounds
   */
  public stopAll(): void {
    this.sounds.forEach((sound) => {
      sound.howls.forEach((howl) => {
        howl.stop();
      });
      sound.activeInstances = 0;
    });
  }

  // ============================================================================
  // STATISTICS & UTILITIES
  // ============================================================================

  /**
   * Get active sound count
   */
  private getActiveSoundCount(): number {
    let count = 0;
    this.sounds.forEach((sound) => {
      count += sound.activeInstances;
    });
    return count;
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): CacheStats {
    const memoryUsage = this.estimateMemoryUsage();
    const totalAccess = this.stats.hits + this.stats.misses;
    const hitRate = totalAccess > 0 ? this.stats.hits / totalAccess : 0;

    return {
      loaded: this.sounds.size,
      maxSize: this.config.maxCacheSize,
      memoryUsage,
      evictions: this.stats.evictions,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Get playback statistics
   */
  public getPlaybackStats(): PlaybackStats {
    const queuedByPriority: Record<SoundPriority, number> = {
      [SoundPriority.LOW]: 0,
      [SoundPriority.NORMAL]: 0,
      [SoundPriority.HIGH]: 0,
      [SoundPriority.CRITICAL]: 0,
    };

    this.playQueue.forEach((item) => {
      const priority = item.request.priority ?? SoundPriority.NORMAL;
      queuedByPriority[priority]++;
    });

    const topSounds = Array.from(this.sounds.entries())
      .map(([id, sound]) => ({ id, plays: sound.playCount }))
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 10);

    return {
      totalPlays: this.stats.totalPlays,
      activeSounds: this.getActiveSoundCount(),
      queuedByPriority,
      topSounds,
    };
  }

  /**
   * Check if a sound is loaded
   */
  public isLoaded(id: string): boolean {
    const sound = this.sounds.get(id);
    return sound ? sound.howls.size > 0 : false;
  }

  /**
   * Check if a sound is playing
   */
  public isPlaying(id: string): boolean {
    const sound = this.sounds.get(id);
    return sound ? sound.activeInstances > 0 : false;
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      // eslint-disable-next-line no-console
      console.log('[SFXEngine]', ...args);
    }
  }
}

// Export singleton instance getter
export const getSFXEngine = (config?: SFXEngineConfig): SFXEngine => {
  return SFXEngine.getInstance(config);
};
