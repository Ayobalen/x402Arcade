/**
 * Cabinet Materials System
 *
 * A centralized material system for the arcade cabinet with consistent PBR materials
 * and easy customization. All materials use Three.js MeshStandardMaterial for
 * physically-based rendering.
 *
 * @module materials/cabinetMaterials
 */

import * as THREE from 'three'
import { useMemo } from 'react'

// ============================================================================
// Color Palette
// ============================================================================

/**
 * Default color palette for the cabinet
 * These colors follow the Crypto/Web3 Dark aesthetic
 */
export const CABINET_MATERIAL_COLORS = {
  // Main body colors
  body: '#0a0a0f',
  bodyDark: '#050508',
  bodyLight: '#12121a',

  // Bezel/screen frame colors
  bezel: '#050508',
  bezelInner: '#000000',
  bezelEdge: '#1a1a2e',

  // Control panel colors
  controlPanel: '#12121a',
  controlPanelDark: '#0a0a0f',

  // Accent colors
  accentPrimary: '#8B5CF6', // Purple from design system
  accentSecondary: '#00ffff', // Cyan trim
  accentGlow: '#ff00ff', // Magenta glow
  accentWarn: '#ff8800', // Orange warning

  // Button colors (6-button layout)
  buttons: {
    red: '#ff0000',
    orange: '#ff8800',
    yellow: '#ffff00',
    green: '#00ff00',
    blue: '#0088ff',
    purple: '#ff00ff',
  },

  // Utility colors
  joystick: '#ff0000',
  startButton: '#00ff00',
  coinButton: '#ffff00',
  speakerGrille: '#0f0f14',
  coinDoor: '#16161e',
  marqueeFrame: '#1a1a2e',
  trim: '#00ffff',

  // Emissive colors
  emissive: {
    screen: '#00ffff',
    marquee: '#ffffff',
    underGlow: '#ff00ff',
    buttonActive: '#ffffff',
    coinSlot: '#00ff00',
  },
} as const

export type CabinetMaterialColors = typeof CABINET_MATERIAL_COLORS

// ============================================================================
// Material Definitions
// ============================================================================

/**
 * PBR material properties interface
 */
export interface PBRMaterialProps {
  color: string
  roughness: number
  metalness: number
  emissive?: string
  emissiveIntensity?: number
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
}

/**
 * Base cabinet material - used for main body
 * Dark matte finish with subtle sheen
 */
export const BASE_CABINET_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.body,
  roughness: 0.7,
  metalness: 0.1,
}

/**
 * Screen bezel material - darker than body with metallic finish
 * Provides contrast for the screen area
 */
export const SCREEN_BEZEL_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.bezel,
  roughness: 0.3,
  metalness: 0.8,
}

/**
 * Control panel material - slightly lighter than body
 * Medium roughness for comfortable viewing
 */
export const CONTROL_PANEL_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.controlPanel,
  roughness: 0.6,
  metalness: 0.2,
}

/**
 * Metallic accent material - for trim and highlights
 * High metalness with cyan color
 */
export const ACCENT_TRIM_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.trim,
  roughness: 0.3,
  metalness: 0.8,
  emissive: CABINET_MATERIAL_COLORS.trim,
  emissiveIntensity: 0.3,
}

/**
 * Button material factory - creates colored button materials
 */
export const BUTTON_MATERIAL_BASE: Omit<PBRMaterialProps, 'color'> = {
  roughness: 0.4,
  metalness: 0.2,
}

/**
 * Joystick shaft material - metallic chrome-like
 */
export const JOYSTICK_SHAFT_MATERIAL: PBRMaterialProps = {
  color: '#2a2a2a',
  roughness: 0.4,
  metalness: 0.6,
}

/**
 * Joystick ball material - plastic-like with slight glow
 */
export const JOYSTICK_BALL_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.joystick,
  roughness: 0.3,
  metalness: 0.1,
  emissive: CABINET_MATERIAL_COLORS.joystick,
  emissiveIntensity: 0.05,
}

/**
 * Joystick base material - dark metallic housing
 */
export const JOYSTICK_BASE_MATERIAL: PBRMaterialProps = {
  color: '#1a1a1a',
  roughness: 0.5,
  metalness: 0.8,
}

/**
 * Speaker grille material - dark with perforated look
 */
export const SPEAKER_GRILLE_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.speakerGrille,
  roughness: 0.8,
  metalness: 0.3,
}

/**
 * Marquee frame material - dark with purple tint
 */
export const MARQUEE_FRAME_MATERIAL: PBRMaterialProps = {
  color: CABINET_MATERIAL_COLORS.marqueeFrame,
  roughness: 0.5,
  metalness: 0.4,
}

/**
 * Glass material - for screen overlay
 */
export const GLASS_MATERIAL: PBRMaterialProps = {
  color: '#ffffff',
  roughness: 0.05,
  metalness: 0.9,
  transparent: true,
  opacity: 0.1,
}

/**
 * Interior/shadow material - pure black
 */
export const INTERIOR_MATERIAL: PBRMaterialProps = {
  color: '#000000',
  roughness: 1,
  metalness: 0,
}

// ============================================================================
// Material Factory Functions
// ============================================================================

/**
 * Create a Three.js MeshStandardMaterial from PBR properties
 */
export function createMaterial(props: PBRMaterialProps): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: props.color,
    roughness: props.roughness,
    metalness: props.metalness,
    emissive: props.emissive ?? '#000000',
    emissiveIntensity: props.emissiveIntensity ?? 0,
    transparent: props.transparent ?? false,
    opacity: props.opacity ?? 1,
    side: props.side ?? THREE.FrontSide,
  })
}

/**
 * Create a button material with the specified color
 */
export function createButtonMaterial(
  color: string,
  emissiveIntensity: number = 0.1
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: BUTTON_MATERIAL_BASE.roughness,
    metalness: BUTTON_MATERIAL_BASE.metalness,
    emissive: color,
    emissiveIntensity,
  })
}

/**
 * Create all 6 button materials from the default palette
 */
export function createButtonMaterials(): THREE.MeshStandardMaterial[] {
  const colors = Object.values(CABINET_MATERIAL_COLORS.buttons)
  return colors.map((color) => createButtonMaterial(color))
}

/**
 * Create a customized cabinet material with color override
 */
export function createCustomCabinetMaterial(
  baseMaterial: PBRMaterialProps,
  colorOverride?: string
): THREE.MeshStandardMaterial {
  return createMaterial({
    ...baseMaterial,
    color: colorOverride ?? baseMaterial.color,
  })
}

// ============================================================================
// Material Customization
// ============================================================================

/**
 * Options for customizing cabinet materials
 */
export interface CabinetMaterialOptions {
  /** Override body color */
  bodyColor?: string
  /** Override bezel color */
  bezelColor?: string
  /** Override control panel color */
  controlPanelColor?: string
  /** Override accent/trim color */
  accentColor?: string
  /** Override button colors (array of 6) */
  buttonColors?: string[]
  /** Override joystick color */
  joystickColor?: string
  /** Global roughness modifier (-1 to 1) */
  roughnessModifier?: number
  /** Global metalness modifier (-1 to 1) */
  metalnessModifier?: number
  /** Enable/disable emissive effects */
  emissiveEnabled?: boolean
  /** Global emissive intensity multiplier */
  emissiveMultiplier?: number
}

/**
 * Apply modifiers to material properties
 */
function applyModifiers(
  props: PBRMaterialProps,
  options: CabinetMaterialOptions
): PBRMaterialProps {
  const roughnessModifier = options.roughnessModifier ?? 0
  const metalnessModifier = options.metalnessModifier ?? 0
  const emissiveMultiplier = options.emissiveMultiplier ?? 1
  const emissiveEnabled = options.emissiveEnabled ?? true

  return {
    ...props,
    roughness: Math.max(0, Math.min(1, props.roughness + roughnessModifier)),
    metalness: Math.max(0, Math.min(1, props.metalness + metalnessModifier)),
    emissiveIntensity: emissiveEnabled
      ? (props.emissiveIntensity ?? 0) * emissiveMultiplier
      : 0,
  }
}

/**
 * Create a complete set of cabinet materials with customization
 */
export function createCabinetMaterialSet(
  options: CabinetMaterialOptions = {}
): CabinetMaterialSet {
  const {
    bodyColor,
    bezelColor,
    controlPanelColor,
    accentColor,
    buttonColors,
    joystickColor,
  } = options

  return {
    body: createMaterial(
      applyModifiers(
        { ...BASE_CABINET_MATERIAL, color: bodyColor ?? BASE_CABINET_MATERIAL.color },
        options
      )
    ),
    bezel: createMaterial(
      applyModifiers(
        { ...SCREEN_BEZEL_MATERIAL, color: bezelColor ?? SCREEN_BEZEL_MATERIAL.color },
        options
      )
    ),
    controlPanel: createMaterial(
      applyModifiers(
        {
          ...CONTROL_PANEL_MATERIAL,
          color: controlPanelColor ?? CONTROL_PANEL_MATERIAL.color,
        },
        options
      )
    ),
    accent: createMaterial(
      applyModifiers(
        { ...ACCENT_TRIM_MATERIAL, color: accentColor ?? ACCENT_TRIM_MATERIAL.color },
        options
      )
    ),
    buttons: (buttonColors ?? Object.values(CABINET_MATERIAL_COLORS.buttons)).map(
      (color) =>
        createMaterial(
          applyModifiers(
            {
              ...BUTTON_MATERIAL_BASE,
              color,
              emissive: color,
              emissiveIntensity: 0.1,
            },
            options
          )
        )
    ),
    joystick: {
      base: createMaterial(applyModifiers(JOYSTICK_BASE_MATERIAL, options)),
      shaft: createMaterial(applyModifiers(JOYSTICK_SHAFT_MATERIAL, options)),
      ball: createMaterial(
        applyModifiers(
          {
            ...JOYSTICK_BALL_MATERIAL,
            color: joystickColor ?? JOYSTICK_BALL_MATERIAL.color,
          },
          options
        )
      ),
    },
    speaker: createMaterial(applyModifiers(SPEAKER_GRILLE_MATERIAL, options)),
    marquee: createMaterial(applyModifiers(MARQUEE_FRAME_MATERIAL, options)),
    glass: createMaterial(applyModifiers(GLASS_MATERIAL, options)),
    interior: createMaterial(INTERIOR_MATERIAL),
  }
}

/**
 * Complete material set for a cabinet
 */
export interface CabinetMaterialSet {
  body: THREE.MeshStandardMaterial
  bezel: THREE.MeshStandardMaterial
  controlPanel: THREE.MeshStandardMaterial
  accent: THREE.MeshStandardMaterial
  buttons: THREE.MeshStandardMaterial[]
  joystick: {
    base: THREE.MeshStandardMaterial
    shaft: THREE.MeshStandardMaterial
    ball: THREE.MeshStandardMaterial
  }
  speaker: THREE.MeshStandardMaterial
  marquee: THREE.MeshStandardMaterial
  glass: THREE.MeshStandardMaterial
  interior: THREE.MeshStandardMaterial
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Hook to create and memoize a single cabinet material
 */
export function useCabinetMaterial(
  materialType: keyof Omit<CabinetMaterialSet, 'buttons' | 'joystick'>,
  colorOverride?: string,
  options?: CabinetMaterialOptions
): THREE.MeshStandardMaterial {
  return useMemo(() => {
    const materialDefs: Record<string, PBRMaterialProps> = {
      body: BASE_CABINET_MATERIAL,
      bezel: SCREEN_BEZEL_MATERIAL,
      controlPanel: CONTROL_PANEL_MATERIAL,
      accent: ACCENT_TRIM_MATERIAL,
      speaker: SPEAKER_GRILLE_MATERIAL,
      marquee: MARQUEE_FRAME_MATERIAL,
      glass: GLASS_MATERIAL,
      interior: INTERIOR_MATERIAL,
    }

    const baseMaterial = materialDefs[materialType]
    if (!baseMaterial) {
      throw new Error(`Unknown material type: ${materialType}`)
    }

    const props = options
      ? applyModifiers(
          { ...baseMaterial, color: colorOverride ?? baseMaterial.color },
          options
        )
      : { ...baseMaterial, color: colorOverride ?? baseMaterial.color }

    return createMaterial(props)
  }, [materialType, colorOverride, options])
}

/**
 * Hook to create and memoize a complete cabinet material set
 */
export function useCabinetMaterialSet(
  options: CabinetMaterialOptions = {}
): CabinetMaterialSet {
  return useMemo(() => createCabinetMaterialSet(options), [
    options.bodyColor,
    options.bezelColor,
    options.controlPanelColor,
    options.accentColor,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    options.buttonColors?.join(','),
    options.joystickColor,
    options.roughnessModifier,
    options.metalnessModifier,
    options.emissiveEnabled,
    options.emissiveMultiplier,
  ])
}

/**
 * Hook to create button materials
 */
export function useButtonMaterials(
  colors?: string[],
  emissiveIntensity?: number
): THREE.MeshStandardMaterial[] {
  return useMemo(() => {
    const buttonColors = colors ?? Object.values(CABINET_MATERIAL_COLORS.buttons)
    return buttonColors.map((color) => createButtonMaterial(color, emissiveIntensity))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors?.join(','), emissiveIntensity])
}

// ============================================================================
// Material Utilities
// ============================================================================

/**
 * Dispose all materials in a cabinet material set
 */
export function disposeCabinetMaterialSet(set: CabinetMaterialSet): void {
  set.body.dispose()
  set.bezel.dispose()
  set.controlPanel.dispose()
  set.accent.dispose()
  set.buttons.forEach((m) => m.dispose())
  set.joystick.base.dispose()
  set.joystick.shaft.dispose()
  set.joystick.ball.dispose()
  set.speaker.dispose()
  set.marquee.dispose()
  set.glass.dispose()
  set.interior.dispose()
}

/**
 * Clone a material with optional property overrides
 */
export function cloneMaterial(
  material: THREE.MeshStandardMaterial,
  overrides?: Partial<PBRMaterialProps>
): THREE.MeshStandardMaterial {
  const cloned = material.clone()

  if (overrides) {
    if (overrides.color) cloned.color.set(overrides.color)
    if (overrides.roughness !== undefined) cloned.roughness = overrides.roughness
    if (overrides.metalness !== undefined) cloned.metalness = overrides.metalness
    if (overrides.emissive) cloned.emissive.set(overrides.emissive)
    if (overrides.emissiveIntensity !== undefined) {
      cloned.emissiveIntensity = overrides.emissiveIntensity
    }
    if (overrides.transparent !== undefined) cloned.transparent = overrides.transparent
    if (overrides.opacity !== undefined) cloned.opacity = overrides.opacity
    if (overrides.side !== undefined) cloned.side = overrides.side
  }

  return cloned
}

/**
 * Set material color with animation support (returns update function)
 */
export function createColorAnimator(
  material: THREE.MeshStandardMaterial,
  targetColor: THREE.Color | string
): (progress: number) => void {
  const startColor = material.color.clone()
  const endColor =
    targetColor instanceof THREE.Color
      ? targetColor
      : new THREE.Color(targetColor)

  return (progress: number) => {
    const t = Math.max(0, Math.min(1, progress))
    material.color.lerpColors(startColor, endColor, t)
  }
}

// ============================================================================
// Preset Material Themes
// ============================================================================

/**
 * Preset cabinet themes for quick customization
 */
export const CABINET_THEMES = {
  /** Default dark arcade theme */
  default: {} as CabinetMaterialOptions,

  /** Classic black and red theme */
  classic: {
    bodyColor: '#1a1a1a',
    bezelColor: '#0a0a0a',
    accentColor: '#ff0000',
    joystickColor: '#ff0000',
    buttonColors: ['#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000', '#ff0000'],
  } as CabinetMaterialOptions,

  /** Neon cyberpunk theme */
  cyberpunk: {
    bodyColor: '#0f0f1a',
    bezelColor: '#050510',
    accentColor: '#00ffff',
    joystickColor: '#ff00ff',
    buttonColors: ['#ff00ff', '#00ffff', '#ff00ff', '#00ffff', '#ff00ff', '#00ffff'],
    emissiveMultiplier: 1.5,
  } as CabinetMaterialOptions,

  /** Retro 80s pastel theme */
  retro: {
    bodyColor: '#2d2d4a',
    bezelColor: '#1a1a2e',
    accentColor: '#ff8888',
    joystickColor: '#88ff88',
    buttonColors: ['#ff8888', '#88ff88', '#8888ff', '#ffff88', '#88ffff', '#ff88ff'],
  } as CabinetMaterialOptions,

  /** Minimalist white theme */
  minimal: {
    bodyColor: '#f0f0f0',
    bezelColor: '#ffffff',
    controlPanelColor: '#e0e0e0',
    accentColor: '#333333',
    joystickColor: '#333333',
    buttonColors: ['#333333', '#333333', '#333333', '#333333', '#333333', '#333333'],
    emissiveEnabled: false,
    roughnessModifier: 0.2,
    metalnessModifier: -0.3,
  } as CabinetMaterialOptions,
} as const

export type CabinetTheme = keyof typeof CABINET_THEMES

/**
 * Get material options for a preset theme
 */
export function getThemeMaterialOptions(theme: CabinetTheme): CabinetMaterialOptions {
  return CABINET_THEMES[theme]
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  colors: CABINET_MATERIAL_COLORS,
  materials: {
    body: BASE_CABINET_MATERIAL,
    bezel: SCREEN_BEZEL_MATERIAL,
    controlPanel: CONTROL_PANEL_MATERIAL,
    accent: ACCENT_TRIM_MATERIAL,
    joystickBase: JOYSTICK_BASE_MATERIAL,
    joystickShaft: JOYSTICK_SHAFT_MATERIAL,
    joystickBall: JOYSTICK_BALL_MATERIAL,
    speaker: SPEAKER_GRILLE_MATERIAL,
    marquee: MARQUEE_FRAME_MATERIAL,
    glass: GLASS_MATERIAL,
    interior: INTERIOR_MATERIAL,
  },
  themes: CABINET_THEMES,
  createMaterial,
  createButtonMaterial,
  createButtonMaterials,
  createCabinetMaterialSet,
  disposeCabinetMaterialSet,
  cloneMaterial,
  createColorAnimator,
  getThemeMaterialOptions,
}
