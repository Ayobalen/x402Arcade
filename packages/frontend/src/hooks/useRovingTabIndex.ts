/**
 * useRovingTabIndex Hook
 *
 * Implements the roving tabindex pattern for managing focus in toolbars, menubars,
 * and other composite widgets. Only one item in the collection has tabindex="0"
 * at a time, making the widget a single tab stop.
 *
 * WAI-ARIA Reference:
 * https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
 *
 * Features:
 * - Single tab stop for the entire widget
 * - Arrow key navigation between items
 * - Automatic focus management
 * - Supports horizontal and vertical orientation
 * - Home/End key support
 *
 * @example
 * ```tsx
 * function Toolbar() {
 *   const {
 *     currentIndex,
 *     getRovingProps,
 *     handleContainerKeyDown
 *   } = useRovingTabIndex({
 *     count: items.length,
 *     orientation: 'horizontal',
 *   });
 *
 *   return (
 *     <div role="toolbar" onKeyDown={handleContainerKeyDown}>
 *       {items.map((item, index) => (
 *         <button {...getRovingProps(index)}>
 *           {item.label}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseRovingTabIndexOptions {
  /** Total number of items */
  count: number;
  /** Initial focused index (default: 0) */
  initialIndex?: number;
  /** Navigation orientation (default: 'horizontal') */
  orientation?: 'horizontal' | 'vertical';
  /** Wrap navigation at edges (default: true) */
  wrap?: boolean;
  /** Loop through items (same as wrap, for API consistency) */
  loop?: boolean;
  /** Callback when focus changes */
  onFocusChange?: (index: number) => void;
}

export interface UseRovingTabIndexReturn {
  /** Currently focused item index */
  currentIndex: number;
  /** Set the focused index programmatically */
  setCurrentIndex: (index: number) => void;
  /** Get roving tabindex props for an item */
  getRovingProps: (index: number) => {
    tabIndex: number;
    onFocus: () => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
    ref: (element: HTMLElement | null) => void;
  };
  /** Handle keyboard events on container */
  handleContainerKeyDown: (event: React.KeyboardEvent) => void;
  /** Focus item at index */
  focusItem: (index: number) => void;
}

/**
 * Hook for implementing roving tabindex pattern
 */
export function useRovingTabIndex(options: UseRovingTabIndexOptions): UseRovingTabIndexReturn {
  const {
    count,
    initialIndex = 0,
    orientation = 'horizontal',
    wrap = true,
    loop = wrap, // Support both names
    onFocusChange,
  } = options;

  const [currentIndex, setCurrentIndexState] = useState(
    Math.max(0, Math.min(initialIndex, count - 1))
  );
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());

  /**
   * Set current index with callback
   */
  const setCurrentIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(count - 1, index));
      setCurrentIndexState(clampedIndex);
      if (onFocusChange) {
        onFocusChange(clampedIndex);
      }
    },
    [count, onFocusChange]
  );

  /**
   * Focus item at index
   */
  const focusItem = useCallback((index: number) => {
    const element = itemRefs.current.get(index);
    if (element) {
      element.focus();
    }
  }, []);

  /**
   * Navigate to next item
   */
  const navigateNext = useCallback(() => {
    setCurrentIndex((current) => {
      if (current >= count - 1) {
        return loop ? 0 : current;
      }
      return current + 1;
    });
  }, [count, loop, setCurrentIndex]);

  /**
   * Navigate to previous item
   */
  const navigatePrevious = useCallback(() => {
    setCurrentIndex((current) => {
      if (current <= 0) {
        return loop ? count - 1 : current;
      }
      return current - 1;
    });
  }, [count, loop, setCurrentIndex]);

  /**
   * Navigate to first item
   */
  const navigateFirst = useCallback(() => {
    setCurrentIndex(0);
  }, [setCurrentIndex]);

  /**
   * Navigate to last item
   */
  const navigateLast = useCallback(() => {
    setCurrentIndex(count - 1);
  }, [count, setCurrentIndex]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key } = event;

      // Determine which keys to use based on orientation
      const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
      const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

      switch (key) {
        case nextKey:
          event.preventDefault();
          navigateNext();
          break;

        case prevKey:
          event.preventDefault();
          navigatePrevious();
          break;

        case 'Home':
          event.preventDefault();
          navigateFirst();
          break;

        case 'End':
          event.preventDefault();
          navigateLast();
          break;

        default:
          // Don't prevent default for other keys
          break;
      }
    },
    [orientation, navigateNext, navigatePrevious, navigateFirst, navigateLast]
  );

  /**
   * Get roving tabindex props for an item
   */
  const getRovingProps = useCallback(
    (index: number) => {
      const isCurrent = index === currentIndex;

      return {
        tabIndex: isCurrent ? 0 : -1,
        onFocus: () => {
          setCurrentIndex(index);
        },
        onKeyDown: handleKeyDown,
        ref: (element: HTMLElement | null) => {
          if (element) {
            itemRefs.current.set(index, element);
          } else {
            itemRefs.current.delete(index);
          }
        },
      };
    },
    [currentIndex, handleKeyDown, setCurrentIndex]
  );

  /**
   * Handle keyboard events on container
   * (Alternative to adding onKeyDown to each item)
   */
  const handleContainerKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      handleKeyDown(event);
    },
    [handleKeyDown]
  );

  /**
   * Auto-focus current item when index changes
   */
  useEffect(() => {
    focusItem(currentIndex);
  }, [currentIndex, focusItem]);

  return {
    currentIndex,
    setCurrentIndex,
    getRovingProps,
    handleContainerKeyDown,
    focusItem,
  };
}

export default useRovingTabIndex;
