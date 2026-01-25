/**
 * ComboFlash Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ComboFlash } from '@/components/ui/ComboFlash';

const meta = {
  title: 'UI/ComboFlash',
  component: ComboFlash,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Flash effect when combo multiplier increases. Higher combos get more intense glow and shake effects. Uses arcade color coding: white (2x), cyan (3x+), magenta (5x+), gold (10x+).',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    multiplier: {
      control: { type: 'range', min: 2, max: 20, step: 1 },
      description: 'Combo multiplier value',
    },
    show: {
      control: 'boolean',
      description: 'Whether to show the flash',
    },
    duration: {
      control: { type: 'range', min: 0.3, max: 2, step: 0.1 },
      description: 'Duration of animation in seconds',
    },
    position: {
      control: 'object',
      description: 'Position {x, y} or undefined for center',
    },
    onComplete: {
      action: 'complete',
      description: 'Callback when animation completes',
    },
  },
} satisfies Meta<typeof ComboFlash>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    multiplier: 2,
    show: true,
  },
};

export const Combo3x: Story = {
  args: {
    multiplier: 3,
    show: true,
  },
};

export const Combo5x: Story = {
  args: {
    multiplier: 5,
    show: true,
  },
};

export const Combo10x: Story = {
  args: {
    multiplier: 10,
    show: true,
  },
};

export const Combo15x: Story = {
  args: {
    multiplier: 15,
    show: true,
  },
};

export const FastAnimation: Story = {
  args: {
    multiplier: 5,
    show: true,
    duration: 0.4,
  },
};

export const SlowAnimation: Story = {
  args: {
    multiplier: 5,
    show: true,
    duration: 1.5,
  },
};

export const CustomPosition: Story = {
  args: {
    multiplier: 5,
    show: true,
    position: { x: 100, y: 100 },
  },
};

// Interactive demo
export const Interactive: Story = {
  render: () => {
    const [combo, setCombo] = useState(2);
    const [showFlash, setShowFlash] = useState(false);

    const increaseCombo = () => {
      setCombo(c => c + 1);
      setShowFlash(true);
    };

    const resetCombo = () => {
      setCombo(2);
      setShowFlash(false);
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute top-8 left-8 flex gap-4">
          <button
            onClick={increaseCombo}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
          >
            Increase Combo (+1)
          </button>
          <button
            onClick={resetCombo}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold"
          >
            Reset
          </button>
        </div>
        <div className="absolute top-8 right-8 text-white text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
          Current Combo: {combo}x
        </div>
        {showFlash && (
          <ComboFlash
            multiplier={combo}
            show={showFlash}
            onComplete={() => setShowFlash(false)}
          />
        )}
      </div>
    );
  },
};

// Game integration demo
export const GameDemo: Story = {
  render: () => {
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(1);
    const [lastHit, setLastHit] = useState<number>(Date.now());
    const [showFlash, setShowFlash] = useState(false);

    const hit = () => {
      const now = Date.now();
      const timeSinceLastHit = now - lastHit;

      // Combo continues if hit within 2 seconds
      if (timeSinceLastHit < 2000) {
        const newCombo = combo + 1;
        setCombo(newCombo);
        setScore(score + 10 * newCombo);
        setShowFlash(true);
      } else {
        // Combo broken
        setCombo(1);
        setScore(score + 10);
      }

      setLastHit(now);
    };

    const reset = () => {
      setScore(0);
      setCombo(1);
      setLastHit(Date.now());
      setShowFlash(false);
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute top-8 left-0 right-0 text-center">
          <h1 className="text-white text-5xl font-bold mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Score: {score}
          </h1>
          <p className="text-gray-400">Hit the target quickly to build combos!</p>
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={hit}
            className="px-12 py-8 bg-red-600 text-white rounded-full hover:bg-red-700 font-bold text-3xl"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            HIT!
          </button>
        </div>

        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-bold"
          >
            Reset Game
          </button>
        </div>

        {showFlash && combo > 1 && (
          <ComboFlash
            multiplier={combo}
            show={showFlash}
            onComplete={() => setShowFlash(false)}
          />
        )}
      </div>
    );
  },
};
