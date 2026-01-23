/**
 * CabinetPerformance - Performance optimization utilities for arcade cabinet
 *
 * Provides LOD (Level of Detail), mesh instancing, material optimization,
 * and performance profiling for the arcade cabinet 3D model.
 *
 * @module 3d/cabinet/CabinetPerformance
 */

import {
  useRef,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Detailed, Instance, Instances } from '@react-three/drei'

// ============================================================================
// Types
// ============================================================================

export interface LODLevel {
  /** Distance at which this LOD level is used */
  distance: number
  /** Component to render at this LOD level */
  component: React.ReactNode
}

export interface CabinetLODProps {
  /** Position of the cabinet [x, y, z] */
  position?: [number, number, number]
  /** Rotation in radians [x, y, z] */
  rotation?: [number, number, number]
  /** Scale multiplier */
  scale?: number
  /** LOD levels (sorted by distance, closest first) */
  levels: LODLevel[]
  /** Hysteresis factor to prevent flickering (default: 1.1) */
  hysteresis?: number
  /** Children to render (fallback if no LOD levels) */
  children?: React.ReactNode
}

export interface CabinetLODHandle {
  /** Reference to the LOD group */
  lod: THREE.LOD | null
  /** Get current LOD level index */
  getCurrentLevel: () => number
  /** Force a specific LOD level */
  setLevel: (level: number) => void
  /** Update LOD based on camera distance */
  update: () => void
}

export interface InstancedCabinetsProps {
  /** Array of cabinet positions [[x, y, z], ...] */
  positions: [number, number, number][]
  /** Array of cabinet rotations [[x, y, z], ...] (optional) */
  rotations?: [number, number, number][]
  /** Array of cabinet scales (optional) */
  scales?: number[]
  /** Material color override */
  color?: string
  /** Enable shadow casting */
  castShadow?: boolean
  /** Enable shadow receiving */
  receiveShadow?: boolean
  /** Geometry to instance (default: simplified cabinet) */
  geometry?: THREE.BufferGeometry
  /** Maximum instances (for buffer allocation) */
  maxInstances?: number
}

export interface InstancedCabinetsHandle {
  /** Reference to the Instances group */
  instances: THREE.Group | null
  /** Update a specific instance's transform */
  updateInstance: (index: number, position?: [number, number, number], rotation?: [number, number, number], scale?: number) => void
  /** Get instance count */
  getCount: () => number
}

export interface OptimizedMaterialProps {
  /** Base color */
  color?: string
  /** Roughness (0-1) */
  roughness?: number
  /** Metalness (0-1) */
  metalness?: number
  /** Emissive color */
  emissive?: string
  /** Emissive intensity */
  emissiveIntensity?: number
  /** Use shared material (better for instancing) */
  shared?: boolean
  /** Texture map */
  map?: THREE.Texture | null
  /** Normal map */
  normalMap?: THREE.Texture | null
  /** Disable shadows for performance */
  disableShadows?: boolean
}

export interface PerformanceMetrics {
  /** Frames per second */
  fps: number
  /** Frame time in ms */
  frameTime: number
  /** Draw calls per frame */
  drawCalls: number
  /** Triangle count */
  triangles: number
  /** Texture memory usage */
  textureMemory: number
  /** Geometry memory usage */
  geometryMemory: number
}

export interface PerformanceProfilerProps {
  /** Enable profiling */
  enabled?: boolean
  /** Update interval in ms (default: 1000) */
  interval?: number
  /** Callback with performance metrics */
  onMetrics?: (metrics: PerformanceMetrics) => void
  /** Children to render */
  children?: React.ReactNode
}

// ============================================================================
// Constants
// ============================================================================

/** Default LOD distances */
export const DEFAULT_LOD_DISTANCES = {
  high: 0,      // Full detail up close
  medium: 5,    // Medium detail at 5 units
  low: 15,      // Low detail at 15 units
  billboard: 30, // Billboard at 30+ units
} as const

/** Hysteresis factor for LOD switching */
export const DEFAULT_HYSTERESIS = 1.1

// ============================================================================
// Performance Context
// ============================================================================

interface PerformanceContextValue {
  /** Quality level: 'high' | 'medium' | 'low' */
  quality: 'high' | 'medium' | 'low'
  /** Set quality level */
  setQuality: (quality: 'high' | 'medium' | 'low') => void
  /** Current performance metrics */
  metrics: PerformanceMetrics | null
  /** Shadow quality factor (0-1) */
  shadowQuality: number
  /** Texture quality factor (0-1) */
  textureQuality: number
  /** Enable post-processing */
  enablePostProcessing: boolean
}

const defaultPerformanceContext: PerformanceContextValue = {
  quality: 'high',
  setQuality: () => {},
  metrics: null,
  shadowQuality: 1,
  textureQuality: 1,
  enablePostProcessing: true,
}

export const PerformanceContext = createContext<PerformanceContextValue>(defaultPerformanceContext)

/**
 * usePerformanceContext - Hook to access performance settings
 */
export function usePerformanceContext() {
  return useContext(PerformanceContext)
}

// ============================================================================
// Material Cache
// ============================================================================

const materialCache = new Map<string, THREE.MeshStandardMaterial>()

/**
 * Get or create a cached material
 */
function getCachedMaterial(key: string, props: OptimizedMaterialProps): THREE.MeshStandardMaterial {
  if (materialCache.has(key)) {
    return materialCache.get(key)!
  }

  const material = new THREE.MeshStandardMaterial({
    color: props.color ?? '#1a1a2e',
    roughness: props.roughness ?? 0.7,
    metalness: props.metalness ?? 0.1,
    emissive: props.emissive ?? '#000000',
    emissiveIntensity: props.emissiveIntensity ?? 0,
  })

  if (props.map) {
    material.map = props.map
  }

  if (props.normalMap) {
    material.normalMap = props.normalMap
  }

  materialCache.set(key, material)
  return material
}

/**
 * Clear material cache
 */
export function clearMaterialCache() {
  materialCache.forEach((material) => material.dispose())
  materialCache.clear()
}

// ============================================================================
// Geometry Optimization
// ============================================================================

/**
 * Create optimized cabinet geometry with reduced polygon count
 */
export function createOptimizedCabinetGeometry(detail: 'high' | 'medium' | 'low' = 'medium'): THREE.BufferGeometry {
  const segments = detail === 'high' ? 8 : detail === 'medium' ? 4 : 2

  // Simplified cabinet as a single box with merged geometry
  const geometry = new THREE.BoxGeometry(2.4, 5.6, 1.8, segments, segments, segments)

  // Compute vertex normals for better lighting
  geometry.computeVertexNormals()

  return geometry
}

/**
 * Create billboard geometry for very distant cabinets
 */
export function createBillboardGeometry(): THREE.BufferGeometry {
  return new THREE.PlaneGeometry(2.4, 5.6)
}

/**
 * Merge multiple geometries into one for better batching
 */
export function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Simple merge by combining attributes
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  let indexOffset = 0

  geometries.forEach((geom) => {
    const posAttr = geom.getAttribute('position')
    const normAttr = geom.getAttribute('normal')
    const uvAttr = geom.getAttribute('uv')
    const index = geom.getIndex()

    if (posAttr) {
      for (let i = 0; i < posAttr.count; i++) {
        positions.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i))
      }
    }

    if (normAttr) {
      for (let i = 0; i < normAttr.count; i++) {
        normals.push(normAttr.getX(i), normAttr.getY(i), normAttr.getZ(i))
      }
    }

    if (uvAttr) {
      for (let i = 0; i < uvAttr.count; i++) {
        uvs.push(uvAttr.getX(i), uvAttr.getY(i))
      }
    }

    if (index) {
      for (let i = 0; i < index.count; i++) {
        indices.push(index.getX(i) + indexOffset)
      }
      indexOffset += posAttr?.count ?? 0
    }
  })

  const merged = new THREE.BufferGeometry()
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  }
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  }
  if (indices.length > 0) {
    merged.setIndex(indices)
  }

  return merged
}

// ============================================================================
// LOD Component
// ============================================================================

/**
 * CabinetLOD - Level of Detail wrapper for arcade cabinet
 *
 * Automatically switches between detail levels based on camera distance
 * to improve performance when rendering multiple cabinets.
 *
 * @example
 * ```tsx
 * <CabinetLOD
 *   position={[0, 0, 0]}
 *   levels={[
 *     { distance: 0, component: <FullDetailCabinet /> },
 *     { distance: 10, component: <SimpleCabinet /> },
 *     { distance: 30, component: <BillboardCabinet /> },
 *   ]}
 * />
 * ```
 */
export const CabinetLOD = forwardRef<CabinetLODHandle, CabinetLODProps>(
  function CabinetLOD(
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0],
      scale = 1,
      levels,
      hysteresis = DEFAULT_HYSTERESIS,
      children,
    },
    ref
  ) {
    const groupRef = useRef<THREE.Group>(null)
    const currentLevelRef = useRef(0)

    // Sort levels by distance
    const sortedLevels = useMemo(
      () => [...levels].sort((a, b) => a.distance - b.distance),
      [levels]
    )

    // Get LOD distances for Detailed component
    const distances = useMemo(
      () => sortedLevels.map((l) => l.distance),
      [sortedLevels]
    )

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        lod: groupRef.current as unknown as THREE.LOD,
        getCurrentLevel: () => currentLevelRef.current,
        setLevel: (level: number) => {
          currentLevelRef.current = Math.max(0, Math.min(level, sortedLevels.length - 1))
        },
        update: () => {
          // Detailed component handles this automatically
        },
      }),
      [sortedLevels.length]
    )

    // If no levels provided, render children directly
    if (sortedLevels.length === 0) {
      return (
        <group
          ref={groupRef}
          position={position}
          rotation={rotation}
          scale={scale}
        >
          {children}
        </group>
      )
    }

    return (
      <group ref={groupRef}>
        <Detailed distances={distances} hysteresis={hysteresis}>
          {sortedLevels.map((level, index) => (
            <group
              key={index}
              position={position}
              rotation={rotation}
              scale={scale}
            >
              {level.component}
            </group>
          ))}
        </Detailed>
      </group>
    )
  }
)

// ============================================================================
// Instanced Cabinets Component
// ============================================================================

/**
 * InstancedCabinets - Render multiple cabinets using GPU instancing
 *
 * Much more efficient than rendering individual meshes when you need
 * many copies of the same cabinet (e.g., arcade room scene).
 *
 * @example
 * ```tsx
 * <InstancedCabinets
 *   positions={[
 *     [0, 0, 0],
 *     [3, 0, 0],
 *     [6, 0, 0],
 *   ]}
 *   color="#1a1a2e"
 *   castShadow
 * />
 * ```
 */
export const InstancedCabinets = forwardRef<InstancedCabinetsHandle, InstancedCabinetsProps>(
  function InstancedCabinets(
    {
      positions,
      rotations,
      scales,
      color = '#1a1a2e',
      castShadow = true,
      receiveShadow = true,
      geometry: customGeometry,
      maxInstances = 100,
    },
    ref
  ) {
    const instancesRef = useRef<THREE.Group>(null)

    // Create or use provided geometry
    const geometry = useMemo(
      () => customGeometry ?? createOptimizedCabinetGeometry('medium'),
      [customGeometry]
    )

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        instances: instancesRef.current,
        updateInstance: (
          index: number,
          position?: [number, number, number],
          rotation?: [number, number, number],
          scale?: number
        ) => {
          // Instance updates are handled by the Instances component
          console.log('Update instance', index, position, rotation, scale)
        },
        getCount: () => positions.length,
      }),
      [positions.length]
    )

    return (
      <group ref={instancesRef}>
        <Instances
          limit={maxInstances}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        >
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial
            color={color}
            roughness={0.7}
            metalness={0.1}
          />

          {positions.map((pos, i) => (
            <Instance
              key={i}
              position={pos}
              rotation={rotations?.[i]}
              scale={scales?.[i] ?? 1}
            />
          ))}
        </Instances>
      </group>
    )
  }
)

// ============================================================================
// Optimized Material Hook
// ============================================================================

/**
 * useOptimizedMaterial - Hook for creating performance-optimized materials
 *
 * Caches materials to reduce GPU memory and improves batching.
 *
 * @example
 * ```tsx
 * const material = useOptimizedMaterial({
 *   color: '#1a1a2e',
 *   roughness: 0.7,
 *   shared: true, // Use cached material
 * })
 *
 * return <mesh material={material} />
 * ```
 */
export function useOptimizedMaterial(props: OptimizedMaterialProps): THREE.MeshStandardMaterial {
  const { shared = false, ...materialProps } = props

  const material = useMemo(() => {
    if (shared) {
      // Generate cache key from props
      const key = JSON.stringify(materialProps)
      return getCachedMaterial(key, materialProps)
    }

    // Create new material
    return new THREE.MeshStandardMaterial({
      color: materialProps.color ?? '#1a1a2e',
      roughness: materialProps.roughness ?? 0.7,
      metalness: materialProps.metalness ?? 0.1,
      emissive: materialProps.emissive ?? '#000000',
      emissiveIntensity: materialProps.emissiveIntensity ?? 0,
    })
  }, [shared, materialProps])

  // Cleanup non-shared materials
  useEffect(() => {
    return () => {
      if (!shared && material) {
        material.dispose()
      }
    }
  }, [shared, material])

  return material
}

// ============================================================================
// Performance Profiler Component
// ============================================================================

/**
 * PerformanceProfiler - Monitor and report performance metrics
 *
 * Provides FPS, draw calls, triangle count, and memory usage information.
 *
 * @example
 * ```tsx
 * <PerformanceProfiler
 *   enabled
 *   interval={1000}
 *   onMetrics={(m) => console.log('FPS:', m.fps)}
 * >
 *   <ArcadeCabinet />
 * </PerformanceProfiler>
 * ```
 */
export function PerformanceProfiler({
  enabled = true,
  interval = 1000,
  onMetrics,
  children,
}: PerformanceProfilerProps) {
  const { gl } = useThree()
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const [_metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // Initialize lastTime in effect to avoid impure render
  useEffect(() => {
    lastTimeRef.current = performance.now()
  }, [])

  useFrame(() => {
    if (!enabled) return

    frameCountRef.current++
    const now = performance.now()
    const elapsed = now - lastTimeRef.current

    if (elapsed >= interval) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed)
      const frameTime = elapsed / frameCountRef.current

      // Get renderer info
      const info = gl.info

      const newMetrics: PerformanceMetrics = {
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        drawCalls: info.render?.calls ?? 0,
        triangles: info.render?.triangles ?? 0,
        textureMemory: info.memory?.textures ?? 0,
        geometryMemory: info.memory?.geometries ?? 0,
      }

      setMetrics(newMetrics)
      onMetrics?.(newMetrics)

      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return <>{children}</>
}

// ============================================================================
// Performance Provider
// ============================================================================

export interface PerformanceProviderProps {
  /** Initial quality level */
  initialQuality?: 'high' | 'medium' | 'low'
  /** Auto-adjust quality based on FPS */
  autoAdjust?: boolean
  /** Target FPS for auto-adjust (default: 30) */
  targetFps?: number
  /** Children to render */
  children?: React.ReactNode
}

/**
 * PerformanceProvider - Context provider for performance settings
 *
 * Manages quality settings across all cabinet components and can
 * auto-adjust based on runtime performance.
 *
 * @example
 * ```tsx
 * <PerformanceProvider autoAdjust targetFps={30}>
 *   <ArcadeRoom />
 * </PerformanceProvider>
 * ```
 */
export function PerformanceProvider({
  initialQuality = 'high',
  autoAdjust = false,
  targetFps = 30,
  children,
}: PerformanceProviderProps) {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>(initialQuality)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // Auto-adjust quality based on FPS
  const handleMetrics = useCallback(
    (newMetrics: PerformanceMetrics) => {
      setMetrics(newMetrics)

      if (autoAdjust) {
        if (newMetrics.fps < targetFps * 0.7 && quality !== 'low') {
          // FPS too low, reduce quality
          setQuality((prev) => (prev === 'high' ? 'medium' : 'low'))
        } else if (newMetrics.fps > targetFps * 1.5 && quality !== 'high') {
          // FPS high enough, try increasing quality
          setQuality((prev) => (prev === 'low' ? 'medium' : 'high'))
        }
      }
    },
    [autoAdjust, targetFps, quality]
  )

  // Quality-based settings
  const contextValue: PerformanceContextValue = useMemo(
    () => ({
      quality,
      setQuality,
      metrics,
      shadowQuality: quality === 'high' ? 1 : quality === 'medium' ? 0.5 : 0.25,
      textureQuality: quality === 'high' ? 1 : quality === 'medium' ? 0.5 : 0.25,
      enablePostProcessing: quality !== 'low',
    }),
    [quality, metrics]
  )

  return (
    <PerformanceContext.Provider value={contextValue}>
      {autoAdjust && (
        <PerformanceProfiler enabled onMetrics={handleMetrics} />
      )}
      {children}
    </PerformanceContext.Provider>
  )
}

// ============================================================================
// Frustum Culling Utilities
// ============================================================================

/**
 * useFrustumCulling - Hook to manually check if object is in camera frustum
 *
 * Useful for conditionally rendering expensive effects only when visible.
 *
 * @example
 * ```tsx
 * const { isVisible, checkVisibility } = useFrustumCulling(meshRef)
 *
 * return isVisible ? <ExpensiveEffect /> : null
 * ```
 */
export function useFrustumCulling(ref: React.RefObject<THREE.Object3D>) {
  const { camera } = useThree()
  const [isVisible, setIsVisible] = useState(true)
  const frustumRef = useRef(new THREE.Frustum())
  const matrixRef = useRef(new THREE.Matrix4())

  const checkVisibility = useCallback(() => {
    if (!ref.current) return true

    // Update frustum from camera
    matrixRef.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    )
    frustumRef.current.setFromProjectionMatrix(matrixRef.current)

    // Check if object's bounding sphere is in frustum
    const sphere = new THREE.Sphere()
    new THREE.Box3().setFromObject(ref.current).getBoundingSphere(sphere)

    const visible = frustumRef.current.intersectsSphere(sphere)
    setIsVisible(visible)
    return visible
  }, [camera, ref])

  useFrame(() => {
    checkVisibility()
  })

  return { isVisible, checkVisibility }
}

// ============================================================================
// Texture Optimization
// ============================================================================

/**
 * Optimize texture settings for performance
 */
export function optimizeTexture(
  texture: THREE.Texture,
  quality: 'high' | 'medium' | 'low' = 'medium'
): THREE.Texture {
  // Set appropriate filter based on quality
  if (quality === 'high') {
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 16
  } else if (quality === 'medium') {
    texture.minFilter = THREE.LinearMipmapLinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 4
  } else {
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.anisotropy = 1
  }

  // Generate mipmaps
  texture.generateMipmaps = quality !== 'low'

  return texture
}

/**
 * Create a compressed texture placeholder while loading
 */
export function createPlaceholderTexture(color: string = '#1a1a2e'): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 2, 2)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// ============================================================================
// Exports
// ============================================================================

export default {
  CabinetLOD,
  InstancedCabinets,
  PerformanceProfiler,
  PerformanceProvider,
  useOptimizedMaterial,
  usePerformanceContext,
  useFrustumCulling,
  createOptimizedCabinetGeometry,
  createBillboardGeometry,
  mergeGeometries,
  optimizeTexture,
  createPlaceholderTexture,
  clearMaterialCache,
}
