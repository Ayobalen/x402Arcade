/**
 * Skeleton Component
 *
 * A loading placeholder with shimmer animation effect.
 * Uses gradient background with infinite animation for "loading" visual feedback.
 *
 * Design: Retro arcade theme with cyan/magenta shimmer effect.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-10 w-64" />
 *
 * // Custom variant
 * <Skeleton variant="circular" className="h-16 w-16" />
 *
 * // Text placeholder
 * <Skeleton variant="text" />
 * ```
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import type { SkeletonProps } from './Skeleton.types';

/**
 * Skeleton - Loading placeholder component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  width,
  height,
  animate = true,
  speed = 'normal',
  ...rest
}) => {
  // Speed configurations (animation duration)
  const speedClasses = {
    slow: 'skeleton-slow',
    normal: 'skeleton-normal',
    fast: 'skeleton-fast',
  };

  // Variant-specific classes
  const variantClasses = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4',
  };

  // Width/height defaults for text variant
  const defaultWidth = variant === 'text' ? '100%' : width;
  const defaultHeight = variant === 'text' ? '1rem' : height;

  return (
    <div
      className={cn(
        // Base styles
        'relative overflow-hidden',
        // Variant shape
        variantClasses[variant],
        // Animation
        animate && 'skeleton-shimmer',
        animate && speedClasses[speed],
        className
      )}
      style={{
        width: defaultWidth,
        height: defaultHeight,
        backgroundColor: 'var(--color-surface-secondary)',
      }}
      {...rest}
    >
      {/* Shimmer effect overlay */}
      {animate && (
        <div
          className="skeleton-shimmer-overlay absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 25%, rgba(255, 0, 255, 0.1) 50%, rgba(0, 255, 255, 0.1) 75%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />
      )}
    </div>
  );
};

export default Skeleton;
