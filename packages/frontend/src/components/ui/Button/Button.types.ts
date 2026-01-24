/**
 * Button Component Types
 *
 * Type definitions for the Button component.
 * Follows the design system's arcade/neon aesthetic.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Button variant options
 *
 * - `primary`: Main action buttons with cyan gradient/glow (default)
 * - `secondary`: Alternative actions with magenta accent
 * - `outline`: Border-only buttons for less emphasis
 * - `ghost`: Transparent background, text only
 * - `danger`: Destructive actions with red accent
 * - `success`: Positive actions with green accent
 */
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'

/**
 * Button size options
 *
 * - `xs`: Extra small (icon buttons, compact UI)
 * - `sm`: Small (secondary actions)
 * - `md`: Medium (default, most common)
 * - `lg`: Large (primary CTAs)
 * - `xl`: Extra large (hero sections)
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * Button Props Interface
 *
 * Extends native button attributes with custom props
 * for styling variants, sizes, and states.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * Size of the button
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * Whether the button should take full width of its container
   * @default false
   */
  fullWidth?: boolean

  /**
   * Loading state - shows spinner and disables interaction
   * @default false
   */
  isLoading?: boolean

  /**
   * Content to show when loading (replaces children)
   * @default 'Loading...'
   */
  loadingText?: string

  /**
   * Icon to show before the button text.
   * Will be automatically sized based on the button size.
   */
  leftIcon?: ReactNode

  /**
   * Icon to show after the button text.
   * Will be automatically sized based on the button size.
   */
  rightIcon?: ReactNode

  /**
   * When true, renders as an icon-only button with equal width/height
   * and appropriate padding for a square shape.
   * @default false
   */
  iconOnly?: boolean

  /**
   * Additional CSS classes to apply
   */
  className?: string

  /**
   * Button content
   */
  children?: ReactNode
}

/**
 * Props for the ButtonGroup component
 */
export interface ButtonGroupProps {
  /**
   * Buttons to group together
   */
  children: ReactNode

  /**
   * Size applied to all buttons in the group
   */
  size?: ButtonSize

  /**
   * Variant applied to all buttons in the group
   */
  variant?: ButtonVariant

  /**
   * Whether the group should be vertical
   * @default false
   */
  vertical?: boolean

  /**
   * Additional CSS classes
   */
  className?: string
}
