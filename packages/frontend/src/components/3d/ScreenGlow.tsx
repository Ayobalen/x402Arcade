import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

/**
 * Game state that influences glow behavior.
 */
export type GameState = 'idle' | 'playing' | 'paused' | 'gameOver' | 'victory'

/**
 * Glow color presets based on game state.
 */
export interface GlowColorPreset {
  primary: string
  secondary: string
  pulse: string
}

export interface ScreenGlowProps {
  /**
   * Width of the screen area.
   * @default 4
   */
  width?: number
  /**
   * Height of the screen area.
   * @default 3
   */
  height?: number
  /**
   * Z position offset behind the screen.
   * @default -0.05
   */
  zOffset?: number
  /**
   * Current game state (affects glow color).
   * @default 'idle'
   */
  gameState?: GameState
  /**
   * Current action intensity (0-1).
   * Controls glow brightness during gameplay.
   * @default 0
   */
  actionIntensity?: number
  /**
   * Current combo multiplier for combo glow effects.
   * @default 0
   */
  comboMultiplier?: number
  /**
   * Whether the player just scored (triggers flash).
   * @default false
   */
  scored?: boolean
  /**
   * Whether the player just took damage (triggers red flash).
   * @default false
   */
  damaged?: boolean
  /**
   * Custom primary color override.
   */
  customColor?: string
  /**
   * Base glow intensity (0-1).
   * @default 0.3
   */
  baseIntensity?: number
  /**
   * Maximum glow intensity (0-1).
   * @default 1.0
   */
  maxIntensity?: number
  /**
   * Glow expansion factor beyond screen edges.
   * @default 1.15
   */
  expansionFactor?: number
  /**
   * Enable animated pulse effect.
   * @default true
   */
  enablePulse?: boolean
  /**
   * Pulse speed multiplier.
   * @default 1
   */
  pulseSpeed?: number
  /**
   * Callback when glow state changes.
   */
  onGlowChange?: (intensity: number, color: string) => void
}

export interface GlowState {
  intensity: number
  color: THREE.Color
  targetIntensity: number
  targetColor: THREE.Color
  flashTimer: number
  flashColor: THREE.Color | null
  comboGlowTimer: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = 4
const DEFAULT_HEIGHT = 3
const DEFAULT_Z_OFFSET = -0.05
const DEFAULT_BASE_INTENSITY = 0.3
const DEFAULT_MAX_INTENSITY = 1.0
const DEFAULT_EXPANSION_FACTOR = 1.15
const DEFAULT_PULSE_SPEED = 1

/**
 * Color presets for different game states.
 */
export const GLOW_COLOR_PRESETS: Record<GameState, GlowColorPreset> = {
  idle: {
    primary: '#00ffff', // Cyan - calm, waiting
    secondary: '#0088ff',
    pulse: '#00aaff',
  },
  playing: {
    primary: '#00ff88', // Green - active, engaged
    secondary: '#00ffff',
    pulse: '#00ffaa',
  },
  paused: {
    primary: '#888888', // Gray - muted
    secondary: '#666666',
    pulse: '#777777',
  },
  gameOver: {
    primary: '#ff4444', // Red - danger, end
    secondary: '#ff0000',
    pulse: '#ff2222',
  },
  victory: {
    primary: '#ffff00', // Gold - triumph
    secondary: '#ff8800',
    pulse: '#ffaa00',
  },
}

// Flash colors for special events
const FLASH_COLORS = {
  score: new THREE.Color('#00ff00'), // Green flash for scoring
  damage: new THREE.Color('#ff0000'), // Red flash for damage
  combo: new THREE.Color('#ff00ff'), // Magenta for combo
}

// Interpolation speeds
const COLOR_LERP_SPEED = 0.05
const INTENSITY_LERP_SPEED = 0.08
const FLASH_DURATION = 0.15 // seconds
const COMBO_GLOW_DURATION = 0.3 // seconds

// ============================================================================
// useGlowState Hook
// ============================================================================

function useGlowState(
  gameState: GameState,
  actionIntensity: number,
  comboMultiplier: number,
  scored: boolean,
  damaged: boolean,
  baseIntensity: number,
  maxIntensity: number,
  customColor?: string
): React.MutableRefObject<GlowState> {
  const stateRef = useRef<GlowState>({
    intensity: baseIntensity,
    color: new THREE.Color(customColor || GLOW_COLOR_PRESETS.idle.primary),
    targetIntensity: baseIntensity,
    targetColor: new THREE.Color(customColor || GLOW_COLOR_PRESETS.idle.primary),
    flashTimer: 0,
    flashColor: null,
    comboGlowTimer: 0,
  })

  // Update targets based on props
  useEffect(() => {
    const state = stateRef.current
    const preset = GLOW_COLOR_PRESETS[gameState]

    // Set target color
    state.targetColor = new THREE.Color(customColor || preset.primary)

    // Calculate target intensity based on game state and action
    let targetIntensity = baseIntensity

    if (gameState === 'playing') {
      // Increase intensity based on action level
      targetIntensity = THREE.MathUtils.lerp(
        baseIntensity,
        maxIntensity * 0.8,
        actionIntensity
      )

      // Add combo bonus
      if (comboMultiplier > 1) {
        const comboBonus = Math.min(comboMultiplier * 0.1, 0.3)
        targetIntensity = Math.min(targetIntensity + comboBonus, maxIntensity)
      }
    } else if (gameState === 'gameOver') {
      targetIntensity = maxIntensity * 0.6
    } else if (gameState === 'victory') {
      targetIntensity = maxIntensity
    } else if (gameState === 'paused') {
      targetIntensity = baseIntensity * 0.5
    }

    state.targetIntensity = targetIntensity
  }, [gameState, actionIntensity, comboMultiplier, baseIntensity, maxIntensity, customColor])

  // Handle score flash
  useEffect(() => {
    if (scored) {
      const state = stateRef.current
      state.flashTimer = FLASH_DURATION
      state.flashColor = FLASH_COLORS.score
    }
  }, [scored])

  // Handle damage flash
  useEffect(() => {
    if (damaged) {
      const state = stateRef.current
      state.flashTimer = FLASH_DURATION
      state.flashColor = FLASH_COLORS.damage
    }
  }, [damaged])

  // Handle combo glow
  useEffect(() => {
    if (comboMultiplier >= 3) {
      const state = stateRef.current
      state.comboGlowTimer = COMBO_GLOW_DURATION
    }
  }, [comboMultiplier])

  // Return the ref so consumers can mutate .current in useFrame
  return stateRef
}

// ============================================================================
// Glow Layer Components
// ============================================================================

interface GlowLayerProps {
  width: number
  height: number
  zOffset: number
  color: THREE.Color
  intensity: number
  expansionFactor: number
}

/**
 * Main glow plane.
 */
function MainGlowLayer({
  width,
  height,
  zOffset,
  color,
  intensity,
  expansionFactor,
}: GlowLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.intensity.value = intensity
    }
  })

  return (
    <mesh position={[0, 0, zOffset]}>
      <planeGeometry args={[width * expansionFactor, height * expansionFactor]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        uniforms={{
          color: { value: color },
          intensity: { value: intensity },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float intensity;
          varying vec2 vUv;

          void main() {
            // Create radial gradient for soft glow
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);

            // Soft falloff from center to edges
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 1.5); // Sharper center, softer edges

            float alpha = glow * intensity;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}

/**
 * Edge glow layer for more pronounced border effect.
 */
function EdgeGlowLayer({
  width,
  height,
  zOffset,
  color,
  intensity,
}: Omit<GlowLayerProps, 'expansionFactor'>) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.intensity.value = intensity
    }
  })

  return (
    <mesh position={[0, 0, zOffset - 0.01]}>
      <planeGeometry args={[width * 1.05, height * 1.05]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        uniforms={{
          color: { value: color },
          intensity: { value: intensity },
          screenSize: { value: new THREE.Vector2(width, height) },
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          uniform float intensity;
          uniform vec2 screenSize;
          varying vec2 vUv;

          void main() {
            // Calculate distance from edges
            vec2 centered = vUv - 0.5;
            vec2 screenEdge = screenSize * 0.5 / (screenSize * 0.525); // Adjusted for 1.05 expansion

            // Edge proximity (0 at center, 1 at edge)
            float edgeX = abs(centered.x) / screenEdge.x;
            float edgeY = abs(centered.y) / screenEdge.y;
            float edgeDist = max(edgeX, edgeY);

            // Only glow near edges
            float edgeGlow = smoothstep(0.85, 1.0, edgeDist);

            float alpha = edgeGlow * intensity * 0.5;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Main ScreenGlow Component
// ============================================================================

/**
 * ScreenGlow - Dynamic glow effect around the game screen.
 *
 * Creates a multi-layered glow that responds to game events:
 * - Base glow color changes with game state
 * - Intensity increases with action level
 * - Flashes on score/damage events
 * - Special effects during combos
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <ScreenGlow
 *     width={4}
 *     height={3}
 *     gameState="playing"
 *     actionIntensity={0.5}
 *     comboMultiplier={3}
 *   />
 * </Canvas>
 * ```
 */
export function ScreenGlow({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  zOffset = DEFAULT_Z_OFFSET,
  gameState = 'idle',
  actionIntensity = 0,
  comboMultiplier = 0,
  scored = false,
  damaged = false,
  customColor,
  baseIntensity = DEFAULT_BASE_INTENSITY,
  maxIntensity = DEFAULT_MAX_INTENSITY,
  expansionFactor = DEFAULT_EXPANSION_FACTOR,
  enablePulse = true,
  pulseSpeed = DEFAULT_PULSE_SPEED,
  onGlowChange,
}: ScreenGlowProps) {
  const glowState = useGlowState(
    gameState,
    actionIntensity,
    comboMultiplier,
    scored,
    damaged,
    baseIntensity,
    maxIntensity,
    customColor
  )

  // Animation state
  const currentColor = useRef(new THREE.Color())
  const currentIntensity = useRef(baseIntensity)

  useFrame((state, delta) => {
    // glowState is a mutable ref - access .current for frame-by-frame updates
    const gs = glowState.current

    // Update flash timer
    if (gs.flashTimer > 0) {
      gs.flashTimer -= delta
    }

    // Update combo glow timer
    if (gs.comboGlowTimer > 0) {
      gs.comboGlowTimer -= delta
    }

    // Determine target color (considering flash)
    let targetColor = gs.targetColor
    if (gs.flashTimer > 0 && gs.flashColor) {
      // Blend flash color based on remaining time
      const flashStrength = gs.flashTimer / FLASH_DURATION
      targetColor = gs.flashColor.clone().lerp(gs.targetColor, 1 - flashStrength)
    } else if (gs.comboGlowTimer > 0 && comboMultiplier >= 3) {
      // Combo glow effect
      const comboStrength = gs.comboGlowTimer / COMBO_GLOW_DURATION
      targetColor = FLASH_COLORS.combo.clone().lerp(gs.targetColor, 1 - comboStrength)
    }

    // Lerp current color toward target
    currentColor.current.lerp(targetColor, COLOR_LERP_SPEED)

    // Calculate target intensity with pulse
    let targetIntensity = gs.targetIntensity
    if (enablePulse && gameState === 'playing') {
      const pulse = Math.sin(state.clock.elapsedTime * 2 * pulseSpeed) * 0.1 + 0.95
      targetIntensity *= pulse
    }

    // Add flash intensity boost
    if (gs.flashTimer > 0) {
      const flashBoost = (gs.flashTimer / FLASH_DURATION) * 0.3
      targetIntensity = Math.min(targetIntensity + flashBoost, maxIntensity)
    }

    // Lerp current intensity toward target
    currentIntensity.current = THREE.MathUtils.lerp(
      currentIntensity.current,
      targetIntensity,
      INTENSITY_LERP_SPEED
    )

    // Update state for children
    gs.intensity = currentIntensity.current
    gs.color.copy(currentColor.current)

    // Callback
    onGlowChange?.(gs.intensity, `#${gs.color.getHexString()}`)
  })

  return (
    <group>
      {/* Main background glow */}
      <MainGlowLayer
        width={width}
        height={height}
        zOffset={zOffset}
        color={glowState.current.color}
        intensity={glowState.current.intensity}
        expansionFactor={expansionFactor}
      />

      {/* Edge glow */}
      <EdgeGlowLayer
        width={width}
        height={height}
        zOffset={zOffset}
        color={glowState.current.color}
        intensity={glowState.current.intensity * 0.7}
      />
    </group>
  )
}

// ============================================================================
// Utility Hook for Controlling Glow from Game Logic
// ============================================================================

export interface UseScreenGlowControlResult {
  triggerScore: () => void
  triggerDamage: () => void
  setActionIntensity: (intensity: number) => void
  setComboMultiplier: (multiplier: number) => void
  props: Pick<ScreenGlowProps, 'scored' | 'damaged' | 'actionIntensity' | 'comboMultiplier'>
}

/**
 * Hook to control ScreenGlow from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const glowControl = useScreenGlowControl();
 *
 *   const handleScore = () => {
 *     glowControl.triggerScore();
 *     glowControl.setComboMultiplier(combo);
 *   };
 *
 *   return <ScreenGlow gameState="playing" {...glowControl.props} />;
 * }
 * ```
 */
export function useScreenGlowControl(): UseScreenGlowControlResult {
  const stateRef = useRef({
    scored: false,
    damaged: false,
    actionIntensity: 0,
    comboMultiplier: 0,
    scoredTimeout: null as ReturnType<typeof setTimeout> | null,
    damagedTimeout: null as ReturnType<typeof setTimeout> | null,
  })

  const triggerScore = () => {
    const state = stateRef.current
    state.scored = true

    // Clear any existing timeout
    if (state.scoredTimeout) {
      clearTimeout(state.scoredTimeout)
    }

    // Auto-reset after flash duration
    state.scoredTimeout = setTimeout(() => {
      state.scored = false
    }, FLASH_DURATION * 1000)
  }

  const triggerDamage = () => {
    const state = stateRef.current
    state.damaged = true

    if (state.damagedTimeout) {
      clearTimeout(state.damagedTimeout)
    }

    state.damagedTimeout = setTimeout(() => {
      state.damaged = false
    }, FLASH_DURATION * 1000)
  }

  const setActionIntensity = (intensity: number) => {
    stateRef.current.actionIntensity = THREE.MathUtils.clamp(intensity, 0, 1)
  }

  const setComboMultiplier = (multiplier: number) => {
    stateRef.current.comboMultiplier = Math.max(0, multiplier)
  }

  return {
    triggerScore,
    triggerDamage,
    setActionIntensity,
    setComboMultiplier,
    get props() {
      return {
        scored: stateRef.current.scored,
        damaged: stateRef.current.damaged,
        actionIntensity: stateRef.current.actionIntensity,
        comboMultiplier: stateRef.current.comboMultiplier,
      }
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ScreenGlow
