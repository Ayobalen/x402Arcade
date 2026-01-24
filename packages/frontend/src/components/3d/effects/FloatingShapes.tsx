/**
 * FloatingShapes - Decorative floating geometric shapes with neon outlines
 *
 * Creates an atmospheric background of floating cubes, pyramids, spheres,
 * and other geometric shapes with glowing neon wireframe edges. Shapes
 * slowly rotate and drift for a dynamic sci-fi feel.
 *
 * @module 3d/effects/FloatingShapes
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export type ShapeType = 'cube' | 'pyramid' | 'sphere' | 'octahedron' | 'torus' | 'icosahedron'

export interface FloatingShapeConfig {
  /** Shape type */
  type: ShapeType
  /** Position [x, y, z] */
  position: [number, number, number]
  /** Scale (uniform) */
  scale: number
  /** Rotation speed multiplier */
  rotationSpeed: number
  /** Color for the shape edges */
  color: string
  /** Glow intensity */
  glowIntensity: number
  /** Drift direction and speed */
  drift: [number, number, number]
}

export interface FloatingShapesProps {
  /**
   * Number of shapes to generate.
   * @default 15
   */
  count?: number
  /**
   * Spread radius for shape placement.
   * @default 30
   */
  spreadRadius?: number
  /**
   * Depth range for Z positioning.
   * @default 40
   */
  depthRange?: number
  /**
   * Size range [min, max] for shapes.
   * @default [0.3, 1.5]
   */
  sizeRange?: [number, number]
  /**
   * Primary neon color.
   * @default '#8B5CF6' (purple accent)
   */
  primaryColor?: string
  /**
   * Secondary neon color.
   * @default '#06B6D4' (cyan)
   */
  secondaryColor?: string
  /**
   * Tertiary neon color.
   * @default '#EC4899' (pink)
   */
  tertiaryColor?: string
  /**
   * Overall opacity.
   * @default 0.8
   */
  opacity?: number
  /**
   * Enable shape rotation animation.
   * @default true
   */
  enableRotation?: boolean
  /**
   * Base rotation speed.
   * @default 0.3
   */
  rotationSpeed?: number
  /**
   * Enable drifting movement.
   * @default true
   */
  enableDrift?: boolean
  /**
   * Drift speed multiplier.
   * @default 0.1
   */
  driftSpeed?: number
  /**
   * Glow intensity.
   * @default 1
   */
  glowIntensity?: number
  /**
   * Enable pulsing glow effect.
   * @default true
   */
  enablePulse?: boolean
  /**
   * Pulse speed.
   * @default 0.5
   */
  pulseSpeed?: number
  /**
   * Render order for layering.
   * @default -200
   */
  renderOrder?: number
  /**
   * Seed for deterministic placement.
   * @default 42
   */
  seed?: number
  /**
   * Custom shapes configuration (overrides count).
   */
  shapes?: FloatingShapeConfig[]
}

export interface FloatingShapesHandle {
  /** Get the group reference */
  getGroup: () => THREE.Group | null
  /** Set global opacity */
  setOpacity: (opacity: number) => void
  /** Set rotation enabled */
  setRotation: (enabled: boolean) => void
  /** Set drift enabled */
  setDrift: (enabled: boolean) => void
  /** Set glow intensity */
  setGlowIntensity: (intensity: number) => void
  /** Reset all animations */
  reset: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_COUNT = 15
const DEFAULT_SPREAD_RADIUS = 30
const DEFAULT_DEPTH_RANGE = 40
const DEFAULT_SIZE_RANGE: [number, number] = [0.3, 1.5]
const DEFAULT_PRIMARY_COLOR = '#8B5CF6' // Purple accent
const DEFAULT_SECONDARY_COLOR = '#06B6D4' // Cyan
const DEFAULT_TERTIARY_COLOR = '#EC4899' // Pink
const DEFAULT_OPACITY = 0.8
const DEFAULT_ROTATION_SPEED = 0.3
const DEFAULT_DRIFT_SPEED = 0.1
const DEFAULT_GLOW_INTENSITY = 1
const DEFAULT_PULSE_SPEED = 0.5
const DEFAULT_SEED = 42

const SHAPE_TYPES: ShapeType[] = ['cube', 'pyramid', 'sphere', 'octahedron', 'torus', 'icosahedron']

// ============================================================================
// Utilities
// ============================================================================

/**
 * Seeded random number generator for deterministic results
 */
function createSeededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff
    return state / 0x7fffffff
  }
}

/**
 * Generate shape configurations
 */
function generateShapeConfigs(
  count: number,
  spreadRadius: number,
  depthRange: number,
  sizeRange: [number, number],
  colors: string[],
  glowIntensity: number,
  seed: number
): FloatingShapeConfig[] {
  const random = createSeededRandom(seed)
  const shapes: FloatingShapeConfig[] = []

  for (let i = 0; i < count; i++) {
    const type = SHAPE_TYPES[Math.floor(random() * SHAPE_TYPES.length)]
    const angle = random() * Math.PI * 2
    const radius = random() * spreadRadius
    const x = Math.cos(angle) * radius
    const y = (random() - 0.5) * spreadRadius * 0.8
    const z = -random() * depthRange - 5

    const scale = sizeRange[0] + random() * (sizeRange[1] - sizeRange[0])
    const color = colors[Math.floor(random() * colors.length)]
    const rotationSpeed = 0.5 + random() * 1.5

    // Drift direction varies per shape
    const drift: [number, number, number] = [
      (random() - 0.5) * 0.5,
      (random() - 0.5) * 0.3,
      (random() - 0.5) * 0.2,
    ]

    shapes.push({
      type,
      position: [x, y, z],
      scale,
      rotationSpeed,
      color,
      glowIntensity,
      drift,
    })
  }

  return shapes
}

// ============================================================================
// Shape Components
// ============================================================================

interface ShapeGeometryProps {
  type: ShapeType
}

function ShapeGeometry({ type }: ShapeGeometryProps) {
  switch (type) {
    case 'cube':
      return <boxGeometry args={[1, 1, 1]} />
    case 'pyramid':
      return <coneGeometry args={[0.7, 1, 4]} />
    case 'sphere':
      return <sphereGeometry args={[0.5, 16, 12]} />
    case 'octahedron':
      return <octahedronGeometry args={[0.6]} />
    case 'torus':
      return <torusGeometry args={[0.5, 0.15, 8, 16]} />
    case 'icosahedron':
      return <icosahedronGeometry args={[0.6, 0]} />
    default:
      return <boxGeometry args={[1, 1, 1]} />
  }
}

interface FloatingShapeProps {
  config: FloatingShapeConfig
  opacity: number
  enableRotation: boolean
  rotationSpeedMult: number
  enableDrift: boolean
  driftSpeed: number
  enablePulse: boolean
  pulseSpeed: number
  glowIntensityMult: number
  renderOrder: number
  index: number
}

function FloatingShape({
  config,
  opacity,
  enableRotation,
  rotationSpeedMult,
  enableDrift,
  driftSpeed,
  enablePulse,
  pulseSpeed,
  glowIntensityMult,
  renderOrder,
  index,
}: FloatingShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const initialPosition = useRef(config.position)
  const timeOffset = index * 0.5 // Offset each shape's animation

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const time = state.clock.getElapsedTime() + timeOffset

    // Rotation
    if (enableRotation) {
      mesh.rotation.x += 0.005 * config.rotationSpeed * rotationSpeedMult
      mesh.rotation.y += 0.008 * config.rotationSpeed * rotationSpeedMult
    }

    // Drift movement
    if (enableDrift) {
      const driftX = Math.sin(time * driftSpeed * config.drift[0]) * 2
      const driftY = Math.cos(time * driftSpeed * config.drift[1] * 1.3) * 1.5
      const driftZ = Math.sin(time * driftSpeed * config.drift[2] * 0.7) * 1
      mesh.position.x = initialPosition.current[0] + driftX
      mesh.position.y = initialPosition.current[1] + driftY
      mesh.position.z = initialPosition.current[2] + driftZ
    }

    // Pulse glow
    if (enablePulse) {
      const material = mesh.material as THREE.MeshStandardMaterial
      if ('emissiveIntensity' in material) {
        const pulse = 0.7 + 0.3 * Math.sin(time * pulseSpeed * Math.PI * 2)
        material.emissiveIntensity = config.glowIntensity * glowIntensityMult * pulse
      }
    }
  })

  const color = useMemo(() => new THREE.Color(config.color), [config.color])

  return (
    <mesh
      ref={meshRef}
      position={config.position}
      scale={config.scale}
      renderOrder={renderOrder}
    >
      <ShapeGeometry type={config.type} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={config.glowIntensity * glowIntensityMult}
        transparent
        opacity={opacity}
        wireframe
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * FloatingShapes - Decorative floating geometric shapes with neon outlines
 *
 * Creates an atmospheric background of floating wireframe shapes with
 * glowing neon colors. Shapes slowly rotate and drift for visual interest.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <FloatingShapes count={20} />
 *
 * // Custom colors
 * <FloatingShapes
 *   primaryColor="#ff00ff"
 *   secondaryColor="#00ffff"
 *   tertiaryColor="#ffff00"
 * />
 *
 * // More dense, faster
 * <FloatingShapes
 *   count={30}
 *   rotationSpeed={0.5}
 *   driftSpeed={0.2}
 * />
 * ```
 */
export const FloatingShapes = forwardRef<FloatingShapesHandle, FloatingShapesProps>(
  function FloatingShapes(
    {
      count = DEFAULT_COUNT,
      spreadRadius = DEFAULT_SPREAD_RADIUS,
      depthRange = DEFAULT_DEPTH_RANGE,
      sizeRange = DEFAULT_SIZE_RANGE,
      primaryColor = DEFAULT_PRIMARY_COLOR,
      secondaryColor = DEFAULT_SECONDARY_COLOR,
      tertiaryColor = DEFAULT_TERTIARY_COLOR,
      opacity = DEFAULT_OPACITY,
      enableRotation = true,
      rotationSpeed = DEFAULT_ROTATION_SPEED,
      enableDrift = true,
      driftSpeed = DEFAULT_DRIFT_SPEED,
      glowIntensity = DEFAULT_GLOW_INTENSITY,
      enablePulse = true,
      pulseSpeed = DEFAULT_PULSE_SPEED,
      renderOrder = -200,
      seed = DEFAULT_SEED,
      shapes: customShapes,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const opacityRef = useRef(opacity)
    const rotationEnabledRef = useRef(enableRotation)
    const driftEnabledRef = useRef(enableDrift)
    const glowIntensityRef = useRef(glowIntensity)

    // Generate or use custom shapes
    const shapes = useMemo(() => {
      if (customShapes) return customShapes
      const colors = [primaryColor, secondaryColor, tertiaryColor]
      return generateShapeConfigs(
        count,
        spreadRadius,
        depthRange,
        sizeRange,
        colors,
        glowIntensity,
        seed
      )
    }, [
      customShapes,
      count,
      spreadRadius,
      depthRange,
      sizeRange,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      glowIntensity,
      seed,
    ])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getGroup: () => groupRef.current,
      setOpacity: (newOpacity: number) => {
        opacityRef.current = Math.max(0, Math.min(1, newOpacity))
      },
      setRotation: (enabled: boolean) => {
        rotationEnabledRef.current = enabled
      },
      setDrift: (enabled: boolean) => {
        driftEnabledRef.current = enabled
      },
      setGlowIntensity: (intensity: number) => {
        glowIntensityRef.current = Math.max(0, intensity)
      },
      reset: () => {
        opacityRef.current = opacity
        rotationEnabledRef.current = enableRotation
        driftEnabledRef.current = enableDrift
        glowIntensityRef.current = glowIntensity
      },
    }))

    return (
      <group ref={groupRef} renderOrder={renderOrder}>
        {shapes.map((config, index) => (
          <FloatingShape
            key={`shape-${index}`}
            config={config}
            opacity={opacity}
            enableRotation={enableRotation}
            rotationSpeedMult={rotationSpeed}
            enableDrift={enableDrift}
            driftSpeed={driftSpeed}
            enablePulse={enablePulse}
            pulseSpeed={pulseSpeed}
            glowIntensityMult={glowIntensity}
            renderOrder={renderOrder + index}
            index={index}
          />
        ))}
      </group>
    )
  }
)

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations for common floating shapes styles
 */
export const FLOATING_SHAPES_PRESETS = {
  /** Subtle background shapes */
  subtle: {
    count: 10,
    spreadRadius: 40,
    depthRange: 50,
    sizeRange: [0.2, 1] as [number, number],
    opacity: 0.4,
    rotationSpeed: 0.2,
    driftSpeed: 0.05,
    glowIntensity: 0.5,
  },
  /** Dense cyberpunk style */
  cyberpunk: {
    count: 25,
    spreadRadius: 25,
    depthRange: 35,
    sizeRange: [0.3, 1.8] as [number, number],
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    tertiaryColor: '#ffff00',
    opacity: 0.9,
    rotationSpeed: 0.4,
    driftSpeed: 0.15,
    glowIntensity: 1.5,
  },
  /** Minimal scattered shapes */
  minimal: {
    count: 6,
    spreadRadius: 50,
    depthRange: 60,
    sizeRange: [0.5, 2] as [number, number],
    opacity: 0.6,
    rotationSpeed: 0.15,
    driftSpeed: 0.03,
    glowIntensity: 0.8,
    enablePulse: false,
  },
  /** Arcade cabinet scene */
  arcade: {
    count: 12,
    spreadRadius: 30,
    depthRange: 40,
    sizeRange: [0.3, 1.2] as [number, number],
    primaryColor: '#8B5CF6', // Purple from design system
    secondaryColor: '#06B6D4',
    tertiaryColor: '#EC4899',
    opacity: 0.7,
    rotationSpeed: 0.3,
    driftSpeed: 0.1,
    glowIntensity: 1,
  },
  /** Matrix/digital rain style */
  matrix: {
    count: 20,
    spreadRadius: 35,
    depthRange: 45,
    sizeRange: [0.2, 0.8] as [number, number],
    primaryColor: '#00ff00',
    secondaryColor: '#00aa00',
    tertiaryColor: '#00ff44',
    opacity: 0.6,
    rotationSpeed: 0.5,
    driftSpeed: 0.2,
    glowIntensity: 1.2,
  },
  /** Synthwave style */
  synthwave: {
    count: 18,
    spreadRadius: 35,
    depthRange: 45,
    sizeRange: [0.4, 1.5] as [number, number],
    primaryColor: '#ff00ff',
    secondaryColor: '#00ffff',
    tertiaryColor: '#ff6b9d',
    opacity: 0.8,
    rotationSpeed: 0.25,
    driftSpeed: 0.08,
    glowIntensity: 1.3,
  },
} as const

export type FloatingShapesPreset = keyof typeof FLOATING_SHAPES_PRESETS

/**
 * Get a floating shapes preset configuration
 */
export function getFloatingShapesPreset(
  preset: FloatingShapesPreset
): (typeof FLOATING_SHAPES_PRESETS)[FloatingShapesPreset] {
  return FLOATING_SHAPES_PRESETS[preset]
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseFloatingShapesOptions {
  /** Initial preset to use */
  preset?: FloatingShapesPreset
  /** Override preset values */
  overrides?: Partial<FloatingShapesProps>
}

export interface UseFloatingShapesResult {
  /** Ref to attach to FloatingShapes */
  ref: React.RefObject<FloatingShapesHandle>
  /** Props to spread on FloatingShapes */
  props: Partial<FloatingShapesProps>
  /** Set global opacity */
  setOpacity: (opacity: number) => void
  /** Set rotation enabled */
  setRotation: (enabled: boolean) => void
  /** Set drift enabled */
  setDrift: (enabled: boolean) => void
  /** Set glow intensity */
  setGlowIntensity: (intensity: number) => void
  /** Reset all animations */
  reset: () => void
}

/**
 * useFloatingShapes - Hook for controlling FloatingShapes component
 *
 * @example
 * ```tsx
 * function ArcadeScene() {
 *   const shapes = useFloatingShapes({ preset: 'arcade' })
 *
 *   // Dim shapes when game is active
 *   const handleGameStart = () => {
 *     shapes.setOpacity(0.3)
 *   }
 *
 *   return <FloatingShapes ref={shapes.ref} {...shapes.props} />
 * }
 * ```
 */
export function useFloatingShapes(
  options: UseFloatingShapesOptions = {}
): UseFloatingShapesResult {
  const { preset = 'arcade', overrides = {} } = options

  const ref = useRef<FloatingShapesHandle>(null)

  const props = useMemo<Partial<FloatingShapesProps>>(() => {
    const presetProps = preset ? FLOATING_SHAPES_PRESETS[preset] : {}
    return { ...presetProps, ...overrides }
  }, [preset, overrides])

  const setOpacity = (opacity: number) => {
    ref.current?.setOpacity(opacity)
  }

  const setRotation = (enabled: boolean) => {
    ref.current?.setRotation(enabled)
  }

  const setDrift = (enabled: boolean) => {
    ref.current?.setDrift(enabled)
  }

  const setGlowIntensity = (intensity: number) => {
    ref.current?.setGlowIntensity(intensity)
  }

  const reset = () => {
    ref.current?.reset()
  }

  return {
    ref,
    props,
    setOpacity,
    setRotation,
    setDrift,
    setGlowIntensity,
    reset,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default FloatingShapes
