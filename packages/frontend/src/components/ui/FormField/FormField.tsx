/**
 * FormField Component
 *
 * A composition component that provides consistent layout for form inputs.
 * Handles labels, helper text, error messages, and required indicators.
 *
 * @example
 * // Basic usage with Input
 * <FormField label="Username" helperText="Choose a unique username">
 *   <Input placeholder="Enter username" />
 * </FormField>
 *
 * // With error state
 * <FormField
 *   label="Email"
 *   error="Invalid email format"
 *   required
 * >
 *   <Input type="email" error />
 * </FormField>
 *
 * // Custom input component
 * <FormField label="Bio">
 *   <textarea rows={4} className="w-full..." />
 * </FormField>
 */

import { forwardRef, useId, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/utils';
import type { FormFieldProps, FormGroupProps } from './FormField.types';

/**
 * Spacing styles for FormGroup
 */
const spacingStyles = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * FormField Component
 *
 * Wrapper component for form inputs with label and helper/error text.
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      id: providedId,
      label,
      helperText,
      error,
      required = false,
      disabled = false,
      children,
      className,
      labelClassName,
      textClassName,
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const generatedId = useId();
    const fieldId = providedId || generatedId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    // Clone the child element and inject necessary props
    const childElement = isValidElement(children)
      ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: fieldId,
          disabled:
            disabled || (children as React.ReactElement<Record<string, unknown>>).props?.disabled,
          'aria-invalid': !!error,
          'aria-describedby': error ? errorId : helperText ? helperId : undefined,
          'aria-required': required,
        })
      : children;

    return (
      <div ref={ref} className={cn('flex flex-col gap-1.5', className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium',
              disabled ? 'text-text-muted opacity-50' : 'text-text-secondary',
              labelClassName
            )}
          >
            {label}
            {required && (
              <span
                className="ml-1 text-error"
                aria-label="required"
                title="This field is required"
              >
                *
              </span>
            )}
          </label>
        )}

        {/* Input Element */}
        {childElement}

        {/* Error Message */}
        {error && (
          <p
            id={errorId}
            className={cn('text-sm text-error', textClassName)}
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}

        {/* Helper Text (only shown when no error) */}
        {helperText && !error && (
          <p id={helperId} className={cn('text-sm text-text-muted', textClassName)}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

/**
 * FormGroup Component
 *
 * Groups multiple form fields together with optional heading and description.
 * Provides consistent spacing and visual hierarchy.
 */
export const FormGroup = forwardRef<HTMLDivElement, FormGroupProps>(
  (
    {
      title,
      description,
      children,
      className,
      titleClassName,
      descriptionClassName,
      spacing = 'md',
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('flex flex-col gap-3', className)}>
        {/* Group Header */}
        {(title || description) && (
          <div className="flex flex-col gap-1">
            {title && (
              <h3 className={cn('text-base font-semibold text-text-primary', titleClassName)}>
                {title}
              </h3>
            )}
            {description && (
              <p className={cn('text-sm text-text-muted', descriptionClassName)}>{description}</p>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className={cn('flex flex-col', spacingStyles[spacing])}>{children}</div>
      </div>
    );
  }
);

FormGroup.displayName = 'FormGroup';

export default FormField;
