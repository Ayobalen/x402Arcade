/**
 * LightingRig Component Stories
 *
 * Demonstrates the various lighting configurations available
 * for 3D scenes in the arcade environment.
 *
 * @module stories/3D/LightingRig
 */

import type { Meta, StoryObj } from '@storybook/react'
import {
  LightingRig,
  ArcadeLighting,
  NeonLighting,
  GameStateLighting,
  LIGHTING_PRESETS,
  type LightingPreset,
} from '../../components/3d/LightingRig'
import { Scene } from '../../components/3d/Scene'
import { DemoBox, DemoGround, DemoSphere, DemoScene } from './decorators'

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof LightingRig> = {
  title: '3D/LightingRig',
  component: LightingRig,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
LightingRig provides consistent, reusable lighting setups for 3D scenes.
It includes:

- **Ambient light** - Base illumination for the entire scene
- **Directional light** - Main light source with shadow support
- **Point lights** - Neon accent lights with optional pulsing animation

Use presets for quick setup or customize individual light properties.

### Presets Available:
- \`arcade\` - Classic arcade cabinet lighting
- \`neon\` - Full neon glow emphasis
- \`dramatic\` - High contrast with sharp shadows
- \`soft\` - Gentle ambient with subtle accents
- \`game-over\` - Red/orange danger lighting
- \`victory\` - Green/cyan celebration lighting
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    preset: {
      control: 'select',
      options: ['arcade', 'neon', 'dramatic', 'soft', 'game-over', 'victory'] as LightingPreset[],
      description: 'Lighting preset to use',
    },
    shadows: {
      control: 'boolean',
      description: 'Enable shadow casting',
    },
    shadowQuality: {
      control: 'select',
      options: ['low', 'medium', 'high', 'ultra'],
      description: 'Shadow map quality',
    },
    intensityMultiplier: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: 'Overall intensity multiplier',
    },
    helpers: {
      control: 'boolean',
      description: 'Show debug helpers for lights',
    },
  },
}

export default meta
type Story = StoryObj<typeof LightingRig>

// ============================================================================
// Preset Stories
// ============================================================================

/**
 * Default arcade lighting - the standard look for game scenes
 */
export const ArcadePreset: Story = {
  args: {
    preset: 'arcade',
    shadows: true,
    shadowQuality: 'medium',
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
}

/**
 * Neon lighting - emphasized glow effects for vibrant scenes
 */
export const NeonPreset: Story = {
  args: {
    preset: 'neon',
    shadows: false,
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows={false} cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Neon preset with multiple pulsing point lights for a vibrant, glowing atmosphere.',
      },
    },
  },
}

/**
 * Dramatic lighting - high contrast with strong shadows
 */
export const DramaticPreset: Story = {
  args: {
    preset: 'dramatic',
    shadows: true,
    shadowQuality: 'high',
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dramatic lighting with strong directional light and sharp shadows.',
      },
    },
  },
}

/**
 * Soft lighting - gentle ambient for menus and UI
 */
export const SoftPreset: Story = {
  args: {
    preset: 'soft',
    shadows: true,
    shadowQuality: 'medium',
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Soft, ambient lighting suitable for menus and non-game UI.',
      },
    },
  },
}

/**
 * Game Over lighting - red/orange danger atmosphere
 */
export const GameOverPreset: Story = {
  args: {
    preset: 'game-over',
    shadows: true,
    shadowQuality: 'medium',
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Red and orange pulsing lights for game over sequences.',
      },
    },
  },
}

/**
 * Victory lighting - green/cyan celebration
 */
export const VictoryPreset: Story = {
  args: {
    preset: 'victory',
    shadows: true,
    shadowQuality: 'medium',
    intensityMultiplier: 1,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Green and cyan lights for victory celebrations and high scores.',
      },
    },
  },
}

// ============================================================================
// Configuration Stories
// ============================================================================

/**
 * Adjustable intensity
 */
export const IntensityControl: Story = {
  args: {
    preset: 'arcade',
    shadows: true,
    shadowQuality: 'medium',
    intensityMultiplier: 1.5,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use the intensityMultiplier to brighten or dim all lights proportionally.',
      },
    },
  },
}

/**
 * Debug helpers enabled
 */
export const WithDebugHelpers: Story = {
  args: {
    preset: 'arcade',
    shadows: true,
    shadowQuality: 'medium',
    helpers: true,
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[8, 6, 8]}>
        <LightingRig {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Enable helpers to visualize light positions and directions.',
      },
    },
  },
}

/**
 * Shadow quality comparison
 */
export const ShadowQualityComparison: Story = {
  args: {
    preset: 'dramatic',
    shadows: true,
    shadowQuality: 'ultra',
  },
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[4, 3, 4]}>
        <LightingRig {...args} />
        <DemoBox position={[0, 0.5, 0]} />
        <DemoGround />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Use the shadowQuality control to compare low, medium, high, and ultra shadow quality.',
      },
    },
  },
}

// ============================================================================
// Custom Configuration Stories
// ============================================================================

/**
 * Custom point lights configuration
 */
export const CustomPointLights: Story = {
  render: () => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <LightingRig
          ambient={{ color: '#0a0a0f', intensity: 0.2 }}
          directional={{ position: [5, 10, 5], intensity: 0.3, castShadow: true }}
          pointLights={[
            { position: [-4, 2, 0], color: '#ff0000', intensity: 3, pulse: true, pulseSpeed: 1 },
            { position: [0, 2, 4], color: '#00ff00', intensity: 3, pulse: true, pulseSpeed: 1.5 },
            { position: [4, 2, 0], color: '#0000ff', intensity: 3, pulse: true, pulseSpeed: 2 },
          ]}
          shadows
        />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Custom point light configuration with RGB colors at different pulse speeds.
You can specify any number of point lights with individual settings.
        `,
      },
    },
  },
}

/**
 * Ambient only (no directional light)
 */
export const AmbientOnly: Story = {
  render: () => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows={false} cameraPosition={[6, 4, 6]}>
        <LightingRig
          ambient={{ color: '#2d2d4a', intensity: 1.5 }}
          directional={false}
          pointLights={[]}
        />
        <DemoScene />
      </Scene>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ambient lighting only, no directional or point lights. Flat, even illumination.',
      },
    },
  },
}

// ============================================================================
// Specialized Variant Stories
// ============================================================================

/**
 * ArcadeLighting component - pre-configured for arcade scenes
 */
export const ArcadeLightingComponent: StoryObj<typeof ArcadeLighting> = {
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <ArcadeLighting {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  args: {
    shadows: true,
    shadowQuality: 'medium',
    brightness: 1,
    pulse: true,
  },
  argTypes: {
    brightness: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'ArcadeLighting is a pre-configured variant specifically for arcade cabinet scenes.',
      },
    },
  },
}

/**
 * NeonLighting component - customizable neon colors
 */
export const NeonLightingComponent: StoryObj<typeof NeonLighting> = {
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows={false} cameraPosition={[6, 4, 6]}>
        <NeonLighting {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  args: {
    primaryColor: '#00ffff',
    secondaryColor: '#ff00ff',
    shadows: false,
    brightness: 1,
  },
  argTypes: {
    primaryColor: { control: 'color' },
    secondaryColor: { control: 'color' },
    brightness: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'NeonLighting allows customizing the primary and secondary neon colors.',
      },
    },
  },
}

/**
 * GameStateLighting component - reacts to game state
 */
export const GameStateLightingComponent: StoryObj<typeof GameStateLighting> = {
  render: (args) => (
    <div style={{ width: '100%', height: '500px' }}>
      <Scene shadows cameraPosition={[6, 4, 6]}>
        <GameStateLighting {...args} />
        <DemoScene />
      </Scene>
    </div>
  ),
  args: {
    state: 'playing',
    shadows: true,
    shadowQuality: 'medium',
  },
  argTypes: {
    state: {
      control: 'select',
      options: ['playing', 'paused', 'game-over', 'victory', 'idle'],
    },
  },
  parameters: {
    docs: {
      description: {
        story: `
GameStateLighting automatically adjusts lighting based on the current game state.
Use this to have lighting respond to gameplay events.
        `,
      },
    },
  },
}

// ============================================================================
// All Presets Comparison
// ============================================================================

/**
 * All presets side by side (gallery view)
 */
export const AllPresetsGallery: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', padding: '16px' }}>
      {(Object.keys(LIGHTING_PRESETS) as LightingPreset[]).map((preset) => (
        <div key={preset} style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 10,
          }}>
            {preset}
          </div>
          <div style={{ width: '100%', height: '250px' }}>
            <Scene shadows cameraPosition={[5, 3, 5]}>
              <LightingRig preset={preset} shadows />
              <DemoBox position={[0, 0.5, 0]} />
              <DemoSphere position={[1.5, 1, 0]} />
              <DemoGround />
            </Scene>
          </div>
        </div>
      ))}
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Comparison of all available lighting presets.',
      },
    },
  },
}
