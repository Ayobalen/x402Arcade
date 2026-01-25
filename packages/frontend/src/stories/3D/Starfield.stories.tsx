/**
 * Starfield Component Stories
 *
 * Demonstrates the Starfield background effect component
 * with various presets and animation configurations.
 *
 * @module stories/3D/Starfield
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Scene } from '../../components/3d/Scene';
import { LightingRig } from '../../components/3d/LightingRig';
import {
  Starfield,
  STARFIELD_PRESETS,
  type StarfieldPreset,
} from '../../components/3d/effects/Starfield';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof Starfield> = {
  title: '3D/Effects/Starfield',
  component: Starfield,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The Starfield component creates a procedural 3D starfield particle system for deep space backgrounds.

**Features:**
- Thousands of stars with natural size and color variation
- Multiple distribution patterns (sphere, cube, disk, hemisphere)
- Twinkling animation with customizable speed and intensity
- Rotation animation for dynamic backgrounds
- Parallax depth effect with multiple layers
- Performance-optimized with GPU instancing
- Multiple presets for different visual styles

**Performance Tiers:**
The starfield respects the application's performance scaling:
- **High**: 100% particle count, full animations
- **Medium**: 60% particle count, full animations
- **Low**: 30% particle count, reduced animations
- **Minimal**: Disabled (0 particles)

**Usage:**
\`\`\`tsx
// Basic starfield
<Starfield count={5000} radius={100} />

// With parallax depth effect
<Starfield
  {...STARFIELD_PRESETS.parallax}
/>

// Dense galaxy background
<Starfield
  count={10000}
  distribution="disk"
  colorVariation
  enableRotation
/>
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    count: {
      control: { type: 'range', min: 500, max: 10000, step: 500 },
      description: 'Number of stars to generate',
    },
    radius: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: 'Radius of the star sphere',
    },
    distribution: {
      control: 'select',
      options: ['sphere', 'cube', 'disk', 'hemisphere'],
      description: 'Distribution pattern for stars',
    },
    minSize: {
      control: { type: 'range', min: 0.01, max: 0.5, step: 0.01 },
      description: 'Minimum star size',
    },
    maxSize: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.05 },
      description: 'Maximum star size',
    },
    color: {
      control: 'color',
      description: 'Base star color',
    },
    colorVariation: {
      control: 'boolean',
      description: 'Enable color variation for realistic star types',
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Overall star opacity',
    },
    enableTwinkle: {
      control: 'boolean',
      description: 'Enable star twinkling animation',
    },
    twinkleSpeed: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      description: 'Twinkle speed (cycles per second)',
    },
    twinkleAmount: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Twinkle intensity',
    },
    enableRotation: {
      control: 'boolean',
      description: 'Enable rotation animation',
    },
    rotationSpeed: {
      control: { type: 'range', min: 0, max: 0.1, step: 0.001 },
      description: 'Rotation speed (radians per second)',
    },
    enableParallax: {
      control: 'boolean',
      description: 'Enable parallax depth effect',
    },
    parallaxLayers: {
      control: { type: 'range', min: 2, max: 8, step: 1 },
      description: 'Number of parallax layers',
    },
    additiveBlending: {
      control: 'boolean',
      description: 'Use additive blending for glow effect',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Starfield>;

// ============================================================================
// Decorator
// ============================================================================

const SceneDecorator = (Story: React.ComponentType) => (
  <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
    <Scene>
      <LightingRig preset="arcade" />
      <Story />
    </Scene>
  </div>
);

// ============================================================================
// Stories
// ============================================================================

/**
 * Default starfield with twinkling stars
 */
export const Default: Story = {
  decorators: [SceneDecorator],
  args: {
    count: 3000,
    radius: 50,
    enableTwinkle: true,
    colorVariation: true,
  },
};

/**
 * Deep space preset with dense star field
 */
export const DeepSpace: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.deepSpace,
  },
};

/**
 * Dense star cluster
 */
export const Cluster: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.cluster,
  },
};

/**
 * Galaxy disk with rotation
 */
export const Galaxy: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.galaxy,
  },
};

/**
 * Sparse distant stars
 */
export const Distant: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.distant,
  },
};

/**
 * Colorful nebula-style stars
 */
export const Nebula: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.nebula,
  },
};

/**
 * Arcade game backdrop - minimal and non-distracting
 */
export const Arcade: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.arcade,
  },
};

/**
 * Parallax depth effect - near stars move faster than far stars
 */
export const Parallax: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.parallax,
  },
};

/**
 * Cinematic parallax with rotation - for dramatic backgrounds
 */
export const Cinematic: Story = {
  decorators: [SceneDecorator],
  args: {
    ...STARFIELD_PRESETS.cinematic,
  },
};

/**
 * Performance comparison - low particle count for mobile devices
 */
export const LowPerformance: Story = {
  decorators: [SceneDecorator],
  args: {
    count: 1000, // 30% of default (simulating low performance tier)
    radius: 50,
    enableTwinkle: true,
    twinkleSpeed: 0.3,
    colorVariation: false, // Simpler colors
    enableParallax: false, // Disable expensive effects
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates the reduced particle count used on low-performance devices.
The performance scaling system automatically reduces particles to 30% on low-tier devices.
        `,
      },
    },
  },
};

/**
 * All presets showcase
 */
export const AllPresets: Story = {
  decorators: [
    () => (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1px',
          height: '100vh',
          background: '#0a0a0f',
        }}
      >
        {(Object.keys(STARFIELD_PRESETS) as StarfieldPreset[]).slice(0, 4).map((preset) => (
          <div key={preset} style={{ position: 'relative', height: '50vh' }}>
            <Scene>
              <LightingRig preset="arcade" />
              <Starfield {...STARFIELD_PRESETS[preset]} />
            </Scene>
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                color: '#00ffff',
                fontFamily: 'monospace',
                fontSize: '12px',
                textTransform: 'uppercase',
              }}
            >
              {preset}
            </div>
          </div>
        ))}
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows multiple starfield presets side by side for comparison.',
      },
    },
  },
};
