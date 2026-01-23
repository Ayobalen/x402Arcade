/**
 * Marquee - Illuminated marquee sign component for arcade cabinet
 *
 * Creates the illuminated marquee sign at the top of the cabinet displaying
 * the game name with glow effect and backlight illumination.
 *
 * @module 3d/cabinet/Marquee
 */

import { useRef, useMemo, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Text } from '@react-three/drei'
import {
  CABINET_MARQUEE,
  CABINET_COLORS,
  CABINET_EMISSIVE,
  MESH_NAMES,
  MESH_POSITIONS,
} from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface MarqueeProps {
  /** Position offset for the marquee [x, y, z] */
  position?: [number, number, number]
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** Game title to display on marquee */
  title?: string
  /** Title font size (default: 0.15) */
  titleSize?: number
  /** Title color (default: white) */
  titleColor?: string
  /** Frame color override */
  frameColor?: string
  /** Panel color (backlit area) override */
  panelColor?: string
  /** Emissive/glow color (default: white) */
  emissiveColor?: string
  /** Emissive intensity (0-1, default: 0.8) */
  emissiveIntensity?: number
  /** Enable backlight glow effect */
  enableGlow?: boolean
  /** Enable flickering effect (like old arcade) */
  enableFlicker?: boolean
  /** Flicker frequency (Hz, default: 0.5) */
  flickerFrequency?: number
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Custom texture for marquee art (overrides title) */
  texture?: THREE.Texture | null
  /** Called when marquee is ready */
  onReady?: (group: THREE.Group) => void
  /** Called when backlight state changes */
  onBacklightChange?: (intensity: number) => void
  /** Children components */
  children?: React.ReactNode
}

export interface MarqueeHandle {
  /** Reference to the root group */
  group: THREE.Group | null
  /** Set backlight intensity (0-1) */
  setIntensity: (intensity: number) => void
  /** Get current intensity */
  getIntensity: () => number
  /** Trigger a flash effect */
  flash: (duration?: number) => void
  /** Turn backlight on */
  turnOn: () => void
  /** Turn backlight off */
  turnOff: () => void
  /** Toggle backlight */
  toggle: () => void
  /** Check if backlight is on */
  isOn: () => boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TITLE = 'ARCADE'
const DEFAULT_TITLE_SIZE = 0.15
const DEFAULT_EMISSIVE_INTENSITY = 0.8
const DEFAULT_FLICKER_FREQUENCY = 0.5

/** Panel inset from frame */
const PANEL_INSET = 0.01

// ============================================================================
// Sub-components
// ============================================================================

interface BacklightProps {
  width: number
  height: number
  depth: number
  color: string
  intensity: number
  position: [number, number, number]
}

/**
 * Backlight - Internal light source behind marquee panel
 */
function Backlight({ width, height, depth, color, intensity, position }: BacklightProps) {
  return (
    <group position={position}>
      {/* Point light for glow effect */}
      <pointLight
        color={color}
        intensity={intensity * 2}
        distance={2}
        decay={2}
        position={[0, 0, -depth / 2]}
      />

      {/* Emissive backing plane */}
      <mesh position={[0, 0, -depth + 0.01]}>
        <planeGeometry args={[width * 0.9, height * 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  )
}

interface MarqueeFrameProps {
  width: number
  height: number
  depth: number
  frameThickness: number
  color: string
  castShadow: boolean
  receiveShadow: boolean
}

/**
 * MarqueeFrame - The outer housing/frame of the marquee
 */
function MarqueeFrame({
  width,
  height,
  depth,
  frameThickness,
  color,
  castShadow,
  receiveShadow,
}: MarqueeFrameProps) {
  // Create frame geometry using box geometries for each side
  return (
    <group name={MESH_NAMES.marquee.frame}>
      {/* Top frame piece */}
      <mesh
        position={[0, height / 2 - frameThickness / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[width, frameThickness, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Bottom frame piece */}
      <mesh
        position={[0, -height / 2 + frameThickness / 2, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[width, frameThickness, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Left frame piece */}
      <mesh
        position={[-width / 2 + frameThickness / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[frameThickness, height - frameThickness * 2, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Right frame piece */}
      <mesh
        position={[width / 2 - frameThickness / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[frameThickness, height - frameThickness * 2, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Back plate */}
      <mesh
        position={[0, 0, -depth / 2 + 0.01]}
        castShadow={false}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[width - frameThickness * 2, height - frameThickness * 2]} />
        <meshStandardMaterial
          color="#050505"
          roughness={1}
          metalness={0}
        />
      </mesh>
    </group>
  )
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Marquee - Illuminated marquee sign at the top of the arcade cabinet
 *
 * Features:
 * - PlaneGeometry with texture or text display
 * - Emissive material for backlight glow
 * - Configurable title text or custom texture
 * - Backlight with point light source
 * - Optional flickering effect
 * - Positioned at cabinet top with correct angle
 *
 * @example
 * ```tsx
 * // Basic usage with title
 * <Marquee
 *   title="PAC-MAN"
 *   emissiveColor="#ffff00"
 *   emissiveIntensity={0.9}
 * />
 *
 * // With custom texture
 * <Marquee
 *   texture={myTexture}
 *   enableGlow
 * />
 *
 * // With ref for control
 * const marqueeRef = useRef<MarqueeHandle>(null)
 * <Marquee
 *   ref={marqueeRef}
 *   title="GALAGA"
 *   onBacklightChange={(i) => console.log('Intensity:', i)}
 * />
 * marqueeRef.current?.flash() // Trigger flash effect
 * ```
 */
export const Marquee = forwardRef<MarqueeHandle, MarqueeProps>(
  function Marquee(
    {
      position,
      rotation,
      scale = 1,
      title = DEFAULT_TITLE,
      titleSize = DEFAULT_TITLE_SIZE,
      titleColor = '#ffffff',
      frameColor = CABINET_COLORS.marqueeFrame,
      panelColor = '#111111',
      emissiveColor = CABINET_EMISSIVE.marquee,
      emissiveIntensity = DEFAULT_EMISSIVE_INTENSITY,
      enableGlow = true,
      enableFlicker = false,
      flickerFrequency = DEFAULT_FLICKER_FREQUENCY,
      castShadow = true,
      receiveShadow = true,
      texture = null,
      onReady,
      onBacklightChange,
      children,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const [isOn, setIsOn] = useState(true)
    const [currentIntensity, setCurrentIntensity] = useState(emissiveIntensity)
    const flashRef = useRef<{ active: boolean; duration: number; elapsed: number }>({
      active: false,
      duration: 0,
      elapsed: 0,
    })
    const flickerPhase = useRef(0)

    // Marquee dimensions from geometry constants
    const { width, height, depth, angle, frameThickness } = CABINET_MARQUEE

    // Default position from geometry constants
    const defaultPosition: [number, number, number] = [
      MESH_POSITIONS.marquee.x,
      MESH_POSITIONS.marquee.y,
      MESH_POSITIONS.marquee.z,
    ]

    // Marquee angle (tilted forward)
    const marqueeAngleRad = (angle * Math.PI) / 180

    const actualPosition = position ?? defaultPosition
    const actualRotation: [number, number, number] = rotation ?? [marqueeAngleRad, 0, 0]

    // Panel dimensions (inset from frame)
    const panelWidth = width - frameThickness * 2 - PANEL_INSET * 2
    const panelHeight = height - frameThickness * 2 - PANEL_INSET * 2

    // Intensity setter with callback
    const setIntensity = useCallback(
      (intensity: number) => {
        const clamped = Math.max(0, Math.min(1, intensity))
        setCurrentIntensity(clamped)
        onBacklightChange?.(clamped)
      },
      [onBacklightChange]
    )

    // Flash effect trigger
    const flash = useCallback((duration: number = 0.3) => {
      flashRef.current = {
        active: true,
        duration,
        elapsed: 0,
      }
    }, [])

    // Power controls
    const turnOn = useCallback(() => {
      setIsOn(true)
      setIntensity(emissiveIntensity)
    }, [emissiveIntensity, setIntensity])

    const turnOff = useCallback(() => {
      setIsOn(false)
      setIntensity(0)
    }, [setIntensity])

    const toggle = useCallback(() => {
      if (isOn) {
        turnOff()
      } else {
        turnOn()
      }
    }, [isOn, turnOn, turnOff])

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        group: groupRef.current,
        setIntensity,
        getIntensity: () => currentIntensity,
        flash,
        turnOn,
        turnOff,
        toggle,
        isOn: () => isOn,
      }),
      [currentIntensity, flash, isOn, setIntensity, toggle, turnOff, turnOn]
    )

    // Animation frame for flickering and flash effects
    useFrame((_, delta) => {
      if (!isOn) return

      let effectiveIntensity = currentIntensity

      // Flash effect
      if (flashRef.current.active) {
        flashRef.current.elapsed += delta
        const progress = flashRef.current.elapsed / flashRef.current.duration

        if (progress >= 1) {
          flashRef.current.active = false
        } else {
          // Quick flash up then fade
          const flashValue = progress < 0.3
            ? Math.sin(progress / 0.3 * Math.PI / 2)
            : Math.cos((progress - 0.3) / 0.7 * Math.PI / 2)
          effectiveIntensity = Math.min(1, currentIntensity + flashValue * 0.5)
        }
      }

      // Flickering effect
      if (enableFlicker && !flashRef.current.active) {
        flickerPhase.current += delta * flickerFrequency * Math.PI * 2

        // Subtle random flicker simulation
        const flicker = Math.sin(flickerPhase.current) * 0.05 +
          Math.sin(flickerPhase.current * 2.7) * 0.03 +
          Math.sin(flickerPhase.current * 5.3) * 0.02

        effectiveIntensity = Math.max(0, Math.min(1, currentIntensity + flicker))
      }

      // Update intensity if changed
      if (effectiveIntensity !== currentIntensity) {
        setCurrentIntensity(effectiveIntensity)
      }
    })

    // Notify parent when ready
    useMemo(() => {
      if (groupRef.current && onReady) {
        onReady(groupRef.current)
      }
    }, [onReady])

    // Effective intensity for rendering
    const renderIntensity = isOn ? currentIntensity : 0

    return (
      <group
        ref={groupRef}
        name={MESH_NAMES.marquee.group}
        position={actualPosition}
        rotation={actualRotation}
        scale={scale}
      >
        {/* Frame housing */}
        <MarqueeFrame
          width={width}
          height={height}
          depth={depth}
          frameThickness={frameThickness}
          color={frameColor}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />

        {/* Illuminated panel */}
        <mesh
          name={MESH_NAMES.marquee.panel}
          position={[0, 0, depth / 2 - 0.01]}
          castShadow={false}
          receiveShadow={false}
        >
          <planeGeometry args={[panelWidth, panelHeight]} />
          {texture ? (
            <meshStandardMaterial
              map={texture}
              emissive={emissiveColor}
              emissiveIntensity={renderIntensity}
              emissiveMap={texture}
              side={THREE.FrontSide}
              transparent
            />
          ) : (
            <meshStandardMaterial
              color={panelColor}
              emissive={emissiveColor}
              emissiveIntensity={renderIntensity * 0.3}
              roughness={0.9}
              metalness={0.1}
              side={THREE.FrontSide}
            />
          )}
        </mesh>

        {/* Title text (if no texture) */}
        {!texture && title && (
          <Text
            position={[0, 0, depth / 2 + 0.001]}
            fontSize={titleSize}
            color={titleColor}
            anchorX="center"
            anchorY="middle"
            maxWidth={panelWidth * 0.9}
            outlineWidth={0.005}
            outlineColor="#000000"
          >
            {title}
            <meshStandardMaterial
              color={titleColor}
              emissive={titleColor}
              emissiveIntensity={renderIntensity}
            />
          </Text>
        )}

        {/* Backlight glow */}
        {enableGlow && (
          <Backlight
            width={panelWidth}
            height={panelHeight}
            depth={depth}
            color={emissiveColor}
            intensity={renderIntensity}
            position={[0, 0, 0]}
          />
        )}

        {/* Children components */}
        {children}
      </group>
    )
  }
)

// ============================================================================
// Variants
// ============================================================================

export interface SimpleMarqueeProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  title?: string
  color?: string
  emissiveColor?: string
  emissiveIntensity?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

/**
 * SimpleMarquee - A simpler marquee for performance
 *
 * Uses a single plane with emissive material.
 * Good for distant views or lower detail requirements.
 */
export function SimpleMarquee({
  position,
  rotation,
  scale = 1,
  title = DEFAULT_TITLE,
  color = CABINET_COLORS.marqueeFrame,
  emissiveColor = CABINET_EMISSIVE.marquee,
  emissiveIntensity = DEFAULT_EMISSIVE_INTENSITY,
  castShadow = true,
  receiveShadow = true,
}: SimpleMarqueeProps) {
  const { width, height, depth, angle } = CABINET_MARQUEE
  const marqueeAngleRad = (angle * Math.PI) / 180

  const defaultPosition: [number, number, number] = [
    MESH_POSITIONS.marquee.x,
    MESH_POSITIONS.marquee.y,
    MESH_POSITIONS.marquee.z,
  ]

  return (
    <group
      name={MESH_NAMES.marquee.group}
      position={position ?? defaultPosition}
      rotation={rotation ?? [marqueeAngleRad, 0, 0]}
      scale={scale}
    >
      {/* Simple box for frame */}
      <mesh
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Front panel with glow */}
      <mesh position={[0, 0, depth / 2 + 0.001]}>
        <planeGeometry args={[width * 0.85, height * 0.7]} />
        <meshStandardMaterial
          color="#111111"
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity * 0.3}
        />
      </mesh>

      {/* Title text */}
      {title && (
        <Text
          position={[0, 0, depth / 2 + 0.005]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {title}
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={emissiveIntensity}
          />
        </Text>
      )}
    </group>
  )
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseMarqueeOptions {
  /** Initial backlight intensity */
  initialIntensity?: number
  /** Initial on/off state */
  initialOn?: boolean
  /** Callback when intensity changes */
  onIntensityChange?: (intensity: number) => void
}

export interface UseMarqueeResult {
  /** Ref to attach to Marquee */
  ref: React.RefObject<MarqueeHandle>
  /** Current intensity */
  intensity: number
  /** Whether backlight is on */
  isOn: boolean
  /** Set intensity */
  setIntensity: (intensity: number) => void
  /** Turn on */
  turnOn: () => void
  /** Turn off */
  turnOff: () => void
  /** Toggle */
  toggle: () => void
  /** Flash effect */
  flash: (duration?: number) => void
  /** Props to spread onto Marquee */
  marqueeProps: {
    emissiveIntensity: number
    onBacklightChange: (intensity: number) => void
  }
}

/**
 * useMarquee - Hook for controlling marquee backlight
 *
 * @example
 * ```tsx
 * function ArcadeCabinet() {
 *   const marquee = useMarquee({
 *     initialIntensity: 0.8,
 *     onIntensityChange: (i) => console.log('Marquee intensity:', i),
 *   })
 *
 *   return (
 *     <Marquee ref={marquee.ref} {...marquee.marqueeProps} title="GAME" />
 *   )
 * }
 * ```
 */
export function useMarquee(options: UseMarqueeOptions = {}): UseMarqueeResult {
  const {
    initialIntensity = DEFAULT_EMISSIVE_INTENSITY,
    initialOn = true,
    onIntensityChange,
  } = options

  const ref = useRef<MarqueeHandle>(null)
  const [intensity, setIntensityState] = useState(initialIntensity)
  const [isOn, setIsOn] = useState(initialOn)

  const setIntensity = useCallback(
    (value: number) => {
      const clamped = Math.max(0, Math.min(1, value))
      setIntensityState(clamped)
      onIntensityChange?.(clamped)
      ref.current?.setIntensity(clamped)
    },
    [onIntensityChange]
  )

  const turnOn = useCallback(() => {
    setIsOn(true)
    ref.current?.turnOn()
  }, [])

  const turnOff = useCallback(() => {
    setIsOn(false)
    ref.current?.turnOff()
  }, [])

  const toggle = useCallback(() => {
    setIsOn((prev) => !prev)
    ref.current?.toggle()
  }, [])

  const flash = useCallback((duration?: number) => {
    ref.current?.flash(duration)
  }, [])

  const handleIntensityChange = useCallback(
    (value: number) => {
      setIntensityState(value)
      onIntensityChange?.(value)
    },
    [onIntensityChange]
  )

  return {
    ref,
    intensity,
    isOn,
    setIntensity,
    turnOn,
    turnOff,
    toggle,
    flash,
    marqueeProps: {
      emissiveIntensity: intensity,
      onBacklightChange: handleIntensityChange,
    },
  }
}

// ============================================================================
// Preset Configurations
// ============================================================================

export const MARQUEE_PRESETS = {
  /** Classic white backlit marquee */
  classic: {
    emissiveColor: '#ffffff',
    emissiveIntensity: 0.8,
    enableGlow: true,
    enableFlicker: false,
  },

  /** Neon-style colorful marquee */
  neon: {
    emissiveColor: '#ff00ff',
    emissiveIntensity: 1.0,
    enableGlow: true,
    enableFlicker: true,
    flickerFrequency: 0.3,
  },

  /** Retro arcade with subtle flicker */
  retro: {
    emissiveColor: '#ffff88',
    emissiveIntensity: 0.7,
    enableGlow: true,
    enableFlicker: true,
    flickerFrequency: 0.8,
  },

  /** Modern LED backlit */
  modern: {
    emissiveColor: '#00ffff',
    emissiveIntensity: 0.9,
    enableGlow: true,
    enableFlicker: false,
  },

  /** Dim/powered-off look */
  dim: {
    emissiveColor: '#ffffff',
    emissiveIntensity: 0.2,
    enableGlow: false,
    enableFlicker: false,
  },
} as const

export type MarqueePreset = keyof typeof MARQUEE_PRESETS

/**
 * Get marquee preset configuration
 */
export function getMarqueePreset(preset: MarqueePreset) {
  return MARQUEE_PRESETS[preset]
}

// ============================================================================
// Exports
// ============================================================================

export default Marquee
