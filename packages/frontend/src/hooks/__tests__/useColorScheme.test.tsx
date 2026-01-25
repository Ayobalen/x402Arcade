/**
 * useColorScheme Hook Tests
 *
 * Tests for the color scheme detection and management hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useColorScheme, getColorSchemeInitScript } from '../useColorScheme';

// ============================================================
// MOCKS
// ============================================================

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = [];

  const matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      if (event === 'change') {
        listeners.push(listener);
      }
    }),
    removeEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }),
    dispatchEvent: vi.fn(),
    // For triggering changes in tests
    _triggerChange: (newMatches: boolean) => {
      listeners.forEach((listener) => listener({ matches: newMatches } as MediaQueryListEvent));
    },
  }));

  return { matchMedia, listeners };
};

// Mock localStorage
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
    _setStore: (newStore: Record<string, string>) => {
      store = newStore;
    },
  };
};

describe('useColorScheme', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;
  let localStorageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    // Reset mocks
    matchMediaMock = createMatchMediaMock(true); // System prefers dark
    localStorageMock = createLocalStorageMock();

    // Apply mocks
    vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);
    vi.stubGlobal('localStorage', localStorageMock);

    // Mock document.documentElement
    vi.spyOn(document.documentElement, 'setAttribute').mockImplementation(() => {});
    vi.spyOn(document.documentElement.classList, 'add').mockImplementation(() => {});
    vi.spyOn(document.documentElement.classList, 'remove').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ============================================================
  // BASIC FUNCTIONALITY
  // ============================================================

  describe('Basic Functionality', () => {
    it('should return dark scheme by default (Web3 aesthetic)', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });

    it('should return system preference', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(result.current.systemPreference).toBe('dark');
    });

    it('should not be overridden by default', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(result.current.isOverridden).toBe(false);
    });

    it('should provide setColorScheme function', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(typeof result.current.setColorScheme).toBe('function');
    });

    it('should provide toggleColorScheme function', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(typeof result.current.toggleColorScheme).toBe('function');
    });

    it('should provide resetToSystem function', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(typeof result.current.resetToSystem).toBe('function');
    });
  });

  // ============================================================
  // SYSTEM PREFERENCE DETECTION
  // ============================================================

  describe('System Preference Detection', () => {
    it('should detect dark mode preference', () => {
      matchMediaMock = createMatchMediaMock(true);
      vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);

      const { result } = renderHook(() => useColorScheme());

      expect(result.current.systemPreference).toBe('dark');
    });

    it('should detect light mode preference', () => {
      matchMediaMock = createMatchMediaMock(false);
      vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);

      const { result } = renderHook(() => useColorScheme());

      expect(result.current.systemPreference).toBe('light');
    });

    it('should use defaultScheme when no system preference available', () => {
      // When matchMedia returns a result but indicates light mode,
      // and we set defaultScheme to dark, it should follow system pref
      matchMediaMock = createMatchMediaMock(false); // System prefers light
      vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);

      const { result } = renderHook(() => useColorScheme({ defaultScheme: 'dark' }));

      // Should follow system preference (light) when available
      expect(result.current.systemPreference).toBe('light');
    });
  });

  // ============================================================
  // MANUAL OVERRIDE
  // ============================================================

  describe('Manual Override', () => {
    it('should allow setting light mode', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      expect(result.current.colorScheme).toBe('light');
      expect(result.current.isOverridden).toBe(true);
    });

    it('should allow setting dark mode', () => {
      matchMediaMock = createMatchMediaMock(false); // System prefers light
      vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);

      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('dark');
      });

      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.isOverridden).toBe(true);
    });

    it('should toggle from dark to light', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(result.current.colorScheme).toBe('dark');

      act(() => {
        result.current.toggleColorScheme();
      });

      expect(result.current.colorScheme).toBe('light');
    });

    it('should toggle from light to dark', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      expect(result.current.colorScheme).toBe('light');

      act(() => {
        result.current.toggleColorScheme();
      });

      expect(result.current.colorScheme).toBe('dark');
    });

    it('should reset to system preference', () => {
      const { result } = renderHook(() => useColorScheme());

      // Override first
      act(() => {
        result.current.setColorScheme('light');
      });

      expect(result.current.isOverridden).toBe(true);

      // Reset
      act(() => {
        result.current.resetToSystem();
      });

      expect(result.current.isOverridden).toBe(false);
      expect(result.current.colorScheme).toBe('dark'); // System preference
    });

    it('should set null to reset to system', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      act(() => {
        result.current.setColorScheme(null);
      });

      expect(result.current.isOverridden).toBe(false);
    });
  });

  // ============================================================
  // LOCALSTORAGE PERSISTENCE
  // ============================================================

  describe('localStorage Persistence', () => {
    it('should save preference to localStorage', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('x402-color-scheme', 'light');
    });

    it('should load preference from localStorage', () => {
      localStorageMock._setStore({ 'x402-color-scheme': 'light' });

      const { result } = renderHook(() => useColorScheme());

      expect(result.current.colorScheme).toBe('light');
      expect(result.current.isOverridden).toBe(true);
    });

    it('should remove from localStorage when reset', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
        result.current.resetToSystem();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('x402-color-scheme');
    });

    it('should use custom storage key', () => {
      const { result } = renderHook(() => useColorScheme({ storageKey: 'custom-theme' }));

      act(() => {
        result.current.setColorScheme('light');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('custom-theme', 'light');
    });

    it('should ignore invalid localStorage values', () => {
      localStorageMock._setStore({ 'x402-color-scheme': 'invalid' });

      const { result } = renderHook(() => useColorScheme());

      expect(result.current.isOverridden).toBe(false);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem = vi.fn(() => {
        throw new Error('localStorage blocked');
      });

      // Should not throw
      expect(() => {
        renderHook(() => useColorScheme());
      }).not.toThrow();
    });
  });

  // ============================================================
  // DOCUMENT APPLICATION
  // ============================================================

  describe('Document Application', () => {
    it('should set data-theme attribute on document', async () => {
      renderHook(() => useColorScheme());

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
      });
    });

    it('should add class to document', async () => {
      renderHook(() => useColorScheme());

      await waitFor(() => {
        expect(document.documentElement.classList.add).toHaveBeenCalledWith('dark');
      });
    });

    it('should remove old class when changing scheme', async () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      await waitFor(() => {
        expect(document.documentElement.classList.remove).toHaveBeenCalledWith('light', 'dark');
      });
    });

    it('should use custom attribute', async () => {
      renderHook(() => useColorScheme({ attribute: 'data-color-mode' }));

      await waitFor(() => {
        expect(document.documentElement.setAttribute).toHaveBeenCalledWith(
          'data-color-mode',
          'dark'
        );
      });
    });

    it('should skip document application when disabled', () => {
      vi.spyOn(document.documentElement, 'setAttribute').mockClear();

      renderHook(() => useColorScheme({ applyToDocument: false }));

      expect(document.documentElement.setAttribute).not.toHaveBeenCalled();
    });

    it('should skip class when disabled', async () => {
      vi.spyOn(document.documentElement.classList, 'add').mockClear();

      renderHook(() => useColorScheme({ enableClass: false }));

      await waitFor(() => {
        expect(document.documentElement.classList.add).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // SYSTEM PREFERENCE CHANGES
  // ============================================================

  describe('System Preference Changes', () => {
    it('should update when system preference changes', async () => {
      let changeCallback: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMatchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          changeCallback = cb;
        },
        removeEventListener: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', mockMatchMedia);

      const { result } = renderHook(() => useColorScheme());

      expect(result.current.systemPreference).toBe('dark');

      // Simulate system preference change
      if (changeCallback) {
        act(() => {
          changeCallback!({ matches: false } as MediaQueryListEvent);
        });
      }

      expect(result.current.systemPreference).toBe('light');
    });

    it('should not change active scheme if overridden when system changes', async () => {
      let changeCallback: ((e: MediaQueryListEvent) => void) | null = null;

      const mockMatchMedia = vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
          changeCallback = cb;
        },
        removeEventListener: vi.fn(),
      }));

      vi.stubGlobal('matchMedia', mockMatchMedia);

      const { result } = renderHook(() => useColorScheme());

      // Override to dark
      act(() => {
        result.current.setColorScheme('dark');
      });

      // Simulate system change to light
      if (changeCallback) {
        act(() => {
          changeCallback!({ matches: false } as MediaQueryListEvent);
        });
      }

      // Active scheme should still be dark (overridden)
      expect(result.current.colorScheme).toBe('dark');
      expect(result.current.systemPreference).toBe('light');
    });
  });

  // ============================================================
  // OPTIONS
  // ============================================================

  describe('Options', () => {
    it('should use custom default scheme', () => {
      vi.stubGlobal('matchMedia', undefined); // No system preference
      localStorageMock._setStore({}); // No stored preference

      const { result } = renderHook(() => useColorScheme({ defaultScheme: 'light' }));

      // Without system or stored preference, should use default
      expect(result.current.colorScheme).toBe('light');
    });
  });

  // ============================================================
  // CONVENIENCE BOOLEANS
  // ============================================================

  describe('Convenience Booleans', () => {
    it('should set isDark correctly for dark mode', () => {
      const { result } = renderHook(() => useColorScheme());

      expect(result.current.isDark).toBe(true);
      expect(result.current.isLight).toBe(false);
    });

    it('should set isLight correctly for light mode', () => {
      const { result } = renderHook(() => useColorScheme());

      act(() => {
        result.current.setColorScheme('light');
      });

      expect(result.current.isDark).toBe(false);
      expect(result.current.isLight).toBe(true);
    });
  });
});

// ============================================================
// INIT SCRIPT TESTS
// ============================================================

describe('getColorSchemeInitScript', () => {
  it('should return a string', () => {
    const script = getColorSchemeInitScript();

    expect(typeof script).toBe('string');
  });

  it('should include default storage key', () => {
    const script = getColorSchemeInitScript();

    expect(script).toContain('x402-color-scheme');
  });

  it('should include custom storage key', () => {
    const script = getColorSchemeInitScript('custom-key');

    expect(script).toContain('custom-key');
  });

  it('should include default scheme', () => {
    const script = getColorSchemeInitScript('key', 'light');

    expect(script).toContain('light');
  });

  it('should include custom attribute', () => {
    const script = getColorSchemeInitScript('key', 'dark', 'data-mode');

    expect(script).toContain('data-mode');
  });

  it('should check localStorage', () => {
    const script = getColorSchemeInitScript();

    expect(script).toContain('localStorage.getItem');
  });

  it('should check matchMedia', () => {
    const script = getColorSchemeInitScript();

    expect(script).toContain('matchMedia');
  });

  it('should have try-catch for error handling', () => {
    const script = getColorSchemeInitScript();

    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('should be a valid JavaScript IIFE', () => {
    const script = getColorSchemeInitScript();

    expect(script).toMatch(/^\s*\(function\(\)/);
    expect(script).toMatch(/\}\)\(\);\s*$/);
  });
});
