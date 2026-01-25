/**
 * PageSkeleton Type Definitions
 */

/**
 * Available page skeleton variants
 */
export type PageSkeletonVariant = 'generic' | 'home' | 'play' | 'game' | 'leaderboard' | 'notfound';

/**
 * PageSkeleton component props
 */
export interface PageSkeletonProps {
  /** Which page skeleton to display */
  variant?: PageSkeletonVariant;
  /** Additional CSS classes */
  className?: string;
}
