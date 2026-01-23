/**
 * Modal Component
 *
 * A modal dialog component with arcade/neon styling.
 * Supports backdrop click-to-close, escape key, and body scroll prevention.
 * Features smooth entrance and exit animations using Framer Motion.
 *
 * @example
 * // Basic modal
 * <Modal isOpen={isOpen} onClose={handleClose} title="Confirm Action">
 *   <p>Are you sure you want to continue?</p>
 * </Modal>
 *
 * // Modal with custom content
 * <Modal isOpen={isOpen} onClose={handleClose} size="lg">
 *   <ModalHeader>Custom Header</ModalHeader>
 *   <ModalBody>Modal content here</ModalBody>
 *   <ModalFooter>
 *     <Button onClick={handleClose}>Cancel</Button>
 *     <Button variant="primary">Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 */

import { forwardRef, useEffect, useCallback, useRef, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'
import type {
  ModalProps,
  ModalBackdropProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
  ModalSize,
} from './Modal.types'

/**
 * Selector for all focusable elements within a container
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',')

/**
 * Custom hook for focus trapping within a container
 * Implements WAI-ARIA modal dialog pattern
 *
 * Features:
 * - Traps Tab and Shift+Tab within the container
 * - Auto-focuses first focusable element on mount
 * - Returns focus to previously focused element on unmount
 * - Handles dynamically added/removed focusable elements
 */
function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  options: {
    /** Auto-focus first element when trap activates */
    autoFocus?: boolean
    /** Return focus to trigger element on deactivate */
    returnFocus?: boolean
    /** Initial element to focus (selector or element) */
    initialFocus?: string | HTMLElement
  } = {}
): void {
  const { autoFocus = true, returnFocus = true, initialFocus } = options

  // Store the element that had focus before the trap activated
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current

    // Store currently focused element to restore later
    if (returnFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement
    }

    /**
     * Get all focusable elements within the container
     */
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS))
        .filter((el) => {
          // Filter out elements that are hidden or have display:none
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden'
        })
    }

    /**
     * Focus the initial element or first focusable element
     */
    const focusInitialElement = () => {
      if (!autoFocus) return

      const focusableElements = getFocusableElements()

      if (initialFocus) {
        // Focus specific element
        const initialElement = typeof initialFocus === 'string'
          ? container.querySelector<HTMLElement>(initialFocus)
          : initialFocus

        if (initialElement && focusableElements.includes(initialElement)) {
          initialElement.focus()
          return
        }
      }

      // Focus first focusable element
      if (focusableElements.length > 0) {
        focusableElements[0].focus()
      } else {
        // If no focusable elements, focus the container itself
        container.setAttribute('tabindex', '-1')
        container.focus()
      }
    }

    /**
     * Handle Tab key to cycle focus within container
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) {
        event.preventDefault()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement

      // Shift + Tab: Move to previous element
      if (event.shiftKey) {
        if (activeElement === firstElement || !focusableElements.includes(activeElement as HTMLElement)) {
          event.preventDefault()
          lastElement.focus()
        }
      }
      // Tab: Move to next element
      else {
        if (activeElement === lastElement || !focusableElements.includes(activeElement as HTMLElement)) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    /**
     * Handle focus leaving the container (for edge cases)
     */
    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        // Focus escaped the container, bring it back
        const focusableElements = getFocusableElements()
        if (focusableElements.length > 0) {
          focusableElements[0].focus()
        }
      }
    }

    // Set up focus trap
    focusInitialElement()
    container.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    // Cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)

      // Return focus to previously focused element
      if (returnFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus()
      }
    }
  }, [isActive, containerRef, autoFocus, returnFocus, initialFocus])
}

/**
 * Animation variants for the backdrop
 * Smooth fade in/out effect
 */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
}

/**
 * Animation variants for the modal content
 * Scale and fade entrance with smooth exit
 */
const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  },
}

/**
 * Reduced motion variants - instant transitions for accessibility
 * Users with prefers-reduced-motion will see instant state changes
 */
const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.01 } },
  exit: { opacity: 0, transition: { duration: 0.01 } },
}

/**
 * Close Icon Component
 */
function CloseIcon({ className }: { className?: string }) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

/**
 * Hook to check if user prefers reduced motion
 */
function usePrefersReducedMotion(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false

  const mediaQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  return mediaQuery?.matches ?? false
}

/**
 * Backdrop styles for the overlay
 */
const backdropStyles = cn(
  // Fixed positioning covering entire viewport
  'fixed inset-0 z-50',
  // Dark semi-transparent background
  'bg-bg-primary/85',
  // Glassmorphism effect
  'backdrop-blur-sm',
)

/**
 * Modal container styles
 */
const modalContainerStyles = cn(
  // Fixed positioning
  'fixed inset-0 z-50',
  // Flexbox for centering
  'flex items-center justify-center',
  // Padding from viewport edges
  'p-4',
  // Pointer events for backdrop clicks
  'pointer-events-none',
)

/**
 * Modal content styles
 */
const modalContentStyles = cn(
  // Layout
  'relative flex flex-col',
  // Background with surface color
  'bg-surface-primary',
  // Border with subtle glow
  'border border-border',
  // Shadow for elevation with cyan glow
  'shadow-lg shadow-primary/10',
  // Border radius
  'rounded-xl',
  // Max height with scroll
  'max-h-[calc(100vh-2rem)]',
  // Enable pointer events
  'pointer-events-auto',
  // Will change for GPU acceleration
  'will-change-transform',
)

/**
 * Size-specific styles
 */
const sizeStyles: Record<ModalSize, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
  xl: 'w-full max-w-xl',
  full: 'w-full max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]',
}

/**
 * Animated Modal Backdrop Component
 *
 * Renders the semi-transparent overlay behind the modal with fade animation
 */
const AnimatedBackdrop = motion.div

/**
 * Modal Backdrop Component (for direct use)
 *
 * Renders the semi-transparent overlay behind the modal
 */
export const ModalBackdrop = forwardRef<HTMLDivElement, ModalBackdropProps>(
  ({ isOpen, onClick, className, ...props }, ref) => {
    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn(backdropStyles, isOpen ? 'opacity-100' : 'opacity-0', className)}
        onClick={onClick}
        aria-hidden="true"
        {...props}
      />
    )
  }
)

ModalBackdrop.displayName = 'ModalBackdrop'

/**
 * Modal Header Component
 */
export const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, children, showCloseButton, onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          'px-6 py-4',
          'border-b border-border/50',
          className
        )}
        {...props}
      >
        <div className="text-lg font-semibold text-text-primary">{children}</div>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center',
              'h-8 w-8 rounded-lg',
              'text-text-muted hover:text-text-primary',
              'hover:bg-surface-secondary',
              'transition-colors duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
            aria-label="Close modal"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    )
  }
)

ModalHeader.displayName = 'ModalHeader'

/**
 * Modal Body Component
 */
export const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-6 py-4 overflow-y-auto', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalBody.displayName = 'ModalBody'

/**
 * Modal Footer Component
 */
export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-end gap-3',
          'px-6 py-4',
          'border-t border-border/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ModalFooter.displayName = 'ModalFooter'

/**
 * Modal Component
 *
 * Animated modal with Framer Motion for smooth entrance and exit animations.
 * Respects prefers-reduced-motion accessibility preference.
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps & { 'data-testid'?: string }>(
  (
    {
      isOpen,
      onClose,
      size = 'md',
      closeOnBackdrop = true,
      closeOnEscape = true,
      showCloseButton = true,
      title,
      children,
      className,
      backdropClassName,
      centered = true,
      preventScroll = true,
      'data-testid': testId,
      ...props
    },
    ref
  ) => {
    // Check for reduced motion preference
    const prefersReducedMotion = usePrefersReducedMotion()

    // Select appropriate animation variants
    const currentBackdropVariants = prefersReducedMotion ? reducedMotionVariants : backdropVariants
    const currentModalVariants = prefersReducedMotion ? reducedMotionVariants : modalVariants

    // Handle backdrop click
    const handleBackdropClick = useCallback(() => {
      if (closeOnBackdrop) {
        onClose()
      }
    }, [closeOnBackdrop, onClose])

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeOnEscape, onClose])

    // Prevent body scroll when modal is open
    useEffect(() => {
      if (!preventScroll) return

      if (isOpen) {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = originalOverflow
        }
      }
    }, [isOpen, preventScroll])

    // Render modal in portal with AnimatePresence for exit animations
    return createPortal(
      <AnimatePresence mode="wait">
        {isOpen && (
          <>
            {/* Animated Backdrop */}
            <AnimatedBackdrop
              key="modal-backdrop"
              className={cn(backdropStyles, backdropClassName)}
              onClick={handleBackdropClick}
              aria-hidden="true"
              variants={currentBackdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            />

            {/* Modal Container */}
            <div
              className={cn(modalContainerStyles, !centered && 'items-start pt-20')}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
            >
              {/* Animated Modal Content */}
              <motion.div
                ref={ref}
                className={cn(
                  modalContentStyles,
                  sizeStyles[size],
                  className
                )}
                onClick={(e) => e.stopPropagation()}
                variants={currentModalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                data-testid={testId}
                style={props.style}
              >
                {/* Title Header */}
                {title && (
                  <ModalHeader
                    showCloseButton={showCloseButton}
                    onClose={onClose}
                  >
                    <span id="modal-title">{title}</span>
                  </ModalHeader>
                )}

                {/* Content */}
                {children}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )
  }
)

Modal.displayName = 'Modal'

export default Modal
