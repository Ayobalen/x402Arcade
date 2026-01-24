/**
 * ScreenBezel - Screen bezel frame mesh component
 *
 * Creates the bezel frame that surrounds the game screen with
 * appropriate shape, materials, and edge highlights for a realistic
 * arcade cabinet appearance.
 *
 * @module 3d/cabinet/ScreenBezel
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  CABINET_SCREEN,
  CABINET_COLORS,
  MESH_NAMES,
  MESH_POSITIONS,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface ScreenBezelProps {
  /** Position offset for the bezel [x, y, z] */
  position?: [number, number, number]
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Override bezel color */
  bezelColor?: string
  /** Override edge highlight color */
  edgeColor?: string
  /** Material roughness (0-1) */
  roughness?: number
  /** Material metalness (0-1) */
  metalness?: number
  /** Enable edge glow effect */
  enableGlow?: boolean
  /** Glow color for edge highlights */
  glowColor?: string
  /** Glow intensity (0-1) */
  glowIntensity?: number
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Render wireframe instead of solid */
  wireframe?: boolean
  /** Screen width (inner dimension) */
  screenWidth?: number
  /** Screen height (inner dimension) */
  screenHeight?: number
  /** Bezel frame width */
  bezelWidth?: number
  /** Bezel depth (thickness) */
  bezelDepth?: number
  /** Children components (screen display, etc.) */
  children?: React.ReactNode
  /** Called when mesh is ready */
  onReady?: (group: THREE.Group) => void
}

export interface ScreenBezelHandle {
  group: THREE.Group | null
  setGlowIntensity: (intensity: number) => void
  pulse: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUGHNESS = 0.3
const DEFAULT_METALNESS = 0.8
const DEFAULT_GLOW_INTENSITY = 0.3

/** Corner bevel radius for smooth edges */
const CORNER_BEVEL = 0.02

/** Inner edge chamfer depth */
const INNER_CHAMFER = 0.015

// ============================================================================
// Geometry Utilities
// ============================================================================

/**
 * Create the bezel frame shape with a rectangular hole for the screen
 */
function createBezelShape(
  outerWidth: number,
  outerHeight: number,
  innerWidth: number,
  innerHeight: number,
  cornerRadius: number = CORNER_BEVEL
): THREE.Shape {
  const shape = new THREE.Shape()

  // Outer rectangle with rounded corners
  const halfOuterW = outerWidth / 2
  const halfOuterH = outerHeight / 2
  const r = Math.min(cornerRadius, halfOuterW * 0.1, halfOuterH * 0.1)

  // Start at top-left corner after radius
  shape.moveTo(-halfOuterW + r, halfOuterH)

  // Top edge
  shape.lineTo(halfOuterW - r, halfOuterH)
  shape.quadraticCurveTo(halfOuterW, halfOuterH, halfOuterW, halfOuterH - r)

  // Right edge
  shape.lineTo(halfOuterW, -halfOuterH + r)
  shape.quadraticCurveTo(halfOuterW, -halfOuterH, halfOuterW - r, -halfOuterH)

  // Bottom edge
  shape.lineTo(-halfOuterW + r, -halfOuterH)
  shape.quadraticCurveTo(-halfOuterW, -halfOuterH, -halfOuterW, -halfOuterH + r)

  // Left edge
  shape.lineTo(-halfOuterW, halfOuterH - r)
  shape.quadraticCurveTo(-halfOuterW, halfOuterH, -halfOuterW + r, halfOuterH)

  // Create inner hole (screen cutout)
  const holePath = new THREE.Path()
  const halfInnerW = innerWidth / 2
  const halfInnerH = innerHeight / 2
  const innerR = Math.min(cornerRadius * 0.5, halfInnerW * 0.05, halfInnerH * 0.05)

  // Inner rectangle (counter-clockwise for hole)
  holePath.moveTo(-halfInnerW + innerR, halfInnerH)
  holePath.lineTo(-halfInnerW, halfInnerH - innerR)
  holePath.lineTo(-halfInnerW, -halfInnerH + innerR)
  holePath.quadraticCurveTo(-halfInnerW, -halfInnerH, -halfInnerW + innerR, -halfInnerH)
  holePath.lineTo(halfInnerW - innerR, -halfInnerH)
  holePath.quadraticCurveTo(halfInnerW, -halfInnerH, halfInnerW, -halfInnerH + innerR)
  holePath.lineTo(halfInnerW, halfInnerH - innerR)
  holePath.quadraticCurveTo(halfInnerW, halfInnerH, halfInnerW - innerR, halfInnerH)
  holePath.lineTo(-halfInnerW + innerR, halfInnerH)

  shape.holes.push(holePath)

  return shape
}

/**
 * Create extrude settings for the bezel geometry
 */
function createExtrudeSettings(depth: number): THREE.ExtrudeGeometryOptions {
  return {
    steps: 1,
    depth,
    bevelEnabled: true,
    bevelThickness: INNER_CHAMFER,
    bevelSize: INNER_CHAMFER,
    bevelSegments: 2,
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface EdgeHighlightProps {
  width: number
  height: number
  color: string
  emissive: string
  emissiveIntensity: number
  position: [number, number, number]
  thickness: number
}

/**
 * Edge highlight strips that run along the bezel inner edge
 */
function EdgeHighlight({
  width,
  height,
  color,
  emissive,
  emissiveIntensity,
  position,
  thickness,
}: EdgeHighlightProps) {
  return (
    <group position={position}>
      {/* Top edge */}
      <mesh position={[0, height / 2 + thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Bottom edge */}
      <mesh position={[0, -height / 2 - thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Left edge */}
      <mesh position={[-width / 2 - thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Right edge */}
      <mesh position={[width / 2 + thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height, thickness]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          metalness={0.9}
          roughness={0.2}
        />
      </mesh>

      {/* Corner accents (4 corners) */}
      {[
        [-width / 2 - thickness / 2, height / 2 + thickness / 2, 0] as const,
        [width / 2 + thickness / 2, height / 2 + thickness / 2, 0] as const,
        [-width / 2 - thickness / 2, -height / 2 - thickness / 2, 0] as const,
        [width / 2 + thickness / 2, -height / 2 - thickness / 2, 0] as const,
      ].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[thickness * 1.5, thickness * 1.5, thickness * 1.2]} />
          <meshStandardMaterial
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity * 1.2}
            metalness={0.95}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ScreenBezel - The screen bezel frame mesh
 *
 * This component creates the frame that surrounds the game screen:
 * - Extruded shape with rectangular hole for screen
 * - Dark metallic material with edge highlights
 * - Optional glow effect on inner edges
 * - Proper positioning relative to cabinet body
 *
 * @example
 * ```tsx
 * <ScreenBezel
 *   position={[0, 3.6, 0.8]}
 *   bezelColor="#050508"
 *   enableGlow
 *   glowColor="#00ffff"
 *   glowIntensity={0.4}
 * >
 *   <ScreenDisplay />
 * </ScreenBezel>
 * ```
 */
export function ScreenBezel({
  position,
  rotation,
  scale = 1,
  bezelColor = CABINET_COLORS.bezel,
  edgeColor = '#1a1a2e',
  roughness = DEFAULT_ROUGHNESS,
  metalness = DEFAULT_METALNESS,
  enableGlow = true,
  glowColor = '#00ffff',
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  castShadow = true,
  receiveShadow = true,
  wireframe = false,
  screenWidth = CABINET_SCREEN.screenWidth,
  screenHeight = CABINET_SCREEN.screenHeight,
  bezelWidth = CABINET_SCREEN.bezelWidth,
  bezelDepth = CABINET_SCREEN.screenRecess,
  children,
  onReady,
}: ScreenBezelProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowRef = useRef(glowIntensity)
  const pulseRef = useRef(0)

  // Calculate dimensions
  const outerWidth = screenWidth + bezelWidth * 2
  const outerHeight = screenHeight + bezelWidth * 2

  // Default position from geometry constants
  const defaultPosition: [number, number, number] = [
    MESH_POSITIONS.screenBezel.x,
    MESH_POSITIONS.screenBezel.y,
    MESH_POSITIONS.screenBezel.z,
  ]

  // Screen tilt angle (converts degrees to radians)
  const screenAngleRad = -(CABINET_SCREEN.screenAngle * Math.PI) / 180

  const actualPosition = position ?? defaultPosition
  const actualRotation: [number, number, number] = rotation ?? [screenAngleRad, 0, 0]

  // Create bezel geometry
  const geometry = useMemo(() => {
    const shape = createBezelShape(outerWidth, outerHeight, screenWidth, screenHeight)
    const extrudeSettings = createExtrudeSettings(bezelDepth)
    return new THREE.ExtrudeGeometry(shape, extrudeSettings)
  }, [outerWidth, outerHeight, screenWidth, screenHeight, bezelDepth])

  // Create bezel material
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: bezelColor,
      roughness,
      metalness,
      wireframe,
      side: THREE.FrontSide,
    })
  }, [bezelColor, roughness, metalness, wireframe])

  // Create edge material
  const edgeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: edgeColor,
      roughness: roughness - 0.1,
      metalness: metalness + 0.1,
      wireframe,
    })
  }, [edgeColor, roughness, metalness, wireframe])

  // Animation for pulse effect
  useFrame((_, delta) => {
    if (pulseRef.current > 0) {
      pulseRef.current -= delta * 2
      glowRef.current = glowIntensity + pulseRef.current * 0.5
    } else {
      glowRef.current = glowIntensity
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
      name={MESH_NAMES.screen.group}
      position={actualPosition}
      rotation={actualRotation}
      scale={scale}
    >
      {/* Main bezel frame - centered on Z axis */}
      <mesh
        name={MESH_NAMES.screen.bezel}
        position={[0, 0, -bezelDepth / 2]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        geometry={geometry}
        material={material}
      />

      {/* Inner edge trim (darker accent) */}
      <mesh
        position={[0, 0, bezelDepth / 2 + INNER_CHAMFER / 2]}
        castShadow={false}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[outerWidth - bezelWidth * 0.3, outerHeight - bezelWidth * 0.3]} />
        <primitive object={edgeMaterial} attach="material" />
      </mesh>

      {/* Edge highlights with optional glow */}
      {enableGlow && (
        <EdgeHighlight
          width={screenWidth}
          height={screenHeight}
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={glowRef.current}
          position={[0, 0, bezelDepth / 2 + INNER_CHAMFER]}
          thickness={0.008}
        />
      )}

      {/* Screen recess backing (black) */}
      <mesh
        position={[0, 0, -bezelDepth + 0.01]}
        castShadow={false}
        receiveShadow={false}
      >
        <planeGeometry args={[screenWidth - 0.02, screenHeight - 0.02]} />
        <meshBasicMaterial color="#000000" side={THREE.FrontSide} />
      </mesh>

      {/* Children (screen display, glass, etc.) */}
      {children}
    </group>
  )
}

// ============================================================================
// Variants
// ============================================================================

export interface SimpleScreenBezelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  color?: string
  screenWidth?: number
  screenHeight?: number
  bezelWidth?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

/**
 * SimpleScreenBezel - A simpler bezel for performance
 *
 * Uses basic box geometries instead of extruded shapes.
 * Good for distant views or lower detail requirements.
 */
export function SimpleScreenBezel({
  position,
  rotation,
  scale = 1,
  color = CABINET_COLORS.bezel,
  screenWidth = CABINET_SCREEN.screenWidth,
  screenHeight = CABINET_SCREEN.screenHeight,
  bezelWidth = CABINET_SCREEN.bezelWidth,
  castShadow = true,
  receiveShadow = true,
}: SimpleScreenBezelProps) {
  const outerWidth = screenWidth + bezelWidth * 2
  // _outerHeight reserved for future use, commented out to fix TS6133
  // const outerHeight = screenHeight + bezelWidth * 2
  const depth = CABINET_SCREEN.screenRecess

  // Default position
  const screenAngleRad = -(CABINET_SCREEN.screenAngle * Math.PI) / 180
  const defaultPosition: [number, number, number] = [
    MESH_POSITIONS.screenBezel.x,
    MESH_POSITIONS.screenBezel.y,
    MESH_POSITIONS.screenBezel.z,
  ]

  return (
    <group
      name={MESH_NAMES.screen.group}
      position={position ?? defaultPosition}
      rotation={rotation ?? [screenAngleRad, 0, 0]}
      scale={scale}
    >
      {/* Top bezel strip */}
      <mesh
        position={[0, (screenHeight + bezelWidth) / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[outerWidth, bezelWidth, depth]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Bottom bezel strip */}
      <mesh
        position={[0, -(screenHeight + bezelWidth) / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[outerWidth, bezelWidth, depth]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Left bezel strip */}
      <mesh
        position={[-(screenWidth + bezelWidth) / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[bezelWidth, screenHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Right bezel strip */}
      <mesh
        position={[(screenWidth + bezelWidth) / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[bezelWidth, screenHeight, depth]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Back plate */}
      <mesh position={[0, 0, -depth / 2]}>
        <planeGeometry args={[screenWidth - 0.01, screenHeight - 0.01]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  )
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseScreenBezelOptions {
  glowColor?: string
  initialGlowIntensity?: number
}

export interface UseScreenBezelResult {
  /** Ref to attach to the ScreenBezel */
  ref: React.RefObject<THREE.Group>
  /** Current glow intensity */
  glowIntensity: number
  /** Set glow intensity dynamically */
  setGlowIntensity: (intensity: number) => void
  /** Trigger a pulse animation */
  pulse: () => void
  /** Get screen dimensions */
  getScreenDimensions: () => typeof CABINET_SCREEN
  /** Get bezel position */
  getPosition: () => typeof MESH_POSITIONS.screenBezel
}

/**
 * useScreenBezel - Hook for controlling screen bezel
 */
export function useScreenBezel(
  options: UseScreenBezelOptions = {}
): UseScreenBezelResult {
  const { initialGlowIntensity = DEFAULT_GLOW_INTENSITY } = options
  const ref = useRef<THREE.Group>(null)
  const intensityRef = useRef(initialGlowIntensity)

  const setGlowIntensity = (intensity: number) => {
    intensityRef.current = Math.max(0, Math.min(1, intensity))
  }

  const pulse = () => {
    intensityRef.current = Math.min(1, intensityRef.current + 0.3)
  }

  const getScreenDimensions = () => CABINET_SCREEN
  const getPosition = () => MESH_POSITIONS.screenBezel

  return {
    ref,
    glowIntensity: intensityRef.current,
    setGlowIntensity,
    pulse,
    getScreenDimensions,
    getPosition,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ScreenBezel
