/**
 * AnimatedError Component
 *
 * An animated error cross icon with path drawing animation.
 * Features:
 * - Red circle background scales in first
 * - Both cross lines draw simultaneously (pathLength 0 to 1)
 * - Subtle shake effect after drawing
 * - Uses neon red color from design system
 *
 * @example
 * ```tsx
 * <AnimatedError size={64} onAnimationComplete={() => console.log('Error shown!')} />
 * ```
 */

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { AnimatedErrorProps } from './AnimatedError.types';

/**
 * AnimatedError component
 */
export const AnimatedError: React.FC<AnimatedErrorProps> = ({
  size = 48,
  color = '#ff3366', // neon red from design system
  duration = 0.7,
  loop = false,
  onAnimationComplete,
  className,
  autoPlay = true,
  includeShake = true,
}) => {
  const circleControls = useAnimation();
  const crossControls = useAnimation();
  const shakeControls = useAnimation();

  useEffect(() => {
    if (!autoPlay) return;

    const playAnimation = async () => {
      // Reset animations
      await circleControls.set({ scale: 0, opacity: 0 });
      await crossControls.set({ pathLength: 0, opacity: 0 });
      await shakeControls.set({ x: 0, rotate: 0 });

      // Step 1: Animate circle background (scale in)
      await circleControls.start({
        scale: 1,
        opacity: 1,
        transition: {
          duration: duration * 0.25, // 25% of total duration
          ease: 'easeOut',
        },
      });

      // Step 2: Animate both cross lines simultaneously (draw from 0 to 1)
      await crossControls.start({
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: duration * 0.5, // 50% of total duration
          ease: 'easeInOut',
        },
      });

      // Step 3: Shake effect (if enabled)
      if (includeShake) {
        await shakeControls.start({
          x: [-3, 3, -3, 3, 0],
          rotate: [-2, 2, -2, 2, 0],
          transition: {
            duration: duration * 0.25, // 25% of total duration
            ease: 'easeInOut',
          },
        });
      }

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
  }, [
    autoPlay,
    circleControls,
    crossControls,
    shakeControls,
    duration,
    loop,
    onAnimationComplete,
    includeShake,
  ]);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block', className)}
      aria-label="Error cross"
      role="img"
      animate={shakeControls}
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

      {/* Cross line 1 (top-left to bottom-right) */}
      <motion.path
        d="M16 16 L34 34"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={crossControls}
      />

      {/* Cross line 2 (top-right to bottom-left) */}
      <motion.path
        d="M34 16 L16 34"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={crossControls}
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
    </motion.svg>
  );
};

export default AnimatedError;
