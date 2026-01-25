/**
 * AnimatedList Type Definitions
 */

import type { HTMLMotionProps, Variants } from 'framer-motion';
import type { StaggerPreset } from '../../../lib/animations/stagger';

/**
 * Props for AnimatedList component
 */
export interface AnimatedListProps extends Omit<HTMLMotionProps<'ul'>, 'variants'> {
  /**
   * List items to animate
   */
  children: React.ReactNode;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Preset animation style
   * @default 'normal'
   */
  preset?: StaggerPreset;

  /**
   * Custom stagger delay between items (in seconds)
   * Only used when preset is not provided
   * @default 0.05
   */
  staggerDelay?: number;

  /**
   * Delay before first child animates (in seconds)
   * Only used when preset is not provided
   * @default 0
   */
  delayChildren?: number;

  /**
   * HTML element to render as
   * @default 'ul'
   */
  as?: 'ul' | 'ol' | 'div' | 'section' | 'nav';
}

/**
 * Props for AnimatedList.Item component
 */
export interface AnimatedListItemProps extends Omit<HTMLMotionProps<'li'>, 'variants'> {
  /**
   * Item content
   */
  children: React.ReactNode;

  /**
   * Optional CSS class name
   */
  className?: string;

  /**
   * Preset animation style (should match parent AnimatedList preset)
   * @default 'normal'
   */
  preset?: StaggerPreset;

  /**
   * Custom animation variants (overrides preset)
   */
  customAnimation?: Variants;

  /**
   * HTML element to render as
   * @default 'li'
   */
  as?: 'li' | 'div' | 'article' | 'section';
}
