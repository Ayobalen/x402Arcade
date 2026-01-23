/**
 * Toast Provider Component
 *
 * Context provider for managing toast notifications globally throughout the app.
 * Wraps the application and provides the ToastContext for useToast hook.
 *
 * Features:
 * - Manages multiple toasts with unique IDs
 * - Configurable position and max toasts
 * - Auto-remove functionality
 * - Smooth animation via framer-motion
 *
 * @example
 * // Wrap your app with ToastProvider
 * <ToastProvider position="top-right" maxToasts={5}>
 *   <App />
 * </ToastProvider>
 *
 * // Then use the useToast hook in any component
 * const { toast } = useToast()
 * toast.success('Note saved successfully!')
 */

import {
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Toast } from './Toast'
import {
  ToastContext,
  type ToastOptions,
  type ToastContextValue,
} from './ToastContext'
import type { ToastData, ToastPosition } from './Toast.types'

// Re-export types from ToastContext for backward compatibility
export type { ToastOptions, ToastContextValue } from './ToastContext'
export { ToastContext } from './ToastContext'

/**
 * Toast Provider Props
 */
export interface ToastProviderProps {
  /** Children to wrap */
  children: ReactNode
  /** Position of toasts on screen */
  position?: ToastPosition
  /** Maximum number of toasts to show */
  maxToasts?: number
  /** Default duration for toasts (ms) */
  defaultDuration?: number
}

/**
 * Generate unique ID for toasts
 */
let toastCounter = 0
function generateToastId(): string {
  return `toast-${Date.now()}-${++toastCounter}`
}

/**
 * Position styles for the toast container
 */
const positionStyles: Record<ToastPosition, string> = {
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
}

/**
 * Animation variants for toast entrance/exit
 *
 * - Slide in from top or bottom edge depending on position
 * - Fade in/out with opacity
 * - Scale slightly for visual polish
 * - Respects reduced-motion preference via separate variants
 */
const toastVariants = {
  initial: (position: ToastPosition) => ({
    opacity: 0,
    y: position.startsWith('top') ? -20 : 20,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  exit: (position: ToastPosition) => ({
    opacity: 0,
    y: position.startsWith('top') ? -20 : 20,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: [0.4, 0, 1, 1],
    },
  }),
}

/**
 * Reduced motion variants - only opacity, no transforms
 * Used when user prefers reduced motion for accessibility
 */
const reducedMotionVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
}

/**
 * Toast Provider Component
 *
 * Provides toast state management and renders the toast container.
 */
export function ToastProvider({
  children,
  position = 'top-right',
  maxToasts = 5,
  defaultDuration = 5000,
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  // Detect user's reduced motion preference
  const prefersReducedMotion = useReducedMotion()

  /**
   * Add a new toast to the stack
   */
  const addToast = useCallback(
    (options: ToastOptions): string => {
      const id = generateToastId()

      const newToast: ToastData = {
        id,
        variant: options.variant || 'info',
        title: options.title,
        description: options.description,
        duration: options.duration ?? defaultDuration,
        action: options.action,
      }

      setToasts((current) => {
        // Remove oldest toasts if we exceed maxToasts
        const updatedToasts = [...current, newToast]
        if (updatedToasts.length > maxToasts) {
          return updatedToasts.slice(-maxToasts)
        }
        return updatedToasts
      })

      return id
    },
    [maxToasts, defaultDuration]
  )

  /**
   * Remove a specific toast by ID
   */
  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  /**
   * Clear all toasts
   */
  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  /**
   * Convenience toast methods for each variant
   */
  const toast = useMemo(
    () => ({
      success: (title: string, description?: ReactNode): string =>
        addToast({ variant: 'success', title, description }),
      error: (title: string, description?: ReactNode): string =>
        addToast({ variant: 'error', title, description }),
      warning: (title: string, description?: ReactNode): string =>
        addToast({ variant: 'warning', title, description }),
      info: (title: string, description?: ReactNode): string =>
        addToast({ variant: 'info', title, description }),
    }),
    [addToast]
  )

  /**
   * Context value
   */
  const contextValue = useMemo<ToastContextValue>(
    () => ({
      addToast,
      removeToast,
      clearToasts,
      toast,
    }),
    [addToast, removeToast, clearToasts, toast]
  )

  /**
   * Render toast container in a portal
   */
  const toastContainer =
    typeof window !== 'undefined'
      ? createPortal(
          <div
            className={cn(
              'fixed z-[100] flex flex-col gap-3 pointer-events-none',
              positionStyles[position]
            )}
            aria-live="polite"
            aria-label="Notifications"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((toastData) => (
                <motion.div
                  key={toastData.id}
                  custom={position}
                  variants={prefersReducedMotion ? reducedMotionVariants : toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout={!prefersReducedMotion}
                  className="pointer-events-auto"
                >
                  <Toast
                    variant={toastData.variant}
                    title={toastData.title}
                    description={toastData.description}
                    isOpen={true}
                    onClose={() => removeToast(toastData.id)}
                    duration={toastData.duration}
                    action={toastData.action}
                    data-testid={`toast-${toastData.id}`}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )
      : null

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {toastContainer}
    </ToastContext.Provider>
  )
}

export default ToastProvider
