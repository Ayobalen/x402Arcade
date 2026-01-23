import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface CRTEffectProps {
  /**
   * Reference to the source canvas element containing the game graphics.
   */
  sourceCanvas: HTMLCanvasElement | null
  /**
   * Width of the display plane.
   * @default 4
   */
  width?: number
  /**
   * Height of the display plane.
   * @default 3
   */
  height?: number
  /**
   * Position of the display in 3D space.
   * @default [0, 0, 0]
   */
  position?: [number, number, number]
  /**
   * Enable the CRT effect (false = no distortion).
   * @default true
   */
  enabled?: boolean
  /**
   * Barrel distortion strength (0-1).
   * Higher values = more pronounced curve.
   * @default 0.1
   */
  distortionStrength?: number
  /**
   * Enable scanline effect.
   * @default true
   */
  enableScanlines?: boolean
  /**
   * Scanline intensity (0-1).
   * @default 0.2
   */
  scanlineIntensity?: number
  /**
   * Scanline count (lines per unit height).
   * @default 200
   */
  scanlineCount?: number
  /**
   * Enable chromatic aberration (RGB split at edges).
   * @default true
   */
  enableChromaticAberration?: boolean
  /**
   * Chromatic aberration strength (0-1).
   * @default 0.003
   */
  chromaticStrength?: number
  /**
   * Enable vignette (darkened edges).
   * @default true
   */
  enableVignette?: boolean
  /**
   * Vignette intensity (0-1).
   * @default 0.3
   */
  vignetteIntensity?: number
  /**
   * Enable flicker effect.
   * @default false
   */
  enableFlicker?: boolean
  /**
   * Flicker intensity (0-1).
   * @default 0.03
   */
  flickerIntensity?: number
  /**
   * Enable static noise.
   * @default false
   */
  enableNoise?: boolean
  /**
   * Noise intensity (0-1).
   * @default 0.05
   */
  noiseIntensity?: number
  /**
   * Target FPS for texture updates.
   * @default 60
   */
  targetFps?: number
  /**
   * Callback when effect is toggled.
   */
  onToggle?: (enabled: boolean) => void
}

export interface CRTEffectHandle {
  /** Toggle the CRT effect on/off */
  toggle: () => void
  /** Set enabled state directly */
  setEnabled: (enabled: boolean) => void
  /** Get current enabled state */
  isEnabled: () => boolean
  /** Update distortion strength */
  setDistortion: (strength: number) => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = 4
const DEFAULT_HEIGHT = 3
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0]
const DEFAULT_DISTORTION_STRENGTH = 0.1
const DEFAULT_SCANLINE_INTENSITY = 0.2
const DEFAULT_SCANLINE_COUNT = 200
const DEFAULT_CHROMATIC_STRENGTH = 0.003
const DEFAULT_VIGNETTE_INTENSITY = 0.3
const DEFAULT_FLICKER_INTENSITY = 0.03
const DEFAULT_NOISE_INTENSITY = 0.05
const DEFAULT_TARGET_FPS = 60

// ============================================================================
// CRT Shader
// ============================================================================

const CRT_VERTEX_SHADER = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const CRT_FRAGMENT_SHADER = `
  uniform sampler2D tDiffuse;
  uniform float time;
  uniform bool enabled;

  // Distortion
  uniform float distortionStrength;

  // Scanlines
  uniform bool enableScanlines;
  uniform float scanlineIntensity;
  uniform float scanlineCount;

  // Chromatic aberration
  uniform bool enableChromaticAberration;
  uniform float chromaticStrength;

  // Vignette
  uniform bool enableVignette;
  uniform float vignetteIntensity;

  // Flicker
  uniform bool enableFlicker;
  uniform float flickerIntensity;

  // Noise
  uniform bool enableNoise;
  uniform float noiseIntensity;

  varying vec2 vUv;

  // Random noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  // Barrel distortion function
  vec2 barrelDistort(vec2 uv, float strength) {
    vec2 centered = uv - 0.5;
    float dist = dot(centered, centered);
    float distortion = 1.0 + dist * strength;
    return centered * distortion + 0.5;
  }

  void main() {
    vec2 uv = vUv;

    // If disabled, just output the texture directly
    if (!enabled) {
      gl_FragColor = texture2D(tDiffuse, uv);
      return;
    }

    // Apply barrel distortion
    uv = barrelDistort(uv, distortionStrength);

    // Check if UV is out of bounds after distortion
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }

    vec4 color;

    // Chromatic aberration
    if (enableChromaticAberration) {
      vec2 offset = (uv - 0.5) * chromaticStrength;
      float r = texture2D(tDiffuse, uv - offset).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv + offset).b;
      color = vec4(r, g, b, 1.0);
    } else {
      color = texture2D(tDiffuse, uv);
    }

    // Scanlines
    if (enableScanlines) {
      float scanline = sin(uv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
      scanline = pow(scanline, 1.5);
      color.rgb *= 1.0 - (scanlineIntensity * (1.0 - scanline));
    }

    // Vignette
    if (enableVignette) {
      vec2 vignetteUv = uv * (1.0 - uv.yx);
      float vignette = vignetteUv.x * vignetteUv.y * 15.0;
      vignette = pow(vignette, vignetteIntensity);
      color.rgb *= vignette;
    }

    // Flicker
    if (enableFlicker) {
      float flicker = 1.0 - flickerIntensity * random(vec2(time * 0.1, 0.0));
      color.rgb *= flicker;
    }

    // Noise
    if (enableNoise) {
      float noise = random(uv * time) * noiseIntensity;
      color.rgb += noise - noiseIntensity * 0.5;
    }

    // Ensure alpha is 1
    color.a = 1.0;

    gl_FragColor = color;
  }
`

// ============================================================================
// Texture Hook
// ============================================================================

function useCRTTexture(
  sourceCanvas: HTMLCanvasElement | null,
  targetFps: number
) {
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const lastUpdateRef = useRef(0)
  const updateInterval = 1000 / targetFps

  useEffect(() => {
    if (!sourceCanvas) {
      textureRef.current = null
      return
    }

    const texture = new THREE.CanvasTexture(sourceCanvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.colorSpace = THREE.SRGBColorSpace

    textureRef.current = texture

    return () => {
      texture.dispose()
      textureRef.current = null
    }
  }, [sourceCanvas])

  const updateTexture = (time: number) => {
    if (!textureRef.current) return

    // Throttle updates
    if (time - lastUpdateRef.current < updateInterval) return
    lastUpdateRef.current = time

    textureRef.current.needsUpdate = true
  }

  return {
    texture: textureRef.current,
    updateTexture,
  }
}

// ============================================================================
// Main CRTEffect Component
// ============================================================================

/**
 * CRTEffect - CRT-style screen curvature and distortion effect.
 *
 * Applies authentic retro CRT monitor effects to the game display:
 * - Barrel distortion (curved screen)
 * - Scanlines
 * - Chromatic aberration (RGB split)
 * - Vignette (darkened edges)
 * - Flicker and noise (optional)
 *
 * All effects can be toggled and adjusted individually.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const crtRef = useRef<CRTEffectHandle>(null);
 *
 *   return (
 *     <Canvas>
 *       <CRTEffect
 *         ref={crtRef}
 *         sourceCanvas={gameCanvas}
 *         distortionStrength={0.1}
 *         enableScanlines
 *       />
 *       <button onClick={() => crtRef.current?.toggle()}>
 *         Toggle CRT
 *       </button>
 *     </Canvas>
 *   );
 * }
 * ```
 */
export const CRTEffect = forwardRef<CRTEffectHandle, CRTEffectProps>(
  function CRTEffect(
    {
      sourceCanvas,
      width = DEFAULT_WIDTH,
      height = DEFAULT_HEIGHT,
      position = DEFAULT_POSITION,
      enabled = true,
      distortionStrength = DEFAULT_DISTORTION_STRENGTH,
      enableScanlines = true,
      scanlineIntensity = DEFAULT_SCANLINE_INTENSITY,
      scanlineCount = DEFAULT_SCANLINE_COUNT,
      enableChromaticAberration = true,
      chromaticStrength = DEFAULT_CHROMATIC_STRENGTH,
      enableVignette = true,
      vignetteIntensity = DEFAULT_VIGNETTE_INTENSITY,
      enableFlicker = false,
      flickerIntensity = DEFAULT_FLICKER_INTENSITY,
      enableNoise = false,
      noiseIntensity = DEFAULT_NOISE_INTENSITY,
      targetFps = DEFAULT_TARGET_FPS,
      onToggle,
    },
    ref
  ) {
    const materialRef = useRef<THREE.ShaderMaterial>(null)
    const enabledRef = useRef(enabled)
    const distortionRef = useRef(distortionStrength)

    const { texture, updateTexture } = useCRTTexture(sourceCanvas, targetFps)

    // Create uniforms
    const uniforms = useRef({
      tDiffuse: { value: texture },
      time: { value: 0 },
      enabled: { value: enabled },
      distortionStrength: { value: distortionStrength },
      enableScanlines: { value: enableScanlines },
      scanlineIntensity: { value: scanlineIntensity },
      scanlineCount: { value: scanlineCount },
      enableChromaticAberration: { value: enableChromaticAberration },
      chromaticStrength: { value: chromaticStrength },
      enableVignette: { value: enableVignette },
      vignetteIntensity: { value: vignetteIntensity },
      enableFlicker: { value: enableFlicker },
      flickerIntensity: { value: flickerIntensity },
      enableNoise: { value: enableNoise },
      noiseIntensity: { value: noiseIntensity },
    })

    // Update uniforms when props change
    useEffect(() => {
      const u = uniforms.current
      enabledRef.current = enabled
      u.enabled.value = enabled
      u.distortionStrength.value = distortionStrength
      distortionRef.current = distortionStrength
      u.enableScanlines.value = enableScanlines
      u.scanlineIntensity.value = scanlineIntensity
      u.scanlineCount.value = scanlineCount
      u.enableChromaticAberration.value = enableChromaticAberration
      u.chromaticStrength.value = chromaticStrength
      u.enableVignette.value = enableVignette
      u.vignetteIntensity.value = vignetteIntensity
      u.enableFlicker.value = enableFlicker
      u.flickerIntensity.value = flickerIntensity
      u.enableNoise.value = enableNoise
      u.noiseIntensity.value = noiseIntensity
    }, [
      enabled,
      distortionStrength,
      enableScanlines,
      scanlineIntensity,
      scanlineCount,
      enableChromaticAberration,
      chromaticStrength,
      enableVignette,
      vignetteIntensity,
      enableFlicker,
      flickerIntensity,
      enableNoise,
      noiseIntensity,
    ])

    // Update texture uniform when it changes
    useEffect(() => {
      uniforms.current.tDiffuse.value = texture
    }, [texture])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      toggle: () => {
        enabledRef.current = !enabledRef.current
        uniforms.current.enabled.value = enabledRef.current
        onToggle?.(enabledRef.current)
      },
      setEnabled: (value: boolean) => {
        enabledRef.current = value
        uniforms.current.enabled.value = value
        onToggle?.(value)
      },
      isEnabled: () => enabledRef.current,
      setDistortion: (strength: number) => {
        distortionRef.current = THREE.MathUtils.clamp(strength, 0, 1)
        uniforms.current.distortionStrength.value = distortionRef.current
      },
    }))

    // Animation loop
    useFrame((state) => {
      // Update texture
      updateTexture(state.clock.elapsedTime * 1000)

      // Update time uniform
      if (materialRef.current) {
        materialRef.current.uniforms.time.value = state.clock.elapsedTime
      }
    })

    if (!sourceCanvas) {
      // Placeholder when no canvas
      return (
        <mesh position={position}>
          <planeGeometry args={[width, height]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      )
    }

    return (
      <mesh position={position}>
        <planeGeometry args={[width, height]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms.current}
          vertexShader={CRT_VERTEX_SHADER}
          fragmentShader={CRT_FRAGMENT_SHADER}
        />
      </mesh>
    )
  }
)

// ============================================================================
// CRT Settings Preset
// ============================================================================

export interface CRTPreset {
  distortionStrength: number
  enableScanlines: boolean
  scanlineIntensity: number
  enableChromaticAberration: boolean
  chromaticStrength: number
  enableVignette: boolean
  vignetteIntensity: number
  enableFlicker: boolean
  flickerIntensity: number
  enableNoise: boolean
  noiseIntensity: number
}

/**
 * Predefined CRT effect presets.
 */
export const CRT_PRESETS: Record<string, CRTPreset> = {
  /** No effect, clean display */
  none: {
    distortionStrength: 0,
    enableScanlines: false,
    scanlineIntensity: 0,
    enableChromaticAberration: false,
    chromaticStrength: 0,
    enableVignette: false,
    vignetteIntensity: 0,
    enableFlicker: false,
    flickerIntensity: 0,
    enableNoise: false,
    noiseIntensity: 0,
  },
  /** Subtle CRT look */
  subtle: {
    distortionStrength: 0.05,
    enableScanlines: true,
    scanlineIntensity: 0.1,
    enableChromaticAberration: false,
    chromaticStrength: 0,
    enableVignette: true,
    vignetteIntensity: 0.2,
    enableFlicker: false,
    flickerIntensity: 0,
    enableNoise: false,
    noiseIntensity: 0,
  },
  /** Classic CRT monitor look */
  classic: {
    distortionStrength: 0.1,
    enableScanlines: true,
    scanlineIntensity: 0.2,
    enableChromaticAberration: true,
    chromaticStrength: 0.003,
    enableVignette: true,
    vignetteIntensity: 0.3,
    enableFlicker: false,
    flickerIntensity: 0,
    enableNoise: false,
    noiseIntensity: 0,
  },
  /** Heavy retro effect */
  retro: {
    distortionStrength: 0.15,
    enableScanlines: true,
    scanlineIntensity: 0.3,
    enableChromaticAberration: true,
    chromaticStrength: 0.005,
    enableVignette: true,
    vignetteIntensity: 0.4,
    enableFlicker: true,
    flickerIntensity: 0.02,
    enableNoise: true,
    noiseIntensity: 0.03,
  },
  /** Worn, old monitor effect */
  damaged: {
    distortionStrength: 0.2,
    enableScanlines: true,
    scanlineIntensity: 0.35,
    enableChromaticAberration: true,
    chromaticStrength: 0.008,
    enableVignette: true,
    vignetteIntensity: 0.5,
    enableFlicker: true,
    flickerIntensity: 0.05,
    enableNoise: true,
    noiseIntensity: 0.08,
  },
}

/**
 * Get CRT preset props by name.
 */
export function getCRTPreset(preset: keyof typeof CRT_PRESETS): CRTPreset {
  return CRT_PRESETS[preset] || CRT_PRESETS.classic
}

// ============================================================================
// Exports
// ============================================================================

export default CRTEffect
