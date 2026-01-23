/**
 * Music Manager
 *
 * Dedicated background music management with crossfade support,
 * designed to work alongside the AudioManager for game soundtracks.
 *
 * @module games/engine/music-manager
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Music track configuration
 */
export interface MusicTrack {
  /** Unique track identifier */
  key: string
  /** Audio URL */
  url: string
  /** Optional intro section URL (plays once before looping main) */
  introUrl?: string
  /** Loop points (in seconds) */
  loopStart?: number
  loopEnd?: number
  /** Base volume for this track */
  volume?: number
  /** BPM for beat-synced transitions */
  bpm?: number
}

/**
 * Crossfade configuration
 */
export interface CrossfadeConfig {
  /** Crossfade duration in milliseconds */
  duration: number
  /** Easing type for the fade */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

/**
 * Currently playing music state
 */
export interface MusicState {
  /** Current track key (null if nothing playing) */
  currentTrack: string | null
  /** Whether music is playing */
  playing: boolean
  /** Whether music is paused */
  paused: boolean
  /** Current playback position in seconds */
  position: number
  /** Track duration in seconds */
  duration: number
  /** Current volume (0-1) */
  volume: number
}

/**
 * Music manager configuration
 */
export interface MusicManagerConfig {
  /** Default crossfade duration in ms */
  defaultCrossfadeDuration: number
  /** Default volume (0-1) */
  defaultVolume: number
  /** Whether to auto-resume after tab becomes visible */
  autoResumeOnVisible: boolean
  /** Fade out duration when stopping (ms) */
  fadeOutDuration: number
}

/**
 * Music manager interface
 */
export interface MusicManager {
  /** Initialize the music manager */
  init: () => Promise<void>
  /** Load a music track */
  loadTrack: (track: MusicTrack) => Promise<void>
  /** Load multiple tracks */
  loadTracks: (tracks: MusicTrack[]) => Promise<void>
  /** Check if a track is loaded */
  isLoaded: (key: string) => boolean
  /** Play a music track (with optional crossfade from current) */
  play: (key: string, crossfade?: CrossfadeConfig) => void
  /** Stop the current music (with fade out) */
  stop: (fadeOut?: boolean) => void
  /** Pause the current music */
  pause: () => void
  /** Resume paused music */
  resume: () => void
  /** Set music volume */
  setVolume: (volume: number) => void
  /** Get music volume */
  getVolume: () => number
  /** Get current music state */
  getState: () => MusicState
  /** Get list of loaded tracks */
  getLoadedTracks: () => string[]
  /** Crossfade to a new track */
  crossfadeTo: (key: string, config?: CrossfadeConfig) => void
  /** Clean up and dispose */
  dispose: () => void
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default music manager configuration
 */
export const DEFAULT_MUSIC_CONFIG: MusicManagerConfig = {
  defaultCrossfadeDuration: 2000,
  defaultVolume: 0.7,
  autoResumeOnVisible: true,
  fadeOutDuration: 1000,
}

/**
 * Default crossfade configuration
 */
export const DEFAULT_CROSSFADE: CrossfadeConfig = {
  duration: 2000,
  easing: 'ease-in-out',
}

// ============================================================================
// Music Manager Implementation
// ============================================================================

/**
 * Creates a music manager instance
 *
 * @param config - Optional configuration overrides
 * @returns MusicManager instance
 *
 * @example
 * ```ts
 * const music = createMusicManager();
 *
 * // Initialize on user interaction
 * document.addEventListener('click', () => music.init(), { once: true });
 *
 * // Load tracks
 * await music.loadTrack({
 *   key: 'main-theme',
 *   url: '/music/main-theme.mp3',
 *   volume: 0.8,
 * });
 *
 * await music.loadTrack({
 *   key: 'boss-battle',
 *   url: '/music/boss-battle.mp3',
 *   volume: 0.9,
 * });
 *
 * // Play music
 * music.play('main-theme');
 *
 * // Crossfade to new track
 * music.crossfadeTo('boss-battle', { duration: 3000 });
 *
 * // Control playback
 * music.pause();
 * music.resume();
 * music.setVolume(0.5);
 *
 * // Cleanup
 * music.dispose();
 * ```
 */
export function createMusicManager(
  config: Partial<MusicManagerConfig> = {}
): MusicManager {
  const fullConfig: MusicManagerConfig = {
    ...DEFAULT_MUSIC_CONFIG,
    ...config,
  }

  // Audio context (created lazily)
  let audioContext: AudioContext | null = null

  // Master gain for music
  let masterGain: GainNode | null = null

  // Loaded tracks
  const loadedTracks: Map<string, { track: MusicTrack; buffer: AudioBuffer }> = new Map()

  // Current playback state
  let currentSource: AudioBufferSourceNode | null = null
  let currentGain: GainNode | null = null
  let currentTrackKey: string | null = null
  let isPlaying = false
  let isPaused = false
  let pausePosition = 0
  let startTime = 0
  let volume = fullConfig.defaultVolume

  // Crossfading state
  let crossfadingOutSource: AudioBufferSourceNode | null = null
  let crossfadingOutGain: GainNode | null = null

  // Visibility handler
  let visibilityHandler: (() => void) | null = null

  // Animation frame for crossfade
  let crossfadeAnimationFrame: number | null = null

  /**
   * Apply easing to a value
   */
  function applyEasing(t: number, easing: CrossfadeConfig['easing']): number {
    switch (easing) {
      case 'ease-in':
        return t * t
      case 'ease-out':
        return 1 - (1 - t) * (1 - t)
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      case 'linear':
      default:
        return t
    }
  }

  /**
   * Create audio context and gain nodes
   */
  function setupAudioContext(): void {
    if (audioContext) return

    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()

    masterGain = audioContext.createGain()
    masterGain.gain.value = volume
    masterGain.connect(audioContext.destination)

    // Setup visibility handler
    if (fullConfig.autoResumeOnVisible) {
      visibilityHandler = () => {
        if (document.hidden) {
          if (isPlaying && !isPaused && audioContext) {
            audioContext.suspend()
          }
        } else {
          if (isPlaying && !isPaused && audioContext) {
            audioContext.resume()
          }
        }
      }
      document.addEventListener('visibilitychange', visibilityHandler)
    }
  }

  /**
   * Stop current source and clean up
   */
  function stopCurrentSource(fadeOut: boolean = false): Promise<void> {
    return new Promise((resolve) => {
      if (!currentSource || !currentGain || !audioContext) {
        resolve()
        return
      }

      if (fadeOut && fullConfig.fadeOutDuration > 0) {
        // Fade out
        const startGain = currentGain.gain.value
        const startTimeMs = performance.now()
        const duration = fullConfig.fadeOutDuration

        const fadeStep = (): void => {
          const elapsed = performance.now() - startTimeMs
          const progress = Math.min(elapsed / duration, 1)
          const easedProgress = applyEasing(progress, 'ease-out')

          if (currentGain) {
            currentGain.gain.value = startGain * (1 - easedProgress)
          }

          if (progress < 1) {
            requestAnimationFrame(fadeStep)
          } else {
            try {
              currentSource?.stop()
            } catch {
              // Already stopped
            }
            currentSource?.disconnect()
            currentGain?.disconnect()
            currentSource = null
            currentGain = null
            resolve()
          }
        }
        requestAnimationFrame(fadeStep)
      } else {
        try {
          currentSource.stop()
        } catch {
          // Already stopped
        }
        currentSource.disconnect()
        currentGain.disconnect()
        currentSource = null
        currentGain = null
        resolve()
      }
    })
  }

  /**
   * Start playing a track
   */
  function startTrack(key: string, offset: number = 0): void {
    const trackData = loadedTracks.get(key)
    if (!trackData || !audioContext || !masterGain) return

    const { track, buffer } = trackData

    // Create source
    const source = audioContext.createBufferSource()
    source.buffer = buffer
    source.loop = true

    // Set loop points if specified
    if (track.loopStart !== undefined) {
      source.loopStart = track.loopStart
    }
    if (track.loopEnd !== undefined) {
      source.loopEnd = track.loopEnd
    }

    // Create gain node for this track
    const gain = audioContext.createGain()
    const trackVolume = track.volume ?? 1.0
    gain.gain.value = trackVolume

    // Connect
    source.connect(gain)
    gain.connect(masterGain)

    // Track state
    currentSource = source
    currentGain = gain
    currentTrackKey = key
    startTime = audioContext.currentTime - offset

    // Handle end (shouldn't happen with loop, but just in case)
    source.onended = () => {
      if (currentSource === source) {
        isPlaying = false
        currentTrackKey = null
      }
    }

    // Start
    source.start(0, offset)
    isPlaying = true
    isPaused = false
  }

  return {
    async init(): Promise<void> {
      setupAudioContext()

      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume()
      }
    },

    async loadTrack(track: MusicTrack): Promise<void> {
      if (!audioContext) {
        setupAudioContext()
      }

      try {
        const response = await fetch(track.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch music: ${track.url}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        const buffer = await audioContext!.decodeAudioData(arrayBuffer)

        loadedTracks.set(track.key, { track, buffer })
      } catch (error) {
        console.error(`MusicManager: Failed to load track "${track.key}"`, error)
        throw error
      }
    },

    async loadTracks(tracks: MusicTrack[]): Promise<void> {
      await Promise.all(tracks.map((track) => this.loadTrack(track)))
    },

    isLoaded(key: string): boolean {
      return loadedTracks.has(key)
    },

    play(key: string, crossfade?: CrossfadeConfig): void {
      if (!loadedTracks.has(key)) {
        console.warn(`MusicManager: Track "${key}" not loaded`)
        return
      }

      if (crossfade && isPlaying && currentTrackKey !== key) {
        this.crossfadeTo(key, crossfade)
        return
      }

      // Stop current if playing different track
      if (isPlaying && currentTrackKey !== key) {
        stopCurrentSource(false)
      }

      // Don't restart if same track is playing
      if (isPlaying && currentTrackKey === key) {
        return
      }

      startTrack(key)
    },

    async stop(fadeOut: boolean = true): Promise<void> {
      await stopCurrentSource(fadeOut)
      isPlaying = false
      isPaused = false
      currentTrackKey = null
      pausePosition = 0
    },

    pause(): void {
      if (!isPlaying || isPaused || !audioContext || !currentSource) return

      pausePosition = audioContext.currentTime - startTime
      try {
        currentSource.stop()
      } catch {
        // Already stopped
      }
      currentSource.disconnect()
      currentSource = null

      isPaused = true
    },

    resume(): void {
      if (!isPaused || !currentTrackKey) return

      startTrack(currentTrackKey, pausePosition)
      isPaused = false
    },

    setVolume(newVolume: number): void {
      volume = Math.max(0, Math.min(1, newVolume))
      if (masterGain) {
        masterGain.gain.value = volume
      }
    },

    getVolume(): number {
      return volume
    },

    getState(): MusicState {
      let position = 0
      let duration = 0

      if (currentTrackKey && audioContext) {
        const trackData = loadedTracks.get(currentTrackKey)
        if (trackData) {
          duration = trackData.buffer.duration
          if (isPlaying && !isPaused) {
            position = audioContext.currentTime - startTime
            // Handle looping
            if (position > duration) {
              position = position % duration
            }
          } else if (isPaused) {
            position = pausePosition
          }
        }
      }

      return {
        currentTrack: currentTrackKey,
        playing: isPlaying,
        paused: isPaused,
        position,
        duration,
        volume,
      }
    },

    getLoadedTracks(): string[] {
      return Array.from(loadedTracks.keys())
    },

    crossfadeTo(key: string, crossfadeConfig?: CrossfadeConfig): void {
      if (!loadedTracks.has(key)) {
        console.warn(`MusicManager: Track "${key}" not loaded`)
        return
      }

      if (currentTrackKey === key) {
        return // Already playing this track
      }

      if (!audioContext || !masterGain) {
        // No current track, just play normally
        startTrack(key)
        return
      }

      const config: CrossfadeConfig = {
        ...DEFAULT_CROSSFADE,
        ...crossfadeConfig,
      }

      // Cancel any existing crossfade
      if (crossfadeAnimationFrame) {
        cancelAnimationFrame(crossfadeAnimationFrame)
      }

      // Save references to outgoing track
      crossfadingOutSource = currentSource
      crossfadingOutGain = currentGain

      // Start the new track
      const newTrackData = loadedTracks.get(key)
      if (!newTrackData) return

      const { track, buffer } = newTrackData

      // Create new source
      const newSource = audioContext.createBufferSource()
      newSource.buffer = buffer
      newSource.loop = true

      if (track.loopStart !== undefined) {
        newSource.loopStart = track.loopStart
      }
      if (track.loopEnd !== undefined) {
        newSource.loopEnd = track.loopEnd
      }

      // Create new gain
      const newGain = audioContext.createGain()
      const trackVolume = track.volume ?? 1.0
      newGain.gain.value = 0 // Start at 0

      newSource.connect(newGain)
      newGain.connect(masterGain)

      // Update state
      currentSource = newSource
      currentGain = newGain
      currentTrackKey = key
      startTime = audioContext.currentTime

      newSource.onended = () => {
        if (currentSource === newSource) {
          isPlaying = false
          currentTrackKey = null
        }
      }

      newSource.start(0)

      // Crossfade animation
      const startTimeMs = performance.now()
      const outGainStart = crossfadingOutGain?.gain.value ?? volume

      const crossfadeStep = (): void => {
        const elapsed = performance.now() - startTimeMs
        const progress = Math.min(elapsed / config.duration, 1)
        const easedProgress = applyEasing(progress, config.easing)

        // Fade out old
        if (crossfadingOutGain) {
          crossfadingOutGain.gain.value = outGainStart * (1 - easedProgress)
        }

        // Fade in new
        if (newGain) {
          newGain.gain.value = trackVolume * easedProgress
        }

        if (progress < 1) {
          crossfadeAnimationFrame = requestAnimationFrame(crossfadeStep)
        } else {
          // Crossfade complete - clean up old source
          if (crossfadingOutSource) {
            try {
              crossfadingOutSource.stop()
            } catch {
              // Already stopped
            }
            crossfadingOutSource.disconnect()
          }
          if (crossfadingOutGain) {
            crossfadingOutGain.disconnect()
          }
          crossfadingOutSource = null
          crossfadingOutGain = null
          crossfadeAnimationFrame = null
        }
      }

      crossfadeAnimationFrame = requestAnimationFrame(crossfadeStep)
    },

    dispose(): void {
      // Cancel crossfade
      if (crossfadeAnimationFrame) {
        cancelAnimationFrame(crossfadeAnimationFrame)
      }

      // Stop all sources
      if (currentSource) {
        try {
          currentSource.stop()
        } catch {
          // Already stopped
        }
        currentSource.disconnect()
      }
      if (crossfadingOutSource) {
        try {
          crossfadingOutSource.stop()
        } catch {
          // Already stopped
        }
        crossfadingOutSource.disconnect()
      }

      // Remove visibility handler
      if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler)
      }

      // Close context
      if (audioContext) {
        audioContext.close()
      }

      // Clear state
      audioContext = null
      masterGain = null
      currentSource = null
      currentGain = null
      crossfadingOutSource = null
      crossfadingOutGain = null
      loadedTracks.clear()
      isPlaying = false
      isPaused = false
      currentTrackKey = null
    },
  }
}

// ============================================================================
// Singleton Instance (Optional)
// ============================================================================

let globalMusicManager: MusicManager | null = null

/**
 * Get or create the global music manager instance
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The global MusicManager instance
 */
export function getGlobalMusicManager(
  config?: Partial<MusicManagerConfig>
): MusicManager {
  if (!globalMusicManager) {
    globalMusicManager = createMusicManager(config)
  }
  return globalMusicManager
}

/**
 * Dispose the global music manager
 */
export function disposeGlobalMusicManager(): void {
  if (globalMusicManager) {
    globalMusicManager.dispose()
    globalMusicManager = null
  }
}
