/**
 * Neon Glow Materials System
 *
 * Custom neon glow materials using emissive properties for authentic arcade glow effects.
 * Designed to work with bloom post-processing for enhanced visual impact.
 *
 * The neon aesthetic is achieved through high emissive intensity values which,
 * when combined with bloom post-processing, create the characteristic glow effect
 * of arcade cabinet lighting.
 *
 * @module materials/neonMaterials
 */

import * as THREE from 'three'
import { useMemo, useCallback } from 'react'

// ============================================================================
// Neon Color Definitions
// ============================================================================

/**
 * Neon color palette for glow materials
 * Colors are designed for maximum visual impact with bloom post-processing
 */
export const NEON_COLORS = {
  /** Primary cyan - signature arcade color */
  cyan: '#00ffff',
  /** Secondary magenta - complementary neon */
  magenta: '#ff00ff',
  /** Accent green - success/active states */
  green: '#00ff88',
  /** Warning orange - caution states */
  orange: '#ffaa00',
  /** Error red - alert states */
  red: '#ff3366',
  /** Info blue - informational states */
  blue: '#3388ff',
  /** Pure white - maximum brightness */
  white: '#ffffff',
  /** Purple accent - brand color */
  purple: '#8B5CF6',
  /** Yellow highlight - attention grabber */
  yellow: '#ffff00',
} as const

export type NeonColor = keyof typeof NEON_COLORS

// ============================================================================
// Emissive Intensity Presets
// ============================================================================

/**
 * Emissive intensity presets for different use cases
 * Higher values create more intense glow when combined with bloom
 */
export const NEON_INTENSITY = {
  /** Subtle glow - ambient lighting, inactive states (0.5) */
  subtle: 0.5,
  /** Low glow - background elements, secondary accents (1.0) */
  low: 1.0,
  /** Medium glow - standard neon elements, buttons (2.0) */
  medium: 2.0,
  /** High glow - active states, focused elements (3.0) */
  high: 3.0,
  /** Intense glow - hero elements, maximum impact (4.0) */
  intense: 4.0,
  /** Blinding glow - special effects, transitions (6.0) */
  blinding: 6.0,
} as const

export type NeonIntensityLevel = keyof typeof NEON_INTENSITY

// ============================================================================
// Neon Material Properties Interface
// ============================================================================

/**
 * Properties for creating neon glow materials
 */
export interface NeonMaterialProps {
  /** Base color of the material */
  color: string
  /** Emissive color (defaults to base color for pure neon effect) */
  emissive?: string
  /** Emissive intensity for glow effect */
  emissiveIntensity: number
  /** Surface roughness (lower = shinier, higher = more diffuse glow) */
  roughness?: number
  /** Metalness (typically low for neon lights) */
  metalness?: number
  /** Transparency enabled */
  transparent?: boolean
  /** Opacity level */
  opacity?: number
  /** Render both sides of geometry */
  side?: THREE.Side
  /** Enable flat shading for stylized look */
  flatShading?: boolean
}

// ============================================================================
// Pre-defined Neon Material Configurations
// ============================================================================

/**
 * Cyan neon glow material configuration
 * Primary arcade color for main accents and highlights
 */
export const CYAN_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.cyan,
  emissive: NEON_COLORS.cyan,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * Magenta neon glow material configuration
 * Secondary arcade color for complementary accents
 */
export const MAGENTA_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.magenta,
  emissive: NEON_COLORS.magenta,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * Green neon glow material configuration
 * Used for success states and positive feedback
 */
export const GREEN_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.green,
  emissive: NEON_COLORS.green,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * Orange neon glow material configuration
 * Used for warning states and caution indicators
 */
export const ORANGE_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.orange,
  emissive: NEON_COLORS.orange,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * Red neon glow material configuration
 * Used for error states and alerts
 */
export const RED_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.red,
  emissive: NEON_COLORS.red,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * Purple neon glow material configuration
 * Brand color accent for x402Arcade theme
 */
export const PURPLE_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.purple,
  emissive: NEON_COLORS.purple,
  emissiveIntensity: NEON_INTENSITY.medium,
  roughness: 0.2,
  metalness: 0.1,
}

/**
 * White neon glow material configuration
 * Maximum brightness for hero elements
 */
export const WHITE_GLOW_MATERIAL: NeonMaterialProps = {
  color: NEON_COLORS.white,
  emissive: NEON_COLORS.white,
  emissiveIntensity: NEON_INTENSITY.high,
  roughness: 0.1,
  metalness: 0.0,
}

// ============================================================================
// Material Factory Functions
// ============================================================================

/**
 * Create a neon glow material from properties
 *
 * @param props - Neon material properties
 * @returns Three.js MeshStandardMaterial configured for neon glow
 *
 * @example
 * ```ts
 * const glowMaterial = createNeonMaterial({
 *   color: '#00ffff',
 *   emissiveIntensity: 2.0,
 * })
 * ```
 */
export function createNeonMaterial(props: NeonMaterialProps): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: props.color,
    emissive: props.emissive ?? props.color,
    emissiveIntensity: props.emissiveIntensity,
    roughness: props.roughness ?? 0.2,
    metalness: props.metalness ?? 0.1,
    transparent: props.transparent ?? false,
    opacity: props.opacity ?? 1,
    side: props.side ?? THREE.FrontSide,
    flatShading: props.flatShading ?? false,
    toneMapped: false, // Important: disable tone mapping for proper bloom
  })
}

/**
 * Create a cyan neon glow material
 *
 * @param intensity - Optional intensity level (default: medium)
 * @returns Cyan neon material
 */
export function createCyanGlowMaterial(
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  return createNeonMaterial({
    ...CYAN_GLOW_MATERIAL,
    emissiveIntensity: NEON_INTENSITY[intensity],
  })
}

/**
 * Create a magenta neon glow material
 *
 * @param intensity - Optional intensity level (default: medium)
 * @returns Magenta neon material
 */
export function createMagentaGlowMaterial(
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  return createNeonMaterial({
    ...MAGENTA_GLOW_MATERIAL,
    emissiveIntensity: NEON_INTENSITY[intensity],
  })
}

/**
 * Create a neon material for any predefined color
 *
 * @param colorName - Name of the neon color
 * @param intensity - Optional intensity level (default: medium)
 * @returns Neon material with specified color
 */
export function createNeonColorMaterial(
  colorName: NeonColor,
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  const color = NEON_COLORS[colorName]
  return createNeonMaterial({
    color,
    emissive: color,
    emissiveIntensity: NEON_INTENSITY[intensity],
    roughness: 0.2,
    metalness: 0.1,
  })
}

/**
 * Create a custom neon material with specific color
 *
 * @param hexColor - Hex color string (e.g., '#ff00ff')
 * @param intensity - Emissive intensity value
 * @returns Custom neon material
 */
export function createCustomNeonMaterial(
  hexColor: string,
  intensity: number = NEON_INTENSITY.medium
): THREE.MeshStandardMaterial {
  return createNeonMaterial({
    color: hexColor,
    emissive: hexColor,
    emissiveIntensity: intensity,
    roughness: 0.2,
    metalness: 0.1,
  })
}

// ============================================================================
// Animated Glow Materials
// ============================================================================

/**
 * Animation parameters for glow effects
 */
export interface GlowAnimationParams {
  /** Minimum intensity during animation */
  minIntensity: number
  /** Maximum intensity during animation */
  maxIntensity: number
  /** Animation speed in Hz (cycles per second) */
  frequency: number
  /** Animation easing type */
  easing: 'sine' | 'linear' | 'pulse'
}

/**
 * Default animation parameters for subtle pulsing
 */
export const DEFAULT_GLOW_ANIMATION: GlowAnimationParams = {
  minIntensity: NEON_INTENSITY.low,
  maxIntensity: NEON_INTENSITY.high,
  frequency: 0.5,
  easing: 'sine',
}

/**
 * Preset animation configurations
 */
export const GLOW_ANIMATIONS = {
  /** Subtle breathing effect */
  breathing: {
    minIntensity: NEON_INTENSITY.low,
    maxIntensity: NEON_INTENSITY.medium,
    frequency: 0.3,
    easing: 'sine' as const,
  },
  /** Slow pulsing */
  pulse: {
    minIntensity: NEON_INTENSITY.subtle,
    maxIntensity: NEON_INTENSITY.high,
    frequency: 0.5,
    easing: 'sine' as const,
  },
  /** Fast flicker */
  flicker: {
    minIntensity: NEON_INTENSITY.medium,
    maxIntensity: NEON_INTENSITY.intense,
    frequency: 8.0,
    easing: 'pulse' as const,
  },
  /** Alert strobe */
  strobe: {
    minIntensity: 0,
    maxIntensity: NEON_INTENSITY.blinding,
    frequency: 4.0,
    easing: 'pulse' as const,
  },
  /** Heartbeat rhythm */
  heartbeat: {
    minIntensity: NEON_INTENSITY.low,
    maxIntensity: NEON_INTENSITY.intense,
    frequency: 1.0,
    easing: 'pulse' as const,
  },
} as const

export type GlowAnimationType = keyof typeof GLOW_ANIMATIONS

/**
 * Calculate animated intensity value based on time
 *
 * @param time - Current time in seconds
 * @param params - Animation parameters
 * @returns Calculated intensity value
 */
export function calculateAnimatedIntensity(
  time: number,
  params: GlowAnimationParams
): number {
  const { minIntensity, maxIntensity, frequency, easing } = params
  const range = maxIntensity - minIntensity
  const phase = time * frequency * Math.PI * 2

  let factor: number
  switch (easing) {
    case 'linear':
      factor = ((Math.sin(phase) + 1) / 2)
      break
    case 'pulse':
      // Sharp pulse effect
      factor = Math.pow((Math.sin(phase) + 1) / 2, 3)
      break
    case 'sine':
    default:
      // Smooth sine wave
      factor = (Math.sin(phase) + 1) / 2
      break
  }

  return minIntensity + range * factor
}

/**
 * Create an animated glow material with update function
 *
 * @param baseProps - Base neon material properties
 * @param animationParams - Animation parameters
 * @returns Object with material and update function
 */
export function createAnimatedGlowMaterial(
  baseProps: NeonMaterialProps,
  animationParams: GlowAnimationParams = DEFAULT_GLOW_ANIMATION
): {
  material: THREE.MeshStandardMaterial
  update: (time: number) => void
  dispose: () => void
} {
  const material = createNeonMaterial(baseProps)

  const update = (time: number) => {
    material.emissiveIntensity = calculateAnimatedIntensity(time, animationParams)
  }

  const dispose = () => {
    material.dispose()
  }

  return { material, update, dispose }
}

// ============================================================================
// React Hooks for Neon Materials
// ============================================================================

/**
 * Hook to create and memoize a neon glow material
 *
 * @param color - Neon color name or hex color string
 * @param intensity - Intensity level
 * @returns Memoized neon material
 */
export function useNeonMaterial(
  color: NeonColor | string,
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  return useMemo(() => {
    const hexColor = color in NEON_COLORS
      ? NEON_COLORS[color as NeonColor]
      : color
    return createCustomNeonMaterial(hexColor, NEON_INTENSITY[intensity])
  }, [color, intensity])
}

/**
 * Hook for creating an animated glow material with automatic updates
 *
 * Returns a material and an update function. The update function should be called
 * in a useFrame hook or animation loop to animate the glow intensity.
 *
 * @param color - Neon color name or hex color string
 * @param animationType - Preset animation type
 * @returns Object with material and update function
 *
 * @example
 * ```tsx
 * function AnimatedNeon() {
 *   const { material, update } = useAnimatedNeonMaterial('cyan', 'pulse')
 *
 *   useFrame((state) => {
 *     update(state.clock.elapsedTime)
 *   })
 *
 *   return <mesh material={material}><boxGeometry /></mesh>
 * }
 * ```
 */
export function useAnimatedNeonMaterial(
  color: NeonColor | string,
  animationType: GlowAnimationType = 'pulse'
): {
  material: THREE.MeshStandardMaterial
  update: (time: number) => void
} {
  const hexColor = color in NEON_COLORS
    ? NEON_COLORS[color as NeonColor]
    : color

  // Create material with useMemo to ensure stable reference
  const material = useMemo(() => {
    return createNeonMaterial({
      color: hexColor,
      emissive: hexColor,
      emissiveIntensity: NEON_INTENSITY.medium,
      roughness: 0.2,
      metalness: 0.1,
    })
  }, [hexColor])

  const animationParams = GLOW_ANIMATIONS[animationType]

  // Return a stable update function
  // Note: The update function modifies the Three.js material object which is
  // intentionally mutable (this is how Three.js works, outside of React's model)
  const update = useCallback((time: number) => {
    // eslint-disable-next-line react-hooks/immutability
    material.emissiveIntensity = calculateAnimatedIntensity(time, animationParams)
  }, [material, animationParams])

  return { material, update }
}

/**
 * Hook to create cyan glow material
 *
 * @param intensity - Intensity level (default: medium)
 * @returns Memoized cyan glow material
 */
export function useCyanGlowMaterial(
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  return useNeonMaterial('cyan', intensity)
}

/**
 * Hook to create magenta glow material
 *
 * @param intensity - Intensity level (default: medium)
 * @returns Memoized magenta glow material
 */
export function useMagentaGlowMaterial(
  intensity: NeonIntensityLevel = 'medium'
): THREE.MeshStandardMaterial {
  return useNeonMaterial('magenta', intensity)
}

// ============================================================================
// Material Utilities
// ============================================================================

/**
 * Set the glow intensity of a neon material
 *
 * @param material - The neon material to modify
 * @param intensity - New intensity value or level name
 */
export function setGlowIntensity(
  material: THREE.MeshStandardMaterial,
  intensity: number | NeonIntensityLevel
): void {
  const value = typeof intensity === 'number'
    ? intensity
    : NEON_INTENSITY[intensity]
  material.emissiveIntensity = value
}

/**
 * Set the glow color of a neon material
 *
 * @param material - The neon material to modify
 * @param color - New color (hex string or NeonColor name)
 */
export function setGlowColor(
  material: THREE.MeshStandardMaterial,
  color: NeonColor | string
): void {
  const hexColor = color in NEON_COLORS
    ? NEON_COLORS[color as NeonColor]
    : color
  material.color.set(hexColor)
  material.emissive.set(hexColor)
}

/**
 * Clone a neon material with optional overrides
 *
 * @param material - Source material to clone
 * @param overrides - Optional property overrides
 * @returns New cloned material
 */
export function cloneNeonMaterial(
  material: THREE.MeshStandardMaterial,
  overrides?: Partial<NeonMaterialProps>
): THREE.MeshStandardMaterial {
  const cloned = material.clone()

  if (overrides) {
    if (overrides.color) cloned.color.set(overrides.color)
    if (overrides.emissive) cloned.emissive.set(overrides.emissive)
    if (overrides.emissiveIntensity !== undefined) {
      cloned.emissiveIntensity = overrides.emissiveIntensity
    }
    if (overrides.roughness !== undefined) cloned.roughness = overrides.roughness
    if (overrides.metalness !== undefined) cloned.metalness = overrides.metalness
    if (overrides.transparent !== undefined) cloned.transparent = overrides.transparent
    if (overrides.opacity !== undefined) cloned.opacity = overrides.opacity
    if (overrides.side !== undefined) cloned.side = overrides.side
  }

  return cloned
}

/**
 * Create a complete set of neon materials for all predefined colors
 *
 * @param intensity - Intensity level for all materials
 * @returns Object mapping color names to materials
 */
export function createNeonMaterialSet(
  intensity: NeonIntensityLevel = 'medium'
): Record<NeonColor, THREE.MeshStandardMaterial> {
  const colors = Object.keys(NEON_COLORS) as NeonColor[]
  return colors.reduce((acc, colorName) => {
    acc[colorName] = createNeonColorMaterial(colorName, intensity)
    return acc
  }, {} as Record<NeonColor, THREE.MeshStandardMaterial>)
}

/**
 * Dispose all materials in a neon material set
 *
 * @param set - Material set to dispose
 */
export function disposeNeonMaterialSet(
  set: Record<NeonColor, THREE.MeshStandardMaterial>
): void {
  Object.values(set).forEach((material) => material.dispose())
}

// ============================================================================
// Performance Optimization Utilities
// ============================================================================

/**
 * Pooled material cache for performance optimization
 * Reuses materials with identical properties to reduce memory usage
 */
const materialCache = new Map<string, THREE.MeshStandardMaterial>()

/**
 * Get or create a cached neon material
 * Useful for components that use many identical materials
 *
 * @param color - Hex color string
 * @param intensity - Emissive intensity
 * @returns Cached or newly created material
 */
export function getCachedNeonMaterial(
  color: string,
  intensity: number
): THREE.MeshStandardMaterial {
  const key = `${color}-${intensity}`

  if (!materialCache.has(key)) {
    materialCache.set(key, createCustomNeonMaterial(color, intensity))
  }

  return materialCache.get(key)!
}

/**
 * Clear the material cache and dispose all cached materials
 * Call this when the 3D scene is unmounted
 */
export function clearNeonMaterialCache(): void {
  materialCache.forEach((material) => material.dispose())
  materialCache.clear()
}

/**
 * Get the current size of the material cache
 *
 * @returns Number of cached materials
 */
export function getNeonMaterialCacheSize(): number {
  return materialCache.size
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  colors: NEON_COLORS,
  intensity: NEON_INTENSITY,
  materials: {
    cyan: CYAN_GLOW_MATERIAL,
    magenta: MAGENTA_GLOW_MATERIAL,
    green: GREEN_GLOW_MATERIAL,
    orange: ORANGE_GLOW_MATERIAL,
    red: RED_GLOW_MATERIAL,
    purple: PURPLE_GLOW_MATERIAL,
    white: WHITE_GLOW_MATERIAL,
  },
  animations: GLOW_ANIMATIONS,
  createNeonMaterial,
  createCyanGlowMaterial,
  createMagentaGlowMaterial,
  createNeonColorMaterial,
  createCustomNeonMaterial,
  createAnimatedGlowMaterial,
  calculateAnimatedIntensity,
  setGlowIntensity,
  setGlowColor,
  cloneNeonMaterial,
  createNeonMaterialSet,
  disposeNeonMaterialSet,
  getCachedNeonMaterial,
  clearNeonMaterialCache,
}
