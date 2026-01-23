/**
 * Input Component Types
 *
 * Type definitions for the Input component.
 * Follows the design system's arcade/neon aesthetic.
 */

import type { InputHTMLAttributes, ReactNode } from 'react'

/**
 * Input variant options
 *
 * - `default`: Standard dark surface background with subtle border
 * - `filled`: Lighter background for more visual presence
 * - `outline`: Transparent background with prominent border
 */
export type InputVariant = 'default' | 'filled' | 'outline'

/**
 * Input size options
 *
 * - `sm`: Small inputs for compact UI
 * - `md`: Medium size (default)
 * - `lg`: Large inputs for prominent forms
 */
export type InputSize = 'sm' | 'md' | 'lg'

/**
 * Input Props Interface
 *
 * Extends native input attributes with custom props
 * for styling variants, sizes, and states.
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: InputVariant

  /**
   * Size of the input
   * @default 'md'
   */
  size?: InputSize

  /**
   * Whether the input should take full width of its container
   * @default true
   */
  fullWidth?: boolean

  /**
   * Error state - adds red border and glow
   */
  error?: boolean

  /**
   * Error message to display below the input
   */
  errorMessage?: string

  /**
   * Success state - adds green border and glow
   */
  success?: boolean

  /**
   * Icon to show at the start of the input
   */
  leftIcon?: ReactNode

  /**
   * Icon to show at the end of the input
   */
  rightIcon?: ReactNode

  /**
   * Label text displayed above the input
   */
  label?: string

  /**
   * Helper text displayed below the input
   */
  helperText?: string

  /**
   * Additional CSS classes to apply to the container
   */
  containerClassName?: string

  /**
   * Additional CSS classes to apply to the input element
   */
  className?: string
}

/**
 * Input Group Props Interface
 *
 * For grouping related inputs together
 */
export interface InputGroupProps {
  /**
   * Inputs to group together
   */
  children: ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}
