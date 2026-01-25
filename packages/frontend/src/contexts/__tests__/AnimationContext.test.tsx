/**
 * AnimationContext Tests
 */

import { renderHook, act } from '@testing-library/react';
import { type ReactNode } from 'react';
import { AnimationProvider, useAnimationContext, useAnimationDuration } from '../AnimationContext';

// Mock useReducedMotion
vi.mock('../../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(),
}));

describe('AnimationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const { useReducedMotion } = require('../../hooks/useReducedMotion');
    vi.mocked(useReducedMotion).mockReturnValue(false);
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('AnimationProvider', () => {
    it('should provide default context values', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.speedMultiplier).toBe(1);
      expect(result.current.prefersReducedMotion).toBe(false);
    });

    it('should accept custom initial values', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={false} initialSpeedMultiplier={2}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.speedMultiplier).toBe(2);
    });

    it('should disable animations when user prefers reduced motion', () => {
      const { useReducedMotion } = require('../../hooks/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.prefersReducedMotion).toBe(true);
    });
  });

  describe('useAnimationContext', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAnimationContext());
      }).toThrow('useAnimationContext must be used within an AnimationProvider');

      console.error = originalError;
    });

    it('should provide all context methods', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.toggleAnimations).toBeDefined();
      expect(result.current.setSpeedMultiplier).toBeDefined();
      expect(result.current.enableAnimations).toBeDefined();
      expect(result.current.disableAnimations).toBeDefined();
      expect(result.current.reset).toBeDefined();
    });
  });

  describe('Context Actions', () => {
    it('should toggle animations', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(true);

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.animationsEnabled).toBe(false);

      act(() => {
        result.current.toggleAnimations();
      });

      expect(result.current.animationsEnabled).toBe(true);
    });

    it('should enable animations', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={false}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(false);

      act(() => {
        result.current.enableAnimations();
      });

      expect(result.current.animationsEnabled).toBe(true);
    });

    it('should disable animations', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(true);

      act(() => {
        result.current.disableAnimations();
      });

      expect(result.current.animationsEnabled).toBe(false);
    });

    it('should set speed multiplier', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.speedMultiplier).toBe(1);

      act(() => {
        result.current.setSpeedMultiplier(2);
      });

      expect(result.current.speedMultiplier).toBe(2);
    });

    it('should clamp speed multiplier to valid range', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Too high
      act(() => {
        result.current.setSpeedMultiplier(10);
      });
      expect(result.current.speedMultiplier).toBe(5);

      // Too low
      act(() => {
        result.current.setSpeedMultiplier(0.01);
      });
      expect(result.current.speedMultiplier).toBe(0.1);

      // Normal range
      act(() => {
        result.current.setSpeedMultiplier(2.5);
      });
      expect(result.current.speedMultiplier).toBe(2.5);
    });

    it('should reset to initial values', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true} initialSpeedMultiplier={1}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Change values
      act(() => {
        result.current.disableAnimations();
        result.current.setSpeedMultiplier(3);
      });

      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.speedMultiplier).toBe(3);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.speedMultiplier).toBe(1);
    });
  });

  describe('useAnimationDuration', () => {
    it('should return base duration when animations enabled and speed is 1', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationDuration(300), { wrapper });

      expect(result.current).toBe(300);
    });

    it('should return 0 when animations disabled', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={false}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationDuration(300), { wrapper });

      expect(result.current).toBe(0);
    });

    it('should apply speed multiplier', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialSpeedMultiplier={2}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationDuration(300), { wrapper });

      expect(result.current).toBe(150); // 300 / 2
    });

    it('should update when speed multiplier changes', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result: contextResult } = renderHook(() => useAnimationContext(), { wrapper });
      const { result: durationResult } = renderHook(() => useAnimationDuration(300), { wrapper });

      expect(durationResult.current).toBe(300);

      act(() => {
        contextResult.current.setSpeedMultiplier(0.5);
      });

      expect(durationResult.current).toBe(600); // 300 / 0.5
    });

    it('should return 0 when animations disabled via toggle', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result: contextResult } = renderHook(() => useAnimationContext(), { wrapper });
      const { result: durationResult } = renderHook(() => useAnimationDuration(300), { wrapper });

      expect(durationResult.current).toBe(300);

      act(() => {
        contextResult.current.disableAnimations();
      });

      expect(durationResult.current).toBe(0);
    });
  });

  describe('Reduced Motion Integration', () => {
    it('should override enabled state when user prefers reduced motion', () => {
      const { useReducedMotion } = require('../../hooks/useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true}>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Even though initialEnabled is true, animations should be disabled
      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.prefersReducedMotion).toBe(true);

      // Trying to enable should have no effect
      act(() => {
        result.current.enableAnimations();
      });

      expect(result.current.animationsEnabled).toBe(false);
    });
  });

  describe('LocalStorage Persistence', () => {
    const STORAGE_KEY = 'x402arcade:animation-settings';

    it('should load settings from localStorage on initialization', () => {
      // Set up localStorage with saved settings
      const savedSettings = {
        enabled: false,
        speedMultiplier: 2.5,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSettings));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Should load saved settings instead of defaults
      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.speedMultiplier).toBe(2.5);
    });

    it('should use initial props when localStorage is empty', () => {
      // localStorage is empty (cleared in beforeEach)

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={false} initialSpeedMultiplier={3}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.speedMultiplier).toBe(3);
    });

    it('should save settings to localStorage when animationsEnabled changes', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      act(() => {
        result.current.disableAnimations();
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(false);
      expect(saved.speedMultiplier).toBe(1);
    });

    it('should save settings to localStorage when speedMultiplier changes', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      act(() => {
        result.current.setSpeedMultiplier(2);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(true);
      expect(saved.speedMultiplier).toBe(2);
    });

    it('should persist both settings when both change', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      act(() => {
        result.current.disableAnimations();
        result.current.setSpeedMultiplier(3);
      });

      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(false);
      expect(saved.speedMultiplier).toBe(3);
    });

    it('should handle corrupt localStorage data gracefully', () => {
      // Set invalid JSON in localStorage
      localStorage.setItem(STORAGE_KEY, 'invalid-json{');

      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true} initialSpeedMultiplier={1}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Should fall back to initial props
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.speedMultiplier).toBe(1);

      console.error = originalError;
    });

    it('should handle missing fields in localStorage data', () => {
      // Set incomplete data in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: false }));

      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true} initialSpeedMultiplier={2}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Should use saved enabled but fall back to initial for missing speedMultiplier
      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.speedMultiplier).toBe(2);
    });

    it('should persist settings across multiple toggles', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider>{children}</AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      act(() => {
        result.current.toggleAnimations();
      });

      let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(false);

      act(() => {
        result.current.toggleAnimations();
      });

      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(true);
    });

    it('should update localStorage when reset is called', () => {
      const wrapper = ({ children }: { children: ReactNode }) => (
        <AnimationProvider initialEnabled={true} initialSpeedMultiplier={1}>
          {children}
        </AnimationProvider>
      );

      const { result } = renderHook(() => useAnimationContext(), { wrapper });

      // Change settings
      act(() => {
        result.current.disableAnimations();
        result.current.setSpeedMultiplier(3);
      });

      let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(false);
      expect(saved.speedMultiplier).toBe(3);

      // Reset
      act(() => {
        result.current.reset();
      });

      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      expect(saved.enabled).toBe(true);
      expect(saved.speedMultiplier).toBe(1);
    });
  });
});
