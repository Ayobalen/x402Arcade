import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface ScreenReflectionProps {
  /**
   * Reference to the source canvas element containing the game graphics.
   * The reflection will mirror this canvas content.
   */
  sourceCanvas: HTMLCanvasElement | null
  /**
   * Width of the reflection plane.
   * @default 4
   */
  width?: number
  /**
   * Height of the reflection plane.
   * @default 1.5
   */
  height?: number
  /**
   * Y position offset (how far below the screen).
   * @default -2
   */
  yOffset?: number
  /**
   * Z position offset.
   * @default 0
   */
  zOffset?: number
  /**
   * Base opacity of the reflection (0-1).
   * @default 0.15
   */
  opacity?: number
  /**
   * How much the reflection fades toward the bottom (0-1).
   * 0 = no fade, 1 = complete fade.
   * @default 0.8
   */
  fadeAmount?: number
  /**
   * Vertical stretch factor (< 1 compresses, > 1 stretches).
   * @default 0.5
   */
  verticalStretch?: number
  /**
   * Whether to add a blur effect to the reflection.
   * @default true
   */
  enableBlur?: boolean
  /**
   * Blur strength (0-1).
   * @default 0.3
   */
  blurStrength?: number
  /**
   * Tint color for the reflection.
   * @default '#00ffff'
   */
  tintColor?: string
  /**
   * Tint intensity (0-1).
   * @default 0.1
   */
  tintIntensity?: number
  /**
   * Enable subtle wave distortion animation.
   * @default false
   */
  enableWave?: boolean
  /**
   * Wave animation speed.
   * @default 1
   */
  waveSpeed?: number
  /**
   * Target FPS for texture updates.
   * @default 30
   */
  targetFps?: number
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = 4
const DEFAULT_HEIGHT = 1.5
const DEFAULT_Y_OFFSET = -2
const DEFAULT_Z_OFFSET = 0
const DEFAULT_OPACITY = 0.15
const DEFAULT_FADE_AMOUNT = 0.8
const DEFAULT_VERTICAL_STRETCH = 0.5
const DEFAULT_BLUR_STRENGTH = 0.3
const DEFAULT_TINT_COLOR = '#00ffff'
const DEFAULT_TINT_INTENSITY = 0.1
const DEFAULT_WAVE_SPEED = 1
const DEFAULT_TARGET_FPS = 30

// ============================================================================
// useReflectionTexture Hook
// ============================================================================

interface UseReflectionTextureOptions {
  sourceCanvas: HTMLCanvasElement | null
  enableBlur: boolean
  blurStrength: number
  targetFps: number
}

function useReflectionTexture({
  sourceCanvas,
  enableBlur,
  blurStrength,
  targetFps,
}: UseReflectionTextureOptions) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastUpdateRef = useRef(0)
  const updateInterval = 1000 / targetFps

  // Initialize offscreen canvas and texture
  useEffect(() => {
    if (!sourceCanvas) {
      textureRef.current = null
      return
    }

    // Create offscreen canvas for processing
    const offscreen = document.createElement('canvas')
    offscreen.width = sourceCanvas.width
    offscreen.height = Math.floor(sourceCanvas.height * 0.5) // Reflection is typically shorter
    offscreenCanvasRef.current = offscreen

    // Create texture from offscreen canvas
    const texture = new THREE.CanvasTexture(offscreen)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.colorSpace = THREE.SRGBColorSpace

    textureRef.current = texture

    return () => {
      texture.dispose()
      textureRef.current = null
      offscreenCanvasRef.current = null
    }
  }, [sourceCanvas])

  // Update texture
  const updateTexture = (time: number) => {
    if (!sourceCanvas || !offscreenCanvasRef.current || !textureRef.current) {
      return
    }

    // Throttle updates
    if (time - lastUpdateRef.current < updateInterval) {
      return
    }
    lastUpdateRef.current = time

    const offscreen = offscreenCanvasRef.current
    const ctx = offscreen.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, offscreen.width, offscreen.height)

    // Save context state
    ctx.save()

    // Flip vertically for reflection
    ctx.translate(0, offscreen.height)
    ctx.scale(1, -1)

    // Draw source canvas (flipped)
    ctx.drawImage(
      sourceCanvas,
      0,
      0,
      sourceCanvas.width,
      sourceCanvas.height,
      0,
      0,
      offscreen.width,
      offscreen.height * 2 // Double height to show bottom portion
    )

    ctx.restore()

    // Apply blur effect if enabled
    if (enableBlur && blurStrength > 0) {
      // Simple blur using multiple passes
      ctx.filter = `blur(${blurStrength * 5}px)`
      ctx.drawImage(offscreen, 0, 0)
      ctx.filter = 'none'
    }

    // Mark texture for update
    textureRef.current.needsUpdate = true
  }

  return {
    texture: textureRef.current,
    updateTexture,
  }
}

// ============================================================================
// Reflection Shader Material
// ============================================================================

const REFLECTION_VERTEX_SHADER = `
  uniform float time;
  uniform bool enableWave;
  uniform float waveSpeed;
  varying vec2 vUv;

  void main() {
    vUv = uv;

    vec3 pos = position;

    // Optional wave distortion
    if (enableWave) {
      float wave = sin(pos.x * 3.0 + time * waveSpeed) * 0.02;
      wave += sin(pos.x * 5.0 - time * waveSpeed * 0.7) * 0.01;
      pos.z += wave * (1.0 - vUv.y); // Stronger at bottom
    }

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const REFLECTION_FRAGMENT_SHADER = `
  uniform sampler2D reflectionMap;
  uniform float opacity;
  uniform float fadeAmount;
  uniform vec3 tintColor;
  uniform float tintIntensity;
  varying vec2 vUv;

  void main() {
    // Sample the reflection texture
    vec4 texColor = texture2D(reflectionMap, vUv);

    // Apply tint
    vec3 color = mix(texColor.rgb, tintColor, tintIntensity);

    // Calculate fade gradient (more transparent toward bottom)
    float fade = 1.0 - (vUv.y * fadeAmount);
    fade = clamp(fade, 0.0, 1.0);

    // Also fade at the edges
    float edgeFadeX = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);

    // Combine opacities
    float finalAlpha = opacity * fade * edgeFadeX * texColor.a;

    gl_FragColor = vec4(color, finalAlpha);
  }
`

// ============================================================================
// Main ScreenReflection Component
// ============================================================================

/**
 * ScreenReflection - Creates a subtle reflection effect below the game screen.
 *
 * This component takes the game canvas and renders a flipped, faded version
 * below the screen to simulate a glossy surface reflection, enhancing the
 * arcade cabinet visual effect.
 *
 * Features:
 * - Vertical flip of source canvas
 * - Gradient fade toward bottom
 * - Optional blur effect
 * - Color tinting
 * - Wave distortion animation
 * - Frame rate throttling
 *
 * @example
 * ```tsx
 * function GameScreen() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *
 *   return (
 *     <Canvas>
 *       <GameScreen3D sourceCanvas={canvasRef.current} />
 *       <ScreenReflection
 *         sourceCanvas={canvasRef.current}
 *         yOffset={-2}
 *         opacity={0.2}
 *         enableWave
 *       />
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function ScreenReflection({
  sourceCanvas,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  yOffset = DEFAULT_Y_OFFSET,
  zOffset = DEFAULT_Z_OFFSET,
  opacity = DEFAULT_OPACITY,
  fadeAmount = DEFAULT_FADE_AMOUNT,
  verticalStretch = DEFAULT_VERTICAL_STRETCH,
  enableBlur = true,
  blurStrength = DEFAULT_BLUR_STRENGTH,
  tintColor = DEFAULT_TINT_COLOR,
  tintIntensity = DEFAULT_TINT_INTENSITY,
  enableWave = false,
  waveSpeed = DEFAULT_WAVE_SPEED,
  targetFps = DEFAULT_TARGET_FPS,
}: ScreenReflectionProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const { texture, updateTexture } = useReflectionTexture({
    sourceCanvas,
    enableBlur,
    blurStrength,
    targetFps,
  })

  // Create uniforms
  const uniforms = useRef({
    reflectionMap: { value: texture },
    opacity: { value: opacity },
    fadeAmount: { value: fadeAmount },
    tintColor: { value: new THREE.Color(tintColor) },
    tintIntensity: { value: tintIntensity },
    time: { value: 0 },
    enableWave: { value: enableWave },
    waveSpeed: { value: waveSpeed },
  })

  // Update uniforms when props change
  useEffect(() => {
    const u = uniforms.current
    u.opacity.value = opacity
    u.fadeAmount.value = fadeAmount
    u.tintColor.value.set(tintColor)
    u.tintIntensity.value = tintIntensity
    u.enableWave.value = enableWave
    u.waveSpeed.value = waveSpeed
  }, [opacity, fadeAmount, tintColor, tintIntensity, enableWave, waveSpeed])

  // Update texture uniform when it changes
  useEffect(() => {
    uniforms.current.reflectionMap.value = texture
  }, [texture])

  // Animation loop
  useFrame((state) => {
    // Update texture
    updateTexture(state.clock.elapsedTime * 1000)

    // Update time uniform for wave animation
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  // Calculate actual height based on stretch
  const actualHeight = height * verticalStretch

  // Don't render if no source canvas
  if (!sourceCanvas) {
    return null
  }

  return (
    <mesh
      position={[0, yOffset - actualHeight / 2, zOffset]}
      rotation={[0, 0, 0]}
    >
      <planeGeometry args={[width, actualHeight, 32, 16]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        side={THREE.DoubleSide}
        uniforms={uniforms.current}
        vertexShader={REFLECTION_VERTEX_SHADER}
        fragmentShader={REFLECTION_FRAGMENT_SHADER}
        blending={THREE.NormalBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================================================
// Simplified Reflection (No Texture, Just Gradient)
// ============================================================================

export interface SimpleReflectionProps {
  width?: number
  height?: number
  yOffset?: number
  zOffset?: number
  color?: string
  opacity?: number
  fadeAmount?: number
}

/**
 * SimpleReflection - A gradient-only reflection without canvas mirroring.
 *
 * Use this for a lightweight reflection effect when you don't need
 * to mirror the actual game content.
 */
export function SimpleReflection({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT * 0.5,
  yOffset = DEFAULT_Y_OFFSET,
  zOffset = DEFAULT_Z_OFFSET,
  color = DEFAULT_TINT_COLOR,
  opacity = DEFAULT_OPACITY * 0.5,
  fadeAmount = DEFAULT_FADE_AMOUNT,
}: SimpleReflectionProps) {
  return (
    <mesh position={[0, yOffset - height / 2, zOffset]}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        transparent
        uniforms={{
          color: { value: new THREE.Color(color) },
          opacity: { value: opacity },
          fadeAmount: { value: fadeAmount },
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
          uniform float fadeAmount;
          varying vec2 vUv;

          void main() {
            // Gradient from top to bottom
            float fade = 1.0 - (vUv.y * fadeAmount);
            fade = clamp(fade, 0.0, 1.0);

            // Edge fade
            float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);

            float finalAlpha = opacity * fade * edgeFade * (1.0 - vUv.y);
            gl_FragColor = vec4(color, finalAlpha);
          }
        `}
        depthWrite={false}
      />
    </mesh>
  )
}

// ============================================================================
// Exports
// ============================================================================

export default ScreenReflection
