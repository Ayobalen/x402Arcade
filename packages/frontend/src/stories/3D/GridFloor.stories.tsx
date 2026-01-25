/**
 * GridFloor Component Stories
 *
 * Demonstrates the GridFloor background effect component
 * with various presets and animation configurations.
 *
 * @module stories/3D/GridFloor
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Scene } from '../../components/3d/Scene';
import { LightingRig } from '../../components/3d/LightingRig';
import {
  GridFloor,
  GRID_FLOOR_PRESETS,
  type GridFloorPreset,
} from '../../components/3d/effects/GridFloor';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof GridFloor> = {
  title: '3D/Effects/GridFloor',
  component: GridFloor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The GridFloor component creates an animated perspective grid floor for retro arcade aesthetics.

**Features:**
- Infinite scrolling grid animation
- Wave distortion effects
- Customizable grid density and colors
- Fade-out at distance for depth
- Glow effects on grid lines
- GPU-accelerated shader-based rendering
- Multiple presets for different visual styles

**Presets:**
- **synthwave**: Classic 80s synthwave aesthetic
- **cyberpunk**: Bright neon with intense glow
- **subtle**: Minimal, non-distracting background
- **tron**: Bright Tron-style grid
- **matrix**: Dense green matrix-style grid
- **arcade**: Default arcade cabinet floor

**Usage:**
\`\`\`tsx
// Basic scrolling grid
<GridFloor speed={3} color="#00ffff" />

// Using a preset
<GridFloor {...GRID_FLOOR_PRESETS.synthwave} />

// Custom cyberpunk grid
<GridFloor
  divisions={100}
  color="#ff00ff"
  speed={5}
  enableGlow
  glowIntensity={2}
/>
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    size: {
      control: { type: 'range', min: 20, max: 200, step: 10 },
      description: 'Size of the grid (width and depth)',
    },
    divisions: {
      control: { type: 'range', min: 10, max: 100, step: 5 },
      description: 'Number of grid divisions',
    },
    color: {
      control: 'color',
      description: 'Grid line color',
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Grid line opacity',
    },
    enableAnimation: {
      control: 'boolean',
      description: 'Enable forward scrolling animation',
    },
    speed: {
      control: { type: 'range', min: 0, max: 10, step: 0.5 },
      description: 'Animation speed (units per second)',
    },
    enableWave: {
      control: 'boolean',
      description: 'Enable wave distortion effect',
    },
    waveAmplitude: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Wave amplitude (height)',
    },
    waveFrequency: {
      control: { type: 'range', min: 0, max: 0.5, step: 0.01 },
      description: 'Wave frequency',
    },
    waveSpeed: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      description: 'Wave animation speed',
    },
    yPosition: {
      control: { type: 'range', min: -10, max: 0, step: 0.5 },
      description: 'Y position of the grid',
    },
    enableFade: {
      control: 'boolean',
      description: 'Enable fade out at distance',
    },
    fadeStart: {
      control: { type: 'range', min: 5, max: 50, step: 5 },
      description: 'Fade start distance from center',
    },
    enableGlow: {
      control: 'boolean',
      description: 'Enable glow effect on lines',
    },
    glowIntensity: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: 'Glow intensity',
    },
  },
};

export default meta;
type Story = StoryObj<typeof GridFloor>;

// ============================================================================
// Decorator
// ============================================================================

const SceneDecorator = (Story: React.ComponentType) => (
  <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
    <Scene cameraPosition={[0, 5, 15]} cameraFov={75}>
      <LightingRig preset="arcade" />
      <Story />
    </Scene>
  </div>
);

// ============================================================================
// Stories
// ============================================================================

/**
 * Default grid floor with arcade styling
 */
export const Default: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.arcade,
  },
};

/**
 * Classic synthwave grid
 */
export const Synthwave: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.synthwave,
  },
};

/**
 * Cyberpunk neon grid
 */
export const Cyberpunk: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.cyberpunk,
  },
};

/**
 * Subtle background grid
 */
export const Subtle: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.subtle,
  },
};

/**
 * Tron-style bright grid
 */
export const Tron: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.tron,
  },
};

/**
 * Matrix-style dense green grid
 */
export const Matrix: Story = {
  decorators: [SceneDecorator],
  args: {
    ...GRID_FLOOR_PRESETS.matrix,
  },
};

/**
 * Static grid without animation
 */
export const Static: Story = {
  decorators: [SceneDecorator],
  args: {
    size: 100,
    divisions: 40,
    color: '#8B5CF6',
    opacity: 0.5,
    enableAnimation: false,
    enableWave: false,
    enableGlow: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Static grid without scrolling animation - useful for menus and overlays.',
      },
    },
  },
};

/**
 * High-speed racing effect
 */
export const Racing: Story = {
  decorators: [SceneDecorator],
  args: {
    size: 150,
    divisions: 60,
    color: '#00ffff',
    opacity: 0.7,
    speed: 8,
    enableWave: false,
    enableGlow: true,
    glowIntensity: 1.5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Fast-scrolling grid for racing or speed effects.',
      },
    },
  },
};

/**
 * Wave-only effect without scrolling
 */
export const WaveOnly: Story = {
  decorators: [SceneDecorator],
  args: {
    size: 100,
    divisions: 50,
    color: '#ff00ff',
    opacity: 0.6,
    enableAnimation: false,
    enableWave: true,
    waveAmplitude: 0.5,
    waveFrequency: 0.15,
    waveSpeed: 0.8,
    enableGlow: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Undulating wave effect without forward movement.',
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
        {(Object.keys(GRID_FLOOR_PRESETS) as GridFloorPreset[]).slice(0, 4).map((preset) => (
          <div key={preset} style={{ position: 'relative', height: '50vh' }}>
            <Scene cameraPosition={[0, 5, 15]} cameraFov={75}>
              <LightingRig preset="arcade" />
              <GridFloor {...GRID_FLOOR_PRESETS[preset]} />
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
        story: 'Shows multiple grid floor presets side by side for comparison.',
      },
    },
  },
};
