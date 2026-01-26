/**
 * Onboarding Store
 *
 * Manages onboarding state and first-time user experience.
 * Tracks which steps have been completed and stores user preferences.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type OnboardingStep =
  | 'welcome'
  | 'connect-wallet'
  | 'select-game'
  | 'payment-flow'
  | 'gameplay'
  | 'leaderboard'
  | 'complete';

export interface OnboardingTooltip {
  id: string;
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  dismissed?: boolean;
}

export interface GameTutorialStep {
  id: string;
  title: string;
  description: string;
  image?: string;
  keys?: string[];
}

interface OnboardingState {
  // Onboarding state
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  showOnboarding: boolean;

  // Tooltip state
  activeTooltips: OnboardingTooltip[];
  dismissedTooltips: string[];
  showTooltips: boolean;

  // Game tutorial state
  activeTutorial: string | null;
  tutorialStep: number;
  showTutorial: boolean;

  // Help modal state
  showHelp: boolean;

  // Keyboard shortcuts guide
  showKeyboardShortcuts: boolean;

  // Actions - Onboarding
  startOnboarding: () => void;
  completeStep: (step: OnboardingStep) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  setShowOnboarding: (show: boolean) => void;

  // Actions - Tooltips
  registerTooltip: (tooltip: OnboardingTooltip) => void;
  dismissTooltip: (id: string) => void;
  dismissAllTooltips: () => void;
  setShowTooltips: (show: boolean) => void;

  // Actions - Game Tutorial
  startTutorial: (gameId: string) => void;
  nextTutorialStep: () => void;
  previousTutorialStep: () => void;
  skipTutorial: () => void;
  setTutorialStep: (step: number) => void;

  // Actions - Help Modal
  openHelp: () => void;
  closeHelp: () => void;

  // Actions - Keyboard Shortcuts
  openKeyboardShortcuts: () => void;
  closeKeyboardShortcuts: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'connect-wallet',
  'select-game',
  'payment-flow',
  'gameplay',
  'leaderboard',
  'complete',
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      // Initial state
      isOnboardingComplete: false,
      currentStep: 'welcome',
      completedSteps: [],
      showOnboarding: false,

      activeTooltips: [],
      dismissedTooltips: [],
      showTooltips: true,

      activeTutorial: null,
      tutorialStep: 0,
      showTutorial: false,

      showHelp: false,
      showKeyboardShortcuts: false,

      // Onboarding actions
      startOnboarding: () =>
        set({
          showOnboarding: true,
          currentStep: 'welcome',
          isOnboardingComplete: false,
        }),

      completeStep: (step: OnboardingStep) =>
        set((state) => {
          const completedSteps = [...state.completedSteps, step];
          const currentIndex = ONBOARDING_STEPS.indexOf(step);
          const nextStep =
            currentIndex < ONBOARDING_STEPS.length - 1
              ? ONBOARDING_STEPS[currentIndex + 1]
              : 'complete';

          const isComplete = nextStep === 'complete';

          return {
            completedSteps,
            currentStep: nextStep,
            isOnboardingComplete: isComplete,
            showOnboarding: !isComplete,
          };
        }),

      skipOnboarding: () =>
        set({
          isOnboardingComplete: true,
          showOnboarding: false,
          currentStep: 'complete',
        }),

      resetOnboarding: () =>
        set({
          isOnboardingComplete: false,
          currentStep: 'welcome',
          completedSteps: [],
          showOnboarding: false,
          dismissedTooltips: [],
          activeTooltips: [],
        }),

      setShowOnboarding: (show: boolean) =>
        set({
          showOnboarding: show,
        }),

      // Tooltip actions
      registerTooltip: (tooltip: OnboardingTooltip) =>
        set((state) => {
          const isDismissed = state.dismissedTooltips.includes(tooltip.id);
          if (isDismissed) return state;

          const exists = state.activeTooltips.some((t) => t.id === tooltip.id);
          if (exists) return state;

          return {
            activeTooltips: [...state.activeTooltips, tooltip],
          };
        }),

      dismissTooltip: (id: string) =>
        set((state) => ({
          dismissedTooltips: [...state.dismissedTooltips, id],
          activeTooltips: state.activeTooltips.filter((t) => t.id !== id),
        })),

      dismissAllTooltips: () =>
        set((state) => ({
          dismissedTooltips: [...state.dismissedTooltips, ...state.activeTooltips.map((t) => t.id)],
          activeTooltips: [],
        })),

      setShowTooltips: (show: boolean) =>
        set({
          showTooltips: show,
        }),

      // Game tutorial actions
      startTutorial: (gameId: string) =>
        set({
          activeTutorial: gameId,
          tutorialStep: 0,
          showTutorial: true,
        }),

      nextTutorialStep: () =>
        set((state) => ({
          tutorialStep: state.tutorialStep + 1,
        })),

      previousTutorialStep: () =>
        set((state) => ({
          tutorialStep: Math.max(0, state.tutorialStep - 1),
        })),

      skipTutorial: () =>
        set({
          activeTutorial: null,
          tutorialStep: 0,
          showTutorial: false,
        }),

      setTutorialStep: (step: number) =>
        set({
          tutorialStep: step,
        }),

      // Help modal actions
      openHelp: () =>
        set({
          showHelp: true,
        }),

      closeHelp: () =>
        set({
          showHelp: false,
        }),

      // Keyboard shortcuts actions
      openKeyboardShortcuts: () =>
        set({
          showKeyboardShortcuts: true,
        }),

      closeKeyboardShortcuts: () =>
        set({
          showKeyboardShortcuts: false,
        }),
    }),
    {
      name: 'x402-onboarding-storage',
      partialize: (state) => ({
        isOnboardingComplete: state.isOnboardingComplete,
        completedSteps: state.completedSteps,
        dismissedTooltips: state.dismissedTooltips,
        showTooltips: state.showTooltips,
      }),
    }
  )
);
