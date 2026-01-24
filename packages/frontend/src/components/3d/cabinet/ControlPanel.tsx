/**
 * ControlPanel - Arcade cabinet control panel 3D component
 *
 * Creates the angled control panel surface that holds the joystick and buttons.
 * The panel is tilted at an ergonomic angle for comfortable gameplay.
 *
 * @module 3d/cabinet/ControlPanel
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import {
  CABINET_CONTROLS,
  CABINET_COLORS,
  MESH_NAMES,
  MESH_POSITIONS,
  getButtonPositions,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface ControlPanelProps {
  /** Position offset for the control panel [x, y, z] */
  position?: [number, number, number]
  /** Rotation in radians [x, y, z] - overrides default angle */
  rotation?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Control panel surface color */
  panelColor?: string
  /** Button hole colors (array of 6 colors for action buttons) */
  buttonColors?: readonly string[]
  /** Joystick color */
  joystickColor?: string
  /** Material roughness (0-1) */
  roughness?: number
  /** Material metalness (0-1) */
  metalness?: number
  /** Enable button glow effects */
  glowEnabled?: boolean
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Show joystick and buttons (set false for simplified view) */
  showControls?: boolean
  /** Render wireframe instead of solid */
  wireframe?: boolean
  /** Enable subtle hover animation */
  animated?: boolean
  /** Called when mesh is ready */
  onReady?: (group: THREE.Group) => void
  /** Children components */
  children?: React.ReactNode
}

export interface ControlPanelHandle {
  group: THREE.Group | null
  setPanelColor: (color: string) => void
  setButtonColor: (index: number, color: string) => void
  pressButton: (index: number) => void
  releaseButton: (index: number) => void
  moveJoystick: (direction: { x: number; y: number }) => void
  resetJoystick: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUGHNESS = 0.6
const DEFAULT_METALNESS = 0.2

// Bevel radius for rounded edges
const BEVEL_RADIUS = 0.02

// Button animation
const BUTTON_PRESS_DEPTH = 0.01

// ============================================================================
// Helper Components
// ============================================================================

interface JoystickProps {
  position: [number, number, number]
  baseColor: string
  ballColor: string
  direction?: { x: number; y: number }
  animated?: boolean
}

/**
 * Joystick component with base and movable stick
 */
function Joystick({
  position,
  baseColor,
  ballColor,
  direction = { x: 0, y: 0 },
  animated = false,
}: JoystickProps) {
  const stickRef = useRef<THREE.Group>(null)
  const animationPhase = useRef(0)

  // Joystick dimensions
  const baseRadius = CABINET_CONTROLS.joystickRadius * 2
  const baseHeight = 0.02
  const stickRadius = 0.015
  const stickHeight = 0.08
  const ballRadius = 0.025

  // Idle animation
  useFrame((_, delta) => {
    if (animated && stickRef.current && direction.x === 0 && direction.y === 0) {
      animationPhase.current += delta * 2
      const wobble = Math.sin(animationPhase.current) * 0.02
      stickRef.current.rotation.x = wobble
      stickRef.current.rotation.z = wobble * 0.5
    } else if (stickRef.current) {
      // Apply direction
      const maxTilt = Math.PI / 6 // 30 degrees max tilt
      stickRef.current.rotation.x = -direction.y * maxTilt
      stickRef.current.rotation.z = direction.x * maxTilt
    }
  })

  return (
    <group name={MESH_NAMES.controls.joystickBase} position={position}>
      {/* Base plate */}
      <mesh position={[0, baseHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[baseRadius, baseRadius * 1.2, baseHeight, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Inner ring (darker) */}
      <mesh position={[0, baseHeight + 0.005, 0]}>
        <cylinderGeometry args={[baseRadius * 0.6, baseRadius * 0.6, 0.01, 16]} />
        <meshStandardMaterial color={baseColor} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Stick group (rotates with direction) */}
      <group ref={stickRef} position={[0, baseHeight, 0]}>
        {/* Stick shaft */}
        <mesh name={MESH_NAMES.controls.joystickStick} position={[0, stickHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[stickRadius, stickRadius, stickHeight, 8]} />
          <meshStandardMaterial color="#222222" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Ball top */}
        <mesh position={[0, stickHeight + ballRadius * 0.8, 0]} castShadow>
          <sphereGeometry args={[ballRadius, 16, 16]} />
          <meshStandardMaterial color={ballColor} roughness={0.3} metalness={0.1} />
        </mesh>
      </group>
    </group>
  )
}

interface ButtonProps {
  position: [number, number, number]
  color: string
  radius?: number
  pressed?: boolean
  glowEnabled?: boolean
}

/**
 * Individual arcade button
 */
function Button({
  position,
  color,
  radius = CABINET_CONTROLS.buttonRadius,
  pressed = false,
  glowEnabled = true,
}: ButtonProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const targetY = useRef(0)

  // Button dimensions
  const height = 0.02
  const rimHeight = 0.005

  // Animate button press
  useFrame((_, delta) => {
    if (meshRef.current) {
      const pressedY = pressed ? -BUTTON_PRESS_DEPTH : 0
      targetY.current += (pressedY - targetY.current) * delta * 20
      meshRef.current.position.y = targetY.current + height / 2
    }
  })

  return (
    <group position={position}>
      {/* Button rim/housing */}
      <mesh position={[0, rimHeight / 2, 0]}>
        <cylinderGeometry args={[radius * 1.2, radius * 1.2, rimHeight, 16]} />
        <meshStandardMaterial color="#111111" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* Button cap */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        castShadow
      >
        <cylinderGeometry args={[radius, radius, height, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.2}
          emissive={glowEnabled ? color : '#000000'}
          emissiveIntensity={pressed ? 0.5 : 0.1}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ControlPanel - The arcade cabinet control panel
 *
 * This component creates the angled control surface with:
 * - Main panel surface (angled at ~20 degrees)
 * - Joystick (left side)
 * - 6 action buttons (right side, 2 rows of 3)
 * - Start and coin buttons
 *
 * @example
 * ```tsx
 * <ControlPanel
 *   panelColor="#12121a"
 *   showControls
 *   castShadow
 *   receiveShadow
 * />
 * ```
 */
export function ControlPanel({
  position,
  rotation,
  scale = 1,
  panelColor = CABINET_COLORS.controlPanel,
  buttonColors = CABINET_COLORS.buttons,
  joystickColor = CABINET_COLORS.joystick,
  roughness = DEFAULT_ROUGHNESS,
  metalness = DEFAULT_METALNESS,
  glowEnabled = true,
  castShadow = true,
  receiveShadow = true,
  showControls = true,
  wireframe = false,
  animated = false,
  onReady,
  children,
}: ControlPanelProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Dimensions from geometry constants
  const { width, depth, angle, thickness } = CABINET_CONTROLS

  // Calculate angle in radians (panel tilts toward player)
  const angleRad = -(angle * Math.PI) / 180

  // Default position: below the screen, extending forward
  const defaultPosition: [number, number, number] = [
    MESH_POSITIONS.controlPanel.x,
    MESH_POSITIONS.controlPanel.y,
    MESH_POSITIONS.controlPanel.z,
  ]

  // Panel material
  const panelMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: panelColor,
      roughness,
      metalness,
      wireframe,
    })
  }, [panelColor, roughness, metalness, wireframe])

  // Notify parent when ready
  useMemo(() => {
    if (groupRef.current && onReady) {
      onReady(groupRef.current)
    }
  }, [onReady])

  // Get button positions from geometry utility
  const buttonPositions = getButtonPositions()

  // Joystick position (left side of panel)
  const joystickOffset: [number, number, number] = [-width * 0.3, thickness + 0.01, 0]

  // Button group offset (right side of panel)
  const buttonGroupOffset: [number, number, number] = [width * 0.15, thickness + 0.01, 0]

  // Start/Coin button positions
  const startButtonOffset: [number, number, number] = [width * 0.35, thickness + 0.01, 0.05]
  const coinButtonOffset: [number, number, number] = [width * 0.35, thickness + 0.01, -0.05]

  return (
    <group
      ref={groupRef}
      name={MESH_NAMES.controls.group}
      position={position ?? defaultPosition}
      rotation={rotation ?? [angleRad, 0, 0]}
      scale={scale}
    >
      {/* Main panel surface */}
      <RoundedBox
        name={MESH_NAMES.controls.surface}
        args={[width, thickness, depth]}
        radius={BEVEL_RADIUS}
        smoothness={4}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <primitive object={panelMaterial} attach="material" />
      </RoundedBox>

      {/* Side supports (angled brackets connecting to body) */}
      <mesh
        position={[-width / 2 + 0.04, -0.1, -depth / 4]}
        rotation={[0, 0, -0.2]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color={panelColor} roughness={0.8} metalness={0.1} />
      </mesh>

      <mesh
        position={[width / 2 - 0.04, -0.1, -depth / 4]}
        rotation={[0, 0, 0.2]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[0.08, 0.25, 0.08]} />
        <meshStandardMaterial color={panelColor} roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Controls (joystick and buttons) */}
      {showControls && (
        <>
          {/* Joystick */}
          <Joystick
            position={joystickOffset}
            baseColor="#333333"
            ballColor={joystickColor}
            animated={animated}
          />

          {/* Action buttons (6 buttons in 2 rows of 3) */}
          <group position={buttonGroupOffset}>
            {buttonPositions.map((pos, index) => (
              <Button
                key={`button-${index}`}
                position={[pos.x, 0, pos.y]}
                color={buttonColors[index] || '#ffffff'}
                glowEnabled={glowEnabled}
              />
            ))}
          </group>

          {/* Start button (smaller, different color) */}
          <group position={startButtonOffset}>
            <Button
              position={[0, 0, 0]}
              color="#00ff00"
              radius={CABINET_CONTROLS.buttonRadius * 0.8}
              glowEnabled={glowEnabled}
            />
            {/* Start label would go here as Text3D */}
          </group>

          {/* Coin/Select button */}
          <group position={coinButtonOffset}>
            <Button
              position={[0, 0, 0]}
              color="#ffff00"
              radius={CABINET_CONTROLS.buttonRadius * 0.8}
              glowEnabled={glowEnabled}
            />
          </group>
        </>
      )}

      {/* Decorative edge trim */}
      <mesh
        position={[0, thickness / 2 + 0.005, depth / 2 - 0.01]}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[width * 0.95, 0.01, 0.02]} />
        <meshStandardMaterial
          color="#00ffff"
          roughness={0.3}
          metalness={0.8}
          emissive="#00ffff"
          emissiveIntensity={0.3}
        />
      </mesh>

      {children}
    </group>
  )
}

// ============================================================================
// Variants
// ============================================================================

export interface SimpleControlPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  color?: string
  castShadow?: boolean
  receiveShadow?: boolean
}

/**
 * SimpleControlPanel - Simplified control panel for performance
 *
 * Uses a single angled box without detailed controls.
 * Good for distant views or lower detail requirements.
 */
export function SimpleControlPanel({
  position,
  rotation,
  scale = 1,
  color = CABINET_COLORS.controlPanel,
  castShadow = true,
  receiveShadow = true,
}: SimpleControlPanelProps) {
  const { width, depth, angle, thickness } = CABINET_CONTROLS
  const angleRad = -(angle * Math.PI) / 180

  const defaultPosition: [number, number, number] = [
    MESH_POSITIONS.controlPanel.x,
    MESH_POSITIONS.controlPanel.y,
    MESH_POSITIONS.controlPanel.z,
  ]

  return (
    <RoundedBox
      name={MESH_NAMES.controls.surface}
      position={position ?? defaultPosition}
      rotation={rotation ?? [angleRad, 0, 0]}
      scale={scale}
      args={[width, thickness, depth]}
      radius={BEVEL_RADIUS}
      smoothness={4}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <meshStandardMaterial
        color={color}
        roughness={DEFAULT_ROUGHNESS}
        metalness={DEFAULT_METALNESS}
      />
    </RoundedBox>
  )
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseControlPanelOptions {
  initialDirection?: { x: number; y: number }
}

export interface UseControlPanelResult {
  /** Ref to attach to the ControlPanel */
  ref: React.RefObject<THREE.Group>
  /** Current joystick direction */
  joystickDirection: { x: number; y: number }
  /** Set joystick direction (-1 to 1 for x and y) */
  setJoystickDirection: (direction: { x: number; y: number }) => void
  /** Reset joystick to center */
  resetJoystick: () => void
  /** Button pressed states */
  buttonStates: boolean[]
  /** Press a button by index */
  pressButton: (index: number) => void
  /** Release a button by index */
  releaseButton: (index: number) => void
  /** Get panel dimensions */
  getDimensions: () => typeof CABINET_CONTROLS
  /** Get panel position */
  getPosition: () => typeof MESH_POSITIONS.controlPanel
}

/**
 * useControlPanel - Hook for controlling the control panel
 */
export function useControlPanel(
  _options: UseControlPanelOptions = {}
): UseControlPanelResult {
  const ref = useRef<THREE.Group>(null)
  const joystickDirection = useRef({ x: 0, y: 0 })
  const buttonStates = useRef<boolean[]>(new Array(8).fill(false)) // 6 action + start + coin

  const setJoystickDirection = (direction: { x: number; y: number }) => {
    joystickDirection.current = {
      x: Math.max(-1, Math.min(1, direction.x)),
      y: Math.max(-1, Math.min(1, direction.y)),
    }
  }

  const resetJoystick = () => {
    joystickDirection.current = { x: 0, y: 0 }
  }

  const pressButton = (index: number) => {
    if (index >= 0 && index < buttonStates.current.length) {
      buttonStates.current[index] = true
    }
  }

  const releaseButton = (index: number) => {
    if (index >= 0 && index < buttonStates.current.length) {
      buttonStates.current[index] = false
    }
  }

  const getDimensions = () => CABINET_CONTROLS
  const getPosition = () => MESH_POSITIONS.controlPanel

  return {
    ref,
    joystickDirection: joystickDirection.current,
    setJoystickDirection,
    resetJoystick,
    buttonStates: buttonStates.current,
    pressButton,
    releaseButton,
    getDimensions,
    getPosition,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ControlPanel
