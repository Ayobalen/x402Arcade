/**
 * Modal Component Types
 *
 * Type definitions for the Modal component.
 * Follows the design system's arcade/neon aesthetic.
 */

import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Modal size options
 *
 * - `sm`: Small modal for alerts and confirmations
 * - `md`: Medium modal (default)
 * - `lg`: Large modal for forms
 * - `xl`: Extra large modal for complex content
 * - `full`: Full screen modal
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

/**
 * Modal Props Interface
 *
 * Props for the main Modal component.
 */
export interface ModalProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * Whether the modal is open
   */
  isOpen: boolean

  /**
   * Callback when the modal should close
   */
  onClose: () => void

  /**
   * Modal size
   * @default 'md'
   */
  size?: ModalSize

  /**
   * Whether clicking the backdrop closes the modal
   * @default true
   */
  closeOnBackdrop?: boolean

  /**
   * Whether pressing Escape closes the modal
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * Whether to show the close button
   * @default true
   */
  showCloseButton?: boolean

  /**
   * Modal title (renders in header)
   */
  title?: ReactNode

  /**
   * Modal content
   */
  children: ReactNode

  /**
   * Additional CSS classes for the modal container
   */
  className?: string

  /**
   * Additional CSS classes for the backdrop
   */
  backdropClassName?: string

  /**
   * Whether to center the modal vertically
   * @default true
   */
  centered?: boolean

  /**
   * Whether to prevent scroll on body when modal is open
   * @default true
   */
  preventScroll?: boolean

  /**
   * Whether to trap focus within the modal
   * Critical for accessibility - keeps keyboard navigation inside the modal
   * @default true
   */
  trapFocus?: boolean

  /**
   * Whether to auto-focus the first focusable element when modal opens
   * @default true
   */
  autoFocus?: boolean

  /**
   * Whether to return focus to the trigger element when modal closes
   * @default true
   */
  returnFocus?: boolean

  /**
   * Selector or element to focus initially when modal opens
   * If not provided, focuses the first focusable element
   */
  initialFocus?: string | HTMLElement
}

/**
 * Modal Backdrop Props Interface
 */
export interface ModalBackdropProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Whether the backdrop is visible
   */
  isOpen: boolean

  /**
   * Callback when backdrop is clicked
   */
  onClick?: () => void

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Modal Header Props Interface
 */
export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  /**
   * Whether to show the close button
   */
  showCloseButton?: boolean
  /**
   * Callback when close button is clicked
   */
  onClose?: () => void
}

/**
 * Modal Body Props Interface
 */
export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}

/**
 * Modal Footer Props Interface
 */
export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
}
