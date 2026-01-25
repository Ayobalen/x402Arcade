/**
 * AnimatedCounter Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Button } from '@/components/ui/Button';

const meta = {
  title: 'UI/AnimatedCounter',
  component: AnimatedCounter,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Smoothly animates numbers from one value to another using spring physics. Features multiple number formats (currency, percentage, compact, decimal) and customizable spring parameters for natural motion.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: 'The target value to animate to',
    },
    from: {
      control: 'number',
      description: 'The starting value (if different from 0)',
    },
    format: {
      control: 'select',
      options: ['none', 'currency', 'percentage', 'compact', 'decimal'],
      description: 'Number formatting type',
    },
    decimals: {
      control: 'number',
      description: 'Number of decimal places (for decimal/currency format)',
    },
    currencySymbol: {
      control: 'text',
      description: 'Currency symbol (for currency format)',
    },
    duration: {
      control: { type: 'range', min: 0.1, max: 5, step: 0.1 },
      description: 'Duration of the animation in seconds',
    },
    stiffness: {
      control: { type: 'range', min: 50, max: 300, step: 10 },
      description: 'Spring stiffness (higher = faster/snappier)',
    },
    damping: {
      control: { type: 'range', min: 5, max: 50, step: 1 },
      description: 'Spring damping (higher = less bouncy)',
    },
    as: {
      control: 'select',
      options: ['span', 'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'HTML tag to render as',
    },
    onAnimationComplete: {
      action: 'animation-complete',
      description: 'Callback when animation completes',
    },
  },
} satisfies Meta<typeof AnimatedCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default counter with no formatting
 */
export const Default: Story = {
  args: {
    value: 1337,
    from: 0,
  },
};

/**
 * Currency formatting with $ symbol
 */
export const Currency: Story = {
  args: {
    value: 99.99,
    from: 0,
    format: 'currency',
    decimals: 2,
    currencySymbol: '$',
  },
};

/**
 * Euro currency
 */
export const EuroCurrency: Story = {
  args: {
    value: 249.99,
    from: 0,
    format: 'currency',
    decimals: 2,
    currencySymbol: '€',
  },
};

/**
 * Percentage formatting
 */
export const Percentage: Story = {
  args: {
    value: 85.5,
    from: 0,
    format: 'percentage',
    decimals: 1,
  },
};

/**
 * Decimal formatting
 */
export const Decimal: Story = {
  args: {
    value: 123.456,
    from: 0,
    format: 'decimal',
    decimals: 2,
  },
};

/**
 * Compact notation for large numbers
 */
export const Compact: Story = {
  args: {
    value: 1500000,
    from: 0,
    format: 'compact',
  },
};

/**
 * Slow animation (2 seconds)
 */
export const SlowAnimation: Story = {
  args: {
    value: 1000,
    from: 0,
    duration: 2.0,
  },
};

/**
 * Fast animation (0.5 seconds)
 */
export const FastAnimation: Story = {
  args: {
    value: 1000,
    from: 0,
    duration: 0.5,
  },
};

/**
 * Bouncy spring (low damping)
 */
export const BouncySpring: Story = {
  args: {
    value: 1000,
    from: 0,
    stiffness: 200,
    damping: 10,
  },
};

/**
 * Smooth spring (high damping)
 */
export const SmoothSpring: Story = {
  args: {
    value: 1000,
    from: 0,
    stiffness: 100,
    damping: 30,
  },
};

/**
 * As heading element
 */
export const AsHeading: Story = {
  args: {
    value: 1337,
    from: 0,
    as: 'h2',
    className: 'text-4xl font-display text-primary',
  },
};

/**
 * Interactive counter demo
 */
export const Interactive: Story = {
  render: () => {
    const [count, setCount] = useState(0);

    return (
      <div className="flex flex-col items-center gap-6 p-8 bg-bg-primary rounded-xl">
        <div className="text-6xl font-display text-primary">
          <AnimatedCounter value={count} from={count} />
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCount((c) => c + 10)} variant="primary" size="sm">
            +10
          </Button>
          <Button onClick={() => setCount((c) => c + 100)} variant="secondary" size="sm">
            +100
          </Button>
          <Button onClick={() => setCount((c) => Math.max(0, c - 50))} variant="outline" size="sm">
            -50
          </Button>
          <Button onClick={() => setCount(0)} variant="ghost" size="sm">
            Reset
          </Button>
        </div>
      </div>
    );
  },
};

/**
 * Score display
 */
export const ScoreDisplay: Story = {
  args: {
    value: 12500,
    from: 0,
    className: 'text-5xl font-display text-cyan',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4 p-8 bg-bg-primary rounded-xl border border-border">
      <div className="text-text-muted text-sm uppercase tracking-wider">High Score</div>
      <AnimatedCounter {...args} />
      <div className="text-text-secondary text-sm">Player #1337</div>
    </div>
  ),
};

/**
 * Prize pool display
 */
export const PrizePool: Story = {
  args: {
    value: 2499.99,
    from: 0,
    format: 'currency',
    decimals: 2,
    className: 'text-4xl font-display text-success',
  },
  render: (args) => (
    <div className="flex flex-col items-center gap-4 p-8 bg-bg-primary rounded-xl border border-success/20">
      <div className="text-success text-sm uppercase tracking-wider">Today's Prize Pool</div>
      <AnimatedCounter {...args} />
      <div className="text-text-secondary text-xs">70% of all game fees</div>
    </div>
  ),
};
