/**
 * VisuallyHidden Component
 *
 * Hides content visually while keeping it accessible to screen readers.
 * Follows the "visually hidden" pattern from WebAIM and A11y Project.
 *
 * Use cases:
 * - Skip navigation links
 * - Form labels that are visually redundant
 * - Descriptive text for icons
 * - Screen reader announcements
 *
 * @example
 * ```tsx
 * // Icon button with accessible label
 * <button>
 *   <CloseIcon />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 *
 * // Skip navigation link
 * <VisuallyHidden>
 *   <a href="#main">Skip to main content</a>
 * </VisuallyHidden>
 * ```
 */

import React from 'react';
import { srOnly } from '@/styles/tokens/accessibility';

export interface VisuallyHiddenProps {
  /** Content to hide visually but keep accessible */
  children: React.ReactNode;
  /** Optional element type (default: span) */
  as?: keyof JSX.IntrinsicElements;
  /** Optional className for additional styling */
  className?: string;
  /** Make focusable (useful for skip links) */
  focusable?: boolean;
}

/**
 * Styles for visually hidden content
 */
const visuallyHiddenStyles: React.CSSProperties = {
  position: srOnly.position as React.CSSProperties['position'],
  width: srOnly.width,
  height: srOnly.height,
  padding: srOnly.padding,
  margin: srOnly.margin,
  overflow: srOnly.overflow as React.CSSProperties['overflow'],
  clip: srOnly.clip,
  whiteSpace: srOnly.whiteSpace as React.CSSProperties['whiteSpace'],
  borderWidth: srOnly.borderWidth,
};

/**
 * Styles for focusable visually hidden content (e.g., skip links)
 * Becomes visible when focused
 */
const focusableVisuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  left: '-10000px',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
};

const focusableVisibleStyles: React.CSSProperties = {
  position: 'static',
  width: 'auto',
  height: 'auto',
  overflow: 'visible',
};

/**
 * VisuallyHidden Component
 */
export function VisuallyHidden({
  children,
  as: Element = 'span',
  className,
  focusable = false,
}: VisuallyHiddenProps) {
  if (focusable) {
    // For focusable elements (skip links), we need a different approach
    // that shows the element when it receives focus
    return (
      <Element
        className={className}
        style={{
          ...focusableVisuallyHiddenStyles,
          // CSS to show on focus
          // @ts-expect-error - CSS pseudo-class styling
          ':focus': focusableVisibleStyles,
        }}
        // Add tabIndex if needed (skip links should be first tab stop)
        {...(Element === 'a' ? {} : { tabIndex: focusable ? 0 : undefined })}
      >
        {children}
      </Element>
    );
  }

  return (
    <Element className={className} style={visuallyHiddenStyles}>
      {children}
    </Element>
  );
}

/**
 * Alternative CSS class-based implementation
 * Use this if you prefer Tailwind classes over inline styles
 */
export const visuallyHiddenClasses =
  'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]';

/**
 * Focusable visually hidden classes (for skip links)
 */
export const focusableVisuallyHiddenClasses =
  'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-toast focus:px-4 focus:py-2 focus:bg-surface-primary focus:text-text-primary focus:rounded-lg focus:shadow-glow-cyan';

export default VisuallyHidden;
