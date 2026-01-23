import { useRef, useCallback, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

/**
 * Shake intensity presets.
 */
export type ShakeIntensity = 'light' | 'medium' | 'heavy' | 'extreme'

export interface ScreenShakeConfig {
  /**
   * Maximum displacement in units.
   */
  intensity: number
  /**
   * Duration of the shake in seconds.
   */
  duration: number
  /**
   * Frequency of the shake (oscillations per second).
   */
  frequency: number
  /**
   * Decay curve: 'linear' | 'exponential' | 'easeOut'.
   * @default 'exponential'
   */
  decay?: 'linear' | 'exponential' | 'easeOut'
  /**
   * Include rotational shake.
   * @default true
   */
  includeRotation?: boolean
  /**
   * Maximum rotation in radians.
   * @default 0.05
   */
  rotationIntensity?: number
}

export interface ScreenShakeProps {
  /**
   * Whether the effect is active.
   */
  active?: boolean
  /**
   * Configuration for the shake effect.
   */
  config?: Partial<ScreenShakeConfig>
  /**
   * Called when the shake completes.
   */
  onComplete?: () => void
  /**
   * React children (typically the scene content).
   */
  children?: React.ReactNode
}

export interface UseScreenShakeResult {
  /**
   * Trigger a screen shake with optional config override.
   */
  shake: (configOverride?: Partial<ScreenShakeConfig>) => void
  /**
   * Trigger a shake with a preset intensity.
   */
  shakeWithIntensity: (intensity: ShakeIntensity) => void
  /**
   * Stop the current shake immediately.
   */
  stop: () => void
  /**
   * Whether a shake is currently active.
   */
  isShaking: boolean
  /**
   * The current shake offset (for manual application).
   */
  offset: { x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number }
  /**
   * Props to spread on ScreenShake component.
   */
  props: Pick<ScreenShakeProps, 'active' | 'config' | 'onComplete'>
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default shake configuration.
 */
export const DEFAULT_SHAKE_CONFIG: ScreenShakeConfig = {
  intensity: 0.1,
  duration: 0.3,
  frequency: 20,
  decay: 'exponential',
  includeRotation: true,
  rotationIntensity: 0.02,
}

/**
 * Preset configurations for different intensity levels.
 */
export const SHAKE_PRESETS: Record<ShakeIntensity, ScreenShakeConfig> = {
  light: {
    intensity: 0.03,
    duration: 0.15,
    frequency: 25,
    decay: 'exponential',
    includeRotation: false,
    rotationIntensity: 0,
  },
  medium: {
    intensity: 0.08,
    duration: 0.25,
    frequency: 20,
    decay: 'exponential',
    includeRotation: true,
    rotationIntensity: 0.015,
  },
  heavy: {
    intensity: 0.15,
    duration: 0.4,
    frequency: 15,
    decay: 'exponential',
    includeRotation: true,
    rotationIntensity: 0.03,
  },
  extreme: {
    intensity: 0.3,
    duration: 0.6,
    frequency: 12,
    decay: 'easeOut',
    includeRotation: true,
    rotationIntensity: 0.05,
  },
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate decay value based on decay type.
 */
function calculateDecay(
  progress: number,
  decayType: ScreenShakeConfig['decay']
): number {
  switch (decayType) {
    case 'linear':
      return 1 - progress
    case 'easeOut':
      return 1 - progress * progress
    case 'exponential':
    default:
      return Math.exp(-progress * 4)
  }
}

/**
 * Generate random noise in range [-1, 1].
 */
function noise(): number {
  return Math.random() * 2 - 1
}

/**
 * Check if user prefers reduced motion.
 */
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

// ============================================================================
// Internal State Interface
// ============================================================================

interface ShakeState {
  isActive: boolean
  startTime: number
  config: ScreenShakeConfig
  seed: { x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number }
  offset: { x: number; y: number; z: number; rotX: number; rotY: number; rotZ: number }
}

// ============================================================================
// ScreenShake Component
// ============================================================================

/**
 * ScreenShake - Wraps scene content and applies shake to camera/group.
 *
 * Features:
 * - Multiple decay curves (linear, exponential, easeOut)
 * - Position and rotation shake
 * - Configurable intensity, duration, frequency
 * - Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * function Scene() {
 *   const shake = useScreenShake();
 *
 *   return (
 *     <ScreenShake {...shake.props}>
 *       <GameContent />
 *       <mesh onClick={() => shake.shake()}>
 *         <boxGeometry />
 *         <meshBasicMaterial color="red" />
 *       </mesh>
 *     </ScreenShake>
 *   );
 * }
 * ```
 */
export function ScreenShake({
  active = false,
  config = {},
  onComplete,
  children,
}: ScreenShakeProps) {
  const groupRef = useRef<THREE.Group>(null)
  const shakeState = useRef<ShakeState>({
    isActive: false,
    startTime: 0,
    config: { ...DEFAULT_SHAKE_CONFIG, ...config },
    seed: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 },
    offset: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 },
  })

  // Check for reduced motion preference
  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  // Start shake when active changes to true
  useEffect(() => {
    if (active && !reducedMotion) {
      shakeState.current.isActive = true
      shakeState.current.startTime = 0
      shakeState.current.config = { ...DEFAULT_SHAKE_CONFIG, ...config }
      // Generate random seeds for consistent noise pattern
      shakeState.current.seed = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000,
        rotX: Math.random() * 1000,
        rotY: Math.random() * 1000,
        rotZ: Math.random() * 1000,
      }
    }
  }, [active, config, reducedMotion])

  useFrame((_, delta) => {
    const state = shakeState.current

    if (!state.isActive || !groupRef.current) {
      // Reset position when not shaking
      if (groupRef.current) {
        groupRef.current.position.set(0, 0, 0)
        groupRef.current.rotation.set(0, 0, 0)
      }
      return
    }

    state.startTime += delta
    const progress = state.startTime / state.config.duration

    if (progress >= 1) {
      // Shake complete
      state.isActive = false
      state.offset = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 }
      groupRef.current.position.set(0, 0, 0)
      groupRef.current.rotation.set(0, 0, 0)
      onComplete?.()
      return
    }

    // Calculate decay
    const decay = calculateDecay(progress, state.config.decay)
    const intensity = state.config.intensity * decay
    const rotIntensity = (state.config.rotationIntensity ?? 0.02) * decay

    // Generate offset using time-based noise
    const t = state.startTime * state.config.frequency * Math.PI * 2

    state.offset.x = Math.sin(t + state.seed.x) * noise() * intensity
    state.offset.y = Math.sin(t * 1.1 + state.seed.y) * noise() * intensity
    state.offset.z = Math.sin(t * 0.9 + state.seed.z) * noise() * intensity * 0.5

    // Apply rotation shake if enabled
    if (state.config.includeRotation) {
      state.offset.rotX = Math.sin(t * 1.2 + state.seed.rotX) * noise() * rotIntensity
      state.offset.rotY = Math.sin(t * 0.8 + state.seed.rotY) * noise() * rotIntensity
      state.offset.rotZ = Math.sin(t * 1.3 + state.seed.rotZ) * noise() * rotIntensity
    }

    // Apply to group
    groupRef.current.position.set(state.offset.x, state.offset.y, state.offset.z)
    if (state.config.includeRotation) {
      groupRef.current.rotation.set(state.offset.rotX, state.offset.rotY, state.offset.rotZ)
    }
  })

  return <group ref={groupRef}>{children}</group>
}

// ============================================================================
// Camera Shake Component (Alternative - shakes camera directly)
// ============================================================================

export interface CameraShakeProps {
  /**
   * Whether the shake is active.
   */
  active?: boolean
  /**
   * Configuration for the shake.
   */
  config?: Partial<ScreenShakeConfig>
  /**
   * Called when shake completes.
   */
  onComplete?: () => void
}

/**
 * CameraShake - Applies shake directly to the Three.js camera.
 *
 * Use this when you can't wrap your scene content with ScreenShake.
 */
export function CameraShake({
  active = false,
  config = {},
  onComplete,
}: CameraShakeProps) {
  const { camera } = useThree()
  const originalPosition = useRef(new THREE.Vector3())
  const originalRotation = useRef(new THREE.Euler())
  const shakeState = useRef<ShakeState>({
    isActive: false,
    startTime: 0,
    config: { ...DEFAULT_SHAKE_CONFIG, ...config },
    seed: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 },
    offset: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 },
  })

  const reducedMotion = useMemo(() => prefersReducedMotion(), [])

  // Store original camera position when shake starts
  useEffect(() => {
    if (active && !reducedMotion) {
      originalPosition.current.copy(camera.position)
      originalRotation.current.copy(camera.rotation)
      shakeState.current.isActive = true
      shakeState.current.startTime = 0
      shakeState.current.config = { ...DEFAULT_SHAKE_CONFIG, ...config }
      shakeState.current.seed = {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        z: Math.random() * 1000,
        rotX: Math.random() * 1000,
        rotY: Math.random() * 1000,
        rotZ: Math.random() * 1000,
      }
    }
  }, [active, camera, config, reducedMotion])

  useFrame((_, delta) => {
    const state = shakeState.current

    if (!state.isActive) return

    state.startTime += delta
    const progress = state.startTime / state.config.duration

    if (progress >= 1) {
      // Reset camera and complete
      camera.position.copy(originalPosition.current)
      camera.rotation.copy(originalRotation.current)
      state.isActive = false
      onComplete?.()
      return
    }

    const decay = calculateDecay(progress, state.config.decay)
    const intensity = state.config.intensity * decay
    const rotIntensity = (state.config.rotationIntensity ?? 0.02) * decay

    const t = state.startTime * state.config.frequency * Math.PI * 2

    // Apply shake to camera
    camera.position.set(
      originalPosition.current.x + Math.sin(t + state.seed.x) * noise() * intensity,
      originalPosition.current.y + Math.sin(t * 1.1 + state.seed.y) * noise() * intensity,
      originalPosition.current.z + Math.sin(t * 0.9 + state.seed.z) * noise() * intensity * 0.5
    )

    if (state.config.includeRotation) {
      camera.rotation.set(
        originalRotation.current.x + Math.sin(t * 1.2 + state.seed.rotX) * noise() * rotIntensity,
        originalRotation.current.y + Math.sin(t * 0.8 + state.seed.rotY) * noise() * rotIntensity,
        originalRotation.current.z + Math.sin(t * 1.3 + state.seed.rotZ) * noise() * rotIntensity
      )
    }
  })

  return null
}

// ============================================================================
// useScreenShake Hook
// ============================================================================

/**
 * useScreenShake - Hook to control screen shake from game logic.
 *
 * Features:
 * - Trigger shakes programmatically
 * - Use preset intensities
 * - Manual offset access for custom implementations
 * - Respects prefers-reduced-motion
 *
 * @example
 * ```tsx
 * function Game() {
 *   const shake = useScreenShake();
 *
 *   const handleExplosion = () => {
 *     shake.shakeWithIntensity('heavy');
 *   };
 *
 *   const handleHit = () => {
 *     shake.shake({ intensity: 0.05, duration: 0.1 });
 *   };
 *
 *   return <ScreenShake {...shake.props}><Scene /></ScreenShake>;
 * }
 * ```
 */
export function useScreenShake(): UseScreenShakeResult {
  const [isShaking, setIsShaking] = useState(false)
  const [config, setConfig] = useState<Partial<ScreenShakeConfig>>({})
  const offsetRef = useRef({ x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 })

  const shake = useCallback((configOverride?: Partial<ScreenShakeConfig>) => {
    setConfig(configOverride ?? {})
    setIsShaking(true)
  }, [])

  const shakeWithIntensity = useCallback((intensity: ShakeIntensity) => {
    setConfig(SHAKE_PRESETS[intensity])
    setIsShaking(true)
  }, [])

  const stop = useCallback(() => {
    setIsShaking(false)
  }, [])

  const handleComplete = useCallback(() => {
    setIsShaking(false)
  }, [])

  return {
    shake,
    shakeWithIntensity,
    stop,
    isShaking,
    offset: offsetRef.current,
    props: {
      active: isShaking,
      config,
      onComplete: handleComplete,
    },
  }
}

// ============================================================================
// CSS-based Screen Shake (for 2D/DOM elements)
// ============================================================================

export interface UseCSSShakeResult {
  /**
   * Trigger a CSS-based shake.
   */
  shake: (intensity?: ShakeIntensity) => void
  /**
   * CSS class to apply to shaking element.
   */
  className: string
  /**
   * Inline styles for manual application.
   */
  style: React.CSSProperties
}

/**
 * useCSSShake - CSS-based shake for DOM elements.
 *
 * @example
 * ```tsx
 * function GameCanvas() {
 *   const shake = useCSSShake();
 *
 *   return (
 *     <div className={shake.className} style={shake.style}>
 *       <canvas />
 *       <button onClick={() => shake.shake('medium')}>Shake!</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCSSShake(): UseCSSShakeResult {
  const [shakeClass, setShakeClass] = useState('')
  const [shakeStyle, setShakeStyle] = useState<React.CSSProperties>({})
  const animationFrame = useRef<number>(0)
  const startTime = useRef(0)

  const shake = useCallback((intensity: ShakeIntensity = 'medium') => {
    const reducedMotion = prefersReducedMotion()
    if (reducedMotion) return

    const config = SHAKE_PRESETS[intensity]
    startTime.current = performance.now()

    const animate = () => {
      const elapsed = (performance.now() - startTime.current) / 1000
      const progress = elapsed / config.duration

      if (progress >= 1) {
        setShakeStyle({ transform: 'translate(0, 0)' })
        setShakeClass('')
        return
      }

      const decay = calculateDecay(progress, config.decay)
      const currentIntensity = config.intensity * decay * 100 // Convert to pixels

      const x = Math.sin(elapsed * config.frequency * Math.PI * 2) * noise() * currentIntensity
      const y = Math.sin(elapsed * config.frequency * Math.PI * 2 * 1.1) * noise() * currentIntensity

      setShakeStyle({
        transform: `translate(${x}px, ${y}px)`,
        willChange: 'transform',
      })
      setShakeClass('shaking')

      animationFrame.current = requestAnimationFrame(animate)
    }

    cancelAnimationFrame(animationFrame.current)
    animate()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationFrame.current)
    }
  }, [])

  return {
    shake,
    className: shakeClass,
    style: shakeStyle,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ScreenShake
