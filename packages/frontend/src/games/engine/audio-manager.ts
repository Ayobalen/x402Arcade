/**
 * Audio Manager
 *
 * Centralized audio management for all games in the x402 Arcade.
 * Handles AudioContext creation/resumption, sound loading, playback control,
 * and volume management with proper browser autoplay policy compliance.
 *
 * @module games/engine/audio-manager
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Sound effect configuration
 */
export interface SoundConfig {
  /** Volume multiplier for this sound (0-1) */
  volume?: number
  /** Whether to loop the sound */
  loop?: boolean
  /** Playback rate (1 = normal speed) */
  playbackRate?: number
  /** Category for volume grouping */
  category?: SoundCategory
}

/**
 * Sound category for grouped volume control
 */
export type SoundCategory = 'sfx' | 'music' | 'ui' | 'voice'

/**
 * Loaded sound data
 */
export interface LoadedSound {
  /** Sound key identifier */
  key: string
  /** Audio buffer containing decoded audio data */
  buffer: AudioBuffer
  /** Default configuration */
  config: SoundConfig
  /** Source URL */
  url: string
}

/**
 * Currently playing sound instance
 */
export interface PlayingSound {
  /** Unique instance ID */
  id: string
  /** Sound key */
  key: string
  /** Audio source node */
  source: AudioBufferSourceNode
  /** Gain node for volume control */
  gainNode: GainNode
  /** Start time */
  startTime: number
  /** Whether sound is paused */
  paused: boolean
  /** Pause position in seconds */
  pausePosition: number
  /** Sound configuration */
  config: SoundConfig
}

/**
 * Audio manager configuration
 */
export interface AudioManagerConfig {
  /** Master volume (0-1) */
  masterVolume: number
  /** Volume per category (0-1) */
  categoryVolumes: Record<SoundCategory, number>
  /** Maximum concurrent sounds */
  maxConcurrentSounds: number
  /** Whether to auto-suspend when tab is hidden */
  autoSuspendOnHidden: boolean
}

/**
 * Audio manager interface
 */
export interface AudioManager {
  /** Initialize the audio context (must be called after user interaction) */
  init: () => Promise<void>
  /** Check if audio manager is initialized */
  isInitialized: () => boolean
  /** Load a sound from URL */
  loadSound: (key: string, url: string, config?: SoundConfig) => Promise<void>
  /** Load multiple sounds at once */
  loadSounds: (sounds: { key: string; url: string; config?: SoundConfig }[]) => Promise<void>
  /** Check if a sound is loaded */
  isLoaded: (key: string) => boolean
  /** Play a sound */
  play: (key: string, config?: SoundConfig) => string | null
  /** Stop a specific playing sound */
  stop: (instanceId: string) => void
  /** Stop all sounds with a specific key */
  stopAll: (key?: string) => void
  /** Pause a playing sound */
  pause: (instanceId: string) => void
  /** Resume a paused sound */
  resume: (instanceId: string) => void
  /** Set master volume */
  setMasterVolume: (volume: number) => void
  /** Get master volume */
  getMasterVolume: () => number
  /** Set category volume */
  setCategoryVolume: (category: SoundCategory, volume: number) => void
  /** Get category volume */
  getCategoryVolume: (category: SoundCategory) => number
  /** Mute all audio */
  mute: () => void
  /** Unmute all audio */
  unmute: () => void
  /** Check if muted */
  isMuted: () => boolean
  /** Get list of loaded sound keys */
  getLoadedSounds: () => string[]
  /** Get number of currently playing sounds */
  getPlayingCount: () => number
  /** Suspend audio context (for background) */
  suspend: () => Promise<void>
  /** Resume audio context */
  resumeContext: () => Promise<void>
  /** Clean up and dispose */
  dispose: () => void
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default audio manager configuration
 */
export const DEFAULT_AUDIO_CONFIG: AudioManagerConfig = {
  masterVolume: 1.0,
  categoryVolumes: {
    sfx: 1.0,
    music: 0.7,
    ui: 0.8,
    voice: 1.0,
  },
  maxConcurrentSounds: 32,
  autoSuspendOnHidden: true,
}

// ============================================================================
// Audio Manager Implementation
// ============================================================================

/**
 * Creates an audio manager instance
 *
 * @param config - Optional configuration overrides
 * @returns AudioManager instance
 *
 * @example
 * ```ts
 * const audio = createAudioManager();
 *
 * // Initialize on user interaction (required by browsers)
 * document.addEventListener('click', () => audio.init(), { once: true });
 *
 * // Load sounds
 * await audio.loadSound('jump', '/sounds/jump.mp3', { category: 'sfx' });
 * await audio.loadSound('bgm', '/sounds/music.mp3', { category: 'music', loop: true });
 *
 * // Play sounds
 * audio.play('jump');
 * const musicId = audio.play('bgm');
 *
 * // Control volume
 * audio.setMasterVolume(0.8);
 * audio.setCategoryVolume('music', 0.5);
 *
 * // Cleanup
 * audio.dispose();
 * ```
 */
export function createAudioManager(
  config: Partial<AudioManagerConfig> = {}
): AudioManager {
  const fullConfig: AudioManagerConfig = {
    ...DEFAULT_AUDIO_CONFIG,
    ...config,
    categoryVolumes: {
      ...DEFAULT_AUDIO_CONFIG.categoryVolumes,
      ...config.categoryVolumes,
    },
  }

  // Audio context (created lazily)
  let audioContext: AudioContext | null = null

  // Master gain node
  let masterGain: GainNode | null = null

  // Category gain nodes
  const categoryGains: Map<SoundCategory, GainNode> = new Map()

  // Loaded sounds
  const loadedSounds: Map<string, LoadedSound> = new Map()

  // Currently playing sounds
  const playingSounds: Map<string, PlayingSound> = new Map()

  // State
  let muted = false
  let preMuteVolume = fullConfig.masterVolume
  let instanceCounter = 0

  // Visibility change handler reference
  let visibilityHandler: (() => void) | null = null

  /**
   * Generate unique instance ID
   */
  function generateInstanceId(): string {
    return `sound_${++instanceCounter}_${Date.now()}`
  }

  /**
   * Create audio context and setup gain nodes
   */
  function setupAudioContext(): void {
    if (audioContext) return

    // Create audio context
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    // Create master gain node
    masterGain = audioContext.createGain()
    masterGain.gain.value = fullConfig.masterVolume
    masterGain.connect(audioContext.destination)

    // Create category gain nodes
    const categories: SoundCategory[] = ['sfx', 'music', 'ui', 'voice']
    for (const category of categories) {
      const gainNode = audioContext.createGain()
      gainNode.gain.value = fullConfig.categoryVolumes[category]
      gainNode.connect(masterGain)
      categoryGains.set(category, gainNode)
    }

    // Setup visibility change handler
    if (fullConfig.autoSuspendOnHidden) {
      visibilityHandler = () => {
        if (document.hidden) {
          audioContext?.suspend()
        } else {
          audioContext?.resume()
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }

  /**
   * Get the gain node for a category
   */
  function getCategoryGain(category: SoundCategory): GainNode | null {
    return categoryGains.get(category) ?? masterGain
  }

  /**
   * Calculate effective volume for a sound
   */
  function getEffectiveVolume(config: SoundConfig): number {
    const soundVolume = config.volume ?? 1.0
    const categoryVolume = fullConfig.categoryVolumes[config.category ?? 'sfx']
    return soundVolume * categoryVolume
  }

  /**
   * Stop a sound instance and clean up
   */
  function stopSound(instance: PlayingSound): void {
    try {
      instance.source.stop()
    } catch {
      // Already stopped
    }
    instance.source.disconnect()
    instance.gainNode.disconnect()
    playingSounds.delete(instance.id)
  }

  return {
    async init(): Promise<void> {
      setupAudioContext()

      // Resume audio context if suspended (required by autoplay policy)
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume()
      }
    },

    isInitialized(): boolean {
      return audioContext !== null && audioContext.state === 'running'
    },

    async loadSound(key: string, url: string, soundConfig: SoundConfig = {}): Promise<void> {
      if (!audioContext) {
        setupAudioContext()
      }

      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`Failed to fetch sound: ${url}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = await audioContext!.decodeAudioData(arrayBuffer)

        loadedSounds.set(key, {
          key,
          buffer,
          config: {
            volume: 1.0,
            loop: false,
            playbackRate: 1.0,
            category: 'sfx',
            ...soundConfig,
          },
          url,
        })
      } catch (error) {
        console.error(`AudioManager: Failed to load sound "${key}" from ${url}`, error)
        throw error
      }
    },

    async loadSounds(sounds: { key: string; url: string; config?: SoundConfig }[]): Promise<void> {
      await Promise.all(
        sounds.map(({ key, url, config: cfg }) => this.loadSound(key, url, cfg))
      )
    },

    isLoaded(key: string): boolean {
      return loadedSounds.has(key)
    },

    play(key: string, playConfig: SoundConfig = {}): string | null {
      if (!audioContext || !masterGain) {
        console.warn('AudioManager: Audio context not initialized')
        return null
      }

      const sound = loadedSounds.get(key)
      if (!sound) {
        console.warn(`AudioManager: Sound "${key}" not loaded`)
        return null
      }

      // Check concurrent sound limit
      if (playingSounds.size >= fullConfig.maxConcurrentSounds) {
        // Find and remove oldest non-looping sound
        const oldest = Array.from(playingSounds.values())
          .filter(s => !s.config.loop)
          .sort((a, b) => a.startTime - b.startTime)[0]

        if (oldest) {
          stopSound(oldest)
        } else {
          console.warn('AudioManager: Max concurrent sounds reached')
          return null
        }
      }

      // Merge configurations
      const finalConfig: SoundConfig = {
        ...sound.config,
        ...playConfig,
      }

      // Create source node
      const source = audioContext.createBufferSource()
      source.buffer = sound.buffer
      source.loop = finalConfig.loop ?? false
      source.playbackRate.value = finalConfig.playbackRate ?? 1.0

      // Create gain node for this sound
      const gainNode = audioContext.createGain()
      gainNode.gain.value = getEffectiveVolume(finalConfig)

      // Connect to category gain node
      const categoryGain = getCategoryGain(finalConfig.category ?? 'sfx')
      source.connect(gainNode)
      gainNode.connect(categoryGain ?? masterGain)

      // Generate instance ID
      const id = generateInstanceId()

      // Track the playing sound
      const playing: PlayingSound = {
        id,
        key,
        source,
        gainNode,
        startTime: audioContext.currentTime,
        paused: false,
        pausePosition: 0,
        config: finalConfig,
      }
      playingSounds.set(id, playing)

      // Handle sound end
      source.onended = () => {
        playingSounds.delete(id)
      }

      // Start playback
      source.start(0)

      return id
    },

    stop(instanceId: string): void {
      const playing = playingSounds.get(instanceId)
      if (playing) {
        stopSound(playing)
      }
    },

    stopAll(key?: string): void {
      for (const [_id, playing] of playingSounds) {
        if (!key || playing.key === key) {
          stopSound(playing)
        }
      }
    },

    pause(instanceId: string): void {
      const playing = playingSounds.get(instanceId)
      if (playing && !playing.paused && audioContext) {
        playing.pausePosition = audioContext.currentTime - playing.startTime
        playing.paused = true
        try {
          playing.source.stop()
        } catch {
          // Already stopped
        }
      }
    },

    resume(instanceId: string): void {
      const playing = playingSounds.get(instanceId)
      if (playing && playing.paused && audioContext && masterGain) {
        const sound = loadedSounds.get(playing.key)
        if (!sound) return

        // Create new source
        const source = audioContext.createBufferSource()
        source.buffer = sound.buffer
        source.loop = playing.config.loop ?? false
        source.playbackRate.value = playing.config.playbackRate ?? 1.0

        // Connect to existing gain node
        source.connect(playing.gainNode)

        // Update playing entry
        playing.source = source
        playing.startTime = audioContext.currentTime - playing.pausePosition
        playing.paused = false

        // Handle end
        source.onended = () => {
          playingSounds.delete(instanceId)
        }

        // Resume from paused position
        source.start(0, playing.pausePosition)
      }
    },

    setMasterVolume(volume: number): void {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      fullConfig.masterVolume = clampedVolume
      if (masterGain && !muted) {
        masterGain.gain.value = clampedVolume
      }
    },

    getMasterVolume(): number {
      return fullConfig.masterVolume
    },

    setCategoryVolume(category: SoundCategory, volume: number): void {
      const clampedVolume = Math.max(0, Math.min(1, volume))
      fullConfig.categoryVolumes[category] = clampedVolume
      const gain = categoryGains.get(category)
      if (gain) {
        gain.gain.value = clampedVolume
      }
    },

    getCategoryVolume(category: SoundCategory): number {
      return fullConfig.categoryVolumes[category]
    },

    mute(): void {
      if (!muted && masterGain) {
        preMuteVolume = fullConfig.masterVolume
        masterGain.gain.value = 0
        muted = true
      }
    },

    unmute(): void {
      if (muted && masterGain) {
        masterGain.gain.value = preMuteVolume
        muted = false
      }
    },

    isMuted(): boolean {
      return muted
    },

    getLoadedSounds(): string[] {
      return Array.from(loadedSounds.keys())
    },

    getPlayingCount(): number {
      return playingSounds.size
    },

    async suspend(): Promise<void> {
      if (audioContext) {
        await audioContext.suspend()
      }
    },

    async resumeContext(): Promise<void> {
      if (audioContext) {
        await audioContext.resume()
      }
    },

    dispose(): void {
      // Stop all sounds
      this.stopAll()

      // Remove visibility handler
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler)
        visibilityHandler = null
      }

      // Close audio context
      if (audioContext) {
        audioContext.close()
        audioContext = null
      }

      // Clear state
      masterGain = null
      categoryGains.clear()
      loadedSounds.clear()
      playingSounds.clear()
    },
  }
}

// ============================================================================
// Singleton Instance (Optional)
// ============================================================================

let globalAudioManager: AudioManager | null = null

/**
 * Get or create the global audio manager instance
 *
 * Use this for a shared audio manager across the application.
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The global AudioManager instance
 */
export function getGlobalAudioManager(
  config?: Partial<AudioManagerConfig>
): AudioManager {
  if (!globalAudioManager) {
    globalAudioManager = createAudioManager(config)
  }
  return globalAudioManager
}

/**
 * Dispose the global audio manager
 */
export function disposeGlobalAudioManager(): void {
  if (globalAudioManager) {
    globalAudioManager.dispose()
    globalAudioManager = null
  }
}
