/**
 * NoiseOverlay Storybook Stories
 *
 * Demonstrates the film grain/noise overlay effect component
 * with various configurations and use cases.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NoiseOverlay } from '../packages/frontend/src/components/layout/BackgroundEffects/NoiseOverlay';

const meta = {
  title: 'Background Effects/NoiseOverlay',
  component: NoiseOverlay,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#f0f0f0' },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    intensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.01 },
      description: 'Opacity of the noise layer',
      table: {
        defaultValue: { summary: 0.08 },
        type: { summary: 'number' },
      },
    },
    animate: {
      control: 'boolean',
      description: 'Whether to animate the noise pattern',
      table: {
        defaultValue: { summary: true },
        type: { summary: 'boolean' },
      },
    },
    fps: {
      control: { type: 'range', min: 1, max: 60, step: 1 },
      description: 'Animation frames per second',
      table: {
        defaultValue: { summary: 12 },
        type: { summary: 'number' },
      },
    },
    grainSize: {
      control: { type: 'range', min: 0, max: 5, step: 0.1 },
      description: 'Grain blur size in pixels',
      table: {
        defaultValue: { summary: 1 },
        type: { summary: 'number' },
      },
    },
    blendMode: {
      control: 'select',
      options: ['overlay', 'multiply', 'screen', 'soft-light', 'hard-light'],
      description: 'CSS blend mode for the noise layer',
      table: {
        defaultValue: { summary: 'overlay' },
        type: { summary: 'string' },
      },
    },
  },
} satisfies Meta<typeof NoiseOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Demo wrapper with sample content
 */
const DemoWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden">
    {/* Sample content to show grain effect */}
    <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-white">
      <h1 className="text-6xl font-bold mb-4 text-[#00ffff]">x402 Arcade</h1>
      <p className="text-2xl text-[#94a3b8] mb-8">Insert a Penny, Play for Glory</p>
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-[#1a1a2e] p-6 rounded-xl border border-[#2d2d4a]">
          <h3 className="text-xl font-bold text-[#ff00ff] mb-2">Snake</h3>
          <p className="text-sm text-[#94a3b8]">Classic arcade</p>
        </div>
        <div className="bg-[#1a1a2e] p-6 rounded-xl border border-[#2d2d4a]">
          <h3 className="text-xl font-bold text-[#00ffff] mb-2">Tetris</h3>
          <p className="text-sm text-[#94a3b8]">Block stacking</p>
        </div>
        <div className="bg-[#1a1a2e] p-6 rounded-xl border border-[#2d2d4a]">
          <h3 className="text-xl font-bold text-[#00ff00] mb-2">Pong</h3>
          <p className="text-sm text-[#94a3b8]">Retro sports</p>
        </div>
      </div>
      <button className="px-8 py-4 bg-gradient-to-r from-[#00ffff] to-[#ff00ff] text-black font-bold rounded-lg">
        Start Playing
      </button>
    </div>

    {/* Noise overlay */}
    {children}
  </div>
);

/**
 * Default configuration
 * Subtle grain effect with smooth animation
 */
export const Default: Story = {
  args: {
    intensity: 0.08,
    animate: true,
    fps: 12,
    grainSize: 1,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Subtle grain
 * Very light noise for clean modern look
 */
export const Subtle: Story = {
  args: {
    intensity: 0.04,
    animate: true,
    fps: 12,
    grainSize: 0.5,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Heavy grain
 * Strong vintage film effect
 */
export const HeavyGrain: Story = {
  args: {
    intensity: 0.2,
    animate: true,
    fps: 12,
    grainSize: 1.5,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Static grain
 * Non-animated for performance
 */
export const Static: Story = {
  args: {
    intensity: 0.1,
    animate: false,
    fps: 12,
    grainSize: 1,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Fast animation
 * High FPS for smooth grain movement
 */
export const FastAnimation: Story = {
  args: {
    intensity: 0.1,
    animate: true,
    fps: 24,
    grainSize: 1,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Slow animation
 * Low FPS for performance-optimized grain
 */
export const SlowAnimation: Story = {
  args: {
    intensity: 0.1,
    animate: true,
    fps: 6,
    grainSize: 1,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Coarse grain
 * Large grain size for chunky texture
 */
export const CoarseGrain: Story = {
  args: {
    intensity: 0.12,
    animate: true,
    fps: 12,
    grainSize: 3,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Fine grain
 * Sharp, detailed grain
 */
export const FineGrain: Story = {
  args: {
    intensity: 0.1,
    animate: true,
    fps: 12,
    grainSize: 0,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Multiply blend
 * Darkens the image with grain
 */
export const MultiplyBlend: Story = {
  args: {
    intensity: 0.15,
    animate: true,
    fps: 12,
    grainSize: 1,
    blendMode: 'multiply',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Screen blend
 * Lightens the image with grain
 */
export const ScreenBlend: Story = {
  args: {
    intensity: 0.1,
    animate: true,
    fps: 12,
    grainSize: 1,
    blendMode: 'screen',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Soft light blend
 * Gentle contrast increase
 */
export const SoftLightBlend: Story = {
  args: {
    intensity: 0.12,
    animate: true,
    fps: 12,
    grainSize: 1,
    blendMode: 'soft-light',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Hard light blend
 * Strong contrast increase
 */
export const HardLightBlend: Story = {
  args: {
    intensity: 0.15,
    animate: true,
    fps: 12,
    grainSize: 1,
    blendMode: 'hard-light',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * VHS effect
 * Heavy grain with coarse texture for retro VHS look
 */
export const VHSEffect: Story = {
  args: {
    intensity: 0.18,
    animate: true,
    fps: 15,
    grainSize: 2,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Film noir
 * High contrast grain for classic film look
 */
export const FilmNoir: Story = {
  args: {
    intensity: 0.15,
    animate: true,
    fps: 18,
    grainSize: 1.2,
    blendMode: 'hard-light',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Performance mode
 * Optimized settings for low-end devices
 */
export const PerformanceMode: Story = {
  args: {
    intensity: 0.06,
    animate: true,
    fps: 6,
    grainSize: 1.5,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};

/**
 * Quality mode
 * High quality settings for powerful devices
 */
export const QualityMode: Story = {
  args: {
    intensity: 0.1,
    animate: true,
    fps: 30,
    grainSize: 0.8,
    blendMode: 'overlay',
  },
  render: (args) => (
    <DemoWrapper>
      <NoiseOverlay {...args} />
    </DemoWrapper>
  ),
};
