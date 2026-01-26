/**
 * OnboardingFlow Component
 *
 * First-run onboarding flow that guides new users through the platform.
 * Shows a multi-step wizard with welcome, wallet connection, game selection,
 * payment flow explanation, gameplay tips, and leaderboard overview.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboardingStore, type OnboardingStep } from '@/stores';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Rocket, Wallet, Gamepad2, CreditCard, Trophy, Check, ArrowRight, X } from 'lucide-react';

const ONBOARDING_CONTENT = {
  welcome: {
    icon: Rocket,
    title: 'Welcome to x402 Arcade!',
    description:
      'Experience the future of arcade gaming with gasless micropayments on Cronos blockchain.',
    features: [
      'Pay just $0.01-$0.02 per game',
      'Zero gas fees with x402 protocol',
      'Compete for daily prize pools',
      'Instant game start after payment',
    ],
    action: 'Get Started',
  },
  'connect-wallet': {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: "You'll need a Web3 wallet like MetaMask to play. Don't worry, it's easy!",
    features: [
      'Install MetaMask browser extension',
      'Create a new wallet or import existing',
      'Switch to Cronos Testnet',
      'Get test USDC from faucet',
    ],
    action: 'Continue',
  },
  'select-game': {
    icon: Gamepad2,
    title: 'Choose Your Game',
    description: 'Browse our collection of classic arcade games. Each game costs pennies to play!',
    features: [
      'Snake - Classic retro action',
      'Tetris - Puzzle perfection',
      'Pong - Arcade legend',
      'Breakout - Brick-breaking fun',
      'Space Invaders - Defend Earth',
    ],
    action: 'Next',
  },
  'payment-flow': {
    icon: CreditCard,
    title: 'How Payment Works',
    description: "Our gasless payment system makes playing effortless. Here's how it works:",
    features: [
      'Click "Pay & Play" button',
      'Sign payment authorization in wallet',
      'No gas fees - facilitator covers it',
      'Game starts instantly after payment',
    ],
    action: 'Next',
  },
  gameplay: {
    icon: Gamepad2,
    title: 'Time to Play!',
    description: 'Each game has keyboard controls and displays your score in real-time.',
    features: [
      'Arrow keys or WASD to move',
      'Spacebar for special actions',
      'Pause with P or Escape',
      'Score submits automatically at game over',
    ],
    action: 'Next',
  },
  leaderboard: {
    icon: Trophy,
    title: 'Compete for Glory',
    description: 'Your scores appear on the leaderboard. Top player wins the daily prize pool!',
    features: [
      'Daily, weekly, and all-time rankings',
      'Filter by game type',
      'See your rank in real-time',
      '70% of payments fund prize pools',
    ],
    action: 'Start Playing',
  },
  complete: {
    icon: Check,
    title: 'Ready to Play!',
    description: "You're all set to start your arcade adventure.",
    features: [],
    action: 'Start Playing',
  },
};

export function OnboardingFlow() {
  const navigate = useNavigate();
  const {
    showOnboarding,
    currentStep,
    completedSteps,
    completeStep,
    skipOnboarding,
    setShowOnboarding,
  } = useOnboardingStore();

  const content = ONBOARDING_CONTENT[currentStep];
  const Icon = content.icon;
  const stepIndex = Object.keys(ONBOARDING_CONTENT).indexOf(currentStep);
  const totalSteps = Object.keys(ONBOARDING_CONTENT).length - 1; // Exclude 'complete'
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  useEffect(() => {
    // Auto-show onboarding for first-time users
    const hasSeenOnboarding = localStorage.getItem('x402-onboarding-storage');
    if (!hasSeenOnboarding) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [setShowOnboarding]);

  const handleNext = () => {
    if (currentStep === 'leaderboard') {
      // Final step - redirect to play page
      completeStep(currentStep);
      navigate('/play');
    } else {
      completeStep(currentStep);
    }
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  const handleClose = () => {
    setShowOnboarding(false);
  };

  return (
    <Modal
      isOpen={showOnboarding}
      onClose={handleClose}
      closeOnBackdrop={false}
      size="lg"
      className="onboarding-modal"
    >
      <div className="relative">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <X size={20} />
        </button>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-1 bg-[#2d2d4a] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-magenta-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-magenta-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Icon size={40} className="text-cyan-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
              {content.title}
            </h2>

            {/* Description */}
            <p className="text-slate-300 mb-8 text-lg leading-relaxed">{content.description}</p>

            {/* Features */}
            {content.features.length > 0 && (
              <ul className="space-y-3 mb-10 text-left max-w-md mx-auto">
                {content.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1 shrink-0">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center">
                        <Check size={12} className="text-cyan-400" />
                      </div>
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </motion.li>
                ))}
              </ul>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              {stepIndex > 0 && (
                <Button variant="outline" size="lg" onClick={handleSkip} className="min-w-[120px]">
                  Skip Tour
                </Button>
              )}
              <Button variant="primary" size="lg" onClick={handleNext} className="min-w-[160px]">
                {content.action}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Completed steps indicator */}
        <div className="mt-8 flex justify-center gap-2">
          {Object.keys(ONBOARDING_CONTENT)
            .slice(0, -1)
            .map((step, index) => (
              <div
                key={step}
                className={`h-2 w-2 rounded-full transition-all ${
                  completedSteps.includes(step as OnboardingStep)
                    ? 'bg-cyan-400 w-6'
                    : index === stepIndex
                      ? 'bg-cyan-500/50 w-4'
                      : 'bg-slate-600'
                }`}
              />
            ))}
        </div>
      </div>
    </Modal>
  );
}
