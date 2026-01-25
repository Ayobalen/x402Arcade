/**
 * AnimatedList Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { AnimatedList } from '../../components/ui/AnimatedList';

const meta = {
  title: 'UI/AnimatedList',
  component: AnimatedList,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A wrapper component that applies stagger animations to list items. Uses framer-motion for smooth, sequential entrance animations.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AnimatedList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample data for stories
const sampleItems = [
  'Snake - Classic arcade action',
  'Tetris - Block puzzle challenge',
  'Pong - Retro paddle game',
  'Breakout - Brick breaker',
  'Space Invaders - Alien shooter',
];

/**
 * Default AnimatedList with normal preset
 */
export const Default: Story = {
  render: () => (
    <AnimatedList className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]">
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * Quick stagger animation (faster)
 */
export const QuickStagger: Story = {
  render: () => (
    <AnimatedList
      preset="quick"
      className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]"
    >
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          preset="quick"
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * Slow stagger animation (dramatic)
 */
export const SlowStagger: Story = {
  render: () => (
    <AnimatedList
      preset="slow"
      className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]"
    >
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          preset="slow"
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * Scale preset (zoom in effect)
 */
export const ScalePreset: Story = {
  render: () => (
    <AnimatedList
      preset="scale"
      className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]"
    >
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          preset="scale"
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * Fade only (no movement)
 */
export const FadeOnly: Story = {
  render: () => (
    <AnimatedList
      preset="fade"
      className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]"
    >
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          preset="fade"
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * As div elements instead of list
 */
export const AsDivElements: Story = {
  render: () => (
    <AnimatedList
      as="div"
      className="space-y-3 p-4 bg-[var(--color-bg-secondary)] rounded-lg min-w-[400px]"
    >
      {sampleItems.map((item, index) => (
        <AnimatedList.Item
          key={index}
          as="div"
          className="p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
        >
          {item}
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};

/**
 * Game leaderboard example
 */
export const GameLeaderboard: Story = {
  render: () => (
    <AnimatedList
      preset="normal"
      className="space-y-2 p-6 bg-[var(--color-bg-secondary)] rounded-xl border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(0,255,255,0.3)] min-w-[500px]"
    >
      <h3 className="text-xl font-display text-[var(--color-primary)] mb-4 text-center">
        🏆 Top Players
      </h3>
      {['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'].map((player, index) => (
        <AnimatedList.Item
          key={index}
          className="flex items-center justify-between p-4 bg-[var(--color-surface-primary)] rounded-lg border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl font-display text-[var(--color-primary)]">#{index + 1}</span>
            <span className="text-[var(--color-text-primary)]">{player}</span>
          </div>
          <span className="font-mono text-[var(--color-secondary)]">
            {(10000 - index * 1500).toLocaleString()} pts
          </span>
        </AnimatedList.Item>
      ))}
    </AnimatedList>
  ),
};
