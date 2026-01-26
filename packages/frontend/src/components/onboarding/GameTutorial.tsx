/**
 * GameTutorial Component
 *
 * Interactive game-specific tutorials that explain controls and gameplay.
 * Shows before first play of each game type.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore, type GameTutorialStep } from '@/stores';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Space, Gamepad2, X } from 'lucide-react';

// Tutorial content for each game
const GAME_TUTORIALS: Record<string, GameTutorialStep[]> = {
  snake: [
    {
      id: 'snake-1',
      title: 'Welcome to Snake!',
      description:
        'Guide your snake to eat food and grow longer. Avoid hitting walls and yourself!',
    },
    {
      id: 'snake-2',
      title: 'Controls',
      description: 'Use arrow keys or WASD to change direction.',
      keys: ['↑', '←', '↓', '→', 'W', 'A', 'S', 'D'],
    },
    {
      id: 'snake-3',
      title: 'Scoring',
      description:
        'Each food item is worth 10 points. The longer you survive and grow, the higher your score!',
    },
    {
      id: 'snake-4',
      title: 'Tips',
      description:
        "Plan ahead! As your snake grows, you'll need more space to maneuver. Try to stay in the center of the board.",
    },
  ],
  tetris: [
    {
      id: 'tetris-1',
      title: 'Welcome to Tetris!',
      description:
        'Stack falling blocks to create complete horizontal lines. Clear lines to score points!',
    },
    {
      id: 'tetris-2',
      title: 'Controls',
      description: 'Left/Right to move, Up to rotate, Down to drop faster, Space to instant drop.',
      keys: ['←', '→', '↑', '↓', 'SPACE'],
    },
    {
      id: 'tetris-3',
      title: 'Scoring',
      description: 'Single line: 100pts\nDouble: 300pts\nTriple: 500pts\nTetris (4 lines): 800pts!',
    },
    {
      id: 'tetris-4',
      title: 'Tips',
      description:
        'Leave a column open for vertical I-pieces to score Tetris bonuses. Stack flat when possible!',
    },
  ],
  pong: [
    {
      id: 'pong-1',
      title: 'Welcome to Pong!',
      description: 'Classic paddle tennis. Hit the ball past your opponent to score!',
    },
    {
      id: 'pong-2',
      title: 'Controls',
      description: 'Up and Down arrows to move your paddle.',
      keys: ['↑', '↓'],
    },
    {
      id: 'pong-3',
      title: 'Scoring',
      description: 'First to 11 points wins! Each goal is worth 1 point.',
    },
    {
      id: 'pong-4',
      title: 'Tips',
      description:
        'Hit the ball with the edge of your paddle to change its angle. Predict where the ball will go!',
    },
  ],
  breakout: [
    {
      id: 'breakout-1',
      title: 'Welcome to Breakout!',
      description: "Break all the bricks with your ball. Don't let the ball fall!",
    },
    {
      id: 'breakout-2',
      title: 'Controls',
      description: 'Left and Right arrows to move your paddle.',
      keys: ['←', '→'],
    },
    {
      id: 'breakout-3',
      title: 'Scoring',
      description:
        'Each brick is worth 10 points. Different colored bricks may have special effects!',
    },
    {
      id: 'breakout-4',
      title: 'Tips',
      description:
        'Aim for the sides to create chain reactions. Hit the ball with different parts of the paddle to control its angle!',
    },
  ],
  'space-invaders': [
    {
      id: 'space-invaders-1',
      title: 'Welcome to Space Invaders!',
      description: 'Defend Earth from alien invaders! Shoot them all!',
    },
    {
      id: 'space-invaders-2',
      title: 'Controls',
      description: 'Left/Right to move, Space to shoot.',
      keys: ['←', '→', 'SPACE'],
    },
    {
      id: 'space-invaders-3',
      title: 'Scoring',
      description:
        'Different aliens are worth different points. Destroy the mystery ship for bonus points!',
    },
    {
      id: 'space-invaders-4',
      title: 'Tips',
      description:
        'Use barriers for cover! Shoot the invaders in the bottom rows first to prevent them reaching you.',
    },
  ],
};

const KEY_ICONS: Record<string, React.ReactNode> = {
  '↑': <ArrowUp size={20} />,
  '←': <ArrowLeft size={20} />,
  '↓': <ArrowDown size={20} />,
  '→': <ArrowRight size={20} />,
  SPACE: <Space size={20} />,
  W: 'W',
  A: 'A',
  S: 'S',
  D: 'D',
};

export function GameTutorial() {
  const {
    showTutorial,
    activeTutorial,
    tutorialStep,
    nextTutorialStep,
    previousTutorialStep,
    skipTutorial,
  } = useOnboardingStore();

  if (!activeTutorial || !showTutorial) {
    return null;
  }

  const steps = GAME_TUTORIALS[activeTutorial] || [];
  const currentStepData = steps[tutorialStep];
  const isLastStep = tutorialStep === steps.length - 1;
  const isFirstStep = tutorialStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      skipTutorial();
    } else {
      nextTutorialStep();
    }
  };

  return (
    <Modal isOpen={showTutorial} onClose={skipTutorial} size="md" closeOnBackdrop={false}>
      <div className="relative">
        {/* Skip button */}
        <button
          onClick={skipTutorial}
          className="absolute top-0 right-0 text-slate-400 hover:text-white transition-colors"
          aria-label="Skip tutorial"
        >
          <X size={20} />
        </button>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index === tutorialStep
                    ? 'bg-cyan-400'
                    : index < tutorialStep
                      ? 'bg-cyan-500/50'
                      : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tutorialStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Gamepad2 size={32} className="text-cyan-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300 mb-6 text-center leading-relaxed whitespace-pre-line">
              {currentStepData.description}
            </p>

            {/* Keys */}
            {currentStepData.keys && currentStepData.keys.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-6">
                {currentStepData.keys.map((key) => (
                  <div
                    key={key}
                    className="px-4 py-3 bg-[#16162a] border border-cyan-500/30 rounded-lg font-mono text-cyan-400 flex items-center justify-center min-w-[60px] shadow-lg shadow-cyan-500/10"
                  >
                    {KEY_ICONS[key] || key}
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="ghost"
                onClick={previousTutorialStep}
                disabled={isFirstStep}
                className="min-w-[100px]"
              >
                <ArrowLeft size={18} className="mr-2" />
                Back
              </Button>

              <span className="text-sm text-slate-400">
                {tutorialStep + 1} / {steps.length}
              </span>

              <Button variant="primary" onClick={handleNext} className="min-w-[100px]">
                {isLastStep ? (
                  <>
                    Let's Play!
                    <Gamepad2 size={18} className="ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight size={18} className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </Modal>
  );
}
