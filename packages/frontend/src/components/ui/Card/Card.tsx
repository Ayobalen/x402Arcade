/**
 * Card Component
 *
 * A versatile container component with arcade/neon styling.
 * Supports multiple variants for different visual hierarchy levels.
 *
 * @example
 * // Default card
 * <Card>Content here</Card>
 *
 * // Elevated card with hover effects
 * <Card variant="elevated" hoverable>
 *   <CardHeader>Title</CardHeader>
 *   <CardBody>Content</CardBody>
 * </Card>
 *
 * // Glass card with glow
 * <Card variant="glass" glowOnHover>
 *   Glassmorphism content
 * </Card>
 */

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type {
  CardProps,
  CardHeaderProps,
  CardBodyProps,
  CardFooterProps,
  CardVariant,
  CardPadding,
  CardGlowColor,
} from './Card.types';

/**
 * Base styles applied to all cards
 */
const baseStyles = [
  // Layout
  'relative',
  // Border radius
  'rounded-lg',
  // Transitions
  'transition-all duration-200',
];

/**
 * Variant-specific styles
 */
const variantStyles: Record<CardVariant, string> = {
  default: cn(
    // Background - surface color
    'bg-surface-primary',
    // Border - subtle
    'border border-border'
  ),
  elevated: cn(
    // Background - slightly elevated surface
    'bg-surface-primary',
    // Border
    'border border-border',
    // Shadow for elevation
    'shadow-lg'
  ),
  outlined: cn(
    // Background - transparent
    'bg-transparent',
    // Border - more prominent
    'border-2 border-border'
  ),
  glass: cn(
    // Background - semi-transparent
    'bg-surface-primary/60',
    // Glassmorphism effect
    'backdrop-blur-md',
    // Border - subtle glow
    'border border-border/50'
  ),
};

/**
 * Padding styles
 */
const paddingStyles: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

/**
 * Hover effect styles
 * Scale and shadow are now handled by framer-motion whileHover
 */
const hoverableStyles = cn(
  // Cursor to indicate interactivity
  'cursor-pointer',
  // Border accent on hover (still using CSS for smooth blend)
  'hover:border-primary/50',
  // Background shift for visual feedback
  'hover:bg-surface-secondary',
  // Performance optimization for transform
  'will-change-transform'
);

/**
 * Interactive (clickable) styles
 */
const interactiveStyles = cn(
  'cursor-pointer',
  'hover:border-primary/50',
  'hover:bg-surface-secondary',
  'active:scale-[0.99]',
  'focus:outline-none focus-visible:outline-none',
  'focus-visible:border-primary focus-visible:shadow-glow-cyan'
);

/**
 * Glow on hover styles
 */
const glowHoverStyles = cn('hover:shadow-glow-cyan', 'hover:border-primary/70');

/**
 * Glow color mapping to Tailwind shadow classes
 * Maps glow color options to their respective box-shadow classes
 */
const glowColorStyles: Record<CardGlowColor, Record<'sm' | 'md' | 'lg', string>> = {
  cyan: {
    sm: 'shadow-glow-cyan border-primary/40',
    md: 'shadow-glow-cyan-md border-primary/60',
    lg: 'shadow-glow-cyan-lg border-primary/80',
  },
  magenta: {
    sm: 'shadow-glow-magenta border-secondary/40',
    md: 'shadow-glow-magenta-md border-secondary/60',
    lg: 'shadow-glow-magenta-lg border-secondary/80',
  },
  green: {
    sm: 'shadow-glow-green border-success/40',
    md: 'shadow-glow-green-lg border-success/60',
    lg: 'shadow-glow-green-lg border-success/80',
  },
  orange: {
    sm: 'shadow-glow-orange border-warning/40',
    md: 'shadow-glow-orange-lg border-warning/60',
    lg: 'shadow-glow-orange-lg border-warning/80',
  },
  red: {
    sm: 'shadow-glow-red border-error/40',
    md: 'shadow-glow-red-lg border-error/60',
    lg: 'shadow-glow-red-lg border-error/80',
  },
  white: {
    sm: 'shadow-glow-white border-white/40',
    md: 'shadow-glow-white-md border-white/60',
    lg: 'shadow-glow-white-lg border-white/80',
  },
  rainbow: {
    sm: 'shadow-glow-rainbow border-primary/30',
    md: 'shadow-glow-rainbow border-primary/50',
    lg: 'shadow-glow-rainbow border-primary/70',
  },
};

/**
 * Glow pulse animation class
 */
const glowPulseStyles = 'animate-glow-pulse';

/**
 * Entrance animation variants
 * Card fades in and slides up from below
 */
const entranceVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
};

/**
 * Card Component
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      interactive = false,
      glowOnHover = false,
      glowColor,
      glowPulse = false,
      glowIntensity = 'md',
      isSelected = false,
      animateEntrance = true,
      entranceDelay = 0,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Get glow styles if glowColor is specified
    const glowStyles = glowColor ? glowColorStyles[glowColor][glowIntensity] : undefined;

    // Create motion component as div
    const MotionDiv = motion.div;

    // Hover lift animation - only apply if hoverable or interactive
    const hoverAnimation =
      hoverable || interactive
        ? {
            y: -4,
            scale: 1.02,
            boxShadow:
              variant === 'elevated'
                ? '0 20px 25px -5px rgba(139, 92, 246, 0.3), 0 10px 10px -5px rgba(139, 92, 246, 0.2)'
                : '0 10px 15px -3px rgba(139, 92, 246, 0.2), 0 4px 6px -2px rgba(139, 92, 246, 0.1)',
          }
        : undefined;

    // Selection animation - border and shadow
    const selectedAnimation = isSelected
      ? {
          borderColor: 'rgba(139, 92, 246, 1)', // primary color
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)',
          scale: 1.01,
        }
      : {};

    return (
      <MotionDiv
        ref={ref as React.Ref<HTMLDivElement>}
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          hoverable && hoverableStyles,
          interactive && interactiveStyles,
          glowOnHover && !glowColor && glowHoverStyles,
          glowStyles,
          glowColor && glowPulse && glowPulseStyles,
          className
        )}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? 'button' : undefined}
        // Entrance animation
        initial={animateEntrance ? entranceVariants.initial : undefined}
        animate={
          animateEntrance
            ? { ...entranceVariants.animate, ...selectedAnimation }
            : selectedAnimation
        }
        // Hover lift animation
        whileHover={hoverAnimation}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 25,
          delay: entranceDelay,
        }}
        {...props}
      >
        {children}
      </MotionDiv>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 *
 * Header section of a card with title styling
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5', 'pb-4', 'border-b border-border/50', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardBody Component
 *
 * Main content section of a card
 */
export const CardBody = forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('py-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * CardFooter Component
 *
 * Footer section of a card, typically for actions
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center', 'pt-4', 'border-t border-border/50', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
