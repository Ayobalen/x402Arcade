/**
 * Popover Component
 *
 * A popover component for displaying interactive content.
 * Similar to Tooltip but supports more complex content and interactions.
 *
 * @example
 * // Basic popover
 * <Popover
 *   content={<div>Popover content</div>}
 *   title="Information"
 * >
 *   <Button>Click me</Button>
 * </Popover>
 *
 * @example
 * // Complex interactive content
 * <Popover
 *   trigger="click"
 *   placement="bottom-start"
 *   content={
 *     <div className="flex flex-col gap-2">
 *       <Button size="sm">Action 1</Button>
 *       <Button size="sm">Action 2</Button>
 *     </div>
 *   }
 * >
 *   <Button>Actions</Button>
 * </Popover>
 */

import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  cloneElement,
  isValidElement,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PopoverProps } from './Tooltip.types';

/**
 * Close Icon Component
 */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/**
 * Animation variants for popover
 */
const popoverVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: { duration: 0.15 },
  },
};

/**
 * Calculate popover position
 */
function calculatePosition(
  triggerRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  placement: string,
  offset: number
): { top: number; left: number } {
  const scrollX = window.pageXOffset;
  const scrollY = window.pageYOffset;

  let top = 0;
  let left = 0;

  const [side, align] = placement.split('-') as [string, string | undefined];

  switch (side) {
    case 'top':
      top = triggerRect.top + scrollY - popoverHeight - offset;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - popoverWidth / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - popoverWidth / 2;
      break;
    case 'left':
      top = triggerRect.top + scrollY + triggerRect.height / 2 - popoverHeight / 2;
      left = triggerRect.left + scrollX - popoverWidth - offset;
      break;
    case 'right':
      top = triggerRect.top + scrollY + triggerRect.height / 2 - popoverHeight / 2;
      left = triggerRect.right + scrollX + offset;
      break;
  }

  // Handle alignment
  if (align === 'start') {
    if (side === 'top' || side === 'bottom') {
      left = triggerRect.left + scrollX;
    } else {
      top = triggerRect.top + scrollY;
    }
  } else if (align === 'end') {
    if (side === 'top' || side === 'bottom') {
      left = triggerRect.right + scrollX - popoverWidth;
    } else {
      top = triggerRect.bottom + scrollY - popoverHeight;
    }
  }

  return { top, left };
}

/**
 * Popover Component
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      content,
      title,
      children,
      placement = 'bottom',
      trigger = 'click',
      isOpen: controlledIsOpen,
      onOpenChange,
      delay = 0,
      disabled = false,
      closeOnClickOutside = true,
      closeOnEscape = true,
      showCloseButton = false,
      className,
      triggerClassName,
      zIndex = 50,
      offset = 8,
      width = 'auto',
      maxWidth = '320px',
    },
    ref
  ) => {
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

    const triggerRef = useRef<HTMLElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number>();

    const [position, setPosition] = useState({ top: 0, left: 0 });

    const setIsOpen = useCallback(
      (open: boolean) => {
        if (disabled) return;

        if (!isControlled) {
          setUncontrolledIsOpen(open);
        }
        onOpenChange?.(open);
      },
      [isControlled, disabled, onOpenChange]
    );

    // Update position
    useEffect(() => {
      if (!isOpen || !triggerRef.current || !popoverRef.current) return;

      const updatePosition = () => {
        if (!triggerRef.current || !popoverRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();

        const pos = calculatePosition(
          triggerRect,
          popoverRect.width,
          popoverRect.height,
          placement,
          offset
        );

        setPosition(pos);
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }, [isOpen, placement, offset]);

    // Handle click outside
    useEffect(() => {
      if (!isOpen || !closeOnClickOutside) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          popoverRef.current &&
          !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closeOnClickOutside, setIsOpen]);

    // Handle escape key
    useEffect(() => {
      if (!isOpen || !closeOnEscape) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, closeOnEscape, setIsOpen]);

    // Event handlers
    const handleMouseEnter = useCallback(() => {
      if (trigger !== 'hover') return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsOpen(true);
      }, delay);
    }, [trigger, delay, setIsOpen]);

    const handleMouseLeave = useCallback(() => {
      if (trigger !== 'hover') return;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsOpen(false);
    }, [trigger, setIsOpen]);

    const handleClick = useCallback(() => {
      if (trigger !== 'click') return;
      setIsOpen(!isOpen);
    }, [trigger, isOpen, setIsOpen]);

    const handleFocus = useCallback(() => {
      if (trigger !== 'focus') return;
      setIsOpen(true);
    }, [trigger, setIsOpen]);

    const handleBlur = useCallback(() => {
      if (trigger !== 'focus') return;
      setIsOpen(false);
    }, [trigger, setIsOpen]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Clone trigger element
    const triggerElement = isValidElement(children)
      ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          ref: triggerRef,
          onMouseEnter: handleMouseEnter,
          onMouseLeave: handleMouseLeave,
          onClick: handleClick,
          onFocus: handleFocus,
          onBlur: handleBlur,
          className: cn(
            (children as React.ReactElement<Record<string, unknown>>).props?.className,
            triggerClassName
          ),
        })
      : children;

    return (
      <>
        {/* Trigger Element */}
        {triggerElement}

        {/* Popover Portal */}
        {createPortal(
          <AnimatePresence>
            {isOpen && content && (
              <motion.div
                ref={(node) => {
                  popoverRef.current = node;
                  if (typeof ref === 'function') {
                    ref(node);
                  } else if (ref) {
                    (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                  }
                }}
                className={cn(
                  'fixed rounded-lg',
                  'bg-surface-primary',
                  'border border-border',
                  'shadow-lg shadow-primary/10',
                  'pointer-events-auto',
                  className
                )}
                style={{
                  top: position.top,
                  left: position.left,
                  zIndex,
                  width: typeof width === 'number' ? `${width}px` : width,
                  maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
                }}
                variants={popoverVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="dialog"
                aria-modal="false"
              >
                {/* Header */}
                {(title || showCloseButton) && (
                  <div
                    className={cn(
                      'flex items-center justify-between',
                      'px-4 py-3',
                      'border-b border-border/50'
                    )}
                  >
                    {title && (
                      <div className="text-sm font-semibold text-text-primary">{title}</div>
                    )}
                    {showCloseButton && (
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center justify-center',
                          'h-6 w-6 rounded-md',
                          'text-text-muted hover:text-text-primary',
                          'hover:bg-surface-secondary',
                          'transition-colors duration-150',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        )}
                        aria-label="Close popover"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="px-4 py-3 text-sm text-text-secondary">{content}</div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }
);

Popover.displayName = 'Popover';

export default Popover;
