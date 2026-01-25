/**
 * Storybook stories for SnakeGame component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SnakeGame } from '../packages/frontend/src/games/snake/SnakeGame';

const meta = {
  title: 'Games/SnakeGame',
  component: SnakeGame,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SnakeGame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Easy: Story = {
  args: {
    difficulty: 'easy',
  },
};

export const Normal: Story = {
  args: {
    difficulty: 'normal',
  },
};

export const Hard: Story = {
  args: {
    difficulty: 'hard',
  },
};

export const WithGameOverCallback: Story = {
  args: {
    difficulty: 'normal',
    onGameOver: (score: number) => {
      console.log('Game Over! Final score:', score);
      alert(`Game Over! Final score: ${score}`);
    },
  },
};
