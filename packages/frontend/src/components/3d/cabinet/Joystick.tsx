/**
 * Joystick - 3D arcade joystick component
 *
 * Creates a realistic joystick 3D model with shaft and ball top that
 * can animate based on input direction. Features metallic and plastic
 * materials with a pivot point for smooth tilting animations.
 *
 * @module 3d/cabinet/Joystick
 */

import { useRef, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CABINET_CONTROLS, MESH_NAMES } from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface JoystickDirection {
  /** X direction (-1 to 1, negative = left, positive = right) */
  x: number
  /** Y direction (-1 to 1, negative = forward, positive = backward) */
  y: number
}

export interface JoystickProps {
  /** Position of the joystick [x, y, z] */
  position?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Color of the joystick base ring */
  baseColor?: string
  /** Color of the ball top */
  ballColor?: string
  /** Color of the shaft */
  shaftColor?: string
  /** Current direction input (-1 to 1 for x and y) */
  direction?: JoystickDirection
  /** Enable idle wobble animation when not in use */
  animated?: boolean
  /** Idle wobble speed multiplier */
  wobbleSpeed?: number
  /** Idle wobble amplitude */
  wobbleAmplitude?: number
  /** Maximum tilt angle in degrees */
  maxTiltAngle?: number
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Material roughness for base (0-1) */
  baseRoughness?: number
  /** Material metalness for base (0-1) */
  baseMetalness?: number
  /** Shaft material roughness (0-1) */
  shaftRoughness?: number
  /** Shaft material metalness (0-1) */
  shaftMetalness?: number
  /** Ball material roughness (0-1) */
  ballRoughness?: number
  /** Ball material metalness (0-1) */
  ballMetalness?: number
  /** Called when joystick is ready */
  onReady?: (group: THREE.Group) => void
}

export interface JoystickHandle {
  /** Reference to the root group */
  group: THREE.Group | null
  /** Reference to the stick pivot group */
  stickPivot: THREE.Group | null
  /** Set direction programmatically */
  setDirection: (direction: JoystickDirection) => void
  /** Reset joystick to center position */
  reset: () => void
  /** Get current tilt rotation in radians */
  getTiltRotation: () => { x: number; z: number }
}

// ============================================================================
// Constants
// ============================================================================

// Base dimensions (black mounting plate)
const BASE_OUTER_RADIUS = CABINET_CONTROLS.joystickRadius * 2.5
const BASE_HEIGHT = 0.025

// Inner ring dimensions (colored ring)
const RING_RADIUS = CABINET_CONTROLS.joystickRadius * 1.5
const RING_HEIGHT = 0.012

// Shaft dimensions (cylindrical stick)
const SHAFT_RADIUS = 0.018
const SHAFT_HEIGHT = 0.09

// Ball top dimensions
const BALL_RADIUS = 0.028

// Boot/dust cover dimensions
const BOOT_OUTER_RADIUS = SHAFT_RADIUS * 1.8
const BOOT_INNER_RADIUS = SHAFT_RADIUS * 0.6
const BOOT_HEIGHT = 0.015

// Default colors
const DEFAULT_BASE_COLOR = '#1a1a1a'
const DEFAULT_SHAFT_COLOR = '#2a2a2a'
const DEFAULT_BALL_COLOR = '#ff0000'
const DEFAULT_RING_COLOR = '#333333'

// Animation defaults
const DEFAULT_MAX_TILT = 25 // degrees
const DEFAULT_WOBBLE_SPEED = 2
const DEFAULT_WOBBLE_AMPLITUDE = 0.02

// ============================================================================
// Helper Components
// ============================================================================

interface JoystickBaseProps {
  baseColor: string
  ringColor: string
  baseRoughness: number
  baseMetalness: number
  castShadow: boolean
  receiveShadow: boolean
}

/**
 * JoystickBase - The mounting plate and ring at the bottom
 */
function JoystickBase({
  baseColor,
  ringColor,
  baseRoughness,
  baseMetalness,
  castShadow,
  receiveShadow,
}: JoystickBaseProps) {
  return (
    <group name="JoystickBase">
      {/* Outer base plate (black housing) */}
      <mesh
        name={MESH_NAMES.controls.joystickBase}
        position={[0, BASE_HEIGHT / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[BASE_OUTER_RADIUS, BASE_OUTER_RADIUS * 1.15, BASE_HEIGHT, 24]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={baseRoughness}
          metalness={baseMetalness}
        />
      </mesh>

      {/* Inner decorative ring */}
      <mesh
        position={[0, BASE_HEIGHT + RING_HEIGHT / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[RING_RADIUS, RING_RADIUS, RING_HEIGHT, 24]} />
        <meshStandardMaterial
          color={ringColor}
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Boot/dust cover base (rubber-like material around shaft hole) */}
      <mesh
        position={[0, BASE_HEIGHT + RING_HEIGHT + BOOT_HEIGHT / 2, 0]}
        castShadow={false}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[BOOT_OUTER_RADIUS, BOOT_INNER_RADIUS, BOOT_HEIGHT, 16]} />
        <meshStandardMaterial
          color="#111111"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>
    </group>
  )
}

interface JoystickShaftProps {
  shaftColor: string
  shaftRoughness: number
  shaftMetalness: number
  castShadow: boolean
}

/**
 * JoystickShaft - The cylindrical shaft/stick
 */
function JoystickShaft({
  shaftColor,
  shaftRoughness,
  shaftMetalness,
  castShadow,
}: JoystickShaftProps) {
  return (
    <mesh
      name={MESH_NAMES.controls.joystickStick}
      position={[0, SHAFT_HEIGHT / 2, 0]}
      castShadow={castShadow}
    >
      <cylinderGeometry args={[SHAFT_RADIUS, SHAFT_RADIUS * 0.95, SHAFT_HEIGHT, 12]} />
      <meshStandardMaterial
        color={shaftColor}
        roughness={shaftRoughness}
        metalness={shaftMetalness}
      />
    </mesh>
  )
}

interface JoystickBallProps {
  ballColor: string
  ballRoughness: number
  ballMetalness: number
  castShadow: boolean
}

/**
 * JoystickBall - The spherical ball top
 */
function JoystickBall({
  ballColor,
  ballRoughness,
  ballMetalness,
  castShadow,
}: JoystickBallProps) {
  return (
    <mesh
      position={[0, SHAFT_HEIGHT + BALL_RADIUS * 0.85, 0]}
      castShadow={castShadow}
    >
      <sphereGeometry args={[BALL_RADIUS, 20, 20]} />
      <meshStandardMaterial
        color={ballColor}
        roughness={ballRoughness}
        metalness={ballMetalness}
        // Slight emissive glow for visibility
        emissive={ballColor}
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Joystick - Arcade joystick 3D component
 *
 * A realistic joystick with base plate, shaft, and ball top.
 * Supports directional input for tilting animation and idle wobble.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Joystick position={[0, 0, 0]} />
 *
 * // With direction input
 * <Joystick
 *   direction={{ x: 0.5, y: -0.3 }}
 *   ballColor="#00ff00"
 *   maxTiltAngle={30}
 * />
 *
 * // With idle animation
 * <Joystick animated wobbleSpeed={3} />
 * ```
 */
export const Joystick = forwardRef<JoystickHandle, JoystickProps>(function Joystick(
  {
    position = [0, 0, 0],
    scale = 1,
    baseColor = DEFAULT_BASE_COLOR,
    ballColor = DEFAULT_BALL_COLOR,
    shaftColor = DEFAULT_SHAFT_COLOR,
    direction = { x: 0, y: 0 },
    animated = false,
    wobbleSpeed = DEFAULT_WOBBLE_SPEED,
    wobbleAmplitude = DEFAULT_WOBBLE_AMPLITUDE,
    maxTiltAngle = DEFAULT_MAX_TILT,
    castShadow = true,
    receiveShadow = true,
    baseRoughness = 0.5,
    baseMetalness = 0.8,
    shaftRoughness = 0.4,
    shaftMetalness = 0.6,
    ballRoughness = 0.3,
    ballMetalness = 0.1,
    onReady,
  },
  ref
) {
  const groupRef = useRef<THREE.Group>(null)
  const stickPivotRef = useRef<THREE.Group>(null)
  const animationPhase = useRef(0)
  const currentDirection = useRef<JoystickDirection>({ x: 0, y: 0 })

  // Convert max tilt angle to radians
  const maxTiltRad = (maxTiltAngle * Math.PI) / 180

  // Calculate pivot point height (where stick rotates from)
  const pivotHeight = BASE_HEIGHT + RING_HEIGHT + BOOT_HEIGHT

  // Expose imperative handle for external control
  useImperativeHandle(
    ref,
    () => ({
      group: groupRef.current,
      stickPivot: stickPivotRef.current,
      setDirection: (dir: JoystickDirection) => {
        currentDirection.current = {
          x: Math.max(-1, Math.min(1, dir.x)),
          y: Math.max(-1, Math.min(1, dir.y)),
        }
      },
      reset: () => {
        currentDirection.current = { x: 0, y: 0 }
      },
      getTiltRotation: () => {
        if (stickPivotRef.current) {
          return {
            x: stickPivotRef.current.rotation.x,
            z: stickPivotRef.current.rotation.z,
          }
        }
        return { x: 0, z: 0 }
      },
    }),
    []
  )

  // Animation frame for stick movement
  useFrame((_state, delta) => {
    if (!stickPivotRef.current) return

    // Update current direction from props
    currentDirection.current = direction

    const { x: dirX, y: dirY } = currentDirection.current
    const isIdle = dirX === 0 && dirY === 0

    if (animated && isIdle) {
      // Idle wobble animation - subtle movement when not in use
      animationPhase.current += delta * wobbleSpeed
      const wobbleX = Math.sin(animationPhase.current) * wobbleAmplitude
      const wobbleZ = Math.sin(animationPhase.current * 0.7 + 1.5) * wobbleAmplitude * 0.6

      // Smooth lerp to wobble
      stickPivotRef.current.rotation.x +=
        (wobbleX - stickPivotRef.current.rotation.x) * delta * 8
      stickPivotRef.current.rotation.z +=
        (wobbleZ - stickPivotRef.current.rotation.z) * delta * 8
    } else {
      // Direction-based tilt animation
      const targetRotX = -dirY * maxTiltRad
      const targetRotZ = dirX * maxTiltRad

      // Smooth lerp to target position
      const lerpFactor = delta * 12
      stickPivotRef.current.rotation.x +=
        (targetRotX - stickPivotRef.current.rotation.x) * lerpFactor
      stickPivotRef.current.rotation.z +=
        (targetRotZ - stickPivotRef.current.rotation.z) * lerpFactor
    }
  })

  // Notify parent when ready
  if (groupRef.current && onReady) {
    // Use microtask to ensure React has finished setting up refs
    queueMicrotask(() => {
      if (groupRef.current) {
        onReady(groupRef.current)
      }
    })
  }

  return (
    <group
      ref={groupRef}
      name="Joystick"
      position={position}
      scale={scale}
    >
      {/* Base (stationary part) */}
      <JoystickBase
        baseColor={baseColor}
        ringColor={DEFAULT_RING_COLOR}
        baseRoughness={baseRoughness}
        baseMetalness={baseMetalness}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />

      {/* Stick pivot group (rotates based on direction) */}
      <group
        ref={stickPivotRef}
        name="JoystickPivot"
        position={[0, pivotHeight, 0]}
      >
        {/* Shaft (movable stick) */}
        <JoystickShaft
          shaftColor={shaftColor}
          shaftRoughness={shaftRoughness}
          shaftMetalness={shaftMetalness}
          castShadow={castShadow}
        />

        {/* Ball top */}
        <JoystickBall
          ballColor={ballColor}
          ballRoughness={ballRoughness}
          ballMetalness={ballMetalness}
          castShadow={castShadow}
        />
      </group>
    </group>
  )
})

// ============================================================================
// Hook for joystick control
// ============================================================================

export interface UseJoystickOptions {
  /** Initial direction */
  initialDirection?: JoystickDirection
  /** Smoothing factor for input (0-1, higher = smoother) */
  smoothing?: number
}

export interface UseJoystickResult {
  /** Ref to attach to the Joystick component */
  ref: React.RefObject<JoystickHandle>
  /** Current direction */
  direction: JoystickDirection
  /** Set direction with optional smoothing */
  setDirection: (direction: JoystickDirection) => void
  /** Move joystick in a direction (additive) */
  move: (delta: JoystickDirection) => void
  /** Reset to center */
  reset: () => void
  /** Check if joystick is at center */
  isCenter: () => boolean
  /** Get normalized direction (magnitude <= 1) */
  getNormalized: () => JoystickDirection
}

/**
 * useJoystick - Hook for controlling joystick state
 *
 * @example
 * ```tsx
 * function GameController() {
 *   const joystick = useJoystick()
 *
 *   useEffect(() => {
 *     const handleKeyDown = (e: KeyboardEvent) => {
 *       if (e.key === 'ArrowLeft') joystick.setDirection({ x: -1, y: 0 })
 *       if (e.key === 'ArrowRight') joystick.setDirection({ x: 1, y: 0 })
 *     }
 *     window.addEventListener('keydown', handleKeyDown)
 *     return () => window.removeEventListener('keydown', handleKeyDown)
 *   }, [])
 *
 *   return <Joystick ref={joystick.ref} direction={joystick.direction} />
 * }
 * ```
 */
export function useJoystick(options: UseJoystickOptions = {}): UseJoystickResult {
  const { initialDirection = { x: 0, y: 0 } } = options
  const ref = useRef<JoystickHandle>(null)
  const direction = useRef<JoystickDirection>({ ...initialDirection })

  const setDirection = (newDirection: JoystickDirection) => {
    direction.current = {
      x: Math.max(-1, Math.min(1, newDirection.x)),
      y: Math.max(-1, Math.min(1, newDirection.y)),
    }
    ref.current?.setDirection(direction.current)
  }

  const move = (delta: JoystickDirection) => {
    setDirection({
      x: direction.current.x + delta.x,
      y: direction.current.y + delta.y,
    })
  }

  const reset = () => {
    direction.current = { x: 0, y: 0 }
    ref.current?.reset()
  }

  const isCenter = () => {
    const threshold = 0.01
    return (
      Math.abs(direction.current.x) < threshold &&
      Math.abs(direction.current.y) < threshold
    )
  }

  const getNormalized = (): JoystickDirection => {
    const { x, y } = direction.current
    const magnitude = Math.sqrt(x * x + y * y)
    if (magnitude > 1) {
      return { x: x / magnitude, y: y / magnitude }
    }
    return { x, y }
  }

  return {
    ref,
    direction: direction.current,
    setDirection,
    move,
    reset,
    isCenter,
    getNormalized,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default Joystick
