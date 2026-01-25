/**
 * Type definitions for SkipLink component
 */

import type { ComponentPropsWithoutRef } from 'react';

/**
 * Props for the SkipLink component
 */
export interface SkipLinkProps extends Omit<ComponentPropsWithoutRef<'a'>, 'href'> {
  /**
   * Target element ID to skip to
   * @default '#main-content'
   */
  href?: string;

  /**
   * Accessible label for the skip link
   * @default 'Skip to main content'
   */
  label?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}
