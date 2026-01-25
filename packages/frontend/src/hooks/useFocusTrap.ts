/**
 * useFocusTrap Hook
 *
 * Custom hook for focus trapping within a container.
 * Implements WAI-ARIA modal dialog pattern for keyboard accessibility.
 *
 * Features:
 * - Traps Tab and Shift+Tab within the container
 * - Auto-focuses first focusable element on mount
 * - Returns focus to previously focused element on unmount
 * - Handles dynamically added/removed focusable elements
 * - Supports custom initial focus element
 *
 * @module hooks/useFocusTrap
 *
 * @example
 * ```tsx
 * function Dialog({ isOpen, onClose }) {
 *   const dialogRef = useRef<HTMLDivElement>(null);
 *
 *   useFocusTrap(dialogRef, isOpen, {
 *     autoFocus: true,
 *     returnFocus: true,
 *     initialFocus: '.primary-button'
 *   });
 *
 *   return (
 *     <div ref={dialogRef} role="dialog">
 *       <button className="primary-button">OK</button>
 *       <button onClick={onClose}>Cancel</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Selector for all focusable elements within a container
 */
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'audio[controls]',
  'video[controls]',
  '[contenteditable]:not([contenteditable="false"])',
].join(',');

/**
 * Options for useFocusTrap hook
 */
export interface UseFocusTrapOptions {
  /**
   * Auto-focus first element when trap activates
   * @default true
   */
  autoFocus?: boolean;

  /**
   * Return focus to trigger element on deactivate
   * @default true
   */
  returnFocus?: boolean;

  /**
   * Initial element to focus (CSS selector or HTMLElement)
   * If not provided, focuses first focusable element
   * @default undefined
   */
  initialFocus?: string | HTMLElement;

  /**
   * Callback when focus trap activates
   */
  onActivate?: () => void;

  /**
   * Callback when focus trap deactivates
   */
  onDeactivate?: () => void;
}

/**
 * Custom hook for focus trapping within a container
 *
 * Implements WAI-ARIA modal dialog pattern for keyboard accessibility.
 * Prevents keyboard focus from leaving the container until deactivated.
 *
 * @param containerRef - Ref to the container element to trap focus within
 * @param isActive - Whether the focus trap is currently active
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * const dialogRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(dialogRef, isOpen);
 * ```
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  isActive: boolean,
  options: UseFocusTrapOptions = {}
): void {
  const { autoFocus = true, returnFocus = true, initialFocus, onActivate, onDeactivate } = options;

  // Store the element that had focus before the trap activated
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    // Store currently focused element to restore later
    if (returnFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }

    /**
     * Get all focusable elements within the container
     * Filters out hidden or disabled elements
     */
    const getFocusableElements = (): HTMLElement[] => {
      return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
        (el) => {
          // Filter out elements that are hidden or have display:none
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }
      );
    };

    /**
     * Focus the initial element or first focusable element
     */
    const focusInitialElement = () => {
      if (!autoFocus) return;

      const focusableElements = getFocusableElements();

      if (initialFocus) {
        // Focus specific element
        const initialElement =
          typeof initialFocus === 'string'
            ? container.querySelector<HTMLElement>(initialFocus)
            : initialFocus;

        if (initialElement && focusableElements.includes(initialElement)) {
          initialElement.focus();
          return;
        }
      }

      // Focus first focusable element
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        // If no focusable elements, focus the container itself
        container.setAttribute('tabindex', '-1');
        container.focus();
      }
    };

    /**
     * Handle Tab key to cycle focus within container
     * Implements circular tab navigation
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift + Tab: Move to previous element (or wrap to last)
      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          !focusableElements.includes(activeElement as HTMLElement)
        ) {
          event.preventDefault();
          lastElement.focus();
        }
      }
      // Tab: Move to next element (or wrap to first)
      else {
        if (
          activeElement === lastElement ||
          !focusableElements.includes(activeElement as HTMLElement)
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    /**
     * Handle focus leaving the container (edge case handler)
     * Brings focus back if it somehow escapes
     */
    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        // Focus escaped the container, bring it back
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    };

    // Activate focus trap
    focusInitialElement();
    container.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', handleFocusIn);

    // Call onActivate callback
    onActivate?.();

    // Cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', handleFocusIn);

      // Return focus to previously focused element
      if (returnFocus && previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }

      // Call onDeactivate callback
      onDeactivate?.();
    };
  }, [isActive, containerRef, autoFocus, returnFocus, initialFocus, onActivate, onDeactivate]);
}

/**
 * Export FOCUSABLE_SELECTORS for use in other components
 */
export { FOCUSABLE_SELECTORS };

export default useFocusTrap;
