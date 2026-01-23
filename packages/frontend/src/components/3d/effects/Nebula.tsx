/**
 * Nebula - Colorful nebula clouds for atmospheric background effects
 *
 * Creates volumetric-looking nebula clouds using layered transparent planes
 * with gradient textures and subtle animation. Designed to layer behind
 * other scene elements for depth.
 *
 * @module 3d/effects/Nebula
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface NebulaProps {
  /**
   * Number of nebula cloud layers.
   * @default 5
   */
  layers?: number
  /**
   * Radius of the nebula spread.
   * @default 30
   */
  radius?: number
  /**
   * Primary nebula color (purple by default).
   * @default '#8B5CF6'
   */
  primaryColor?: string
  /**
   * Secondary nebula color (blue by default).
   * @default '#3B82F6'
   */
  secondaryColor?: string
  /**
   * Tertiary accent color (cyan by default).
   * @default '#06B6D4'
   */
  accentColor?: string
  /**
   * Base opacity for nebula layers.
   * @default 0.15
   */
  opacity?: number
  /**
   * Enable subtle animation.
   * @default true
   */
  enableAnimation?: boolean
  /**
   * Animation speed multiplier.
   * @default 0.1
   */
  animationSpeed?: number
  /**
   * Enable color pulsing effect.
   * @default true
   */
  enablePulse?: boolean
  /**
   * Pulse speed (cycles per second).
   * @default 0.05
   */
  pulseSpeed?: number
  /**
   * Pulse intensity (0-1).
   * @default 0.2
   */
  pulseAmount?: number
  /**
   * Z position (negative = farther from camera).
   * @default -20
   */
  zPosition?: number
  /**
   * Render order for layering.
   * @default -500
   */
  renderOrder?: number
  /**
   * Use fog integration for depth fade.
   * @default false
   */
  useFog?: boolean
  /**
   * Seed for random placement.
   */
  seed?: number
}

export interface NebulaHandle {
  /** Get the group reference */
  getGroup: () => THREE.Group | null
  /** Set overall opacity */
  setOpacity: (opacity: number) => void
  /** Set animation enabled state */
  setAnimation: (enabled: boolean) => void
  /** Set pulse enabled state */
  setPulse: (enabled: boolean) => void
  /** Trigger a color flash effect */
  flash: (color?: string, duration?: number) => void
}

export interface NebulaCloudConfig {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  color: string
  opacity: number
  animationOffset: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_LAYERS = 5
const DEFAULT_RADIUS = 30
const DEFAULT_PRIMARY_COLOR = '#8B5CF6' // Purple accent from design system
const DEFAULT_SECONDARY_COLOR = '#3B82F6' // Blue
const DEFAULT_ACCENT_COLOR = '#06B6D4' // Cyan
const DEFAULT_OPACITY = 0.15
const DEFAULT_ANIMATION_SPEED = 0.1
const DEFAULT_PULSE_SPEED = 0.05
const DEFAULT_PULSE_AMOUNT = 0.2
const DEFAULT_Z_POSITION = -20

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

/**
 * Generate procedural cloud texture
 */
function generateCloudTexture(
  size: number,
  color: THREE.Color,
  random: () => number
): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Clear with transparent
  ctx.clearRect(0, 0, size, size)

  // Create radial gradient for soft cloud look
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = size / 2

  // Create multiple overlapping gradients for organic look
  const numGradients = 3 + Math.floor(random() * 3)
  for (let i = 0; i < numGradients; i++) {
    const offsetX = (random() - 0.5) * size * 0.3
    const offsetY = (random() - 0.5) * size * 0.3
    const gradientRadius = maxRadius * (0.6 + random() * 0.4)

    const gradient = ctx.createRadialGradient(
      centerX + offsetX,
      centerY + offsetY,
      0,
      centerX + offsetX,
      centerY + offsetY,
      gradientRadius
    )

    const alpha = 0.3 + random() * 0.4
    gradient.addColorStop(0, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha})`)
    gradient.addColorStop(0.3, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha * 0.6})`)
    gradient.addColorStop(0.6, `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha * 0.3})`)
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  // Add some noise for organic feel
  const imageData = ctx.getImageData(0, 0, size, size)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const noise = (random() - 0.5) * 20
    data[i] = Math.max(0, Math.min(255, data[i] + noise))
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
  }
  ctx.putImageData(imageData, 0, 0)

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * Generate nebula cloud configurations
 */
function generateCloudConfigs(
  count: number,
  radius: number,
  colors: string[],
  opacity: number,
  random: () => number
): NebulaCloudConfig[] {
  const configs: NebulaCloudConfig[] = []

  for (let i = 0; i < count; i++) {
    // Distribute clouds in a rough sphere shape, biased toward the back
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1) * 0.5 // Bias toward front hemisphere
    const r = radius * (0.3 + random() * 0.7)

    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.6 // Flatten vertically
    const z = -Math.abs(r * Math.cos(phi)) // Ensure clouds are behind

    configs.push({
      position: [x, y, z] as [number, number, number],
      rotation: [
        (random() - 0.5) * 0.3,
        (random() - 0.5) * 0.3,
        random() * Math.PI * 2,
      ] as [number, number, number],
      scale: 5 + random() * 15,
      color: colors[Math.floor(random() * colors.length)],
      opacity: opacity * (0.5 + random() * 0.5),
      animationOffset: random() * Math.PI * 2,
    })
  }

  return configs
}

// ============================================================================
// Sub-components
// ============================================================================

interface NebulaCloudProps {
  config: NebulaCloudConfig
  texture: THREE.Texture
  animationEnabled: boolean
  animationSpeed: number
  pulseEnabled: boolean
  pulseSpeed: number
  pulseAmount: number
  baseOpacity: number
}

/**
 * Single nebula cloud plane
 */
function NebulaCloud({
  config,
  texture,
  animationEnabled,
  animationSpeed,
  pulseEnabled,
  pulseSpeed,
  pulseAmount,
  baseOpacity,
}: NebulaCloudProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Animation
  useFrame(({ clock }) => {
    const mesh = meshRef.current
    const material = materialRef.current
    if (!mesh || !material) return

    const time = clock.getElapsedTime()

    // Subtle rotation animation
    if (animationEnabled) {
      mesh.rotation.z =
        config.rotation[2] +
        Math.sin(time * animationSpeed + config.animationOffset) * 0.1
    }

    // Opacity pulse
    if (pulseEnabled) {
      const pulse =
        1 - pulseAmount * 0.5 * (1 + Math.sin(time * pulseSpeed * Math.PI * 2 + config.animationOffset))
      material.opacity = config.opacity * baseOpacity * pulse
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={config.position}
      rotation={config.rotation}
      scale={config.scale}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={config.opacity * baseOpacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Nebula - Atmospheric nebula cloud effect for background
 *
 * Creates layered transparent planes with procedural cloud textures
 * to simulate colorful space nebulae. Supports subtle animation
 * and color pulsing.
 *
 * @example
 * ```tsx
 * // Basic nebula
 * <Nebula layers={5} radius={40} />
 *
 * // Custom colors
 * <Nebula
 *   primaryColor="#ff00ff"
 *   secondaryColor="#00ffff"
 *   opacity={0.2}
 *   enableAnimation
 * />
 *
 * // Minimal static background
 * <Nebula
 *   layers={3}
 *   enableAnimation={false}
 *   enablePulse={false}
 *   opacity={0.1}
 * />
 * ```
 */
export const Nebula = forwardRef<NebulaHandle, NebulaProps>(
  function Nebula(
    {
      layers = DEFAULT_LAYERS,
      radius = DEFAULT_RADIUS,
      primaryColor = DEFAULT_PRIMARY_COLOR,
      secondaryColor = DEFAULT_SECONDARY_COLOR,
      accentColor = DEFAULT_ACCENT_COLOR,
      opacity = DEFAULT_OPACITY,
      enableAnimation = true,
      animationSpeed = DEFAULT_ANIMATION_SPEED,
      enablePulse = true,
      pulseSpeed = DEFAULT_PULSE_SPEED,
      pulseAmount = DEFAULT_PULSE_AMOUNT,
      zPosition = DEFAULT_Z_POSITION,
      renderOrder = -500,
      seed,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const seedRef = useRef(seed ?? Math.random() * 10000)
    const opacityRef = useRef(opacity)
    const animationEnabledRef = useRef(enableAnimation)
    const pulseEnabledRef = useRef(enablePulse)
    const flashRef = useRef({ active: false, color: '', elapsed: 0, duration: 0 })

    // Generate cloud configurations and textures
    const { configs, textures } = useMemo(() => {
      const random = seededRandom(seedRef.current)
      const colors = [primaryColor, secondaryColor, accentColor]

      const cloudConfigs = generateCloudConfigs(
        layers,
        radius,
        colors,
        1, // Base opacity applied in render
        random
      )

      // Generate textures for each color
      const textureMap: Record<string, THREE.Texture> = {}
      colors.forEach((color) => {
        if (!textureMap[color]) {
          textureMap[color] = generateCloudTexture(
            256,
            new THREE.Color(color),
            seededRandom(seedRef.current + color.length)
          )
        }
      })

      return {
        configs: cloudConfigs,
        textures: textureMap,
      }
    }, [layers, radius, primaryColor, secondaryColor, accentColor])

    // Flash animation
    useFrame((_, delta) => {
      if (flashRef.current.active) {
        flashRef.current.elapsed += delta
        if (flashRef.current.elapsed >= flashRef.current.duration) {
          flashRef.current.active = false
        }
      }
    })

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getGroup: () => groupRef.current,
      setOpacity: (newOpacity: number) => {
        opacityRef.current = THREE.MathUtils.clamp(newOpacity, 0, 1)
      },
      setAnimation: (enabled: boolean) => {
        animationEnabledRef.current = enabled
      },
      setPulse: (enabled: boolean) => {
        pulseEnabledRef.current = enabled
      },
      flash: (color = '#ffffff', duration = 0.5) => {
        flashRef.current = { active: true, color, elapsed: 0, duration }
      },
    }))

    // Calculate flash intensity
    const flashIntensity = flashRef.current.active
      ? 1 - flashRef.current.elapsed / flashRef.current.duration
      : 0

    return (
      <group
        ref={groupRef}
        position={[0, 0, zPosition]}
        renderOrder={renderOrder}
      >
        {configs.map((config, index) => (
          <NebulaCloud
            key={`nebula-cloud-${index}`}
            config={config}
            texture={textures[config.color]}
            animationEnabled={animationEnabledRef.current}
            animationSpeed={animationSpeed}
            pulseEnabled={pulseEnabledRef.current}
            pulseSpeed={pulseSpeed}
            pulseAmount={pulseAmount}
            baseOpacity={opacityRef.current * (1 + flashIntensity * 0.5)}
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
 * Preset configurations for common nebula styles
 */
export const NEBULA_PRESETS = {
  /** Deep purple space nebula */
  deepPurple: {
    layers: 6,
    radius: 40,
    primaryColor: '#8B5CF6',
    secondaryColor: '#6366F1',
    accentColor: '#A855F7',
    opacity: 0.18,
    enableAnimation: true,
    enablePulse: true,
    pulseAmount: 0.15,
  },
  /** Cool blue nebula */
  blue: {
    layers: 5,
    radius: 35,
    primaryColor: '#3B82F6',
    secondaryColor: '#06B6D4',
    accentColor: '#0EA5E9',
    opacity: 0.15,
    enableAnimation: true,
    enablePulse: true,
  },
  /** Warm cosmic dust */
  cosmic: {
    layers: 7,
    radius: 50,
    primaryColor: '#F59E0B',
    secondaryColor: '#EF4444',
    accentColor: '#EC4899',
    opacity: 0.12,
    enableAnimation: true,
    enablePulse: true,
    pulseAmount: 0.25,
  },
  /** Minimal subtle effect */
  subtle: {
    layers: 3,
    radius: 30,
    primaryColor: '#8B5CF6',
    secondaryColor: '#3B82F6',
    accentColor: '#06B6D4',
    opacity: 0.08,
    enableAnimation: false,
    enablePulse: false,
  },
  /** Dense colorful nebula */
  dense: {
    layers: 10,
    radius: 25,
    primaryColor: '#EC4899',
    secondaryColor: '#8B5CF6',
    accentColor: '#06B6D4',
    opacity: 0.2,
    enableAnimation: true,
    enablePulse: true,
    animationSpeed: 0.05,
  },
  /** Arcade-appropriate background */
  arcade: {
    layers: 4,
    radius: 45,
    primaryColor: '#8B5CF6', // Purple accent from design system
    secondaryColor: '#1a1a2e', // Surface color
    accentColor: '#00ffff', // Cyan accent
    opacity: 0.1,
    enableAnimation: true,
    enablePulse: true,
    pulseAmount: 0.1,
    pulseSpeed: 0.03,
  },
} as const

export type NebulaPreset = keyof typeof NEBULA_PRESETS

/**
 * Get a nebula preset configuration
 */
export function getNebulaPreset(preset: NebulaPreset): typeof NEBULA_PRESETS[NebulaPreset] {
  return NEBULA_PRESETS[preset]
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseNebulaOptions {
  /** Initial preset to use */
  preset?: NebulaPreset
  /** Override preset values */
  overrides?: Partial<NebulaProps>
}

export interface UseNebulaResult {
  /** Ref to attach to Nebula */
  ref: React.RefObject<NebulaHandle>
  /** Props to spread on Nebula */
  props: Partial<NebulaProps>
  /** Set opacity */
  setOpacity: (opacity: number) => void
  /** Set animation enabled */
  setAnimation: (enabled: boolean) => void
  /** Set pulse enabled */
  setPulse: (enabled: boolean) => void
  /** Trigger flash effect */
  flash: (color?: string, duration?: number) => void
}

/**
 * useNebula - Hook for controlling Nebula component
 *
 * @example
 * ```tsx
 * function SpaceScene() {
 *   const nebula = useNebula({ preset: 'deepPurple' })
 *
 *   return <Nebula ref={nebula.ref} {...nebula.props} />
 * }
 * ```
 */
export function useNebula(options: UseNebulaOptions = {}): UseNebulaResult {
  const { preset = 'arcade', overrides = {} } = options

  const ref = useRef<NebulaHandle>(null)

  const props = useMemo<Partial<NebulaProps>>(() => {
    const presetProps = preset ? NEBULA_PRESETS[preset] : {}
    return { ...presetProps, ...overrides }
  }, [preset, overrides])

  const setOpacity = (opacity: number) => {
    ref.current?.setOpacity(opacity)
  }

  const setAnimation = (enabled: boolean) => {
    ref.current?.setAnimation(enabled)
  }

  const setPulse = (enabled: boolean) => {
    ref.current?.setPulse(enabled)
  }

  const flash = (color?: string, duration?: number) => {
    ref.current?.flash(color, duration)
  }

  return {
    ref,
    props,
    setOpacity,
    setAnimation,
    setPulse,
    flash,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default Nebula
