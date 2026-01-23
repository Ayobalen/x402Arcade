import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface ExplosionConfig {
  /**
   * Number of particles in the explosion.
   * @default 50
   */
  particleCount?: number
  /**
   * Maximum size of particles.
   * @default 0.1
   */
  particleSize?: number
  /**
   * Expansion speed of the explosion.
   * @default 5
   */
  expansionSpeed?: number
  /**
   * Duration of the explosion in seconds.
   * @default 1.0
   */
  duration?: number
  /**
   * Start color of particles (typically white/bright).
   */
  startColor?: string
  /**
   * End color of particles (typically orange/red).
   */
  endColor?: string
  /**
   * Gravity applied to particles.
   * @default 0
   */
  gravity?: number
  /**
   * Whether to include smoke particles.
   * @default false
   */
  includeSmoke?: boolean
  /**
   * Scale multiplier for the overall effect.
   * @default 1
   */
  scale?: number
}

export interface ExplosionParticlesProps extends ExplosionConfig {
  /**
   * Position [x, y, z] where the explosion occurs.
   */
  position: [number, number, number]
  /**
   * Whether the explosion is active.
   */
  active: boolean
  /**
   * Called when the explosion animation completes.
   */
  onComplete?: () => void
}

export interface UseExplosionResult {
  /**
   * Trigger an explosion at a position.
   */
  explode: (position: [number, number, number], config?: ExplosionConfig) => void
  /**
   * List of active explosions.
   */
  explosions: Array<{ id: number; position: [number, number, number]; config: ExplosionConfig }>
  /**
   * Get props for an explosion component by ID.
   */
  getProps: (id: number) => ExplosionParticlesProps
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<ExplosionConfig> = {
  particleCount: 50,
  particleSize: 0.1,
  expansionSpeed: 5,
  duration: 1.0,
  startColor: '#ffffff',
  endColor: '#ff6600',
  gravity: 0,
  includeSmoke: false,
  scale: 1,
}

const MAX_PARTICLES = 200
const SMOKE_PARTICLE_COUNT = 20

// ============================================================================
// Particle State
// ============================================================================

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  startSize: number
  rotation: number
  rotationSpeed: number
}

interface SmokeParticle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  opacity: number
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate random unit vector (spherical distribution).
 */
function randomDirection(): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi)
  )
}

/**
 * Lerp between two colors.
 */
function lerpColor(color1: THREE.Color, color2: THREE.Color, t: number): THREE.Color {
  return color1.clone().lerp(color2, t)
}

// ============================================================================
// Core Explosion Component
// ============================================================================

function CoreExplosion({
  position,
  active,
  config,
  onComplete,
}: {
  position: [number, number, number]
  active: boolean
  config: Required<ExplosionConfig>
  onComplete?: () => void
}) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const particles = useRef<Particle[]>([])
  const initialized = useRef(false)
  const timerRef = useRef(0)

  const particleCount = Math.min(config.particleCount, MAX_PARTICLES)

  // Buffer arrays
  const positionsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const colorsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const sizesRef = useRef<Float32Array>(new Float32Array(particleCount))

  // Colors
  const startColor = useMemo(() => new THREE.Color(config.startColor), [config.startColor])
  const endColor = useMemo(() => new THREE.Color(config.endColor), [config.endColor])

  // Initialize particles
  useEffect(() => {
    if (active && !initialized.current) {
      initialized.current = true
      timerRef.current = 0
      particles.current = []

      for (let i = 0; i < particleCount; i++) {
        const direction = randomDirection()
        const speed = (0.5 + Math.random() * 0.5) * config.expansionSpeed * config.scale

        particles.current.push({
          position: new THREE.Vector3(0, 0, 0),
          velocity: direction.multiplyScalar(speed),
          life: config.duration * (0.7 + Math.random() * 0.3),
          maxLife: config.duration,
          size: config.particleSize * (0.5 + Math.random() * 0.5) * config.scale,
          startSize: config.particleSize * config.scale,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 4,
        })
      }
    } else if (!active) {
      initialized.current = false
      particles.current = []
    }
  }, [active, particleCount, config])

  useFrame((_, delta) => {
    if (!active || !geometryRef.current || particles.current.length === 0) return

    timerRef.current += delta

    const positions = positionsRef.current
    const colors = colorsRef.current
    const sizes = sizesRef.current

    let allDead = true

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i]
      p.life -= delta

      if (p.life > 0) {
        allDead = false

        // Update position
        p.position.add(p.velocity.clone().multiplyScalar(delta))

        // Apply gravity
        p.velocity.y -= config.gravity * delta

        // Apply drag
        p.velocity.multiplyScalar(0.98)

        // Update rotation
        p.rotation += p.rotationSpeed * delta

        // Calculate life ratio (1 at start, 0 at end)
        const lifeRatio = p.life / p.maxLife

        // Write position
        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z

        // Interpolate color: white -> orange -> fade out
        const colorProgress = 1 - lifeRatio
        const currentColor = lerpColor(startColor, endColor, colorProgress)
        colors[i * 3] = currentColor.r
        colors[i * 3 + 1] = currentColor.g
        colors[i * 3 + 2] = currentColor.b

        // Size decreases over lifetime
        sizes[i] = p.size * lifeRatio
      } else {
        positions[i * 3] = 0
        positions[i * 3 + 1] = -100
        positions[i * 3 + 2] = 0
        sizes[i] = 0
      }
    }

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.color.needsUpdate = true
    geometryRef.current.attributes.size.needsUpdate = true

    // Check completion
    if (allDead || timerRef.current >= config.duration * 1.2) {
      initialized.current = false
      particles.current = []
      onComplete?.()
    }
  })

  if (!active) return null

  return (
    <group position={position}>
      <points>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positionsRef.current}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={colorsRef.current}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={particleCount}
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

              // Soft edge
              float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
              gl_FragColor = vec4(vColor, alpha);
            }
          `}
        />
      </points>
    </group>
  )
}

// ============================================================================
// Smoke Effect Component
// ============================================================================

interface SmokeEffectProps {
  position: [number, number, number]
  active: boolean
  config: Required<ExplosionConfig>
}

function SmokeEffect({ position, active, config }: SmokeEffectProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const particles = useRef<SmokeParticle[]>([])
  const initialized = useRef(false)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Initialize smoke particles
  useEffect(() => {
    if (active && !initialized.current && config.includeSmoke) {
      initialized.current = true
      particles.current = []

      for (let i = 0; i < SMOKE_PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 0.5 + Math.random() * 0.5

        particles.current.push({
          position: new THREE.Vector3(
            Math.cos(angle) * 0.2 * config.scale,
            Math.random() * 0.2 * config.scale,
            Math.sin(angle) * 0.2 * config.scale
          ),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            0.5 + Math.random() * 1,
            Math.sin(angle) * speed
          ),
          life: config.duration * 1.5,
          maxLife: config.duration * 1.5,
          size: (0.2 + Math.random() * 0.3) * config.scale,
          opacity: 0.3 + Math.random() * 0.2,
        })
      }
    } else if (!active) {
      initialized.current = false
      particles.current = []
    }
  }, [active, config])

  useFrame((_, delta) => {
    if (!active || !meshRef.current || particles.current.length === 0) return

    for (let i = 0; i < particles.current.length; i++) {
      const p = particles.current[i]
      p.life -= delta

      if (p.life > 0) {
        // Rise and expand
        p.position.add(p.velocity.clone().multiplyScalar(delta))
        p.velocity.multiplyScalar(0.97)
        p.size += delta * 0.5

        const lifeRatio = p.life / p.maxLife
        p.opacity = lifeRatio * 0.3

        dummy.position.copy(p.position)
        dummy.scale.setScalar(p.size)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      } else {
        dummy.position.set(0, -100, 0)
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        meshRef.current.setMatrixAt(i, dummy.matrix)
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  if (!active || !config.includeSmoke) return null

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, SMOKE_PARTICLE_COUNT]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial
          color="#333333"
          transparent
          opacity={0.2}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  )
}

// ============================================================================
// Flash Effect Component
// ============================================================================

interface FlashEffectProps {
  position: [number, number, number]
  active: boolean
  scale: number
}

function FlashEffect({ position, active, scale }: FlashEffectProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [opacity, setOpacity] = useState(1)
  const timerRef = useRef(0)

  useEffect(() => {
    if (active) {
      setOpacity(1)
      timerRef.current = 0
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active) return

    timerRef.current += delta
    const flashDuration = 0.15
    const progress = timerRef.current / flashDuration

    if (progress < 1) {
      setOpacity(1 - progress)
    } else {
      setOpacity(0)
    }
  })

  if (!active || opacity <= 0) return null

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.3 * scale, 16, 16]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================================
// Main ExplosionParticles Component
// ============================================================================

/**
 * ExplosionParticles - Reusable 3D explosion effect.
 *
 * Features:
 * - Configurable particle count and size
 * - White to orange color gradient
 * - Optional smoke particles
 * - Initial flash effect
 * - Fade out over lifetime
 *
 * @example
 * ```tsx
 * function Game() {
 *   const [exploding, setExploding] = useState(false);
 *
 *   return (
 *     <Canvas>
 *       <ExplosionParticles
 *         position={[0, 0, 0]}
 *         active={exploding}
 *         particleCount={80}
 *         includeSmoke={true}
 *         onComplete={() => setExploding(false)}
 *       />
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function ExplosionParticles({
  position,
  active,
  onComplete,
  ...configProps
}: ExplosionParticlesProps) {
  const config = useMemo<Required<ExplosionConfig>>(
    () => ({ ...DEFAULT_CONFIG, ...configProps }),
    [configProps]
  )

  return (
    <>
      {/* Initial flash */}
      <FlashEffect position={position} active={active} scale={config.scale} />

      {/* Main explosion particles */}
      <CoreExplosion
        position={position}
        active={active}
        config={config}
        onComplete={onComplete}
      />

      {/* Smoke effect */}
      <SmokeEffect position={position} active={active} config={config} />
    </>
  )
}

// ============================================================================
// useExplosion Hook
// ============================================================================

/**
 * useExplosion - Hook to manage multiple explosions from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const explosions = useExplosion();
 *
 *   const handleDestroy = (x: number, y: number, z: number) => {
 *     explosions.explode([x, y, z], { particleCount: 80 });
 *   };
 *
 *   return (
 *     <>
 *       {explosions.explosions.map(exp => (
 *         <ExplosionParticles key={exp.id} {...explosions.getProps(exp.id)} />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export function useExplosion(): UseExplosionResult {
  const [explosions, setExplosions] = useState<
    Array<{ id: number; position: [number, number, number]; config: ExplosionConfig }>
  >([])
  const nextId = useRef(0)

  const explode = useCallback(
    (position: [number, number, number], config: ExplosionConfig = {}) => {
      const id = nextId.current++
      setExplosions(prev => [...prev, { id, position, config }])
    },
    []
  )

  const removeExplosion = useCallback((id: number) => {
    setExplosions(prev => prev.filter(e => e.id !== id))
  }, [])

  const getProps = useCallback(
    (id: number): ExplosionParticlesProps => {
      const exp = explosions.find(e => e.id === id)
      if (!exp) {
        return {
          position: [0, 0, 0],
          active: false,
          onComplete: () => {},
        }
      }
      return {
        position: exp.position,
        active: true,
        ...exp.config,
        onComplete: () => removeExplosion(id),
      }
    },
    [explosions, removeExplosion]
  )

  return {
    explode,
    explosions,
    getProps,
  }
}

// ============================================================================
// Preset Explosion Types
// ============================================================================

/**
 * Preset configurations for common explosion types.
 */
export const EXPLOSION_PRESETS = {
  /**
   * Small impact explosion (e.g., bullet hit).
   */
  small: {
    particleCount: 20,
    particleSize: 0.05,
    expansionSpeed: 3,
    duration: 0.4,
    startColor: '#ffff88',
    endColor: '#ff4400',
  },
  /**
   * Medium explosion (e.g., enemy destroyed).
   */
  medium: {
    particleCount: 50,
    particleSize: 0.1,
    expansionSpeed: 5,
    duration: 0.8,
    startColor: '#ffffff',
    endColor: '#ff6600',
    includeSmoke: true,
  },
  /**
   * Large explosion (e.g., boss destroyed).
   */
  large: {
    particleCount: 100,
    particleSize: 0.15,
    expansionSpeed: 7,
    duration: 1.2,
    startColor: '#ffffff',
    endColor: '#ff4400',
    includeSmoke: true,
  },
  /**
   * Fire explosion with gravity.
   */
  fire: {
    particleCount: 60,
    particleSize: 0.12,
    expansionSpeed: 4,
    duration: 1.0,
    startColor: '#ffff00',
    endColor: '#ff2200',
    gravity: 5,
    includeSmoke: true,
  },
  /**
   * Energy/plasma explosion (no gravity, bright).
   */
  energy: {
    particleCount: 80,
    particleSize: 0.08,
    expansionSpeed: 8,
    duration: 0.6,
    startColor: '#00ffff',
    endColor: '#0066ff',
    gravity: 0,
  },
} as const satisfies Record<string, ExplosionConfig>

export type ExplosionPreset = keyof typeof EXPLOSION_PRESETS

/**
 * Get a preset explosion configuration.
 */
export function getExplosionPreset(preset: ExplosionPreset): ExplosionConfig {
  return EXPLOSION_PRESETS[preset]
}

// ============================================================================
// Exports
// ============================================================================

export default ExplosionParticles
