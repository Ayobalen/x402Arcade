import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface ScoreDisplay3DProps {
  /**
   * The current score to display.
   * @default 0
   */
  score?: number
  /**
   * Maximum number of digits to display.
   * @default 6
   */
  maxDigits?: number
  /**
   * Width of each digit segment.
   * @default 0.25
   */
  digitWidth?: number
  /**
   * Height of each digit segment.
   * @default 0.45
   */
  digitHeight?: number
  /**
   * Spacing between digits.
   * @default 0.08
   */
  digitSpacing?: number
  /**
   * Primary color of the score display (CSS color string).
   * @default '#00ffff'
   */
  color?: string
  /**
   * Secondary color for off segments (CSS color string).
   * @default '#1a1a2e'
   */
  offColor?: string
  /**
   * Glow intensity (0-1).
   * @default 0.8
   */
  glowIntensity?: number
  /**
   * Position offset [x, y, z].
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Animation speed multiplier for score changes.
   * @default 1
   */
  animationSpeed?: number
  /**
   * Enable pulsing glow effect.
   * @default true
   */
  enablePulse?: boolean
  /**
   * Show leading zeros.
   * @default true
   */
  showLeadingZeros?: boolean
  /**
   * Callback when score animation completes.
   */
  onAnimationComplete?: () => void
}

// Animation state for score changes
interface AnimationState {
  displayedScore: number
  targetScore: number
  velocity: number
  glowBoost: number
  isAnimating: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_MAX_DIGITS = 6
const DEFAULT_DIGIT_WIDTH = 0.25
const DEFAULT_DIGIT_HEIGHT = 0.45
const DEFAULT_DIGIT_SPACING = 0.08
const DEFAULT_COLOR = '#00ffff'
const DEFAULT_OFF_COLOR = '#1a1a2e'
const DEFAULT_GLOW_INTENSITY = 0.8
const DEFAULT_ANIMATION_SPEED = 1

// Segment thickness relative to digit size
const SEGMENT_THICKNESS = 0.08
const SEGMENT_LENGTH_RATIO = 0.8

// Animation parameters
const ANIMATION_ACCELERATION = 5
const ANIMATION_MAX_VELOCITY = 50
const GLOW_BOOST_DECAY = 3
const GLOW_BOOST_ON_CHANGE = 0.5

/**
 * 7-segment display mapping for digits 0-9.
 * Segments are arranged as:
 *   _0_
 *  |   |
 *  1   2
 *  |_3_|
 *  |   |
 *  4   5
 *  |_6_|
 */
const SEGMENT_MAP: Record<number, boolean[]> = {
  0: [true, true, true, false, true, true, true],
  1: [false, false, true, false, false, true, false],
  2: [true, false, true, true, true, false, true],
  3: [true, false, true, true, false, true, true],
  4: [false, true, true, true, false, true, false],
  5: [true, true, false, true, false, true, true],
  6: [true, true, false, true, true, true, true],
  7: [true, false, true, false, false, true, false],
  8: [true, true, true, true, true, true, true],
  9: [true, true, true, true, false, true, true],
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Splits a number into an array of digits.
 */
function numberToDigits(num: number, maxDigits: number, showLeadingZeros: boolean): number[] {
  const str = Math.floor(Math.max(0, num)).toString()
  const digits: number[] = []

  // Pad with leading zeros if needed
  const paddedLength = showLeadingZeros ? maxDigits : Math.max(str.length, 1)
  const padding = Math.max(0, paddedLength - str.length)

  for (let i = 0; i < padding; i++) {
    digits.push(showLeadingZeros ? 0 : -1) // -1 for blank
  }

  for (const char of str.slice(0, maxDigits)) {
    digits.push(parseInt(char, 10))
  }

  return digits.slice(0, maxDigits)
}

// ============================================================================
// Segment Geometry Components
// ============================================================================

interface SegmentProps {
  isOn: boolean
  position: [number, number, number]
  rotation?: [number, number, number]
  width: number
  height: number
  onColor: THREE.Color
  offColor: THREE.Color
  glowIntensity: number
}

/**
 * Single segment of a 7-segment display.
 */
function Segment({
  isOn,
  position,
  rotation = [0, 0, 0],
  width,
  height,
  onColor,
  offColor,
  glowIntensity,
}: SegmentProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Smoothly transition segment on/off
  const targetIntensity = useRef(isOn ? 1 : 0)
  const currentIntensity = useRef(isOn ? 1 : 0)

  useEffect(() => {
    targetIntensity.current = isOn ? 1 : 0
  }, [isOn])

  useFrame((_, delta) => {
    // Smooth transition
    const diff = targetIntensity.current - currentIntensity.current
    currentIntensity.current += diff * Math.min(delta * 10, 1)

    if (materialRef.current) {
      const t = currentIntensity.current
      const color = offColor.clone().lerp(onColor, t)
      materialRef.current.color = color

      // Emissive-like effect through opacity modulation
      const emissiveStrength = t * glowIntensity
      materialRef.current.opacity = 0.3 + emissiveStrength * 0.7
    }
  })

  // Create hexagon-like segment shape for authentic LED look
  const segmentShape = useMemo(() => {
    const shape = new THREE.Shape()
    const hw = width / 2
    const hh = height / 2
    const bevel = height * 0.3

    shape.moveTo(-hw + bevel, -hh)
    shape.lineTo(hw - bevel, -hh)
    shape.lineTo(hw, 0)
    shape.lineTo(hw - bevel, hh)
    shape.lineTo(-hw + bevel, hh)
    shape.lineTo(-hw, 0)
    shape.closePath()

    return shape
  }, [width, height])

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
    >
      <shapeGeometry args={[segmentShape]} />
      <meshBasicMaterial
        ref={materialRef}
        color={isOn ? onColor : offColor}
        transparent
        opacity={isOn ? 1 : 0.3}
      />
    </mesh>
  )
}

// ============================================================================
// Seven Segment Digit Component
// ============================================================================

interface SevenSegmentDigitProps {
  digit: number // -1 for blank, 0-9 for digits
  width: number
  height: number
  onColor: THREE.Color
  offColor: THREE.Color
  glowIntensity: number
  position: [number, number, number]
}

/**
 * Single 7-segment digit display.
 */
function SevenSegmentDigit({
  digit,
  width,
  height,
  onColor,
  offColor,
  glowIntensity,
  position,
}: SevenSegmentDigitProps) {
  const segments = digit >= 0 && digit <= 9 ? SEGMENT_MAP[digit] : Array(7).fill(false)

  const segW = width * SEGMENT_LENGTH_RATIO
  const segH = SEGMENT_THICKNESS * height
  const halfH = height / 2
  const quarterH = height / 4

  // Segment positions and orientations
  // Top horizontal (0)
  // Left-top vertical (1), Right-top vertical (2)
  // Middle horizontal (3)
  // Left-bottom vertical (4), Right-bottom vertical (5)
  // Bottom horizontal (6)

  const horizontalRotation: [number, number, number] = [0, 0, 0]
  const verticalRotation: [number, number, number] = [0, 0, Math.PI / 2]

  return (
    <group position={position}>
      {/* Top horizontal - segment 0 */}
      <Segment
        isOn={segments[0]}
        position={[0, halfH - segH / 2, 0]}
        rotation={horizontalRotation}
        width={segW}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Left-top vertical - segment 1 */}
      <Segment
        isOn={segments[1]}
        position={[-width / 2 + segH / 2, quarterH, 0]}
        rotation={verticalRotation}
        width={segW * 0.5}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Right-top vertical - segment 2 */}
      <Segment
        isOn={segments[2]}
        position={[width / 2 - segH / 2, quarterH, 0]}
        rotation={verticalRotation}
        width={segW * 0.5}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Middle horizontal - segment 3 */}
      <Segment
        isOn={segments[3]}
        position={[0, 0, 0]}
        rotation={horizontalRotation}
        width={segW}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Left-bottom vertical - segment 4 */}
      <Segment
        isOn={segments[4]}
        position={[-width / 2 + segH / 2, -quarterH, 0]}
        rotation={verticalRotation}
        width={segW * 0.5}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Right-bottom vertical - segment 5 */}
      <Segment
        isOn={segments[5]}
        position={[width / 2 - segH / 2, -quarterH, 0]}
        rotation={verticalRotation}
        width={segW * 0.5}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />

      {/* Bottom horizontal - segment 6 */}
      <Segment
        isOn={segments[6]}
        position={[0, -halfH + segH / 2, 0]}
        rotation={horizontalRotation}
        width={segW}
        height={segH}
        onColor={onColor}
        offColor={offColor}
        glowIntensity={glowIntensity}
      />
    </group>
  )
}

// ============================================================================
// Glow Layer Component
// ============================================================================

interface GlowLayerProps {
  width: number
  height: number
  color: THREE.Color
  intensity: number
}

/**
 * Background glow layer behind the score display.
 */
function GlowLayer({ width, height, color, intensity }: GlowLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.color.value.copy(color)
      materialRef.current.uniforms.intensity.value = intensity
    }
  })

  return (
    <mesh position={[0, 0, -0.02]}>
      <planeGeometry args={[width * 1.3, height * 1.5]} />
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

            // Soft radial gradient
            float glow = 1.0 - smoothstep(0.0, 0.5, dist);
            glow = pow(glow, 2.0);

            float alpha = glow * intensity * 0.4;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  )
}

// ============================================================================
// Main ScoreDisplay3D Component
// ============================================================================

/**
 * ScoreDisplay3D - Arcade-style 3D score display with segmented numbers.
 *
 * Features:
 * - 7-segment LED-style digits
 * - Smooth animation between score values
 * - Glow effects that pulse with score changes
 * - Customizable colors and sizing
 *
 * @example
 * ```tsx
 * <Canvas>
 *   <ScoreDisplay3D
 *     score={12345}
 *     color="#00ffff"
 *     position={[0, 2, 0]}
 *     glowIntensity={0.8}
 *   />
 * </Canvas>
 * ```
 */
export function ScoreDisplay3D({
  score = 0,
  maxDigits = DEFAULT_MAX_DIGITS,
  digitWidth = DEFAULT_DIGIT_WIDTH,
  digitHeight = DEFAULT_DIGIT_HEIGHT,
  digitSpacing = DEFAULT_DIGIT_SPACING,
  color = DEFAULT_COLOR,
  offColor = DEFAULT_OFF_COLOR,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  position = [0, 0, 0],
  animationSpeed = DEFAULT_ANIMATION_SPEED,
  enablePulse = true,
  showLeadingZeros = true,
  onAnimationComplete,
}: ScoreDisplay3DProps) {
  // Color objects
  const onColor = useMemo(() => new THREE.Color(color), [color])
  const offColorObj = useMemo(() => new THREE.Color(offColor), [offColor])

  // Animation state
  const animationState = useRef<AnimationState>({
    displayedScore: score,
    targetScore: score,
    velocity: 0,
    glowBoost: 0,
    isAnimating: false,
  })

  // Update target when score changes
  useEffect(() => {
    const state = animationState.current
    if (state.targetScore !== score) {
      state.targetScore = score
      state.glowBoost = GLOW_BOOST_ON_CHANGE
      state.isAnimating = true
    }
  }, [score])

  // Current displayed digits
  const displayedDigitsRef = useRef<number[]>(numberToDigits(score, maxDigits, showLeadingZeros))

  // Glow intensity state (for animation)
  const currentGlowRef = useRef(glowIntensity)

  useFrame((state, delta) => {
    const anim = animationState.current
    const dt = delta * animationSpeed

    // Animate score value
    if (anim.isAnimating) {
      const diff = anim.targetScore - anim.displayedScore

      if (Math.abs(diff) < 1) {
        // Close enough, snap to target
        anim.displayedScore = anim.targetScore
        anim.velocity = 0
        anim.isAnimating = false
        onAnimationComplete?.()
      } else {
        // Accelerate toward target
        const direction = Math.sign(diff)
        anim.velocity += direction * ANIMATION_ACCELERATION * dt * Math.abs(diff)
        anim.velocity = THREE.MathUtils.clamp(
          anim.velocity,
          -ANIMATION_MAX_VELOCITY,
          ANIMATION_MAX_VELOCITY
        )
        anim.displayedScore += anim.velocity * dt
      }
    }

    // Decay glow boost
    if (anim.glowBoost > 0) {
      anim.glowBoost -= GLOW_BOOST_DECAY * dt
      anim.glowBoost = Math.max(0, anim.glowBoost)
    }

    // Calculate current glow with pulse
    let targetGlow = glowIntensity + anim.glowBoost
    if (enablePulse) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      targetGlow *= pulse
    }
    currentGlowRef.current = THREE.MathUtils.lerp(currentGlowRef.current, targetGlow, dt * 5)

    // Update displayed digits
    displayedDigitsRef.current = numberToDigits(
      Math.floor(anim.displayedScore),
      maxDigits,
      showLeadingZeros
    )
  })

  // Calculate total width for centering
  const totalWidth = maxDigits * digitWidth + (maxDigits - 1) * digitSpacing
  const startX = -totalWidth / 2 + digitWidth / 2

  // Get current digits for rendering
  const digits = numberToDigits(
    Math.floor(animationState.current.displayedScore),
    maxDigits,
    showLeadingZeros
  )

  return (
    <group position={position}>
      {/* Background glow */}
      <GlowLayer
        width={totalWidth}
        height={digitHeight}
        color={onColor}
        intensity={currentGlowRef.current * 0.3}
      />

      {/* Digits */}
      {digits.map((digit, index) => (
        <SevenSegmentDigit
          key={index}
          digit={digit}
          width={digitWidth}
          height={digitHeight}
          onColor={onColor}
          offColor={offColorObj}
          glowIntensity={currentGlowRef.current}
          position={[startX + index * (digitWidth + digitSpacing), 0, 0]}
        />
      ))}
    </group>
  )
}

// ============================================================================
// Utility Hook for External Control
// ============================================================================

export interface UseScoreDisplayResult {
  score: number
  setScore: (value: number) => void
  addScore: (delta: number) => void
  resetScore: () => void
  props: Pick<ScoreDisplay3DProps, 'score'>
}

/**
 * Hook to control ScoreDisplay3D from game logic.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const scoreControl = useScoreDisplay();
 *
 *   const handlePointScored = () => {
 *     scoreControl.addScore(100);
 *   };
 *
 *   return <ScoreDisplay3D {...scoreControl.props} />;
 * }
 * ```
 */
export function useScoreDisplay(initialScore = 0): UseScoreDisplayResult {
  const scoreRef = useRef(initialScore)

  return {
    get score() {
      return scoreRef.current
    },
    setScore: (value: number) => {
      scoreRef.current = Math.max(0, value)
    },
    addScore: (delta: number) => {
      scoreRef.current = Math.max(0, scoreRef.current + delta)
    },
    resetScore: () => {
      scoreRef.current = 0
    },
    get props() {
      return {
        score: scoreRef.current,
      }
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ScoreDisplay3D
