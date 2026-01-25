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
});
