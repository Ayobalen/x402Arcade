/**
 * useAnimation Hook Tests
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnimation } from '../useAnimation';
import * as framerMotion from 'framer-motion';

// Mock framer-motion
const mockStart = vi.fn().mockResolvedValue(undefined);
const mockStop = vi.fn();
const mockSet = vi.fn();

vi.mock('framer-motion', () => ({
  useAnimationControls: vi.fn(),
  useReducedMotion: vi.fn(),
}));

vi.mock('../useReducedMotion', () => ({
  useReducedMotion: vi.fn(),
}));

describe('useAnimation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(framerMotion.useAnimationControls).mockReturnValue({
      start: mockStart,
      stop: mockStop,
      set: mockSet,
      mount: vi.fn(),
    } as any);

    const { useReducedMotion } = require('../useReducedMotion');
    vi.mocked(useReducedMotion).mockReturnValue(false);
  });

  describe('Core functionality', () => {
    it('should return animation controls', () => {
      const { result } = renderHook(() => useAnimation());

      expect(result.current).toBeDefined();
      expect(result.current.start).toBeDefined();
      expect(result.current.stop).toBeDefined();
      expect(result.current.set).toBeDefined();
    });

    it('should return extended controls with helper methods', () => {
      const { result } = renderHook(() => useAnimation());

      expect(result.current.pulse).toBeDefined();
      expect(result.current.shake).toBeDefined();
      expect(result.current.bounce).toBeDefined();
      expect(result.current.fadeIn).toBeDefined();
      expect(result.current.fadeOut).toBeDefined();
      expect(result.current.scaleIn).toBeDefined();
      expect(result.current.scaleOut).toBeDefined();
      expect(result.current.glow).toBeDefined();
    });
  });

  describe('pulse animation', () => {
    it('should trigger pulse animation', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.pulse();
      });

      expect(mockStart).toHaveBeenCalledWith({
        scale: [1, 1.05, 1],
        transition: expect.objectContaining({
          duration: 0.6,
          times: [0, 0.5, 1],
        }),
      });
    });

    it('should not animate when reduced motion is preferred', async () => {
      const { useReducedMotion } = require('../useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.pulse();
      });

      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('shake animation', () => {
    it('should trigger shake animation', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.shake();
      });

      expect(mockStart).toHaveBeenCalledWith({
        x: [0, -10, 10, -10, 10, 0],
        transition: expect.objectContaining({
          duration: 0.4,
        }),
      });
    });

    it('should not animate when reduced motion is preferred', async () => {
      const { useReducedMotion } = require('../useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.shake();
      });

      expect(mockStart).not.toHaveBeenCalled();
    });
  });

  describe('bounce animation', () => {
    it('should trigger bounce animation', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.bounce();
      });

      expect(mockStart).toHaveBeenCalledWith({
        y: [0, -20, 0],
        transition: expect.objectContaining({
          duration: 0.5,
          times: [0, 0.4, 1],
        }),
      });
    });
  });

  describe('fade animations', () => {
    it('should trigger fade in', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.fadeIn();
      });

      expect(mockStart).toHaveBeenCalledWith({
        opacity: 1,
        transition: expect.objectContaining({
          duration: 0.3,
        }),
      });
    });

    it('should trigger fade out', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.fadeOut();
      });

      expect(mockStart).toHaveBeenCalledWith({
        opacity: 0,
        transition: expect.objectContaining({
          duration: 0.3,
        }),
      });
    });

    it('should accept custom duration for fadeIn', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.fadeIn(0.5);
      });

      expect(mockStart).toHaveBeenCalledWith({
        opacity: 1,
        transition: expect.objectContaining({
          duration: 0.5,
        }),
      });
    });

    it('should use instant transition when reduced motion is preferred', async () => {
      const { useReducedMotion } = require('../useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.fadeIn();
      });

      expect(mockStart).toHaveBeenCalledWith({
        opacity: 1,
      });
    });
  });

  describe('scale animations', () => {
    it('should trigger scale in', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.scaleIn();
      });

      expect(mockStart).toHaveBeenCalledWith({
        scale: 1,
        opacity: 1,
        transition: expect.objectContaining({
          duration: 0.3,
        }),
      });
    });

    it('should trigger scale out', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.scaleOut();
      });

      expect(mockStart).toHaveBeenCalledWith({
        scale: 0.8,
        opacity: 0,
        transition: expect.objectContaining({
          duration: 0.3,
        }),
      });
    });

    it('should accept custom duration for scaleIn', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.scaleIn(0.6);
      });

      expect(mockStart).toHaveBeenCalledWith({
        scale: 1,
        opacity: 1,
        transition: expect.objectContaining({
          duration: 0.6,
        }),
      });
    });
  });

  describe('glow animation', () => {
    it('should trigger glow animation with infinite repeat', async () => {
      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.glow();
      });

      expect(mockStart).toHaveBeenCalledWith({
        filter: expect.arrayContaining([
          expect.stringContaining('drop-shadow'),
          expect.stringContaining('drop-shadow'),
          expect.stringContaining('drop-shadow'),
        ]),
        transition: expect.objectContaining({
          duration: 1.5,
          times: [0, 0.5, 1],
          repeat: Infinity,
        }),
      });
    });

    it('should not animate when reduced motion is preferred', async () => {
      const { useReducedMotion } = require('../useReducedMotion');
      vi.mocked(useReducedMotion).mockReturnValue(true);

      const { result } = renderHook(() => useAnimation());

      await act(async () => {
        await result.current.glow();
      });

      expect(mockStart).not.toHaveBeenCalled();
    });
  });
});
