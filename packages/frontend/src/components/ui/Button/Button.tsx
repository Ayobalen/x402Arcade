/**
 * Button Component
 *
 * A versatile button component with arcade/neon styling.
 * Supports multiple variants, sizes, and states.
 *
 * @example
 * // Primary button (default)
 * <Button>Play Now</Button>
 *
 * // Secondary with icon
 * <Button variant="secondary" leftIcon={<WalletIcon />}>
 *   Connect Wallet
 * </Button>
 *
 * // Loading state
 * <Button isLoading loadingText="Processing...">
 *   Submit Score
 * </Button>
 */

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ButtonProps, ButtonSize, ButtonVariant } from './Button.types';

/**
 * Base styles applied to all buttons
 */
const baseStyles = [
  // Layout
  'inline-flex items-center justify-center gap-2',
  // Typography
  'font-medium',
  // Transitions
  'transition-all duration-200',
  // Focus states (accessible)
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
  // Disabled state
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Text selection
  'select-none',
];

/**
 * Variant-specific styles
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: cn(
    // Background with gradient
    'bg-gradient-to-r from-primary to-primary-600',
    // Text
    'text-bg-primary',
    // Hover
    'hover:from-primary-hover hover:to-primary-500 hover:shadow-glow-cyan',
    // Active
    'active:from-primary-600 active:to-primary-700',
    // Focus ring
    'focus-visible:ring-primary'
  ),
  secondary: cn(
    // Background with gradient
    'bg-gradient-to-r from-secondary to-secondary-600',
    // Text
    'text-bg-primary',
    // Hover
    'hover:from-secondary-hover hover:to-secondary-500 hover:shadow-glow-magenta',
    // Active
    'active:from-secondary-600 active:to-secondary-700',
    // Focus ring
    'focus-visible:ring-secondary'
  ),
  outline: cn(
    // Background
    'bg-transparent',
    // Border
    'border-2 border-primary',
    // Text
    'text-primary',
    // Hover
    'hover:bg-primary/10 hover:shadow-glow-cyan',
    // Active
    'active:bg-primary/20',
    // Focus ring
    'focus-visible:ring-primary'
  ),
  ghost: cn(
    // Background
    'bg-transparent',
    // Text
    'text-text-secondary',
    // Hover
    'hover:bg-surface-primary hover:text-text-primary',
    // Active
    'active:bg-surface-secondary',
    // Focus ring
    'focus-visible:ring-border'
  ),
  danger: cn(
    // Background
    'bg-error',
    // Text
    'text-bg-primary',
    // Hover
    'hover:bg-error-dark hover:shadow-glow-red',
    // Active
    'active:bg-error-dark',
    // Focus ring
    'focus-visible:ring-error'
  ),
  success: cn(
    // Background
    'bg-success',
    // Text
    'text-bg-primary',
    // Hover
    'hover:bg-success-dark hover:shadow-glow-green',
    // Active
    'active:bg-success-dark',
    // Focus ring
    'focus-visible:ring-success'
  ),
};

/**
 * Size-specific styles
 */
const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-6 py-3 text-lg rounded-lg',
  xl: 'px-8 py-4 text-xl rounded-xl',
};

/**
 * Icon-only button size styles (square buttons)
 */
const iconOnlySizeStyles: Record<ButtonSize, string> = {
  xs: 'p-1 rounded-md',
  sm: 'p-1.5 rounded-md',
  md: 'p-2 rounded-lg',
  lg: 'p-3 rounded-lg',
  xl: 'p-4 rounded-xl',
};

/**
 * Icon size classes for each button size
 * Icons scale proportionally with the button text size
 */
const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
};

/**
 * Animation variants for button press
 */
const pressVariants = {
  initial: { scale: 1, y: 0 },
  pressed: { scale: 0.98, y: 1 },
};

/**
 * Loading spinner component with rotation animation
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <motion.svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

/**
 * Button Component
 *
 * Forwardref implementation for DOM access and ref forwarding.
 */
/**
 * Wrapper component to apply sizing to icons
 */
function IconWrapper({
  children,
  sizeClass,
  className,
}: {
  children: React.ReactNode;
  sizeClass: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex-shrink-0 inline-flex items-center justify-center',
        // Apply size via CSS variables so icons inherit
        '[&>svg]:h-full [&>svg]:w-full',
        sizeClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      loadingText = 'Loading...',
      leftIcon,
      rightIcon,
      iconOnly = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Determine if button should be disabled
    const isDisabled = disabled || isLoading;

    // Get icon size based on button size
    const iconSize = iconSizeStyles[size];

    // Determine if this is effectively an icon-only button
    // (explicitly set, or has icon(s) but no children)
    const isIconOnlyButton = iconOnly || (!children && (leftIcon || rightIcon));

    // Create motion component as button
    const MotionButton = motion.button;

    // Separate motion props from native button props to avoid conflicts
    const {
      onAnimationStart,
      onAnimationEnd,
      onDrag,
      onDragEnd,
      onDragStart,
      ...nativeButtonProps
    } = props;

    return (
      <MotionButton
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        disabled={isDisabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          isIconOnlyButton ? iconOnlySizeStyles[size] : sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        // Press animation
        whileTap={isDisabled ? undefined : pressVariants.pressed}
        // Hover glow animation (subtle purple glow)
        whileHover={
          isDisabled
            ? undefined
            : {
                boxShadow:
                  variant === 'primary'
                    ? '0 0 20px rgba(139, 92, 246, 0.6)'
                    : variant === 'secondary'
                      ? '0 0 20px rgba(236, 72, 153, 0.6)'
                      : variant === 'outline'
                        ? '0 0 15px rgba(139, 92, 246, 0.4)'
                        : '0 0 12px rgba(139, 92, 246, 0.3)',
              }
        }
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 25,
        }}
        {...nativeButtonProps}
      >
        {isLoading ? (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <LoadingSpinner className={iconSize} />
            </motion.div>
            {!isIconOnlyButton && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {loadingText}
              </motion.span>
            )}
          </>
        ) : (
          <>
            {leftIcon && <IconWrapper sizeClass={iconSize}>{leftIcon}</IconWrapper>}
            {children}
            {rightIcon && <IconWrapper sizeClass={iconSize}>{rightIcon}</IconWrapper>}
          </>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;
