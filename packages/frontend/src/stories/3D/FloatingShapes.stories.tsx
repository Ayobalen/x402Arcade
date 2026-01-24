/**
 * FloatingShapes Component Stories
 *
 * Demonstrates the FloatingShapes background effect component
 * with various presets and animation configurations.
 *
 * @module stories/3D/FloatingShapes
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Scene } from '../../components/3d/Scene';
import { LightingRig } from '../../components/3d/LightingRig';
import {
  FloatingShapes,
  FLOATING_SHAPES_PRESETS,
} from '../../components/3d/effects/FloatingShapes';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof FloatingShapes> = {
  title: '3D/Effects/FloatingShapes',
  component: FloatingShapes,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The FloatingShapes component creates decorative floating geometric shapes with neon outlines.
It features:
- Multiple shape types (cube, pyramid, sphere, octahedron, torus, icosahedron)
- Independent rotation animations with varying speeds and axes
- Smooth floating motion using sine/cosine functions
- Randomized animation phases for organic movement
- Pulsing glow effects
- Customizable colors, sizes, and animation speeds
- Multiple presets for different visual styles

Perfect for atmospheric backgrounds in arcade-style UIs.
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    count: {
      control: { type: 'range', min: 5, max: 50, step: 1 },
      description: 'Number of shapes to generate',
    },
    spreadRadius: {
      control: { type: 'range', min: 10, max: 60, step: 5 },
      description: 'Spread radius for shape placement',
    },
    rotationSpeed: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Base rotation speed multiplier',
    },
    driftSpeed: {
      control: { type: 'range', min: 0, max: 0.5, step: 0.01 },
      description: 'Drift speed multiplier',
    },
    glowIntensity: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: 'Glow intensity',
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Overall opacity',
    },
    enableRotation: {
      control: 'boolean',
      description: 'Enable shape rotation animation',
    },
    enableDrift: {
      control: 'boolean',
      description: 'Enable drifting movement',
    },
    enablePulse: {
      control: 'boolean',
      description: 'Enable pulsing glow effect',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary neon color',
    },
    secondaryColor: {
      control: 'color',
      description: 'Secondary neon color',
    },
    tertiaryColor: {
      control: 'color',
      description: 'Tertiary neon color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FloatingShapes>;

// ============================================================================
// Scene Wrapper Component
// ============================================================================

interface SceneWrapperProps {
  children: React.ReactNode;
}

function SceneWrapper({ children }: SceneWrapperProps) {
  return (
    <div style={{ width: '100%', height: '600px', background: '#0F0F1A' }}>
      <Scene cameraPosition={[0, 0, 15]} cameraFov={60} shadows={false}>
        <LightingRig preset="arcade" />
        {children}
      </Scene>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default arcade preset with moderate density
 */
export const Default: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.arcade,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
};

/**
 * Subtle background shapes - minimal distraction
 */
export const Subtle: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.subtle,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Subtle, low-opacity shapes for minimal distraction. Good for content-heavy pages.',
      },
    },
  },
};

/**
 * Dense cyberpunk style with high energy
 */
export const Cyberpunk: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.cyberpunk,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Dense, vibrant shapes with cyan, magenta, and yellow colors. High-energy cyberpunk aesthetic.',
      },
    },
  },
};

/**
 * Minimal scattered shapes
 */
export const Minimal: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.minimal,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Sparse, larger shapes with slow movement. Clean and minimalist.',
      },
    },
  },
};

/**
 * Matrix/digital rain inspired style
 */
export const Matrix: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.matrix,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Green-themed shapes inspired by The Matrix. Fast rotation and moderate density.',
      },
    },
  },
};

/**
 * Synthwave retro style
 */
export const Synthwave: Story = {
  args: {
    ...FLOATING_SHAPES_PRESETS.synthwave,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Retro synthwave colors (magenta, cyan, pink) with moderate movement. Perfect for 80s arcade theme.',
      },
    },
  },
};

/**
 * Custom configuration - all animations enabled
 */
export const CustomAnimations: Story = {
  args: {
    count: 20,
    spreadRadius: 30,
    rotationSpeed: 0.5,
    driftSpeed: 0.15,
    glowIntensity: 1.2,
    opacity: 0.8,
    enableRotation: true,
    enableDrift: true,
    enablePulse: true,
    primaryColor: '#8B5CF6',
    secondaryColor: '#06B6D4',
    tertiaryColor: '#EC4899',
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Custom configuration demonstrating all animation features:
- Independent rotation on multiple axes
- Smooth floating up/down motion
- Sine/cosine functions for organic movement
- Randomized animation phases
- Pulsing glow effects
        `,
      },
    },
  },
};

/**
 * Static shapes - no animations (for comparison)
 */
export const StaticNoAnimations: Story = {
  args: {
    count: 15,
    spreadRadius: 30,
    opacity: 0.7,
    enableRotation: false,
    enableDrift: false,
    enablePulse: false,
    glowIntensity: 1,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All animations disabled to show static shapes for comparison.',
      },
    },
  },
};

/**
 * Rotation only - demonstrates independent rotation on multiple axes
 */
export const RotationOnly: Story = {
  args: {
    count: 15,
    spreadRadius: 30,
    rotationSpeed: 0.4,
    opacity: 0.8,
    enableRotation: true,
    enableDrift: false,
    enablePulse: false,
    glowIntensity: 1,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Only rotation animation enabled. Each shape rotates independently on different axes for variety.',
      },
    },
  },
};

/**
 * Drift only - demonstrates smooth floating motion
 */
export const DriftOnly: Story = {
  args: {
    count: 15,
    spreadRadius: 30,
    driftSpeed: 0.12,
    opacity: 0.8,
    enableRotation: false,
    enableDrift: true,
    enablePulse: false,
    glowIntensity: 1,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Only drift animation enabled. Shapes float smoothly using sine/cosine functions with randomized phases.',
      },
    },
  },
};

/**
 * Fast rotation - demonstrates high-speed rotation
 */
export const FastRotation: Story = {
  args: {
    count: 15,
    spreadRadius: 30,
    rotationSpeed: 1,
    driftSpeed: 0.2,
    opacity: 0.8,
    enableRotation: true,
    enableDrift: true,
    enablePulse: true,
    glowIntensity: 1.5,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fast rotation and drift with intense glow for high-energy scenes.',
      },
    },
  },
};

/**
 * Dense field - many shapes for immersive effect
 */
export const DenseField: Story = {
  args: {
    count: 40,
    spreadRadius: 35,
    rotationSpeed: 0.3,
    driftSpeed: 0.08,
    opacity: 0.6,
    enableRotation: true,
    enableDrift: true,
    enablePulse: true,
    glowIntensity: 0.9,
  },
  render: (args) => (
    <SceneWrapper>
      <FloatingShapes {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'High density of shapes creating an immersive atmospheric effect.',
      },
    },
  },
};
