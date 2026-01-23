import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface GameFrameProps {
  /** Content to display inside the frame (typically a game canvas) */
  children?: React.ReactNode
  /** Width of the frame opening (game area) */
  width?: number
  /** Height of the frame opening (game area) */
  height?: number
  /** Thickness of the frame border */
  borderWidth?: number
  /** Depth of the frame extrusion */
  depth?: number
  /** Primary accent color (default: cyan #00ffff) */
  accentColor?: string
  /** Secondary accent color for glow effects (default: magenta #ff00ff) */
  glowColor?: string
  /** Enable glow animation */
  enableGlow?: boolean
  /** Glow intensity (0-1) */
  glowIntensity?: number
  /** Enable frame rotation animation */
  enableRotation?: boolean
  /** Frame rotation speed */
  rotationSpeed?: number
  /** Additional CSS class for the container */
  className?: string
}

interface FrameGeometryProps {
  width: number
  height: number
  borderWidth: number
  depth: number
  accentColor: string
  glowColor: string
  enableGlow: boolean
  glowIntensity: number
  enableRotation: boolean
  rotationSpeed: number
}

interface GlowEffectProps {
  width: number
  height: number
  borderWidth: number
  color: string
  intensity: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = 4
const DEFAULT_HEIGHT = 3
const DEFAULT_BORDER_WIDTH = 0.15
const DEFAULT_DEPTH = 0.3
const DEFAULT_ACCENT_COLOR = '#00ffff' // Cyan
const DEFAULT_GLOW_COLOR = '#ff00ff' // Magenta
const DEFAULT_GLOW_INTENSITY = 0.6
const DEFAULT_ROTATION_SPEED = 0.001

// ============================================================================
// Frame Geometry Component (3D frame segments)
// ============================================================================

function FrameSegment({
  position,
  rotation,
  scale,
  color,
  emissiveColor,
  emissiveIntensity,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale: [number, number, number]
  color: string
  emissiveColor: string
  emissiveIntensity: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  return (
    <RoundedBox
      ref={meshRef}
      position={position}
      rotation={rotation}
      args={scale}
      radius={0.02}
      smoothness={4}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        metalness={0.8}
        roughness={0.2}
      />
    </RoundedBox>
  )
}

function FrameGeometry({
  width,
  height,
  borderWidth,
  depth,
  accentColor,
  glowColor,
  enableGlow,
  glowIntensity,
  enableRotation,
  rotationSpeed,
}: FrameGeometryProps) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  // Calculate frame segment positions
  const halfWidth = width / 2
  const halfHeight = height / 2
  const halfBorder = borderWidth / 2

  // Animated glow intensity
  useFrame((_, delta) => {
    if (enableRotation && groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed
    }
    timeRef.current += delta
  })

  const emissiveIntensity = enableGlow ? glowIntensity : 0

  return (
    <group ref={groupRef}>
      {/* Top segment */}
      <FrameSegment
        position={[0, halfHeight + halfBorder, 0]}
        scale={[width + borderWidth * 2, borderWidth, depth]}
        color={accentColor}
        emissiveColor={glowColor}
        emissiveIntensity={emissiveIntensity}
      />

      {/* Bottom segment */}
      <FrameSegment
        position={[0, -halfHeight - halfBorder, 0]}
        scale={[width + borderWidth * 2, borderWidth, depth]}
        color={accentColor}
        emissiveColor={glowColor}
        emissiveIntensity={emissiveIntensity}
      />

      {/* Left segment */}
      <FrameSegment
        position={[-halfWidth - halfBorder, 0, 0]}
        scale={[borderWidth, height, depth]}
        color={accentColor}
        emissiveColor={glowColor}
        emissiveIntensity={emissiveIntensity}
      />

      {/* Right segment */}
      <FrameSegment
        position={[halfWidth + halfBorder, 0, 0]}
        scale={[borderWidth, height, depth]}
        color={accentColor}
        emissiveColor={glowColor}
        emissiveIntensity={emissiveIntensity}
      />

      {/* Corner decorations - small spheres at corners for arcade feel */}
      {[
        [halfWidth + halfBorder, halfHeight + halfBorder, depth / 2] as const,
        [-halfWidth - halfBorder, halfHeight + halfBorder, depth / 2] as const,
        [halfWidth + halfBorder, -halfHeight - halfBorder, depth / 2] as const,
        [-halfWidth - halfBorder, -halfHeight - halfBorder, depth / 2] as const,
      ].map((pos, index) => (
        <mesh key={index} position={pos}>
          <sphereGeometry args={[borderWidth * 0.6, 16, 16]} />
          <meshStandardMaterial
            color={glowColor}
            emissive={glowColor}
            emissiveIntensity={enableGlow ? glowIntensity * 1.5 : 0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Glow effect plane behind frame */}
      {enableGlow && (
        <GlowEffect
          width={width}
          height={height}
          borderWidth={borderWidth}
          color={glowColor}
          intensity={glowIntensity}
        />
      )}
    </group>
  )
}

// ============================================================================
// Glow Effect Component
// ============================================================================

function GlowEffect({ width, height, borderWidth, color, intensity }: GlowEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      // Pulsing glow effect
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.8
      material.opacity = intensity * 0.3 * pulse
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -0.1]}>
      <planeGeometry args={[width + borderWidth * 4, height + borderWidth * 4]} />
      <meshBasicMaterial color={color} transparent opacity={intensity * 0.3} />
    </mesh>
  )
}

// ============================================================================
// Inner Frame Glass (optional transparent game screen)
// ============================================================================

function InnerGlass({
  width,
  height,
}: {
  width: number
  height: number
}) {
  return (
    <mesh position={[0, 0, 0.01]}>
      <planeGeometry args={[width, height]} />
      <MeshTransmissionMaterial
        backside
        samples={16}
        resolution={256}
        transmission={0.95}
        roughness={0.1}
        thickness={0.1}
        ior={1.5}
        chromaticAberration={0.02}
        anisotropy={0.3}
        color="#16162a"
      />
    </mesh>
  )
}

// ============================================================================
// Lighting Setup
// ============================================================================

function FrameLighting({ accentColor, glowColor }: { accentColor: string; glowColor: string }) {
  return (
    <>
      {/* Ambient light for base visibility */}
      <ambientLight intensity={0.3} />

      {/* Main directional light */}
      <directionalLight position={[5, 5, 5]} intensity={0.8} color="#ffffff" />

      {/* Accent lights matching theme colors */}
      <pointLight position={[-3, 3, 3]} intensity={0.5} color={accentColor} />
      <pointLight position={[3, -3, 3]} intensity={0.5} color={glowColor} />

      {/* Rim light for depth */}
      <pointLight position={[0, 0, -5]} intensity={0.3} color="#ffffff" />
    </>
  )
}

// ============================================================================
// Main GameFrame Component
// ============================================================================

/**
 * GameFrame - A 3D frame component that surrounds the game canvas
 *
 * Creates a neon-lit picture frame style border around game content,
 * integrating 2D gameplay with 3D visuals for the arcade aesthetic.
 *
 * @example
 * ```tsx
 * <GameFrame width={4} height={3} enableGlow>
 *   <canvas ref={gameCanvasRef} />
 * </GameFrame>
 * ```
 */
export function GameFrame({
  children,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  borderWidth = DEFAULT_BORDER_WIDTH,
  depth = DEFAULT_DEPTH,
  accentColor = DEFAULT_ACCENT_COLOR,
  glowColor = DEFAULT_GLOW_COLOR,
  enableGlow = true,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  enableRotation = false,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  className = '',
}: GameFrameProps) {
  // Calculate container dimensions based on frame size
  const aspectRatio = width / height

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: '100%',
        maxWidth: '800px',
        aspectRatio: aspectRatio.toString(),
      }}
      data-testid="game-frame-container"
    >
      {/* 3D Canvas for the frame */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
        data-testid="game-frame-canvas"
      >
        <FrameLighting accentColor={accentColor} glowColor={glowColor} />
        <FrameGeometry
          width={width}
          height={height}
          borderWidth={borderWidth}
          depth={depth}
          accentColor={accentColor}
          glowColor={glowColor}
          enableGlow={enableGlow}
          glowIntensity={glowIntensity}
          enableRotation={enableRotation}
          rotationSpeed={rotationSpeed}
        />
        <InnerGlass width={width} height={height} />
      </Canvas>

      {/* Children (game canvas) positioned inside the frame */}
      {children && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            // Inset by the border width to place content inside frame
            padding: `${(borderWidth / height) * 100}%`,
            zIndex: 1,
          }}
          data-testid="game-frame-content"
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Standalone Frame Scene (for use without children)
// ============================================================================

export interface StandaloneFrameSceneProps extends Omit<GameFrameProps, 'children' | 'className'> {}

/**
 * StandaloneFrameScene - Just the 3D frame geometry for embedding in other Canvas contexts
 *
 * Use this when you already have a Canvas and want to add the frame to it.
 */
export function StandaloneFrameScene({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  borderWidth = DEFAULT_BORDER_WIDTH,
  depth = DEFAULT_DEPTH,
  accentColor = DEFAULT_ACCENT_COLOR,
  glowColor = DEFAULT_GLOW_COLOR,
  enableGlow = true,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  enableRotation = false,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
}: StandaloneFrameSceneProps) {
  return (
    <>
      <FrameLighting accentColor={accentColor} glowColor={glowColor} />
      <FrameGeometry
        width={width}
        height={height}
        borderWidth={borderWidth}
        depth={depth}
        accentColor={accentColor}
        glowColor={glowColor}
        enableGlow={enableGlow}
        glowIntensity={glowIntensity}
        enableRotation={enableRotation}
        rotationSpeed={rotationSpeed}
      />
      <InnerGlass width={width} height={height} />
    </>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default GameFrame
