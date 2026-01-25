/**
 * @vitest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useHighContrastMode } from '../useHighContrastMode';

describe('useHighContrastMode', () => {
  // Clean up localStorage and DOM before each test
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('high-contrast-mode');
    // Reset media query mock
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('high-contrast-mode');
  });

  describe('Initial State', () => {
    it('should start with high contrast disabled by default', () => {
      const { result } = renderHook(() => useHighContrastMode());

      expect(result.current.isHighContrast).toBe(false);
      expect(result.current.isSystemPreference).toBe(true);
    });

    it('should respect stored preference from localStorage', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');

      const { result } = renderHook(() => useHighContrastMode());

      expect(result.current.isHighContrast).toBe(true);
      expect(result.current.isSystemPreference).toBe(false);
    });

    it('should apply high-contrast-mode class when enabled', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');

      renderHook(() => useHighContrastMode());

      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
    });
  });

  describe('Toggle Function', () => {
    it('should toggle high contrast mode on', () => {
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isHighContrast).toBe(true);
      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('true');
    });

    it('should toggle high contrast mode off', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isHighContrast).toBe(false);
      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(false);
      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('false');
    });

    it('should mark preference as not system-based after manual toggle', () => {
      const { result } = renderHook(() => useHighContrastMode());

      expect(result.current.isSystemPreference).toBe(true);

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isSystemPreference).toBe(false);
    });
  });

  describe('Enable Function', () => {
    it('should enable high contrast mode', () => {
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.enable();
      });

      expect(result.current.isHighContrast).toBe(true);
      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('true');
      expect(result.current.isSystemPreference).toBe(false);
    });

    it('should remain enabled when called multiple times', () => {
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.enable();
        result.current.enable();
        result.current.enable();
      });

      expect(result.current.isHighContrast).toBe(true);
    });
  });

  describe('Disable Function', () => {
    it('should disable high contrast mode', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.disable();
      });

      expect(result.current.isHighContrast).toBe(false);
      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(false);
      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('false');
      expect(result.current.isSystemPreference).toBe(false);
    });

    it('should remain disabled when called multiple times', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.disable();
        result.current.disable();
        result.current.disable();
      });

      expect(result.current.isHighContrast).toBe(false);
    });
  });

  describe('System Preference Detection', () => {
    it('should detect system preference for high contrast', () => {
      // Mock window.matchMedia to return high contrast preference
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-contrast: more)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useHighContrastMode());

      // Should detect system preference
      expect(result.current.isHighContrast).toBe(true);
      expect(result.current.isSystemPreference).toBe(true);
    });

    it('should ignore system preference when user has manual override', () => {
      // Set manual preference
      localStorage.setItem('x402arcade-high-contrast', 'false');

      // Mock system preference as high contrast
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-contrast: more)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const { result } = renderHook(() => useHighContrastMode());

      // Should use manual preference instead of system preference
      expect(result.current.isHighContrast).toBe(false);
      expect(result.current.isSystemPreference).toBe(false);
    });
  });

  describe('localStorage Persistence', () => {
    it('should persist enabled state to localStorage', () => {
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.enable();
      });

      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('true');
    });

    it('should persist disabled state to localStorage', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.disable();
      });

      expect(localStorage.getItem('x402arcade-high-contrast')).toBe('false');
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage is full');
      });

      const { result } = renderHook(() => useHighContrastMode());

      // Should not throw when localStorage fails
      expect(() => {
        act(() => {
          result.current.enable();
        });
      }).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('DOM Class Management', () => {
    it('should add high-contrast-mode class when enabled', () => {
      const { result } = renderHook(() => useHighContrastMode());

      act(() => {
        result.current.enable();
      });

      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);
    });

    it('should remove high-contrast-mode class when disabled', () => {
      localStorage.setItem('x402arcade-high-contrast', 'true');
      const { result } = renderHook(() => useHighContrastMode());

      // Class should be present initially
      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(true);

      act(() => {
        result.current.disable();
      });

      expect(document.documentElement.classList.contains('high-contrast-mode')).toBe(false);
    });
  });

  describe('Return Value Structure', () => {
    it('should return all expected properties and functions', () => {
      const { result } = renderHook(() => useHighContrastMode());

      expect(result.current).toHaveProperty('isHighContrast');
      expect(result.current).toHaveProperty('toggle');
      expect(result.current).toHaveProperty('enable');
      expect(result.current).toHaveProperty('disable');
      expect(result.current).toHaveProperty('isSystemPreference');
    });

    it('should have correct types for all properties', () => {
      const { result } = renderHook(() => useHighContrastMode());

      expect(typeof result.current.isHighContrast).toBe('boolean');
      expect(typeof result.current.toggle).toBe('function');
      expect(typeof result.current.enable).toBe('function');
      expect(typeof result.current.disable).toBe('function');
      expect(typeof result.current.isSystemPreference).toBe('boolean');
    });
  });
});
