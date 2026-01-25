/**
 * AnimationContext
 *
 * Global animation configuration context for the application.
 * Allows users to control animation settings globally.
 *
 * @example
 * ```tsx
 * // Wrap app with provider
 * <AnimationProvider>
 *   <App />
 * </AnimationProvider>
 *
 * // Use in components
 * const { animationsEnabled, speedMultiplier, toggleAnimations } = useAnimationContext();
 * ```
 */

import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Animation context state and actions
 */
export interface AnimationContextType {
  /**
   * Whether animations are globally enabled
   * (respects user's reduced motion preference)
   */
  animationsEnabled: boolean;

  /**
   * Speed multiplier for all animations (0.5 = half speed, 2 = double speed)
   */
  speedMultiplier: number;

  /**
   * Whether user prefers reduced motion (from system settings)
   */
  prefersReducedMotion: boolean;

  /**
   * Toggle animations on/off
   */
  toggleAnimations: () => void;

  /**
   * Set animation speed multiplier
   */
  setSpeedMultiplier: (multiplier: number) => void;

  /**
   * Enable animations
   */
  enableAnimations: () => void;

  /**
   * Disable animations
   */
  disableAnimations: () => void;

  /**
   * Reset to default settings
   */
  reset: () => void;
}

/**
 * Default context values
 */
const defaultContext: AnimationContextType = {
  animationsEnabled: true,
  speedMultiplier: 1,
  prefersReducedMotion: false,
  toggleAnimations: () => {},
  setSpeedMultiplier: () => {},
  enableAnimations: () => {},
  disableAnimations: () => {},
  reset: () => {},
};

/**
 * Animation context
 */
const AnimationContext = createContext<AnimationContextType>(defaultContext);

/**
 * Provider props
 */
export interface AnimationProviderProps {
  /**
   * Child components
   */
  children: ReactNode;

  /**
   * Initial animation enabled state (default: true)
   */
  initialEnabled?: boolean;

  /**
   * Initial speed multiplier (default: 1)
   */
  initialSpeedMultiplier?: number;
}

/**
 * AnimationProvider Component
 *
 * Provides global animation configuration to the entire app.
 * Automatically respects user's reduced motion preferences.
 *
 * @param props - Provider props
 */
export function AnimationProvider({
  children,
  initialEnabled = true,
  initialSpeedMultiplier = 1,
}: AnimationProviderProps) {
  const prefersReducedMotion = useReducedMotion();

  // State: animations enabled/disabled
  const [animationsEnabled, setAnimationsEnabled] = useState(initialEnabled);

  // State: animation speed multiplier
  const [speedMultiplier, setSpeedMultiplier] = useState(initialSpeedMultiplier);

  // Action: Toggle animations
  const toggleAnimations = useCallback(() => {
    setAnimationsEnabled((prev) => !prev);
  }, []);

  // Action: Enable animations
  const enableAnimations = useCallback(() => {
    setAnimationsEnabled(true);
  }, []);

  // Action: Disable animations
  const disableAnimations = useCallback(() => {
    setAnimationsEnabled(false);
  }, []);

  // Action: Set speed multiplier with validation
  const handleSetSpeedMultiplier = useCallback((multiplier: number) => {
    // Clamp between 0.1 and 5
    const clampedMultiplier = Math.max(0.1, Math.min(5, multiplier));
    setSpeedMultiplier(clampedMultiplier);
  }, []);

  // Action: Reset to defaults
  const reset = useCallback(() => {
    setAnimationsEnabled(initialEnabled);
    setSpeedMultiplier(initialSpeedMultiplier);
  }, [initialEnabled, initialSpeedMultiplier]);

  // Context value
  const value: AnimationContextType = {
    animationsEnabled: animationsEnabled && !prefersReducedMotion,
    speedMultiplier,
    prefersReducedMotion,
    toggleAnimations,
    setSpeedMultiplier: handleSetSpeedMultiplier,
    enableAnimations,
    disableAnimations,
    reset,
  };

  return <AnimationContext.Provider value={value}>{children}</AnimationContext.Provider>;
}

/**
 * Hook to use animation context
 *
 * Must be used within an AnimationProvider.
 *
 * @returns {AnimationContextType} Animation context
 * @throws {Error} If used outside AnimationProvider
 */
export function useAnimationContext(): AnimationContextType {
  const context = useContext(AnimationContext);

  if (!context) {
    throw new Error('useAnimationContext must be used within an AnimationProvider');
  }

  return context;
}

/**
 * Hook to get effective animation duration
 *
 * Applies speed multiplier and reduced motion preferences.
 *
 * @param baseDuration - Base duration in milliseconds
 * @returns {number} Effective duration
 */
export function useAnimationDuration(baseDuration: number): number {
  const { animationsEnabled, speedMultiplier } = useAnimationContext();

  if (!animationsEnabled) {
    return 0;
  }

  return baseDuration / speedMultiplier;
}

/**
 * Export context for testing
 */
export { AnimationContext };

export default AnimationProvider;
