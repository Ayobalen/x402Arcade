/**
 * CabinetLighting - Cabinet-specific environment lighting
 *
 * Provides specialized lighting for the arcade cabinet including spotlights,
 * rim lights, and floor bounce effects that enhance the arcade atmosphere.
 *
 * @module 3d/cabinet/CabinetLighting
 */

import { useRef, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CABINET_BODY } from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface CabinetLightingProps {
  /**
   * Position of the cabinet (lighting is relative to this).
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Enable the overhead spotlight.
   * @default true
   */
  enableSpotlight?: boolean
  /**
   * Spotlight color.
   * @default '#ffffff'
   */
  spotlightColor?: string
  /**
   * Spotlight intensity (0-5).
   * @default 1.5
   */
  spotlightIntensity?: number
  /**
   * Enable colored rim lights on sides.
   * @default true
   */
  enableRimLights?: boolean
  /**
   * Left rim light color.
   * @default '#8B5CF6' (purple accent)
   */
  rimLightLeftColor?: string
  /**
   * Right rim light color.
   * @default '#00ffff' (cyan accent)
   */
  rimLightRightColor?: string
  /**
   * Rim light intensity (0-5).
   * @default 1.0
   */
  rimLightIntensity?: number
  /**
   * Enable floor bounce light (simulates light reflecting from floor).
   * @default true
   */
  enableFloorBounce?: boolean
  /**
   * Floor bounce light color.
   * @default '#1a1a2e'
   */
  floorBounceColor?: string
  /**
   * Floor bounce light intensity (0-3).
   * @default 0.3
   */
  floorBounceIntensity?: number
  /**
   * Enable shadow casting for lights.
   * @default true
   */
  castShadow?: boolean
  /**
   * Shadow map quality.
   * @default 'medium'
   */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
  /**
   * Enable subtle pulsing animation on rim lights.
   * @default true
   */
  enablePulse?: boolean
  /**
   * Pulse speed (cycles per second).
   * @default 0.5
   */
  pulseSpeed?: number
  /**
   * Overall intensity multiplier.
   * @default 1.0
   */
  intensityMultiplier?: number
  /**
   * Use a lighting preset.
   */
  preset?: CabinetLightingPreset
  /**
   * Debug mode - shows light helper spheres.
   * @default false
   */
  debug?: boolean
}

export interface CabinetLightingHandle {
  /** Set spotlight intensity */
  setSpotlightIntensity: (intensity: number) => void
  /** Set rim light intensity */
  setRimLightIntensity: (intensity: number) => void
  /** Set floor bounce intensity */
  setFloorBounceIntensity: (intensity: number) => void
  /** Flash all lights */
  flash: (duration?: number) => void
  /** Apply a preset */
  applyPreset: (preset: CabinetLightingPreset) => void
  /** Get current lighting state */
  getState: () => CabinetLightingState
}

export interface CabinetLightingState {
  spotlightIntensity: number
  rimLightIntensity: number
  floorBounceIntensity: number
  isFlashing: boolean
}

export type CabinetLightingPreset =
  | 'default'     // Standard arcade lighting
  | 'dramatic'    // High contrast with shadows
  | 'neon'        // Full neon glow emphasis
  | 'subtle'      // Soft, minimal lighting
  | 'game-over'   // Red danger lighting
  | 'victory'     // Green celebration lighting

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_SPOTLIGHT_COLOR = '#ffffff'
const DEFAULT_SPOTLIGHT_INTENSITY = 1.5
const DEFAULT_RIM_LEFT_COLOR = '#8B5CF6' // Purple accent from design system
const DEFAULT_RIM_RIGHT_COLOR = '#00ffff' // Cyan accent
const DEFAULT_RIM_INTENSITY = 1.0
const DEFAULT_FLOOR_BOUNCE_COLOR = '#1a1a2e'
const DEFAULT_FLOOR_BOUNCE_INTENSITY = 0.3
const DEFAULT_PULSE_SPEED = 0.5

/** Shadow quality settings */
const SHADOW_QUALITY = {
  low: { mapSize: 512, bias: -0.001 },
  medium: { mapSize: 1024, bias: -0.0005 },
  high: { mapSize: 2048, bias: -0.0001 },
  ultra: { mapSize: 4096, bias: -0.00005 },
} as const

/** Lighting presets */
export const CABINET_LIGHTING_PRESETS: Record<CabinetLightingPreset, {
  spotlightColor: string
  spotlightIntensity: number
  rimLightLeftColor: string
  rimLightRightColor: string
  rimLightIntensity: number
  floorBounceColor: string
  floorBounceIntensity: number
  pulseSpeed: number
}> = {
  default: {
    spotlightColor: '#ffffff',
    spotlightIntensity: 1.5,
    rimLightLeftColor: '#8B5CF6',
    rimLightRightColor: '#00ffff',
    rimLightIntensity: 1.0,
    floorBounceColor: '#1a1a2e',
    floorBounceIntensity: 0.3,
    pulseSpeed: 0.5,
  },
  dramatic: {
    spotlightColor: '#ffffff',
    spotlightIntensity: 2.5,
    rimLightLeftColor: '#8B5CF6',
    rimLightRightColor: '#00ffff',
    rimLightIntensity: 1.5,
    floorBounceColor: '#0a0a0f',
    floorBounceIntensity: 0.1,
    pulseSpeed: 0.3,
  },
  neon: {
    spotlightColor: '#ffffff',
    spotlightIntensity: 0.5,
    rimLightLeftColor: '#ff00ff',
    rimLightRightColor: '#00ffff',
    rimLightIntensity: 2.5,
    floorBounceColor: '#1a0a2a',
    floorBounceIntensity: 0.4,
    pulseSpeed: 0.7,
  },
  subtle: {
    spotlightColor: '#eeeeee',
    spotlightIntensity: 0.8,
    rimLightLeftColor: '#8B5CF6',
    rimLightRightColor: '#4a9eff',
    rimLightIntensity: 0.4,
    floorBounceColor: '#1e1e2e',
    floorBounceIntensity: 0.5,
    pulseSpeed: 0.2,
  },
  'game-over': {
    spotlightColor: '#ff4444',
    spotlightIntensity: 1.2,
    rimLightLeftColor: '#ff3333',
    rimLightRightColor: '#ff8800',
    rimLightIntensity: 1.8,
    floorBounceColor: '#1a0a0a',
    floorBounceIntensity: 0.2,
    pulseSpeed: 1.5,
  },
  victory: {
    spotlightColor: '#ffffff',
    spotlightIntensity: 2.0,
    rimLightLeftColor: '#00ff88',
    rimLightRightColor: '#00ffff',
    rimLightIntensity: 2.0,
    floorBounceColor: '#0a1a0a',
    floorBounceIntensity: 0.4,
    pulseSpeed: 0.4,
  },
}

// ============================================================================
// Sub-components
// ============================================================================

interface SpotlightFromAboveProps {
  position: [number, number, number]
  color: string
  intensity: number
  castShadow: boolean
  shadowMapSize: number
  shadowBias: number
}

/**
 * Overhead spotlight that illuminates the cabinet from above
 */
function SpotlightFromAbove({
  position,
  color,
  intensity,
  castShadow,
  shadowMapSize,
  shadowBias,
}: SpotlightFromAboveProps) {
  const spotlightRef = useRef<THREE.SpotLight>(null)

  // Cabinet center target
  const targetPosition = useMemo(() =>
    new THREE.Object3D(), []
  )

  return (
    <group>
      <primitive object={targetPosition} position={[position[0], position[1] - 3, position[2]]} />
      <spotLight
        ref={spotlightRef}
        position={[position[0], position[1] + 4, position[2] + 1]}
        color={color}
        intensity={intensity}
        angle={Math.PI / 4}
        penumbra={0.5}
        distance={12}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={shadowBias}
        shadow-camera-near={0.5}
        shadow-camera-far={20}
        target={targetPosition}
      />
    </group>
  )
}

interface RimLightProps {
  side: 'left' | 'right'
  position: [number, number, number]
  color: string
  intensity: number
  pulse: boolean
  pulseSpeed: number
}

/**
 * Colored rim light that creates edge glow effect
 */
function RimLight({
  side,
  position,
  color,
  intensity,
  pulse,
  pulseSpeed,
}: RimLightProps) {
  const lightRef = useRef<THREE.PointLight>(null)

  // Calculate rim light position based on cabinet dimensions
  const offset = side === 'left' ? -CABINET_BODY.width * 0.7 : CABINET_BODY.width * 0.7
  const lightPosition: [number, number, number] = [
    position[0] + offset,
    position[1] + CABINET_BODY.totalHeight * 0.5,
    position[2] + CABINET_BODY.depth * 0.3,
  ]

  useFrame(({ clock }) => {
    if (pulse && lightRef.current) {
      const t = clock.getElapsedTime() * pulseSpeed
      // Offset left/right pulses for visual interest
      const phaseOffset = side === 'left' ? 0 : Math.PI * 0.5
      const pulseValue = 0.8 + 0.2 * Math.sin(t * Math.PI * 2 + phaseOffset)
      lightRef.current.intensity = intensity * pulseValue
    }
  })

  return (
    <pointLight
      ref={lightRef}
      position={lightPosition}
      color={color}
      intensity={intensity}
      distance={6}
      decay={2}
    />
  )
}

interface FloorBounceLightProps {
  position: [number, number, number]
  color: string
  intensity: number
}

/**
 * Floor bounce light simulates ambient light reflecting from the floor
 */
function FloorBounceLight({
  position,
  color,
  intensity,
}: FloorBounceLightProps) {
  const lightPosition: [number, number, number] = [
    position[0],
    position[1] + 0.1, // Just above floor level
    position[2] + CABINET_BODY.depth * 0.5,
  ]

  return (
    <pointLight
      position={lightPosition}
      color={color}
      intensity={intensity}
      distance={4}
      decay={2}
    />
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetLighting - Cabinet-specific environment lighting component
 *
 * Provides a complete lighting setup specifically designed for arcade cabinet
 * scenes with spotlight from above, colored rim lights, and floor bounce effects.
 *
 * @example
 * ```tsx
 * // Default arcade lighting
 * <CabinetLighting position={[0, 0, 0]} />
 *
 * // With preset
 * <CabinetLighting preset="neon" enablePulse />
 *
 * // Custom configuration
 * <CabinetLighting
 *   rimLightLeftColor="#ff00ff"
 *   rimLightRightColor="#00ffff"
 *   rimLightIntensity={2.0}
 *   spotlightIntensity={1.0}
 *   enableFloorBounce
 * />
 * ```
 */
export const CabinetLighting = forwardRef<CabinetLightingHandle, CabinetLightingProps>(
  function CabinetLighting(
    {
      position = [0, 0, 0],
      enableSpotlight = true,
      spotlightColor = DEFAULT_SPOTLIGHT_COLOR,
      spotlightIntensity = DEFAULT_SPOTLIGHT_INTENSITY,
      enableRimLights = true,
      rimLightLeftColor = DEFAULT_RIM_LEFT_COLOR,
      rimLightRightColor = DEFAULT_RIM_RIGHT_COLOR,
      rimLightIntensity = DEFAULT_RIM_INTENSITY,
      enableFloorBounce = true,
      floorBounceColor = DEFAULT_FLOOR_BOUNCE_COLOR,
      floorBounceIntensity = DEFAULT_FLOOR_BOUNCE_INTENSITY,
      castShadow = true,
      shadowQuality = 'medium',
      enablePulse = true,
      pulseSpeed = DEFAULT_PULSE_SPEED,
      intensityMultiplier = 1.0,
      preset,
      debug = false,
    },
    ref
  ) {
    // Refs for dynamic control
    const spotlightIntensityRef = useRef(spotlightIntensity)
    const rimLightIntensityRef = useRef(rimLightIntensity)
    const floorBounceIntensityRef = useRef(floorBounceIntensity)
    const flashRef = useRef({ active: false, elapsed: 0, duration: 0 })

    // Get preset configuration
    const presetConfig = preset ? CABINET_LIGHTING_PRESETS[preset] : null

    // Merge preset with props (props override preset)
    const effectiveSpotlightColor = presetConfig?.spotlightColor ?? spotlightColor
    const effectiveSpotlightIntensity = (presetConfig?.spotlightIntensity ?? spotlightIntensity) * intensityMultiplier
    const effectiveRimLeftColor = presetConfig?.rimLightLeftColor ?? rimLightLeftColor
    const effectiveRimRightColor = presetConfig?.rimLightRightColor ?? rimLightRightColor
    const effectiveRimIntensity = (presetConfig?.rimLightIntensity ?? rimLightIntensity) * intensityMultiplier
    const effectiveFloorBounceColor = presetConfig?.floorBounceColor ?? floorBounceColor
    const effectiveFloorBounceIntensity = (presetConfig?.floorBounceIntensity ?? floorBounceIntensity) * intensityMultiplier
    const effectivePulseSpeed = presetConfig?.pulseSpeed ?? pulseSpeed

    // Get shadow settings
    const shadowSettings = SHADOW_QUALITY[shadowQuality]

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
      setSpotlightIntensity: (intensity: number) => {
        spotlightIntensityRef.current = THREE.MathUtils.clamp(intensity, 0, 5)
      },
      setRimLightIntensity: (intensity: number) => {
        rimLightIntensityRef.current = THREE.MathUtils.clamp(intensity, 0, 5)
      },
      setFloorBounceIntensity: (intensity: number) => {
        floorBounceIntensityRef.current = THREE.MathUtils.clamp(intensity, 0, 3)
      },
      flash: (duration = 0.3) => {
        flashRef.current = { active: true, elapsed: 0, duration }
      },
      applyPreset: (newPreset: CabinetLightingPreset) => {
        const config = CABINET_LIGHTING_PRESETS[newPreset]
        spotlightIntensityRef.current = config.spotlightIntensity
        rimLightIntensityRef.current = config.rimLightIntensity
        floorBounceIntensityRef.current = config.floorBounceIntensity
      },
      getState: () => ({
        spotlightIntensity: spotlightIntensityRef.current,
        rimLightIntensity: rimLightIntensityRef.current,
        floorBounceIntensity: floorBounceIntensityRef.current,
        isFlashing: flashRef.current.active,
      }),
    }))

    // Calculate flash multiplier
    const flashMultiplier = flashRef.current.active
      ? 1 + (1 - flashRef.current.elapsed / flashRef.current.duration) * 0.5
      : 1

    return (
      <group name="cabinet-lighting">
        {/* Spotlight from above */}
        {enableSpotlight && (
          <SpotlightFromAbove
            position={position}
            color={effectiveSpotlightColor}
            intensity={effectiveSpotlightIntensity * flashMultiplier}
            castShadow={castShadow}
            shadowMapSize={shadowSettings.mapSize}
            shadowBias={shadowSettings.bias}
          />
        )}

        {/* Colored rim lights */}
        {enableRimLights && (
          <>
            <RimLight
              side="left"
              position={position}
              color={effectiveRimLeftColor}
              intensity={effectiveRimIntensity * flashMultiplier}
              pulse={enablePulse}
              pulseSpeed={effectivePulseSpeed}
            />
            <RimLight
              side="right"
              position={position}
              color={effectiveRimRightColor}
              intensity={effectiveRimIntensity * flashMultiplier}
              pulse={enablePulse}
              pulseSpeed={effectivePulseSpeed}
            />
          </>
        )}

        {/* Floor bounce light */}
        {enableFloorBounce && (
          <FloorBounceLight
            position={position}
            color={effectiveFloorBounceColor}
            intensity={effectiveFloorBounceIntensity * flashMultiplier}
          />
        )}

        {/* Debug helpers */}
        {debug && (
          <>
            {/* Spotlight position indicator */}
            <mesh position={[position[0], position[1] + 4, position[2] + 1]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color={effectiveSpotlightColor} />
            </mesh>
            {/* Rim light position indicators */}
            <mesh position={[position[0] - CABINET_BODY.width * 0.7, position[1] + CABINET_BODY.totalHeight * 0.5, position[2] + CABINET_BODY.depth * 0.3]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={effectiveRimLeftColor} />
            </mesh>
            <mesh position={[position[0] + CABINET_BODY.width * 0.7, position[1] + CABINET_BODY.totalHeight * 0.5, position[2] + CABINET_BODY.depth * 0.3]}>
              <sphereGeometry args={[0.08, 8, 8]} />
              <meshBasicMaterial color={effectiveRimRightColor} />
            </mesh>
            {/* Floor bounce position indicator */}
            <mesh position={[position[0], position[1] + 0.1, position[2] + CABINET_BODY.depth * 0.5]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshBasicMaterial color={effectiveFloorBounceColor} />
            </mesh>
          </>
        )}
      </group>
    )
  }
)

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get a lighting preset configuration
 */
export function getCabinetLightingPreset(preset: CabinetLightingPreset): typeof CABINET_LIGHTING_PRESETS[CabinetLightingPreset] {
  return CABINET_LIGHTING_PRESETS[preset]
}

/**
 * Calculate optimal light count for performance
 * Returns recommended settings based on device performance tier
 */
export function getOptimalLightConfig(performanceTier: 'low' | 'medium' | 'high'): {
  enableSpotlight: boolean
  enableRimLights: boolean
  enableFloorBounce: boolean
  shadowQuality: 'low' | 'medium' | 'high'
  enablePulse: boolean
} {
  switch (performanceTier) {
    case 'low':
      return {
        enableSpotlight: true,
        enableRimLights: false,
        enableFloorBounce: false,
        shadowQuality: 'low',
        enablePulse: false,
      }
    case 'medium':
      return {
        enableSpotlight: true,
        enableRimLights: true,
        enableFloorBounce: false,
        shadowQuality: 'medium',
        enablePulse: true,
      }
    case 'high':
    default:
      return {
        enableSpotlight: true,
        enableRimLights: true,
        enableFloorBounce: true,
        shadowQuality: 'high',
        enablePulse: true,
      }
  }
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseCabinetLightingOptions {
  /** Initial preset */
  preset?: CabinetLightingPreset
  /** Enable shadows */
  shadows?: boolean
  /** Shadow quality */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
}

export interface UseCabinetLightingResult {
  /** Ref to attach to CabinetLighting */
  ref: React.RefObject<CabinetLightingHandle>
  /** Current preset */
  preset: CabinetLightingPreset
  /** Set preset */
  setPreset: (preset: CabinetLightingPreset) => void
  /** Trigger flash effect */
  flash: (duration?: number) => void
  /** Props to spread on CabinetLighting */
  lightingProps: Partial<CabinetLightingProps>
}

/**
 * useCabinetLighting - Hook for dynamic cabinet lighting control
 *
 * @example
 * ```tsx
 * function ArcadeScene() {
 *   const { ref, lightingProps, setPreset, flash } = useCabinetLighting({
 *     preset: 'default',
 *   })
 *
 *   // When player scores
 *   const handleScore = () => {
 *     flash(0.2)
 *   }
 *
 *   // When game over
 *   const handleGameOver = () => {
 *     setPreset('game-over')
 *   }
 *
 *   return <CabinetLighting ref={ref} {...lightingProps} />
 * }
 * ```
 */
export function useCabinetLighting(
  options: UseCabinetLightingOptions = {}
): UseCabinetLightingResult {
  const {
    preset: initialPreset = 'default',
    shadows = true,
    shadowQuality = 'medium',
  } = options

  const ref = useRef<CabinetLightingHandle>(null)
  const presetRef = useRef<CabinetLightingPreset>(initialPreset)

  const setPreset = (newPreset: CabinetLightingPreset) => {
    presetRef.current = newPreset
    ref.current?.applyPreset(newPreset)
  }

  const flash = (duration?: number) => {
    ref.current?.flash(duration)
  }

  const lightingProps = useMemo<Partial<CabinetLightingProps>>(() => ({
    preset: presetRef.current,
    castShadow: shadows,
    shadowQuality,
  }), [shadows, shadowQuality])

  return {
    ref,
    preset: presetRef.current,
    setPreset,
    flash,
    lightingProps,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CabinetLighting
