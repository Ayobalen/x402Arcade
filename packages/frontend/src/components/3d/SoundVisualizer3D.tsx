import { useRef, useMemo, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

/**
 * Audio analyzer configuration options
 */
export interface AudioAnalyzerConfig {
  /**
   * FFT size for frequency analysis (power of 2).
   * Higher values provide more frequency detail but more CPU usage.
   * @default 256
   */
  fftSize?: number
  /**
   * Smoothing factor between frames (0-1).
   * Higher values create smoother but less reactive visualizations.
   * @default 0.8
   */
  smoothingTimeConstant?: number
  /**
   * Minimum decibel value for normalization.
   * @default -100
   */
  minDecibels?: number
  /**
   * Maximum decibel value for normalization.
   * @default -30
   */
  maxDecibels?: number
}

/**
 * Props for the SoundVisualizer3D component
 */
export interface SoundVisualizer3DProps {
  /**
   * Audio element to visualize (can be HTMLAudioElement or MediaStream).
   */
  audioSource?: HTMLAudioElement | MediaStream | null
  /**
   * Pre-configured AudioContext (optional, will create one if not provided).
   */
  audioContext?: AudioContext | null
  /**
   * Pre-configured AnalyserNode (optional, for custom analysis).
   */
  analyser?: AnalyserNode | null
  /**
   * Number of frequency bars to display.
   * @default 32
   */
  barCount?: number
  /**
   * Radius of the circular visualizer arrangement.
   * @default 2.5
   */
  radius?: number
  /**
   * Maximum height of the bars.
   * @default 1.5
   */
  maxBarHeight?: number
  /**
   * Minimum height of the bars (when silent).
   * @default 0.05
   */
  minBarHeight?: number
  /**
   * Width of each bar.
   * @default 0.08
   */
  barWidth?: number
  /**
   * Depth of each bar.
   * @default 0.08
   */
  barDepth?: number
  /**
   * Start color for low frequencies (CSS color string).
   * @default '#00ffff' (cyan)
   */
  lowFrequencyColor?: string
  /**
   * End color for high frequencies (CSS color string).
   * @default '#ff00ff' (magenta)
   */
  highFrequencyColor?: string
  /**
   * Middle color for mid frequencies (optional).
   * @default '#00ff88' (neon green)
   */
  midFrequencyColor?: string
  /**
   * Emissive intensity for the glow effect.
   * @default 0.6
   */
  glowIntensity?: number
  /**
   * Enable rotation animation around the game frame.
   * @default false
   */
  enableRotation?: boolean
  /**
   * Rotation speed (radians per second).
   * @default 0.1
   */
  rotationSpeed?: number
  /**
   * Y-axis offset for positioning.
   * @default 0
   */
  yOffset?: number
  /**
   * Whether the visualizer is active.
   * @default true
   */
  active?: boolean
  /**
   * Audio analyzer configuration.
   */
  analyzerConfig?: AudioAnalyzerConfig
  /**
   * Visualization mode.
   * - 'circular': Bars arranged in a circle around the frame
   * - 'linear': Bars arranged in a line below the frame
   * - 'wave': Smooth wave visualization
   * @default 'circular'
   */
  mode?: 'circular' | 'linear' | 'wave'
  /**
   * Position offset [x, y, z].
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
}

/**
 * Result returned by useSoundVisualizer hook
 */
export interface UseSoundVisualizerResult {
  /**
   * Connect an audio source to the visualizer.
   */
  connect: (source: HTMLAudioElement | MediaStream) => void
  /**
   * Disconnect the current audio source.
   */
  disconnect: () => void
  /**
   * Whether audio is currently connected.
   */
  isConnected: boolean
  /**
   * Get the current frequency data array.
   */
  getFrequencyData: () => Uint8Array | null
  /**
   * Get the current audio context.
   */
  audioContext: AudioContext | null
  /**
   * Get the analyser node.
   */
  analyser: AnalyserNode | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BAR_COUNT = 32
const DEFAULT_RADIUS = 2.5
const DEFAULT_MAX_BAR_HEIGHT = 1.5
const DEFAULT_MIN_BAR_HEIGHT = 0.05
const DEFAULT_BAR_WIDTH = 0.08
const DEFAULT_BAR_DEPTH = 0.08
const DEFAULT_LOW_FREQ_COLOR = '#00ffff' // Cyan
const DEFAULT_HIGH_FREQ_COLOR = '#ff00ff' // Magenta
const DEFAULT_MID_FREQ_COLOR = '#00ff88' // Neon green
const DEFAULT_GLOW_INTENSITY = 0.6
const DEFAULT_ROTATION_SPEED = 0.1

const DEFAULT_ANALYZER_CONFIG: Required<AudioAnalyzerConfig> = {
  fftSize: 256,
  smoothingTimeConstant: 0.8,
  minDecibels: -100,
  maxDecibels: -30,
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Convert a hex color string to THREE.Color
 */
function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex)
}

/**
 * Interpolate between two colors based on a factor (0-1)
 */
function lerpColor(color1: THREE.Color, color2: THREE.Color, factor: number): THREE.Color {
  return new THREE.Color().lerpColors(color1, color2, factor)
}

/**
 * Get color for a frequency bin based on its position (0-1)
 */
function getFrequencyColor(
  position: number,
  lowColor: THREE.Color,
  midColor: THREE.Color,
  highColor: THREE.Color
): THREE.Color {
  if (position < 0.5) {
    // Low to mid frequency
    return lerpColor(lowColor, midColor, position * 2)
  } else {
    // Mid to high frequency
    return lerpColor(midColor, highColor, (position - 0.5) * 2)
  }
}

// ============================================================================
// FrequencyBars Component (Internal)
// ============================================================================

interface FrequencyBarsProps {
  frequencyData: Uint8Array | null
  barCount: number
  radius: number
  maxBarHeight: number
  minBarHeight: number
  barWidth: number
  barDepth: number
  lowFreqColor: THREE.Color
  midFreqColor: THREE.Color
  highFreqColor: THREE.Color
  glowIntensity: number
  mode: 'circular' | 'linear' | 'wave'
  yOffset: number
}

function FrequencyBars({
  frequencyData,
  barCount,
  radius,
  maxBarHeight,
  minBarHeight,
  barWidth,
  barDepth,
  lowFreqColor,
  midFreqColor,
  highFreqColor,
  glowIntensity,
  mode,
  yOffset,
}: FrequencyBarsProps) {
  const barsRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const colors = useMemo(() => new Float32Array(barCount * 3), [barCount])

  // Pre-calculate bar colors
  useEffect(() => {
    for (let i = 0; i < barCount; i++) {
      const position = i / (barCount - 1)
      const color = getFrequencyColor(position, lowFreqColor, midFreqColor, highFreqColor)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
  }, [barCount, lowFreqColor, midFreqColor, highFreqColor, colors])

  // Animate bars based on frequency data
  useFrame(() => {
    if (!barsRef.current) return

    const mesh = barsRef.current

    for (let i = 0; i < barCount; i++) {
      // Get normalized frequency value (0-1)
      let normalizedValue = minBarHeight
      if (frequencyData && frequencyData.length > 0) {
        // Map bar index to frequency bin
        const binIndex = Math.floor((i / barCount) * frequencyData.length)
        const value = frequencyData[binIndex] || 0
        normalizedValue = minBarHeight + (value / 255) * (maxBarHeight - minBarHeight)
      }

      // Calculate position based on mode
      let x: number, y: number, z: number, rotationY = 0

      switch (mode) {
        case 'circular': {
          const angle = (i / barCount) * Math.PI * 2
          x = Math.sin(angle) * radius
          y = yOffset
          z = Math.cos(angle) * radius
          rotationY = angle
          break
        }
        case 'linear': {
          const totalWidth = barCount * (barWidth * 2)
          x = (i / (barCount - 1)) * totalWidth - totalWidth / 2
          y = yOffset
          z = radius
          break
        }
        case 'wave': {
          const totalWidth = barCount * (barWidth * 2)
          x = (i / (barCount - 1)) * totalWidth - totalWidth / 2
          // Add wave motion based on position and time
          y = yOffset + Math.sin(i * 0.5) * 0.1
          z = radius
          break
        }
      }

      // Set transform
      dummy.position.set(x, y + normalizedValue / 2, z)
      dummy.scale.set(1, normalizedValue / minBarHeight, 1)
      dummy.rotation.y = rotationY

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    }

    mesh.instanceMatrix.needsUpdate = true
  })

  // Create instanced geometry
  const geometry = useMemo(() => {
    return new THREE.BoxGeometry(barWidth, minBarHeight, barDepth)
  }, [barWidth, minBarHeight, barDepth])

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: lowFreqColor,
      emissive: lowFreqColor,
      emissiveIntensity: glowIntensity,
      metalness: 0.8,
      roughness: 0.2,
    })
  }, [lowFreqColor, glowIntensity])

  return (
    <instancedMesh
      ref={barsRef}
      args={[geometry, material, barCount]}
    >
      <instancedBufferAttribute
        attach="instanceColor"
        args={[colors, 3]}
      />
    </instancedMesh>
  )
}

// ============================================================================
// WaveVisualization Component (Internal)
// ============================================================================

interface WaveVisualizationProps {
  frequencyData: Uint8Array | null
  barCount: number
  radius: number
  maxBarHeight: number
  lowFreqColor: THREE.Color
  highFreqColor: THREE.Color
  glowIntensity: number
  yOffset: number
}

function WaveVisualization({
  frequencyData,
  barCount,
  radius,
  maxBarHeight,
  lowFreqColor,
  highFreqColor,
  glowIntensity,
  yOffset,
}: WaveVisualizationProps) {
  const lineRef = useRef<THREE.Line>(null)

  // Create wave points
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const totalWidth = barCount * 0.2
    for (let i = 0; i <= barCount; i++) {
      const x = (i / barCount) * totalWidth - totalWidth / 2
      pts.push(new THREE.Vector3(x, yOffset, radius))
    }
    return pts
  }, [barCount, radius, yOffset])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  // Animate wave based on frequency data
  useFrame(() => {
    if (!lineRef.current || !frequencyData) return

    const positions = lineRef.current.geometry.attributes.position as THREE.BufferAttribute

    for (let i = 0; i <= barCount; i++) {
      const binIndex = Math.floor((i / barCount) * frequencyData.length)
      const value = frequencyData[binIndex] || 0
      const normalizedValue = (value / 255) * maxBarHeight

      positions.setY(i, yOffset + normalizedValue)
    }

    positions.needsUpdate = true
  })

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({
      color: lowFreqColor,
      linewidth: 3,
    })
  }, [lowFreqColor])

  return (
    <line ref={lineRef} geometry={geometry} material={material} />
  )
}

// ============================================================================
// useSoundVisualizer Hook
// ============================================================================

/**
 * Hook for connecting audio sources to the sound visualizer.
 *
 * @example
 * ```tsx
 * const { connect, disconnect, isConnected, analyser } = useSoundVisualizer();
 *
 * // Connect an audio element
 * const audioRef = useRef<HTMLAudioElement>(null);
 * useEffect(() => {
 *   if (audioRef.current) {
 *     connect(audioRef.current);
 *   }
 *   return () => disconnect();
 * }, []);
 *
 * return (
 *   <>
 *     <audio ref={audioRef} src="/music.mp3" />
 *     <SoundVisualizer3D analyser={analyser} active={isConnected} />
 *   </>
 * );
 * ```
 */
export function useSoundVisualizer(
  config: AudioAnalyzerConfig = {}
): UseSoundVisualizerResult {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const isConnectedRef = useRef(false)
  const frequencyDataRef = useRef<Uint8Array | null>(null)

  const mergedConfig = { ...DEFAULT_ANALYZER_CONFIG, ...config }

  const connect = useCallback((source: HTMLAudioElement | MediaStream) => {
    // Clean up existing connections
    if (sourceRef.current) {
      sourceRef.current.disconnect()
    }

    // Create or reuse AudioContext
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }

    const ctx = audioContextRef.current

    // Create analyser node
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = mergedConfig.fftSize
      analyserRef.current.smoothingTimeConstant = mergedConfig.smoothingTimeConstant
      analyserRef.current.minDecibels = mergedConfig.minDecibels
      analyserRef.current.maxDecibels = mergedConfig.maxDecibels
    }

    // Connect source
    if (source instanceof HTMLAudioElement) {
      sourceRef.current = ctx.createMediaElementSource(source)
    } else {
      sourceRef.current = ctx.createMediaStreamSource(source)
    }

    sourceRef.current.connect(analyserRef.current)
    analyserRef.current.connect(ctx.destination)

    // Initialize frequency data array
    frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)

    isConnectedRef.current = true
  }, [mergedConfig])

  const disconnect = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    isConnectedRef.current = false
  }, [])

  const getFrequencyData = useCallback(() => {
    if (analyserRef.current && frequencyDataRef.current) {
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current)
      return frequencyDataRef.current
    }
    return null
  }, [])

  return {
    connect,
    disconnect,
    isConnected: isConnectedRef.current,
    getFrequencyData,
    audioContext: audioContextRef.current,
    analyser: analyserRef.current,
  }
}

// ============================================================================
// Main SoundVisualizer3D Component
// ============================================================================

/**
 * 3D Sound Visualizer that reacts to game audio with frequency bars.
 *
 * Creates a visual representation of audio frequencies using 3D bars
 * arranged in various patterns (circular, linear, or wave). The bars
 * animate in real-time based on the audio frequency data.
 *
 * @example
 * ```tsx
 * // Basic usage with external audio
 * const { connect, analyser, isConnected } = useSoundVisualizer();
 *
 * return (
 *   <Canvas>
 *     <SoundVisualizer3D
 *       analyser={analyser}
 *       active={isConnected}
 *       mode="circular"
 *       radius={3}
 *     />
 *   </Canvas>
 * );
 * ```
 *
 * @example
 * ```tsx
 * // Usage with audio element
 * <Canvas>
 *   <SoundVisualizer3D
 *     audioSource={audioRef.current}
 *     barCount={64}
 *     mode="linear"
 *     position={[0, -2, 0]}
 *   />
 * </Canvas>
 * ```
 */
export function SoundVisualizer3D({
  audioSource,
  audioContext,
  analyser: externalAnalyser,
  barCount = DEFAULT_BAR_COUNT,
  radius = DEFAULT_RADIUS,
  maxBarHeight = DEFAULT_MAX_BAR_HEIGHT,
  minBarHeight = DEFAULT_MIN_BAR_HEIGHT,
  barWidth = DEFAULT_BAR_WIDTH,
  barDepth = DEFAULT_BAR_DEPTH,
  lowFrequencyColor = DEFAULT_LOW_FREQ_COLOR,
  highFrequencyColor = DEFAULT_HIGH_FREQ_COLOR,
  midFrequencyColor = DEFAULT_MID_FREQ_COLOR,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  enableRotation = false,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  yOffset = 0,
  active = true,
  analyzerConfig = {},
  mode = 'circular',
  position = [0, 0, 0],
}: SoundVisualizer3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const audioCtxRef = useRef<AudioContext | null>(audioContext || null)
  const analyserRef = useRef<AnalyserNode | null>(externalAnalyser || null)
  const sourceRef = useRef<MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null>(null)
  const frequencyDataRef = useRef<Uint8Array | null>(null)

  const mergedAnalyzerConfig = { ...DEFAULT_ANALYZER_CONFIG, ...analyzerConfig }

  // Convert color strings to THREE.Color objects
  const lowFreqColor = useMemo(() => hexToColor(lowFrequencyColor), [lowFrequencyColor])
  const midFreqColor = useMemo(() => hexToColor(midFrequencyColor), [midFrequencyColor])
  const highFreqColor = useMemo(() => hexToColor(highFrequencyColor), [highFrequencyColor])

  // Initialize audio context and analyser when audioSource is provided
  useEffect(() => {
    if (!audioSource || !active) return

    // Use external analyser if provided
    if (externalAnalyser) {
      analyserRef.current = externalAnalyser
      frequencyDataRef.current = new Uint8Array(externalAnalyser.frequencyBinCount)
      return
    }

    // Create audio context if not provided
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }

    const ctx = audioCtxRef.current

    // Create analyser node
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser()
      analyserRef.current.fftSize = mergedAnalyzerConfig.fftSize
      analyserRef.current.smoothingTimeConstant = mergedAnalyzerConfig.smoothingTimeConstant
      analyserRef.current.minDecibels = mergedAnalyzerConfig.minDecibels
      analyserRef.current.maxDecibels = mergedAnalyzerConfig.maxDecibels
    }

    // Connect audio source
    try {
      if (audioSource instanceof HTMLAudioElement) {
        sourceRef.current = ctx.createMediaElementSource(audioSource)
      } else {
        sourceRef.current = ctx.createMediaStreamSource(audioSource)
      }

      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(ctx.destination)

      frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
    } catch (error) {
      console.warn('SoundVisualizer3D: Failed to connect audio source', error)
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }
    }
  }, [audioSource, active, externalAnalyser, mergedAnalyzerConfig])

  // Update frequency data each frame
  useFrame((_, delta) => {
    if (!active) return

    // Update rotation
    if (enableRotation && groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed * delta
    }

    // Update frequency data
    if (analyserRef.current && frequencyDataRef.current) {
      analyserRef.current.getByteFrequencyData(frequencyDataRef.current)
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef} position={position}>
      {mode === 'wave' ? (
        <WaveVisualization
          frequencyData={frequencyDataRef.current}
          barCount={barCount}
          radius={radius}
          maxBarHeight={maxBarHeight}
          lowFreqColor={lowFreqColor}
          highFreqColor={highFreqColor}
          glowIntensity={glowIntensity}
          yOffset={yOffset}
        />
      ) : (
        <FrequencyBars
          frequencyData={frequencyDataRef.current}
          barCount={barCount}
          radius={radius}
          maxBarHeight={maxBarHeight}
          minBarHeight={minBarHeight}
          barWidth={barWidth}
          barDepth={barDepth}
          lowFreqColor={lowFreqColor}
          midFreqColor={midFreqColor}
          highFreqColor={highFreqColor}
          glowIntensity={glowIntensity}
          mode={mode}
          yOffset={yOffset}
        />
      )}

      {/* Ambient glow sphere for atmosphere */}
      <mesh position={[0, yOffset, 0]} visible={mode === 'circular'}>
        <sphereGeometry args={[radius * 0.1, 16, 16]} />
        <meshStandardMaterial
          color={lowFreqColor}
          emissive={lowFreqColor}
          emissiveIntensity={glowIntensity * 0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Preset configurations for common visualizer styles.
 */
export const VISUALIZER_PRESETS = {
  /** Classic circular visualizer around the game frame */
  arcade: {
    mode: 'circular' as const,
    barCount: 32,
    radius: 2.5,
    maxBarHeight: 1.5,
    lowFrequencyColor: '#00ffff',
    midFrequencyColor: '#00ff88',
    highFrequencyColor: '#ff00ff',
    glowIntensity: 0.6,
  },
  /** Minimal linear bar below the game */
  minimal: {
    mode: 'linear' as const,
    barCount: 16,
    radius: 1.5,
    maxBarHeight: 0.8,
    lowFrequencyColor: '#00ffff',
    midFrequencyColor: '#00ffff',
    highFrequencyColor: '#00cccc',
    glowIntensity: 0.4,
  },
  /** Intense party mode with many bars */
  party: {
    mode: 'circular' as const,
    barCount: 64,
    radius: 3,
    maxBarHeight: 2,
    lowFrequencyColor: '#ff0000',
    midFrequencyColor: '#ffff00',
    highFrequencyColor: '#ff00ff',
    glowIntensity: 1.0,
    enableRotation: true,
    rotationSpeed: 0.5,
  },
  /** Smooth wave visualization */
  wave: {
    mode: 'wave' as const,
    barCount: 64,
    radius: 1.5,
    maxBarHeight: 1,
    lowFrequencyColor: '#00ff88',
    midFrequencyColor: '#00ffff',
    highFrequencyColor: '#ff00ff',
    glowIntensity: 0.5,
  },
} as const

export type VisualizerPreset = keyof typeof VISUALIZER_PRESETS

/**
 * Get a preset configuration by name.
 */
export function getVisualizerPreset(preset: VisualizerPreset): typeof VISUALIZER_PRESETS[VisualizerPreset] {
  return VISUALIZER_PRESETS[preset]
}

// ============================================================================
// Exports
// ============================================================================

export default SoundVisualizer3D
