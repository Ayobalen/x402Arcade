/**
 * Skeleton Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '../../components/ui/Skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A loading placeholder with shimmer animation effect. Uses gradient background with infinite animation for loading visual feedback. Retro arcade theme with cyan/magenta shimmer.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['rectangular', 'circular', 'text'],
      description: 'Shape variant of the skeleton',
    },
    speed: {
      control: 'select',
      options: ['slow', 'normal', 'fast'],
      description: 'Animation speed',
    },
    animate: {
      control: 'boolean',
      description: 'Whether to show shimmer animation',
    },
    width: {
      control: 'text',
      description: 'Width of skeleton (CSS value)',
    },
    height: {
      control: 'text',
      description: 'Height of skeleton (CSS value)',
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default rectangular skeleton
 */
export const Default: Story = {
  args: {
    className: 'h-20 w-64',
  },
};

/**
 * Circular skeleton (for avatars)
 */
export const Circular: Story = {
  args: {
    variant: 'circular',
    className: 'h-16 w-16',
  },
};

/**
 * Text skeleton (for text lines)
 */
export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-64',
  },
};

/**
 * Different speeds
 */
export const Speeds: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-[var(--color-bg-secondary)] rounded-lg">
      <div>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">Slow</p>
        <Skeleton speed="slow" className="h-12 w-64" />
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">Normal</p>
        <Skeleton speed="normal" className="h-12 w-64" />
      </div>
      <div>
        <p className="text-sm text-[var(--color-text-muted)] mb-2">Fast</p>
        <Skeleton speed="fast" className="h-12 w-64" />
      </div>
    </div>
  ),
};

/**
 * Without animation
 */
export const NoAnimation: Story = {
  args: {
    animate: false,
    className: 'h-20 w-64',
  },
};

/**
 * Card loading example
 */
export const CardLoading: Story = {
  render: () => (
    <div className="w-80 p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <Skeleton className="h-40 w-full mb-4" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
    </div>
  ),
};

/**
 * User profile loading
 */
export const ProfileLoading: Story = {
  render: () => (
    <div className="w-96 p-6 bg-[var(--color-bg-secondary)] rounded-xl border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
      <div className="flex flex-col items-center mb-6">
        <Skeleton variant="circular" className="h-24 w-24 mb-4" />
        <Skeleton variant="text" className="w-48 mb-2" />
        <Skeleton variant="text" className="w-32" />
      </div>
      <div className="space-y-4">
        <div>
          <Skeleton variant="text" className="w-20 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton variant="text" className="w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div>
          <Skeleton variant="text" className="w-16 mb-2" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </div>
  ),
};

/**
 * Leaderboard loading
 */
export const LeaderboardLoading: Story = {
  render: () => (
    <div className="w-96 p-6 bg-[var(--color-bg-secondary)] rounded-xl border-2 border-[var(--color-primary)] shadow-[0_0_20px_rgba(0,255,255,0.3)]">
      <Skeleton variant="text" className="w-40 h-6 mb-6 mx-auto" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-[var(--color-surface-primary)] rounded-lg">
            <Skeleton variant="text" className="w-8 h-8" />
            <Skeleton variant="text" className="flex-1" />
            <Skeleton variant="text" className="w-20" />
          </div>
        ))}
      </div>
    </div>
  ),
};

/**
 * List of items loading
 */
export const ListLoading: Story = {
  render: () => (
    <div className="w-96 p-6 bg-[var(--color-bg-secondary)] rounded-xl">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-20 w-20 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-3/4" />
              <Skeleton variant="text" className="w-full" />
              <Skeleton variant="text" className="w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};
