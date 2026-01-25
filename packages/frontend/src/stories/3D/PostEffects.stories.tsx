/**
 * PostEffects Component Stories
 *
 * Demonstrates the combined post-processing effects including
 * Bloom, ChromaticAberration, Vignette, and Scanlines.
 *
 * @module stories/3D/PostEffects
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Scene } from '../../components/3d/Scene';
import { LightingRig } from '../../components/3d/LightingRig';
import { Starfield, STARFIELD_PRESETS } from '../../components/3d/effects/Starfield';
import { GridFloor, GRID_FLOOR_PRESETS } from '../../components/3d/effects/GridFloor';
import {
  FloatingShapes,
  FLOATING_SHAPES_PRESETS,
} from '../../components/3d/effects/FloatingShapes';
import { BloomEffect } from '../../components/3d/effects/BloomEffect';
import { ChromaticAberrationEffect } from '../../components/3d/effects/ChromaticAberrationEffect';
import { VignetteEffect } from '../../components/3d/effects/VignetteEffect';
import { Scanlines } from '../../components/3d/effects/Scanlines';

// ============================================================================
// Types
// ============================================================================

interface CombinedEffectsProps {
  // Bloom
  enableBloom: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;
  // Chromatic Aberration
  enableChromatic: boolean;
  chromaticOffset: number;
  // Vignette
  enableVignette: boolean;
  vignetteIntensity: number;
  // Scanlines
  enableScanlines: boolean;
  scanlinesOpacity: number;
  scanlinesCount: number;
  // Scene
  enableStarfield: boolean;
  enableGridFloor: boolean;
  enableFloatingShapes: boolean;
}

// ============================================================================
// Combined Effects Component
// ============================================================================

const CombinedEffects = ({
  enableBloom = true,
  bloomIntensity = 1.5,
  bloomThreshold = 0.6,
  bloomRadius = 0.8,
  enableChromatic = true,
  chromaticOffset = 0.003,
  enableVignette = true,
  vignetteIntensity = 0.5,
  enableScanlines = true,
  scanlinesOpacity = 0.15,
  scanlinesCount = 800,
  enableStarfield = true,
  enableGridFloor = true,
  enableFloatingShapes = true,
}: Partial<CombinedEffectsProps>) => {
  return (
    <>
      {/* Background Effects */}
      {enableStarfield && <Starfield {...STARFIELD_PRESETS.arcade} />}
      {enableGridFloor && <GridFloor {...GRID_FLOOR_PRESETS.arcade} />}
      {enableFloatingShapes && <FloatingShapes {...FLOATING_SHAPES_PRESETS.subtle} />}

      {/* Post-Processing Effects */}
      {enableBloom && (
        <BloomEffect
          intensity={bloomIntensity}
          luminanceThreshold={bloomThreshold}
          radius={bloomRadius}
        />
      )}
      {enableChromatic && <ChromaticAberrationEffect offset={chromaticOffset} />}
      {enableVignette && <VignetteEffect intensity={vignetteIntensity} />}
      {enableScanlines && <Scanlines opacity={scanlinesOpacity} count={scanlinesCount} />}
    </>
  );
};

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof CombinedEffects> = {
  title: '3D/Effects/PostEffects',
  component: CombinedEffects,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Post-processing effects combine to create the signature arcade aesthetic.

**Available Effects:**

| Effect | Description | Performance Impact |
|--------|-------------|-------------------|
| **Bloom** | Glow around bright areas | Medium |
| **Chromatic Aberration** | Color fringing at edges | Low |
| **Vignette** | Darkened corners | Very Low |
| **Scanlines** | CRT monitor lines | Low |

**Performance Tiers:**
The effects automatically scale based on device capability:

- **High**: All effects enabled at full quality
- **Medium**: Reduced bloom radius, disabled chromatic aberration
- **Low**: Subtle bloom only, no chromatic aberration or scanlines
- **Minimal**: All post-processing disabled

**Effect Combinations:**
Different combinations create different moods:
- **Arcade Classic**: Bloom + Scanlines + Vignette
- **Cyberpunk**: High bloom + Strong chromatic aberration
- **Cinematic**: Vignette + Subtle bloom
- **Retro CRT**: Strong scanlines + Vignette + Chromatic aberration

**Usage:**
\`\`\`tsx
// Inside a Scene with EffectComposer
<Scene>
  <BloomEffect preset="arcade" />
  <VignetteEffect intensity={0.4} />
  <Scanlines opacity={0.1} />
</Scene>
\`\`\`
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    enableBloom: {
      control: 'boolean',
      description: 'Enable bloom glow effect',
      table: { category: 'Bloom' },
    },
    bloomIntensity: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Bloom intensity',
      table: { category: 'Bloom' },
    },
    bloomThreshold: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Bloom luminance threshold',
      table: { category: 'Bloom' },
    },
    bloomRadius: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      description: 'Bloom blur radius',
      table: { category: 'Bloom' },
    },
    enableChromatic: {
      control: 'boolean',
      description: 'Enable chromatic aberration',
      table: { category: 'Chromatic Aberration' },
    },
    chromaticOffset: {
      control: { type: 'range', min: 0, max: 0.02, step: 0.001 },
      description: 'Chromatic aberration offset',
      table: { category: 'Chromatic Aberration' },
    },
    enableVignette: {
      control: 'boolean',
      description: 'Enable vignette effect',
      table: { category: 'Vignette' },
    },
    vignetteIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.05 },
      description: 'Vignette darkness intensity',
      table: { category: 'Vignette' },
    },
    enableScanlines: {
      control: 'boolean',
      description: 'Enable CRT scanlines',
      table: { category: 'Scanlines' },
    },
    scanlinesOpacity: {
      control: { type: 'range', min: 0, max: 0.5, step: 0.01 },
      description: 'Scanline opacity',
      table: { category: 'Scanlines' },
    },
    scanlinesCount: {
      control: { type: 'range', min: 200, max: 1200, step: 100 },
      description: 'Number of scanlines',
      table: { category: 'Scanlines' },
    },
    enableStarfield: {
      control: 'boolean',
      description: 'Enable starfield background',
      table: { category: 'Scene Elements' },
    },
    enableGridFloor: {
      control: 'boolean',
      description: 'Enable grid floor',
      table: { category: 'Scene Elements' },
    },
    enableFloatingShapes: {
      control: 'boolean',
      description: 'Enable floating shapes',
      table: { category: 'Scene Elements' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CombinedEffects>;

// ============================================================================
// Decorator
// ============================================================================

const SceneDecorator = (Story: React.ComponentType) => (
  <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
    <Scene cameraPosition={[0, 3, 10]} cameraFov={75}>
      <LightingRig preset="arcade" />
      <Story />
    </Scene>
  </div>
);

// ============================================================================
// Stories
// ============================================================================

/**
 * Full arcade experience with all effects
 */
export const ArcadeClassic: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 1.5,
    bloomThreshold: 0.6,
    bloomRadius: 0.8,
    enableChromatic: true,
    chromaticOffset: 0.003,
    enableVignette: true,
    vignetteIntensity: 0.5,
    enableScanlines: true,
    scanlinesOpacity: 0.15,
    scanlinesCount: 800,
    enableStarfield: true,
    enableGridFloor: true,
    enableFloatingShapes: true,
  },
};

/**
 * Cyberpunk style with intense bloom
 */
export const Cyberpunk: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 3,
    bloomThreshold: 0.4,
    bloomRadius: 1.2,
    enableChromatic: true,
    chromaticOffset: 0.008,
    enableVignette: true,
    vignetteIntensity: 0.6,
    enableScanlines: false,
    enableStarfield: true,
    enableGridFloor: true,
    enableFloatingShapes: true,
  },
};

/**
 * Retro CRT monitor effect
 */
export const RetroCRT: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 1,
    bloomThreshold: 0.7,
    bloomRadius: 0.6,
    enableChromatic: true,
    chromaticOffset: 0.005,
    enableVignette: true,
    vignetteIntensity: 0.7,
    enableScanlines: true,
    scanlinesOpacity: 0.25,
    scanlinesCount: 600,
    enableStarfield: false,
    enableGridFloor: true,
    enableFloatingShapes: false,
  },
};

/**
 * Cinematic film look
 */
export const Cinematic: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 0.8,
    bloomThreshold: 0.8,
    bloomRadius: 1,
    enableChromatic: false,
    enableVignette: true,
    vignetteIntensity: 0.4,
    enableScanlines: false,
    enableStarfield: true,
    enableGridFloor: false,
    enableFloatingShapes: true,
  },
};

/**
 * Subtle effects for gameplay (less distraction)
 */
export const Gameplay: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 0.6,
    bloomThreshold: 0.75,
    bloomRadius: 0.5,
    enableChromatic: false,
    enableVignette: true,
    vignetteIntensity: 0.3,
    enableScanlines: true,
    scanlinesOpacity: 0.08,
    scanlinesCount: 800,
    enableStarfield: true,
    enableGridFloor: true,
    enableFloatingShapes: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Optimized settings for actual gameplay - visual flair without being distracting.',
      },
    },
  },
};

/**
 * Low performance mode - reduced effects
 */
export const LowPerformance: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: true,
    bloomIntensity: 0.5,
    bloomThreshold: 0.8,
    bloomRadius: 0.4,
    enableChromatic: false,
    enableVignette: true,
    vignetteIntensity: 0.3,
    enableScanlines: false,
    enableStarfield: false,
    enableGridFloor: true,
    enableFloatingShapes: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Reduced effects for low-performance devices. This configuration is automatically
applied when the performance scaling system detects low FPS.

Disabled: Chromatic aberration, scanlines, starfield, floating shapes
Reduced: Bloom intensity and radius
        `,
      },
    },
  },
};

/**
 * Minimal mode - essential effects only
 */
export const Minimal: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: false,
    enableChromatic: false,
    enableVignette: false,
    enableScanlines: false,
    enableStarfield: false,
    enableGridFloor: true,
    enableFloatingShapes: false,
  },
  parameters: {
    docs: {
      description: {
        story: `
Minimal mode with almost all effects disabled. Used on very low-end devices
or when the user has explicitly requested reduced motion/effects.
        `,
      },
    },
  },
};

/**
 * No effects - base scene only
 */
export const NoEffects: Story = {
  decorators: [SceneDecorator],
  args: {
    enableBloom: false,
    enableChromatic: false,
    enableVignette: false,
    enableScanlines: false,
    enableStarfield: true,
    enableGridFloor: true,
    enableFloatingShapes: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Scene without any post-processing effects for comparison.',
      },
    },
  },
};

/**
 * Effect comparison - with and without bloom
 */
export const BloomComparison: Story = {
  decorators: [
    () => (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh' }}>
        <div style={{ position: 'relative', borderRight: '1px solid #2d2d4a' }}>
          <Scene cameraPosition={[0, 3, 10]} cameraFov={75}>
            <LightingRig preset="arcade" />
            <Starfield {...STARFIELD_PRESETS.arcade} />
            <GridFloor {...GRID_FLOOR_PRESETS.arcade} />
            <FloatingShapes {...FLOATING_SHAPES_PRESETS.subtle} />
          </Scene>
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              color: '#ff3366',
              fontFamily: 'monospace',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            Without Bloom
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <Scene cameraPosition={[0, 3, 10]} cameraFov={75}>
            <LightingRig preset="arcade" />
            <Starfield {...STARFIELD_PRESETS.arcade} />
            <GridFloor {...GRID_FLOOR_PRESETS.arcade} />
            <FloatingShapes {...FLOATING_SHAPES_PRESETS.subtle} />
            <BloomEffect intensity={1.5} luminanceThreshold={0.6} radius={0.8} />
          </Scene>
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              color: '#00ff88',
              fontFamily: 'monospace',
              fontSize: '14px',
              textTransform: 'uppercase',
            }}
          >
            With Bloom
          </div>
        </div>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison showing the impact of bloom effect.',
      },
    },
  },
};
