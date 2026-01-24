/**
 * Layout Component Types
 */

import type { ReactNode } from 'react';

/**
 * Layout component props
 */
export interface LayoutProps {
  /**
   * Page content to render inside the layout
   */
  children: ReactNode;

  /**
   * Optional className to apply to the main content area
   */
  className?: string;

  /**
   * Whether to show the header
   * @default true
   */
  showHeader?: boolean;

  /**
   * Whether to show the footer
   * @default true
   */
  showFooter?: boolean;

  /**
   * Whether to show the balance in the header
   * @default false
   */
  showBalance?: boolean;

  /**
   * Custom header content (replaces default header if provided)
   */
  customHeader?: ReactNode;

  /**
   * Custom footer content (replaces default footer if provided)
   */
  customFooter?: ReactNode;

  /**
   * Maximum width constraint for content area
   * @default 'full' - No max width, uses full viewport
   */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

  /**
   * Padding for the content area
   * @default true
   */
  contentPadding?: boolean;

  /**
   * Whether to show the background effects (grid, glows)
   * @default true
   */
  showBackgroundEffects?: boolean;

  /**
   * Glow intensity for background effects
   * @default 'medium'
   */
  glowIntensity?: 'low' | 'medium' | 'high';
}
