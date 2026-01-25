/**
 * SkipLink Component
 *
 * Accessibility component that allows keyboard users to skip navigation
 * and jump directly to the main content area.
 *
 * Features:
 * - Hidden until focused (visible only on keyboard Tab)
 * - Positioned at the top of the page (first focusable element)
 * - WCAG 2.1 Level A compliance (SC 2.4.1 Bypass Blocks)
 * - Styled with retro arcade theme
 *
 * @example
 * ```tsx
 * // Add to Layout component before navigation
 * <SkipLink />
 * <Header />
 * <main id="main-content">...</main>
 * ```
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import type { SkipLinkProps } from './SkipLink.types';

/**
 * SkipLink Component
 *
 * Renders a "Skip to content" link that's hidden until focused.
 * Essential for keyboard navigation accessibility.
 *
 * @param props - Component props
 * @returns Skip link element
 */
export const SkipLink = forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ href = '#main-content', label = 'Skip to main content', className, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          // Screen reader only by default (sr-only)
          'sr-only-focusable',
          // Positioning - fixed to top-left when focused
          'fixed top-4 left-4 z-[9999]',
          // Layout
          'inline-block',
          'px-4 py-2',
          // Typography
          'text-sm font-medium',
          'text-white',
          // Background with arcade theme
          'bg-primary',
          // Border and radius
          'border border-primary-light',
          'rounded-lg',
          // Shadow with neon glow
          'shadow-lg shadow-primary/50',
          // Focus state
          'focus:outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
          // Transitions
          'transition-all duration-200',
          // Custom classes
          className
        )}
        {...props}
      >
        {label}
      </a>
    );
  }
);

SkipLink.displayName = 'SkipLink';

export default SkipLink;
