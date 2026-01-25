/**
 * useReducedMotion Hook Tests
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useReducedMotion, useMotionConfig } from '../useReducedMotion';
import * as framerMotion from 'framer-motion';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(),
}));

describe('useReducedMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when user does not prefer reduced motion', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should return true when user prefers reduced motion', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should eventually return false after hydration', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    const { result } = renderHook(() => useReducedMotion());

    // After hydration completes, should reflect actual preference
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should handle null return from framer-motion', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(null as any);

    const { result } = renderHook(() => useReducedMotion());

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });
});

describe('useMotionConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return full motion config when motion is not reduced', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    const { result } = renderHook(() => useMotionConfig());

    await waitFor(() => {
      expect(result.current.shouldReduceMotion).toBe(false);
      expect(result.current.durationMultiplier).toBe(1);
      expect(result.current.animationsEnabled).toBe(true);
      expect(result.current.initial).toBeUndefined();
    });
  });

  it('should return reduced motion config when motion is reduced', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(true);

    const { result } = renderHook(() => useMotionConfig());

    await waitFor(() => {
      expect(result.current.shouldReduceMotion).toBe(true);
      expect(result.current.durationMultiplier).toBe(0);
      expect(result.current.animationsEnabled).toBe(false);
      expect(result.current.initial).toBe(false);
    });
  });

  it('should have all required config properties', async () => {
    vi.mocked(framerMotion.useReducedMotion).mockReturnValue(false);

    const { result } = renderHook(() => useMotionConfig());

    await waitFor(() => {
      expect(result.current).toHaveProperty('shouldReduceMotion');
      expect(result.current).toHaveProperty('durationMultiplier');
      expect(result.current).toHaveProperty('animationsEnabled');
      expect(result.current).toHaveProperty('initial');
    });
  });
});
