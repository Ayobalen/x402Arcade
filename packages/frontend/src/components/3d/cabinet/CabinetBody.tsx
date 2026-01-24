/**
 * CabinetBody - Main arcade cabinet body mesh component
 *
 * Creates the primary cabinet body structure using Three.js geometries
 * with proper dimensions, materials, and beveled edges for realism.
 *
 * @module 3d/cabinet/CabinetBody
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox } from '@react-three/drei'
import {
  CABINET_BODY,
  CABINET_COLORS,
  MESH_NAMES,
  MESH_POSITIONS,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface CabinetBodyProps {
  /** Position offset for the entire cabinet body [x, y, z] */
  position?: [number, number, number]
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Override body color */
  bodyColor?: string
  /** Override panel color (sides, back) */
  panelColor?: string
  /** Material roughness (0-1) */
  roughness?: number
  /** Material metalness (0-1) */
  metalness?: number
  /** Enable subtle ambient animation */
  animated?: boolean
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Render wireframe instead of solid */
  wireframe?: boolean
  /** Children components (screen, controls, etc.) */
  children?: React.ReactNode
  /** Called when mesh is ready */
  onReady?: (group: THREE.Group) => void
}

export interface CabinetBodyHandle {
  group: THREE.Group | null
  setColor: (color: string) => void
  pulse: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUGHNESS = 0.7
const DEFAULT_METALNESS = 0.1

// Bevel radius for rounded edges (proportion of corner radius)
const BEVEL_RADIUS = CABINET_BODY.cornerRadius

// ============================================================================
// Materials
// ============================================================================

/**
 * Create cabinet body material with subtle sheen
 */
function useCabinetMaterial(
  color: string,
  roughness: number,
  metalness: number,
  wireframe: boolean
) {
  return useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      wireframe,
      side: THREE.FrontSide,
    })
    return material
  }, [color, roughness, metalness, wireframe])
}

// ============================================================================
// Sub-components
// ============================================================================

interface BodyPanelProps {
  position: [number, number, number]
  args: [number, number, number]
  rotation?: [number, number, number]
  material: THREE.Material
  castShadow: boolean
  receiveShadow: boolean
  name: string
}

/**
 * Individual panel of the cabinet body with rounded edges
 */
function BodyPanel({
  position,
  args,
  rotation,
  material,
  castShadow,
  receiveShadow,
  name,
}: BodyPanelProps) {
  return (
    <RoundedBox
      name={name}
      position={position}
      rotation={rotation}
      args={args}
      radius={BEVEL_RADIUS}
      smoothness={4}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <primitive object={material} attach="material" />
    </RoundedBox>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetBody - The main cabinet body mesh
 *
 * This component creates the primary cabinet structure consisting of:
 * - Main vertical body box
 * - Side panels (left and right)
 * - Back panel
 * - Bottom panel
 *
 * All panels use rounded edges for a realistic arcade cabinet appearance.
 *
 * @example
 * ```tsx
 * <CabinetBody
 *   position={[0, 0, 0]}
 *   bodyColor="#0a0a0f"
 *   castShadow
 *   receiveShadow
 * >
 *   <CabinetScreen />
 *   <CabinetControls />
 * </CabinetBody>
 * ```
 */
export function CabinetBody({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  bodyColor = CABINET_COLORS.body,
  panelColor,
  roughness = DEFAULT_ROUGHNESS,
  metalness = DEFAULT_METALNESS,
  animated = false,
  castShadow = true,
  receiveShadow = true,
  wireframe = false,
  children,
  onReady,
}: CabinetBodyProps) {
  const groupRef = useRef<THREE.Group>(null)
  const animationPhase = useRef(0)

  // Create materials
  const bodyMaterial = useCabinetMaterial(bodyColor, roughness, metalness, wireframe)
  const sideMaterial = useCabinetMaterial(
    panelColor ?? bodyColor,
    roughness + 0.05,
    metalness,
    wireframe
  )

  // Dimensions
  const { width, depth, bodyHeight, wallThickness } = CABINET_BODY

  // Animation for subtle breathing effect
  useFrame((_, delta) => {
    if (animated && groupRef.current) {
      animationPhase.current += delta * 0.5
      const breathe = 1 + Math.sin(animationPhase.current) * 0.002
      groupRef.current.scale.setScalar(scale * breathe)
    }
  })

  // Notify parent when ready
  useMemo(() => {
    if (groupRef.current && onReady) {
      onReady(groupRef.current)
    }
  }, [onReady])

  return (
    <group
      ref={groupRef}
      name={MESH_NAMES.body.group}
      position={position}
      rotation={rotation}
      scale={animated ? scale : [scale, scale, scale]}
    >
      {/* Main Body - Central vertical section */}
      <BodyPanel
        name={MESH_NAMES.body.main}
        position={[0, bodyHeight / 2, 0]}
        args={[width, bodyHeight, depth]}
        material={bodyMaterial}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />

      {/* Left Side Panel */}
      <BodyPanel
        name={MESH_NAMES.body.left}
        position={[
          -width / 2 + wallThickness / 2,
          bodyHeight / 2,
          0,
        ]}
        args={[wallThickness, bodyHeight, depth]}
        material={sideMaterial}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />

      {/* Right Side Panel */}
      <BodyPanel
        name={MESH_NAMES.body.right}
        position={[
          width / 2 - wallThickness / 2,
          bodyHeight / 2,
          0,
        ]}
        args={[wallThickness, bodyHeight, depth]}
        material={sideMaterial}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />

      {/* Back Panel */}
      <BodyPanel
        name={MESH_NAMES.body.back}
        position={[
          0,
          bodyHeight / 2,
          -depth / 2 + wallThickness / 2,
        ]}
        args={[width - wallThickness * 2, bodyHeight, wallThickness]}
        material={sideMaterial}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      />

      {/* Bottom Panel */}
      <BodyPanel
        name={MESH_NAMES.body.bottom}
        position={[
          0,
          wallThickness / 2,
          0,
        ]}
        args={[width - wallThickness * 2, wallThickness, depth - wallThickness * 2]}
        material={sideMaterial}
        castShadow={false}
        receiveShadow={receiveShadow}
      />

      {/* Interior for depth effect (darker) */}
      <mesh
        position={[0, bodyHeight / 2, 0]}
        castShadow={false}
        receiveShadow={false}
      >
        <boxGeometry args={[
          width - wallThickness * 2,
          bodyHeight - wallThickness * 2,
          depth - wallThickness * 2,
        ]} />
        <meshStandardMaterial
          color="#000000"
          roughness={1}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Children (screen, controls, marquee, etc.) */}
      {children}
    </group>
  )
}

// ============================================================================
// Variants
// ============================================================================

export interface SimpleCabinetBodyProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  color?: string
  castShadow?: boolean
  receiveShadow?: boolean
}

/**
 * SimpleCabinetBody - A simpler cabinet body for performance
 *
 * Uses a single box geometry instead of multiple panels.
 * Good for distant cabinets or lower detail requirements.
 */
export function SimpleCabinetBody({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = CABINET_COLORS.body,
  castShadow = true,
  receiveShadow = true,
}: SimpleCabinetBodyProps) {
  const { width, depth, bodyHeight } = CABINET_BODY

  return (
    <RoundedBox
      name={MESH_NAMES.body.main}
      position={[position[0], position[1] + bodyHeight / 2, position[2]]}
      rotation={rotation}
      scale={scale}
      args={[width, bodyHeight, depth]}
      radius={BEVEL_RADIUS * 2}
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

export interface UseCabinetBodyOptions {
  color?: string
  scale?: number
}

export interface UseCabinetBodyResult {
  /** Ref to attach to the CabinetBody */
  ref: React.RefObject<THREE.Group>
  /** Set cabinet body color dynamically */
  setColor: (color: string) => void
  /** Get current body dimensions */
  getDimensions: () => typeof CABINET_BODY
  /** Get body position */
  getPosition: () => typeof MESH_POSITIONS.body
}

/**
 * useCabinetBody - Hook for controlling cabinet body
 */
export function useCabinetBody(_options: UseCabinetBodyOptions = {}): UseCabinetBodyResult {
  const ref = useRef<THREE.Group>(null)

  const setColor = (color: string) => {
    if (ref.current) {
      ref.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.color.set(color)
        }
      })
    }
  }

  const getDimensions = () => CABINET_BODY
  const getPosition = () => MESH_POSITIONS.body

  return {
    ref,
    setColor,
    getDimensions,
    getPosition,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default CabinetBody
