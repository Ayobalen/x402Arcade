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
} from './Starfield'
