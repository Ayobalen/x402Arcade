/**
 * 3D Effects Module
 *
 * Background effects and visual enhancements for the 3D scene.
 *
 * @module 3d/effects
 */

// Starfield particle system
export {
  Starfield,
  useStarfield,
  getStarfieldPreset,
  STARFIELD_PRESETS,
  type StarfieldProps,
  type StarfieldHandle,
  type StarfieldPreset,
  type UseStarfieldOptions,
  type UseStarfieldResult,
  default as StarfieldDefault,
} from './Starfield';

// Nebula fog effect
export {
  Nebula,
  useNebula,
  getNebulaPreset,
  NEBULA_PRESETS,
  type NebulaProps,
  type NebulaHandle,
  type NebulaPreset,
  type NebulaCloudConfig,
  type UseNebulaOptions,
  type UseNebulaResult,
  default as NebulaDefault,
} from './Nebula';

// Grid floor perspective effect
export {
  GridFloor,
  useGridFloor,
  getGridFloorPreset,
  GRID_FLOOR_PRESETS,
  type GridFloorProps,
  type GridFloorHandle,
  type GridFloorPreset,
  type UseGridFloorOptions,
  type UseGridFloorResult,
  default as GridFloorDefault,
} from './GridFloor';

// Floating geometric shapes
export {
  FloatingShapes,
  useFloatingShapes,
  getFloatingShapesPreset,
  FLOATING_SHAPES_PRESETS,
  type FloatingShapesProps,
  type FloatingShapesHandle,
  type FloatingShapesPreset,
  type FloatingShapeConfig,
  type ShapeType,
  type UseFloatingShapesOptions,
  type UseFloatingShapesResult,
  default as FloatingShapesDefault,
} from './FloatingShapes';

// Neon line decorations
export {
  NeonLines,
  useNeonLines,
  getNeonLinesPreset,
  NEON_LINES_PRESETS,
  type NeonLinesProps,
  type NeonLinesHandle,
  type NeonLinesPreset,
  type LinePattern,
  type LineSegment,
  type UseNeonLinesOptions,
  type UseNeonLinesResult,
  default as NeonLinesDefault,
} from './NeonLines';

// CRT scanline overlay effect
export {
  Scanlines,
  useScanlines,
  getScanlinesPreset,
  SCANLINES_PRESETS,
  type ScanlinesProps,
  type ScanlinesHandle,
  type ScanlinesPreset,
  type UseScanlinesOptions,
  type UseScanlinesResult,
  default as ScanlinesDefault,
} from './Scanlines';

// Bloom post-processing effect
export {
  BloomEffect,
  useBloomEffect,
  getBloomEffectPreset,
  BLOOM_EFFECT_PRESETS,
  type BloomEffectProps,
  type BloomEffectHandle,
  type BloomEffectPreset,
  type UseBloomEffectOptions,
  type UseBloomEffectResult,
  default as BloomEffectDefault,
} from './BloomEffect';
