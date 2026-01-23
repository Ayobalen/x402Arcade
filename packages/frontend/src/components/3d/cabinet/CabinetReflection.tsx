/**
 * CabinetReflection - Environment reflection mapping for arcade cabinet surfaces
 *
 * Implements environment reflection mapping on cabinet surfaces for realistic
 * shiny/glossy appearance. Supports both static environment maps and dynamic
 * reflections using CubeCamera.
 *
 * @module 3d/cabinet/CabinetReflection
 */

import { useRef, useMemo, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CABINET_COLORS } from './ArcadeCabinetGeometry'

// ============================================================================
// Types
// ============================================================================

export interface CabinetReflectionProps {
  /**
   * Enable dynamic reflections using CubeCamera.
   * More realistic but more expensive.
   * @default false
   */
  enableDynamic?: boolean
  /**
   * Custom static environment map texture.
   * If not provided, a procedural dark arcade environment is generated.
   */
  envMap?: THREE.CubeTexture | THREE.Texture | null
  /**
   * Reflection intensity (0-1).
   * 0 = no reflections, 1 = full reflections.
   * @default 0.3
   */
  intensity?: number
  /**
   * Resolution for CubeCamera render targets.
   * Higher values = sharper reflections but more expensive.
   * @default 128
   */
  resolution?: number
  /**
   * How often to update dynamic reflections (frames).
   * 1 = every frame, 2 = every other frame, etc.
   * @default 3
   */
  updateFrequency?: number
  /**
   * Near clipping plane for CubeCamera.
   * @default 0.1
   */
  near?: number
  /**
   * Far clipping plane for CubeCamera.
   * @default 100
   */
  far?: number
  /**
   * Primary reflection color tint.
   * @default '#8B5CF6' (purple accent)
   */
  primaryColor?: string
  /**
   * Secondary reflection color tint.
   * @default '#00ffff' (cyan)
   */
  secondaryColor?: string
  /**
   * Ambient environment brightness.
   * @default 0.1
   */
  ambientLevel?: number
  /**
   * Enable subtle reflection animation/shimmer.
   * @default false
   */
  animate?: boolean
  /**
   * Animation speed multiplier.
   * @default 1
   */
  animationSpeed?: number
  /**
   * Children to exclude from dynamic reflections.
   * Typically the cabinet itself to avoid self-reflection.
   */
  children?: React.ReactNode
  /**
   * Callback when environment map is ready.
   */
  onReady?: (envMap: THREE.CubeTexture | THREE.Texture) => void
}

export interface CabinetReflectionHandle {
  /** Get the current environment map */
  getEnvMap: () => THREE.CubeTexture | THREE.Texture | null
  /** Force update dynamic reflections */
  forceUpdate: () => void
  /** Set reflection intensity */
  setIntensity: (intensity: number) => void
  /** Get the CubeCamera (if dynamic mode) */
  getCubeCamera: () => THREE.CubeCamera | null
  /** Set primary tint color */
  setPrimaryColor: (color: string) => void
  /** Set secondary tint color */
  setSecondaryColor: (color: string) => void
}

export interface ReflectiveMaterialProps {
  /** Base color of the material */
  color?: string
  /** Roughness (0-1, lower = more reflective) */
  roughness?: number
  /** Metalness (0-1) */
  metalness?: number
  /** Environment map for reflections */
  envMap?: THREE.CubeTexture | THREE.Texture | null
  /** Environment map intensity */
  envMapIntensity?: number
  /** Additional material properties */
  wireframe?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_RESOLUTION = 128
const DEFAULT_INTENSITY = 0.3
const DEFAULT_UPDATE_FREQUENCY = 3
const DEFAULT_NEAR = 0.1
const DEFAULT_FAR = 100
const DEFAULT_AMBIENT_LEVEL = 0.1
const DEFAULT_ANIMATION_SPEED = 1
const DEFAULT_PRIMARY_COLOR = '#8B5CF6' // Purple accent from design system
const DEFAULT_SECONDARY_COLOR = '#00ffff' // Cyan accent

// ============================================================================
// Procedural Environment Map Generator
// ============================================================================

/**
 * Creates a procedural dark arcade environment map
 *
 * Generates a CubeTexture with:
 * - Dark ambient base
 * - Purple and cyan accent lights
 * - Subtle gradients for depth
 */
function createArcadeEnvironmentMap(
  resolution: number,
  primaryColor: string,
  secondaryColor: string,
  ambientLevel: number
): THREE.CubeTexture {
  const size = resolution

  // Create canvas for each cube face
  const createFaceTexture = (
    faceIndex: number,
    primary: THREE.Color,
    secondary: THREE.Color,
    ambient: number
  ): HTMLCanvasElement => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    // Base dark color
    const baseColor = new THREE.Color(CABINET_COLORS.body)
    const r = Math.floor(baseColor.r * 255 * ambient * 2)
    const g = Math.floor(baseColor.g * 255 * ambient * 2)
    const b = Math.floor(baseColor.b * 255 * ambient * 2)
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
    ctx.fillRect(0, 0, size, size)

    // Add gradient based on face direction
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size * 0.8
    )

    // Face-specific light positions
    switch (faceIndex) {
      case 0: // Positive X (right)
      case 1: // Negative X (left)
        // Side lights - secondary color (cyan)
        gradient.addColorStop(0, `rgba(${Math.floor(secondary.r * 255)}, ${Math.floor(secondary.g * 255)}, ${Math.floor(secondary.b * 255)}, ${ambient * 0.3})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        break
      case 2: // Positive Y (top)
        // Top light - bright center
        gradient.addColorStop(0, `rgba(${Math.floor(primary.r * 255)}, ${Math.floor(primary.g * 255)}, ${Math.floor(primary.b * 255)}, ${ambient * 0.5})`)
        gradient.addColorStop(0.5, `rgba(${Math.floor(secondary.r * 255)}, ${Math.floor(secondary.g * 255)}, ${Math.floor(secondary.b * 255)}, ${ambient * 0.2})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        break
      case 3: // Negative Y (bottom)
        // Floor - subtle reflection
        gradient.addColorStop(0, `rgba(${Math.floor(primary.r * 255 * 0.3)}, ${Math.floor(primary.g * 255 * 0.3)}, ${Math.floor(primary.b * 255 * 0.3)}, ${ambient * 0.2})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        break
      case 4: // Positive Z (front)
        // Front - brightest (facing viewer)
        gradient.addColorStop(0, `rgba(${Math.floor(primary.r * 255)}, ${Math.floor(primary.g * 255)}, ${Math.floor(primary.b * 255)}, ${ambient * 0.4})`)
        gradient.addColorStop(0.6, `rgba(${Math.floor(secondary.r * 255)}, ${Math.floor(secondary.g * 255)}, ${Math.floor(secondary.b * 255)}, ${ambient * 0.15})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        break
      case 5: // Negative Z (back)
        // Back - dark
        gradient.addColorStop(0, `rgba(10, 10, 15, ${ambient * 0.1})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        break
    }

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // Add subtle noise for realism
    const imageData = ctx.getImageData(0, 0, size, size)
    const data = imageData.data
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 5
      data[i] = Math.max(0, Math.min(255, data[i] + noise))
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise))
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise))
    }
    ctx.putImageData(imageData, 0, 0)

    return canvas
  }

  // Parse colors
  const primary = new THREE.Color(primaryColor)
  const secondary = new THREE.Color(secondaryColor)

  // Create all 6 faces
  const faces: HTMLCanvasElement[] = []
  for (let i = 0; i < 6; i++) {
    faces.push(createFaceTexture(i, primary, secondary, ambientLevel))
  }

  // Create CubeTexture from canvases
  const cubeTexture = new THREE.CubeTexture(faces)
  cubeTexture.needsUpdate = true

  return cubeTexture
}

// ============================================================================
// Hooks
// ============================================================================

export interface UseReflectiveMaterialOptions {
  color?: string
  roughness?: number
  metalness?: number
  envMapIntensity?: number
}

export interface UseReflectiveMaterialResult {
  /** Material to apply to meshes */
  material: THREE.MeshStandardMaterial
  /** Set the environment map */
  setEnvMap: (envMap: THREE.CubeTexture | THREE.Texture | null) => void
  /** Set reflection intensity */
  setIntensity: (intensity: number) => void
  /** Set roughness */
  setRoughness: (roughness: number) => void
  /** Set metalness */
  setMetalness: (metalness: number) => void
}

/**
 * Hook to create and manage a reflective material
 */
export function useReflectiveMaterial(
  options: UseReflectiveMaterialOptions = {}
): UseReflectiveMaterialResult {
  const {
    color = CABINET_COLORS.body,
    roughness = 0.4,
    metalness = 0.6,
    envMapIntensity = DEFAULT_INTENSITY,
  } = options

  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)

  // Create material
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      envMapIntensity,
    })
    materialRef.current = mat
    return mat
  }, [color, roughness, metalness, envMapIntensity])

  const setEnvMap = useCallback((envMap: THREE.CubeTexture | THREE.Texture | null) => {
    if (materialRef.current) {
      materialRef.current.envMap = envMap
      materialRef.current.needsUpdate = true
    }
  }, [])

  const setIntensity = useCallback((intensity: number) => {
    if (materialRef.current) {
      materialRef.current.envMapIntensity = THREE.MathUtils.clamp(intensity, 0, 1)
    }
  }, [])

  const setRoughness = useCallback((value: number) => {
    if (materialRef.current) {
      materialRef.current.roughness = THREE.MathUtils.clamp(value, 0, 1)
    }
  }, [])

  const setMetalness = useCallback((value: number) => {
    if (materialRef.current) {
      materialRef.current.metalness = THREE.MathUtils.clamp(value, 0, 1)
    }
  }, [])

  return {
    material,
    setEnvMap,
    setIntensity,
    setRoughness,
    setMetalness,
  }
}

export interface UseCabinetReflectionOptions {
  enableDynamic?: boolean
  resolution?: number
  intensity?: number
  primaryColor?: string
  secondaryColor?: string
  ambientLevel?: number
}

export interface UseCabinetReflectionResult {
  /** The environment map to use */
  envMap: THREE.CubeTexture | THREE.Texture | null
  /** Reference to the CubeCamera (if dynamic) */
  cubeCameraRef: React.RefObject<THREE.CubeCamera>
  /** Force update of dynamic reflections */
  forceUpdate: () => void
  /** Set reflection intensity */
  setIntensity: (intensity: number) => void
  /** Update environment map on meshes in scene */
  applyToScene: (scene: THREE.Scene | THREE.Group) => void
  /** Is the environment map ready */
  isReady: boolean
}

/**
 * Hook to manage cabinet reflection environment
 */
export function useCabinetReflection(
  options: UseCabinetReflectionOptions = {}
): UseCabinetReflectionResult {
  const {
    enableDynamic = false,
    resolution = DEFAULT_RESOLUTION,
    intensity = DEFAULT_INTENSITY,
    primaryColor = DEFAULT_PRIMARY_COLOR,
    secondaryColor = DEFAULT_SECONDARY_COLOR,
    ambientLevel = DEFAULT_AMBIENT_LEVEL,
  } = options

  const { gl, scene } = useThree()
  const envMapRef = useRef<THREE.CubeTexture | THREE.Texture | null>(null)
  const cubeCameraRef = useRef<THREE.CubeCamera>(null!)
  const intensityRef = useRef(intensity)
  const frameCountRef = useRef(0)
  const needsUpdateRef = useRef(true)

  // Create static environment map
  useEffect(() => {
    if (!enableDynamic) {
      const envMap = createArcadeEnvironmentMap(
        resolution,
        primaryColor,
        secondaryColor,
        ambientLevel
      )
      envMapRef.current = envMap

      return () => {
        envMap.dispose()
      }
    }
  }, [enableDynamic, resolution, primaryColor, secondaryColor, ambientLevel])

  // Create CubeCamera for dynamic reflections
  useEffect(() => {
    if (enableDynamic) {
      const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter,
      })

      const cubeCamera = new THREE.CubeCamera(DEFAULT_NEAR, DEFAULT_FAR, cubeRenderTarget)
      cubeCameraRef.current = cubeCamera
      envMapRef.current = cubeRenderTarget.texture

      return () => {
        cubeRenderTarget.dispose()
      }
    }
  }, [enableDynamic, resolution])

  const forceUpdate = useCallback(() => {
    needsUpdateRef.current = true
  }, [])

  const setIntensity = useCallback((value: number) => {
    intensityRef.current = THREE.MathUtils.clamp(value, 0, 1)
  }, [])

  const applyToScene = useCallback((target: THREE.Scene | THREE.Group) => {
    if (!envMapRef.current) return

    target.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.envMap = envMapRef.current
        child.material.envMapIntensity = intensityRef.current
        child.material.needsUpdate = true
      }
    })
  }, [])

  // Update dynamic reflections
  useFrame(() => {
    if (enableDynamic && cubeCameraRef.current && needsUpdateRef.current) {
      frameCountRef.current++
      if (frameCountRef.current % DEFAULT_UPDATE_FREQUENCY === 0) {
        cubeCameraRef.current.update(gl, scene)
        needsUpdateRef.current = false
      }
    }
  })

  return {
    envMap: envMapRef.current,
    cubeCameraRef,
    forceUpdate,
    setIntensity,
    applyToScene,
    isReady: envMapRef.current !== null,
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * CabinetReflection - Environment reflection provider for arcade cabinet
 *
 * This component creates and manages environment reflection mapping for
 * realistic shiny/glossy surfaces on the arcade cabinet.
 *
 * Features:
 * - Procedural dark arcade environment map
 * - Purple and cyan accent lights matching design system
 * - Optional dynamic reflections using CubeCamera
 * - Configurable intensity and colors
 * - Performance-optimized update frequency
 *
 * @example
 * ```tsx
 * // Static reflections (recommended for most cases)
 * <CabinetReflection
 *   intensity={0.3}
 *   onReady={(envMap) => {
 *     cabinetMaterial.envMap = envMap;
 *   }}
 * />
 *
 * // Dynamic reflections (for moving scenes)
 * <CabinetReflection
 *   enableDynamic
 *   resolution={256}
 *   updateFrequency={2}
 *   onReady={(envMap) => {
 *     cabinetMaterial.envMap = envMap;
 *   }}
 * >
 *   <CabinetBody />
 * </CabinetReflection>
 * ```
 */
export const CabinetReflection = forwardRef<CabinetReflectionHandle, CabinetReflectionProps>(
  function CabinetReflection(
    {
      enableDynamic = false,
      envMap: providedEnvMap,
      intensity = DEFAULT_INTENSITY,
      resolution = DEFAULT_RESOLUTION,
      updateFrequency = DEFAULT_UPDATE_FREQUENCY,
      near = DEFAULT_NEAR,
      far = DEFAULT_FAR,
      primaryColor = DEFAULT_PRIMARY_COLOR,
      secondaryColor = DEFAULT_SECONDARY_COLOR,
      ambientLevel = DEFAULT_AMBIENT_LEVEL,
      animate = false,
      animationSpeed = DEFAULT_ANIMATION_SPEED,
      children,
      onReady,
    },
    ref
  ) {
    const { gl, scene } = useThree()
    const groupRef = useRef<THREE.Group>(null)
    const envMapRef = useRef<THREE.CubeTexture | THREE.Texture | null>(null)
    const cubeCameraRef = useRef<THREE.CubeCamera | null>(null)
    const renderTargetRef = useRef<THREE.WebGLCubeRenderTarget | null>(null)

    // Refs for dynamic values
    const intensityRef = useRef(intensity)
    const primaryColorRef = useRef(new THREE.Color(primaryColor))
    const secondaryColorRef = useRef(new THREE.Color(secondaryColor))
    const frameCountRef = useRef(0)
    const animationTimeRef = useRef(0)

    // Create environment map
    useEffect(() => {
      if (providedEnvMap) {
        envMapRef.current = providedEnvMap
        onReady?.(providedEnvMap)
        return
      }

      if (enableDynamic) {
        // Create CubeCamera for dynamic reflections
        const renderTarget = new THREE.WebGLCubeRenderTarget(resolution, {
          format: THREE.RGBAFormat,
          generateMipmaps: true,
          minFilter: THREE.LinearMipmapLinearFilter,
        })

        const cubeCamera = new THREE.CubeCamera(near, far, renderTarget)
        cubeCameraRef.current = cubeCamera
        renderTargetRef.current = renderTarget
        envMapRef.current = renderTarget.texture

        // Initial update
        cubeCamera.update(gl, scene)
        onReady?.(renderTarget.texture)

        return () => {
          renderTarget.dispose()
        }
      } else {
        // Create static procedural environment map
        const envMap = createArcadeEnvironmentMap(
          resolution,
          primaryColor,
          secondaryColor,
          ambientLevel
        )
        envMapRef.current = envMap
        onReady?.(envMap)

        return () => {
          envMap.dispose()
        }
      }
    }, [
      providedEnvMap,
      enableDynamic,
      resolution,
      near,
      far,
      primaryColor,
      secondaryColor,
      ambientLevel,
      gl,
      scene,
      onReady,
    ])

    // Update refs when props change
    useEffect(() => {
      intensityRef.current = intensity
    }, [intensity])

    useEffect(() => {
      primaryColorRef.current = new THREE.Color(primaryColor)
      secondaryColorRef.current = new THREE.Color(secondaryColor)
    }, [primaryColor, secondaryColor])

    // Expose imperative handle
    useImperativeHandle(ref, () => ({
      getEnvMap: () => envMapRef.current,
      forceUpdate: () => {
        if (cubeCameraRef.current) {
          cubeCameraRef.current.update(gl, scene)
        }
      },
      setIntensity: (value: number) => {
        intensityRef.current = THREE.MathUtils.clamp(value, 0, 1)
      },
      getCubeCamera: () => cubeCameraRef.current,
      setPrimaryColor: (color: string) => {
        primaryColorRef.current = new THREE.Color(color)
      },
      setSecondaryColor: (color: string) => {
        secondaryColorRef.current = new THREE.Color(color)
      },
    }))

    // Animation and update loop
    useFrame((_state, delta) => {
      // Animation
      if (animate && envMapRef.current instanceof THREE.CubeTexture) {
        animationTimeRef.current += delta * animationSpeed
        // Could update environment map here for animated effects
      }

      // Dynamic reflection updates
      if (enableDynamic && cubeCameraRef.current) {
        frameCountRef.current++
        if (frameCountRef.current % updateFrequency === 0) {
          // Hide the cabinet group temporarily to avoid self-reflection
          if (groupRef.current) {
            groupRef.current.visible = false
          }

          cubeCameraRef.current.update(gl, scene)

          if (groupRef.current) {
            groupRef.current.visible = true
          }
        }
      }
    })

    // Render CubeCamera position marker (for debugging)
    return (
      <group ref={groupRef}>
        {/* CubeCamera position (at origin by default) */}
        {enableDynamic && cubeCameraRef.current && (
          <primitive object={cubeCameraRef.current} />
        )}

        {/* Children that will receive reflections */}
        {children}
      </group>
    )
  }
)

// ============================================================================
// Material Factory Functions
// ============================================================================

/**
 * Create a reflective material for cabinet body surfaces
 */
export function createReflectiveCabinetMaterial(
  envMap: THREE.CubeTexture | THREE.Texture | null,
  options: {
    color?: string
    roughness?: number
    metalness?: number
    envMapIntensity?: number
  } = {}
): THREE.MeshStandardMaterial {
  const {
    color = CABINET_COLORS.body,
    roughness = 0.5,
    metalness = 0.3,
    envMapIntensity = DEFAULT_INTENSITY,
  } = options

  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    envMap,
    envMapIntensity,
  })
}

/**
 * Create a highly reflective material for chrome/metallic accents
 */
export function createChromeMaterial(
  envMap: THREE.CubeTexture | THREE.Texture | null,
  options: {
    color?: string
    envMapIntensity?: number
  } = {}
): THREE.MeshStandardMaterial {
  const {
    color = '#cccccc',
    envMapIntensity = 0.8,
  } = options

  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.1,
    metalness: 0.95,
    envMap,
    envMapIntensity,
  })
}

/**
 * Create a glossy material for control panel and bezel
 */
export function createGlossyMaterial(
  envMap: THREE.CubeTexture | THREE.Texture | null,
  options: {
    color?: string
    envMapIntensity?: number
  } = {}
): THREE.MeshStandardMaterial {
  const {
    color = CABINET_COLORS.bezel,
    envMapIntensity = 0.4,
  } = options

  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.7,
    envMap,
    envMapIntensity,
  })
}

// ============================================================================
// Utility Components
// ============================================================================

export interface ReflectiveMeshProps extends ReflectiveMaterialProps {
  /** Mesh geometry */
  geometry?: THREE.BufferGeometry
  /** Position in 3D space */
  position?: [number, number, number]
  /** Rotation in radians */
  rotation?: [number, number, number]
  /** Scale */
  scale?: number | [number, number, number]
  /** Cast shadows */
  castShadow?: boolean
  /** Receive shadows */
  receiveShadow?: boolean
  /** Mesh name for debugging */
  name?: string
  /** Children (for nested geometry) */
  children?: React.ReactNode
}

/**
 * ReflectiveMesh - A mesh with reflective material applied
 *
 * Convenience component for creating meshes with environment reflections.
 */
export function ReflectiveMesh({
  geometry,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color = CABINET_COLORS.body,
  roughness = 0.5,
  metalness = 0.3,
  envMap,
  envMapIntensity = DEFAULT_INTENSITY,
  wireframe = false,
  castShadow = true,
  receiveShadow = true,
  name,
  children,
}: ReflectiveMeshProps) {
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      envMap,
      envMapIntensity,
      wireframe,
    })
  }, [color, roughness, metalness, envMap, envMapIntensity, wireframe])

  // Update envMap when it changes
  useEffect(() => {
    material.envMap = envMap ?? null
    material.needsUpdate = true
  }, [material, envMap])

  return (
    <mesh
      name={name}
      position={position}
      rotation={rotation}
      scale={scale}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      geometry={geometry}
      material={material}
    >
      {children}
    </mesh>
  )
}

// ============================================================================
// Context for sharing environment map
// ============================================================================

import { createContext, useContext } from 'react'

interface CabinetReflectionContextValue {
  envMap: THREE.CubeTexture | THREE.Texture | null
  intensity: number
  setIntensity: (intensity: number) => void
}

const CabinetReflectionContext = createContext<CabinetReflectionContextValue | null>(null)

/**
 * Provider to share environment map with nested components
 */
export function CabinetReflectionProvider({
  children,
  envMap,
  intensity = DEFAULT_INTENSITY,
}: {
  children: React.ReactNode
  envMap: THREE.CubeTexture | THREE.Texture | null
  intensity?: number
}) {
  const intensityRef = useRef(intensity)

  const value = useMemo<CabinetReflectionContextValue>(() => ({
    envMap,
    intensity: intensityRef.current,
    setIntensity: (value: number) => {
      intensityRef.current = THREE.MathUtils.clamp(value, 0, 1)
    },
  }), [envMap])

  return (
    <CabinetReflectionContext.Provider value={value}>
      {children}
    </CabinetReflectionContext.Provider>
  )
}

/**
 * Hook to access shared environment map
 */
export function useCabinetReflectionContext(): CabinetReflectionContextValue | null {
  return useContext(CabinetReflectionContext)
}

// ============================================================================
// Exports
// ============================================================================

export default CabinetReflection
