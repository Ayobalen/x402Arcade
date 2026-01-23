/**
 * Input Component
 *
 * A form input component with arcade/neon styling.
 * Supports multiple variants, sizes, and states.
 *
 * @example
 * // Default input
 * <Input placeholder="Enter your address" />
 *
 * // With label and error
 * <Input
 *   label="Wallet Address"
 *   error
 *   errorMessage="Invalid address format"
 * />
 *
 * // With icons
 * <Input
 *   leftIcon={<SearchIcon />}
 *   placeholder="Search games..."
 * />
 */

import { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'
import type { InputProps, InputSize, InputVariant } from './Input.types'

/**
 * Error Icon Component
 * Displays a circle with an exclamation mark for error states
 */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

/**
 * Base styles applied to all inputs
 */
const baseStyles = [
  // Layout
  'w-full',
  // Typography
  'font-normal',
  // Transitions - smooth glow appearance
  'transition-all duration-200',
  // Focus states (accessible) with neon glow effect
  'focus:outline-none focus-visible:outline-none',
  // Disabled state
  'disabled:cursor-not-allowed disabled:opacity-50',
  // Placeholder
  'placeholder:text-text-muted',
]

/**
 * Variant-specific styles with neon glow on focus
 */
const variantStyles: Record<InputVariant, string> = {
  default: cn(
    // Background
    'bg-surface-primary',
    // Border
    'border border-border',
    // Focus - cyan glow effect matching arcade button aesthetic
    'focus:border-primary focus-visible:border-primary',
    'focus:shadow-glow-cyan focus-visible:shadow-glow-cyan',
    // Text
    'text-text-primary',
  ),
  filled: cn(
    // Background - lighter for more presence
    'bg-surface-secondary',
    // Border
    'border border-transparent',
    // Focus - cyan glow effect
    'focus:border-primary focus-visible:border-primary',
    'focus:bg-surface-primary focus-visible:bg-surface-primary',
    'focus:shadow-glow-cyan focus-visible:shadow-glow-cyan',
    // Text
    'text-text-primary',
  ),
  outline: cn(
    // Background
    'bg-transparent',
    // Border - more prominent
    'border-2 border-border',
    // Focus - cyan glow effect
    'focus:border-primary focus-visible:border-primary',
    'focus:shadow-glow-cyan focus-visible:shadow-glow-cyan',
    // Text
    'text-text-primary',
  ),
}

/**
 * Size-specific styles
 */
const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-base rounded-lg',
  lg: 'px-5 py-3 text-lg rounded-lg',
}

/**
 * Icon container styles
 */
const iconSizeStyles: Record<InputSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

/**
 * Error state styles with red glow
 */
const errorStyles = cn(
  'border-error',
  'focus:border-error focus-visible:border-error',
  'focus:shadow-glow-red focus-visible:shadow-glow-red',
  'text-text-primary',
)

/**
 * Success state styles with green glow
 */
const successStyles = cn(
  'border-success',
  'focus:border-success focus-visible:border-success',
  'focus:shadow-glow-green focus-visible:shadow-glow-green',
  'text-text-primary',
)

/**
 * Input Component
 *
 * Forwardref implementation for DOM access and ref forwarding.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      size = 'md',
      fullWidth = true,
      error = false,
      errorMessage,
      success = false,
      leftIcon,
      rightIcon,
      label,
      helperText,
      containerClassName,
      className,
      disabled,
      id: providedId,
      ...props
    },
    ref
  ) => {
    // Generate unique ID for accessibility
    const generatedId = useId()
    const inputId = providedId || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    // Calculate padding adjustments for icons
    const hasLeftIcon = !!leftIcon
    // Show error icon when in error state and no custom right icon is provided
    const showErrorIcon = error && !rightIcon
    const hasRightIcon = !!rightIcon || showErrorIcon

    const iconPaddingStyles = cn(
      hasLeftIcon && size === 'sm' && 'pl-9',
      hasLeftIcon && size === 'md' && 'pl-11',
      hasLeftIcon && size === 'lg' && 'pl-13',
      hasRightIcon && size === 'sm' && 'pr-9',
      hasRightIcon && size === 'md' && 'pr-11',
      hasRightIcon && size === 'lg' && 'pr-13',
    )

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-secondary"
          >
            {label}
          </label>
        )}

        {/* Input Container (for icons) */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div
              className={cn(
                'absolute left-3 top-1/2 -translate-y-1/2',
                'text-text-muted pointer-events-none',
                iconSizeStyles[size],
              )}
            >
              {leftIcon}
            </div>
          )}

          {/* Input Element */}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={error}
            aria-describedby={
              error && errorMessage
                ? errorId
                : helperText
                ? helperId
                : undefined
            }
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[size],
              iconPaddingStyles,
              error && errorStyles,
              success && !error && successStyles,
              className,
            )}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-text-muted pointer-events-none',
                iconSizeStyles[size],
              )}
            >
              {rightIcon}
            </div>
          )}

          {/* Error Icon - shown automatically when error and no custom right icon */}
          {showErrorIcon && (
            <div
              className={cn(
                'absolute right-3 top-1/2 -translate-y-1/2',
                'text-error pointer-events-none',
                iconSizeStyles[size],
              )}
            >
              <ErrorIcon className="h-full w-full" />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && errorMessage && (
          <p id={errorId} className="text-sm text-error" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
