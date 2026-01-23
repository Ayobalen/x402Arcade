/**
 * Toast Component Types
 *
 * Type definitions for the Toast notification component.
 * Supports multiple variants for different notification types.
 */

import type { ReactNode } from 'react'

/**
 * Toast variant options
 *
 * - `success`: Positive confirmations with green styling
 * - `error`: Error states with red styling
 * - `warning`: Warning messages with orange styling
 * - `info`: Informational messages with cyan/blue styling
 */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

/**
 * Toast position options
 *
 * Determines where the toast appears on screen
 */
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/**
 * Toast Props Interface
 *
 * Configuration options for the Toast component.
 */
export interface ToastProps {
  /**
   * Visual style variant determining colors and icon
   * @default 'info'
   */
  variant?: ToastVariant

  /**
   * Title text displayed prominently
   */
  title?: string

  /**
   * Description text for additional context
   */
  description?: ReactNode

  /**
   * Whether the toast is currently visible
   */
  isOpen: boolean

  /**
   * Callback when the toast should close
   */
  onClose?: () => void

  /**
   * Duration in milliseconds before auto-close (0 to disable)
   * @default 5000
   */
  duration?: number

  /**
   * Custom icon to override the default variant icon
   */
  icon?: ReactNode

  /**
   * Whether to show a close button
   * @default true
   */
  showCloseButton?: boolean

  /**
   * Optional action button
   */
  action?: {
    label: string
    onClick: () => void
  }

  /**
   * Additional CSS classes to apply
   */
  className?: string

  /**
   * Data test ID for testing
   */
  'data-testid'?: string
}

/**
 * Toast Container Props Interface
 *
 * Props for the container that manages toast positioning.
 */
export interface ToastContainerProps {
  /**
   * Position of toasts on screen
   * @default 'top-right'
   */
  position?: ToastPosition

  /**
   * Maximum number of toasts to show at once
   * @default 5
   */
  maxToasts?: number

  /**
   * Children (Toast components)
   */
  children?: ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Individual toast data for managing multiple toasts
 */
export interface ToastData {
  id: string
  variant: ToastVariant
  title?: string
  description?: ReactNode
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}
