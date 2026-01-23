/**
 * Scene - Base 3D scene component using React Three Fiber
 *
 * This component provides the foundational Canvas setup that other 3D
 * components build upon. Includes error boundary, Suspense for loading,
 * and integration with the graceful degradation system.
 *
 * @module 3d/Scene
 */

import {
  Suspense,
  Component,
  type ReactNode,
  type ErrorInfo,
  type ComponentType,
} from 'react'
import { Canvas, type CanvasProps } from '@react-three/fiber'
import { CanvasFallback } from './CanvasFallback'
import { useGracefulDegradation, type QualityTier } from '../../hooks'
import { backgrounds, primary } from '../../styles/tokens/colors'

// ============================================================================
// Types
// ============================================================================

export interface SceneProps {
  /** Children to render inside the 3D scene */
  children: ReactNode
  /** Initial quality tier (auto-detected if not provided) */
  quality?: QualityTier
  /** Camera position [x, y, z] */
  cameraPosition?: [number, number, number]
  /** Camera field of view in degrees */
  cameraFov?: number
  /** Near clipping plane */
  cameraNear?: number
  /** Far clipping plane */
  cameraFar?: number
  /** Enable shadows */
  shadows?: boolean
  /** Background color (default: transparent) */
  backgroundColor?: string
  /** Enable flat shading for retro look */
  flat?: boolean
  /** Enable linear color space */
  linear?: boolean
  /** Additional CSS class for container */
  className?: string
  /** Container width */
  width?: string | number
  /** Container height */
  height?: string | number
  /** Loading fallback component */
  loadingFallback?: ReactNode
  /** Error fallback component or render function */
  errorFallback?: ReactNode | ComponentType<{ error: Error; reset: () => void }>
  /** Callback when scene is ready */
  onReady?: () => void
  /** Callback when an error occurs */
  onError?: (error: Error) => void
  /** Canvas props to pass through */
  canvasProps?: Partial<CanvasProps>
}

interface SceneErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CAMERA_POSITION: [number, number, number] = [0, 0, 5]
const DEFAULT_CAMERA_FOV = 50
const DEFAULT_CAMERA_NEAR = 0.1
const DEFAULT_CAMERA_FAR = 1000

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ComponentType<{ error: Error; reset: () => void }>
  onError?: (error: Error) => void
}

/**
 * Error boundary for catching WebGL and rendering errors
 */
class SceneErrorBoundary extends Component<
  ErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SceneErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Scene error:', error, errorInfo)
    this.props.onError?.(error)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback } = this.props
      const error = this.state.error

      // Custom fallback component
      if (typeof fallback === 'function') {
        const FallbackComponent = fallback as ComponentType<{
          error: Error
          reset: () => void
        }>
        return <FallbackComponent error={error} reset={this.reset} />
      }

      // Custom fallback element
      if (fallback) {
        return <>{fallback}</>
      }

      // Default fallback
      return (
        <CanvasFallback
          title="Scene Error"
          message={`An error occurred while rendering the 3D scene: ${error.message}`}
          onRetry={this.reset}
          showBrowserSuggestion={false}
        />
      )
    }

    return this.props.children
  }
}

// ============================================================================
// Loading Fallback
// ============================================================================

interface LoadingFallbackProps {
  width?: string | number
  height?: string | number
}

/**
 * Default loading state shown while 3D assets load
 */
function DefaultLoadingFallback({ width, height }: LoadingFallbackProps) {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width || '100%',
        height: typeof height === 'number' ? `${height}px` : height || '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: backgrounds.tertiary,
        borderRadius: '16px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      data-testid="scene-loading"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Animated loading spinner */}
        <div
          style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${backgrounds.secondary}`,
            borderTop: `3px solid ${primary.DEFAULT}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <span
          style={{
            color: primary.DEFAULT,
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '0.1em',
          }}
        >
          LOADING...
        </span>
      </div>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

// ============================================================================
// Scene Ready Callback Component
// ============================================================================

interface SceneReadyProps {
  onReady?: () => void
}

/**
 * Component that fires the onReady callback when mounted inside Canvas
 */
function SceneReady({ onReady }: SceneReadyProps) {
  // This component renders inside the Canvas and calls onReady when mounted
  // Using useEffect would cause issues, so we call directly
  if (onReady) {
    // Use setTimeout to ensure it's called after the scene is fully rendered
    setTimeout(onReady, 0)
  }
  return null
}

// ============================================================================
// Main Scene Component
// ============================================================================

/**
 * Scene - Base 3D scene component
 *
 * Provides the foundational Canvas setup with error boundary, Suspense,
 * and quality settings integration.
 *
 * @example
 * ```tsx
 * <Scene
 *   quality="high"
 *   cameraPosition={[0, 2, 5]}
 *   shadows
 *   onReady={() => console.log('Scene ready!')}
 * >
 *   <ambientLight />
 *   <mesh>
 *     <boxGeometry />
 *     <meshStandardMaterial color="cyan" />
 *   </mesh>
 * </Scene>
 * ```
 */
export function Scene({
  children,
  quality,
  cameraPosition = DEFAULT_CAMERA_POSITION,
  cameraFov = DEFAULT_CAMERA_FOV,
  cameraNear = DEFAULT_CAMERA_NEAR,
  cameraFar = DEFAULT_CAMERA_FAR,
  shadows,
  backgroundColor,
  flat = false,
  linear = false,
  className = '',
  width = '100%',
  height = '400px',
  loadingFallback,
  errorFallback,
  onReady,
  onError,
  canvasProps = {},
}: SceneProps) {
  // Get quality settings
  const { state, reportFps } = useGracefulDegradation({
    initialTier: quality,
    autoDegrade: !quality, // Only auto-degrade if no explicit quality set
  })

  const { settings } = state

  // Determine shadow setting (prop overrides quality setting)
  const enableShadows = shadows ?? settings.shadows

  // Container styles
  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    position: 'relative',
    borderRadius: '16px',
    overflow: 'hidden',
  }

  // Loading component
  const LoadingComponent = loadingFallback ?? (
    <DefaultLoadingFallback width={width} height={height} />
  )

  return (
    <div
      className={className}
      style={containerStyle}
      data-testid="scene-container"
    >
      <SceneErrorBoundary fallback={errorFallback} onError={onError}>
        <Suspense fallback={LoadingComponent}>
          <Canvas
            camera={{
              position: cameraPosition,
              fov: cameraFov,
              near: cameraNear,
              far: cameraFar,
            }}
            shadows={enableShadows}
            dpr={settings.pixelRatio}
            flat={flat}
            linear={linear}
            style={{
              width: '100%',
              height: '100%',
              background: backgroundColor || 'transparent',
            }}
            onCreated={({ gl }) => {
              // Set clear color if background specified
              if (backgroundColor) {
                gl.setClearColor(backgroundColor)
              }

              // Set up performance monitoring callback
              const originalRender = gl.render.bind(gl)
              let lastTime = performance.now()
              let frames = 0

              gl.render = function (...args: Parameters<typeof originalRender>) {
                frames++
                const now = performance.now()
                if (now - lastTime >= 1000) {
                  const fps = frames
                  frames = 0
                  lastTime = now
                  reportFps(fps)
                }
                return originalRender(...args)
              }
            }}
            {...canvasProps}
            data-testid="scene-canvas"
          >
            {/* Scene is ready notification */}
            <SceneReady onReady={onReady} />

            {/* User content */}
            {children}
          </Canvas>
        </Suspense>
      </SceneErrorBoundary>
    </div>
  )
}

// ============================================================================
// Scene with Quality Context
// ============================================================================

export interface SceneWithQualityProps extends Omit<SceneProps, 'quality'> {
  /** Force a specific quality tier */
  forcedQuality?: QualityTier
}

/**
 * Scene with exposed quality controls
 *
 * Use this when you need to access quality settings from within the scene.
 */
export function SceneWithQuality({
  forcedQuality,
  ...props
}: SceneWithQualityProps) {
  const { state } = useGracefulDegradation({
    initialTier: forcedQuality,
    autoDegrade: !forcedQuality,
  })

  return <Scene quality={state.currentTier} {...props} />
}

// ============================================================================
// Exports
// ============================================================================

export default Scene
