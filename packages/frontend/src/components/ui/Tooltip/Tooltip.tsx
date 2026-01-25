/**
 * Tooltip Component
 *
 * A tooltip component that displays contextual information on hover, focus, or click.
 * Features smooth animations and arcade/neon styling.
 *
 * @example
 * // Basic tooltip
 * <Tooltip content="This is a helpful tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * @example
 * // Click trigger with custom placement
 * <Tooltip content="Click me!" trigger="click" placement="bottom">
 *   <span>Click for info</span>
 * </Tooltip>
 *
 * @example
 * // Error variant
 * <Tooltip content="Invalid input" variant="error" placement="right">
 *   <Input error />
 * </Tooltip>
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
import type { TooltipProps, TooltipVariant, TooltipPlacement } from './Tooltip.types';

/**
 * Variant styles for tooltip
 */
const variantStyles: Record<TooltipVariant, string> = {
  default: cn(
    'bg-surface-primary',
    'border border-border',
    'text-text-primary',
    'shadow-lg shadow-primary/10'
  ),
  dark: cn('bg-bg-primary', 'border border-border/50', 'text-text-primary', 'shadow-lg'),
  light: cn('bg-bg-secondary', 'border border-border', 'text-text-primary', 'shadow-md'),
  info: cn('bg-primary/20', 'border border-primary', 'text-primary', 'shadow-glow-cyan'),
  success: cn('bg-success/20', 'border border-success', 'text-success', 'shadow-glow-green'),
  warning: cn('bg-warning/20', 'border border-warning', 'text-warning', 'shadow-glow-orange'),
  error: cn('bg-error/20', 'border border-error', 'text-error', 'shadow-glow-red'),
};

/**
 * Animation variants for tooltip
 */
const tooltipVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -5,
    transition: { duration: 0.1 },
  },
};

/**
 * Calculate tooltip position based on trigger element and placement
 */
function calculatePosition(
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  placement: TooltipPlacement,
  offset: number
): { top: number; left: number } {
  const scrollX = window.pageXOffset;
  const scrollY = window.pageYOffset;

  let top = 0;
  let left = 0;

  // Parse placement (e.g., "top-start" -> ["top", "start"])
  const [side, align] = placement.split('-') as [string, string | undefined];

  switch (side) {
    case 'top':
      top = triggerRect.top + scrollY - tooltipHeight - offset;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipWidth / 2;
      break;
    case 'bottom':
      top = triggerRect.bottom + scrollY + offset;
      left = triggerRect.left + scrollX + triggerRect.width / 2 - tooltipWidth / 2;
      break;
    case 'left':
      top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipHeight / 2;
      left = triggerRect.left + scrollX - tooltipWidth - offset;
      break;
    case 'right':
      top = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipHeight / 2;
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
      left = triggerRect.right + scrollX - tooltipWidth;
    } else {
      top = triggerRect.bottom + scrollY - tooltipHeight;
    }
  }

  return { top, left };
}

/**
 * Tooltip Component
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      placement = 'top',
      trigger = 'hover',
      variant = 'default',
      isOpen: controlledIsOpen,
      onOpenChange,
      delay = 200,
      showArrow = true,
      disabled = false,
      className,
      triggerClassName,
      zIndex = 50,
      offset = 8,
    },
    ref
  ) => {
    // State for uncontrolled mode
    const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
    const isControlled = controlledIsOpen !== undefined;
    const isOpen = isControlled ? controlledIsOpen : uncontrolledIsOpen;

    // Refs
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<number>();

    // Position state
    const [position, setPosition] = useState({ top: 0, left: 0 });

    // Update open state
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

    // Update position when tooltip opens
    useEffect(() => {
      if (!isOpen || !triggerRef.current || !tooltipRef.current) return;

      const updatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();

        const pos = calculatePosition(
          triggerRect,
          tooltipRect.width,
          tooltipRect.height,
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

    // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Clone child and attach event handlers
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

        {/* Tooltip Portal */}
        {createPortal(
          <AnimatePresence>
            {isOpen && content && (
              <motion.div
                ref={(node) => {
                  tooltipRef.current = node;
                  if (typeof ref === 'function') {
                    ref(node);
                  } else if (ref) {
                    (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
                  }
                }}
                className={cn(
                  'fixed px-3 py-2 rounded-lg text-sm',
                  'max-w-xs pointer-events-none',
                  variantStyles[variant],
                  className
                )}
                style={{
                  top: position.top,
                  left: position.left,
                  zIndex,
                }}
                variants={tooltipVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                role="tooltip"
                aria-hidden={!isOpen}
              >
                {content}

                {/* Arrow */}
                {showArrow && (
                  <div
                    className={cn(
                      'absolute w-2 h-2 rotate-45',
                      variant === 'default' && 'bg-surface-primary border-l border-t border-border',
                      variant === 'dark' && 'bg-bg-primary border-l border-t border-border/50',
                      variant === 'light' && 'bg-bg-secondary border-l border-t border-border',
                      variant === 'info' && 'bg-primary/20 border-l border-t border-primary',
                      variant === 'success' && 'bg-success/20 border-l border-t border-success',
                      variant === 'warning' && 'bg-warning/20 border-l border-t border-warning',
                      variant === 'error' && 'bg-error/20 border-l border-t border-error',
                      placement.startsWith('top') && 'bottom-[-5px] left-1/2 -translate-x-1/2',
                      placement.startsWith('bottom') && 'top-[-5px] left-1/2 -translate-x-1/2',
                      placement.startsWith('left') && 'right-[-5px] top-1/2 -translate-y-1/2',
                      placement.startsWith('right') && 'left-[-5px] top-1/2 -translate-y-1/2'
                    )}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export default Tooltip;
