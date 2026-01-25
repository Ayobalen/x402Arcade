/**
 * useHighContrastMode Hook
 *
 * Manages high contrast mode state for improved accessibility.
 * Applies high contrast theme when enabled by user or system preference.
 *
 * Features:
 * - Detects system preference (prefers-contrast: more)
 * - Manual toggle with localStorage persistence
 * - CSS class application to root element
 * - TypeScript typed return values
 *
 * @example
 * ```tsx
 * function AccessibilitySettings() {
 *   const { isHighContrast, toggle, enable, disable } = useHighContrastMode();
 *
 *   return (
 *     <button onClick={toggle}>
 *       {isHighContrast ? 'Disable' : 'Enable'} High Contrast
 *     </button>
 *   );
 * }
 * ```
 */

import { useEffect, useState, useCallback } from 'react';

const HIGH_CONTRAST_CLASS = 'high-contrast-mode';
const HIGH_CONTRAST_KEY = 'x402arcade-high-contrast';

/**
 * Check if system prefers high contrast
 */
function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for prefers-contrast: more
  const prefersContrast = window.matchMedia('(prefers-contrast: more)').matches;

  // Check for Windows High Contrast mode (legacy)
  const windowsHighContrast = window.matchMedia('(-ms-high-contrast: active)').matches;

  return prefersContrast || windowsHighContrast;
}

/**
 * Get stored high contrast preference from localStorage
 */
function getStoredPreference(): boolean | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(HIGH_CONTRAST_KEY);
    return stored === 'true' ? true : stored === 'false' ? false : null;
  } catch {
    return null;
  }
}

/**
 * Store high contrast preference in localStorage
 */
function setStoredPreference(value: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(HIGH_CONTRAST_KEY, String(value));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Apply or remove high contrast class from document root
 */
function applyHighContrastClass(enabled: boolean): void {
  if (typeof document === 'undefined') return;

  if (enabled) {
    document.documentElement.classList.add(HIGH_CONTRAST_CLASS);
  } else {
    document.documentElement.classList.remove(HIGH_CONTRAST_CLASS);
  }
}

export interface UseHighContrastModeReturn {
  /** Whether high contrast mode is currently enabled */
  isHighContrast: boolean;
  /** Toggle high contrast mode on/off */
  toggle: () => void;
  /** Enable high contrast mode */
  enable: () => void;
  /** Disable high contrast mode */
  disable: () => void;
  /** Whether the preference is from system settings (vs manual override) */
  isSystemPreference: boolean;
}

/**
 * Hook for managing high contrast mode
 */
export function useHighContrastMode(): UseHighContrastModeReturn {
  // Initialize state
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    // Check stored preference first
    const stored = getStoredPreference();
    if (stored !== null) return stored;

    // Fall back to system preference
    return getSystemPreference();
  });

  const [isSystemPreference, setIsSystemPreference] = useState<boolean>(() => {
    return getStoredPreference() === null;
  });

  // Enable high contrast mode
  const enable = useCallback(() => {
    setIsHighContrast(true);
    setIsSystemPreference(false);
    setStoredPreference(true);
    applyHighContrastClass(true);
  }, []);

  // Disable high contrast mode
  const disable = useCallback(() => {
    setIsHighContrast(false);
    setIsSystemPreference(false);
    setStoredPreference(false);
    applyHighContrastClass(false);
  }, []);

  // Toggle high contrast mode
  const toggle = useCallback(() => {
    if (isHighContrast) {
      disable();
    } else {
      enable();
    }
  }, [isHighContrast, enable, disable]);

  // Apply initial class on mount
  useEffect(() => {
    applyHighContrastClass(isHighContrast);
  }, [isHighContrast]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Only listen if user hasn't manually overridden
    if (!isSystemPreference) return;

    const mediaQuery = window.matchMedia('(prefers-contrast: more)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = e.matches;
      setIsHighContrast(matches);
      applyHighContrastClass(matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [isSystemPreference]);

  return {
    isHighContrast,
    toggle,
    enable,
    disable,
    isSystemPreference,
  };
}

export default useHighContrastMode;
