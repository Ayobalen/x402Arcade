/**
 * Tooltip Component Types
 *
 * Type definitions for tooltip components.
 */

import type { ReactNode } from 'react';

/**
 * Tooltip placement options
 */
export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/**
 * Tooltip trigger options
 */
export type TooltipTrigger = 'hover' | 'click' | 'focus' | 'manual';

/**
 * Tooltip variant options
 */
export type TooltipVariant =
  | 'default'
  | 'dark'
  | 'light'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

/**
 * Tooltip Props Interface
 */
export interface TooltipProps {
  /**
   * Content to display in the tooltip
   */
  content: ReactNode;

  /**
   * Element that triggers the tooltip
   */
  children: ReactNode;

  /**
   * Placement of the tooltip relative to the trigger
   * @default 'top'
   */
  placement?: TooltipPlacement;

  /**
   * How the tooltip is triggered
   * - hover: Show on mouse enter, hide on mouse leave
   * - click: Toggle on click
   * - focus: Show on focus, hide on blur
   * - manual: Controlled via isOpen prop
   * @default 'hover'
   */
  trigger?: TooltipTrigger;

  /**
   * Visual variant of the tooltip
   * @default 'default'
   */
  variant?: TooltipVariant;

  /**
   * Whether the tooltip is open (for manual trigger)
   * @default undefined
   */
  isOpen?: boolean;

  /**
   * Callback when tooltip open state changes
   */
  onOpenChange?: (isOpen: boolean) => void;

  /**
   * Delay before showing tooltip (in ms)
   * @default 200
   */
  delay?: number;

  /**
   * Whether to show arrow pointing to trigger
   * @default true
   */
  showArrow?: boolean;

  /**
   * Whether tooltip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for tooltip content
   */
  className?: string;

  /**
   * Additional CSS classes for trigger wrapper
   */
  triggerClassName?: string;

  /**
   * Z-index for the tooltip
   * @default 50
   */
  zIndex?: number;

  /**
   * Offset from trigger element (in pixels)
   * @default 8
   */
  offset?: number;
}

/**
 * Popover Props Interface
 *
 * Similar to Tooltip but for more complex interactive content
 */
export interface PopoverProps extends Omit<TooltipProps, 'variant' | 'showArrow'> {
  /**
   * Popover title
   */
  title?: ReactNode;

  /**
   * Whether clicking outside closes the popover
   * @default true
   */
  closeOnClickOutside?: boolean;

  /**
   * Whether pressing Escape closes the popover
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Whether to show close button
   * @default false
   */
  showCloseButton?: boolean;

  /**
   * Width of the popover
   * @default 'auto'
   */
  width?: string | number;

  /**
   * Maximum width of the popover
   * @default '320px'
   */
  maxWidth?: string | number;
}
