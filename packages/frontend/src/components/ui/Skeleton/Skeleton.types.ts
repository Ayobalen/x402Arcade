/**
 * Skeleton Type Definitions
 */

import type { HTMLAttributes } from 'react';

/**
 * Skeleton variant type
 */
export type SkeletonVariant = 'rectangular' | 'circular' | 'text';

/**
 * Animation speed type
 */
export type SkeletonSpeed = 'slow' | 'normal' | 'fast';

/**
 * Props for Skeleton component
 */
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Shape variant
   * @default 'rectangular'
   */
  variant?: SkeletonVariant;

  /**
   * Width of skeleton
   * Can be CSS value (string) or number (px)
   */
  width?: string | number;

  /**
   * Height of skeleton
   * Can be CSS value (string) or number (px)
   */
  height?: string | number;

  /**
   * Whether to show shimmer animation
   * @default true
   */
  animate?: boolean;

  /**
   * Animation speed
   * @default 'normal'
   */
  speed?: SkeletonSpeed;

  /**
   * Optional CSS class name
   */
  className?: string;
}
