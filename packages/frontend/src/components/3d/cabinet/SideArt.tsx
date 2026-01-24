/**
 * SideArt - Arcade cabinet side art panel 3D component
 *
 * Creates the decorative side panels on the cabinet with neon graphic
 * textures representing game themes. Supports dynamic art swapping
 * and subtle glow animations.
 *
 * @module 3d/cabinet/SideArt
 */

import { useRef, useMemo, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import {
  CABINET_BODY,
  CABINET_SIDE_ART,
  CABINET_COLORS,
  MESH_NAMES,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export type SideArtSide = 'left' | 'right'

export interface SideArtProps {
  /** Which side of the cabinet ('left' or 'right') */
  side: SideArtSide
  /** Position offset [x, y, z] */
  position?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Base color when no texture */
  baseColor?: string
  /** Texture URL for the art */
  textureUrl?: string
  /** Enable emissive glow effect */
  enableGlow?: boolean
  /** Glow color for emissive effect */
  glowColor?: string
  /** Glow intensity (0-1) */
  glowIntensity?: number
  /** Material roughness (0-1) */
  roughness?: number
  /** Material metalness (0-1) */
  metalness?: number
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Enable subtle pulse animation */
  animated?: boolean
  /** Animation speed multiplier */
  animationSpeed?: number
  /** Called when mesh is ready */
  onReady?: (mesh: THREE.Mesh) => void
  /** Called when texture is loaded */
  onTextureLoad?: (texture: THREE.Texture) => void
  /** Children components */
  children?: React.ReactNode
}

export interface SideArtHandle {
  mesh: THREE.Mesh | null
  setTexture: (url: string) => void
  setGlowIntensity: (intensity: number) => void
  pulse: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_ROUGHNESS = 0.6
const DEFAULT_METALNESS = 0.2
const DEFAULT_GLOW_INTENSITY = 0.15
const DEFAULT_GLOW_COLOR = '#8B5CF6' // Purple accent from design system

/** Inset from cabinet edge */
const PANEL_INSET = CABINET_SIDE_ART.inset

/** Panel thickness */
const PANEL_THICKNESS = 0.01

// ============================================================================
// Procedural Art Generator
// ============================================================================

/**
 * Generate procedural neon art pattern as a canvas texture
 * Used when no texture URL is provided
 */
function generateNeonArtTexture(
  width: number = 512,
  height: number = 512,
  primaryColor: string = '#8B5CF6',
  secondaryColor: string = '#00FFFF'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  // Dark background
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, width, height)

  // Create gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#0a0a0f')
  bgGradient.addColorStop(0.5, '#12121a')
  bgGradient.addColorStop(1, '#0a0a0f')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  // Draw neon grid lines
  ctx.strokeStyle = primaryColor
  ctx.lineWidth = 2
  ctx.globalAlpha = 0.3

  // Vertical lines
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }

  // Horizontal lines
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // Draw geometric shapes
  ctx.globalAlpha = 0.6

  // Large triangle
  ctx.beginPath()
  ctx.strokeStyle = primaryColor
  ctx.lineWidth = 3
  ctx.moveTo(width / 2, height * 0.2)
  ctx.lineTo(width * 0.2, height * 0.7)
  ctx.lineTo(width * 0.8, height * 0.7)
  ctx.closePath()
  ctx.stroke()

  // Inner triangle
  ctx.beginPath()
  ctx.strokeStyle = secondaryColor
  ctx.lineWidth = 2
  ctx.moveTo(width / 2, height * 0.3)
  ctx.lineTo(width * 0.3, height * 0.6)
  ctx.lineTo(width * 0.7, height * 0.6)
  ctx.closePath()
  ctx.stroke()

  // Circles
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.strokeStyle = primaryColor
  ctx.arc(width / 2, height * 0.45, width * 0.15, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.strokeStyle = secondaryColor
  ctx.arc(width / 2, height * 0.45, width * 0.1, 0, Math.PI * 2)
  ctx.stroke()

  // Add glow effect to shapes
  ctx.globalAlpha = 0.15
  ctx.shadowColor = primaryColor
  ctx.shadowBlur = 20
  ctx.beginPath()
  ctx.arc(width / 2, height * 0.45, width * 0.12, 0, Math.PI * 2)
  ctx.fillStyle = primaryColor
  ctx.fill()

  // Reset
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0

  // Add some random dots for stars effect
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const size = Math.random() * 2 + 0.5
    ctx.globalAlpha = Math.random() * 0.5 + 0.3
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true

  return texture
}

// ============================================================================
// Sub-components
// ============================================================================

interface NeonBorderProps {
  width: number
  height: number
  color: string
  emissiveIntensity: number
  thickness?: number
}

/**
 * Neon border frame around the side art panel
 */
function NeonBorder({
  width,
  height,
  color,
  emissiveIntensity,
  thickness = 0.015,
}: NeonBorderProps) {
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        roughness: 0.3,
        metalness: 0.8,
      }),
    [color, emissiveIntensity]
  )

  return (
    <group position={[0, 0, PANEL_THICKNESS / 2 + thickness / 2]}>
      {/* Top border */}
      <mesh position={[0, height / 2 - thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, thickness]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Bottom border */}
      <mesh position={[0, -height / 2 + thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, thickness]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Left border */}
      <mesh position={[-width / 2 + thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height - thickness * 2, thickness]} />
        <primitive object={material} attach="material" />
      </mesh>

      {/* Right border */}
      <mesh position={[width / 2 - thickness / 2, 0, 0]}>
        <boxGeometry args={[thickness, height - thickness * 2, thickness]} />
        <primitive object={material} attach="material" />
      </mesh>
    </group>
  )
}

// ============================================================================
// Texture Loading Component
// ============================================================================

interface TexturedPanelProps {
  textureUrl: string
  width: number
  height: number
  baseColor: string
  glowColor: string
  glowIntensity: number
  roughness: number
  metalness: number
  castShadow: boolean
  receiveShadow: boolean
  onTextureLoad?: (texture: THREE.Texture) => void
}

/**
 * Panel with loaded texture
 */
function TexturedPanel({
  textureUrl,
  width,
  height,
  baseColor,
  glowColor,
  glowIntensity,
  roughness,
  metalness,
  castShadow,
  receiveShadow,
  onTextureLoad,
}: TexturedPanelProps) {
  const texture = useTexture(textureUrl, (loadedTexture) => {
    if (onTextureLoad && loadedTexture instanceof THREE.Texture) {
      onTextureLoad(loadedTexture)
    }
  })

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: texture,
      color: baseColor,
      emissive: glowColor,
      emissiveIntensity: glowIntensity,
      roughness,
      metalness,
    })
  }, [texture, baseColor, glowColor, glowIntensity, roughness, metalness])

  return (
    <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
      <planeGeometry args={[width, height]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * SideArt - Decorative side panel for the arcade cabinet
 *
 * This component creates the side art panels with:
 * - Plane geometry sized to fit cabinet sides
 * - Dynamic texture loading or procedural generation
 * - Emissive glow effects for neon aesthetic
 * - Subtle pulse animation
 * - Dynamic art swapping support
 *
 * @example
 * ```tsx
 * <SideArt
 *   side="left"
 *   textureUrl="/textures/game-art.png"
 *   enableGlow
 *   glowColor="#8B5CF6"
 *   animated
 * />
 * ```
 */
export function SideArt({
  side,
  position,
  scale = 1,
  baseColor = CABINET_COLORS.sideArt,
  textureUrl,
  enableGlow = true,
  glowColor = DEFAULT_GLOW_COLOR,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  roughness = DEFAULT_ROUGHNESS,
  metalness = DEFAULT_METALNESS,
  castShadow = false,
  receiveShadow = true,
  animated = false,
  animationSpeed = 1,
  onReady,
  onTextureLoad,
  children,
}: SideArtProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const animationPhase = useRef(Math.random() * Math.PI * 2) // Random start phase
  const currentGlowIntensity = useRef(glowIntensity)
  const pulseAmount = useRef(0)

  // Track current texture URL for dynamic swapping
  const [currentTextureUrl, setCurrentTextureUrl] = useState(textureUrl)

  // Dimensions from geometry constants
  const panelHeight = CABINET_SIDE_ART.height
  const panelDepth = CABINET_SIDE_ART.depth

  // Calculate position based on side
  const xOffset = side === 'left'
    ? -CABINET_BODY.width / 2 - PANEL_INSET
    : CABINET_BODY.width / 2 + PANEL_INSET

  const defaultPosition: [number, number, number] = [
    xOffset,
    CABINET_SIDE_ART.bottomOffset + panelHeight / 2,
    0,
  ]

  // Rotation: face outward from cabinet
  const rotation: [number, number, number] = [0, side === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]

  // Generate procedural texture when no URL provided
  const proceduralTexture = useMemo(() => {
    if (!currentTextureUrl) {
      return generateNeonArtTexture(512, 512, glowColor, '#00FFFF')
    }
    return null
  }, [currentTextureUrl, glowColor])

  // Create material for procedural texture
  const proceduralMaterial = useMemo(() => {
    if (proceduralTexture) {
      return new THREE.MeshStandardMaterial({
        map: proceduralTexture,
        color: baseColor,
        emissive: glowColor,
        emissiveIntensity: currentGlowIntensity.current,
        roughness,
        metalness,
      })
    }
    return null
  }, [proceduralTexture, baseColor, glowColor, roughness, metalness])

  // Animation loop for subtle pulse
  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Handle pulse decay
    if (pulseAmount.current > 0) {
      pulseAmount.current -= delta * 2
      if (pulseAmount.current < 0) pulseAmount.current = 0
    }

    // Animated glow effect
    if (animated) {
      animationPhase.current += delta * animationSpeed
      const breathe = Math.sin(animationPhase.current) * 0.05
      currentGlowIntensity.current = glowIntensity + breathe + pulseAmount.current * 0.3

      // Update material emissive intensity
      const material = meshRef.current.material as THREE.MeshStandardMaterial
      if (material && material.emissiveIntensity !== undefined) {
        material.emissiveIntensity = currentGlowIntensity.current
      }
    }
  })

  // Texture swap handler
  const handleSetTexture = useCallback((url: string) => {
    setCurrentTextureUrl(url)
  }, [])

  // Trigger pulse effect
  const handlePulse = useCallback(() => {
    pulseAmount.current = 1
  }, [])

  // Notify parent when ready
  useMemo(() => {
    if (meshRef.current && onReady) {
      onReady(meshRef.current)
    }
  }, [onReady])

  const meshName = side === 'left'
    ? MESH_NAMES.decorations.sideArtLeft
    : MESH_NAMES.decorations.sideArtRight

  return (
    <group
      name={`${MESH_NAMES.decorations.group}_${side}`}
      position={position ?? defaultPosition}
      rotation={rotation}
      scale={scale}
    >
      {/* Main art panel */}
      {currentTextureUrl ? (
        <TexturedPanel
          textureUrl={currentTextureUrl}
          width={panelDepth}
          height={panelHeight}
          baseColor={baseColor}
          glowColor={glowColor}
          glowIntensity={glowIntensity}
          roughness={roughness}
          metalness={metalness}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          onTextureLoad={onTextureLoad}
        />
      ) : (
        <mesh
          ref={meshRef}
          name={meshName}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        >
          <planeGeometry args={[panelDepth, panelHeight]} />
          {proceduralMaterial && (
            <primitive object={proceduralMaterial} attach="material" />
          )}
        </mesh>
      )}

      {/* Neon border frame */}
      {enableGlow && (
        <NeonBorder
          width={panelDepth}
          height={panelHeight}
          color={glowColor}
          emissiveIntensity={glowIntensity * 2}
        />
      )}

      {children}

      {/* Expose methods via userData for external control */}
      <group
        userData={{
          setTexture: handleSetTexture,
          pulse: handlePulse,
          setGlowIntensity: (intensity: number) => {
            currentGlowIntensity.current = intensity
          },
        }}
      />
    </group>
  )
}

// ============================================================================
// Variants
// ============================================================================

export interface SimpleSideArtProps {
  side: SideArtSide
  position?: [number, number, number]
  scale?: number
  color?: string
  castShadow?: boolean
  receiveShadow?: boolean
}

/**
 * SimpleSideArt - Simplified side art panel for performance
 *
 * Uses a single colored plane without textures or effects.
 * Good for distant views or lower detail requirements.
 */
export function SimpleSideArt({
  side,
  position,
  scale = 1,
  color = CABINET_COLORS.sideArt,
  castShadow = false,
  receiveShadow = true,
}: SimpleSideArtProps) {
  const panelHeight = CABINET_SIDE_ART.height
  const panelDepth = CABINET_SIDE_ART.depth

  const xOffset = side === 'left'
    ? -CABINET_BODY.width / 2 - PANEL_INSET
    : CABINET_BODY.width / 2 + PANEL_INSET

  const defaultPosition: [number, number, number] = [
    xOffset,
    CABINET_SIDE_ART.bottomOffset + panelHeight / 2,
    0,
  ]

  const rotation: [number, number, number] = [0, side === 'left' ? -Math.PI / 2 : Math.PI / 2, 0]

  return (
    <mesh
      name={side === 'left' ? MESH_NAMES.decorations.sideArtLeft : MESH_NAMES.decorations.sideArtRight}
      position={position ?? defaultPosition}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[panelDepth, panelHeight]} />
      <meshStandardMaterial
        color={color}
        roughness={DEFAULT_ROUGHNESS}
        metalness={DEFAULT_METALNESS}
      />
    </mesh>
  )
}

// ============================================================================
// Combined Component
// ============================================================================

export interface SideArtPairProps {
  /** Texture URL for left side */
  leftTextureUrl?: string
  /** Texture URL for right side */
  rightTextureUrl?: string
  /** Enable glow effects */
  enableGlow?: boolean
  /** Glow color */
  glowColor?: string
  /** Glow intensity */
  glowIntensity?: number
  /** Enable animation */
  animated?: boolean
  /** Use simple version for performance */
  simple?: boolean
}

/**
 * SideArtPair - Both side art panels together
 *
 * Convenience component that renders both left and right side art panels.
 */
export function SideArtPair({
  leftTextureUrl,
  rightTextureUrl,
  enableGlow = true,
  glowColor = DEFAULT_GLOW_COLOR,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  animated = false,
  simple = false,
}: SideArtPairProps) {
  if (simple) {
    return (
      <>
        <SimpleSideArt side="left" />
        <SimpleSideArt side="right" />
      </>
    )
  }

  return (
    <>
      <SideArt
        side="left"
        textureUrl={leftTextureUrl}
        enableGlow={enableGlow}
        glowColor={glowColor}
        glowIntensity={glowIntensity}
        animated={animated}
      />
      <SideArt
        side="right"
        textureUrl={rightTextureUrl}
        enableGlow={enableGlow}
        glowColor={glowColor}
        glowIntensity={glowIntensity}
        animated={animated}
      />
    </>
  )
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseSideArtOptions {
  initialGlowIntensity?: number
  initialTextureUrl?: string
}

export interface UseSideArtResult {
  /** Ref to attach to the SideArt */
  ref: React.RefObject<THREE.Mesh>
  /** Current glow intensity */
  glowIntensity: number
  /** Set glow intensity dynamically */
  setGlowIntensity: (intensity: number) => void
  /** Current texture URL */
  textureUrl: string | undefined
  /** Set texture URL for dynamic swapping */
  setTextureUrl: (url: string) => void
  /** Trigger pulse animation */
  pulse: () => void
  /** Get side art dimensions */
  getDimensions: () => typeof CABINET_SIDE_ART
}

/**
 * useSideArt - Hook for controlling side art panels
 */
export function useSideArt(options: UseSideArtOptions = {}): UseSideArtResult {
  const {
    initialGlowIntensity = DEFAULT_GLOW_INTENSITY,
    initialTextureUrl,
  } = options

  const ref = useRef<THREE.Mesh>(null)
  const [glowIntensity, setGlowIntensityState] = useState(initialGlowIntensity)
  const [textureUrl, setTextureUrlState] = useState(initialTextureUrl)
  const pulseRef = useRef(0)

  const setGlowIntensity = useCallback((intensity: number) => {
    setGlowIntensityState(Math.max(0, Math.min(1, intensity)))
  }, [])

  const setTextureUrl = useCallback((url: string) => {
    setTextureUrlState(url)
  }, [])

  const pulse = useCallback(() => {
    pulseRef.current = 1
  }, [])

  const getDimensions = useCallback(() => CABINET_SIDE_ART, [])

  return {
    ref,
    glowIntensity,
    setGlowIntensity,
    textureUrl,
    setTextureUrl,
    pulse,
    getDimensions,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default SideArt
