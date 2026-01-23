/**
 * ArcadeButton - 3D arcade button component
 *
 * Creates a realistic arcade button 3D model with cylindrical shape,
 * concave top surface, and press animation capability. Supports
 * different colors and can be arranged in grid layouts.
 *
 * @module 3d/cabinet/ArcadeButton
 */

import { useRef, forwardRef, useImperativeHandle, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CABINET_CONTROLS, CABINET_COLORS } from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface ArcadeButtonProps {
  /** Position of the button [x, y, z] */
  position?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Button color (cap color) */
  color?: string
  /** Base/housing color */
  baseColor?: string
  /** Rim color */
  rimColor?: string
  /** Button radius override */
  radius?: number
  /** Whether the button is currently pressed */
  pressed?: boolean
  /** Enable glow effect */
  glowEnabled?: boolean
  /** Emissive intensity when not pressed (0-1) */
  idleGlowIntensity?: number
  /** Emissive intensity when pressed (0-1) */
  pressedGlowIntensity?: number
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Material roughness for button cap (0-1) */
  capRoughness?: number
  /** Material metalness for button cap (0-1) */
  capMetalness?: number
  /** Enable idle wobble animation */
  animated?: boolean
  /** Called when button is ready */
  onReady?: (group: THREE.Group) => void
  /** Called when button is pressed (via click) */
  onPress?: () => void
  /** Called when button is released (via click up) */
  onRelease?: () => void
}

export interface ArcadeButtonHandle {
  /** Reference to the root group */
  group: THREE.Group | null
  /** Reference to the button cap mesh */
  cap: THREE.Mesh | null
  /** Press the button programmatically */
  press: () => void
  /** Release the button programmatically */
  release: () => void
  /** Toggle pressed state */
  toggle: () => void
  /** Check if button is pressed */
  isPressed: () => boolean
  /** Set button color */
  setColor: (color: string) => void
  /** Set glow intensity */
  setGlowIntensity: (intensity: number) => void
}

// ============================================================================
// Constants
// ============================================================================

// Button dimensions (based on CABINET_CONTROLS.buttonRadius)
const DEFAULT_RADIUS = CABINET_CONTROLS.buttonRadius
const BUTTON_HEIGHT = 0.025 // Total height of button cap
const BUTTON_RECESS = 0.008 // Depth of concave top
const RIM_HEIGHT = 0.01 // Height of outer rim/housing
const RIM_THICKNESS = 0.008 // How much wider the rim is than button
const BASE_HEIGHT = 0.008 // Height of button base/housing

// Press animation
const PRESS_DEPTH = 0.012 // How far button travels when pressed
const PRESS_SPEED = 15 // Animation speed multiplier

// Default colors
const DEFAULT_BASE_COLOR = '#111111'
const DEFAULT_RIM_COLOR = '#1a1a1a'

// Default glow settings
const DEFAULT_IDLE_GLOW = 0.15
const DEFAULT_PRESSED_GLOW = 0.6

// ============================================================================
// Geometry Creation Helpers
// ============================================================================

/**
 * Create a concave button cap geometry
 * Uses LatheGeometry to create a smooth concave top surface
 */
function createConcaveCapGeometry(
  radius: number,
  height: number,
  recessDepth: number,
  segments: number = 32
): THREE.LatheGeometry {
  // Create profile points for lathe geometry
  // Profile: flat bottom -> outer edge -> concave curve -> center
  const points: THREE.Vector2[] = []

  // Start at center bottom
  points.push(new THREE.Vector2(0, 0))

  // Bottom edge (flat)
  points.push(new THREE.Vector2(radius, 0))

  // Outer edge going up
  points.push(new THREE.Vector2(radius, height - recessDepth))

  // Create concave curve using bezier-like points
  const curveSegments = 8
  for (let i = 0; i <= curveSegments; i++) {
    const t = i / curveSegments
    // Quadratic curve from outer edge to center
    const x = radius * (1 - t)
    // Curve profile: higher at edges, lower in center
    const curveY = height - recessDepth + recessDepth * Math.cos(t * Math.PI / 2)
    points.push(new THREE.Vector2(x, curveY))
  }

  return new THREE.LatheGeometry(points, segments)
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ButtonBaseProps {
  radius: number
  baseColor: string
  rimColor: string
  castShadow: boolean
  receiveShadow: boolean
}

/**
 * ButtonBase - The housing/mounting plate for the button
 */
function ButtonBase({
  radius,
  baseColor,
  rimColor,
  castShadow,
  receiveShadow,
}: ButtonBaseProps) {
  const outerRadius = radius + RIM_THICKNESS

  return (
    <group name="ButtonBase">
      {/* Outer base plate (mounting surface) */}
      <mesh
        position={[0, BASE_HEIGHT / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[outerRadius * 1.2, outerRadius * 1.3, BASE_HEIGHT, 24]} />
        <meshStandardMaterial
          color={baseColor}
          roughness={0.6}
          metalness={0.7}
        />
      </mesh>

      {/* Inner rim (raised edge around button hole) */}
      <mesh
        position={[0, BASE_HEIGHT + RIM_HEIGHT / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <cylinderGeometry args={[outerRadius, outerRadius, RIM_HEIGHT, 24]} />
        <meshStandardMaterial
          color={rimColor}
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>
    </group>
  )
}

interface ButtonCapProps {
  radius: number
  color: string
  roughness: number
  metalness: number
  glowEnabled: boolean
  glowIntensity: number
  castShadow: boolean
}

/**
 * ButtonCap - The pressable button cap with concave top
 */
const ButtonCap = forwardRef<THREE.Mesh, ButtonCapProps>(function ButtonCap(
  {
    radius,
    color,
    roughness,
    metalness,
    glowEnabled,
    glowIntensity,
    castShadow,
  },
  ref
) {
  // Create concave geometry
  const geometry = useMemo(
    () => createConcaveCapGeometry(radius, BUTTON_HEIGHT, BUTTON_RECESS),
    [radius]
  )

  return (
    <mesh
      ref={ref}
      geometry={geometry}
      castShadow={castShadow}
      rotation={[0, 0, 0]}
    >
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        emissive={glowEnabled ? color : '#000000'}
        emissiveIntensity={glowIntensity}
      />
    </mesh>
  )
})

// ============================================================================
// Main Component
// ============================================================================

/**
 * ArcadeButton - Arcade button 3D component
 *
 * A realistic arcade button with concave cap, housing, and press animation.
 * Supports different colors, glow effects, and interactive press states.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <ArcadeButton position={[0, 0, 0]} color="#ff0000" />
 *
 * // With press state
 * <ArcadeButton
 *   color="#00ff00"
 *   pressed={isButtonPressed}
 *   glowEnabled
 *   pressedGlowIntensity={0.8}
 * />
 *
 * // Interactive button
 * <ArcadeButton
 *   color="#0088ff"
 *   onPress={() => console.log('pressed!')}
 *   onRelease={() => console.log('released!')}
 * />
 * ```
 */
export const ArcadeButton = forwardRef<ArcadeButtonHandle, ArcadeButtonProps>(
  function ArcadeButton(
    {
      position = [0, 0, 0],
      scale = 1,
      color = CABINET_COLORS.buttons[0],
      baseColor = DEFAULT_BASE_COLOR,
      rimColor = DEFAULT_RIM_COLOR,
      radius = DEFAULT_RADIUS,
      pressed = false,
      glowEnabled = true,
      idleGlowIntensity = DEFAULT_IDLE_GLOW,
      pressedGlowIntensity = DEFAULT_PRESSED_GLOW,
      castShadow = true,
      receiveShadow = true,
      capRoughness = 0.35,
      capMetalness = 0.15,
      animated = false,
      onReady,
      onPress,
      onRelease,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const capRef = useRef<THREE.Mesh>(null)
    const capGroupRef = useRef<THREE.Group>(null)

    // Animation state
    const currentY = useRef(0)
    const targetY = useRef(0)
    const internalPressed = useRef(pressed)
    const currentGlow = useRef(idleGlowIntensity)
    const animationPhase = useRef(0)

    // Calculate cap starting position (above base and rim)
    const capBaseY = BASE_HEIGHT + RIM_HEIGHT

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        cap: capRef.current,
        press: () => {
          internalPressed.current = true
          targetY.current = -PRESS_DEPTH
          onPress?.()
        },
        release: () => {
          internalPressed.current = false
          targetY.current = 0
          onRelease?.()
        },
        toggle: () => {
          if (internalPressed.current) {
            internalPressed.current = false
            targetY.current = 0
            onRelease?.()
          } else {
            internalPressed.current = true
            targetY.current = -PRESS_DEPTH
            onPress?.()
          }
        },
        isPressed: () => internalPressed.current,
        setColor: (newColor: string) => {
          if (capRef.current) {
            const material = capRef.current.material as THREE.MeshStandardMaterial
            material.color.set(newColor)
            if (glowEnabled) {
              material.emissive.set(newColor)
            }
          }
        },
        setGlowIntensity: (intensity: number) => {
          if (capRef.current) {
            const material = capRef.current.material as THREE.MeshStandardMaterial
            material.emissiveIntensity = intensity
          }
        },
      }),
      [glowEnabled, onPress, onRelease]
    )

    // Animation frame
    useFrame((_state, delta) => {
      if (!capGroupRef.current || !capRef.current) return

      // Update target based on pressed prop
      targetY.current = pressed || internalPressed.current ? -PRESS_DEPTH : 0

      // Smooth lerp to target position
      currentY.current += (targetY.current - currentY.current) * delta * PRESS_SPEED
      capGroupRef.current.position.y = capBaseY + currentY.current

      // Update glow intensity
      const targetGlow = pressed || internalPressed.current
        ? pressedGlowIntensity
        : idleGlowIntensity
      currentGlow.current += (targetGlow - currentGlow.current) * delta * PRESS_SPEED

      const material = capRef.current.material as THREE.MeshStandardMaterial
      if (glowEnabled) {
        material.emissiveIntensity = currentGlow.current
      }

      // Idle animation (subtle pulse when not pressed and animated)
      if (animated && !pressed && !internalPressed.current) {
        animationPhase.current += delta * 2
        const pulse = Math.sin(animationPhase.current) * 0.02 + 1
        if (capGroupRef.current) {
          capGroupRef.current.scale.setScalar(pulse)
        }
      } else if (capGroupRef.current) {
        // Reset scale when not animating
        capGroupRef.current.scale.setScalar(1)
      }
    })

    // Notify parent when ready
    if (groupRef.current && onReady) {
      queueMicrotask(() => {
        if (groupRef.current) {
          onReady(groupRef.current)
        }
      })
    }

    // Click handlers
    const handlePointerDown = () => {
      internalPressed.current = true
      targetY.current = -PRESS_DEPTH
      onPress?.()
    }

    const handlePointerUp = () => {
      internalPressed.current = false
      targetY.current = 0
      onRelease?.()
    }

    return (
      <group
        ref={groupRef}
        name="ArcadeButton"
        position={position}
        scale={scale}
      >
        {/* Button base/housing */}
        <ButtonBase
          radius={radius}
          baseColor={baseColor}
          rimColor={rimColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />

        {/* Button cap group (animates position) */}
        <group
          ref={capGroupRef}
          position={[0, capBaseY, 0]}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <ButtonCap
            ref={capRef}
            radius={radius}
            color={color}
            roughness={capRoughness}
            metalness={capMetalness}
            glowEnabled={glowEnabled}
            glowIntensity={currentGlow.current}
            castShadow={castShadow}
          />
        </group>
      </group>
    )
  }
)

// ============================================================================
// Button Grid Layout Component
// ============================================================================

export interface ButtonGridProps {
  /** Position of the grid [x, y, z] */
  position?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Array of button colors (defaults to CABINET_COLORS.buttons) */
  colors?: string[]
  /** Button pressed states (array of booleans) */
  pressedStates?: boolean[]
  /** Number of columns */
  columns?: number
  /** Horizontal spacing between buttons */
  horizontalSpacing?: number
  /** Vertical spacing between buttons */
  verticalSpacing?: number
  /** Row offset (stagger rows) */
  rowOffset?: number
  /** Enable glow on buttons */
  glowEnabled?: boolean
  /** Called when a button is pressed (index) */
  onButtonPress?: (index: number) => void
  /** Called when a button is released (index) */
  onButtonRelease?: (index: number) => void
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
}

export interface ButtonGridHandle {
  /** Press a button by index */
  pressButton: (index: number) => void
  /** Release a button by index */
  releaseButton: (index: number) => void
  /** Get all button refs */
  getButtons: () => (ArcadeButtonHandle | null)[]
  /** Set color for a specific button */
  setButtonColor: (index: number, color: string) => void
}

/**
 * ButtonGrid - Arcade button grid layout component
 *
 * Arranges multiple arcade buttons in a grid layout, commonly used
 * for the 6-button action button layout on arcade cabinets.
 *
 * @example
 * ```tsx
 * // Standard 6-button layout (2 rows x 3 columns)
 * <ButtonGrid
 *   columns={3}
 *   colors={['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#ff00ff']}
 *   onButtonPress={(i) => console.log(`Button ${i} pressed`)}
 * />
 *
 * // Custom layout
 * <ButtonGrid
 *   columns={2}
 *   horizontalSpacing={0.12}
 *   verticalSpacing={0.1}
 *   colors={['#ff0000', '#00ff00', '#0088ff', '#ff00ff']}
 * />
 * ```
 */
export const ButtonGrid = forwardRef<ButtonGridHandle, ButtonGridProps>(
  function ButtonGrid(
    {
      position = [0, 0, 0],
      scale = 1,
      colors = CABINET_COLORS.buttons,
      pressedStates,
      columns = 3,
      horizontalSpacing = 0.1,
      verticalSpacing = 0.08,
      rowOffset = 0,
      glowEnabled = true,
      onButtonPress,
      onButtonRelease,
      castShadow = true,
      receiveShadow = true,
    },
    ref
  ) {
    const buttonRefs = useRef<(ArcadeButtonHandle | null)[]>([])

    // Calculate button positions
    const buttonPositions = useMemo(() => {
      const positions: [number, number, number][] = []
      const numButtons = colors.length
      const rows = Math.ceil(numButtons / columns)

      for (let i = 0; i < numButtons; i++) {
        const col = i % columns
        const row = Math.floor(i / columns)

        // Center the grid
        const gridWidth = (columns - 1) * horizontalSpacing
        const gridHeight = (rows - 1) * verticalSpacing

        const x = col * horizontalSpacing - gridWidth / 2 + (row * rowOffset)
        const y = 0 // Buttons sit on the control panel surface
        const z = -(row * verticalSpacing - gridHeight / 2)

        positions.push([x, y, z])
      }

      return positions
    }, [colors.length, columns, horizontalSpacing, verticalSpacing, rowOffset])

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        pressButton: (index: number) => {
          buttonRefs.current[index]?.press()
        },
        releaseButton: (index: number) => {
          buttonRefs.current[index]?.release()
        },
        getButtons: () => buttonRefs.current,
        setButtonColor: (index: number, color: string) => {
          buttonRefs.current[index]?.setColor(color)
        },
      }),
      []
    )

    return (
      <group
        name="ButtonGrid"
        position={position}
        scale={scale}
      >
        {colors.map((color, index) => (
          <ArcadeButton
            key={`button-${index}`}
            ref={(el) => { buttonRefs.current[index] = el }}
            position={buttonPositions[index]}
            color={color}
            pressed={pressedStates?.[index] ?? false}
            glowEnabled={glowEnabled}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
            onPress={() => onButtonPress?.(index)}
            onRelease={() => onButtonRelease?.(index)}
          />
        ))}
      </group>
    )
  }
)

// ============================================================================
// Hook for Button Control
// ============================================================================

export interface UseArcadeButtonOptions {
  /** Initial pressed state */
  initialPressed?: boolean
  /** Callback when pressed */
  onPress?: () => void
  /** Callback when released */
  onRelease?: () => void
}

export interface UseArcadeButtonResult {
  /** Ref to attach to the ArcadeButton component */
  ref: React.RefObject<ArcadeButtonHandle>
  /** Current pressed state */
  pressed: boolean
  /** Press the button */
  press: () => void
  /** Release the button */
  release: () => void
  /** Toggle pressed state */
  toggle: () => void
}

/**
 * useArcadeButton - Hook for controlling button state
 *
 * @example
 * ```tsx
 * function GameController() {
 *   const button = useArcadeButton({
 *     onPress: () => console.log('Fire!'),
 *   })
 *
 *   useEffect(() => {
 *     const handleKeyDown = (e: KeyboardEvent) => {
 *       if (e.key === ' ') button.press()
 *     }
 *     const handleKeyUp = (e: KeyboardEvent) => {
 *       if (e.key === ' ') button.release()
 *     }
 *     window.addEventListener('keydown', handleKeyDown)
 *     window.addEventListener('keyup', handleKeyUp)
 *     return () => {
 *       window.removeEventListener('keydown', handleKeyDown)
 *       window.removeEventListener('keyup', handleKeyUp)
 *     }
 *   }, [])
 *
 *   return <ArcadeButton ref={button.ref} pressed={button.pressed} />
 * }
 * ```
 */
export function useArcadeButton(
  options: UseArcadeButtonOptions = {}
): UseArcadeButtonResult {
  const { initialPressed = false, onPress, onRelease } = options
  const ref = useRef<ArcadeButtonHandle>(null)
  const pressed = useRef(initialPressed)

  const press = () => {
    pressed.current = true
    ref.current?.press()
    onPress?.()
  }

  const release = () => {
    pressed.current = false
    ref.current?.release()
    onRelease?.()
  }

  const toggle = () => {
    if (pressed.current) {
      release()
    } else {
      press()
    }
  }

  return {
    ref,
    pressed: pressed.current,
    press,
    release,
    toggle,
  }
}

// ============================================================================
// Hook for Multiple Button Control
// ============================================================================

export interface UseButtonGridOptions {
  /** Number of buttons */
  count?: number
  /** Callback when any button is pressed */
  onButtonPress?: (index: number) => void
  /** Callback when any button is released */
  onButtonRelease?: (index: number) => void
}

export interface UseButtonGridResult {
  /** Ref to attach to the ButtonGrid component */
  ref: React.RefObject<ButtonGridHandle>
  /** Array of pressed states */
  pressedStates: boolean[]
  /** Press a button by index */
  pressButton: (index: number) => void
  /** Release a button by index */
  releaseButton: (index: number) => void
  /** Toggle a button by index */
  toggleButton: (index: number) => void
  /** Release all buttons */
  releaseAll: () => void
  /** Check if a button is pressed */
  isPressed: (index: number) => boolean
}

/**
 * useButtonGrid - Hook for controlling multiple buttons
 *
 * @example
 * ```tsx
 * function ArcadeControls() {
 *   const buttons = useButtonGrid({
 *     count: 6,
 *     onButtonPress: (i) => handleAction(i),
 *   })
 *
 *   return (
 *     <ButtonGrid
 *       ref={buttons.ref}
 *       pressedStates={buttons.pressedStates}
 *       onButtonPress={buttons.pressButton}
 *       onButtonRelease={buttons.releaseButton}
 *     />
 *   )
 * }
 * ```
 */
export function useButtonGrid(
  options: UseButtonGridOptions = {}
): UseButtonGridResult {
  const { count = 6, onButtonPress, onButtonRelease } = options
  const ref = useRef<ButtonGridHandle>(null)
  const pressedStates = useRef<boolean[]>(new Array(count).fill(false))

  const pressButton = (index: number) => {
    if (index >= 0 && index < count) {
      pressedStates.current[index] = true
      ref.current?.pressButton(index)
      onButtonPress?.(index)
    }
  }

  const releaseButton = (index: number) => {
    if (index >= 0 && index < count) {
      pressedStates.current[index] = false
      ref.current?.releaseButton(index)
      onButtonRelease?.(index)
    }
  }

  const toggleButton = (index: number) => {
    if (pressedStates.current[index]) {
      releaseButton(index)
    } else {
      pressButton(index)
    }
  }

  const releaseAll = () => {
    for (let i = 0; i < count; i++) {
      releaseButton(i)
    }
  }

  const isPressed = (index: number) => {
    return pressedStates.current[index] ?? false
  }

  return {
    ref,
    pressedStates: pressedStates.current,
    pressButton,
    releaseButton,
    toggleButton,
    releaseAll,
    isPressed,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ArcadeButton
