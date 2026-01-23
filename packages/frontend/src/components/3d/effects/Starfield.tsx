/**
 * Starfield - 3D starfield particle system for deep space background
 *
 * Creates a procedural starfield with thousands of points that can be used
 * as a background layer. Supports various star distributions, sizes, colors,
 * and optional animation.
 *
 * @module 3d/effects/Starfield
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface StarfieldProps {
  /**
   * Number of stars to generate.
   * @default 3000
   */
  count?: number
  /**
   * Radius of the star sphere.
   * @default 50
   */
  radius?: number
  /**
   * Distribution pattern for stars.
   * @default 'sphere'
   */
  distribution?: 'sphere' | 'cube' | 'disk' | 'hemisphere'
  /**
   * Minimum star size.
   * @default 0.1
   */
  minSize?: number
  /**
   * Maximum star size.
   * @default 0.5
   */
  maxSize?: number
  /**
   * Base star color.
   * @default '#ffffff'
   */
  color?: string
  /**
   * Enable color variation (some stars will be slightly colored).
   * @default true
   */
  colorVariation?: boolean
  /**
   * Base opacity for stars.
   * @default 1.0
   */
  opacity?: number
  /**
   * Enable star twinkling animation.
   * @default true
   */
  enableTwinkle?: boolean
  /**
   * Twinkle speed (cycles per second).
   * @default 0.5
   */
  twinkleSpeed?: number
  /**
   * Twinkle amount (0-1).
   * @default 0.3
   */
  twinkleAmount?: number
  /**
   * Enable rotation animation.
   * @default false
   */
  enableRotation?: boolean
  /**
   * Rotation speed (radians per second).
   * @default 0.01
   */
  rotationSpeed?: number
  /**
   * Rotation axis.
   * @default [0, 1, 0]
   */
  rotationAxis?: [number, number, number]
  /**
   * Depth offset for background layer (negative moves away from camera).
   * @default 0
   */
  depthOffset?: number
  /**
   * Render order (higher = rendered later, appears in front).
   * @default -1000
   */
  renderOrder?: number
  /**
   * Enable depth write (usually disabled for backgrounds).
   * @default false
   */
  depthWrite?: boolean
  /**
   * Use additive blending for glow effect.
   * @default true
   */
  additiveBlending?: boolean
  /**
   * Use custom star texture instead of circles.
   */
  texture?: THREE.Texture
  /**
   * Seed for random generation (for reproducible results).
   */
  seed?: number
}

export interface StarfieldHandle {
  /** Get the points object reference */
  getPoints: () => THREE.Points | null
  /** Regenerate stars with new seed */
  regenerate: (seed?: number) => void
  /** Set overall opacity */
  setOpacity: (opacity: number) => void
  /** Set twinkle enabled state */
  setTwinkle: (enabled: boolean) => void
  /** Set rotation enabled state */
  setRotation: (enabled: boolean) => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COUNT = 3000
const DEFAULT_RADIUS = 50
const DEFAULT_MIN_SIZE = 0.1
const DEFAULT_MAX_SIZE = 0.5
const DEFAULT_TWINKLE_SPEED = 0.5
const DEFAULT_TWINKLE_AMOUNT = 0.3
const DEFAULT_ROTATION_SPEED = 0.01

// Star color variations for realism
const STAR_COLOR_VARIATIONS = [
  '#ffffff', // White
  '#fffaf0', // Warm white
  '#f0f8ff', // Cool white
  '#add8e6', // Light blue (hot stars)
  '#ffe4b5', // Orange-yellow (cooler stars)
  '#ffd700', // Gold (sun-like)
  '#ff6b6b', // Red (cool giants)
  '#b0c4de', // Light steel blue
]

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Seeded random number generator for reproducible star positions
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Generate star positions based on distribution type
 */
function generateStarPositions(
  count: number,
  radius: number,
  distribution: StarfieldProps['distribution'],
  random: () => number
): Float32Array {
  const positions = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    let x: number, y: number, z: number

    switch (distribution) {
      case 'cube':
        x = (random() - 0.5) * 2 * radius
        y = (random() - 0.5) * 2 * radius
        z = (random() - 0.5) * 2 * radius
        break

      case 'disk':
        // Flat disk distribution
        const angle = random() * Math.PI * 2
        const r = Math.sqrt(random()) * radius // sqrt for uniform density
        x = Math.cos(angle) * r
        y = (random() - 0.5) * radius * 0.1 // Thin disk
        z = Math.sin(angle) * r
        break

      case 'hemisphere':
        // Upper hemisphere only
        const theta1 = random() * Math.PI * 2
        const phi1 = random() * Math.PI * 0.5
        const rad1 = radius * (0.3 + random() * 0.7) // Vary radius
        x = rad1 * Math.sin(phi1) * Math.cos(theta1)
        y = rad1 * Math.cos(phi1)
        z = rad1 * Math.sin(phi1) * Math.sin(theta1)
        break

      case 'sphere':
      default:
        // Full sphere with uniform density
        const theta = random() * Math.PI * 2
        const phi = Math.acos(2 * random() - 1)
        const rad = radius * (0.3 + random() * 0.7) // Vary radius for depth
        x = rad * Math.sin(phi) * Math.cos(theta)
        y = rad * Math.sin(phi) * Math.sin(theta)
        z = rad * Math.cos(phi)
        break
    }

    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z
  }

  return positions
}

/**
 * Generate star sizes with natural variation
 */
function generateStarSizes(
  count: number,
  minSize: number,
  maxSize: number,
  random: () => number
): Float32Array {
  const sizes = new Float32Array(count)
  const sizeRange = maxSize - minSize

  for (let i = 0; i < count; i++) {
    // Use exponential distribution for realistic star magnitude
    // Most stars are small, few are bright
    const t = random()
    const exponential = 1 - Math.pow(t, 2) // Bias toward smaller sizes
    sizes[i] = minSize + sizeRange * exponential
  }

  return sizes
}

/**
 * Generate star colors with optional variation
 */
function generateStarColors(
  count: number,
  baseColor: string,
  enableVariation: boolean,
  random: () => number
): Float32Array {
  const colors = new Float32Array(count * 3)
  const base = new THREE.Color(baseColor)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    let color: THREE.Color

    if (enableVariation && random() < 0.3) {
      // 30% of stars get color variation
      const variationColor = STAR_COLOR_VARIATIONS[
        Math.floor(random() * STAR_COLOR_VARIATIONS.length)
      ]
      color = new THREE.Color(variationColor)
    } else {
      // Slight brightness variation
      const brightness = 0.8 + random() * 0.4
      color = base.clone().multiplyScalar(brightness)
    }

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  return colors
}

/**
 * Generate twinkle phase offsets for animation
 */
function generateTwinklePhases(
  count: number,
  random: () => number
): Float32Array {
  const phases = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    phases[i] = random() * Math.PI * 2
  }

  return phases
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Starfield - 3D starfield particle system for deep space backgrounds
 *
 * Creates a procedural starfield using Points geometry for efficient rendering.
 * Supports various distribution patterns, star size/color variation, and
 * optional twinkling and rotation animations.
 *
 * @example
 * ```tsx
 * // Basic starfield
 * <Starfield count={5000} radius={100} />
 *
 * // Animated starfield with warm colors
 * <Starfield
 *   count={3000}
 *   color="#ffe4b5"
 *   enableTwinkle
 *   enableRotation
 *   rotationSpeed={0.005}
 * />
 *
 * // Dense disk-shaped galaxy background
 * <Starfield
 *   count={10000}
 *   distribution="disk"
 *   radius={80}
 *   colorVariation
 * />
 * ```
 */
export const Starfield = forwardRef<StarfieldHandle, StarfieldProps>(
  function Starfield(
    {
      count = DEFAULT_COUNT,
      radius = DEFAULT_RADIUS,
      distribution = 'sphere',
      minSize = DEFAULT_MIN_SIZE,
      maxSize = DEFAULT_MAX_SIZE,
      color = '#ffffff',
      colorVariation = true,
      opacity = 1.0,
      enableTwinkle = true,
      twinkleSpeed = DEFAULT_TWINKLE_SPEED,
      twinkleAmount = DEFAULT_TWINKLE_AMOUNT,
      enableRotation = false,
      rotationSpeed = DEFAULT_ROTATION_SPEED,
      rotationAxis = [0, 1, 0],
      depthOffset = 0,
      renderOrder = -1000,
      depthWrite = false,
      additiveBlending = true,
      texture,
      seed,
    },
    ref
  ) {
    const pointsRef = useRef<THREE.Points>(null)
    const materialRef = useRef<THREE.PointsMaterial>(null)
    const seedRef = useRef(seed ?? Math.random() * 10000)
    const twinkleEnabledRef = useRef(enableTwinkle)
    const rotationEnabledRef = useRef(enableRotation)

    // Generate star data
    const { geometry, twinklePhases, originalSizes } = useMemo(() => {
      const random = seededRandom(seedRef.current)

      const positions = generateStarPositions(count, radius, distribution, random)
      const sizes = generateStarSizes(count, minSize, maxSize, random)
      const colors = generateStarColors(count, color, colorVariation, random)
      const phases = generateTwinklePhases(count, random)

      const geom = new THREE.BufferGeometry()
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
      geom.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
      geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

      return {
        geometry: geom,
        twinklePhases: phases,
        originalSizes: sizes.slice(), // Clone for twinkle reset
      }
    }, [count, radius, distribution, minSize, maxSize, color, colorVariation])

    // Normalized rotation axis
    const normalizedAxis = useMemo(() => {
      const vec = new THREE.Vector3(...rotationAxis).normalize()
      return vec
    }, [rotationAxis])

    // Animation loop
    useFrame((state) => {
      const points = pointsRef.current
      if (!points) return

      // Twinkle animation
      if (twinkleEnabledRef.current) {
        const sizeAttr = points.geometry.getAttribute('size')
        const time = state.clock.getElapsedTime() * twinkleSpeed * Math.PI * 2

        for (let i = 0; i < count; i++) {
          const phase = twinklePhases[i]
          const twinkle = 1 - twinkleAmount * 0.5 * (1 + Math.sin(time + phase))
          sizeAttr.setX(i, originalSizes[i] * twinkle)
        }
        sizeAttr.needsUpdate = true
      }

      // Rotation animation
      if (rotationEnabledRef.current) {
        points.rotateOnAxis(normalizedAxis, rotationSpeed * state.clock.getDelta() * 60)
      }
    })

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getPoints: () => pointsRef.current,
      regenerate: (newSeed?: number) => {
        seedRef.current = newSeed ?? Math.random() * 10000
        // Force re-render by updating ref
      },
      setOpacity: (newOpacity: number) => {
        if (materialRef.current) {
          materialRef.current.opacity = THREE.MathUtils.clamp(newOpacity, 0, 1)
        }
      },
      setTwinkle: (enabled: boolean) => {
        twinkleEnabledRef.current = enabled
      },
      setRotation: (enabled: boolean) => {
        rotationEnabledRef.current = enabled
      },
    }))

    return (
      <points
        ref={pointsRef}
        position={[0, 0, depthOffset]}
        renderOrder={renderOrder}
        frustumCulled={false}
      >
        <primitive object={geometry} attach="geometry" />
        <pointsMaterial
          ref={materialRef}
          size={1}
          sizeAttenuation
          vertexColors
          transparent
          opacity={opacity}
          depthWrite={depthWrite}
          blending={additiveBlending ? THREE.AdditiveBlending : THREE.NormalBlending}
          map={texture}
        />
      </points>
    )
  }
)

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations for common starfield styles
 */
export const STARFIELD_PRESETS = {
  /** Deep space background - classic starfield */
  deepSpace: {
    count: 5000,
    radius: 100,
    distribution: 'sphere' as const,
    minSize: 0.05,
    maxSize: 0.4,
    colorVariation: true,
    enableTwinkle: true,
    twinkleSpeed: 0.3,
    twinkleAmount: 0.4,
  },
  /** Dense star cluster */
  cluster: {
    count: 8000,
    radius: 30,
    distribution: 'sphere' as const,
    minSize: 0.02,
    maxSize: 0.15,
    colorVariation: true,
    enableTwinkle: true,
    twinkleSpeed: 0.5,
  },
  /** Galaxy disk with rotation */
  galaxy: {
    count: 10000,
    radius: 80,
    distribution: 'disk' as const,
    minSize: 0.03,
    maxSize: 0.2,
    color: '#ffe4b5',
    colorVariation: true,
    enableTwinkle: true,
    enableRotation: true,
    rotationSpeed: 0.005,
  },
  /** Sparse distant stars */
  distant: {
    count: 1500,
    radius: 200,
    distribution: 'sphere' as const,
    minSize: 0.1,
    maxSize: 0.3,
    enableTwinkle: true,
    twinkleAmount: 0.5,
  },
  /** Nebula-style colorful stars */
  nebula: {
    count: 4000,
    radius: 60,
    distribution: 'sphere' as const,
    minSize: 0.08,
    maxSize: 0.35,
    color: '#add8e6',
    colorVariation: true,
    enableTwinkle: true,
    twinkleSpeed: 0.4,
    additiveBlending: true,
  },
  /** Arcade game backdrop - minimal, non-distracting */
  arcade: {
    count: 2000,
    radius: 80,
    distribution: 'hemisphere' as const,
    minSize: 0.05,
    maxSize: 0.2,
    color: '#ffffff',
    colorVariation: false,
    enableTwinkle: true,
    twinkleAmount: 0.2,
    opacity: 0.6,
  },
} as const

export type StarfieldPreset = keyof typeof STARFIELD_PRESETS

/**
 * Get a starfield preset configuration
 */
export function getStarfieldPreset(preset: StarfieldPreset): typeof STARFIELD_PRESETS[StarfieldPreset] {
  return STARFIELD_PRESETS[preset]
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseStarfieldOptions {
  /** Initial preset to use */
  preset?: StarfieldPreset
  /** Override preset values */
  overrides?: Partial<StarfieldProps>
}

export interface UseStarfieldResult {
  /** Ref to attach to Starfield */
  ref: React.RefObject<StarfieldHandle>
  /** Props to spread on Starfield */
  props: Partial<StarfieldProps>
  /** Set twinkle state */
  setTwinkle: (enabled: boolean) => void
  /** Set rotation state */
  setRotation: (enabled: boolean) => void
  /** Set opacity */
  setOpacity: (opacity: number) => void
  /** Regenerate stars */
  regenerate: () => void
}

/**
 * useStarfield - Hook for controlling Starfield component
 *
 * @example
 * ```tsx
 * function SpaceScene() {
 *   const starfield = useStarfield({ preset: 'deepSpace' })
 *
 *   return <Starfield ref={starfield.ref} {...starfield.props} />
 * }
 * ```
 */
export function useStarfield(
  options: UseStarfieldOptions = {}
): UseStarfieldResult {
  const { preset = 'deepSpace', overrides = {} } = options

  const ref = useRef<StarfieldHandle>(null)

  const props = useMemo<Partial<StarfieldProps>>(() => {
    const presetProps = preset ? STARFIELD_PRESETS[preset] : {}
    return { ...presetProps, ...overrides }
  }, [preset, overrides])

  const setTwinkle = (enabled: boolean) => {
    ref.current?.setTwinkle(enabled)
  }

  const setRotation = (enabled: boolean) => {
    ref.current?.setRotation(enabled)
  }

  const setOpacity = (opacity: number) => {
    ref.current?.setOpacity(opacity)
  }

  const regenerate = () => {
    ref.current?.regenerate()
  }

  return {
    ref,
    props,
    setTwinkle,
    setRotation,
    setOpacity,
    regenerate,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default Starfield
