/**
 * Switch Component
 *
 * An arcade-themed toggle switch with neon glow effects.
 * Accessible keyboard navigation and screen reader support.
 *
 * @example
 * <Switch
 *   checked={enabled}
 *   onCheckedChange={setEnabled}
 *   label="Enable Effects"
 *   description="Turn on visual effects"
 * />
 */

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { SwitchProps } from './Switch.types';

/**
 * Switch/Toggle Component
 */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  size = 'md',
  variant = 'cyan',
  className,
  id: providedId,
  name,
  'data-testid': testId,
}: SwitchProps) {
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = description ? `${id}-description` : undefined;

  // Size classes
  const sizeClasses = {
    sm: {
      track: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4',
      text: 'text-xs',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
      text: 'text-sm',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translate: 'translate-x-7',
      text: 'text-base',
    },
  }[size];

  // Variant colors (retro arcade theme)
  const variantClasses = {
    cyan: {
      checked: 'bg-[#00ffff] shadow-[0_0_10px_rgba(0,255,255,0.5)]',
      unchecked: 'bg-[#2d2d4a]',
      thumb: 'bg-white',
    },
    magenta: {
      checked: 'bg-[#ff00ff] shadow-[0_0_10px_rgba(255,0,255,0.5)]',
      unchecked: 'bg-[#2d2d4a]',
      thumb: 'bg-white',
    },
    green: {
      checked: 'bg-[#00ff00] shadow-[0_0_10px_rgba(0,255,0,0.5)]',
      unchecked: 'bg-[#2d2d4a]',
      thumb: 'bg-white',
    },
    yellow: {
      checked: 'bg-[#ffff00] shadow-[0_0_10px_rgba(255,255,0,0.5)]',
      unchecked: 'bg-[#2d2d4a]',
      thumb: 'bg-white',
    },
  }[variant];

  const handleToggle = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={cn('flex items-start gap-3', className)}>
      {/* Switch Track */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-describedby={descriptionId}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        data-testid={testId}
        className={cn(
          // Base styles
          sizeClasses.track,
          'relative inline-flex items-center rounded-full',
          'border border-[#2d2d4a]',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-[#00ffff]/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]',
          // State-based colors
          checked ? variantClasses.checked : variantClasses.unchecked,
          // Disabled state
          disabled && 'opacity-40 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        {/* Thumb */}
        <span
          className={cn(
            // Base styles
            sizeClasses.thumb,
            variantClasses.thumb,
            'inline-block rounded-full',
            'transform transition-transform duration-200 ease-in-out',
            'shadow-md',
            // Position
            checked ? sizeClasses.translate : 'translate-x-0.5'
          )}
          aria-hidden="true"
        />
      </button>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1 select-none">
          {label && (
            <label
              id={`${id}-label`}
              htmlFor={id}
              className={cn(
                'block font-medium text-white/90',
                sizeClasses.text,
                !disabled && 'cursor-pointer',
                disabled && 'opacity-60'
              )}
              onClick={() => !disabled && handleToggle()}
            >
              {label}
            </label>
          )}
          {description && (
            <p
              id={descriptionId}
              className={cn(
                'mt-0.5 text-white/60',
                size === 'sm' && 'text-xs',
                size === 'md' && 'text-xs',
                size === 'lg' && 'text-sm',
                disabled && 'opacity-60'
              )}
            >
              {description}
            </p>
          )}
        </div>
      )}

      {/* Hidden input for forms */}
      {name && (
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
      )}
    </div>
  );
}

Switch.displayName = 'Switch';

export default Switch;
