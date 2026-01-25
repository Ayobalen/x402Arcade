/**
 * ConfirmModal Component Types
 *
 * Type definitions for confirmation modal dialogs.
 */

import type { ReactNode } from 'react';
import type { ButtonVariant } from '../Button/Button.types';

/**
 * ConfirmModal Props Interface
 *
 * A specialized modal for confirmation dialogs with pre-styled
 * confirm and cancel buttons.
 */
export interface ConfirmModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void | Promise<void>;

  /**
   * Modal title
   */
  title: ReactNode;

  /**
   * Modal content/message
   */
  children: ReactNode;

  /**
   * Confirm button text
   * @default 'Confirm'
   */
  confirmText?: string;

  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Confirm button variant
   * @default 'primary'
   */
  confirmVariant?: ButtonVariant;

  /**
   * Whether the confirm button should show loading state
   * Useful for async operations
   * @default false
   */
  isLoading?: boolean;

  /**
   * Loading text to show during async operation
   * @default 'Processing...'
   */
  loadingText?: string;

  /**
   * Whether to close modal on confirm
   * Set to false if you want to handle closing manually
   * @default true
   */
  closeOnConfirm?: boolean;

  /**
   * Whether to close modal when clicking outside
   * @default true
   */
  closeOnBackdrop?: boolean;

  /**
   * Modal size
   * @default 'sm'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * FormModal Props Interface
 *
 * A specialized modal for form submissions with validation.
 */
export interface FormModalProps {
  /**
   * Whether the modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Callback when form is submitted
   * Receives the form data
   */
  onSubmit: (data: FormData) => void | Promise<void>;

  /**
   * Modal title
   */
  title: ReactNode;

  /**
   * Form content (form fields)
   */
  children: ReactNode;

  /**
   * Submit button text
   * @default 'Submit'
   */
  submitText?: string;

  /**
   * Cancel button text
   * @default 'Cancel'
   */
  cancelText?: string;

  /**
   * Submit button variant
   * @default 'primary'
   */
  submitVariant?: ButtonVariant;

  /**
   * Whether the form is currently submitting
   * Shows loading state on submit button
   * @default false
   */
  isSubmitting?: boolean;

  /**
   * Loading text during submission
   * @default 'Submitting...'
   */
  loadingText?: string;

  /**
   * Whether to close modal on successful submit
   * Set to false if you want to handle closing manually
   * @default true
   */
  closeOnSubmit?: boolean;

  /**
   * Whether to close modal when clicking outside
   * @default false (prevent accidental form loss)
   */
  closeOnBackdrop?: boolean;

  /**
   * Modal size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Form ID for external form submission
   */
  formId?: string;
}
