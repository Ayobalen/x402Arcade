import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface GameOver3DProps {
  /**
   * Whether the game over animation is active.
   */
  active: boolean
  /**
   * The final score to display.
   */
  finalScore: number
  /**
   * Optional high score (if set, shows "NEW HIGH SCORE!" when exceeded).
   */
  highScore?: number
  /**
   * Position offset [x, y, z].
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Scale multiplier.
   * @default 1
   */
  scale?: number
  /**
   * Called when the animation sequence completes.
   */
  onAnimationComplete?: () => void
  /**
   * Called when user clicks/interacts to replay.
   */
  onReplayClick?: () => void
  /**
   * Duration of the game over sequence in seconds.
   * @default 3.0
   */
  duration?: number
  /**
   * Color theme for the game over screen.
   * @default 'red'
   */
  colorTheme?: 'red' | 'purple' | 'cyan' | 'gold'
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 3.0
const SHATTER_DURATION = 0.5
const TEXT_APPEAR_DELAY = 0.3
const SCORE_APPEAR_DELAY = 1.0
const REPLAY_APPEAR_DELAY = 2.0
const PARTICLE_COUNT = 40

const COLOR_THEMES = {
  red: {
    primary: '#ff4444',
    secondary: '#ff0000',
    glow: '#ff2222',
    text: '#ffffff',
  },
  purple: {
    primary: '#8844ff',
    secondary: '#6600ff',
    glow: '#aa66ff',
    text: '#ffffff',
  },
  cyan: {
    primary: '#00ffff',
    secondary: '#0088ff',
    glow: '#44ffff',
    text: '#ffffff',
  },
  gold: {
    primary: '#ffd700',
    secondary: '#ffaa00',
    glow: '#ffee44',
    text: '#ffffff',
  },
}

// ============================================================================
// Animation State
// ============================================================================

interface AnimationState {
  phase: 'shatter' | 'text' | 'score' | 'replay' | 'complete'
  timer: number
  textScale: number
  textOpacity: number
  scoreScale: number
  scoreOpacity: number
  replayOpacity: number
  shatterProgress: number
}

// ============================================================================
// Shatter Effect
// ============================================================================

interface ShatterParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotationVelocity: THREE.Vector3
  scale: number
  opacity: number
}

interface ShatterEffectProps {
  active: boolean
  progress: number
  color: THREE.Color
  scale: number
}

function ShatterEffect({ active, progress, color, scale }: ShatterEffectProps) {
  const particles = useRef<ShatterParticle[]>([])
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const initialized = useRef(false)

  const particleCount = PARTICLE_COUNT
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize particles
  useEffect(() => {
    if (active && !initialized.current) {
      initialized.current = true
      particles.current = []

      for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 2 * scale
        const y = (Math.random() - 0.5) * 1.5 * scale
        const z = Math.random() * 0.1

        particles.current.push({
          position: new THREE.Vector3(x, y, z),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3 - 1, // Slight downward bias
            Math.random() * 2
          ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ),
          rotationVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4
          ),
          scale: 0.05 + Math.random() * 0.1,
          opacity: 1,
        })
      }
    } else if (!active) {
      initialized.current = false
      particles.current = []
    }
  }, [active, particleCount, scale])

  useFrame((_, delta) => {
    if (!active || !meshRef.current || particles.current.length === 0) return

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i]

      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(delta * progress))

      // Add gravity
      p.velocity.y -= delta * 5 * progress

      // Update rotation
      p.rotation.x += p.rotationVelocity.x * delta
      p.rotation.y += p.rotationVelocity.y * delta
      p.rotation.z += p.rotationVelocity.z * delta

      // Fade out based on progress
      p.opacity = 1 - progress

      // Update instance matrix
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.scale.setScalar(p.scale * (1 - progress * 0.5))
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!active) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
      <boxGeometry args={[0.15, 0.15, 0.02]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={1 - progress}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  )
}

// ============================================================================
// 3D Text Component (using shapes since no font loader)
// ============================================================================

interface Text3DProps {
  text: string
  color: THREE.Color
  scale: number
  opacity: number
  position?: [number, number, number]
}

function Text3D({ text, color, scale, opacity, position = [0, 0, 0] }: Text3DProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.opacity.value = opacity
    }
  })

  // Create simple letter shapes
  const createLetterShape = (letter: string): THREE.Shape | null => {
    const shape = new THREE.Shape()
    const w = 0.3
    const h = 0.5
    const t = 0.08

    switch (letter.toUpperCase()) {
      case 'G':
        shape.moveTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, h - t)
        shape.lineTo(-w + t, h - t)
        shape.lineTo(-w + t, -h + t)
        shape.lineTo(w - t, -h + t)
        shape.lineTo(w - t, 0)
        shape.lineTo(0, 0)
        shape.lineTo(0, -t)
        shape.lineTo(w, -t)
        shape.lineTo(w, -h)
        shape.lineTo(-w, -h)
        shape.closePath()
        break
      case 'A':
        shape.moveTo(0, h)
        shape.lineTo(w, -h)
        shape.lineTo(w - t, -h)
        shape.lineTo(w - t * 2, -h + t * 2)
        shape.lineTo(-w + t * 2, -h + t * 2)
        shape.lineTo(-w + t, -h)
        shape.lineTo(-w, -h)
        shape.lineTo(0, h)
        const holeA = new THREE.Path()
        holeA.moveTo(-t, -h + t * 4)
        holeA.lineTo(t, -h + t * 4)
        holeA.lineTo(0, 0)
        holeA.closePath()
        shape.holes.push(holeA)
        break
      case 'M':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(0, 0)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.lineTo(w - t, -h)
        shape.lineTo(w - t, h - t * 2)
        shape.lineTo(0, -t)
        shape.lineTo(-w + t, h - t * 2)
        shape.lineTo(-w + t, -h)
        shape.closePath()
        break
      case 'E':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, h - t)
        shape.lineTo(-w + t, h - t)
        shape.lineTo(-w + t, t / 2)
        shape.lineTo(w - t, t / 2)
        shape.lineTo(w - t, -t / 2)
        shape.lineTo(-w + t, -t / 2)
        shape.lineTo(-w + t, -h + t)
        shape.lineTo(w, -h + t)
        shape.lineTo(w, -h)
        shape.closePath()
        break
      case 'O':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.closePath()
        const holeO = new THREE.Path()
        holeO.moveTo(-w + t, -h + t)
        holeO.lineTo(-w + t, h - t)
        holeO.lineTo(w - t, h - t)
        holeO.lineTo(w - t, -h + t)
        holeO.closePath()
        shape.holes.push(holeO)
        break
      case 'V':
        shape.moveTo(-w, h)
        shape.lineTo(0, -h)
        shape.lineTo(w, h)
        shape.lineTo(w - t, h)
        shape.lineTo(0, -h + t * 2)
        shape.lineTo(-w + t, h)
        shape.closePath()
        break
      case 'R':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(w - t, h)
        shape.lineTo(w, h - t)
        shape.lineTo(w, t)
        shape.lineTo(w - t, 0)
        shape.lineTo(w, -h)
        shape.lineTo(w - t, -h)
        shape.lineTo(0, 0)
        shape.lineTo(-w + t, 0)
        shape.lineTo(-w + t, h - t)
        shape.lineTo(w - t * 2, h - t)
        shape.lineTo(w - t, t)
        shape.lineTo(w - t * 2, t)
        shape.lineTo(-w + t, t)
        shape.lineTo(-w + t, -h)
        shape.closePath()
        break
      case ' ':
        return null
      default:
        // Default rectangle for unknown letters
        shape.moveTo(-w / 2, -h)
        shape.lineTo(-w / 2, h)
        shape.lineTo(w / 2, h)
        shape.lineTo(w / 2, -h)
        shape.closePath()
    }
    return shape
  }

  const letterMeshes = useMemo(() => {
    const meshes: Array<{ shape: THREE.Shape; offset: number }> = []
    let offset = 0
    const letterWidth = 0.8
    const totalWidth = text.length * letterWidth

    for (let i = 0; i < text.length; i++) {
      const shape = createLetterShape(text[i])
      if (shape) {
        meshes.push({
          shape,
          offset: offset - totalWidth / 2 + letterWidth / 2,
        })
      }
      offset += letterWidth
    }
    return meshes
  }, [text])

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {letterMeshes.map((item, index) => (
        <mesh key={index} position={[item.offset, 0, 0]}>
          <shapeGeometry args={[item.shape]} />
          <shaderMaterial
            ref={index === 0 ? materialRef : undefined}
            transparent
            blending={THREE.AdditiveBlending}
            uniforms={{
              color: { value: color },
              opacity: { value: opacity },
            }}
            vertexShader={`
              void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              uniform vec3 color;
              uniform float opacity;

              void main() {
                gl_FragColor = vec4(color, opacity);
              }
            `}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================================================
// Score Display
// ============================================================================

interface ScoreDisplayProps {
  score: number
  isHighScore: boolean
  color: THREE.Color
  scale: number
  opacity: number
}

function ScoreDisplay({ score, isHighScore, color, scale, opacity }: ScoreDisplayProps) {
  const formattedScore = score.toLocaleString()

  return (
    <group scale={[scale, scale, scale]}>
      {isHighScore && (
        <Text3D
          text="NEW HIGH"
          color={new THREE.Color('#ffd700')}
          scale={0.4}
          opacity={opacity}
          position={[0, 0.8, 0]}
        />
      )}
      <Text3D
        text={formattedScore}
        color={color}
        scale={0.8}
        opacity={opacity}
        position={[0, 0, 0]}
      />
    </group>
  )
}

// ============================================================================
// Replay Prompt
// ============================================================================

interface ReplayPromptProps {
  opacity: number
  color: THREE.Color
  onClick?: () => void
}

function ReplayPrompt({ opacity, color }: ReplayPromptProps) {
  const pulseRef = useRef(0)
  const [currentOpacity, setCurrentOpacity] = useState(opacity)

  useFrame((_, delta) => {
    pulseRef.current += delta * 3
    const pulse = Math.sin(pulseRef.current) * 0.3 + 0.7
    setCurrentOpacity(opacity * pulse)
  })

  return (
    <group position={[0, -1.5, 0]}>
      <Text3D
        text="PLAY AGAIN"
        color={color}
        scale={0.35}
        opacity={currentOpacity}
      />
    </group>
  )
}

// ============================================================================
// Glow Background
// ============================================================================

interface GlowBackgroundProps {
  color: THREE.Color
  opacity: number
  scale: number
}

function GlowBackground({ color, opacity, scale }: GlowBackgroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.opacity.value = opacity
    }
  })

  return (
    <mesh position={[0, 0, -0.5]} scale={[scale * 3, scale * 2, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          color: { value: color },
          opacity: { value: opacity },
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
          uniform float opacity;
          varying vec2 vUv;

          void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 2.0);
            gl_FragColor = vec4(color, glow * opacity * 0.3);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Main GameOver3D Component
// ============================================================================

/**
 * GameOver3D - Dramatic game over animation with score display.
 *
 * Features:
 * - Screen shatter effect
 * - "GAME OVER" text animation
 * - Final score display with optional high score indication
 * - Replay prompt with pulse animation
 * - Multiple color themes
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <GameOver3D
 *     active={gameOver}
 *     finalScore={12500}
 *     highScore={10000}
 *     colorTheme="red"
 *     onReplayClick={() => restartGame()}
 *   />
 * </Canvas>
 * ```
 */
export function GameOver3D({
  active,
  finalScore,
  highScore,
  position = [0, 0, 0],
  scale = 1,
  onAnimationComplete,
  onReplayClick,
  duration = DEFAULT_DURATION,
  colorTheme = 'red',
}: GameOver3DProps) {
  const [animState, setAnimState] = useState<AnimationState>({
    phase: 'shatter',
    timer: 0,
    textScale: 0,
    textOpacity: 0,
    scoreScale: 0,
    scoreOpacity: 0,
    replayOpacity: 0,
    shatterProgress: 0,
  })

  const theme = useMemo(() => COLOR_THEMES[colorTheme], [colorTheme])
  const primaryColor = useMemo(() => new THREE.Color(theme.primary), [theme])
  const glowColor = useMemo(() => new THREE.Color(theme.glow), [theme])

  const isHighScore = highScore !== undefined && finalScore > highScore

  // Reset animation when activated
  useEffect(() => {
    if (active) {
      setAnimState({
        phase: 'shatter',
        timer: 0,
        textScale: 0,
        textOpacity: 0,
        scoreScale: 0,
        scoreOpacity: 0,
        replayOpacity: 0,
        shatterProgress: 0,
      })
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active) return

    setAnimState(prev => {
      const newTimer = prev.timer + delta
      const newState = { ...prev, timer: newTimer }

      // Phase 1: Shatter
      if (newTimer < SHATTER_DURATION) {
        newState.shatterProgress = newTimer / SHATTER_DURATION
        newState.phase = 'shatter'
      }
      // Phase 2: Text appears
      else if (newTimer < TEXT_APPEAR_DELAY + SHATTER_DURATION) {
        const textProgress = (newTimer - SHATTER_DURATION) / TEXT_APPEAR_DELAY
        newState.textScale = 0.5 + textProgress * 0.5
        newState.textOpacity = textProgress
        newState.shatterProgress = 1
        newState.phase = 'text'
      }
      // Phase 3: Score appears
      else if (newTimer < SCORE_APPEAR_DELAY + SHATTER_DURATION) {
        const scoreProgress = (newTimer - TEXT_APPEAR_DELAY - SHATTER_DURATION) / (SCORE_APPEAR_DELAY - TEXT_APPEAR_DELAY)
        newState.textScale = 1
        newState.textOpacity = 1
        newState.scoreScale = 0.5 + Math.min(scoreProgress, 1) * 0.5
        newState.scoreOpacity = Math.min(scoreProgress, 1)
        newState.shatterProgress = 1
        newState.phase = 'score'
      }
      // Phase 4: Replay prompt
      else if (newTimer < REPLAY_APPEAR_DELAY + SHATTER_DURATION) {
        const replayProgress = (newTimer - SCORE_APPEAR_DELAY - SHATTER_DURATION) / (REPLAY_APPEAR_DELAY - SCORE_APPEAR_DELAY)
        newState.textScale = 1
        newState.textOpacity = 1
        newState.scoreScale = 1
        newState.scoreOpacity = 1
        newState.replayOpacity = Math.min(replayProgress, 1)
        newState.shatterProgress = 1
        newState.phase = 'replay'
      }
      // Phase 5: Complete
      else if (newTimer < duration + SHATTER_DURATION) {
        newState.textScale = 1
        newState.textOpacity = 1
        newState.scoreScale = 1
        newState.scoreOpacity = 1
        newState.replayOpacity = 1
        newState.shatterProgress = 1
        newState.phase = 'complete'
        if (prev.phase !== 'complete') {
          onAnimationComplete?.()
        }
      }

      return newState
    })
  })

  if (!active) return null

  return (
    <group position={position} scale={[scale, scale, scale]} onClick={onReplayClick}>
      {/* Background glow */}
      <GlowBackground
        color={glowColor}
        opacity={animState.textOpacity}
        scale={scale}
      />

      {/* Shatter effect */}
      <ShatterEffect
        active={animState.phase === 'shatter' || animState.shatterProgress < 1}
        progress={animState.shatterProgress}
        color={primaryColor}
        scale={scale}
      />

      {/* GAME OVER text */}
      {animState.textOpacity > 0 && (
        <group position={[0, 0.5, 0]}>
          <Text3D
            text="GAME"
            color={primaryColor}
            scale={animState.textScale * 0.6}
            opacity={animState.textOpacity}
            position={[0, 0.3, 0]}
          />
          <Text3D
            text="OVER"
            color={primaryColor}
            scale={animState.textScale * 0.6}
            opacity={animState.textOpacity}
            position={[0, -0.3, 0]}
          />
        </group>
      )}

      {/* Score display */}
      {animState.scoreOpacity > 0 && (
        <group position={[0, -0.5, 0]}>
          <ScoreDisplay
            score={finalScore}
            isHighScore={isHighScore}
            color={primaryColor}
            scale={animState.scoreScale * 0.5}
            opacity={animState.scoreOpacity}
          />
        </group>
      )}

      {/* Replay prompt */}
      {animState.replayOpacity > 0 && (
        <ReplayPrompt
          opacity={animState.replayOpacity}
          color={primaryColor}
          onClick={onReplayClick}
        />
      )}
    </group>
  )
}

// ============================================================================
// Utility Hook
// ============================================================================

export interface UseGameOver3DResult {
  trigger: (finalScore: number) => void
  reset: () => void
  isActive: boolean
  props: Omit<GameOver3DProps, 'onReplayClick'>
}

/**
 * Hook to manage game over state from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const gameOver = useGameOver3D(currentHighScore);
 *
 *   const handleGameEnd = (score: number) => {
 *     gameOver.trigger(score);
 *   };
 *
 *   return (
 *     <GameOver3D
 *       {...gameOver.props}
 *       onReplayClick={() => {
 *         gameOver.reset();
 *         restartGame();
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export function useGameOver3D(highScore?: number): UseGameOver3DResult {
  const [isActive, setIsActive] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  const trigger = (score: number) => {
    setFinalScore(score)
    setIsActive(true)
  }

  const reset = () => {
    setIsActive(false)
    setFinalScore(0)
  }

  return {
    trigger,
    reset,
    isActive,
    props: {
      active: isActive,
      finalScore,
      highScore,
      onAnimationComplete: () => {
        // Animation complete - waiting for user interaction
      },
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export default GameOver3D
