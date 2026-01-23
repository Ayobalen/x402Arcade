/**
 * Arcade Cabinet 3D Components
 *
 * This module contains all 3D components and utilities for rendering
 * the arcade cabinet model in the x402Arcade application.
 *
 * @module 3d/cabinet
 */

// Geometry definitions and constants
export {
  // Body dimensions
  CABINET_BODY,
  // Screen dimensions
  CABINET_SCREEN,
  // Control panel dimensions
  CABINET_CONTROLS,
  // Marquee dimensions
  CABINET_MARQUEE,
  // Speaker dimensions
  CABINET_SPEAKER,
  // Side art dimensions
  CABINET_SIDE_ART,
  // T-molding/trim dimensions
  CABINET_TRIM,
  // Coin door dimensions
  CABINET_COIN_DOOR,
  // Mesh names for hierarchy
  MESH_NAMES,
  // Pre-calculated mesh positions
  MESH_POSITIONS,
  // Material colors
  CABINET_COLORS,
  // Emissive/glow colors
  CABINET_EMISSIVE,
  // Utility functions
  getCabinetDimensions,
  getScreenOuterDimensions,
  getCabinetBoundingBox,
  getOptimalCameraPosition,
  getButtonPositions,
  // Types
  type CabinetDimensions,
  type CabinetPosition,
  type CabinetMeshNames,
  type CabinetColors,
  // Default export
  default as ArcadeCabinetGeometry,
} from './ArcadeCabinetGeometry';

// Cabinet Body Component
export {
  CabinetBody,
  SimpleCabinetBody,
  useCabinetBody,
  type CabinetBodyProps,
  type CabinetBodyHandle,
  type SimpleCabinetBodyProps,
  type UseCabinetBodyOptions,
  type UseCabinetBodyResult,
  default as CabinetBodyDefault,
} from './CabinetBody';

// Screen Bezel Component
export {
  ScreenBezel,
  SimpleScreenBezel,
  useScreenBezel,
  type ScreenBezelProps,
  type ScreenBezelHandle,
  type SimpleScreenBezelProps,
  type UseScreenBezelOptions,
  type UseScreenBezelResult,
  default as ScreenBezelDefault,
} from './ScreenBezel';

// Control Panel Component
export {
  ControlPanel,
  SimpleControlPanel,
  useControlPanel,
  type ControlPanelProps,
  type ControlPanelHandle,
  type SimpleControlPanelProps,
  type UseControlPanelOptions,
  type UseControlPanelResult,
  default as ControlPanelDefault,
} from './ControlPanel';

// Screen Material Component
export {
  ScreenMaterial,
  SimpleScreenMaterial,
  useScreenMaterial,
  SCREEN_TINT_PRESETS,
  type ScreenMaterialProps,
  type ScreenMaterialHandle,
  type SimpleScreenMaterialProps,
  type UseScreenMaterialOptions,
  type UseScreenMaterialResult,
  type ScreenTintPreset,
  default as ScreenMaterialDefault,
} from './ScreenMaterial';

// Cabinet Reflection Component (Environment Mapping)
export {
  CabinetReflection,
  CabinetReflectionProvider,
  ReflectiveMesh,
  useReflectiveMaterial,
  useCabinetReflection,
  useCabinetReflectionContext,
  createReflectiveCabinetMaterial,
  createChromeMaterial,
  createGlossyMaterial,
  type CabinetReflectionProps,
  type CabinetReflectionHandle,
  type ReflectiveMaterialProps,
  type ReflectiveMeshProps,
  type UseReflectiveMaterialOptions,
  type UseReflectiveMaterialResult,
  type UseCabinetReflectionOptions,
  type UseCabinetReflectionResult,
  default as CabinetReflectionDefault,
} from './CabinetReflection';

// Arcade Button Component
export {
  ArcadeButton,
  ButtonGrid,
  useArcadeButton,
  useButtonGrid,
  type ArcadeButtonProps,
  type ArcadeButtonHandle,
  type ButtonGridProps,
  type ButtonGridHandle,
  type UseArcadeButtonOptions,
  type UseArcadeButtonResult,
  type UseButtonGridOptions,
  type UseButtonGridResult,
  default as ArcadeButtonDefault,
} from './ArcadeButton';

// Joystick Component
export {
  Joystick,
  useJoystick,
  type JoystickProps,
  type JoystickHandle,
  type JoystickDirection,
  type UseJoystickOptions,
  type UseJoystickResult,
  default as JoystickDefault,
} from './Joystick';
