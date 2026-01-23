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

export {
  CRTEffect,
  CRT_PRESETS,
  getCRTPreset,
  type CRTEffectProps,
  type CRTEffectHandle,
  type CRTPreset,
} from './CRTEffect'

export {
  ScoreDisplay3D,
  useScoreDisplay,
  type ScoreDisplay3DProps,
  type UseScoreDisplayResult,
} from './ScoreDisplay3D'

export {
  ComboCounter3D,
  useComboCounter,
  COMBO_COLOR_LEVELS,
  type ComboCounter3DProps,
  type ComboColorLevel,
  type UseComboCounterResult,
} from './ComboCounter3D'

export {
  CanvasFallback,
  detectWebGLSupport,
  type CanvasFallbackProps,
} from './CanvasFallback'

export {
  PowerUpEffect3D,
  usePowerUpEffect,
  POWER_UP_COLORS,
  type PowerUpEffect3DProps,
  type PowerUpType,
  type PowerUpColorConfig,
  type UsePowerUpEffectResult,
} from './PowerUpEffect3D'

export {
  GameOver3D,
  useGameOver3D,
  type GameOver3DProps,
  type UseGameOver3DResult,
} from './GameOver3D'

export {
  HighScoreCelebration3D,
  useHighScoreCelebration,
  type HighScoreCelebration3DProps,
  type UseHighScoreCelebrationResult,
} from './HighScoreCelebration'

export {
  Scene,
  SceneWithQuality,
  type SceneProps,
  type SceneWithQualityProps,
} from './Scene'

export {
  ScreenShake,
  CameraShake,
  useScreenShake,
  useCSSShake,
  SHAKE_PRESETS,
  DEFAULT_SHAKE_CONFIG,
  type ScreenShakeProps,
  type ScreenShakeConfig,
  type ShakeIntensity,
  type UseScreenShakeResult,
  type CameraShakeProps,
  type UseCSSShakeResult,
} from './ScreenShake'

export {
  ExplosionParticles,
  useExplosion,
  EXPLOSION_PRESETS,
  getExplosionPreset,
  type ExplosionParticlesProps,
  type ExplosionConfig,
  type ExplosionPreset,
  type UseExplosionResult,
} from './ExplosionParticles'

export {
  LightingRig,
  ArcadeLighting,
  NeonLighting,
  GameStateLighting,
  useLightingRig,
  LIGHTING_PRESETS,
  type LightingRigProps,
  type LightingPreset,
  type PointLightConfig,
  type DirectionalLightConfig,
  type AmbientLightConfig,
  type ArcadeLightingProps,
  type NeonLightingProps,
  type GameStateLightingProps,
  type UseLightingRigOptions,
  type UseLightingRigResult,
} from './LightingRig'

export {
  SoundVisualizer3D,
  useSoundVisualizer,
  VISUALIZER_PRESETS,
  getVisualizerPreset,
  type SoundVisualizer3DProps,
  type AudioAnalyzerConfig,
  type UseSoundVisualizerResult,
  type VisualizerPreset,
} from './SoundVisualizer3D'
