/**
 * Toast Component
 *
 * A notification toast component with variant styling for different
 * notification types: success, error, warning, and info.
 *
 * @example
 * // Success toast
 * <Toast
 *   variant="success"
 *   title="Note saved"
 *   description="Your note has been encrypted and saved."
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 *
 * // Error toast
 * <Toast
 *   variant="error"
 *   title="Transaction failed"
 *   description="Unable to connect to the network."
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 * />
 */

import type { KeyboardEvent } from 'react'
import { useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ToastProps, ToastVariant } from './Toast.types'

/**
 * Variant-specific styles including background, border, and text colors
 */
const variantStyles: Record<ToastVariant, string> = {
  success: cn(
    // Background
    'bg-surface-primary',
    // Border
    'border border-success/50',
    // Left accent bar
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-success before:rounded-l-lg'
  ),
  error: cn(
    // Background
    'bg-surface-primary',
    // Border
    'border border-error/50',
    // Left accent bar
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-error before:rounded-l-lg'
  ),
  warning: cn(
    // Background
    'bg-surface-primary',
    // Border
    'border border-warning/50',
    // Left accent bar
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-warning before:rounded-l-lg'
  ),
  info: cn(
    // Background
    'bg-surface-primary',
    // Border
    'border border-info/50',
    // Left accent bar
    'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-info before:rounded-l-lg'
  ),
}

/**
 * Variant-specific icon colors
 */
const iconColorStyles: Record<ToastVariant, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
}

/**
 * Success icon (checkmark in circle)
 */
function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

/**
 * Error icon (X in circle)
 */
function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

/**
 * Warning icon (triangle with exclamation)
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

/**
 * Info icon (circle with i)
 */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  )
}

/**
 * Close icon (X)
 */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

/**
 * Render the appropriate icon for a variant
 */
function VariantIcon({ variant, className }: { variant: ToastVariant; className?: string }) {
  switch (variant) {
    case 'success':
      return <SuccessIcon className={className} />
    case 'error':
      return <ErrorIcon className={className} />
    case 'warning':
      return <WarningIcon className={className} />
    case 'info':
      return <InfoIcon className={className} />
  }
}

/**
 * Toast Component
 *
 * Displays notification messages with variant-specific styling and icons.
 */
export function Toast({
  variant = 'info',
  title,
  description,
  isOpen,
  onClose,
  duration = 5000,
  icon,
  showCloseButton = true,
  action,
  className,
  'data-testid': dataTestId,
}: ToastProps) {
  // Auto-close timer
  useEffect(() => {
    if (!isOpen || duration === 0 || !onClose) return

    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [isOpen, duration, onClose])

  // Handle close action
  const handleClose = useCallback(() => {
    onClose?.()
  }, [onClose])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    },
    [handleClose]
  )

  // Don't render if not open
  if (!isOpen) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid={dataTestId}
      onKeyDown={handleKeyDown}
      className={cn(
        // Layout
        'relative flex items-start gap-3 p-4 pl-5',
        // Sizing
        'w-full min-w-[320px] max-w-md',
        // Visual
        'rounded-lg shadow-lg',
        // Animation
        'animate-slide-in-up',
        // Variant-specific styles
        variantStyles[variant],
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icon || (
          <VariantIcon
            variant={variant}
            className={cn('h-5 w-5', iconColorStyles[variant])}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-medium text-text-primary leading-tight">
            {title}
          </h3>
        )}
        {description && (
          <p className={cn(
            'text-sm text-text-secondary',
            title && 'mt-1'
          )}>
            {description}
          </p>
        )}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              'mt-2 text-sm font-medium',
              iconColorStyles[variant],
              'hover:underline focus:outline-none focus:underline'
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {showCloseButton && onClose && (
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notification"
          className={cn(
            'flex-shrink-0',
            'p-1 -m-1',
            'rounded-md',
            'text-text-tertiary hover:text-text-primary',
            'transition-colors duration-150',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-primary focus-visible:ring-border'
          )}
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export default Toast
