/**
 * useColorScheme Hook
 *
 * Detects and manages the user's color scheme preference (light/dark mode).
 * Supports system preference detection, manual overrides, and localStorage persistence.
 *
 * Features:
 * - Detects prefers-color-scheme media query
 * - Allows manual override with localStorage persistence
 * - Applies dark mode by default (Web3 aesthetic)
 * - Syncs with system changes in real-time
 * - TypeScript-safe with full type exports
 *
 * @example
 * ```tsx
 * const { colorScheme, setColorScheme, systemPreference, isOverridden } = useColorScheme();
 *
 * // Toggle between light and dark
 * const toggle = () => {
 *   setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
 * };
 *
 * // Reset to system preference
 * const resetToSystem = () => {
 *   setColorScheme(null);
 * };
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================
// TYPES
// ============================================================

/**
 * Color scheme options
 */
export type ColorScheme = 'light' | 'dark';

/**
 * Color scheme preference (null = use system preference)
 */
export type ColorSchemePreference = ColorScheme | null;

/**
 * Hook return type
 */
export interface UseColorSchemeResult {
  /**
   * The currently active color scheme ('light' or 'dark')
   */
  colorScheme: ColorScheme;

  /**
   * Set the color scheme preference
   * Pass null to reset to system preference
   */
  setColorScheme: (scheme: ColorSchemePreference) => void;

  /**
   * Toggle between light and dark mode
   */
  toggleColorScheme: () => void;

  /**
   * The user's system preference ('light' or 'dark')
   */
  systemPreference: ColorScheme;

  /**
   * Whether the user has manually overridden the system preference
   */
  isOverridden: boolean;

  /**
   * Reset to system preference
   */
  resetToSystem: () => void;

  /**
   * Whether dark mode is active
   */
  isDark: boolean;

  /**
   * Whether light mode is active
   */
  isLight: boolean;
}

/**
 * Hook options
 */
export interface UseColorSchemeOptions {
  /**
   * The localStorage key to use for persistence
   * @default 'x402-color-scheme'
   */
  storageKey?: string;

  /**
   * Default color scheme to use when no preference is set
   * @default 'dark'
   */
  defaultScheme?: ColorScheme;

  /**
   * Whether to apply the color scheme to the document
   * @default true
   */
  applyToDocument?: boolean;

  /**
   * The attribute to set on the document element
   * @default 'data-theme'
   */
  attribute?: string;

  /**
   * Whether to add a class to the document element
   * @default true
   */
  enableClass?: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const STORAGE_KEY = 'x402-color-scheme';
const DEFAULT_SCHEME: ColorScheme = 'dark';

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the system color scheme preference
 */
function getSystemPreference(): ColorScheme {
  if (typeof window === 'undefined') {
    return DEFAULT_SCHEME;
  }

  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
  return mediaQuery?.matches ? 'dark' : 'light';
}

/**
 * Get stored preference from localStorage
 */
function getStoredPreference(key: string): ColorSchemePreference {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return null;
  } catch {
    // localStorage may be unavailable (private browsing, etc.)
    return null;
  }
}

/**
 * Store preference in localStorage
 */
function setStoredPreference(key: string, scheme: ColorSchemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (scheme === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, scheme);
    }
  } catch {
    // localStorage may be unavailable
  }
}

/**
 * Apply color scheme to document
 */
function applyToDocument(
  scheme: ColorScheme,
  attribute: string = 'data-theme',
  enableClass: boolean = true
): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;

  // Set data attribute
  root.setAttribute(attribute, scheme);

  // Set class
  if (enableClass) {
    root.classList.remove('light', 'dark');
    root.classList.add(scheme);
  }

  // Update meta theme-color for mobile browsers
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', scheme === 'dark' ? '#0a0a0a' : '#ffffff');
  }
}

// ============================================================
// HOOK IMPLEMENTATION
// ============================================================

/**
 * Hook to detect and manage color scheme preference
 *
 * @param options - Configuration options
 * @returns Color scheme state and control functions
 */
export function useColorScheme(options: UseColorSchemeOptions = {}): UseColorSchemeResult {
  const {
    storageKey = STORAGE_KEY,
    defaultScheme = DEFAULT_SCHEME,
    applyToDocument: shouldApply = true,
    attribute = 'data-theme',
    enableClass = true,
  } = options;

  // Track system preference
  const [systemPreference, setSystemPreference] = useState<ColorScheme>(() =>
    getSystemPreference()
  );

  // Track user override preference
  const [userPreference, setUserPreference] = useState<ColorSchemePreference>(() =>
    getStoredPreference(storageKey)
  );

  // Calculate active color scheme
  const colorScheme = useMemo<ColorScheme>(() => {
    // User preference takes priority
    if (userPreference !== null) {
      return userPreference;
    }
    // Fall back to system preference or default
    return systemPreference ?? defaultScheme;
  }, [userPreference, systemPreference, defaultScheme]);

  // Whether user has overridden system preference
  const isOverridden = userPreference !== null;

  // Convenience booleans
  const isDark = colorScheme === 'dark';
  const isLight = colorScheme === 'light';

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

    if (!mediaQuery) {
      return;
    }

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    // Legacy browsers (Safari < 14)
    // @ts-expect-error - Legacy API
    mediaQuery.addListener?.(handleChange);
    return () => {
      // @ts-expect-error - Legacy API
      mediaQuery.removeListener?.(handleChange);
    };
  }, []);

  // Apply color scheme to document when it changes
  useEffect(() => {
    if (shouldApply) {
      applyToDocument(colorScheme, attribute, enableClass);
    }
  }, [colorScheme, shouldApply, attribute, enableClass]);

  // Set color scheme preference
  const setColorScheme = useCallback(
    (scheme: ColorSchemePreference) => {
      setUserPreference(scheme);
      setStoredPreference(storageKey, scheme);
    },
    [storageKey]
  );

  // Toggle between light and dark
  const toggleColorScheme = useCallback(() => {
    const newScheme = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(newScheme);
  }, [colorScheme, setColorScheme]);

  // Reset to system preference
  const resetToSystem = useCallback(() => {
    setColorScheme(null);
  }, [setColorScheme]);

  return {
    colorScheme,
    setColorScheme,
    toggleColorScheme,
    systemPreference,
    isOverridden,
    resetToSystem,
    isDark,
    isLight,
  };
}

// ============================================================
// SSR-SAFE INITIALIZATION SCRIPT
// ============================================================

/**
 * Script to inject before page load to prevent flash of incorrect theme.
 * Use in _document.tsx (Next.js) or index.html.
 *
 * @example
 * // In index.html:
 * <script>
 *   (function() {
 *     // Paste getColorSchemeInitScript() output here
 *   })();
 * </script>
 */
export function getColorSchemeInitScript(
  storageKey: string = STORAGE_KEY,
  defaultScheme: ColorScheme = DEFAULT_SCHEME,
  attribute: string = 'data-theme'
): string {
  return `
    (function() {
      try {
        var stored = localStorage.getItem('${storageKey}');
        var scheme = stored || (
          window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : '${defaultScheme}'
        );
        document.documentElement.setAttribute('${attribute}', scheme);
        document.documentElement.classList.add(scheme);
      } catch (e) {
        document.documentElement.setAttribute('${attribute}', '${defaultScheme}');
        document.documentElement.classList.add('${defaultScheme}');
      }
    })();
  `.trim();
}

export default useColorScheme;
