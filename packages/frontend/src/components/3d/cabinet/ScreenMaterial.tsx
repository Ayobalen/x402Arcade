/**
 * ScreenMaterial - Emissive screen material for arcade cabinet display
 *
 * Creates a shader-based material that displays game content with:
 * - Emissive glow for realistic lit screen effect
 * - CRT scanline simulation
 * - Color tint adjustment
 * - Aspect ratio handling
 * - Support for canvas, video, or texture input
 *
 * @module 3d/cabinet/ScreenMaterial
 */

import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CABINET_SCREEN } from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface ScreenMaterialProps {
  /**
   * Source canvas element to display on screen.
   * Takes priority over videoElement and texture.
   */
  sourceCanvas?: HTMLCanvasElement | null
  /**
   * Source video element to display on screen.
   * Takes priority over texture if no canvas is provided.
   */
  videoElement?: HTMLVideoElement | null
  /**
   * Three.js texture to display on screen.
   * Used if no canvas or video is provided.
   */
  texture?: THREE.Texture | null
  /**
   * Width of the screen mesh in world units.
   * @default CABINET_SCREEN.screenWidth
   */
  width?: number
  /**
   * Height of the screen mesh in world units.
   * @default CABINET_SCREEN.screenHeight
   */
  height?: number
  /**
   * Position of the screen in 3D space.
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Rotation of the screen in radians.
   * @default [0, 0, 0]
   */
  rotation?: [number, number, number]
  /**
   * Emissive intensity for the screen glow effect (0-2).
   * Higher values create a brighter, more lit appearance.
   * @default 1.0
   */
  emissiveIntensity?: number
  /**
   * Color tint to apply to the screen content.
   * Can be a hex string or THREE.Color.
   * @default '#ffffff' (no tint)
   */
  colorTint?: string | THREE.Color
  /**
   * Tint blend amount (0-1).
   * 0 = no tint, 1 = full tint.
   * @default 0
   */
  tintAmount?: number
  /**
   * Enable CRT scanline effect.
   * @default true
   */
  enableScanlines?: boolean
  /**
   * Scanline intensity (0-1).
   * @default 0.15
   */
  scanlineIntensity?: number
  /**
   * Number of scanlines per unit height.
   * Higher values = more dense scanlines.
   * @default 200
   */
  scanlineCount?: number
  /**
   * Enable subtle scanline animation/flicker.
   * @default false
   */
  animateScanlines?: boolean
  /**
   * Brightness adjustment (0-2).
   * @default 1.0
   */
  brightness?: number
  /**
   * Contrast adjustment (0-2).
   * @default 1.0
   */
  contrast?: number
  /**
   * Enable aspect ratio correction.
   * Ensures content fills screen without distortion.
   * @default true
   */
  maintainAspectRatio?: boolean
  /**
   * Source aspect ratio (width/height).
   * Used for aspect ratio correction.
   * @default 4/3
   */
  sourceAspectRatio?: number
  /**
   * Target frames per second for texture updates.
   * @default 60
   */
  targetFps?: number
  /**
   * Enable debug visualization.
   * @default false
   */
  debug?: boolean
  /**
   * Callback when texture is updated.
   */
  onTextureUpdate?: () => void
}

export interface ScreenMaterialHandle {
  /** Get the underlying material */
  getMaterial: () => THREE.ShaderMaterial | null
  /** Set emissive intensity dynamically */
  setEmissiveIntensity: (intensity: number) => void
  /** Set color tint dynamically */
  setColorTint: (color: string | THREE.Color, amount: number) => void
  /** Set scanline intensity dynamically */
  setScanlineIntensity: (intensity: number) => void
  /** Set brightness dynamically */
  setBrightness: (brightness: number) => void
  /** Set contrast dynamically */
  setContrast: (contrast: number) => void
  /** Force texture update */
  forceUpdate: () => void
  /** Get the mesh reference */
  getMesh: () => THREE.Mesh | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = CABINET_SCREEN.screenWidth
const DEFAULT_HEIGHT = CABINET_SCREEN.screenHeight
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0]
const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0]
const DEFAULT_EMISSIVE_INTENSITY = 1.0
const DEFAULT_SCANLINE_INTENSITY = 0.15
const DEFAULT_SCANLINE_COUNT = 200
const DEFAULT_BRIGHTNESS = 1.0
const DEFAULT_CONTRAST = 1.0
const DEFAULT_SOURCE_ASPECT_RATIO = 4 / 3
const DEFAULT_TARGET_FPS = 60

// Color presets for screen tints
export const SCREEN_TINT_PRESETS = {
  none: { color: '#ffffff', amount: 0 },
  warmRetro: { color: '#ffeecc', amount: 0.1 },
  coolBlue: { color: '#ccddff', amount: 0.1 },
  greenPhosphor: { color: '#00ff88', amount: 0.15 },
  amberMonochrome: { color: '#ffaa00', amount: 0.2 },
  arcadePurple: { color: '#8B5CF6', amount: 0.05 },
  damaged: { color: '#ff8866', amount: 0.1 },
} as const

export type ScreenTintPreset = keyof typeof SCREEN_TINT_PRESETS

// ============================================================================
// Shaders
// ============================================================================

const SCREEN_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SCREEN_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float time;

  // Screen properties
  uniform float emissiveIntensity;
  uniform vec3 colorTint;
  uniform float tintAmount;
  uniform float brightness;
  uniform float contrast;

  // Scanline properties
  uniform bool enableScanlines;
  uniform float scanlineIntensity;
  uniform float scanlineCount;
  uniform bool animateScanlines;

  // Aspect ratio
  uniform bool maintainAspectRatio;
  uniform float sourceAspectRatio;
  uniform float screenAspectRatio;

  varying vec2 vUv;

  // Apply aspect ratio correction
  vec2 aspectCorrectUV(vec2 uv) {
    if (!maintainAspectRatio) return uv;

    vec2 correctedUV = uv;
    float aspectDiff = screenAspectRatio / sourceAspectRatio;

    if (aspectDiff > 1.0) {
      // Screen is wider than source - letterbox (black bars on sides)
      float newWidth = 1.0 / aspectDiff;
      float offset = (1.0 - newWidth) * 0.5;
      correctedUV.x = (uv.x - offset) / newWidth;
    } else if (aspectDiff < 1.0) {
      // Screen is taller than source - pillarbox (black bars on top/bottom)
      float newHeight = aspectDiff;
      float offset = (1.0 - newHeight) * 0.5;
      correctedUV.y = (uv.y - offset) / newHeight;
    }

    return correctedUV;
  }

  // Apply scanline effect
  float scanlines(vec2 uv, float time) {
    if (!enableScanlines) return 1.0;

    float scanline = sin(uv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
    scanline = pow(scanline, 1.5);

    // Optional animation
    float animation = 1.0;
    if (animateScanlines) {
      animation = 0.97 + sin(time * 8.0) * 0.03;
    }

    return 1.0 - (scanlineIntensity * (1.0 - scanline)) * animation;
  }

  // Apply brightness and contrast
  vec3 adjustBrightnessContrast(vec3 color) {
    // Apply brightness
    color *= brightness;

    // Apply contrast
    color = (color - 0.5) * contrast + 0.5;

    return clamp(color, 0.0, 1.0);
  }

  void main() {
    vec2 uv = aspectCorrectUV(vUv);

    // Check if UV is out of bounds after aspect correction
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    // Sample the texture
    vec4 texColor = texture2D(tDiffuse, uv);
    vec3 color = texColor.rgb;

    // Apply brightness and contrast
    color = adjustBrightnessContrast(color);

    // Apply color tint
    color = mix(color, color * colorTint, tintAmount);

    // Apply scanlines
    color *= scanlines(vUv, time);

    // Apply emissive intensity (makes the screen appear to glow)
    color *= emissiveIntensity;

    gl_FragColor = vec4(color, 1.0);
  }
`

// ============================================================================
// Texture Hooks
// ============================================================================

interface UseScreenTextureOptions {
  sourceCanvas?: HTMLCanvasElement | null
  videoElement?: HTMLVideoElement | null
  texture?: THREE.Texture | null
  targetFps: number
  onUpdate?: () => void
}

interface UseScreenTextureResult {
  texture: THREE.Texture | null
  updateTexture: (time: number) => void
  isReady: boolean
}

/**
 * Hook to manage screen texture from various sources
 */
function useScreenTexture({
  sourceCanvas,
  videoElement,
  texture: providedTexture,
  targetFps,
  onUpdate,
}: UseScreenTextureOptions): UseScreenTextureResult {
  const textureRef = useRef<THREE.Texture | null>(null)
  const lastUpdateRef = useRef(0)
  const updateInterval = 1000 / targetFps

  // Create texture from canvas
  useEffect(() => {
    if (sourceCanvas) {
      const canvasTexture = new THREE.CanvasTexture(sourceCanvas)
      canvasTexture.minFilter = THREE.LinearFilter
      canvasTexture.magFilter = THREE.LinearFilter
      canvasTexture.generateMipmaps = false
      canvasTexture.colorSpace = THREE.SRGBColorSpace
      textureRef.current = canvasTexture

      return () => {
        canvasTexture.dispose()
        textureRef.current = null
      }
    }
  }, [sourceCanvas])

  // Create texture from video
  useEffect(() => {
    if (!sourceCanvas && videoElement) {
      const videoTexture = new THREE.VideoTexture(videoElement)
      videoTexture.minFilter = THREE.LinearFilter
      videoTexture.magFilter = THREE.LinearFilter
      videoTexture.generateMipmaps = false
      videoTexture.colorSpace = THREE.SRGBColorSpace
      textureRef.current = videoTexture

      return () => {
        videoTexture.dispose()
        textureRef.current = null
      }
    }
  }, [sourceCanvas, videoElement])

  // Use provided texture
  useEffect(() => {
    if (!sourceCanvas && !videoElement && providedTexture) {
      textureRef.current = providedTexture
    }
  }, [sourceCanvas, videoElement, providedTexture])

  const updateTexture = (time: number) => {
    if (!textureRef.current) return

    // Throttle updates based on target FPS
    if (time - lastUpdateRef.current < updateInterval) return
    lastUpdateRef.current = time

    // Mark texture as needing update (for canvas textures)
    if (textureRef.current instanceof THREE.CanvasTexture) {
      textureRef.current.needsUpdate = true
    }

    onUpdate?.()
  }

  return {
    texture: textureRef.current,
    updateTexture,
    isReady: textureRef.current !== null,
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ScreenMaterial - Emissive screen material for arcade cabinet display
 *
 * Creates a realistic lit screen effect with:
 * - Emissive glow that makes the screen appear self-illuminated
 * - Optional CRT scanlines for retro aesthetic
 * - Color tint adjustment for various effects
 * - Aspect ratio handling
 *
 * Supports canvas, video, or texture input for maximum flexibility.
 *
 * @example
 * ```tsx
 * // With a game canvas
 * <ScreenMaterial
 *   ref={screenRef}
 *   sourceCanvas={gameCanvas}
 *   emissiveIntensity={1.2}
 *   enableScanlines
 *   scanlineIntensity={0.1}
 * />
 *
 * // With a video element
 * <ScreenMaterial
 *   videoElement={videoRef.current}
 *   colorTint="#00ff88"
 *   tintAmount={0.1}
 * />
 *
 * // Using a preset
 * <ScreenMaterial
 *   texture={myTexture}
 *   {...SCREEN_TINT_PRESETS.greenPhosphor}
 * />
 * ```
 */
export const ScreenMaterial = forwardRef<ScreenMaterialHandle, ScreenMaterialProps>(
  function ScreenMaterial(
    {
      sourceCanvas,
      videoElement,
      texture: providedTexture,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      position = DEFAULT_POSITION,
      rotation = DEFAULT_ROTATION,
      emissiveIntensity = DEFAULT_EMISSIVE_INTENSITY,
      colorTint = '#ffffff',
      tintAmount = 0,
      enableScanlines = true,
      scanlineIntensity = DEFAULT_SCANLINE_INTENSITY,
      scanlineCount = DEFAULT_SCANLINE_COUNT,
      animateScanlines = false,
      brightness = DEFAULT_BRIGHTNESS,
      contrast = DEFAULT_CONTRAST,
      maintainAspectRatio = true,
      sourceAspectRatio = DEFAULT_SOURCE_ASPECT_RATIO,
      targetFps = DEFAULT_TARGET_FPS,
      debug = false,
      onTextureUpdate,
    },
    ref
  ) {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    // Refs for dynamic values
    const emissiveRef = useRef(emissiveIntensity)
    const brightnessRef = useRef(brightness)
    const contrastRef = useRef(contrast)
    const scanlineRef = useRef(scanlineIntensity)
    const tintColorRef = useRef(new THREE.Color(colorTint))
    const tintAmountRef = useRef(tintAmount)

    // Manage texture
    const { texture, updateTexture, isReady } = useScreenTexture({
      sourceCanvas,
      videoElement,
      texture: providedTexture,
      targetFps,
      onUpdate: onTextureUpdate,
    })

    // Calculate screen aspect ratio
    const screenAspectRatio = width / height

    // Create uniforms
    const uniforms = useMemo(
      () => ({
        tDiffuse: { value: texture },
        time: { value: 0 },
        emissiveIntensity: { value: emissiveIntensity },
        colorTint: { value: new THREE.Color(colorTint) },
        tintAmount: { value: tintAmount },
        brightness: { value: brightness },
        contrast: { value: contrast },
        enableScanlines: { value: enableScanlines },
        scanlineIntensity: { value: scanlineIntensity },
        scanlineCount: { value: scanlineCount },
        animateScanlines: { value: animateScanlines },
        maintainAspectRatio: { value: maintainAspectRatio },
        sourceAspectRatio: { value: sourceAspectRatio },
        screenAspectRatio: { value: screenAspectRatio },
      }),
      // Dependencies intentionally minimal - we update uniforms in useFrame
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    )

    // Update uniforms when props change
    useEffect(() => {
      const u = uniforms
      u.enableScanlines.value = enableScanlines
      u.scanlineCount.value = scanlineCount
      u.animateScanlines.value = animateScanlines
      u.maintainAspectRatio.value = maintainAspectRatio
      u.sourceAspectRatio.value = sourceAspectRatio
      u.screenAspectRatio.value = screenAspectRatio
    }, [
      uniforms,
      enableScanlines,
      scanlineCount,
      animateScanlines,
      maintainAspectRatio,
      sourceAspectRatio,
      screenAspectRatio,
    ])

    // Update refs when props change
    useEffect(() => {
      emissiveRef.current = emissiveIntensity
      brightnessRef.current = brightness
      contrastRef.current = contrast
      scanlineRef.current = scanlineIntensity
      tintColorRef.current = new THREE.Color(colorTint)
      tintAmountRef.current = tintAmount
    }, [emissiveIntensity, brightness, contrast, scanlineIntensity, colorTint, tintAmount])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getMaterial: () => materialRef.current,
      setEmissiveIntensity: (intensity: number) => {
        emissiveRef.current = THREE.MathUtils.clamp(intensity, 0, 2)
      },
      setColorTint: (color: string | THREE.Color, amount: number) => {
        tintColorRef.current = new THREE.Color(color)
        tintAmountRef.current = THREE.MathUtils.clamp(amount, 0, 1)
      },
      setScanlineIntensity: (intensity: number) => {
        scanlineRef.current = THREE.MathUtils.clamp(intensity, 0, 1)
      },
      setBrightness: (value: number) => {
        brightnessRef.current = THREE.MathUtils.clamp(value, 0, 2)
      },
      setContrast: (value: number) => {
        contrastRef.current = THREE.MathUtils.clamp(value, 0, 2)
      },
      forceUpdate: () => {
        if (texture instanceof THREE.CanvasTexture) {
          texture.needsUpdate = true
        }
      },
      getMesh: () => meshRef.current,
    }))

    // Animation loop - update texture and uniforms
    useFrame((state) => {
      // Update texture
      updateTexture(state.clock.elapsedTime * 1000)

      // Update material uniforms
      if (materialRef.current) {
        const u = materialRef.current.uniforms
        u.time.value = state.clock.elapsedTime
        u.tDiffuse.value = texture
        u.emissiveIntensity.value = emissiveRef.current
        u.brightness.value = brightnessRef.current
        u.contrast.value = contrastRef.current
        u.scanlineIntensity.value = scanlineRef.current
        u.colorTint.value.copy(tintColorRef.current)
        u.tintAmount.value = tintAmountRef.current
      }
    })

    // Render placeholder when no texture
    if (!isReady && !debug) {
      return (
        <mesh ref={meshRef} position={position} rotation={rotation}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
      )
    }

    return (
      <mesh ref={meshRef} position={position} rotation={rotation}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={SCREEN_VERTEX_SHADER}
          fragmentShader={SCREEN_FRAGMENT_SHADER}
          toneMapped={false}
        />
      </mesh>
    )
  }
)

// ============================================================================
// Simplified Version
// ============================================================================

export interface SimpleScreenMaterialProps {
  /**
   * Source canvas to display.
   */
  sourceCanvas?: HTMLCanvasElement | null
  /**
   * Texture to display.
   */
  texture?: THREE.Texture | null
  /**
   * Screen width.
   * @default CABINET_SCREEN.screenWidth
   */
  width?: number
  /**
   * Screen height.
   * @default CABINET_SCREEN.screenHeight
   */
  height?: number
  /**
   * Position in 3D space.
   */
  position?: [number, number, number]
  /**
   * Rotation in radians.
   */
  rotation?: [number, number, number]
  /**
   * Emissive color for glow effect.
   * @default '#ffffff'
   */
  emissiveColor?: string
  /**
   * Emissive intensity.
   * @default 0.8
   */
  emissiveIntensity?: number
}

/**
 * SimpleScreenMaterial - Basic emissive screen without shader effects
 *
 * Uses MeshBasicMaterial with emissive properties for simpler rendering.
 * Good for performance-critical scenarios or when CRT effects aren't needed.
 */
export function SimpleScreenMaterial({
  sourceCanvas,
  texture: providedTexture,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  position = DEFAULT_POSITION,
  rotation = DEFAULT_ROTATION,
  emissiveColor = '#ffffff',
  emissiveIntensity = 0.8,
}: SimpleScreenMaterialProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial>(null)
  const textureRef = useRef<THREE.Texture | null>(null)

  // Create texture from canvas
  useEffect(() => {
    if (sourceCanvas) {
      const canvasTexture = new THREE.CanvasTexture(sourceCanvas)
      canvasTexture.minFilter = THREE.LinearFilter
      canvasTexture.magFilter = THREE.LinearFilter
      canvasTexture.generateMipmaps = false
      textureRef.current = canvasTexture

      return () => {
        canvasTexture.dispose()
      }
    } else if (providedTexture) {
      textureRef.current = providedTexture
    }
  }, [sourceCanvas, providedTexture])

  // Update texture each frame
  useFrame(() => {
    if (textureRef.current instanceof THREE.CanvasTexture) {
      textureRef.current.needsUpdate = true
    }
    if (materialRef.current && textureRef.current) {
      materialRef.current.map = textureRef.current
      materialRef.current.needsUpdate = true
    }
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        ref={materialRef}
        map={textureRef.current}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        emissiveMap={textureRef.current}
        toneMapped={false}
      />
    </mesh>
  )
}

// ============================================================================
// Utility Hook
// ============================================================================

export interface UseScreenMaterialOptions {
  initialEmissive?: number
  initialBrightness?: number
  initialContrast?: number
  initialScanlineIntensity?: number
}

export interface UseScreenMaterialResult {
  /** Ref to attach to ScreenMaterial */
  ref: React.RefObject<ScreenMaterialHandle>
  /** Set emissive intensity */
  setEmissive: (intensity: number) => void
  /** Set brightness */
  setBrightness: (brightness: number) => void
  /** Set contrast */
  setContrast: (contrast: number) => void
  /** Set scanline intensity */
  setScanlines: (intensity: number) => void
  /** Apply a tint preset */
  applyTintPreset: (preset: ScreenTintPreset) => void
  /** Clear tint */
  clearTint: () => void
  /** Pulse emissive (flash effect) */
  pulseEmissive: (targetIntensity?: number, duration?: number) => void
}

/**
 * useScreenMaterial - Hook for controlling ScreenMaterial
 *
 * Provides convenient methods for dynamic screen adjustments.
 *
 * @example
 * ```tsx
 * function ArcadeScreen({ canvas }) {
 *   const screen = useScreenMaterial();
 *
 *   const handleDamage = () => {
 *     screen.applyTintPreset('damaged');
 *     screen.pulseEmissive(2, 0.3);
 *   };
 *
 *   return <ScreenMaterial ref={screen.ref} sourceCanvas={canvas} />;
 * }
 * ```
 */
export function useScreenMaterial(
  options: UseScreenMaterialOptions = {}
): UseScreenMaterialResult {
  const {
    initialEmissive = DEFAULT_EMISSIVE_INTENSITY,
    initialBrightness = DEFAULT_BRIGHTNESS,
    initialContrast = DEFAULT_CONTRAST,
    initialScanlineIntensity = DEFAULT_SCANLINE_INTENSITY,
  } = options

  const ref = useRef<ScreenMaterialHandle>(null)
  const animationRef = useRef<number | null>(null)

  const setEmissive = (intensity: number) => {
    ref.current?.setEmissiveIntensity(intensity)
  }

  const setBrightness = (brightness: number) => {
    ref.current?.setBrightness(brightness)
  }

  const setContrast = (contrast: number) => {
    ref.current?.setContrast(contrast)
  }

  const setScanlines = (intensity: number) => {
    ref.current?.setScanlineIntensity(intensity)
  }

  const applyTintPreset = (preset: ScreenTintPreset) => {
    const presetData = SCREEN_TINT_PRESETS[preset]
    ref.current?.setColorTint(presetData.color, presetData.amount)
  }

  const clearTint = () => {
    ref.current?.setColorTint('#ffffff', 0)
  }

  const pulseEmissive = (targetIntensity = 2, duration = 0.3) => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
    }

    const startTime = performance.now()
    const startIntensity = initialEmissive

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)

      // Ease out - start fast, end slow
      const easeOut = 1 - Math.pow(1 - progress, 3)

      // Go up to target, then back down
      let intensity: number
      if (progress < 0.5) {
        intensity = startIntensity + (targetIntensity - startIntensity) * (progress * 2)
      } else {
        intensity = targetIntensity + (startIntensity - targetIntensity) * ((progress - 0.5) * 2)
      }

      ref.current?.setEmissiveIntensity(intensity * (1 - easeOut * 0.3))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        ref.current?.setEmissiveIntensity(startIntensity)
        animationRef.current = null
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Set initial values
  useEffect(() => {
    ref.current?.setEmissiveIntensity(initialEmissive)
    ref.current?.setBrightness(initialBrightness)
    ref.current?.setContrast(initialContrast)
    ref.current?.setScanlineIntensity(initialScanlineIntensity)
  }, [initialEmissive, initialBrightness, initialContrast, initialScanlineIntensity])

  return {
    ref,
    setEmissive,
    setBrightness,
    setContrast,
    setScanlines,
    applyTintPreset,
    clearTint,
    pulseEmissive,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default ScreenMaterial
