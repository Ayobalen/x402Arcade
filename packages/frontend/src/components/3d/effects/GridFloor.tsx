/**
 * GridFloor - Animated perspective grid floor for retro arcade aesthetic
 *
 * Creates an infinite scrolling grid floor effect reminiscent of 80s
 * synthwave and classic arcade games. Supports forward movement animation,
 * wave distortion, and customizable colors.
 *
 * @module 3d/effects/GridFloor
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface GridFloorProps {
  /**
   * Size of the grid (width and depth).
   * @default 100
   */
  size?: number
  /**
   * Number of grid divisions.
   * @default 50
   */
  divisions?: number
  /**
   * Grid line color.
   * @default '#8B5CF6' (purple accent)
   */
  color?: string
  /**
   * Grid line opacity.
   * @default 0.6
   */
  opacity?: number
  /**
   * Enable forward scrolling animation.
   * @default true
   */
  enableAnimation?: boolean
  /**
   * Animation speed (units per second).
   * @default 2
   */
  speed?: number
  /**
   * Enable wave distortion effect.
   * @default true
   */
  enableWave?: boolean
  /**
   * Wave amplitude (height of wave).
   * @default 0.3
   */
  waveAmplitude?: number
  /**
   * Wave frequency (how often waves repeat).
   * @default 0.1
   */
  waveFrequency?: number
  /**
   * Wave speed (cycles per second).
   * @default 0.5
   */
  waveSpeed?: number
  /**
   * Y position of the grid.
   * @default -2
   */
  yPosition?: number
  /**
   * Rotation on X axis (to tilt away from camera).
   * @default -Math.PI / 2
   */
  rotation?: number
  /**
   * Enable fade out at distance.
   * @default true
   */
  enableFade?: boolean
  /**
   * Fade start distance from center.
   * @default 20
   */
  fadeStart?: number
  /**
   * Enable glow effect on lines.
   * @default true
   */
  enableGlow?: boolean
  /**
   * Glow intensity.
   * @default 1
   */
  glowIntensity?: number
  /**
   * Render order for layering.
   * @default -100
   */
  renderOrder?: number
}

export interface GridFloorHandle {
  /** Get the mesh reference */
  getMesh: () => THREE.Mesh | null
  /** Set animation speed */
  setSpeed: (speed: number) => void
  /** Set animation enabled state */
  setAnimation: (enabled: boolean) => void
  /** Set wave enabled state */
  setWave: (enabled: boolean) => void
  /** Get current animation offset */
  getOffset: () => number
  /** Reset animation to start */
  reset: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SIZE = 100
const DEFAULT_DIVISIONS = 50
const DEFAULT_COLOR = '#8B5CF6' // Purple accent from design system
const DEFAULT_OPACITY = 0.6
const DEFAULT_SPEED = 2
const DEFAULT_WAVE_AMPLITUDE = 0.3
const DEFAULT_WAVE_FREQUENCY = 0.1
const DEFAULT_WAVE_SPEED = 0.5
const DEFAULT_Y_POSITION = -2
const DEFAULT_FADE_START = 20
const DEFAULT_GLOW_INTENSITY = 1

// ============================================================================
// Shader Code
// ============================================================================

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uOffset;
  uniform bool uEnableWave;
  uniform float uWaveAmplitude;
  uniform float uWaveFrequency;
  uniform float uWaveSpeed;

  varying vec2 vUv;
  varying float vDistance;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Apply wave distortion
    if (uEnableWave) {
      float wavePhase = pos.y * uWaveFrequency + uTime * uWaveSpeed;
      pos.z += sin(wavePhase) * uWaveAmplitude;

      // Add secondary smaller wave for complexity
      float wave2Phase = pos.x * uWaveFrequency * 0.5 + uTime * uWaveSpeed * 0.7;
      pos.z += sin(wave2Phase) * uWaveAmplitude * 0.3;
    }

    vDistance = length(pos.xy);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uOffset;
  uniform float uDivisions;
  uniform float uSize;
  uniform bool uEnableFade;
  uniform float uFadeStart;
  uniform float uGlowIntensity;

  varying vec2 vUv;
  varying float vDistance;

  void main() {
    // Calculate grid position with offset for scrolling
    vec2 gridPos = vUv * uDivisions;
    gridPos.y += uOffset;

    // Create grid lines using fract
    vec2 grid = abs(fract(gridPos - 0.5) - 0.5) / fwidth(gridPos);
    float line = min(grid.x, grid.y);

    // Anti-aliased line
    float lineIntensity = 1.0 - min(line, 1.0);

    // Add glow effect
    float glow = max(0.0, 1.0 - line * 0.5) * uGlowIntensity * 0.3;
    lineIntensity += glow;

    // Fade based on distance from center
    float fade = 1.0;
    if (uEnableFade) {
      float fadeDistance = length((vUv - 0.5) * uSize);
      fade = 1.0 - smoothstep(uFadeStart, uSize * 0.5, fadeDistance);
    }

    // Perspective fade (fade more at far end)
    float perspectiveFade = smoothstep(0.0, 0.4, vUv.y);

    float alpha = lineIntensity * uOpacity * fade * perspectiveFade;

    if (alpha < 0.01) discard;

    gl_FragColor = vec4(uColor, alpha);
  }
`

// ============================================================================
// Main Component
// ============================================================================

/**
 * GridFloor - Animated perspective grid for retro arcade aesthetic
 *
 * Creates an infinite scrolling grid floor effect with optional wave
 * distortion. Perfect for synthwave/vaporwave arcade backgrounds.
 *
 * @example
 * ```tsx
 * // Basic scrolling grid
 * <GridFloor speed={3} color="#00ffff" />
 *
 * // Static grid with wave effect
 * <GridFloor
 *   enableAnimation={false}
 *   enableWave
 *   waveAmplitude={0.5}
 * />
 *
 * // Dense cyberpunk grid
 * <GridFloor
 *   divisions={100}
 *   color="#ff00ff"
 *   speed={5}
 *   enableGlow
 * />
 * ```
 */
export const GridFloor = forwardRef<GridFloorHandle, GridFloorProps>(
  function GridFloor(
    {
      size = DEFAULT_SIZE,
      divisions = DEFAULT_DIVISIONS,
      color = DEFAULT_COLOR,
      opacity = DEFAULT_OPACITY,
      enableAnimation = true,
      speed = DEFAULT_SPEED,
      enableWave = true,
      waveAmplitude = DEFAULT_WAVE_AMPLITUDE,
      waveFrequency = DEFAULT_WAVE_FREQUENCY,
      waveSpeed = DEFAULT_WAVE_SPEED,
      yPosition = DEFAULT_Y_POSITION,
      rotation = -Math.PI / 2,
      enableFade = true,
      fadeStart = DEFAULT_FADE_START,
      enableGlow = true,
      glowIntensity = DEFAULT_GLOW_INTENSITY,
      renderOrder = -100,
    },
    ref
  ) {
    const meshRef = useRef<THREE.Mesh>(null)
    const offsetRef = useRef(0)
    const speedRef = useRef(speed)
    const animationEnabledRef = useRef(enableAnimation)
    const waveEnabledRef = useRef(enableWave)

    // Create shader material uniforms
    const uniforms = useMemo(
      () => ({
        uTime: { value: 0 },
        uSpeed: { value: speed },
        uOffset: { value: 0 },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
        uDivisions: { value: divisions },
        uSize: { value: size },
        uEnableWave: { value: enableWave },
        uWaveAmplitude: { value: waveAmplitude },
        uWaveFrequency: { value: waveFrequency },
        uWaveSpeed: { value: waveSpeed },
        uEnableFade: { value: enableFade },
        uFadeStart: { value: fadeStart },
        uGlowIntensity: { value: enableGlow ? glowIntensity : 0 },
      }),
      [
        color,
        opacity,
        divisions,
        size,
        enableWave,
        waveAmplitude,
        waveFrequency,
        waveSpeed,
        enableFade,
        fadeStart,
        enableGlow,
        glowIntensity,
        speed,
      ]
    )

    // Animation loop
    useFrame((state, delta) => {
      const mesh = meshRef.current
      if (!mesh) return

      const material = mesh.material as THREE.ShaderMaterial
      if (!material.uniforms) return

      // Update time uniform
      material.uniforms.uTime.value = state.clock.getElapsedTime()

      // Update wave enabled state
      material.uniforms.uEnableWave.value = waveEnabledRef.current

      // Update scroll offset if animation is enabled
      if (animationEnabledRef.current) {
        offsetRef.current += speedRef.current * delta * 0.1
        // Wrap offset to prevent floating point precision issues
        if (offsetRef.current > divisions) {
          offsetRef.current -= divisions
        }
        material.uniforms.uOffset.value = offsetRef.current
      }
    })

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getMesh: () => meshRef.current,
      setSpeed: (newSpeed: number) => {
        speedRef.current = Math.max(0, newSpeed)
      },
      setAnimation: (enabled: boolean) => {
        animationEnabledRef.current = enabled
      },
      setWave: (enabled: boolean) => {
        waveEnabledRef.current = enabled
      },
      getOffset: () => offsetRef.current,
      reset: () => {
        offsetRef.current = 0
      },
    }))

    return (
      <mesh
        ref={meshRef}
        position={[0, yPosition, 0]}
        rotation={[rotation, 0, 0]}
        renderOrder={renderOrder}
      >
        <planeGeometry args={[size, size, divisions, divisions]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    )
  }
)

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations for common grid styles
 */
export const GRID_FLOOR_PRESETS = {
  /** Classic synthwave grid */
  synthwave: {
    size: 100,
    divisions: 40,
    color: '#ff00ff',
    opacity: 0.7,
    speed: 3,
    enableWave: true,
    waveAmplitude: 0.2,
    enableGlow: true,
  },
  /** Cyberpunk neon grid */
  cyberpunk: {
    size: 80,
    divisions: 60,
    color: '#00ffff',
    opacity: 0.8,
    speed: 4,
    enableWave: true,
    waveAmplitude: 0.4,
    waveSpeed: 0.7,
    enableGlow: true,
    glowIntensity: 1.5,
  },
  /** Subtle background grid */
  subtle: {
    size: 120,
    divisions: 30,
    color: '#8B5CF6',
    opacity: 0.4,
    speed: 1.5,
    enableWave: false,
    enableGlow: false,
  },
  /** Tron-style grid */
  tron: {
    size: 100,
    divisions: 50,
    color: '#00d4ff',
    opacity: 0.9,
    speed: 5,
    enableWave: false,
    enableGlow: true,
    glowIntensity: 2,
  },
  /** Dense matrix-style grid */
  matrix: {
    size: 60,
    divisions: 100,
    color: '#00ff00',
    opacity: 0.5,
    speed: 8,
    enableWave: true,
    waveAmplitude: 0.15,
    enableGlow: true,
  },
  /** Arcade cabinet floor */
  arcade: {
    size: 80,
    divisions: 40,
    color: '#8B5CF6', // Purple accent from design system
    opacity: 0.5,
    speed: 2,
    enableWave: true,
    waveAmplitude: 0.2,
    waveSpeed: 0.3,
    enableGlow: true,
    glowIntensity: 0.8,
  },
} as const

export type GridFloorPreset = keyof typeof GRID_FLOOR_PRESETS

/**
 * Get a grid floor preset configuration
 */
export function getGridFloorPreset(preset: GridFloorPreset): typeof GRID_FLOOR_PRESETS[GridFloorPreset] {
  return GRID_FLOOR_PRESETS[preset]
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseGridFloorOptions {
  /** Initial preset to use */
  preset?: GridFloorPreset
  /** Override preset values */
  overrides?: Partial<GridFloorProps>
}

export interface UseGridFloorResult {
  /** Ref to attach to GridFloor */
  ref: React.RefObject<GridFloorHandle>
  /** Props to spread on GridFloor */
  props: Partial<GridFloorProps>
  /** Set animation speed */
  setSpeed: (speed: number) => void
  /** Set animation enabled state */
  setAnimation: (enabled: boolean) => void
  /** Set wave enabled state */
  setWave: (enabled: boolean) => void
  /** Reset animation */
  reset: () => void
}

/**
 * useGridFloor - Hook for controlling GridFloor component
 *
 * @example
 * ```tsx
 * function ArcadeScene() {
 *   const grid = useGridFloor({ preset: 'arcade' })
 *
 *   // Speed up when game is intense
 *   const handleIntensity = (level: number) => {
 *     grid.setSpeed(2 + level * 2)
 *   }
 *
 *   return <GridFloor ref={grid.ref} {...grid.props} />
 * }
 * ```
 */
export function useGridFloor(options: UseGridFloorOptions = {}): UseGridFloorResult {
  const { preset = 'arcade', overrides = {} } = options

  const ref = useRef<GridFloorHandle>(null)

  const props = useMemo<Partial<GridFloorProps>>(() => {
    const presetProps = preset ? GRID_FLOOR_PRESETS[preset] : {}
    return { ...presetProps, ...overrides }
  }, [preset, overrides])

  const setSpeed = (speed: number) => {
    ref.current?.setSpeed(speed)
  }

  const setAnimation = (enabled: boolean) => {
    ref.current?.setAnimation(enabled)
  }

  const setWave = (enabled: boolean) => {
    ref.current?.setWave(enabled)
  }

  const reset = () => {
    ref.current?.reset()
  }

  return {
    ref,
    props,
    setSpeed,
    setAnimation,
    setWave,
    reset,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default GridFloor
