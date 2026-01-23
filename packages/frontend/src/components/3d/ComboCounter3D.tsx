import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface ComboCounter3DProps {
  /**
   * Current combo multiplier (0 = no combo, 1+ = combo active).
   * @default 0
   */
  combo?: number
  /**
   * Position offset [x, y, z].
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Base scale of the counter.
   * @default 1
   */
  baseScale?: number
  /**
   * Whether the counter is visible (false hides with animation).
   * @default true
   */
  visible?: boolean
  /**
   * Duration of entrance/exit animation in seconds.
   * @default 0.3
   */
  animationDuration?: number
  /**
   * Enable particle effects on high combos.
   * @default true
   */
  enableParticles?: boolean
  /**
   * Combo threshold for particle effects.
   * @default 3
   */
  particleThreshold?: number
  /**
   * Callback when combo animation completes.
   */
  onAnimationComplete?: () => void
}

/**
 * Color level configuration for combo stages.
 */
export interface ComboColorLevel {
  minCombo: number
  color: string
  glowColor: string
  particleColor: string
}

// Animation state
interface AnimationState {
  displayedCombo: number
  targetCombo: number
  scale: number
  targetScale: number
  opacity: number
  targetOpacity: number
  pulsePhase: number
  scaleBoost: number
  rotationZ: number
  lastCombo: number
}

// Particle state
interface ParticleState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_SCALE = 1
const DEFAULT_ANIMATION_DURATION = 0.3
const DEFAULT_PARTICLE_THRESHOLD = 3

// Animation parameters
const SCALE_BOOST_ON_INCREASE = 0.4
const SCALE_BOOST_DECAY = 4
const SCALE_LERP_SPEED = 8
const OPACITY_LERP_SPEED = 6
const ROTATION_SPEED = 0.5
const MAX_ROTATION = Math.PI / 12

// Particle parameters
const PARTICLE_COUNT = 20
const PARTICLE_SPAWN_RATE = 5 // particles per second during high combo
const PARTICLE_LIFETIME = 1.0
const PARTICLE_SPEED = 2

/**
 * Color levels for different combo stages.
 * Higher combos get more intense colors.
 */
export const COMBO_COLOR_LEVELS: ComboColorLevel[] = [
  { minCombo: 1, color: '#00ffff', glowColor: 'rgba(0, 255, 255, 0.4)', particleColor: '#00ffff' },
  { minCombo: 3, color: '#00ff88', glowColor: 'rgba(0, 255, 136, 0.5)', particleColor: '#00ff88' },
  { minCombo: 5, color: '#ffff00', glowColor: 'rgba(255, 255, 0, 0.5)', particleColor: '#ffff00' },
  { minCombo: 8, color: '#ff8800', glowColor: 'rgba(255, 136, 0, 0.6)', particleColor: '#ff8800' },
  { minCombo: 12, color: '#ff00ff', glowColor: 'rgba(255, 0, 255, 0.6)', particleColor: '#ff00ff' },
  { minCombo: 20, color: '#ff0000', glowColor: 'rgba(255, 0, 0, 0.7)', particleColor: '#ff4444' },
]

/**
 * Get color level for a given combo.
 */
function getComboColorLevel(combo: number): ComboColorLevel {
  let level = COMBO_COLOR_LEVELS[0]
  for (const l of COMBO_COLOR_LEVELS) {
    if (combo >= l.minCombo) {
      level = l
    }
  }
  return level
}

// ============================================================================
// Particle System
// ============================================================================

interface ParticleSystemProps {
  active: boolean
  combo: number
  color: THREE.Color
}

function ParticleSystem({ active, combo, color }: ParticleSystemProps) {
  const particlesRef = useRef<ParticleState[]>([])
  const spawnTimerRef = useRef(0)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const positionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3))
  const sizesRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT))
  const opacitiesRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT))

  // Initialize particles
  useEffect(() => {
    particlesRef.current = []
  }, [])

  useFrame((_, delta) => {
    if (!geometryRef.current) return

    const particles = particlesRef.current

    // Spawn new particles if active
    if (active && combo >= DEFAULT_PARTICLE_THRESHOLD) {
      spawnTimerRef.current += delta
      const spawnInterval = 1 / (PARTICLE_SPAWN_RATE * (combo / 5))

      while (spawnTimerRef.current >= spawnInterval && particles.length < PARTICLE_COUNT) {
        spawnTimerRef.current -= spawnInterval

        // Random direction outward
        const angle = Math.random() * Math.PI * 2
        const speed = PARTICLE_SPEED * (0.5 + Math.random() * 0.5)

        particles.push({
          position: new THREE.Vector3(0, 0, 0),
          velocity: new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed + 1, // Slight upward bias
            (Math.random() - 0.5) * speed * 0.5
          ),
          life: PARTICLE_LIFETIME,
          maxLife: PARTICLE_LIFETIME,
          size: 0.05 + Math.random() * 0.05,
          color: color.clone(),
        })
      }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= delta

      if (p.life <= 0) {
        particles.splice(i, 1)
        continue
      }

      // Update position
      p.position.add(p.velocity.clone().multiplyScalar(delta))

      // Add some gravity
      p.velocity.y -= delta * 2
    }

    // Update geometry attributes
    const positions = positionsRef.current
    const sizes = sizesRef.current
    const opacities = opacitiesRef.current

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i < particles.length) {
        const p = particles[i]
        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z
        sizes[i] = p.size * (p.life / p.maxLife)
        opacities[i] = p.life / p.maxLife
      } else {
        positions[i * 3] = 0
        positions[i * 3 + 1] = 0
        positions[i * 3 + 2] = 0
        sizes[i] = 0
        opacities[i] = 0
      }
    }

    geometryRef.current.attributes.position.needsUpdate = true
    geometryRef.current.attributes.size.needsUpdate = true
    geometryRef.current.attributes.opacity.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizesRef.current}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={PARTICLE_COUNT}
          array={opacitiesRef.current}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          color: { value: color },
        }}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          varying float vOpacity;

          void main() {
            vOpacity = opacity;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 200.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform vec3 color;
          varying float vOpacity;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            float alpha = (1.0 - dist * 2.0) * vOpacity;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </points>
  )
}

// ============================================================================
// Combo Number Display
// ============================================================================

interface ComboNumberProps {
  combo: number
  color: THREE.Color
  scale: number
  opacity: number
}

function ComboNumber({ combo, color, scale, opacity }: ComboNumberProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Create the "xN" text shape using basic geometry
  // Since we don't have font loading, we'll use a simpler approach with shapes

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.opacity.value = opacity
    }
  })

  // Create X shape
  const xShape = useMemo(() => {
    const shape = new THREE.Shape()
    const s = 0.15
    const t = 0.04

    // First diagonal of X
    shape.moveTo(-s, -s + t)
    shape.lineTo(-s + t, -s)
    shape.lineTo(0, -t)
    shape.lineTo(s - t, -s)
    shape.lineTo(s, -s + t)
    shape.lineTo(t, 0)
    shape.lineTo(s, s - t)
    shape.lineTo(s - t, s)
    shape.lineTo(0, t)
    shape.lineTo(-s + t, s)
    shape.lineTo(-s, s - t)
    shape.lineTo(-t, 0)
    shape.closePath()

    return shape
  }, [])

  // Create digit shapes (0-9)
  const createDigitShape = (digit: number): THREE.Shape => {
    const shape = new THREE.Shape()
    const w = 0.12
    const h = 0.2
    const t = 0.03

    // Simple block digit representation
    switch (digit) {
      case 0: {
        // Outer rectangle
        shape.moveTo(-w, -h)
        shape.lineTo(w, -h)
        shape.lineTo(w, h)
        shape.lineTo(-w, h)
        shape.closePath()
        // Inner hole
        const hole0 = new THREE.Path()
        hole0.moveTo(-w + t, -h + t)
        hole0.lineTo(-w + t, h - t)
        hole0.lineTo(w - t, h - t)
        hole0.lineTo(w - t, -h + t)
        hole0.closePath()
        shape.holes.push(hole0)
        break
      }
      case 1:
        shape.moveTo(0, -h)
        shape.lineTo(t, -h)
        shape.lineTo(t, h)
        shape.lineTo(0, h)
        shape.closePath()
        break
      case 2:
        shape.moveTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, 0)
        shape.lineTo(-w + t, 0)
        shape.lineTo(-w + t, -h + t)
        shape.lineTo(w, -h + t)
        shape.lineTo(w, -h)
        shape.lineTo(-w, -h)
        shape.lineTo(-w, t)
        shape.lineTo(w - t, t)
        shape.lineTo(w - t, h - t)
        shape.lineTo(-w, h - t)
        shape.closePath()
        break
      case 3:
        shape.moveTo(-w, h)
        shape.lineTo(w, h)
        shape.lineTo(w, -h)
        shape.lineTo(-w, -h)
        shape.lineTo(-w, -h + t)
        shape.lineTo(w - t, -h + t)
        shape.lineTo(w - t, -t)
        shape.lineTo(-w, -t)
        shape.lineTo(-w, t)
        shape.lineTo(w - t, t)
        shape.lineTo(w - t, h - t)
        shape.lineTo(-w, h - t)
        shape.closePath()
        break
      default:
        // Default: simple rectangle
        shape.moveTo(-w, -h)
        shape.lineTo(w, -h)
        shape.lineTo(w, h)
        shape.lineTo(-w, h)
        shape.closePath()
    }

    return shape
  }

  // Get digit shapes for the combo number
  const digitShapes = useMemo(() => {
    const digits = combo.toString().split('').map(Number)
    return digits.map((d) => createDigitShape(d))
  }, [combo])

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* X symbol */}
      <mesh position={[-0.25, 0, 0]}>
        <shapeGeometry args={[xShape]} />
        <shaderMaterial
          ref={materialRef}
          transparent
          blending={THREE.AdditiveBlending}
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
              gl_FragColor = vec4(color, opacity);
            }
          `}
        />
      </mesh>

      {/* Digit(s) */}
      {digitShapes.map((shape, index) => (
        <mesh key={index} position={[0.1 + index * 0.3, 0, 0]}>
          <shapeGeometry args={[shape]} />
          <shaderMaterial
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
// Glow Background
// ============================================================================

interface GlowBackgroundProps {
  color: THREE.Color
  intensity: number
  scale: number
}

function GlowBackground({ color, intensity, scale }: GlowBackgroundProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.intensity.value = intensity
    }
  })

  return (
    <mesh position={[0, 0, -0.01]} scale={[scale, scale, 1]}>
      <planeGeometry args={[1.5, 0.8]} />
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
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(vUv, center);
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 1.5);
            float alpha = glow * intensity * 0.6;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Main ComboCounter3D Component
// ============================================================================

/**
 * ComboCounter3D - Dynamic combo multiplier display with particle effects.
 *
 * Features:
 * - Animated entrance/exit
 * - Scale boost on combo increase
 * - Color changes based on combo level
 * - Fire/energy particle effects on high combos
 * - Smooth transitions between states
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <ComboCounter3D
 *     combo={5}
 *     position={[2, 1, 0]}
 *     enableParticles={true}
 *   />
 * </Canvas>
 * ```
 */
export function ComboCounter3D({
  combo = 0,
  position = [0, 0, 0],
  baseScale = DEFAULT_BASE_SCALE,
  visible = true,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  enableParticles = true,
  particleThreshold = DEFAULT_PARTICLE_THRESHOLD,
  onAnimationComplete,
}: ComboCounter3DProps) {
  // Animation state
  const animState = useRef<AnimationState>({
    displayedCombo: combo,
    targetCombo: combo,
    scale: combo > 0 && visible ? baseScale : 0,
    targetScale: combo > 0 && visible ? baseScale : 0,
    opacity: combo > 0 && visible ? 1 : 0,
    targetOpacity: combo > 0 && visible ? 1 : 0,
    pulsePhase: 0,
    scaleBoost: 0,
    rotationZ: 0,
    lastCombo: combo,
  })

  // Current color based on combo level
  const colorLevel = useMemo(() => getComboColorLevel(combo), [combo])
  const currentColor = useMemo(() => new THREE.Color(colorLevel.color), [colorLevel])
  const particleColor = useMemo(() => new THREE.Color(colorLevel.particleColor), [colorLevel])

  // Update targets when combo or visibility changes
  useEffect(() => {
    const state = animState.current
    state.targetCombo = combo

    if (combo > 0 && visible) {
      state.targetScale = baseScale
      state.targetOpacity = 1

      // Add scale boost when combo increases
      if (combo > state.lastCombo) {
        state.scaleBoost = SCALE_BOOST_ON_INCREASE * Math.min(combo / 5, 1.5)
      }
    } else {
      state.targetScale = 0
      state.targetOpacity = 0
    }

    state.lastCombo = combo
  }, [combo, visible, baseScale])

  // Reference for the group
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    const state = animState.current
    const speed = 1 / Math.max(animationDuration, 0.1)

    // Animate scale
    const scaleDiff = state.targetScale + state.scaleBoost - state.scale
    state.scale += scaleDiff * SCALE_LERP_SPEED * delta

    // Decay scale boost
    if (state.scaleBoost > 0) {
      state.scaleBoost -= SCALE_BOOST_DECAY * delta
      state.scaleBoost = Math.max(0, state.scaleBoost)
    }

    // Animate opacity
    const opacityDiff = state.targetOpacity - state.opacity
    state.opacity += opacityDiff * OPACITY_LERP_SPEED * delta

    // Animate combo number
    if (state.displayedCombo !== state.targetCombo) {
      const comboDiff = state.targetCombo - state.displayedCombo
      state.displayedCombo += comboDiff * speed * delta * 10

      if (Math.abs(comboDiff) < 0.5) {
        state.displayedCombo = state.targetCombo
        onAnimationComplete?.()
      }
    }

    // Pulse effect for high combos
    if (combo >= particleThreshold) {
      state.pulsePhase += delta * 4
      const pulse = Math.sin(state.pulsePhase) * 0.05 + 1
      state.scale *= pulse
    }

    // Subtle rotation oscillation
    state.rotationZ = Math.sin(state.pulsePhase * 0.5) * MAX_ROTATION * ROTATION_SPEED

    // Update group transform
    if (groupRef.current) {
      groupRef.current.scale.setScalar(state.scale)
      groupRef.current.rotation.z = state.rotationZ
    }
  })

  const state = animState.current
  const showParticles = enableParticles && combo >= particleThreshold && visible

  return (
    <group ref={groupRef} position={position}>
      {/* Glow background */}
      <GlowBackground color={currentColor} intensity={state.opacity * 0.5} scale={state.scale} />

      {/* Combo number display */}
      <ComboNumber
        combo={Math.round(state.displayedCombo)}
        color={currentColor}
        scale={1}
        opacity={state.opacity}
      />

      {/* Particle system */}
      <ParticleSystem active={showParticles} combo={combo} color={particleColor} />
    </group>
  )
}

// ============================================================================
// Utility Hook
// ============================================================================

export interface UseComboCounterResult {
  combo: number
  incrementCombo: () => void
  resetCombo: () => void
  setCombo: (value: number) => void
  props: Pick<ComboCounter3DProps, 'combo'>
}

/**
 * Hook to control ComboCounter3D from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const comboControl = useComboCounter();
 *
 *   const handleHit = () => {
 *     comboControl.incrementCombo();
 *   };
 *
 *   const handleMiss = () => {
 *     comboControl.resetCombo();
 *   };
 *
 *   return <ComboCounter3D {...comboControl.props} />;
 * }
 * ```
 */
export function useComboCounter(): UseComboCounterResult {
  const comboRef = useRef(0)

  return {
    get combo() {
      return comboRef.current
    },
    incrementCombo: () => {
      comboRef.current += 1
    },
    resetCombo: () => {
      comboRef.current = 0
    },
    setCombo: (value: number) => {
      comboRef.current = Math.max(0, value)
    },
    get props() {
      return {
        combo: comboRef.current,
      }
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ComboCounter3D
