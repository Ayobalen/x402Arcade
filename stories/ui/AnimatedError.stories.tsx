/**
 * AnimatedError Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedError } from '@/components/ui/AnimatedError';

const meta = {
  title: 'UI/AnimatedError',
  component: AnimatedError,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An animated error cross icon with path drawing animation. Features a red circle background that scales in first, followed by both cross lines drawing simultaneously. Includes an optional shake effect after drawing. Uses neon red color from the design system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'number',
      description: 'Size of the icon in pixels',
    },
    color: {
      control: 'color',
      description: 'Color of the error cross',
    },
    duration: {
      control: { type: 'range', min: 0.1, max: 3, step: 0.1 },
      description: 'Duration of the animation in seconds',
    },
    loop: {
      control: 'boolean',
      description: 'Whether to loop the animation',
    },
    autoPlay: {
      control: 'boolean',
      description: 'Whether to auto-play the animation on mount',
    },
    includeShake: {
      control: 'boolean',
      description: 'Whether to include shake effect after drawing',
    },
    onAnimationComplete: {
      action: 'animation-complete',
      description: 'Callback when animation completes',
    },
  },
} satisfies Meta<typeof AnimatedError>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default error cross with neon red color
 */
export const Default: Story = {
  args: {
    size: 48,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Large error cross
 */
export const Large: Story = {
  args: {
    size: 96,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Small error cross
 */
export const Small: Story = {
  args: {
    size: 32,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Without shake effect
 */
export const NoShake: Story = {
  args: {
    size: 64,
    autoPlay: true,
    includeShake: false,
  },
};

/**
 * Custom color (magenta)
 */
export const CustomColor: Story = {
  args: {
    size: 64,
    color: '#ff00ff',
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Slow animation
 */
export const SlowAnimation: Story = {
  args: {
    size: 64,
    duration: 2.0,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Fast animation
 */
export const FastAnimation: Story = {
  args: {
    size: 64,
    duration: 0.4,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Looping animation
 */
export const Looping: Story = {
  args: {
    size: 64,
    loop: true,
    autoPlay: true,
    includeShake: true,
  },
};

/**
 * Error alert UI
 */
export const ErrorAlert: Story = {
  args: {
    size: 80,
    autoPlay: true,
    includeShake: true,
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4 p-8 bg-bg-primary rounded-xl">
      <AnimatedError {...args} />
      <div className="text-center">
        <h3 className="text-xl font-display text-error">Error!</h3>
        <p className="text-text-secondary">Transaction failed. Please try again.</p>
      </div>
    </div>
  ),
};

/**
 * Form validation error
 */
export const ValidationError: Story = {
  args: {
    size: 48,
    autoPlay: true,
    includeShake: true,
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4 bg-surface-primary border border-error/30 rounded-lg">
      <AnimatedError {...args} />
      <span className="text-error">Invalid input. Please check your data.</span>
    </div>
  ),
};
