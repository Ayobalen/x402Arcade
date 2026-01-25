/**
 * AnimatedCheckmark Component
 *
 * An animated success checkmark icon with path drawing animation.
 * Features:
 * - Circle background scales in first
 * - Checkmark path draws from 0 to 1 after circle
 * - Uses neon green color from design system
 * - Smooth sequenced animation
 *
 * @example
 * ```tsx
 * <AnimatedCheckmark size={64} onAnimationComplete={() => console.log('Done!')} />
 * ```
 */

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { AnimatedCheckmarkProps } from './AnimatedCheckmark.types';

/**
 * AnimatedCheckmark component
 */
export const AnimatedCheckmark: React.FC<AnimatedCheckmarkProps> = ({
  size = 48,
  color = '#00ff88', // neon green from design system
  duration = 0.6,
  loop = false,
  onAnimationComplete,
  className,
  autoPlay = true,
}) => {
  const circleControls = useAnimation();
  const checkmarkControls = useAnimation();

  useEffect(() => {
    if (!autoPlay) return;

    const playAnimation = async () => {
      // Reset animations
      await circleControls.set({ scale: 0, opacity: 0 });
      await checkmarkControls.set({ pathLength: 0, opacity: 0 });

      // Step 1: Animate circle background (scale in)
      await circleControls.start({
        scale: 1,
        opacity: 1,
        transition: {
          duration: duration * 0.3, // 30% of total duration
          ease: 'easeOut',
        },
      });

      // Step 2: Animate checkmark path (draw from 0 to 1)
      await checkmarkControls.start({
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: duration * 0.7, // 70% of total duration
          ease: 'easeInOut',
        },
      });

      // Call completion callback
      if (onAnimationComplete) {
        onAnimationComplete();
      }

      // Loop if enabled
      if (loop) {
        setTimeout(playAnimation, 500); // 500ms delay before loop
      }
    };

    playAnimation();
  }, [autoPlay, circleControls, checkmarkControls, duration, loop, onAnimationComplete]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
      aria-label="Success checkmark"
      role="img"
    >
      {/* Circle background */}
      <motion.circle
        cx="25"
        cy="25"
        r="23"
        stroke={color}
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={circleControls}
        style={{
          originX: 0.5,
          originY: 0.5,
        }}
      />

      {/* Checkmark path */}
      <motion.path
        d="M14 25 L22 33 L36 17"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={checkmarkControls}
      />

      {/* Glow effect circle (optional - adds neon glow) */}
      <motion.circle
        cx="25"
        cy="25"
        r="23"
        stroke={color}
        strokeWidth="2"
        fill="none"
        initial={{ scale: 0, opacity: 0 }}
        animate={circleControls}
        style={{
          originX: 0.5,
          originY: 0.5,
          filter: `drop-shadow(0 0 8px ${color})`,
        }}
        opacity={0.3}
      />
    </svg>
  );
};

export default AnimatedCheckmark;
