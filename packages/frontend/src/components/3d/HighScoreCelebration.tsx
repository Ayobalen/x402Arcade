import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface HighScoreCelebration3DProps {
  /**
   * Whether the celebration is active.
   */
  active: boolean
  /**
   * The new high score to display.
   */
  score: number
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
   * Duration of the celebration in seconds.
   * @default 4.0
   */
  duration?: number
  /**
   * Called when the celebration animation completes.
   */
  onComplete?: () => void
  /**
   * Called to trigger sound effect (pass to audio system).
   */
  onSoundTrigger?: (soundId: 'firework' | 'sparkle' | 'fanfare') => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_DURATION = 4.0
const FIREWORK_COUNT = 5
const FIREWORK_PARTICLE_COUNT = 30
const CONFETTI_COUNT = 60
const FLASH_DURATION = 0.3

// Gold/celebration colors
const CELEBRATION_COLORS = {
  gold: '#ffd700',
  orange: '#ff8c00',
  yellow: '#ffff00',
  white: '#ffffff',
  red: '#ff4444',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  green: '#00ff00',
}

const FIREWORK_COLORS = [
  CELEBRATION_COLORS.gold,
  CELEBRATION_COLORS.cyan,
  CELEBRATION_COLORS.magenta,
  CELEBRATION_COLORS.orange,
  CELEBRATION_COLORS.green,
]

const CONFETTI_COLORS = [
  CELEBRATION_COLORS.gold,
  CELEBRATION_COLORS.red,
  CELEBRATION_COLORS.cyan,
  CELEBRATION_COLORS.magenta,
  CELEBRATION_COLORS.green,
  CELEBRATION_COLORS.yellow,
]

// ============================================================================
// Firework Particle
// ============================================================================

interface FireworkParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
}

interface FireworkState {
  particles: FireworkParticle[]
  active: boolean
  launched: boolean
  launchPosition: THREE.Vector3
  launchVelocity: THREE.Vector3
  color: THREE.Color
  explodeTime: number
  exploded: boolean
}

// ============================================================================
// Firework System Component
// ============================================================================

interface FireworkSystemProps {
  active: boolean
  scale: number
  onSoundTrigger?: (soundId: 'firework' | 'sparkle' | 'fanfare') => void
}

function FireworkSystem({ active, scale, onSoundTrigger }: FireworkSystemProps) {
  const fireworks = useRef<FireworkState[]>([])
  const nextLaunchTime = useRef(0)
  const launchedCount = useRef(0)

  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const totalParticles = FIREWORK_COUNT * FIREWORK_PARTICLE_COUNT
  const positionsRef = useRef<Float32Array>(new Float32Array(totalParticles * 3))
  const colorsRef = useRef<Float32Array>(new Float32Array(totalParticles * 3))
  const sizesRef = useRef<Float32Array>(new Float32Array(totalParticles))

  // Initialize fireworks when activated
  useEffect(() => {
    if (active) {
      fireworks.current = []
      nextLaunchTime.current = 0
      launchedCount.current = 0
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active || !geometryRef.current) return

    // Launch new fireworks over time
    if (launchedCount.current < FIREWORK_COUNT) {
      nextLaunchTime.current -= delta
      if (nextLaunchTime.current <= 0) {
        // Launch a new firework
        const color = new THREE.Color(
          FIREWORK_COLORS[launchedCount.current % FIREWORK_COLORS.length]
        )
        const x = (Math.random() - 0.5) * 3 * scale
        const launchPos = new THREE.Vector3(x, -2 * scale, 0)
        const targetY = 0.5 + Math.random() * 1.5

        fireworks.current.push({
          particles: [],
          active: true,
          launched: true,
          launchPosition: launchPos,
          launchVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5,
            (targetY + 2) * 2, // Velocity to reach target
            0
          ),
          color,
          explodeTime: 0.4 + Math.random() * 0.2,
          exploded: false,
        })

        launchedCount.current++
        nextLaunchTime.current = 0.3 + Math.random() * 0.4
      }
    }

    // Update fireworks
    const positions = positionsRef.current
    const colors = colorsRef.current
    const sizes = sizesRef.current

    let particleIndex = 0

    for (const fw of fireworks.current) {
      if (!fw.active) continue

      // Update launch phase
      if (!fw.exploded) {
        fw.launchPosition.add(fw.launchVelocity.clone().multiplyScalar(delta))
        fw.launchVelocity.y -= delta * 8 // Gravity

        fw.explodeTime -= delta
        if (fw.explodeTime <= 0) {
          // Explode!
          fw.exploded = true
          onSoundTrigger?.('firework')

          // Create explosion particles
          for (let i = 0; i < FIREWORK_PARTICLE_COUNT; i++) {
            const angle1 = Math.random() * Math.PI * 2
            const angle2 = Math.acos(2 * Math.random() - 1)
            const speed = (1 + Math.random()) * 2 * scale

            fw.particles.push({
              position: fw.launchPosition.clone(),
              velocity: new THREE.Vector3(
                Math.sin(angle2) * Math.cos(angle1) * speed,
                Math.sin(angle2) * Math.sin(angle1) * speed,
                Math.cos(angle2) * speed * 0.3
              ),
              life: 0.8 + Math.random() * 0.4,
              maxLife: 1.2,
              size: 0.05 + Math.random() * 0.03,
              color: fw.color.clone(),
            })
          }
        }
      }

      // Update explosion particles
      for (let i = fw.particles.length - 1; i >= 0; i--) {
        const p = fw.particles[i]
        p.life -= delta

        if (p.life <= 0) {
          fw.particles.splice(i, 1)
          continue
        }

        // Update position
        p.position.add(p.velocity.clone().multiplyScalar(delta))

        // Add gravity and drag
        p.velocity.y -= delta * 3
        p.velocity.multiplyScalar(0.98)
      }

      // Write to buffers
      for (const p of fw.particles) {
        if (particleIndex >= totalParticles) break

        positions[particleIndex * 3] = p.position.x
        positions[particleIndex * 3 + 1] = p.position.y
        positions[particleIndex * 3 + 2] = p.position.z

        const lifeRatio = p.life / p.maxLife
        colors[particleIndex * 3] = p.color.r
        colors[particleIndex * 3 + 1] = p.color.g
        colors[particleIndex * 3 + 2] = p.color.b

        sizes[particleIndex] = p.size * lifeRatio

        particleIndex++
      }

      // Mark inactive if no particles left
      if (fw.exploded && fw.particles.length === 0) {
        fw.active = false
      }
    }

    // Fill remaining with zeros
    for (let i = particleIndex; i < totalParticles; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = -10
      positions[i * 3 + 2] = 0
      sizes[i] = 0
    }

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    geometryRef.current.attributes.size.needsUpdate = true
  })

  if (!active) return null

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={totalParticles}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={totalParticles}
          array={colorsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={totalParticles}
          array={sizesRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;

          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 300.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vColor;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            float alpha = (1.0 - dist * 2.0);
            alpha = pow(alpha, 1.5);
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  )
}

// ============================================================================
// Confetti Particle
// ============================================================================

interface ConfettiParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  rotation: THREE.Euler
  rotationVelocity: THREE.Vector3
  color: THREE.Color
  size: number
  life: number
}

// ============================================================================
// Confetti System Component
// ============================================================================

interface ConfettiSystemProps {
  active: boolean
  scale: number
}

function ConfettiSystem({ active, scale }: ConfettiSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<ConfettiParticle[]>([])
  const initialized = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize confetti
  useEffect(() => {
    if (active && !initialized.current) {
      initialized.current = true
      particles.current = []

      for (let i = 0; i < CONFETTI_COUNT; i++) {
        const x = (Math.random() - 0.5) * 4 * scale
        const y = 2 + Math.random() * 2

        particles.current.push({
          position: new THREE.Vector3(x, y, (Math.random() - 0.5) * scale),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            -1 - Math.random() * 2,
            (Math.random() - 0.5)
          ),
          rotation: new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ),
          rotationVelocity: new THREE.Vector3(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 6
          ),
          color: new THREE.Color(
            CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
          ),
          size: 0.03 + Math.random() * 0.02,
          life: 3 + Math.random() * 2,
        })
      }
    } else if (!active) {
      initialized.current = false
      particles.current = []
    }
  }, [active, scale])

  useFrame((_, delta) => {
    if (!active || !meshRef.current || particles.current.length === 0) return

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i]

      // Update life
      p.life -= delta
      if (p.life <= 0) continue

      // Update position with flutter effect
      p.velocity.x += Math.sin(p.position.y * 3) * delta * 2
      p.position.add(p.velocity.clone().multiplyScalar(delta))

      // Slow fall
      p.velocity.y = Math.max(p.velocity.y, -2)

      // Update rotation
      p.rotation.x += p.rotationVelocity.x * delta
      p.rotation.y += p.rotationVelocity.y * delta
      p.rotation.z += p.rotationVelocity.z * delta

      // Update instance
      dummy.position.copy(p.position)
      dummy.rotation.copy(p.rotation)
      dummy.scale.setScalar(p.size)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)

      // Update color for each instance
      meshRef.current.setColorAt(i, p.color)
    }

    meshRef.current.instanceMatrix.needsUpdate = true
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true
    }
  })

  if (!active) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, CONFETTI_COUNT]}>
      <planeGeometry args={[0.1, 0.06]} />
      <meshBasicMaterial
        side={THREE.DoubleSide}
        vertexColors
      />
    </instancedMesh>
  )
}

// ============================================================================
// Gold Flash Effect
// ============================================================================

interface GoldFlashProps {
  active: boolean
  scale: number
}

function GoldFlash({ active, scale }: GoldFlashProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const startTime = useRef(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (active) {
      startTime.current = 0
      setVisible(true)
    }
  }, [active])

  useFrame((_, delta) => {
    if (!visible || !materialRef.current) return

    startTime.current += delta
    const progress = startTime.current / FLASH_DURATION

    if (progress >= 1) {
      setVisible(false)
      return
    }

    // Flash: bright then fade
    const intensity = Math.sin(progress * Math.PI)
    materialRef.current.uniforms.opacity.value = intensity * 0.8
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef} position={[0, 0, 0.1]}>
      <planeGeometry args={[6 * scale, 4 * scale]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          color: { value: new THREE.Color(CELEBRATION_COLORS.gold) },
          opacity: { value: 0 },
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
  )
}

// ============================================================================
// High Score Text Component
// ============================================================================

interface HighScoreTextProps {
  score: number
  opacity: number
  scale: number
}

function HighScoreText({ score, opacity, scale }: HighScoreTextProps) {
  const groupRef = useRef<THREE.Group>(null)
  const pulseRef = useRef(0)
  const [currentScale, setCurrentScale] = useState(scale)

  useFrame((_, delta) => {
    pulseRef.current += delta * 4
    const pulse = Math.sin(pulseRef.current) * 0.1 + 1
    setCurrentScale(scale * pulse)
  })

  // Create simple text shapes (reusing pattern from GameOver3D)
  const createLetterShape = (letter: string): THREE.Shape | null => {
    const shape = new THREE.Shape()
    const w = 0.25
    const h = 0.4
    const t = 0.06

    switch (letter.toUpperCase()) {
      case 'N':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(-w + t, h)
        shape.lineTo(w - t, -h + t * 2)
        shape.lineTo(w - t, h)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.lineTo(w - t, -h)
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
      case 'W':
        shape.moveTo(-w, h)
        shape.lineTo(-w + t, h)
        shape.lineTo(-w / 2, -h + t)
        shape.lineTo(0, h / 2)
        shape.lineTo(w / 2, -h + t)
        shape.lineTo(w - t, h)
        shape.lineTo(w, h)
        shape.lineTo(w / 2 + t / 2, -h)
        shape.lineTo(0, h / 2 - t)
        shape.lineTo(-w / 2 - t / 2, -h)
        shape.closePath()
        break
      case 'H':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(-w + t, h)
        shape.lineTo(-w + t, t / 2)
        shape.lineTo(w - t, t / 2)
        shape.lineTo(w - t, h)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.lineTo(w - t, -h)
        shape.lineTo(w - t, -t / 2)
        shape.lineTo(-w + t, -t / 2)
        shape.lineTo(-w + t, -h)
        shape.closePath()
        break
      case 'I':
        shape.moveTo(-t / 2, -h)
        shape.lineTo(-t / 2, h)
        shape.lineTo(t / 2, h)
        shape.lineTo(t / 2, -h)
        shape.closePath()
        break
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
      case 'S':
        shape.moveTo(w, h)
        shape.lineTo(-w + t, h)
        shape.lineTo(-w, h - t)
        shape.lineTo(-w, t / 2)
        shape.lineTo(w - t, t / 2)
        shape.lineTo(w - t, -t / 2)
        shape.lineTo(-w, -t / 2)
        shape.lineTo(-w, -h + t)
        shape.lineTo(-w + t, -h)
        shape.lineTo(w, -h)
        shape.lineTo(w, -h + t)
        shape.lineTo(-w + t, -h + t)
        shape.lineTo(-w + t, -t / 2 - t)
        shape.lineTo(w, -t / 2 - t)
        shape.lineTo(w, t / 2 + t)
        shape.lineTo(-w + t, t / 2 + t)
        shape.lineTo(-w + t, h - t)
        shape.lineTo(w, h - t)
        shape.closePath()
        break
      case 'C':
        shape.moveTo(w, h)
        shape.lineTo(-w + t, h)
        shape.lineTo(-w, h - t)
        shape.lineTo(-w, -h + t)
        shape.lineTo(-w + t, -h)
        shape.lineTo(w, -h)
        shape.lineTo(w, -h + t)
        shape.lineTo(-w + t, -h + t)
        shape.lineTo(-w + t, h - t)
        shape.lineTo(w, h - t)
        shape.closePath()
        break
      case 'O':
        shape.moveTo(-w, -h)
        shape.lineTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.closePath()
        const hole = new THREE.Path()
        hole.moveTo(-w + t, -h + t)
        hole.lineTo(-w + t, h - t)
        hole.lineTo(w - t, h - t)
        hole.lineTo(w - t, -h + t)
        hole.closePath()
        shape.holes.push(hole)
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
      case '!':
        shape.moveTo(-t / 2, h)
        shape.lineTo(t / 2, h)
        shape.lineTo(t / 2, -h / 3)
        shape.lineTo(-t / 2, -h / 3)
        shape.closePath()
        // Dot at bottom (as separate shape)
        break
      case ' ':
        return null
      default:
        // Default rectangle
        shape.moveTo(-w / 2, -h)
        shape.lineTo(-w / 2, h)
        shape.lineTo(w / 2, h)
        shape.lineTo(w / 2, -h)
        shape.closePath()
    }
    return shape
  }

  const text = 'NEW HIGH SCORE!'
  const letterMeshes = useMemo(() => {
    const meshes: Array<{ shape: THREE.Shape; offset: number }> = []
    let offset = 0
    const letterWidth = 0.6
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
  }, [])

  const goldColor = useMemo(() => new THREE.Color(CELEBRATION_COLORS.gold), [])

  return (
    <group ref={groupRef} scale={[currentScale, currentScale, currentScale]}>
      {letterMeshes.map((item, index) => (
        <mesh key={index} position={[item.offset, 0, 0]}>
          <shapeGeometry args={[item.shape]} />
          <shaderMaterial
            transparent
            blending={THREE.AdditiveBlending}
            uniforms={{
              color: { value: goldColor },
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

      {/* Score display below */}
      <group position={[0, -1, 0]} scale={[0.6, 0.6, 0.6]}>
        {score.toLocaleString().split('').map((char, index) => {
          const shape = createLetterShape(char)
          if (!shape) return null
          const totalWidth = score.toLocaleString().length * 0.6
          return (
            <mesh key={index} position={[index * 0.6 - totalWidth / 2 + 0.3, 0, 0]}>
              <shapeGeometry args={[shape]} />
              <shaderMaterial
                transparent
                blending={THREE.AdditiveBlending}
                uniforms={{
                  color: { value: new THREE.Color(CELEBRATION_COLORS.white) },
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
          )
        })}
      </group>
    </group>
  )
}

// ============================================================================
// Main HighScoreCelebration3D Component
// ============================================================================

/**
 * HighScoreCelebration3D - Celebratory animation for new high scores.
 *
 * Features:
 * - Firework particle system
 * - Confetti particles
 * - Gold screen flash
 * - "NEW HIGH SCORE!" text with pulse animation
 * - Sound trigger callbacks
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <HighScoreCelebration3D
 *     active={isNewHighScore}
 *     score={currentScore}
 *     onSoundTrigger={(id) => playSound(id)}
 *     onComplete={() => setShowCelebration(false)}
 *   />
 * </Canvas>
 * ```
 */
export function HighScoreCelebration3D({
  active,
  score,
  position = [0, 0, 0],
  scale = 1,
  duration = DEFAULT_DURATION,
  onComplete,
  onSoundTrigger,
}: HighScoreCelebration3DProps) {
  const [textOpacity, setTextOpacity] = useState(0)
  const timerRef = useRef(0)
  const fanfarePlayed = useRef(false)

  // Reset when activated
  useEffect(() => {
    if (active) {
      timerRef.current = 0
      setTextOpacity(0)
      fanfarePlayed.current = false
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active) return

    timerRef.current += delta

    // Fade in text after flash
    if (timerRef.current > FLASH_DURATION) {
      const textProgress = Math.min((timerRef.current - FLASH_DURATION) / 0.5, 1)
      setTextOpacity(textProgress)

      // Trigger fanfare sound once
      if (!fanfarePlayed.current) {
        fanfarePlayed.current = true
        onSoundTrigger?.('fanfare')
      }
    }

    // Check completion
    if (timerRef.current >= duration) {
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={position}>
      {/* Gold flash */}
      <GoldFlash active={active} scale={scale} />

      {/* Fireworks */}
      <FireworkSystem
        active={active}
        scale={scale}
        onSoundTrigger={onSoundTrigger}
      />

      {/* Confetti */}
      <ConfettiSystem active={active} scale={scale} />

      {/* High Score Text */}
      <HighScoreText
        score={score}
        opacity={textOpacity}
        scale={scale * 0.4}
      />
    </group>
  )
}

// ============================================================================
// Utility Hook
// ============================================================================

export interface UseHighScoreCelebrationResult {
  trigger: (newScore: number) => void
  isActive: boolean
  props: Omit<HighScoreCelebration3DProps, 'onSoundTrigger'>
}

/**
 * Hook to manage high score celebration from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const celebration = useHighScoreCelebration();
 *
 *   const handleGameEnd = (score: number, highScore: number) => {
 *     if (score > highScore) {
 *       celebration.trigger(score);
 *     }
 *   };
 *
 *   return <HighScoreCelebration3D {...celebration.props} />;
 * }
 * ```
 */
export function useHighScoreCelebration(): UseHighScoreCelebrationResult {
  const [isActive, setIsActive] = useState(false)
  const [score, setScore] = useState(0)

  const trigger = useCallback((newScore: number) => {
    setScore(newScore)
    setIsActive(true)
  }, [])

  const handleComplete = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    trigger,
    isActive,
    props: {
      active: isActive,
      score,
      onComplete: handleComplete,
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export default HighScoreCelebration3D
