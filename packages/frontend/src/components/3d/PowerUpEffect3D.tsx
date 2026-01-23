import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

/**
 * Power-up types supported by the effect system.
 */
export type PowerUpType =
  | 'speed'      // Speed boost - cyan/electric blue
  | 'shield'     // Shield/protection - golden yellow
  | 'multiball'  // Multi-ball/extra life - bright green
  | 'laser'      // Weapon/laser - magenta/pink
  | 'slow'       // Slow time - purple
  | 'bonus'      // Score bonus - orange
  | 'mystery'    // Mystery/random - rainbow cycling

export interface PowerUpEffect3DProps {
  /**
   * The type of power-up, determines color and effect style.
   */
  type: PowerUpType
  /**
   * Position [x, y, z] where the effect should appear.
   */
  position: [number, number, number]
  /**
   * Whether the effect is active (triggers animation on true).
   * @default false
   */
  active?: boolean
  /**
   * Duration of the effect in seconds.
   * @default 1.0
   */
  duration?: number
  /**
   * Scale multiplier for the effect size.
   * @default 1
   */
  scale?: number
  /**
   * Number of particles in the burst effect.
   * @default 20
   */
  particleCount?: number
  /**
   * Called when the effect animation completes.
   */
  onComplete?: () => void
}

/**
 * Power-up color configuration.
 */
export interface PowerUpColorConfig {
  primary: string
  secondary: string
  glow: string
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Color configurations for each power-up type.
 */
export const POWER_UP_COLORS: Record<PowerUpType, PowerUpColorConfig> = {
  speed: {
    primary: '#00ffff',   // Cyan
    secondary: '#0088ff', // Electric blue
    glow: 'rgba(0, 255, 255, 0.5)',
  },
  shield: {
    primary: '#ffd700',   // Gold
    secondary: '#ffaa00', // Orange-gold
    glow: 'rgba(255, 215, 0, 0.5)',
  },
  multiball: {
    primary: '#00ff88',   // Bright green
    secondary: '#00dd66', // Slightly darker green
    glow: 'rgba(0, 255, 136, 0.5)',
  },
  laser: {
    primary: '#ff00ff',   // Magenta
    secondary: '#ff44aa', // Pink
    glow: 'rgba(255, 0, 255, 0.5)',
  },
  slow: {
    primary: '#8844ff',   // Purple
    secondary: '#aa66ff', // Light purple
    glow: 'rgba(136, 68, 255, 0.5)',
  },
  bonus: {
    primary: '#ff8800',   // Orange
    secondary: '#ffaa44', // Light orange
    glow: 'rgba(255, 136, 0, 0.5)',
  },
  mystery: {
    primary: '#ffffff',   // White (will cycle)
    secondary: '#aaaaaa', // Gray
    glow: 'rgba(255, 255, 255, 0.5)',
  },
}

// Animation parameters
const DEFAULT_DURATION = 1.0
const DEFAULT_PARTICLE_COUNT = 20
const MAX_PARTICLE_COUNT = 50

const PARTICLE_SPEED = 3.0
const PARTICLE_LIFETIME = 0.8
const RING_EXPANSION_SPEED = 4.0
const FLASH_DURATION = 0.15

// ============================================================================
// Particle State Interface
// ============================================================================

interface ParticleState {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  rotation: number
  rotationSpeed: number
}

// ============================================================================
// Burst Particles Component
// ============================================================================

interface BurstParticlesProps {
  active: boolean
  color: THREE.Color
  secondaryColor: THREE.Color
  particleCount: number
  scale: number
}

function BurstParticles({ active, color, secondaryColor, particleCount, scale }: BurstParticlesProps) {
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const particles = useRef<ParticleState[]>([])
  const spawned = useRef(false)

  const positionsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))
  const sizesRef = useRef<Float32Array>(new Float32Array(particleCount))
  const opacitiesRef = useRef<Float32Array>(new Float32Array(particleCount))
  const colorsRef = useRef<Float32Array>(new Float32Array(particleCount * 3))

  // Spawn particles when activated
  useEffect(() => {
    if (active && !spawned.current) {
      spawned.current = true
      particles.current = []

      for (let i = 0; i < particleCount; i++) {
        // Random spherical direction
        const phi = Math.random() * Math.PI * 2
        const theta = Math.acos(2 * Math.random() - 1)
        const speed = PARTICLE_SPEED * (0.5 + Math.random() * 0.5) * scale

        const velocity = new THREE.Vector3(
          Math.sin(theta) * Math.cos(phi) * speed,
          Math.sin(theta) * Math.sin(phi) * speed,
          Math.cos(theta) * speed
        )

        particles.current.push({
          position: new THREE.Vector3(0, 0, 0),
          velocity,
          life: PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3),
          maxLife: PARTICLE_LIFETIME,
          size: (0.05 + Math.random() * 0.05) * scale,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 4,
        })
      }
    } else if (!active) {
      spawned.current = false
      particles.current = []
    }
  }, [active, particleCount, scale])

  useFrame((_, delta) => {
    if (!geometryRef.current || !particles.current.length) return

    const positions = positionsRef.current
    const sizes = sizesRef.current
    const opacities = opacitiesRef.current
    const colors = colorsRef.current

    for (let i = 0; i < particleCount; i++) {
      if (i < particles.current.length) {
        const p = particles.current[i]
        p.life -= delta

        if (p.life > 0) {
          // Update position
          p.position.add(p.velocity.clone().multiplyScalar(delta))

          // Apply drag
          p.velocity.multiplyScalar(0.98)

          // Update rotation
          p.rotation += p.rotationSpeed * delta

          positions[i * 3] = p.position.x
          positions[i * 3 + 1] = p.position.y
          positions[i * 3 + 2] = p.position.z

          const lifeRatio = p.life / p.maxLife
          sizes[i] = p.size * lifeRatio
          opacities[i] = lifeRatio

          // Blend between primary and secondary color based on life
          const blendedColor = color.clone().lerp(secondaryColor, 1 - lifeRatio)
          colors[i * 3] = blendedColor.r
          colors[i * 3 + 1] = blendedColor.g
          colors[i * 3 + 2] = blendedColor.b
        } else {
          positions[i * 3] = 0
          positions[i * 3 + 1] = 0
          positions[i * 3 + 2] = 0
          sizes[i] = 0
          opacities[i] = 0
        }
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
    geometryRef.current.attributes.color.needsUpdate = true
  })

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positionsRef.current}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizesRef.current}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={particleCount}
          array={opacitiesRef.current}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colorsRef.current}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        vertexShader={`
          attribute float size;
          attribute float opacity;
          attribute vec3 color;
          varying float vOpacity;
          varying vec3 vColor;

          void main() {
            vOpacity = opacity;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * 300.0 / -mvPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying float vOpacity;
          varying vec3 vColor;

          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            float alpha = (1.0 - dist * 2.0) * vOpacity;
            gl_FragColor = vec4(vColor, alpha);
          }
        `}
      />
    </points>
  )
}

// ============================================================================
// Expanding Ring Component
// ============================================================================

interface ExpandingRingProps {
  active: boolean
  color: THREE.Color
  scale: number
  duration: number
}

function ExpandingRing({ active, color, scale, duration }: ExpandingRingProps) {
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
    if (!active || !meshRef.current || !materialRef.current) return

    startTime.current += delta
    const progress = Math.min(startTime.current / duration, 1)

    // Expand ring
    const ringScale = 1 + progress * RING_EXPANSION_SPEED * scale
    meshRef.current.scale.setScalar(ringScale)

    // Fade out
    const opacity = 1 - progress
    materialRef.current.uniforms.opacity.value = opacity * 0.8

    // Add slight rotation
    meshRef.current.rotation.z += delta * 2

    if (progress >= 1) {
      setVisible(false)
    }
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.3 * scale, 0.35 * scale, 32]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          color: { value: color },
          opacity: { value: 1.0 },
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
            float glow = 1.0 - abs(vUv.x - 0.5) * 2.0;
            gl_FragColor = vec4(color, opacity * glow);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Center Flash Component
// ============================================================================

interface CenterFlashProps {
  active: boolean
  color: THREE.Color
  scale: number
}

function CenterFlash({ active, color, scale }: CenterFlashProps) {
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
    if (!visible || !meshRef.current || !materialRef.current) return

    startTime.current += delta
    const progress = startTime.current / FLASH_DURATION

    if (progress >= 1) {
      setVisible(false)
      return
    }

    // Quick flash: scale up then fade
    const flashScale = 1 + progress * 2
    meshRef.current.scale.setScalar(flashScale * scale)

    const opacity = 1 - progress
    materialRef.current.uniforms.opacity.value = opacity
  })

  if (!visible) return null

  return (
    <mesh ref={meshRef}>
      <circleGeometry args={[0.2 * scale, 32]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          color: { value: color },
          opacity: { value: 1.0 },
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
            float dist = distance(vUv, vec2(0.5));
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 0.5);
            gl_FragColor = vec4(color, opacity * glow);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Mystery Rainbow Effect
// ============================================================================

function useMysteryColor(active: boolean, _duration?: number): THREE.Color {
  const colorRef = useRef(new THREE.Color('#ff0000'))

  useFrame((state) => {
    if (!active) return

    // Cycle through rainbow colors
    const hue = (state.clock.elapsedTime * 2) % 1
    colorRef.current.setHSL(hue, 1, 0.5)
  })

  return colorRef.current
}

// ============================================================================
// Main PowerUpEffect3D Component
// ============================================================================

/**
 * PowerUpEffect3D - Particle and mesh effects for power-up collection.
 *
 * Features:
 * - Burst particles on collection
 * - Expanding ring effect
 * - Center flash
 * - Color-coded by power-up type
 * - Optimized particle count
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <PowerUpEffect3D
 *     type="speed"
 *     position={[1, 0, 0]}
 *     active={collected}
 *     onComplete={() => setCollected(false)}
 *   />
 * </Canvas>
 * ```
 */
export function PowerUpEffect3D({
  type,
  position,
  active = false,
  duration = DEFAULT_DURATION,
  scale = 1,
  particleCount = DEFAULT_PARTICLE_COUNT,
  onComplete,
}: PowerUpEffect3DProps) {
  const [effectActive, setEffectActive] = useState(false)
  const effectTimer = useRef(0)

  // Get colors for this power-up type
  const colorConfig = useMemo(() => POWER_UP_COLORS[type], [type])

  // Colors as THREE.Color objects
  const primaryColor = useMemo(() => new THREE.Color(colorConfig.primary), [colorConfig])
  const secondaryColor = useMemo(() => new THREE.Color(colorConfig.secondary), [colorConfig])

  // For mystery type, use cycling color
  const mysteryColor = useMysteryColor(type === 'mystery' && active, duration)
  const effectColor = type === 'mystery' ? mysteryColor : primaryColor

  // Clamp particle count
  const clampedParticleCount = Math.min(Math.max(particleCount, 1), MAX_PARTICLE_COUNT)

  // Trigger effect when active changes to true
  useEffect(() => {
    if (active && !effectActive) {
      setEffectActive(true)
      effectTimer.current = 0
    }
  }, [active, effectActive])

  // Track effect duration and call onComplete
  useFrame((_, delta) => {
    if (!effectActive) return

    effectTimer.current += delta

    if (effectTimer.current >= duration) {
      setEffectActive(false)
      onComplete?.()
    }
  })

  return (
    <group position={position}>
      {/* Center flash */}
      <CenterFlash
        active={effectActive}
        color={effectColor}
        scale={scale}
      />

      {/* Expanding ring */}
      <ExpandingRing
        active={effectActive}
        color={effectColor}
        scale={scale}
        duration={duration}
      />

      {/* Burst particles */}
      <BurstParticles
        active={effectActive}
        color={effectColor}
        secondaryColor={secondaryColor}
        particleCount={clampedParticleCount}
        scale={scale}
      />
    </group>
  )
}

// ============================================================================
// Utility Hook
// ============================================================================

export interface UsePowerUpEffectResult {
  trigger: (type: PowerUpType, position: [number, number, number]) => void
  activeEffects: Array<{
    id: number
    type: PowerUpType
    position: [number, number, number]
  }>
  props: (id: number) => {
    type: PowerUpType
    position: [number, number, number]
    active: boolean
    onComplete: () => void
  }
}

/**
 * Hook to manage multiple power-up effects from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const powerUpEffect = usePowerUpEffect();
 *
 *   const handleCollect = (type: PowerUpType, pos: [number, number, number]) => {
 *     powerUpEffect.trigger(type, pos);
 *   };
 *
 *   return (
 *     <>
 *       {powerUpEffect.activeEffects.map(effect => (
 *         <PowerUpEffect3D key={effect.id} {...powerUpEffect.props(effect.id)} />
 *       ))}
 *     </>
 *   );
 * }
 * ```
 */
export function usePowerUpEffect(): UsePowerUpEffectResult {
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number
    type: PowerUpType
    position: [number, number, number]
  }>>([])
  const nextId = useRef(0)

  const trigger = (type: PowerUpType, position: [number, number, number]) => {
    const id = nextId.current++
    setActiveEffects(prev => [...prev, { id, type, position }])
  }

  const removeEffect = (id: number) => {
    setActiveEffects(prev => prev.filter(e => e.id !== id))
  }

  const getProps = (id: number) => {
    const effect = activeEffects.find(e => e.id === id)
    if (!effect) {
      return {
        type: 'bonus' as PowerUpType,
        position: [0, 0, 0] as [number, number, number],
        active: false,
        onComplete: () => {},
      }
    }

    return {
      type: effect.type,
      position: effect.position,
      active: true,
      onComplete: () => removeEffect(id),
    }
  }

  return {
    trigger,
    activeEffects,
    props: getProps,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default PowerUpEffect3D
