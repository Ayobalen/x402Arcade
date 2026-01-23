/**
 * Scene Component Stories
 *
 * Demonstrates the base Scene component which provides
 * a complete R3F Canvas setup with error handling,
 * loading states, and quality management.
 *
 * @module stories/3D/Scene
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Scene, SceneWithQuality } from '../../components/3d/Scene'
import { LightingRig } from '../../components/3d/LightingRig'
import { DemoBox, DemoGround, DemoSphere } from './decorators'

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof Scene> = {
  title: '3D/Scene',
  component: Scene,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Scene component is the foundation for all 3D content in x402 Arcade.
It provides:
- Canvas setup with proper WebGL configuration
- Error boundary with graceful fallback
- Loading states with Suspense
- Optional quality management with graceful degradation
- Camera configuration
- FPS monitoring callbacks

Use this component as the root for any 3D content.
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    shadows: {
      control: 'boolean',
      description: 'Enable shadow rendering',
    },
    cameraPosition: {
      control: 'object',
      description: 'Initial camera position [x, y, z]',
    },
    cameraFov: {
      control: { type: 'range', min: 20, max: 120, step: 5 },
      description: 'Camera field of view in degrees',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the container',
    },
  },
}

export default meta
type Story = StoryObj<typeof Scene>

// ============================================================================
// Stories
// ============================================================================

/**
 * Basic scene with default settings
 */
export const Default: Story = {
  args: {
    shadows: true,
    cameraPosition: [5, 5, 5],
    cameraFov: 50,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="arcade" />
        <DemoBox position={[0, 0.5, 0]} />
        <DemoGround />
      </Scene>
    </div>
  ),
}

/**
 * Scene with multiple objects
 */
export const MultipleObjects: Story = {
  args: {
    shadows: true,
    cameraPosition: [8, 6, 8],
    cameraFov: 45,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="neon" />
        <DemoGround size={15} />
        <DemoBox position={[-3, 0.5, 0]} color="#00ffff" />
        <DemoBox position={[0, 0.5, 0]} color="#8B5CF6" />
        <DemoBox position={[3, 0.5, 0]} color="#ff00ff" />
        <DemoSphere position={[-1.5, 1.5, 2]} color="#00ff88" />
        <DemoSphere position={[1.5, 1.5, 2]} color="#ff4444" />
      </Scene>
    </div>
  ),
}

/**
 * Scene without shadows for performance comparison
 */
export const NoShadows: Story = {
  args: {
    shadows: false,
    cameraPosition: [5, 5, 5],
    cameraFov: 50,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="soft" shadows={false} />
        <DemoBox position={[0, 0.5, 0]} castShadow={false} receiveShadow={false} />
        <DemoGround receiveShadow={false} />
      </Scene>
    </div>
  ),
}

/**
 * Wide angle camera view
 */
export const WideAngle: Story = {
  args: {
    shadows: true,
    cameraPosition: [3, 2, 3],
    cameraFov: 90,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="dramatic" />
        <DemoBox position={[0, 0.5, 0]} />
        <DemoGround />
      </Scene>
    </div>
  ),
}

/**
 * Telephoto/zoom camera view
 */
export const Telephoto: Story = {
  args: {
    shadows: true,
    cameraPosition: [15, 10, 15],
    cameraFov: 25,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="arcade" />
        <DemoBox position={[0, 0.5, 0]} />
        <DemoGround />
      </Scene>
    </div>
  ),
}

// ============================================================================
// SceneWithQuality Stories
// ============================================================================

/**
 * Scene with quality controls exposed
 */
export const WithQualityControls: StoryObj<typeof SceneWithQuality> = {
  args: {
    shadows: true,
    cameraPosition: [5, 5, 5],
    cameraFov: 50,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <SceneWithQuality {...args}>
        <LightingRig preset="arcade" />
        <DemoBox position={[-2, 0.5, 0]} color="#00ffff" />
        <DemoBox position={[0, 0.5, 0]} color="#8B5CF6" />
        <DemoBox position={[2, 0.5, 0]} color="#ff00ff" />
        <DemoGround />
      </SceneWithQuality>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
SceneWithQuality exposes quality level controls and callbacks.
Use this when you need to react to quality changes or provide
manual quality controls to users.
        `,
      },
    },
  },
}

/**
 * Scene with many objects (performance test)
 */
export const PerformanceTest: Story = {
  args: {
    shadows: true,
    cameraPosition: [5, 5, 5],
    cameraFov: 50,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene {...args}>
        <LightingRig preset="neon" />
        <DemoGround />
        {/* Create many objects to test performance */}
        {Array.from({ length: 25 }).map((_, i) => (
          <DemoBox
            key={i}
            position={[
              (i % 5) * 2 - 4,
              0.5,
              Math.floor(i / 5) * 2 - 4,
            ]}
            color={i % 2 === 0 ? '#00ffff' : '#ff00ff'}
          />
        ))}
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates rendering many objects for performance testing.
The Scene component uses adaptive quality degradation internally.
        `,
      },
    },
  },
}

// ============================================================================
// Documentation
// ============================================================================

/**
 * Empty scene for custom content
 */
export const EmptyCanvas: Story = {
  args: {
    shadows: false,
    cameraPosition: [0, 0, 5],
    cameraFov: 50,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '400px' }}>
      <Scene {...args}>
        {/* Add your 3D content here */}
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#8B5CF6" />
        </mesh>
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
A minimal Scene setup showing how to add basic 3D content.
The Scene component handles all the Canvas setup, error handling,
and loading states - you just add your content.
        `,
      },
    },
  },
}
