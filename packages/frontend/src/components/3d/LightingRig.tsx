/**
 * LightingRig - Reusable lighting rig component for 3D scenes
 *
 * This component provides a consistent lighting setup with ambient, directional,
 * and point lights optimized for the neon arcade aesthetic. It handles shadow
 * configuration and provides presets for common lighting scenarios.
 *
 * @module 3d/LightingRig
 */

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { primary, secondary, semantic } from '../../styles/tokens/colors'

// ============================================================================
// Types
// ============================================================================

export interface PointLightConfig {
  /** Position [x, y, z] */
  position: [number, number, number]
  /** Light color */
  color: string
  /** Light intensity (0-10) */
  intensity: number
  /** Maximum distance the light reaches */
  distance?: number
  /** How quickly light dims with distance */
  decay?: number
  /** Enable shadows for this light */
  castShadow?: boolean
  /** Enable pulsing animation */
  pulse?: boolean
  /** Pulse speed (cycles per second) */
  pulseSpeed?: number
  /** Pulse intensity range [min, max] */
  pulseRange?: [number, number]
}

export interface DirectionalLightConfig {
  /** Position [x, y, z] */
  position: [number, number, number]
  /** Light color */
  color?: string
  /** Light intensity (0-5) */
  intensity?: number
  /** Enable shadows */
  castShadow?: boolean
  /** Shadow map size */
  shadowMapSize?: number
  /** Shadow camera bounds */
  shadowCameraBounds?: number
  /** Shadow bias (to prevent shadow artifacts) */
  shadowBias?: number
}

export interface AmbientLightConfig {
  /** Light color */
  color?: string
  /** Light intensity (0-3) */
  intensity?: number
}

export interface LightingRigProps {
  /** Ambient light configuration */
  ambient?: AmbientLightConfig | false
  /** Directional light configuration (main light) */
  directional?: DirectionalLightConfig | false
  /** Point lights array for neon effects */
  pointLights?: PointLightConfig[]
  /** Enable all shadows */
  shadows?: boolean
  /** Shadow quality preset */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
  /** Use a lighting preset */
  preset?: LightingPreset
  /** Enable helper visualizations (debug) */
  helpers?: boolean
  /** Overall intensity multiplier */
  intensityMultiplier?: number
}

export type LightingPreset =
  | 'arcade'      // Classic arcade cabinet lighting
  | 'neon'        // Full neon glow emphasis
  | 'dramatic'    // High contrast with shadows
  | 'soft'        // Soft ambient with subtle accents
  | 'game-over'   // Red/orange danger lighting
  | 'victory'     // Green/cyan celebration lighting

// ============================================================================
// Constants
// ============================================================================

/** Default ambient light settings */
const DEFAULT_AMBIENT: AmbientLightConfig = {
  color: '#1a1a2e',
  intensity: 0.4,
}

/** Default directional light settings */
const DEFAULT_DIRECTIONAL: DirectionalLightConfig = {
  position: [5, 10, 5],
  color: '#ffffff',
  intensity: 0.6,
  castShadow: true,
  shadowMapSize: 1024,
  shadowCameraBounds: 10,
  shadowBias: -0.0001,
}

/** Shadow quality presets */
const SHADOW_QUALITY = {
  low: { mapSize: 512, bias: -0.001 },
  medium: { mapSize: 1024, bias: -0.0005 },
  high: { mapSize: 2048, bias: -0.0001 },
  ultra: { mapSize: 4096, bias: -0.00005 },
} as const

/** Lighting presets for different scenarios */
export const LIGHTING_PRESETS: Record<LightingPreset, {
  ambient: AmbientLightConfig
  directional: DirectionalLightConfig
  pointLights: PointLightConfig[]
}> = {
  arcade: {
    ambient: { color: '#1a1a2e', intensity: 0.3 },
    directional: { position: [3, 8, 5], color: '#ffffff', intensity: 0.4, castShadow: true },
    pointLights: [
      { position: [-3, 2, 3], color: primary.DEFAULT, intensity: 2, distance: 8, pulse: true, pulseSpeed: 0.5 },
      { position: [3, 2, 3], color: secondary.DEFAULT, intensity: 2, distance: 8, pulse: true, pulseSpeed: 0.7 },
      { position: [0, 3, 0], color: '#ffffff', intensity: 0.5, distance: 10 },
    ],
  },
  neon: {
    ambient: { color: '#0a0a0f', intensity: 0.15 },
    directional: { position: [0, 10, 5], color: '#ffffff', intensity: 0.2, castShadow: false },
    pointLights: [
      { position: [-4, 2, 4], color: primary.DEFAULT, intensity: 4, distance: 10, pulse: true, pulseSpeed: 0.3 },
      { position: [4, 2, 4], color: secondary.DEFAULT, intensity: 4, distance: 10, pulse: true, pulseSpeed: 0.4 },
      { position: [0, 4, 2], color: primary.DEFAULT, intensity: 3, distance: 8, pulse: true, pulseSpeed: 0.6 },
      { position: [-2, 1, -2], color: secondary.DEFAULT, intensity: 2, distance: 6 },
      { position: [2, 1, -2], color: primary.DEFAULT, intensity: 2, distance: 6 },
    ],
  },
  dramatic: {
    ambient: { color: '#0a0a0f', intensity: 0.1 },
    directional: { position: [10, 15, 5], color: '#ffffff', intensity: 1.0, castShadow: true },
    pointLights: [
      { position: [0, 3, 5], color: primary.DEFAULT, intensity: 3, distance: 12, castShadow: true },
    ],
  },
  soft: {
    ambient: { color: '#1e1e2e', intensity: 0.6 },
    directional: { position: [5, 8, 5], color: '#ffffff', intensity: 0.3, castShadow: true },
    pointLights: [
      { position: [-3, 3, 4], color: primary[300], intensity: 1, distance: 10 },
      { position: [3, 3, 4], color: secondary[300], intensity: 1, distance: 10 },
    ],
  },
  'game-over': {
    ambient: { color: '#1a0a0a', intensity: 0.2 },
    directional: { position: [0, 10, 5], color: '#ff4444', intensity: 0.3, castShadow: true },
    pointLights: [
      { position: [-2, 2, 3], color: semantic.error, intensity: 3, distance: 8, pulse: true, pulseSpeed: 1.5, pulseRange: [0.5, 1.0] },
      { position: [2, 2, 3], color: semantic.warning, intensity: 3, distance: 8, pulse: true, pulseSpeed: 1.2, pulseRange: [0.5, 1.0] },
      { position: [0, 4, 2], color: semantic.error, intensity: 2, distance: 6, pulse: true, pulseSpeed: 2.0, pulseRange: [0.3, 1.0] },
    ],
  },
  victory: {
    ambient: { color: '#0a1a0a', intensity: 0.3 },
    directional: { position: [0, 10, 5], color: '#ffffff', intensity: 0.5, castShadow: true },
    pointLights: [
      { position: [-3, 3, 4], color: semantic.success, intensity: 4, distance: 10, pulse: true, pulseSpeed: 0.5 },
      { position: [3, 3, 4], color: primary.DEFAULT, intensity: 4, distance: 10, pulse: true, pulseSpeed: 0.6 },
      { position: [0, 5, 2], color: '#ffffff', intensity: 2, distance: 12, pulse: true, pulseSpeed: 0.3 },
      { position: [-2, 1, 5], color: semantic.success, intensity: 2, distance: 6 },
      { position: [2, 1, 5], color: primary.DEFAULT, intensity: 2, distance: 6 },
    ],
  },
}

// ============================================================================
// Helper Components
// ============================================================================

interface AnimatedPointLightProps {
  config: PointLightConfig
  shadows: boolean
}

/**
 * Animated point light with optional pulsing effect
 */
function AnimatedPointLight({ config, shadows }: AnimatedPointLightProps) {
  const lightRef = useRef<THREE.PointLight>(null)
  const {
    position,
    color,
    intensity,
    distance = 10,
    decay = 2,
    castShadow = false,
    pulse = false,
    pulseSpeed = 1,
    pulseRange = [0.7, 1.0],
  } = config

  useFrame(({ clock }) => {
    if (pulse && lightRef.current) {
      const t = clock.getElapsedTime() * pulseSpeed
      const [minIntensity, maxIntensity] = pulseRange
      const pulseValue = minIntensity + (maxIntensity - minIntensity) * (0.5 + 0.5 * Math.sin(t * Math.PI * 2))
      lightRef.current.intensity = intensity * pulseValue
    }
  })

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity}
      distance={distance}
      decay={decay}
      castShadow={shadows && castShadow}
    />
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * LightingRig - Reusable lighting rig for consistent scene illumination
 *
 * Provides ambient, directional, and point lights with configurable settings.
 * Supports presets for common lighting scenarios and optimized shadow settings.
 *
 * @example
 * ```tsx
 * // Use arcade preset
 * <LightingRig preset="arcade" shadows />
 *
 * // Custom lighting
 * <LightingRig
 *   ambient={{ color: '#1a1a2e', intensity: 0.3 }}
 *   directional={{ position: [5, 10, 5], intensity: 0.6 }}
 *   pointLights={[
 *     { position: [-3, 2, 3], color: '#00ffff', intensity: 2 }
 *   ]}
 * />
 * ```
 */
export function LightingRig({
  ambient,
  directional,
  pointLights,
  shadows = true,
  shadowQuality = 'medium',
  preset,
  helpers = false,
  intensityMultiplier = 1,
}: LightingRigProps) {
  const directionalRef = useRef<THREE.DirectionalLight>(null)

  // Get preset configuration if specified
  const presetConfig = preset ? LIGHTING_PRESETS[preset] : null

  // Merge configurations (props override preset)
  const ambientConfig = useMemo(() => {
    if (ambient === false) return null
    return {
      ...DEFAULT_AMBIENT,
      ...(presetConfig?.ambient ?? {}),
      ...(ambient ?? {}),
    }
  }, [ambient, presetConfig])

  const directionalConfig = useMemo(() => {
    if (directional === false) return null
    return {
      ...DEFAULT_DIRECTIONAL,
      ...(presetConfig?.directional ?? {}),
      ...(directional ?? {}),
    }
  }, [directional, presetConfig])

  const pointLightConfigs = useMemo(() => {
    if (pointLights) return pointLights
    return presetConfig?.pointLights ?? []
  }, [pointLights, presetConfig])

  // Get shadow quality settings
  const shadowSettings = SHADOW_QUALITY[shadowQuality]

  return (
    <group name="lighting-rig">
      {/* Ambient Light - Base illumination */}
      {ambientConfig && (
        <ambientLight
          color={ambientConfig.color}
          intensity={(ambientConfig.intensity ?? 0.4) * intensityMultiplier}
        />
      )}

      {/* Directional Light - Main light source with shadows */}
      {directionalConfig && (
        <>
          <directionalLight
            ref={directionalRef}
            position={directionalConfig.position}
            color={directionalConfig.color}
            intensity={(directionalConfig.intensity ?? 0.6) * intensityMultiplier}
            castShadow={shadows && directionalConfig.castShadow}
            shadow-mapSize-width={directionalConfig.shadowMapSize ?? shadowSettings.mapSize}
            shadow-mapSize-height={directionalConfig.shadowMapSize ?? shadowSettings.mapSize}
            shadow-camera-near={0.1}
            shadow-camera-far={50}
            shadow-camera-left={-(directionalConfig.shadowCameraBounds ?? 10)}
            shadow-camera-right={directionalConfig.shadowCameraBounds ?? 10}
            shadow-camera-top={directionalConfig.shadowCameraBounds ?? 10}
            shadow-camera-bottom={-(directionalConfig.shadowCameraBounds ?? 10)}
            shadow-bias={directionalConfig.shadowBias ?? shadowSettings.bias}
          />
          {helpers && directionalRef.current && (
            <primitive
              object={new THREE.DirectionalLightHelper(directionalRef.current, 2)}
            />
          )}
        </>
      )}

      {/* Point Lights - Neon accent lights */}
      {pointLightConfigs.map((config, index) => (
        <AnimatedPointLight
          key={`point-light-${index}`}
          config={{
            ...config,
            intensity: config.intensity * intensityMultiplier,
          }}
          shadows={shadows}
        />
      ))}

      {/* Debug helpers for point lights */}
      {helpers && pointLightConfigs.map((config, index) => (
        <mesh key={`helper-${index}`} position={config.position}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color={config.color} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Specialized Variants
// ============================================================================

export interface ArcadeLightingProps {
  /** Enable shadows */
  shadows?: boolean
  /** Shadow quality */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
  /** Overall brightness */
  brightness?: number
  /** Enable pulsing neon lights */
  pulse?: boolean
}

/**
 * ArcadeLighting - Pre-configured lighting for arcade cabinet scenes
 */
export function ArcadeLighting({
  shadows = true,
  shadowQuality = 'medium',
  brightness = 1,
  pulse = true,
}: ArcadeLightingProps) {
  const pointLights = useMemo(() => {
    const lights = [...LIGHTING_PRESETS.arcade.pointLights]
    if (!pulse) {
      return lights.map(light => ({ ...light, pulse: false }))
    }
    return lights
  }, [pulse])

  return (
    <LightingRig
      preset="arcade"
      pointLights={pointLights}
      shadows={shadows}
      shadowQuality={shadowQuality}
      intensityMultiplier={brightness}
    />
  )
}

export interface NeonLightingProps {
  /** Primary neon color */
  primaryColor?: string
  /** Secondary neon color */
  secondaryColor?: string
  /** Enable shadows */
  shadows?: boolean
  /** Overall brightness */
  brightness?: number
}

/**
 * NeonLighting - Full neon glow effect lighting
 */
export function NeonLighting({
  primaryColor = primary.DEFAULT,
  secondaryColor = secondary.DEFAULT,
  shadows = false,
  brightness = 1,
}: NeonLightingProps) {
  const pointLights = useMemo<PointLightConfig[]>(() => {
    const preset = LIGHTING_PRESETS.neon.pointLights
    // Replace default colors with custom colors
    return preset.map((light, index) => ({
      ...light,
      color: index % 2 === 0 ? primaryColor : secondaryColor,
    }))
  }, [primaryColor, secondaryColor])

  return (
    <LightingRig
      ambient={LIGHTING_PRESETS.neon.ambient}
      directional={LIGHTING_PRESETS.neon.directional}
      pointLights={pointLights}
      shadows={shadows}
      intensityMultiplier={brightness}
    />
  )
}

export interface GameStateLightingProps {
  /** Current game state */
  state: 'playing' | 'paused' | 'game-over' | 'victory' | 'idle'
  /** Enable shadows */
  shadows?: boolean
  /** Shadow quality */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
  /** Transition duration in seconds */
  transitionDuration?: number
}

/**
 * GameStateLighting - Dynamic lighting that changes with game state
 */
export function GameStateLighting({
  state,
  shadows = true,
  shadowQuality = 'medium',
}: GameStateLightingProps) {
  const preset = useMemo<LightingPreset>(() => {
    switch (state) {
      case 'game-over':
        return 'game-over'
      case 'victory':
        return 'victory'
      case 'playing':
        return 'arcade'
      case 'paused':
        return 'soft'
      case 'idle':
      default:
        return 'soft'
    }
  }, [state])

  return (
    <LightingRig
      preset={preset}
      shadows={shadows}
      shadowQuality={shadowQuality}
    />
  )
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseLightingRigOptions {
  /** Initial preset */
  preset?: LightingPreset
  /** Enable shadows */
  shadows?: boolean
  /** Shadow quality */
  shadowQuality?: 'low' | 'medium' | 'high' | 'ultra'
}

export interface UseLightingRigResult {
  /** Current preset */
  preset: LightingPreset
  /** Set the preset */
  setPreset: (preset: LightingPreset) => void
  /** Props to spread on LightingRig */
  rigProps: LightingRigProps
}

/**
 * useLightingRig - Hook for dynamic lighting control
 *
 * @example
 * ```tsx
 * const { rigProps, setPreset } = useLightingRig({ preset: 'arcade' })
 *
 * // Later, change the lighting
 * setPreset('game-over')
 *
 * return <LightingRig {...rigProps} />
 * ```
 */
export function useLightingRig(options: UseLightingRigOptions = {}): UseLightingRigResult {
  const {
    preset: initialPreset = 'arcade',
    shadows = true,
    shadowQuality = 'medium',
  } = options

  const [currentPreset, setCurrentPreset] = useState<LightingPreset>(initialPreset)

  const rigProps = useMemo<LightingRigProps>(() => ({
    preset: currentPreset,
    shadows,
    shadowQuality,
  }), [currentPreset, shadows, shadowQuality])

  return {
    preset: currentPreset,
    setPreset: setCurrentPreset,
    rigProps,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default LightingRig
