import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * PageTransition Component
 *
 * Wraps page content with smooth fade/slide animations on route changes.
 * Respects user's reduced-motion preferences for accessibility.
 *
 * Animation:
 * - Entry: Fade in from opacity 0 to 1, slide up slightly
 * - Exit: Fade out from opacity 1 to 0
 * - Duration: 200ms (fast, subtle transition)
 *
 * @example
 * <PageTransition>
 *   <HomePage />
 * </PageTransition>
 */
export function PageTransition({ children }: PageTransitionProps) {
  // Check if user prefers reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // If reduced motion is preferred, don't animate
  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: 'easeOut',
      }}
    >
      {children}
    </motion.div>
  );
}
