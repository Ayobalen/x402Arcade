/**
 * Dropdown Component
 *
 * A headless dropdown menu component with keyboard navigation and accessibility.
 * Uses retro arcade/neon theme styling.
 *
 * @example
 * <Dropdown
 *   trigger={<button>Open Menu</button>}
 *   items={[
 *     { label: 'Profile', icon: <UserIcon />, onClick: () => {} },
 *     { label: 'Disconnect', destructive: true, onClick: () => {} }
 *   ]}
 * />
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { DropdownProps, DropdownItemProps } from './Dropdown.types';

/**
 * Dropdown Menu Component
 */
export function Dropdown({
  trigger,
  items,
  align = 'right',
  open: controlledOpen,
  onOpenChange,
  className,
  menuClassName,
}: DropdownProps) {
  // Uncontrolled state
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  // Use controlled or uncontrolled state
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Set open state (works for both controlled and uncontrolled)
  const setOpen = useCallback(
    (open: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(open);
      }
      onOpenChange?.(open);
    },
    [isControlled, onOpenChange]
  );

  // Toggle dropdown
  const toggle = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  // Close dropdown
  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    // Small delay to prevent immediate close on trigger click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, close]);

  // Handle item click
  const handleItemClick = useCallback(
    (item: DropdownItemProps) => {
      if (item.disabled) return;
      item.onClick?.();
      close();
    },
    [close]
  );

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && toggle()}
      >
        {trigger}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            // Position
            'absolute z-50 mt-2 min-w-[12rem]',
            align === 'left' && 'left-0',
            align === 'right' && 'right-0',
            align === 'center' && 'left-1/2 -translate-x-1/2',
            // Styling - Retro Arcade Theme
            'bg-[#16162a]',
            'border border-[#2d2d4a]',
            'rounded-lg',
            'shadow-lg',
            // Neon glow effect
            'shadow-[0_0_20px_rgba(0,255,255,0.15)]',
            // Animation
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
            'duration-200',
            menuClassName
          )}
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {items.map((item, index) => (
              <DropdownItem key={index} item={item} onClick={() => handleItemClick(item)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Dropdown Item Component
 */
function DropdownItem({ item, onClick }: { item: DropdownItemProps; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={item.disabled}
      className={cn(
        // Layout
        'w-full px-4 py-2.5 flex items-center gap-3',
        'text-left',
        // Typography
        'text-sm font-medium',
        // Default state
        'text-white/90',
        'bg-transparent',
        // Hover state
        !item.disabled && [
          'hover:bg-white/5',
          item.destructive
            ? 'hover:text-[#ff4444] hover:bg-[#ff4444]/10'
            : 'hover:text-[#00ffff] hover:bg-[#00ffff]/10',
        ],
        // Destructive styling
        item.destructive && 'text-[#ff4444]/90',
        // Disabled state
        item.disabled && 'opacity-50 cursor-not-allowed',
        // Transitions
        'transition-all duration-150',
        item.className
      )}
      role="menuitem"
    >
      {item.icon && <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>}
      <span>{item.label}</span>
    </button>
  );
}

Dropdown.displayName = 'Dropdown';

export default Dropdown;
