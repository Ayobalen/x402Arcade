/**
 * ThemeSwitcher Component Type Definitions
 */

import { type ThemeVariation } from '../../../stores/themeStore';

export interface ThemeSwitcherProps {
  /**
   * Display mode: 'panel' (full panel) or 'compact' (icon button with dropdown)
   * @default 'panel'
   */
  mode?: 'panel' | 'compact';

  /**
   * Callback when theme changes
   */
  onThemeChange?: (theme: ThemeVariation) => void;

  /**
   * Optional CSS class name
   */
  className?: string;
}

export interface ThemePreviewProps {
  /**
   * Theme variation to preview
   */
  variation: ThemeVariation;

  /**
   * Whether this theme is currently active
   */
  isActive: boolean;

  /**
   * Callback when preview is clicked
   */
  onClick: () => void;
}
