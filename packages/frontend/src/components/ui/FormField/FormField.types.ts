/**
 * FormField Component Types
 *
 * Type definitions for form composition components.
 * Follows the design system's arcade/neon aesthetic.
 */

import type { ReactNode } from 'react';

/**
 * FormField Props Interface
 *
 * A wrapper component that provides consistent layout and styling
 * for form inputs with labels, helper text, and error messages.
 */
export interface FormFieldProps {
  /**
   * Unique identifier for the input field
   * Used to link label and helper text to the input
   */
  id?: string;

  /**
   * Label text for the input
   */
  label?: ReactNode;

  /**
   * Helper text shown below the input
   * Provides additional context or instructions
   */
  helperText?: ReactNode;

  /**
   * Error message to display
   * When provided, shows error styling
   */
  error?: ReactNode;

  /**
   * Whether the field is required
   * Adds a visual indicator to the label
   * @default false
   */
  required?: boolean;

  /**
   * Whether the field is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * The form input element
   * Can be Input, Select, Textarea, or any custom input
   */
  children: ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the label
   */
  labelClassName?: string;

  /**
   * Additional CSS classes for helper/error text
   */
  textClassName?: string;
}

/**
 * FormGroup Props Interface
 *
 * Groups multiple form fields together with optional heading and description.
 * Provides consistent spacing and layout for related form sections.
 */
export interface FormGroupProps {
  /**
   * Heading for the form group
   */
  title?: ReactNode;

  /**
   * Description text for the form group
   * Provides context about the grouped fields
   */
  description?: ReactNode;

  /**
   * Form fields to group together
   */
  children: ReactNode;

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Additional CSS classes for the heading
   */
  titleClassName?: string;

  /**
   * Additional CSS classes for the description
   */
  descriptionClassName?: string;

  /**
   * Spacing between form fields
   * @default 'md'
   */
  spacing?: 'sm' | 'md' | 'lg';
}
