/**
 * LevelUpCelebration Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { LevelUpCelebration } from '@/components/ui/LevelUpCelebration';

const meta = {
  title: 'UI/LevelUpCelebration',
  component: LevelUpCelebration,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Full-screen celebration effect when player levels up. Includes confetti particles, screen flash, and animated "LEVEL UP!" text with arcade styling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'number',
      description: 'The new level number',
    },
    duration: {
      control: { type: 'range', min: 1, max: 5, step: 0.5 },
      description: 'Duration of celebration in seconds',
    },
    showFlash: {
      control: 'boolean',
      description: 'Whether to show screen flash effect',
    },
    particleCount: {
      control: { type: 'range', min: 20, max: 100, step: 10 },
      description: 'Number of confetti particles',
    },
    onSoundTrigger: {
      action: 'sound-trigger',
      description: 'Callback to play sound effect',
    },
    onComplete: {
      action: 'complete',
      description: 'Callback when celebration completes',
    },
  },
} satisfies Meta<typeof LevelUpCelebration>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    level: 2,
    duration: 2.5,
  },
};

export const Level5: Story = {
  args: {
    level: 5,
  },
};

export const Level10: Story = {
  args: {
    level: 10,
  },
};

export const ShortDuration: Story = {
  args: {
    level: 3,
    duration: 1.5,
  },
};

export const LongDuration: Story = {
  args: {
    level: 3,
    duration: 4,
  },
};

export const NoFlash: Story = {
  args: {
    level: 2,
    showFlash: false,
  },
};

export const FewParticles: Story = {
  args: {
    level: 2,
    particleCount: 20,
  },
};

export const ManyParticles: Story = {
  args: {
    level: 2,
    particleCount: 80,
  },
};

// Interactive demo with button to trigger
export const Interactive: Story = {
  render: () => {
    const [showCelebration, setShowCelebration] = useState(false);
    const [level, setLevel] = useState(1);

    const levelUp = () => {
      setLevel(level + 1);
      setShowCelebration(true);
    };

    const handleComplete = () => {
      setShowCelebration(false);
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <h2 className="text-white text-4xl font-bold mb-8" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            Current Level: {level}
          </h2>
          <button
            onClick={levelUp}
            className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold text-xl"
          >
            Level Up!
          </button>
        </div>
        {showCelebration && (
          <LevelUpCelebration
            level={level}
            onComplete={handleComplete}
          />
        )}
      </div>
    );
  },
};

// Game progression example
export const GameProgression: Story = {
  render: () => {
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [showCelebration, setShowCelebration] = useState(false);
    const xpToNextLevel = level * 100;
    const progress = (xp / xpToNextLevel) * 100;

    const earnXP = (amount: number) => {
      const newXP = xp + amount;
      setXp(newXP);

      if (newXP >= xpToNextLevel) {
        setLevel(level + 1);
        setXp(newXP - xpToNextLevel);
        setShowCelebration(true);
      }
    };

    const handleComplete = () => {
      setShowCelebration(false);
    };

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-white text-center mb-8">
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Level {level}
              </h2>
              <p className="text-gray-400">
                {xp} / {xpToNextLevel} XP
              </p>
            </div>

            {/* XP Bar */}
            <div className="w-full h-8 bg-gray-800 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => earnXP(25)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
              >
                +25 XP
              </button>
              <button
                onClick={() => earnXP(50)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold"
              >
                +50 XP
              </button>
              <button
                onClick={() => earnXP(100)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold"
              >
                +100 XP
              </button>
            </div>
          </div>
        </div>
        {showCelebration && (
          <LevelUpCelebration
            level={level}
            onSoundTrigger={() => console.log('🎵 Level up sound!')}
            onComplete={handleComplete}
          />
        )}
      </div>
    );
  },
};

// Achievement unlocked variant
export const AchievementUnlocked: Story = {
  render: () => {
    const [showCelebration, setShowCelebration] = useState(false);

    return (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a', position: 'relative' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={() => setShowCelebration(true)}
            className="px-8 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold text-xl"
          >
            Unlock Achievement
          </button>
        </div>
        {showCelebration && (
          <LevelUpCelebration
            level={99}
            particleCount={100}
            duration={3}
            onComplete={() => setShowCelebration(false)}
          />
        )}
      </div>
    );
  },
};
