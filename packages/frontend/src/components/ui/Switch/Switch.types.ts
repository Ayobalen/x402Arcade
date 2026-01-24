/**
 * Switch Component Types
 *
 * Types for the arcade-themed toggle switch component.
 */

export interface SwitchProps {
  /** Whether the switch is checked */
  checked: boolean;
  /** Callback when switch state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Label text */
  label?: string;
  /** Description text shown below label */
  description?: string;
  /** Whether the switch is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color theme */
  variant?: 'cyan' | 'magenta' | 'green' | 'yellow';
  /** Additional class name */
  className?: string;
  /** ID for the switch input */
  id?: string;
  /** Name for the switch input */
  name?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}
