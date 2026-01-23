import { useRef, useEffect, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ============================================================================
// Types
// ============================================================================

export interface GameScreen3DProps {
  /**
   * Reference to the source canvas element containing the game graphics.
   * This canvas will be rendered as a texture on the 3D plane.
   */
  sourceCanvas: HTMLCanvasElement | null
  /**
   * Width of the 3D screen plane in world units.
   * @default 4
   */
  width?: number
  /**
   * Height of the 3D screen plane in world units.
   * @default 3
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
   * Whether to enable CRT-style scanline effect.
   * @default false
   */
  enableScanlines?: boolean
  /**
   * Intensity of the CRT glow effect (0-1).
   * @default 0.1
   */
  glowIntensity?: number
  /**
   * Whether to add screen curvature for CRT effect.
   * @default false
   */
  enableCurvature?: boolean
  /**
   * Target frames per second for texture updates.
   * Higher values are smoother but more demanding.
   * @default 60
   */
  targetFps?: number
  /**
   * Resolution multiplier for the texture.
   * 1 = native canvas size, 2 = 2x resolution, etc.
   * @default 1
   */
  resolutionScale?: number
  /**
   * Callback fired when texture is updated.
   */
  onTextureUpdate?: () => void
}

export interface UseCanvasTextureOptions {
  sourceCanvas: HTMLCanvasElement | null
  targetFps?: number
  resolutionScale?: number
  onUpdate?: () => void
}

export interface UseCanvasTextureResult {
  texture: THREE.CanvasTexture | null
  isReady: boolean
  updateTexture: () => void
  dispose: () => void
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_WIDTH = 4
const DEFAULT_HEIGHT = 3
const DEFAULT_POSITION: [number, number, number] = [0, 0, 0]
const DEFAULT_ROTATION: [number, number, number] = [0, 0, 0]
const DEFAULT_TARGET_FPS = 60
const DEFAULT_RESOLUTION_SCALE = 1
const DEFAULT_GLOW_INTENSITY = 0.1

// Minimum time between texture updates (in ms)
const MIN_UPDATE_INTERVAL = 1000 / 120 // Cap at 120fps

// ============================================================================
// useCanvasTexture Hook
// ============================================================================

/**
 * Custom hook to create and manage a Three.js CanvasTexture from a source canvas.
 * Handles automatic updates, frame throttling, and cleanup.
 */
export function useCanvasTexture({
  sourceCanvas,
  targetFps = DEFAULT_TARGET_FPS,
  resolutionScale = DEFAULT_RESOLUTION_SCALE,
  onUpdate,
}: UseCanvasTextureOptions): UseCanvasTextureResult {
  const textureRef = useRef<THREE.CanvasTexture | null>(null)
  const lastUpdateTimeRef = useRef(0)
  const [isReady, setIsReady] = useState(false)

  // Calculate minimum interval between updates
  const updateInterval = Math.max(1000 / targetFps, MIN_UPDATE_INTERVAL)

  // Initialize texture when source canvas is available
  useEffect(() => {
    if (!sourceCanvas) {
      textureRef.current = null
      setIsReady(false)
      return
    }

    // Create offscreen canvas for resolution scaling if needed
    let textureCanvas: HTMLCanvasElement = sourceCanvas

    if (resolutionScale !== 1) {
      const offscreen = document.createElement('canvas')
      offscreen.width = sourceCanvas.width * resolutionScale
      offscreen.height = sourceCanvas.height * resolutionScale
      textureCanvas = offscreen
    }

    // Create the texture
    const texture = new THREE.CanvasTexture(textureCanvas)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.generateMipmaps = false
    texture.colorSpace = THREE.SRGBColorSpace

    // Mark texture as needing update
    texture.needsUpdate = true

    textureRef.current = texture
    setIsReady(true)

    // Cleanup on unmount or canvas change
    return () => {
      texture.dispose()
      textureRef.current = null
      setIsReady(false)
    }
  }, [sourceCanvas, resolutionScale])

  // Manual update function
  const updateTexture = useCallback(() => {
    const texture = textureRef.current
    if (!texture || !sourceCanvas) return

    const now = performance.now()
    if (now - lastUpdateTimeRef.current < updateInterval) {
      return // Throttle updates
    }

    // Handle resolution scaling
    if (resolutionScale !== 1) {
      const offscreenCanvas = texture.image as HTMLCanvasElement
      const ctx = offscreenCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          sourceCanvas,
          0,
          0,
          offscreenCanvas.width,
          offscreenCanvas.height
        )
      }
    }

    texture.needsUpdate = true
    lastUpdateTimeRef.current = now
    onUpdate?.()
  }, [sourceCanvas, resolutionScale, updateInterval, onUpdate])

  // Dispose function for manual cleanup
  const dispose = useCallback(() => {
    if (textureRef.current) {
      textureRef.current.dispose()
      textureRef.current = null
      setIsReady(false)
    }
  }, [])

  return {
    texture: textureRef.current,
    isReady,
    updateTexture,
    dispose,
  }
}

// ============================================================================
// ScreenMesh Component
// ============================================================================

interface ScreenMeshProps {
  texture: THREE.CanvasTexture | null
  width: number
  height: number
  position: [number, number, number]
  rotation: [number, number, number]
  enableScanlines: boolean
  glowIntensity: number
  enableCurvature: boolean
}

function ScreenMesh({
  texture,
  width,
  height,
  position,
  rotation,
  enableScanlines,
  glowIntensity,
  enableCurvature,
}: ScreenMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  // Create plane geometry (optionally curved)
  const geometry = enableCurvature
    ? createCurvedPlaneGeometry(width, height, 32, 24, 0.1)
    : new THREE.PlaneGeometry(width, height)

  // Update material when texture changes
  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.map = texture
      materialRef.current.needsUpdate = true
    }
  }, [texture])

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          ref={materialRef}
          map={texture}
          toneMapped={false}
        />
      </mesh>

      {/* Scanline overlay */}
      {enableScanlines && (
        <ScanlineOverlay width={width} height={height} />
      )}

      {/* Screen glow effect */}
      {glowIntensity > 0 && (
        <ScreenGlow width={width} height={height} intensity={glowIntensity} />
      )}
    </group>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

/**
 * Creates a curved plane geometry for CRT screen effect.
 */
function createCurvedPlaneGeometry(
  width: number,
  height: number,
  widthSegments: number,
  heightSegments: number,
  curvature: number
): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(
    width,
    height,
    widthSegments,
    heightSegments
  )

  const positionAttribute = geometry.getAttribute('position')
  const positions = positionAttribute.array as Float32Array

  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positions[i * 3]
    const y = positions[i * 3 + 1]

    // Calculate normalized position
    const nx = (x / width) * 2
    const ny = (y / height) * 2

    // Apply spherical curvature
    const distance = Math.sqrt(nx * nx + ny * ny)
    const z = curvature * (1 - distance * distance)

    positions[i * 3 + 2] = z
  }

  positionAttribute.needsUpdate = true
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Scanline overlay for CRT effect.
 */
function ScanlineOverlay({ width, height }: { width: number; height: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh position={[0, 0, 0.001]}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        uniforms={{
          time: { value: 0 },
          scanlineIntensity: { value: 0.15 },
          scanlineCount: { value: height * 50 }, // ~50 scanlines per unit height
        }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform float scanlineIntensity;
          uniform float scanlineCount;
          varying vec2 vUv;

          void main() {
            float scanline = sin(vUv.y * scanlineCount * 3.14159) * 0.5 + 0.5;
            float alpha = scanlineIntensity * (1.0 - scanline);

            // Add slight flicker
            alpha *= 0.9 + sin(time * 10.0) * 0.1;

            gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
          }
        `}
      />
    </mesh>
  )
}

/**
 * Screen glow effect.
 */
function ScreenGlow({
  width,
  height,
  intensity,
}: {
  width: number
  height: number
  intensity: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      // Subtle pulse effect
      const pulse = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.2
      material.opacity = intensity * pulse * 0.3
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -0.01]}>
      <planeGeometry args={[width * 1.1, height * 1.1]} />
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={intensity * 0.3}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ============================================================================
// Main GameScreen3D Component
// ============================================================================

/**
 * GameScreen3D - Renders a 2D game canvas as a texture on a 3D plane.
 *
 * This component takes a source HTML canvas element (containing game graphics)
 * and displays it as a texture on a 3D plane within the Three.js scene.
 *
 * Features:
 * - Automatic texture updates synced to animation frame
 * - Frame rate throttling for performance optimization
 * - Optional CRT effects (scanlines, curvature, glow)
 * - Resolution scaling support
 *
 * @example
 * ```tsx
 * function GameWithScreen() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *
 *   return (
 *     <Canvas>
 *       <GameScreen3D
 *         sourceCanvas={canvasRef.current}
 *         width={4}
 *         height={3}
 *         enableScanlines
 *       />
 *     </Canvas>
 *   );
 * }
 * ```
 */
export function GameScreen3D({
  sourceCanvas,
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  position = DEFAULT_POSITION,
  rotation = DEFAULT_ROTATION,
  enableScanlines = false,
  glowIntensity = DEFAULT_GLOW_INTENSITY,
  enableCurvature = false,
  targetFps = DEFAULT_TARGET_FPS,
  resolutionScale = DEFAULT_RESOLUTION_SCALE,
  onTextureUpdate,
}: GameScreen3DProps) {
  const { texture, isReady, updateTexture } = useCanvasTexture({
    sourceCanvas,
    targetFps,
    resolutionScale,
    onUpdate: onTextureUpdate,
  })

  // Update texture on each frame
  useFrame(() => {
    if (isReady) {
      updateTexture()
    }
  })

  if (!isReady || !texture) {
    // Render placeholder while waiting for canvas
    return (
      <mesh position={position} rotation={rotation}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
    )
  }

  return (
    <ScreenMesh
      texture={texture}
      width={width}
      height={height}
      position={position}
      rotation={rotation}
      enableScanlines={enableScanlines}
      glowIntensity={glowIntensity}
      enableCurvature={enableCurvature}
    />
  )
}

// ============================================================================
// Utility Hook for External Canvas Management
// ============================================================================

export interface UseGameScreenOptions {
  width?: number
  height?: number
  backgroundColor?: string
}

/**
 * Hook to create and manage a game canvas for use with GameScreen3D.
 * Returns a canvas element and context ready for game rendering.
 */
export function useGameCanvas({
  width = 800,
  height = 600,
  backgroundColor = '#000000',
}: UseGameScreenOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Create offscreen canvas for game rendering
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('Failed to get 2D context for game canvas')
      return
    }

    // Initialize with background color
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    canvasRef.current = canvas
    contextRef.current = ctx
    setIsReady(true)

    return () => {
      canvasRef.current = null
      contextRef.current = null
      setIsReady(false)
    }
  }, [width, height, backgroundColor])

  const clear = useCallback(() => {
    const ctx = contextRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [backgroundColor])

  return {
    canvas: canvasRef.current,
    context: contextRef.current,
    isReady,
    clear,
    width,
    height,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default GameScreen3D
