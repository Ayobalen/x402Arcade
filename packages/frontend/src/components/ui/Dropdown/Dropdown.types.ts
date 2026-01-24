/**
 * Dropdown Component Types
 *
 * Type definitions for the Dropdown component.
 */

import type { ReactNode } from 'react';

/**
 * Dropdown menu item props
 */
export interface DropdownItemProps {
  /** Item label */
  label: string;
  /** Icon element to display before label */
  icon?: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether the item is destructive (uses danger/error styling) */
  destructive?: boolean;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * Dropdown menu props
 */
export interface DropdownProps {
  /** Trigger element that opens the dropdown */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownItemProps[];
  /** Alignment of dropdown relative to trigger */
  align?: 'left' | 'right' | 'center';
  /** Whether dropdown is open (controlled mode) */
  open?: boolean;
  /** Callback when open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;
  /** Custom className for dropdown container */
  className?: string;
  /** Custom className for dropdown menu */
  menuClassName?: string;
}
