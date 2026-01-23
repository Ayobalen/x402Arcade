/**
 * 3D Components for x402 Arcade
 *
 * These components provide Three.js-powered 3D visual elements
 * that integrate with the arcade gaming aesthetic.
 */

export {
  GameFrame,
  StandaloneFrameScene,
  type GameFrameProps,
  type StandaloneFrameSceneProps,
} from './GameFrame'

export {
  GameScreen3D,
  useCanvasTexture,
  useGameCanvas,
  type GameScreen3DProps,
  type UseCanvasTextureOptions,
  type UseCanvasTextureResult,
  type UseGameScreenOptions,
} from './GameScreen3D'

export {
  ScreenGlow,
  useScreenGlowControl,
  GLOW_COLOR_PRESETS,
  type ScreenGlowProps,
  type GlowColorPreset,
  type GameState,
  type GlowState,
  type UseScreenGlowControlResult,
} from './ScreenGlow'

export {
  ScreenReflection,
  SimpleReflection,
  type ScreenReflectionProps,
  type SimpleReflectionProps,
} from './ScreenReflection'
