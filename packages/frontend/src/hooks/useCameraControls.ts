/**
 * useCameraControls - Hook for camera controls in Three.js scenes
 *
 * Provides orbit, zoom, and pan controls with smooth animations.
 * Built on top of drei's OrbitControls with additional utilities.
 *
 * @module hooks/useCameraControls
 */

import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Type for OrbitControls from drei - we use a simplified interface
// since the full type from three-stdlib requires additional dependencies
interface OrbitControlsImpl {
  target: THREE.Vector3
  enabled: boolean
  autoRotate: boolean
  autoRotateSpeed: number
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
  minAzimuthAngle: number
  maxAzimuthAngle: number
  minZoom: number
  maxZoom: number
  update: () => void
}

type OrbitControlsType = OrbitControlsImpl

// ============================================================================
// Types
// ============================================================================

/**
 * Camera position in 3D space
 */
export interface CameraPosition {
  /** X position */
  x: number
  /** Y position */
  y: number
  /** Z position */
  z: number
}

/**
 * Camera target (look-at point)
 */
export interface CameraTarget {
  /** X target */
  x: number
  /** Y target */
  y: number
  /** Z target */
  z: number
}

/**
 * Control limits for orbit controls
 */
export interface ControlLimits {
  /** Minimum distance from target */
  minDistance: number
  /** Maximum distance from target */
  maxDistance: number
  /** Minimum polar angle in radians (vertical rotation) */
  minPolarAngle: number
  /** Maximum polar angle in radians (vertical rotation) */
  maxPolarAngle: number
  /** Minimum azimuth angle in radians (horizontal rotation) */
  minAzimuthAngle: number
  /** Maximum azimuth angle in radians (horizontal rotation) */
  maxAzimuthAngle: number
  /** Minimum zoom (for orthographic cameras) */
  minZoom: number
  /** Maximum zoom (for orthographic cameras) */
  maxZoom: number
}

/**
 * Damping configuration for smooth movements
 */
export interface DampingConfig {
  /** Enable damping for smooth movements */
  enabled: boolean
  /** Damping factor (0-1, lower = smoother) */
  factor: number
}

/**
 * Touch input configuration
 */
export interface TouchConfig {
  /** Enable touch inputs */
  enabled: boolean
  /** Touch rotation speed (0-1) */
  rotateSpeed: number
  /** Touch pan speed (0-1) */
  panSpeed: number
  /** Touch zoom speed (0-1) */
  zoomSpeed: number
}

/**
 * Camera preset configuration
 */
export interface CameraPreset {
  /** Preset name */
  name: string
  /** Camera position */
  position: CameraPosition
  /** Camera target */
  target: CameraTarget
  /** Optional field of view for perspective cameras */
  fov?: number
}

/**
 * Animation configuration for camera transitions
 */
export interface CameraAnimationConfig {
  /** Animation duration in milliseconds */
  duration: number
  /** Easing function name */
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

/**
 * State returned by the hook
 */
export interface CameraControlsState {
  /** Current camera position */
  position: CameraPosition
  /** Current camera target */
  target: CameraTarget
  /** Current zoom level */
  zoom: number
  /** Whether controls are enabled */
  enabled: boolean
  /** Whether auto-rotate is active */
  autoRotate: boolean
  /** Whether camera is currently animating */
  isAnimating: boolean
}

/**
 * Options for useCameraControls hook
 */
export interface UseCameraControlsOptions {
  /** Initial camera position */
  initialPosition?: CameraPosition
  /** Initial camera target */
  initialTarget?: CameraTarget
  /** Control limits */
  limits?: Partial<ControlLimits>
  /** Damping configuration */
  damping?: Partial<DampingConfig>
  /** Touch input configuration */
  touch?: Partial<TouchConfig>
  /** Enable rotation */
  enableRotate?: boolean
  /** Enable pan */
  enablePan?: boolean
  /** Enable zoom */
  enableZoom?: boolean
  /** Auto-rotate speed (0 = disabled) */
  autoRotateSpeed?: number
  /** Mouse rotation speed */
  rotateSpeed?: number
  /** Mouse pan speed */
  panSpeed?: number
  /** Mouse zoom speed */
  zoomSpeed?: number
  /** Callback when camera changes */
  onChange?: (state: CameraControlsState) => void
}

/**
 * Return type for useCameraControls
 */
export interface UseCameraControlsResult {
  /** Current state */
  state: CameraControlsState
  /** Reference to attach to OrbitControls */
  controlsRef: React.RefObject<OrbitControlsType | null>
  /** Set camera position */
  setPosition: (position: CameraPosition, animate?: boolean) => void
  /** Set camera target */
  setTarget: (target: CameraTarget, animate?: boolean) => void
  /** Set camera position and target */
  setPositionAndTarget: (
    position: CameraPosition,
    target: CameraTarget,
    animate?: boolean
  ) => void
  /** Apply a camera preset */
  applyPreset: (preset: CameraPreset, animate?: boolean) => void
  /** Reset to initial position */
  reset: (animate?: boolean) => void
  /** Zoom in by a factor */
  zoomIn: (factor?: number) => void
  /** Zoom out by a factor */
  zoomOut: (factor?: number) => void
  /** Pan camera */
  pan: (deltaX: number, deltaY: number) => void
  /** Rotate camera around target */
  rotate: (azimuth: number, polar: number) => void
  /** Enable/disable controls */
  setEnabled: (enabled: boolean) => void
  /** Enable/disable auto-rotate */
  setAutoRotate: (enabled: boolean, speed?: number) => void
  /** Update limits */
  setLimits: (limits: Partial<ControlLimits>) => void
  /** Get orbit controls props for drei's OrbitControls */
  getControlsProps: () => OrbitControlsProps
}

/**
 * Props for drei's OrbitControls
 */
export interface OrbitControlsProps {
  ref: React.RefObject<OrbitControlsType | null>
  makeDefault: boolean
  enableDamping: boolean
  dampingFactor: number
  minDistance: number
  maxDistance: number
  minPolarAngle: number
  maxPolarAngle: number
  minAzimuthAngle: number
  maxAzimuthAngle: number
  minZoom: number
  maxZoom: number
  rotateSpeed: number
  panSpeed: number
  zoomSpeed: number
  enableRotate: boolean
  enablePan: boolean
  enableZoom: boolean
  autoRotate: boolean
  autoRotateSpeed: number
  touches: {
    ONE: THREE.TOUCH
    TWO: THREE.TOUCH
  }
  target: THREE.Vector3
  onChange?: () => void
}

// ============================================================================
// Constants
// ============================================================================

/** Default camera position */
export const DEFAULT_CAMERA_POSITION: CameraPosition = { x: 0, y: 2, z: 5 }

/** Default camera target */
export const DEFAULT_CAMERA_TARGET: CameraTarget = { x: 0, y: 0, z: 0 }

/** Default control limits */
export const DEFAULT_LIMITS: ControlLimits = {
  minDistance: 1,
  maxDistance: 100,
  minPolarAngle: 0,
  maxPolarAngle: Math.PI,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  minZoom: 0.5,
  maxZoom: 10,
}

/** Default damping configuration */
export const DEFAULT_DAMPING: DampingConfig = {
  enabled: true,
  factor: 0.05,
}

/** Default touch configuration */
export const DEFAULT_TOUCH: TouchConfig = {
  enabled: true,
  rotateSpeed: 0.5,
  panSpeed: 0.5,
  zoomSpeed: 0.5,
}

/** Default animation configuration */
export const DEFAULT_ANIMATION: CameraAnimationConfig = {
  duration: 500,
  easing: 'easeInOut',
}

// ============================================================================
// Preset Definitions
// ============================================================================

/**
 * Built-in camera presets for arcade cabinet viewing
 */
export const CAMERA_PRESETS: Record<string, CameraPreset> = {
  /** Front view of the arcade cabinet */
  front: {
    name: 'Front',
    position: { x: 0, y: 1.5, z: 3 },
    target: { x: 0, y: 1, z: 0 },
    fov: 50,
  },
  /** Angled view from the side */
  angle: {
    name: 'Angle',
    position: { x: 2, y: 1.5, z: 2 },
    target: { x: 0, y: 1, z: 0 },
    fov: 50,
  },
  /** Top-down view */
  top: {
    name: 'Top',
    position: { x: 0, y: 5, z: 0.1 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  /** Close-up of screen */
  screen: {
    name: 'Screen',
    position: { x: 0, y: 1.2, z: 1.5 },
    target: { x: 0, y: 1.2, z: 0 },
    fov: 40,
  },
  /** Wide shot showing full cabinet */
  wide: {
    name: 'Wide',
    position: { x: 3, y: 2, z: 4 },
    target: { x: 0, y: 1, z: 0 },
    fov: 60,
  },
}

// ============================================================================
// Easing Functions
// ============================================================================

const EASING_FUNCTIONS: Record<
  CameraAnimationConfig['easing'],
  (t: number) => number
> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Linearly interpolate between two values
 */
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

/**
 * Convert CameraPosition to THREE.Vector3
 */
function positionToVector3(pos: CameraPosition): THREE.Vector3 {
  return new THREE.Vector3(pos.x, pos.y, pos.z)
}

/**
 * Convert THREE.Vector3 to CameraPosition
 */
function vector3ToPosition(vec: THREE.Vector3): CameraPosition {
  return { x: vec.x, y: vec.y, z: vec.z }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useCameraControls - Hook for camera controls with orbit, zoom, and pan
 *
 * Provides a complete camera control system with smooth animations,
 * configurable limits, and touch support.
 *
 * @example
 * ```tsx
 * function Scene() {
 *   const { state, controlsRef, setPosition, applyPreset, getControlsProps } = useCameraControls({
 *     initialPosition: { x: 0, y: 2, z: 5 },
 *     damping: { enabled: true, factor: 0.05 },
 *     limits: { minDistance: 2, maxDistance: 10 },
 *   })
 *
 *   return (
 *     <Canvas>
 *       <OrbitControls {...getControlsProps()} />
 *       <mesh onClick={() => applyPreset(CAMERA_PRESETS.screen, true)}>
 *         <boxGeometry />
 *       </mesh>
 *     </Canvas>
 *   )
 * }
 * ```
 */
export function useCameraControls(
  options: UseCameraControlsOptions = {}
): UseCameraControlsResult {
  const {
    initialPosition = DEFAULT_CAMERA_POSITION,
    initialTarget = DEFAULT_CAMERA_TARGET,
    limits: userLimits = {},
    damping: userDamping = {},
    touch: userTouch = {},
    enableRotate = true,
    enablePan = true,
    enableZoom = true,
    autoRotateSpeed = 0,
    rotateSpeed = 1,
    panSpeed = 1,
    zoomSpeed = 1,
    onChange,
  } = options

  // Merge with defaults
  const limits = useMemo(
    () => ({ ...DEFAULT_LIMITS, ...userLimits }),
    [userLimits]
  )
  const damping = useMemo(
    () => ({ ...DEFAULT_DAMPING, ...userDamping }),
    [userDamping]
  )
  const touch = useMemo(
    () => ({ ...DEFAULT_TOUCH, ...userTouch }),
    [userTouch]
  )

  // Refs
  const controlsRef = useRef<OrbitControlsType | null>(null)
  const animationRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false)

  // Get Three.js context
  const { camera } = useThree()

  // State - using useState for state that's returned to consumers
  const [state, setState] = useState<CameraControlsState>({
    position: initialPosition,
    target: initialTarget,
    zoom: 1,
    enabled: true,
    autoRotate: autoRotateSpeed > 0,
    isAnimating: false,
  })

  // Keep a ref that syncs with state for use in callbacks
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Current limits state (can be updated dynamically)
  const limitsRef = useRef(limits)
  useEffect(() => {
    limitsRef.current = limits
  }, [limits])

  // Update state and notify
  const updateState = useCallback(
    (updates: Partial<CameraControlsState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates }
        onChange?.(newState)
        return newState
      })
    },
    [onChange]
  )

  // Cancel any ongoing animation
  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    isAnimatingRef.current = false
    updateState({ isAnimating: false })
  }, [updateState])

  // Animate camera to new position/target
  const animateTo = useCallback(
    (
      targetPosition: CameraPosition,
      targetLookAt: CameraTarget,
      config: CameraAnimationConfig = DEFAULT_ANIMATION
    ) => {
      cancelAnimation()
      isAnimatingRef.current = true
      updateState({ isAnimating: true })

      const startPosition = vector3ToPosition(camera.position)
      const startTarget = controlsRef.current
        ? vector3ToPosition(controlsRef.current.target)
        : stateRef.current.target

      const startTime = performance.now()
      const easingFn = EASING_FUNCTIONS[config.easing]

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / config.duration, 1)
        const easedProgress = easingFn(progress)

        // Interpolate position
        camera.position.set(
          lerp(startPosition.x, targetPosition.x, easedProgress),
          lerp(startPosition.y, targetPosition.y, easedProgress),
          lerp(startPosition.z, targetPosition.z, easedProgress)
        )

        // Interpolate target
        if (controlsRef.current) {
          controlsRef.current.target.set(
            lerp(startTarget.x, targetLookAt.x, easedProgress),
            lerp(startTarget.y, targetLookAt.y, easedProgress),
            lerp(startTarget.z, targetLookAt.z, easedProgress)
          )
          controlsRef.current.update()
        }

        // Update state
        updateState({
          position: vector3ToPosition(camera.position),
          target: controlsRef.current
            ? vector3ToPosition(controlsRef.current.target)
            : targetLookAt,
        })

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          isAnimatingRef.current = false
          updateState({ isAnimating: false })
          animationRef.current = null
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [camera, cancelAnimation, updateState]
  )

  // Set position (with optional animation)
  const setPosition = useCallback(
    (position: CameraPosition, animate = false) => {
      if (animate) {
        animateTo(position, stateRef.current.target)
      } else {
        camera.position.set(position.x, position.y, position.z)
        updateState({ position })
        controlsRef.current?.update()
      }
    },
    [camera, animateTo, updateState]
  )

  // Set target (with optional animation)
  const setTarget = useCallback(
    (target: CameraTarget, animate = false) => {
      if (animate) {
        animateTo(stateRef.current.position, target)
      } else {
        if (controlsRef.current) {
          controlsRef.current.target.set(target.x, target.y, target.z)
          controlsRef.current.update()
        }
        updateState({ target })
      }
    },
    [animateTo, updateState]
  )

  // Set both position and target
  const setPositionAndTarget = useCallback(
    (position: CameraPosition, target: CameraTarget, animate = false) => {
      if (animate) {
        animateTo(position, target)
      } else {
        camera.position.set(position.x, position.y, position.z)
        if (controlsRef.current) {
          controlsRef.current.target.set(target.x, target.y, target.z)
          controlsRef.current.update()
        }
        updateState({ position, target })
      }
    },
    [camera, animateTo, updateState]
  )

  // Apply a preset
  const applyPreset = useCallback(
    (preset: CameraPreset, animate = false) => {
      setPositionAndTarget(preset.position, preset.target, animate)
      // Note: FOV changes would require additional handling for perspective cameras
    },
    [setPositionAndTarget]
  )

  // Reset to initial position
  const reset = useCallback(
    (animate = false) => {
      setPositionAndTarget(initialPosition, initialTarget, animate)
    },
    [initialPosition, initialTarget, setPositionAndTarget]
  )

  // Zoom in
  const zoomIn = useCallback(
    (factor = 1.2) => {
      const currentDistance = camera.position.distanceTo(
        controlsRef.current?.target ?? new THREE.Vector3()
      )
      const newDistance = Math.max(
        currentDistance / factor,
        limitsRef.current.minDistance
      )

      // Move camera closer along the direction to target
      if (controlsRef.current) {
        const direction = new THREE.Vector3()
          .subVectors(camera.position, controlsRef.current.target)
          .normalize()
        camera.position.copy(
          controlsRef.current.target.clone().add(direction.multiplyScalar(newDistance))
        )
        controlsRef.current.update()
        updateState({ position: vector3ToPosition(camera.position) })
      }
    },
    [camera, updateState]
  )

  // Zoom out
  const zoomOut = useCallback(
    (factor = 1.2) => {
      const currentDistance = camera.position.distanceTo(
        controlsRef.current?.target ?? new THREE.Vector3()
      )
      const newDistance = Math.min(
        currentDistance * factor,
        limitsRef.current.maxDistance
      )

      // Move camera farther along the direction to target
      if (controlsRef.current) {
        const direction = new THREE.Vector3()
          .subVectors(camera.position, controlsRef.current.target)
          .normalize()
        camera.position.copy(
          controlsRef.current.target.clone().add(direction.multiplyScalar(newDistance))
        )
        controlsRef.current.update()
        updateState({ position: vector3ToPosition(camera.position) })
      }
    },
    [camera, updateState]
  )

  // Pan camera
  const pan = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!controlsRef.current) return

      // Get camera's right and up vectors
      const right = new THREE.Vector3()
      const up = new THREE.Vector3()
      camera.getWorldDirection(new THREE.Vector3())
      right.setFromMatrixColumn(camera.matrix, 0)
      up.setFromMatrixColumn(camera.matrix, 1)

      // Apply pan
      const panOffset = new THREE.Vector3()
      panOffset.addScaledVector(right, -deltaX * panSpeed * 0.01)
      panOffset.addScaledVector(up, deltaY * panSpeed * 0.01)

      camera.position.add(panOffset)
      controlsRef.current.target.add(panOffset)
      controlsRef.current.update()

      updateState({
        position: vector3ToPosition(camera.position),
        target: vector3ToPosition(controlsRef.current.target),
      })
    },
    [camera, panSpeed, updateState]
  )

  // Rotate camera around target
  const rotate = useCallback(
    (azimuth: number, polar: number) => {
      if (!controlsRef.current) return

      // Get current spherical coordinates
      const offset = new THREE.Vector3().subVectors(
        camera.position,
        controlsRef.current.target
      )
      const spherical = new THREE.Spherical().setFromVector3(offset)

      // Apply rotation
      spherical.theta += azimuth * rotateSpeed * 0.01
      spherical.phi += polar * rotateSpeed * 0.01

      // Clamp polar angle
      spherical.phi = Math.max(
        limitsRef.current.minPolarAngle,
        Math.min(limitsRef.current.maxPolarAngle, spherical.phi)
      )

      // Clamp azimuth angle
      if (
        limitsRef.current.minAzimuthAngle !== -Infinity ||
        limitsRef.current.maxAzimuthAngle !== Infinity
      ) {
        spherical.theta = Math.max(
          limitsRef.current.minAzimuthAngle,
          Math.min(limitsRef.current.maxAzimuthAngle, spherical.theta)
        )
      }

      // Apply back to camera
      offset.setFromSpherical(spherical)
      camera.position.copy(controlsRef.current.target).add(offset)
      controlsRef.current.update()

      updateState({ position: vector3ToPosition(camera.position) })
    },
    [camera, rotateSpeed, updateState]
  )

  // Enable/disable controls
  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (controlsRef.current) {
        controlsRef.current.enabled = enabled
      }
      updateState({ enabled })
    },
    [updateState]
  )

  // Enable/disable auto-rotate
  const setAutoRotate = useCallback(
    (enabled: boolean, speed?: number) => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = enabled
        if (speed !== undefined) {
          controlsRef.current.autoRotateSpeed = speed
        }
      }
      updateState({ autoRotate: enabled })
    },
    [updateState]
  )

  // Update limits dynamically
  const setLimits = useCallback((newLimits: Partial<ControlLimits>) => {
    limitsRef.current = { ...limitsRef.current, ...newLimits }
    if (controlsRef.current) {
      if (newLimits.minDistance !== undefined)
        controlsRef.current.minDistance = newLimits.minDistance
      if (newLimits.maxDistance !== undefined)
        controlsRef.current.maxDistance = newLimits.maxDistance
      if (newLimits.minPolarAngle !== undefined)
        controlsRef.current.minPolarAngle = newLimits.minPolarAngle
      if (newLimits.maxPolarAngle !== undefined)
        controlsRef.current.maxPolarAngle = newLimits.maxPolarAngle
      if (newLimits.minAzimuthAngle !== undefined)
        controlsRef.current.minAzimuthAngle = newLimits.minAzimuthAngle
      if (newLimits.maxAzimuthAngle !== undefined)
        controlsRef.current.maxAzimuthAngle = newLimits.maxAzimuthAngle
      if (newLimits.minZoom !== undefined)
        controlsRef.current.minZoom = newLimits.minZoom
      if (newLimits.maxZoom !== undefined)
        controlsRef.current.maxZoom = newLimits.maxZoom
    }
  }, [])

  // Get props for OrbitControls
  const getControlsProps = useCallback((): OrbitControlsProps => {
    return {
      ref: controlsRef,
      makeDefault: true,
      enableDamping: damping.enabled,
      dampingFactor: damping.factor,
      minDistance: limits.minDistance,
      maxDistance: limits.maxDistance,
      minPolarAngle: limits.minPolarAngle,
      maxPolarAngle: limits.maxPolarAngle,
      minAzimuthAngle: limits.minAzimuthAngle,
      maxAzimuthAngle: limits.maxAzimuthAngle,
      minZoom: limits.minZoom,
      maxZoom: limits.maxZoom,
      rotateSpeed: touch.enabled ? touch.rotateSpeed : rotateSpeed,
      panSpeed: touch.enabled ? touch.panSpeed : panSpeed,
      zoomSpeed: touch.enabled ? touch.zoomSpeed : zoomSpeed,
      enableRotate,
      enablePan,
      enableZoom,
      autoRotate: autoRotateSpeed > 0,
      autoRotateSpeed,
      touches: {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN,
      },
      target: positionToVector3(initialTarget),
      onChange: () => {
        if (controlsRef.current) {
          updateState({
            position: vector3ToPosition(camera.position),
            target: vector3ToPosition(controlsRef.current.target),
          })
        }
      },
    }
  }, [
    camera,
    damping,
    limits,
    touch,
    rotateSpeed,
    panSpeed,
    zoomSpeed,
    enableRotate,
    enablePan,
    enableZoom,
    autoRotateSpeed,
    initialTarget,
    updateState,
  ])

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      cancelAnimation()
    }
  }, [cancelAnimation])

  return {
    state,
    controlsRef,
    setPosition,
    setTarget,
    setPositionAndTarget,
    applyPreset,
    reset,
    zoomIn,
    zoomOut,
    pan,
    rotate,
    setEnabled,
    setAutoRotate,
    setLimits,
    getControlsProps,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default useCameraControls
