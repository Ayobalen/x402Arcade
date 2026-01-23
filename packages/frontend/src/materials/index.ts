/**
 * Materials Module
 *
 * Centralized material definitions for 3D components.
 *
 * @module materials
 */

// Cabinet materials
export {
  // Colors
  CABINET_MATERIAL_COLORS,
  type CabinetMaterialColors,
  // Material definitions
  BASE_CABINET_MATERIAL,
  SCREEN_BEZEL_MATERIAL,
  CONTROL_PANEL_MATERIAL,
  ACCENT_TRIM_MATERIAL,
  BUTTON_MATERIAL_BASE,
  JOYSTICK_SHAFT_MATERIAL,
  JOYSTICK_BALL_MATERIAL,
  JOYSTICK_BASE_MATERIAL,
  SPEAKER_GRILLE_MATERIAL,
  MARQUEE_FRAME_MATERIAL,
  GLASS_MATERIAL,
  INTERIOR_MATERIAL,
  // Factory functions
  createMaterial,
  createButtonMaterial,
  createButtonMaterials,
  createCustomCabinetMaterial,
  createCabinetMaterialSet,
  // Types
  type PBRMaterialProps,
  type CabinetMaterialOptions,
  type CabinetMaterialSet,
  // Hooks
  useCabinetMaterial,
  useCabinetMaterialSet,
  useButtonMaterials,
  // Utilities
  disposeCabinetMaterialSet,
  cloneMaterial,
  createColorAnimator,
  // Themes
  CABINET_THEMES,
  type CabinetTheme,
  getThemeMaterialOptions,
  // Default export
  default as cabinetMaterials,
} from './cabinetMaterials'
