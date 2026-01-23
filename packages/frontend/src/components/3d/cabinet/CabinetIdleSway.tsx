/**
 * CabinetIdleSway - Subtle idle animation system for arcade cabinet
 *
 * Adds gentle sway/breathing motion to the cabinet to make the 3D scene
 * feel more alive. Uses sine functions for smooth, seamless looping animation.
 *
 * @module 3d/cabinet/CabinetIdleSway
 */

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface IdleSwayConfig {
  /** Y-axis rotation amplitude in radians (default: 0.003 ≈ 0.17 degrees) */
  yRotationAmplitude?: number
  /** Y-axis rotation speed multiplier (default: 0.3) */
  yRotationSpeed?: number
  /** Z-axis tilt amplitude in radians (default: 0.002 ≈ 0.11 degrees) */
  zTiltAmplitude?: number
  /** Z-axis tilt speed multiplier (default: 0.4) */
  zTiltSpeed?: number
  /** Breathing scale amplitude (default: 0.002 = 0.2% scale variation) */
  breathingAmplitude?: number
  /** Breathing speed multiplier (default: 0.5) */
  breathingSpeed?: number
  /** Vertical bob amplitude (default: 0.001 units) */
  bobAmplitude?: number
  /** Vertical bob speed multiplier (default: 0.7) */
  bobSpeed?: number
}

export interface CabinetIdleSwayProps {
  /** Position of the cabinet [x, y, z] */
  position?: [number, number, number]
  /** Base rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Base scale multiplier */
  scale?: number
  /** Enable/disable the sway animation */
  enabled?: boolean
  /** Animation configuration */
  config?: IdleSwayConfig
  /** Animation intensity (0-1, affects all amplitudes) */
  intensity?: number
  /** Children to render (the cabinet components) */
  children?: React.ReactNode
  /** Called when animation state changes */
  onAnimationUpdate?: (state: IdleSwayState) => void
}

export interface IdleSwayState {
  /** Current Y rotation offset */
  yRotation: number
  /** Current Z tilt offset */
  zTilt: number
  /** Current scale factor */
  scale: number
  /** Current Y position offset */
  yOffset: number
  /** Animation time */
  time: number
}

export interface CabinetIdleSwayHandle {
  /** Reference to the root group */
  group: THREE.Group | null
  /** Enable the animation */
  enable: () => void
  /** Disable the animation */
  disable: () => void
  /** Toggle animation state */
  toggle: () => void
  /** Check if animation is enabled */
  isEnabled: () => boolean
  /** Reset animation to initial state */
  reset: () => void
  /** Set animation intensity (0-1) */
  setIntensity: (intensity: number) => void
  /** Get current animation state */
  getState: () => IdleSwayState
  /** Apply a temporary "bump" animation (e.g., when hit) */
  bump: (direction?: { x?: number; y?: number; z?: number }) => void
}

// ============================================================================
// Constants
// ============================================================================

/** Default animation configuration */
const DEFAULT_CONFIG: Required<IdleSwayConfig> = {
  // Very subtle Y-axis rotation (like gentle rocking)
  yRotationAmplitude: 0.003, // ~0.17 degrees
  yRotationSpeed: 0.3,
  // Even subtler Z-axis tilt
  zTiltAmplitude: 0.002, // ~0.11 degrees
  zTiltSpeed: 0.4,
  // Gentle breathing scale
  breathingAmplitude: 0.002, // 0.2% variation
  breathingSpeed: 0.5,
  // Tiny vertical bob
  bobAmplitude: 0.001, // 1mm
  bobSpeed: 0.7,
}

/** Preset configurations for different moods */
export const SWAY_PRESETS = {
  /** Barely noticeable, very subtle (default) */
  subtle: DEFAULT_CONFIG,

  /** Calm, relaxed feeling */
  calm: {
    yRotationAmplitude: 0.002,
    yRotationSpeed: 0.2,
    zTiltAmplitude: 0.001,
    zTiltSpeed: 0.25,
    breathingAmplitude: 0.003,
    breathingSpeed: 0.4,
    bobAmplitude: 0.0005,
    bobSpeed: 0.5,
  } as Required<IdleSwayConfig>,

  /** Active, energetic feeling */
  lively: {
    yRotationAmplitude: 0.005,
    yRotationSpeed: 0.5,
    zTiltAmplitude: 0.003,
    zTiltSpeed: 0.6,
    breathingAmplitude: 0.004,
    breathingSpeed: 0.7,
    bobAmplitude: 0.002,
    bobSpeed: 0.9,
  } as Required<IdleSwayConfig>,

  /** Minimal motion, almost static */
  minimal: {
    yRotationAmplitude: 0.001,
    yRotationSpeed: 0.15,
    zTiltAmplitude: 0.0005,
    zTiltSpeed: 0.2,
    breathingAmplitude: 0.001,
    breathingSpeed: 0.3,
    bobAmplitude: 0.0002,
    bobSpeed: 0.4,
  } as Required<IdleSwayConfig>,

  /** No animation (for static renders) */
  none: {
    yRotationAmplitude: 0,
    yRotationSpeed: 0,
    zTiltAmplitude: 0,
    zTiltSpeed: 0,
    breathingAmplitude: 0,
    breathingSpeed: 0,
    bobAmplitude: 0,
    bobSpeed: 0,
  } as Required<IdleSwayConfig>,
} as const

export type SwayPreset = keyof typeof SWAY_PRESETS

// ============================================================================
// Animation Helper Functions
// ============================================================================

/**
 * Smooth sine oscillation with phase offset
 * Returns value between -1 and 1
 */
function sineOscillate(time: number, speed: number, phaseOffset: number = 0): number {
  return Math.sin(time * speed + phaseOffset)
}

/**
 * Layered sine for more organic motion
 * Combines two sine waves at different frequencies
 */
function layeredSine(time: number, speed: number, phaseOffset: number = 0): number {
  const primary = Math.sin(time * speed + phaseOffset)
  const secondary = Math.sin(time * speed * 0.7 + phaseOffset + 1.5) * 0.3
  return (primary + secondary) / 1.3 // Normalize to [-1, 1]
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetIdleSway - Wrapper component that adds idle sway animation
 *
 * Wrap your cabinet components with this to add subtle idle animation
 * that makes the 3D scene feel more alive and dynamic.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CabinetIdleSway>
 *   <CabinetBody>
 *     <ScreenBezel />
 *     <ControlPanel />
 *   </CabinetBody>
 * </CabinetIdleSway>
 *
 * // With custom configuration
 * <CabinetIdleSway
 *   config={SWAY_PRESETS.lively}
 *   intensity={0.8}
 * >
 *   <CabinetBody />
 * </CabinetIdleSway>
 *
 * // Controlled via ref
 * const swayRef = useRef<CabinetIdleSwayHandle>(null)
 * swayRef.current?.bump({ y: 0.02 }) // Apply bump when hit
 * ```
 */
export const CabinetIdleSway = forwardRef<CabinetIdleSwayHandle, CabinetIdleSwayProps>(
  function CabinetIdleSway(
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      enabled = true,
      config = DEFAULT_CONFIG,
      intensity = 1,
      children,
      onAnimationUpdate,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)

    // Animation state
    const animationTime = useRef(0)
    const isEnabled = useRef(enabled)
    const currentIntensity = useRef(intensity)

    // Bump animation state
    const bumpVelocity = useRef({ x: 0, y: 0, z: 0 })
    const bumpDamping = 0.92 // How quickly bump fades

    // Merge config with defaults
    const resolvedConfig: Required<IdleSwayConfig> = {
      ...DEFAULT_CONFIG,
      ...config,
    }

    // Animation state for callback
    const currentState = useRef<IdleSwayState>({
      yRotation: 0,
      zTilt: 0,
      scale: 1,
      yOffset: 0,
      time: 0,
    })

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        enable: () => {
          isEnabled.current = true
        },
        disable: () => {
          isEnabled.current = false
        },
        toggle: () => {
          isEnabled.current = !isEnabled.current
        },
        isEnabled: () => isEnabled.current,
        reset: () => {
          animationTime.current = 0
          bumpVelocity.current = { x: 0, y: 0, z: 0 }
          if (groupRef.current) {
            groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
            groupRef.current.scale.setScalar(scale)
            groupRef.current.position.set(position[0], position[1], position[2])
          }
        },
        setIntensity: (newIntensity: number) => {
          currentIntensity.current = Math.max(0, Math.min(1, newIntensity))
        },
        getState: () => currentState.current,
        bump: (direction = {}) => {
          bumpVelocity.current = {
            x: bumpVelocity.current.x + (direction.x ?? 0),
            y: bumpVelocity.current.y + (direction.y ?? 0),
            z: bumpVelocity.current.z + (direction.z ?? 0),
          }
        },
      }),
      [position, rotation, scale]
    )

    // Main animation frame
    useFrame((_state, delta) => {
      if (!groupRef.current) return

      // Update animation time
      animationTime.current += delta
      const time = animationTime.current
      const inten = currentIntensity.current

      // Calculate idle sway offsets (when enabled)
      let yRotationOffset = 0
      let zTiltOffset = 0
      let scaleOffset = 0
      let yPosOffset = 0

      if (isEnabled.current && inten > 0) {
        const {
          yRotationAmplitude,
          yRotationSpeed,
          zTiltAmplitude,
          zTiltSpeed,
          breathingAmplitude,
          breathingSpeed,
          bobAmplitude,
          bobSpeed,
        } = resolvedConfig

        // Y-axis rotation (gentle left-right rocking)
        // Use layered sine for more organic motion
        yRotationOffset = layeredSine(time, yRotationSpeed, 0) * yRotationAmplitude * inten

        // Z-axis tilt (subtle forward-back lean)
        // Offset phase so it doesn't sync perfectly with Y rotation
        zTiltOffset = layeredSine(time, zTiltSpeed, 2.1) * zTiltAmplitude * inten

        // Breathing scale (subtle size variation)
        // Simple sine for scale to avoid jarring size changes
        scaleOffset = sineOscillate(time, breathingSpeed, 0.5) * breathingAmplitude * inten

        // Vertical bob (tiny up-down motion)
        // Different phase for variety
        yPosOffset = sineOscillate(time, bobSpeed, 1.2) * bobAmplitude * inten
      }

      // Apply bump animation (decays over time)
      const bumpX = bumpVelocity.current.x
      const bumpY = bumpVelocity.current.y
      const bumpZ = bumpVelocity.current.z

      // Damp bump velocity
      bumpVelocity.current.x *= bumpDamping
      bumpVelocity.current.y *= bumpDamping
      bumpVelocity.current.z *= bumpDamping

      // Reset very small values to 0
      if (Math.abs(bumpVelocity.current.x) < 0.0001) bumpVelocity.current.x = 0
      if (Math.abs(bumpVelocity.current.y) < 0.0001) bumpVelocity.current.y = 0
      if (Math.abs(bumpVelocity.current.z) < 0.0001) bumpVelocity.current.z = 0

      // Apply all transformations
      groupRef.current.rotation.set(
        rotation[0] + zTiltOffset + bumpX, // X rotation (forward-back tilt)
        rotation[1] + yRotationOffset + bumpY, // Y rotation (left-right sway)
        rotation[2] + bumpZ // Z rotation (roll)
      )

      groupRef.current.scale.setScalar(scale * (1 + scaleOffset))

      groupRef.current.position.set(
        position[0],
        position[1] + yPosOffset,
        position[2]
      )

      // Update state for callback
      currentState.current = {
        yRotation: yRotationOffset,
        zTilt: zTiltOffset,
        scale: 1 + scaleOffset,
        yOffset: yPosOffset,
        time,
      }

      // Notify listener if provided
      if (onAnimationUpdate) {
        onAnimationUpdate(currentState.current)
      }
    })

    return (
      <group
        ref={groupRef}
        name="CabinetIdleSway"
        position={position}
        rotation={rotation}
        scale={scale}
      >
        {children}
      </group>
    )
  }
)

// ============================================================================
// Hook for Sway Animation Control
// ============================================================================

export interface UseIdleSwayOptions {
  /** Initial enabled state */
  initialEnabled?: boolean
  /** Initial intensity */
  initialIntensity?: number
  /** Animation configuration */
  config?: IdleSwayConfig
  /** Preset to use (overrides config) */
  preset?: SwayPreset
}

export interface UseIdleSwayResult {
  /** Ref to attach to CabinetIdleSway */
  ref: React.RefObject<CabinetIdleSwayHandle>
  /** Current enabled state */
  enabled: boolean
  /** Enable animation */
  enable: () => void
  /** Disable animation */
  disable: () => void
  /** Toggle animation */
  toggle: () => void
  /** Current intensity */
  intensity: number
  /** Set intensity (0-1) */
  setIntensity: (intensity: number) => void
  /** Apply bump animation */
  bump: (direction?: { x?: number; y?: number; z?: number }) => void
  /** Reset to initial state */
  reset: () => void
  /** Get animation configuration */
  getConfig: () => Required<IdleSwayConfig>
}

/**
 * useIdleSway - Hook for controlling cabinet idle sway animation
 *
 * @example
 * ```tsx
 * function ArcadeCabinet() {
 *   const sway = useIdleSway({ preset: 'subtle' })
 *
 *   // React to game events
 *   const handleHit = () => {
 *     sway.bump({ x: 0.01, y: 0.02 })
 *   }
 *
 *   // Pause animation when menu is open
 *   useEffect(() => {
 *     if (menuOpen) sway.disable()
 *     else sway.enable()
 *   }, [menuOpen])
 *
 *   return (
 *     <CabinetIdleSway ref={sway.ref}>
 *       <CabinetBody />
 *     </CabinetIdleSway>
 *   )
 * }
 * ```
 */
export function useIdleSway(options: UseIdleSwayOptions = {}): UseIdleSwayResult {
  const {
    initialEnabled = true,
    initialIntensity = 1,
    config,
    preset,
  } = options

  const ref = useRef<CabinetIdleSwayHandle>(null)
  const enabled = useRef(initialEnabled)
  const intensity = useRef(initialIntensity)

  // Resolve configuration
  const resolvedConfig: Required<IdleSwayConfig> = preset
    ? SWAY_PRESETS[preset]
    : { ...DEFAULT_CONFIG, ...config }

  const enable = () => {
    enabled.current = true
    ref.current?.enable()
  }

  const disable = () => {
    enabled.current = false
    ref.current?.disable()
  }

  const toggle = () => {
    enabled.current = !enabled.current
    ref.current?.toggle()
  }

  const setIntensity = (newIntensity: number) => {
    intensity.current = Math.max(0, Math.min(1, newIntensity))
    ref.current?.setIntensity(intensity.current)
  }

  const bump = (direction?: { x?: number; y?: number; z?: number }) => {
    ref.current?.bump(direction)
  }

  const reset = () => {
    ref.current?.reset()
  }

  const getConfig = () => resolvedConfig

  return {
    ref,
    enabled: enabled.current,
    enable,
    disable,
    toggle,
    intensity: intensity.current,
    setIntensity,
    bump,
    reset,
    getConfig,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a custom sway configuration by mixing presets
 */
export function mixSwayConfigs(
  configA: IdleSwayConfig,
  configB: IdleSwayConfig,
  ratio: number = 0.5
): Required<IdleSwayConfig> {
  const a = { ...DEFAULT_CONFIG, ...configA }
  const b = { ...DEFAULT_CONFIG, ...configB }
  const r = Math.max(0, Math.min(1, ratio))
  const ir = 1 - r

  return {
    yRotationAmplitude: a.yRotationAmplitude * ir + b.yRotationAmplitude * r,
    yRotationSpeed: a.yRotationSpeed * ir + b.yRotationSpeed * r,
    zTiltAmplitude: a.zTiltAmplitude * ir + b.zTiltAmplitude * r,
    zTiltSpeed: a.zTiltSpeed * ir + b.zTiltSpeed * r,
    breathingAmplitude: a.breathingAmplitude * ir + b.breathingAmplitude * r,
    breathingSpeed: a.breathingSpeed * ir + b.breathingSpeed * r,
    bobAmplitude: a.bobAmplitude * ir + b.bobAmplitude * r,
    bobSpeed: a.bobSpeed * ir + b.bobSpeed * r,
  }
}

/**
 * Scale all amplitudes in a config by a factor
 */
export function scaleSwayConfig(
  config: IdleSwayConfig,
  factor: number
): Required<IdleSwayConfig> {
  const c = { ...DEFAULT_CONFIG, ...config }

  return {
    yRotationAmplitude: c.yRotationAmplitude * factor,
    yRotationSpeed: c.yRotationSpeed,
    zTiltAmplitude: c.zTiltAmplitude * factor,
    zTiltSpeed: c.zTiltSpeed,
    breathingAmplitude: c.breathingAmplitude * factor,
    breathingSpeed: c.breathingSpeed,
    bobAmplitude: c.bobAmplitude * factor,
    bobSpeed: c.bobSpeed,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CabinetIdleSway
