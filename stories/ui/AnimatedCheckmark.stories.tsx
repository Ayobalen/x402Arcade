/**
 * AnimatedCheckmark Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedCheckmark } from '@/components/ui/AnimatedCheckmark';

const meta = {
  title: 'UI/AnimatedCheckmark',
  component: AnimatedCheckmark,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'An animated success checkmark icon with path drawing animation. Features a circle background that scales in first, followed by the checkmark path drawing from 0 to 1. Uses neon green color from the design system.',
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
      description: 'Color of the checkmark',
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
    onAnimationComplete: {
      action: 'animation-complete',
      description: 'Callback when animation completes',
    },
  },
} satisfies Meta<typeof AnimatedCheckmark>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default checkmark with neon green color
 */
export const Default: Story = {
  args: {
    size: 48,
    autoPlay: true,
  },
};

/**
 * Large checkmark
 */
export const Large: Story = {
  args: {
    size: 96,
    autoPlay: true,
  },
};

/**
 * Small checkmark
 */
export const Small: Story = {
  args: {
    size: 32,
    autoPlay: true,
  },
};

/**
 * Custom color (cyan)
 */
export const CustomColor: Story = {
  args: {
    size: 64,
    color: '#00ffff',
    autoPlay: true,
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
  },
};

/**
 * Fast animation
 */
export const FastAnimation: Story = {
  args: {
    size: 64,
    duration: 0.3,
    autoPlay: true,
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
  },
};

/**
 * Success confirmation UI
 */
export const SuccessConfirmation: Story = {
  args: {
    size: 80,
    autoPlay: true,
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4 p-8 bg-bg-primary rounded-xl">
      <AnimatedCheckmark {...args} />
      <div className="text-center">
        <h3 className="text-xl font-display text-success">Success!</h3>
        <p className="text-text-secondary">Your transaction has been confirmed</p>
      </div>
    </div>
  ),
};

/**
 * Form submission success
 */
export const FormSuccess: Story = {
  args: {
    size: 48,
    autoPlay: true,
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4 bg-surface-primary border border-success/30 rounded-lg">
      <AnimatedCheckmark {...args} />
      <span className="text-success">Form submitted successfully!</span>
    </div>
  ),
};
