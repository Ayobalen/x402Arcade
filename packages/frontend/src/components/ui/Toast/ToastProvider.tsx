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
  createContext,
  useCallback,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Toast } from './Toast'
import type { ToastData, ToastPosition, ToastVariant } from './Toast.types'

/**
 * Options for creating a new toast
 */
export interface ToastOptions {
  /** Visual variant for the toast */
  variant?: ToastVariant
  /** Title text */
  title?: string
  /** Description text */
  description?: ReactNode
  /** Duration in milliseconds (0 for persistent) */
  duration?: number
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Toast context value interface
 */
export interface ToastContextValue {
  /** Add a new toast */
  addToast: (options: ToastOptions) => string
  /** Remove a toast by ID */
  removeToast: (id: string) => void
  /** Remove all toasts */
  clearToasts: () => void
  /** Convenience methods for each variant */
  toast: {
    success: (title: string, description?: ReactNode) => string
    error: (title: string, description?: ReactNode) => string
    warning: (title: string, description?: ReactNode) => string
    info: (title: string, description?: ReactNode) => string
  }
}

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
 * Create the Toast context
 */
export const ToastContext = createContext<ToastContextValue | null>(null)

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
                  variants={toastVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
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
