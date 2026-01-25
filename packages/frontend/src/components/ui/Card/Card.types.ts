/**
 * Card Component Types
 *
 * Type definitions for the Card component.
 * Follows the design system's arcade/neon aesthetic.
 */

import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Card variant options
 *
 * - `default`: Standard surface background
 * - `elevated`: Raised with shadow for visual hierarchy
 * - `outlined`: Transparent with visible border
 * - `glass`: Glassmorphism effect with backdrop blur
 */
export type CardVariant = 'default' | 'elevated' | 'outlined' | 'glass';

/**
 * Glow color options for neon border effect
 *
 * Uses the design system's accent colors for the glow:
 * - `cyan`: Primary neon cyan glow (default)
 * - `magenta`: Secondary neon magenta glow
 * - `green`: Success neon green glow
 * - `orange`: Warning neon orange glow
 * - `red`: Error neon red glow
 * - `white`: Neutral white glow
 * - `rainbow`: Multi-color cyan/magenta gradient glow
 */
export type CardGlowColor = 'cyan' | 'magenta' | 'green' | 'orange' | 'red' | 'white' | 'rainbow';

/**
 * Card padding options
 *
 * - `none`: No padding
 * - `sm`: Small padding for compact cards
 * - `md`: Medium padding (default)
 * - `lg`: Large padding for prominent cards
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card Props Interface
 *
 * Extends native div attributes with custom props
 * for styling variants and layout options.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Padding size
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Whether the card should have hover effects
   * @default false
   */
  hoverable?: boolean;

  /**
   * Whether the card should be interactive (clickable)
   * @default false
   */
  interactive?: boolean;

  /**
   * Whether to apply neon glow on hover
   * @default false
   */
  glowOnHover?: boolean;

  /**
   * Apply a static glowing neon border effect.
   * When set, the card will have a constant glow in the specified color.
   * Use this for featured cards, game containers, or highlighted content.
   * @default undefined (no glow)
   */
  glowColor?: CardGlowColor;

  /**
   * Whether the glow should pulse/animate.
   * When true, the glow will have a subtle pulsing animation.
   * When false, the glow will be static.
   * Only applies when glowColor is set.
   * @default false
   */
  glowPulse?: boolean;

  /**
   * Glow intensity level.
   * Controls how strong/prominent the glow effect is.
   * @default 'md'
   */
  glowIntensity?: 'sm' | 'md' | 'lg';

  /**
   * Whether the card is selected
   * When true, applies selection animation and styles
   * @default false
   */
  isSelected?: boolean;

  /**
   * Whether to animate card entrance
   * When true, card will fade in and slide up
   * @default true
   */
  animateEntrance?: boolean;

  /**
   * Delay before entrance animation starts (in seconds)
   * Useful for staggered animations
   * @default 0
   */
  entranceDelay?: number;

  /**
   * Card content
   */
  children: ReactNode;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CardHeader Props Interface
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * CardBody Props Interface
 */
export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

/**
 * CardFooter Props Interface
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}
