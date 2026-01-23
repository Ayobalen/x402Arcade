/**
 * CabinetHoverGlow - Interactive hover effect for arcade cabinet
 *
 * Creates an interactive hover effect that increases cabinet glow and highlights
 * when the user hovers over it. Supports smooth transitions and customizable
 * glow colors.
 *
 * @module 3d/cabinet/CabinetHoverGlow
 */

import {
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface CabinetHoverGlowProps {
  /**
   * Enable/disable the hover glow effect.
   * @default true
   */
  enabled?: boolean
  /**
   * Base glow intensity (when not hovered).
   * @default 0.1
   */
  baseIntensity?: number
  /**
   * Hover glow intensity (when hovered).
   * @default 0.6
   */
  hoverIntensity?: number
  /**
   * Glow color (hex string).
   * @default '#8B5CF6' (purple accent)
   */
  glowColor?: string
  /**
   * Secondary glow color for edge highlights.
   * @default '#00ffff' (cyan)
   */
  edgeColor?: string
  /**
   * Transition duration in seconds.
   * @default 0.3
   */
  transitionDuration?: number
  /**
   * Enable cursor style change on hover.
   * @default true
   */
  changeCursor?: boolean
  /**
   * Cursor style when hovered.
   * @default 'pointer'
   */
  hoverCursor?: string
  /**
   * Called when hover starts.
   */
  onHoverStart?: () => void
  /**
   * Called when hover ends.
   */
  onHoverEnd?: () => void
  /**
   * Called when cabinet is clicked.
   */
  onClick?: (event: ThreeEvent<MouseEvent>) => void
  /**
   * Children (the cabinet components).
   */
  children?: React.ReactNode
  /**
   * Position offset for the group.
   */
  position?: [number, number, number]
  /**
   * Rotation in radians.
   */
  rotation?: [number, number, number]
  /**
   * Scale multiplier.
   */
  scale?: number
}

export interface CabinetHoverGlowHandle {
  /** Get current hover state */
  isHovered: () => boolean
  /** Get current glow intensity */
  getIntensity: () => number
  /** Force hover state on */
  setHovered: (hovered: boolean) => void
  /** Set glow color */
  setGlowColor: (color: string) => void
  /** Set edge highlight color */
  setEdgeColor: (color: string) => void
  /** Flash effect (temporary max glow) */
  flash: (duration?: number) => void
  /** Get the group reference */
  getGroup: () => THREE.Group | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_INTENSITY = 0.1
const DEFAULT_HOVER_INTENSITY = 0.6
const DEFAULT_GLOW_COLOR = '#8B5CF6' // Purple accent from design system
const DEFAULT_EDGE_COLOR = '#00ffff' // Cyan accent
const DEFAULT_TRANSITION_DURATION = 0.3

// Easing function for smooth transitions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// ============================================================================
// Hook: useCabinetHover
// ============================================================================

export interface UseCabinetHoverOptions {
  enabled?: boolean
  baseIntensity?: number
  hoverIntensity?: number
  transitionDuration?: number
  onHoverStart?: () => void
  onHoverEnd?: () => void
}

export interface UseCabinetHoverResult {
  /** Current hover state */
  isHovered: boolean
  /** Current interpolated intensity */
  intensity: number
  /** Transition progress (0-1) */
  progress: number
  /** Handler for pointer over events */
  onPointerOver: () => void
  /** Handler for pointer out events */
  onPointerOut: () => void
  /** Manually set hover state */
  setHovered: (hovered: boolean) => void
  /** Flash effect */
  flash: (duration?: number) => void
}

/**
 * Hook to manage cabinet hover state and animation
 */
export function useCabinetHover(
  options: UseCabinetHoverOptions = {}
): UseCabinetHoverResult {
  const {
    enabled = true,
    baseIntensity = DEFAULT_BASE_INTENSITY,
    hoverIntensity = DEFAULT_HOVER_INTENSITY,
    transitionDuration = DEFAULT_TRANSITION_DURATION,
    onHoverStart,
    onHoverEnd,
  } = options

  const [isHovered, setIsHovered] = useState(false)
  const progressRef = useRef(0)
  const targetProgressRef = useRef(0)
  const flashRef = useRef({ active: false, duration: 0, elapsed: 0 })

  // Handle hover start
  const handlePointerOver = useCallback(() => {
    if (!enabled) return
    setIsHovered(true)
    targetProgressRef.current = 1
    onHoverStart?.()
  }, [enabled, onHoverStart])

  // Handle hover end
  const handlePointerOut = useCallback(() => {
    if (!enabled) return
    setIsHovered(false)
    targetProgressRef.current = 0
    onHoverEnd?.()
  }, [enabled, onHoverEnd])

  // Manual hover control
  const setHoveredManual = useCallback((hovered: boolean) => {
    setIsHovered(hovered)
    targetProgressRef.current = hovered ? 1 : 0
    if (hovered) {
      onHoverStart?.()
    } else {
      onHoverEnd?.()
    }
  }, [onHoverStart, onHoverEnd])

  // Flash effect
  const flash = useCallback((duration: number = 0.5) => {
    flashRef.current = { active: true, duration, elapsed: 0 }
  }, [])

  // Update animation each frame
  useFrame((_, delta) => {
    // Update flash
    if (flashRef.current.active) {
      flashRef.current.elapsed += delta
      if (flashRef.current.elapsed >= flashRef.current.duration) {
        flashRef.current.active = false
      }
    }

    // Animate progress toward target
    const target = targetProgressRef.current
    const current = progressRef.current
    const speed = 1 / transitionDuration

    if (current !== target) {
      if (current < target) {
        progressRef.current = Math.min(current + delta * speed, target)
      } else {
        progressRef.current = Math.max(current - delta * speed, target)
      }
    }
  })

  // Calculate current intensity
  let intensity = baseIntensity
  const easedProgress = easeInOutCubic(progressRef.current)
  intensity = THREE.MathUtils.lerp(baseIntensity, hoverIntensity, easedProgress)

  // Apply flash effect
  if (flashRef.current.active) {
    const flashProgress = flashRef.current.elapsed / flashRef.current.duration
    const flashIntensity = Math.sin(flashProgress * Math.PI)
    intensity = Math.max(intensity, hoverIntensity * (1 + flashIntensity * 0.5))
  }

  return {
    isHovered,
    intensity,
    progress: progressRef.current,
    onPointerOver: handlePointerOver,
    onPointerOut: handlePointerOut,
    setHovered: setHoveredManual,
    flash,
  }
}

// ============================================================================
// Edge Glow Mesh Component
// ============================================================================

interface EdgeGlowProps {
  intensity: number
  color: string
  width: number
  height: number
  depth: number
}

/**
 * Creates a subtle edge glow effect around the cabinet
 */
function EdgeGlow({ intensity, color, width, height, depth }: EdgeGlowProps) {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Update material intensity each frame
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.opacity = intensity * 0.3
    }
  })

  // Only render when there's visible glow
  if (intensity < 0.01) return null

  const edgeOffset = 0.02
  const edgeThickness = 0.01

  return (
    <group>
      {/* Bottom edge glow */}
      <mesh position={[0, edgeOffset, depth / 2 + edgeOffset]}>
        <planeGeometry args={[width + edgeOffset * 2, edgeThickness]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={intensity * 0.3}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Top edge glow */}
      <mesh position={[0, height - edgeOffset, depth / 2 + edgeOffset]}>
        <planeGeometry args={[width + edgeOffset * 2, edgeThickness]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Left edge glow */}
      <mesh
        position={[-width / 2 - edgeOffset, height / 2, depth / 2 + edgeOffset]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <planeGeometry args={[height, edgeThickness]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Right edge glow */}
      <mesh
        position={[width / 2 + edgeOffset, height / 2, depth / 2 + edgeOffset]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <planeGeometry args={[height, edgeThickness]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity * 0.2}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// Ambient Glow Component
// ============================================================================

interface AmbientGlowProps {
  intensity: number
  color: string
  position: [number, number, number]
  range: number
}

/**
 * Creates an ambient point light glow effect
 */
function AmbientGlow({ intensity, color, position, range }: AmbientGlowProps) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(() => {
    if (lightRef.current) {
      lightRef.current.intensity = intensity * 2
    }
  })

  if (intensity < 0.01) return null

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={color}
      intensity={intensity * 2}
      distance={range}
      decay={2}
    />
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetHoverGlow - Interactive hover glow wrapper for arcade cabinet
 *
 * Wraps cabinet components and provides hover interaction with smooth
 * glow transitions and edge highlights.
 *
 * @example
 * ```tsx
 * <CabinetHoverGlow
 *   glowColor="#8B5CF6"
 *   edgeColor="#00ffff"
 *   hoverIntensity={0.8}
 *   onClick={() => console.log('Cabinet clicked!')}
 * >
 *   <CabinetBody>
 *     <ScreenBezel />
 *     <ControlPanel />
 *   </CabinetBody>
 * </CabinetHoverGlow>
 * ```
 */
export const CabinetHoverGlow = forwardRef<CabinetHoverGlowHandle, CabinetHoverGlowProps>(
  function CabinetHoverGlow(
    {
      enabled = true,
      baseIntensity = DEFAULT_BASE_INTENSITY,
      hoverIntensity = DEFAULT_HOVER_INTENSITY,
      glowColor = DEFAULT_GLOW_COLOR,
      edgeColor = DEFAULT_EDGE_COLOR,
      transitionDuration = DEFAULT_TRANSITION_DURATION,
      changeCursor = true,
      hoverCursor = 'pointer',
      onHoverStart,
      onHoverEnd,
      onClick,
      children,
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const glowColorRef = useRef(new THREE.Color(glowColor))
    const edgeColorRef = useRef(new THREE.Color(edgeColor))

    // Use the hover hook for state management
    const {
      isHovered,
      intensity,
      onPointerOver,
      onPointerOut,
      setHovered,
      flash,
    } = useCabinetHover({
      enabled,
      baseIntensity,
      hoverIntensity,
      transitionDuration,
      onHoverStart,
      onHoverEnd,
    })

    // Handle pointer over with cursor change
    const handlePointerOver = useCallback((event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      onPointerOver()
      if (changeCursor) {
        document.body.style.cursor = hoverCursor
      }
    }, [onPointerOver, changeCursor, hoverCursor])

    // Handle pointer out with cursor reset
    const handlePointerOut = useCallback((event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      onPointerOut()
      if (changeCursor) {
        document.body.style.cursor = 'default'
      }
    }, [onPointerOut, changeCursor])

    // Handle click
    const handleClick = useCallback((event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation()
      flash(0.3) // Quick flash on click
      onClick?.(event)
    }, [flash, onClick])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      isHovered: () => isHovered,
      getIntensity: () => intensity,
      setHovered,
      setGlowColor: (color: string) => {
        glowColorRef.current = new THREE.Color(color)
      },
      setEdgeColor: (color: string) => {
        edgeColorRef.current = new THREE.Color(color)
      },
      flash,
      getGroup: () => groupRef.current,
    }))

    // Get cabinet dimensions for edge glow (approximate)
    const cabinetWidth = 0.6 // meters
    const cabinetHeight = 1.8 // meters
    const cabinetDepth = 0.7 // meters

    return (
      <group
        ref={groupRef}
        position={position}
        rotation={rotation}
        scale={scale}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        {/* Edge glow effect */}
        <EdgeGlow
          intensity={intensity}
          color={edgeColor}
          width={cabinetWidth}
          height={cabinetHeight}
          depth={cabinetDepth}
        />

        {/* Ambient glow light (subtle floor reflection) */}
        <AmbientGlow
          intensity={intensity}
          color={glowColor}
          position={[0, 0.1, cabinetDepth / 2 + 0.3]}
          range={2}
        />

        {/* Secondary ambient glow (behind cabinet) */}
        <AmbientGlow
          intensity={intensity * 0.5}
          color={edgeColor}
          position={[0, cabinetHeight * 0.7, -cabinetDepth / 2 - 0.2]}
          range={1.5}
        />

        {/* Children (cabinet components) */}
        {children}
      </group>
    )
  }
)

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Apply hover glow material modifications to existing materials
 *
 * Call this on materials that should respond to hover state
 */
export function applyHoverGlow(
  material: THREE.MeshStandardMaterial,
  intensity: number,
  glowColor: THREE.Color | string
): void {
  const color = glowColor instanceof THREE.Color
    ? glowColor
    : new THREE.Color(glowColor)

  // Increase emissive intensity based on hover
  material.emissive = color
  material.emissiveIntensity = intensity * 0.3
}

/**
 * Create a material with hover glow capability
 */
export function createHoverGlowMaterial(
  baseColor: string,
  glowColor: string = DEFAULT_GLOW_COLOR,
  options: {
    roughness?: number
    metalness?: number
    baseEmissiveIntensity?: number
  } = {}
): THREE.MeshStandardMaterial {
  const {
    roughness = 0.5,
    metalness = 0.3,
    baseEmissiveIntensity = 0.05,
  } = options

  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness,
    metalness,
    emissive: glowColor,
    emissiveIntensity: baseEmissiveIntensity,
  })
}

// ============================================================================
// Presets
// ============================================================================

/**
 * Preset configurations for different hover glow styles
 */
export const HOVER_GLOW_PRESETS = {
  /** Default purple/cyan arcade style */
  arcade: {
    glowColor: '#8B5CF6',
    edgeColor: '#00ffff',
    baseIntensity: 0.1,
    hoverIntensity: 0.6,
    transitionDuration: 0.3,
  },
  /** Cyberpunk neon style */
  cyberpunk: {
    glowColor: '#ff00ff',
    edgeColor: '#00ffff',
    baseIntensity: 0.15,
    hoverIntensity: 0.8,
    transitionDuration: 0.2,
  },
  /** Subtle professional style */
  subtle: {
    glowColor: '#4a9eff',
    edgeColor: '#ffffff',
    baseIntensity: 0.05,
    hoverIntensity: 0.3,
    transitionDuration: 0.4,
  },
  /** High energy gaming style */
  gaming: {
    glowColor: '#00ff00',
    edgeColor: '#ffff00',
    baseIntensity: 0.2,
    hoverIntensity: 1.0,
    transitionDuration: 0.15,
  },
  /** Retro red style */
  retro: {
    glowColor: '#ff3333',
    edgeColor: '#ff8800',
    baseIntensity: 0.1,
    hoverIntensity: 0.5,
    transitionDuration: 0.35,
  },
} as const

export type HoverGlowPreset = keyof typeof HOVER_GLOW_PRESETS

/**
 * Get preset configuration
 */
export function getHoverGlowPreset(preset: HoverGlowPreset): typeof HOVER_GLOW_PRESETS[HoverGlowPreset] {
  return HOVER_GLOW_PRESETS[preset]
}

// ============================================================================
// Exports
// ============================================================================

export default CabinetHoverGlow
