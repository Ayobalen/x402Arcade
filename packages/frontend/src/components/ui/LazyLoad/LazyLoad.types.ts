/**
 * LazyLoad Type Definitions
 */

import type { ReactNode } from 'react';

/**
 * LazyLoad component props
 */
export interface LazyLoadProps {
  /** Content to lazy load */
  children: ReactNode;
  /**
   * Placeholder to show while content is loading.
   * Can be a React node or a component that receives className.
   */
  placeholder?: ReactNode;
  /**
   * Root margin for intersection observer.
   * Positive values load content before it enters viewport.
   * @default "200px"
   */
  rootMargin?: string;
  /**
   * Threshold for intersection observer.
   * 0 = any pixel visible, 1 = fully visible.
   * @default 0
   */
  threshold?: number;
  /**
   * Whether to trigger loading only once.
   * If false, content unloads when leaving viewport.
   * @default true
   */
  triggerOnce?: boolean;
  /**
   * Minimum height for the container before content loads.
   * Helps prevent layout shift.
   */
  minHeight?: string | number;
  /**
   * Whether to show fade-in animation when content loads.
   * @default true
   */
  fadeIn?: boolean;
  /**
   * Fade-in animation duration in ms.
   * @default 200
   */
  fadeDuration?: number;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Callback when content starts loading (enters viewport)
   */
  onLoad?: () => void;
  /**
   * Callback when content becomes visible
   */
  onVisible?: () => void;
  /**
   * Force loading regardless of viewport position.
   * Useful for preloading.
   * @default false
   */
  forceLoad?: boolean;
  /**
   * Disable lazy loading (load immediately).
   * @default false
   */
  disabled?: boolean;
}
