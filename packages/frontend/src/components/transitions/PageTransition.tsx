import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  type PageTransitionPreset,
  PAGE_TRANSITION_PRESETS,
  fadeTransition,
} from '@/lib/animations/pageTransitions';

interface PageTransitionProps {
  children: ReactNode;
  /**
   * Transition preset to use for page animations
   * @default 'fade'
   */
  transition?: PageTransitionPreset;
}

/**
 * PageTransition Component
 *
 * Wraps page content with smooth animations on route changes.
 * Respects user's reduced-motion preferences for accessibility.
 *
 * Features:
 * - Uses useLocation for route-based key
 * - Applies configurable transition variants
 * - Respects reduced motion preferences
 * - Supports all page transition presets
 *
 * @example
 * ```tsx
 * // Default fade transition
 * <PageTransition>
 *   <HomePage />
 * </PageTransition>
 *
 * // Custom transition preset
 * <PageTransition transition="slideRight">
 *   <GamePage />
 * </PageTransition>
 *
 * // Blur transition for premium feel
 * <PageTransition transition="blur">
 *   <ProfilePage />
 * </PageTransition>
 * ```
 */
export function PageTransition({ children, transition = 'fade' }: PageTransitionProps) {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  // Get the selected transition variant
  const transitionVariant = PAGE_TRANSITION_PRESETS[transition] || fadeTransition;

  // If reduced motion is preferred, don't animate
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={transitionVariant}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
