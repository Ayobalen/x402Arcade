/**
 * PowerUpGlow Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { PowerUpGlow } from '@/components/ui/PowerUpGlow';

const meta = {
  title: 'UI/PowerUpGlow',
  component: PowerUpGlow,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Wraps children with a pulsing glow effect when power-up is active. Pulses rhythmically during active period and fades out when power-up ends.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the power-up is active',
    },
    color: {
      control: 'color',
      description: 'Color of the glow',
    },
    duration: {
      control: { type: 'range', min: 1, max: 30, step: 1 },
      description: 'Power-up duration in seconds',
    },
    pulseSpeed: {
      control: { type: 'range', min: 0.3, max: 3, step: 0.1 },
      description: 'Pulse rhythm speed in seconds',
    },
    intensity: {
      control: { type: 'range', min: 0.1, max: 1, step: 0.1 },
      description: 'Glow intensity (0-1)',
    },
    onExpire: {
      action: 'expired',
      description: 'Callback when power-up expires',
    },
  },
} satisfies Meta<typeof PowerUpGlow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isActive: true,
    color: '#00ffff',
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Power-Up Active!
      </div>
    ),
  },
};

export const Inactive: Story = {
  args: {
    isActive: false,
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Normal State
      </div>
    ),
  },
};

export const CyanGlow: Story = {
  args: {
    isActive: true,
    color: '#00ffff',
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Speed Boost
      </div>
    ),
  },
};

export const MagentaGlow: Story = {
  args: {
    isActive: true,
    color: '#ff00ff',
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Double Points
      </div>
    ),
  },
};

export const YellowGlow: Story = {
  args: {
    isActive: true,
    color: '#ffff00',
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Invincibility
      </div>
    ),
  },
};

export const FastPulse: Story = {
  args: {
    isActive: true,
    pulseSpeed: 0.5,
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Fast Pulse
      </div>
    ),
  },
};

export const SlowPulse: Story = {
  args: {
    isActive: true,
    pulseSpeed: 2.0,
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Slow Pulse
      </div>
    ),
  },
};

export const HighIntensity: Story = {
  args: {
    isActive: true,
    intensity: 1.0,
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Maximum Power!
      </div>
    ),
  },
};

export const LowIntensity: Story = {
  args: {
    isActive: true,
    intensity: 0.3,
    children: (
      <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
        Subtle Effect
      </div>
    ),
  },
};

// Interactive toggle
export const Interactive: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false);

    return (
      <div className="p-8">
        <button
          onClick={() => setIsActive(!isActive)}
          className="mb-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
        >
          Toggle Power-Up
        </button>
        <PowerUpGlow isActive={isActive} color="#00ffff">
          <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
            {isActive ? 'Power-Up Active!' : 'Normal State'}
          </div>
        </PowerUpGlow>
      </div>
    );
  },
};

// Timer demo
export const WithTimer: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);

    const activate = () => {
      setIsActive(true);
      setTimeLeft(10);

      const interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    };

    const handleExpire = () => {
      setIsActive(false);
      setTimeLeft(0);
    };

    return (
      <div className="p-8">
        <button
          onClick={activate}
          disabled={isActive}
          className="mb-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activate Power-Up (10s)
        </button>
        <PowerUpGlow
          isActive={isActive}
          duration={10}
          color="#00ffff"
          onExpire={handleExpire}
        >
          <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
            {isActive ? `Active: ${timeLeft}s remaining` : 'Ready to activate'}
          </div>
        </PowerUpGlow>
      </div>
    );
  },
};

// Multiple power-ups
export const MultiplePowerUps: Story = {
  render: () => {
    const [speedBoost, setSpeedBoost] = useState(false);
    const [doublePoints, setDoublePoints] = useState(false);
    const [shield, setShield] = useState(false);

    return (
      <div className="p-8 space-y-4">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setSpeedBoost(!speedBoost)}
            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 font-bold"
          >
            Speed Boost
          </button>
          <button
            onClick={() => setDoublePoints(!doublePoints)}
            className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 font-bold"
          >
            Double Points
          </button>
          <button
            onClick={() => setShield(!shield)}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold"
          >
            Shield
          </button>
        </div>

        <PowerUpGlow isActive={speedBoost} color="#00ffff">
          <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
            🚀 Speed Boost {speedBoost && '(Active)'}
          </div>
        </PowerUpGlow>

        <PowerUpGlow isActive={doublePoints} color="#ff00ff">
          <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
            ⭐ Double Points {doublePoints && '(Active)'}
          </div>
        </PowerUpGlow>

        <PowerUpGlow isActive={shield} color="#ffff00">
          <div className="px-8 py-4 bg-gray-900 rounded-lg text-white font-bold">
            🛡️ Shield {shield && '(Active)'}
          </div>
        </PowerUpGlow>
      </div>
    );
  },
};
