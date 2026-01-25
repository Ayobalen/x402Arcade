/**
 * ScorePopup Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ScorePopup } from '@/components/ui/ScorePopup';

const meta = {
  title: 'UI/ScorePopup',
  component: ScorePopup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating score animation that appears when points are earned. Animates upward with bounce and fade. Supports combo mode with extra flair.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    score: {
      control: 'number',
      description: 'Score value to display',
    },
    x: {
      control: 'number',
      description: 'X position in pixels',
    },
    y: {
      control: 'number',
      description: 'Y position in pixels',
    },
    color: {
      control: 'color',
      description: 'Color of the score text',
    },
    duration: {
      control: { type: 'range', min: 0.5, max: 3, step: 0.1 },
      description: 'Duration of animation in seconds',
    },
    distance: {
      control: { type: 'range', min: 40, max: 150, step: 10 },
      description: 'Distance to travel upward in pixels',
    },
    isCombo: {
      control: 'boolean',
      description: 'Whether this is a combo score',
    },
    onComplete: {
      action: 'complete',
      description: 'Callback when animation completes',
    },
  },
} satisfies Meta<typeof ScorePopup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    score: 100,
    x: 200,
    y: 200,
    color: '#00ff00',
    duration: 1.5,
  },
};

export const SmallScore: Story = {
  args: {
    score: 10,
    x: 200,
    y: 200,
    color: '#00ff00',
  },
};

export const LargeScore: Story = {
  args: {
    score: 5000,
    x: 200,
    y: 200,
    color: '#ffff00',
  },
};

export const ComboScore: Story = {
  args: {
    score: 500,
    x: 200,
    y: 200,
    color: '#ff00ff',
    isCombo: true,
  },
};

export const CyanScore: Story = {
  args: {
    score: 250,
    x: 200,
    y: 200,
    color: '#00ffff',
  },
};

export const FastAnimation: Story = {
  args: {
    score: 100,
    x: 200,
    y: 200,
    duration: 0.8,
  },
};

export const SlowAnimation: Story = {
  args: {
    score: 100,
    x: 200,
    y: 200,
    duration: 2.5,
  },
};

export const LongDistance: Story = {
  args: {
    score: 1000,
    x: 200,
    y: 200,
    distance: 120,
  },
};

// Interactive demo with button to trigger
export const Interactive: Story = {
  render: () => {
    const [popups, setPopups] = useState<Array<{ id: number; score: number; x: number; y: number }>>([]);
    const [nextId, setNextId] = useState(0);

    const addPopup = () => {
      const x = 200 + (Math.random() - 0.5) * 100;
      const y = 200 + (Math.random() - 0.5) * 50;
      const score = Math.floor(Math.random() * 500) + 50;

      setPopups([...popups, { id: nextId, score, x, y }]);
      setNextId(nextId + 1);
    };

    const handleComplete = (id: number) => {
      setPopups(popups.filter(p => p.id !== id));
    };

    return (
      <div className="relative" style={{ width: 400, height: 400, background: '#0a0a0a', borderRadius: 8 }}>
        <button
          onClick={addPopup}
          className="absolute top-4 left-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Earn Points!
        </button>
        {popups.map((popup) => (
          <ScorePopup
            key={popup.id}
            score={popup.score}
            x={popup.x}
            y={popup.y}
            color="#00ff00"
            onComplete={() => handleComplete(popup.id)}
          />
        ))}
      </div>
    );
  },
};

// Game UI example
export const GameScoreDisplay: Story = {
  render: () => {
    const [score, setScore] = useState(0);
    const [popups, setPopups] = useState<Array<{ id: number; score: number; x: number; y: number; isCombo: boolean }>>([]);
    const [nextId, setNextId] = useState(0);

    const earnPoints = (points: number, isCombo: boolean = false) => {
      setScore(score + points);
      setPopups([...popups, { id: nextId, score: points, x: 200, y: 250, isCombo }]);
      setNextId(nextId + 1);
    };

    const handleComplete = (id: number) => {
      setPopups(popups.filter(p => p.id !== id));
    };

    return (
      <div className="relative" style={{ width: 500, height: 400, background: '#0a0a0a', borderRadius: 8, padding: 20 }}>
        <div className="text-white text-center mb-4">
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Score: {score}</h3>
        </div>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => earnPoints(10)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            +10 Points
          </button>
          <button
            onClick={() => earnPoints(50)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            +50 Points
          </button>
          <button
            onClick={() => earnPoints(500, true)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            +500 COMBO!
          </button>
        </div>
        {popups.map((popup) => (
          <ScorePopup
            key={popup.id}
            score={popup.score}
            x={popup.x}
            y={popup.y}
            color={popup.isCombo ? '#ff00ff' : '#00ff00'}
            isCombo={popup.isCombo}
            onComplete={() => handleComplete(popup.id)}
          />
        ))}
      </div>
    );
  },
};
