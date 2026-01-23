/**
 * Toast Context
 *
 * React context for toast notifications.
 * Separated from ToastProvider for better Fast Refresh compatibility.
 */

import { createContext, type ReactNode } from 'react'
import type { ToastVariant } from './Toast.types'

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
 * Toast Context
 *
 * Provides toast state management throughout the app.
 * Use the useToast hook to access this context.
 */
export const ToastContext = createContext<ToastContextValue | null>(null)
