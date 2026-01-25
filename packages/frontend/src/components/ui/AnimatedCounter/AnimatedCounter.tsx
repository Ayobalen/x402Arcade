/**
 * AnimatedCounter Component
 *
 * Smoothly animates numbers from one value to another using spring physics.
 * Features:
 * - Spring-based animation using useSpring hook
 * - Animates from old value to new value
 * - Multiple number formats (currency, percentage, compact, decimal)
 * - Customizable spring parameters
 *
 * @example
 * ```tsx
 * // Simple counter
 * <AnimatedCounter value={1337} />
 *
 * // Currency counter
 * <AnimatedCounter value={99.99} format="currency" decimals={2} />
 *
 * // Percentage
 * <AnimatedCounter value={85.5} format="percentage" decimals={1} />
 * ```
 */

import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { AnimatedCounterProps, NumberFormat } from './AnimatedCounter.types';

/**
 * Format a number based on the specified format type
 */
function formatNumber(
  value: number,
  format: NumberFormat,
  decimals: number,
  currencySymbol: string
): string {
  switch (format) {
    case 'currency':
      return `${currencySymbol}${value.toFixed(decimals)}`;
    case 'percentage':
      return `${value.toFixed(decimals)}%`;
    case 'compact':
      return Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: decimals,
      }).format(value);
    case 'decimal':
      return value.toFixed(decimals);
    case 'none':
    default:
      return Math.round(value).toString();
  }
}

/**
 * AnimatedCounter component
 */
export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  from = 0,
  format = 'none',
  decimals = 0,
  currencySymbol = '$',
  duration = 1.0,
  stiffness = 100,
  damping = 20,
  onAnimationComplete,
  className,
  as: Component = 'span',
}) => {
  // Create spring value
  const springValue = useSpring(from, {
    stiffness,
    damping,
    // Convert duration to mass (approximate relationship)
    mass: duration / 0.5,
  });

  // Transform spring value to formatted string
  const displayValue = useTransform(springValue, (latest) =>
    formatNumber(latest, format, decimals, currencySymbol)
  );

  // Update spring value when target value changes
  useEffect(() => {
    springValue.set(value);

    // Set up completion callback
    if (onAnimationComplete) {
      const unsubscribe = springValue.on('change', (latest) => {
        // Consider animation complete when very close to target (within 0.01)
        if (Math.abs(latest - value) < 0.01) {
          onAnimationComplete();
          unsubscribe(); // Clean up listener
        }
      });

      return unsubscribe;
    }
  }, [value, springValue, onAnimationComplete]);

  // Use motion component for the container
  const MotionComponent = motion[Component as keyof typeof motion] as typeof motion.span;

  return <MotionComponent className={cn(className)}>{displayValue}</MotionComponent>;
};

export default AnimatedCounter;
