/**
 * Storybook Decorators for 3D Components
 *
 * Provides Canvas wrapper and common configuration for
 * React Three Fiber stories.
 *
 * @module stories/3D/decorators
 */

/* eslint-disable react-refresh/only-export-components */

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei'
import type { Decorator } from '@storybook/react'

// ============================================================================
// Types
// ============================================================================

export interface CanvasDecoratorOptions {
  /** Enable orbit controls for camera manipulation */
  controls?: boolean
  /** Show reference grid */
  grid?: boolean
  /** Camera position [x, y, z] */
  cameraPosition?: [number, number, number]
  /** Camera field of view */
  cameraFov?: number
  /** Background color */
  backgroundColor?: string
  /** Canvas height */
  height?: string | number
  /** Enable shadows */
  shadows?: boolean
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<CanvasDecoratorOptions> = {
  controls: true,
  grid: true,
  cameraPosition: [5, 5, 5],
  cameraFov: 50,
  backgroundColor: '#0a0a0f',
  height: '600px',
  shadows: true,
}

// ============================================================================
// Loading Component
// ============================================================================

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#8B5CF6" wireframe />
    </mesh>
  )
}

// ============================================================================
// Canvas Wrapper
// ============================================================================

interface CanvasWrapperProps extends CanvasDecoratorOptions {
  children: React.ReactNode
}

export function CanvasWrapper({
  children,
  controls = DEFAULT_OPTIONS.controls,
  grid = DEFAULT_OPTIONS.grid,
  cameraPosition = DEFAULT_OPTIONS.cameraPosition,
  cameraFov = DEFAULT_OPTIONS.cameraFov,
  backgroundColor = DEFAULT_OPTIONS.backgroundColor,
  height = DEFAULT_OPTIONS.height,
  shadows = DEFAULT_OPTIONS.shadows,
}: CanvasWrapperProps) {
  return (
    <div
      style={{
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor,
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <Canvas
        shadows={shadows}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={cameraFov}
            near={0.1}
            far={1000}
          />
          {controls && (
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={50}
            />
          )}
          {grid && (
            <Grid
              position={[0, -0.01, 0]}
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#2d2d4a"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#3d3d5c"
              fadeDistance={30}
              fadeStrength={1}
              followCamera={false}
            />
          )}
          {children}
        </Suspense>
      </Canvas>
    </div>
  )
}

// ============================================================================
// Decorator Factories
// ============================================================================

/**
 * Creates a Storybook decorator that wraps stories in a R3F Canvas
 *
 * @example
 * ```tsx
 * export default {
 *   title: '3D/MyComponent',
 *   decorators: [withCanvas({ cameraPosition: [0, 5, 10] })],
 * }
 * ```
 */
export function withCanvas(options: CanvasDecoratorOptions = {}): Decorator {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return (Story) => (
    <CanvasWrapper {...mergedOptions}>
      <Story />
    </CanvasWrapper>
  )
}

/**
 * Default Canvas decorator with standard settings
 */
export const defaultCanvasDecorator: Decorator = withCanvas()

/**
 * Canvas decorator optimized for arcade cabinet stories
 */
export const arcadeCabinetDecorator: Decorator = withCanvas({
  cameraPosition: [0, 3, 8],
  cameraFov: 45,
  grid: false,
})

/**
 * Canvas decorator for small component previews
 */
export const componentPreviewDecorator: Decorator = withCanvas({
  cameraPosition: [0, 0, 5],
  cameraFov: 50,
  grid: false,
  height: '400px',
})

/**
 * Canvas decorator for lighting demonstrations
 */
export const lightingDemoDecorator: Decorator = withCanvas({
  cameraPosition: [6, 4, 6],
  cameraFov: 50,
  shadows: true,
})

// ============================================================================
// Helper Components for Stories
// ============================================================================

/**
 * Simple box mesh for testing lighting and materials
 */
export function DemoBox({
  position = [0, 0.5, 0] as [number, number, number],
  color = '#8B5CF6',
  castShadow = true,
  receiveShadow = true,
}) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

/**
 * Ground plane for shadow reception
 */
export function DemoGround({
  size = 10,
  color = '#1a1a2e',
  receiveShadow = true,
}) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow={receiveShadow}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}

/**
 * Sphere mesh for lighting demonstrations
 */
export function DemoSphere({
  position = [0, 1, 0] as [number, number, number],
  radius = 0.5,
  color = '#00ffff',
  metalness = 0.1,
  roughness = 0.5,
}) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  )
}

/**
 * Multiple objects scene for testing lighting across different materials
 */
export function DemoScene() {
  return (
    <group>
      <DemoGround />
      <DemoBox position={[-2, 0.5, 0]} color="#00ffff" />
      <DemoBox position={[0, 0.5, 0]} color="#8B5CF6" />
      <DemoBox position={[2, 0.5, 0]} color="#ff00ff" />
      <DemoSphere position={[-1, 1.5, 2]} color="#00ff88" />
      <DemoSphere position={[1, 1.5, 2]} color="#ff4444" />
    </group>
  )
}
