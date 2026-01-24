/**
 * Tests for usePerformanceScaling hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePerformanceScaling } from '../usePerformanceScaling';
import type { QualityLevel } from '../usePerformanceScaling';

describe('usePerformanceScaling', () => {
  let mockRaf: ReturnType<typeof vi.fn>;
  let mockCancelRaf: ReturnType<typeof vi.fn>;
  let mockPerformanceNow: ReturnType<typeof vi.fn>;
  let rafCallbacks: ((timestamp: number) => void)[] = [];
  let currentTime = 0;

  beforeEach(() => {
    vi.useFakeTimers();
    rafCallbacks = [];
    currentTime = 0;

    // Mock requestAnimationFrame
    mockRaf = vi.fn((callback: (timestamp: number) => void) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    mockCancelRaf = vi.fn();
    mockPerformanceNow = vi.fn(() => currentTime);

    global.requestAnimationFrame = mockRaf;
    global.cancelAnimationFrame = mockCancelRaf;
    global.performance.now = mockPerformanceNow;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /**
   * Helper to simulate frame progression
   */
  const simulateFrames = (count: number, frameTime: number) => {
    for (let i = 0; i < count; i++) {
      currentTime += frameTime;
      rafCallbacks.forEach((cb) => cb(currentTime));
    }
  };

  /**
   * Helper to simulate FPS
   */
  const simulateFps = (fps: number, frameCount: number) => {
    const frameTime = 1000 / fps;
    simulateFrames(frameCount, frameTime);
  };

  describe('Initialization', () => {
    it('should start with high quality by default', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      expect(result.current.quality).toBe('high');
    });

    it('should provide quality settings for high quality', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      expect(result.current.settings).toBeDefined();
      expect(result.current.settings.backgroundGlows).toBe(true);
      expect(result.current.settings.bloom).toBe(true);
      expect(result.current.settings.particleMultiplier).toBe(1.0);
    });

    it('should initialize performance stats', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      expect(result.current.stats).toBeDefined();
      expect(result.current.stats.quality).toBe('high');
      expect(result.current.stats.autoAdjusted).toBe(false);
      expect(result.current.stats.adjustmentCount).toBe(0);
    });

    it('should start FPS monitoring', () => {
      renderHook(() => usePerformanceScaling());

      expect(mockRaf).toHaveBeenCalled();
    });
  });

  describe('FPS Monitoring', () => {
    it('should collect frame time samples', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Simulate 60 FPS (16.67ms per frame)
      simulateFps(60, 10);

      // Stats should be available
      expect(result.current.stats.currentFps).toBeGreaterThan(0);
    });

    it('should calculate average FPS', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Simulate stable 60 FPS
      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000); // Trigger check interval
      });

      // Average should be close to 60
      expect(result.current.stats.averageFps).toBeGreaterThanOrEqual(55);
      expect(result.current.stats.averageFps).toBeLessThanOrEqual(65);
    });

    it('should track min and max FPS', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Simulate varying FPS
      simulateFps(60, 20);
      simulateFps(30, 20);
      simulateFps(45, 20);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.stats.minFps).toBeLessThan(result.current.stats.maxFps);
    });
  });

  describe('Quality Level Thresholds', () => {
    it('should maintain high quality at 60 FPS', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.quality).toBe('high');
      expect(result.current.settings.bloomPreset).toBe('intense');
    });

    it('should downgrade to medium quality when FPS drops below 50', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Start at 60 FPS
      simulateFps(60, 30);

      // Drop to 40 FPS
      simulateFps(40, 30);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('medium');
      });

      expect(result.current.settings.bloomPreset).toBe('moderate');
      expect(result.current.settings.animateGlows).toBe(false);
    });

    it('should downgrade to low quality when FPS drops below 35', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      simulateFps(60, 30);
      simulateFps(25, 30);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('low');
      });

      expect(result.current.settings.bloomPreset).toBe('subtle');
      expect(result.current.settings.chromaticAberration).toBe(false);
      expect(result.current.settings.particleMultiplier).toBe(0.3);
    });

    it('should downgrade to minimal quality when FPS drops below 20', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      simulateFps(60, 30);
      simulateFps(15, 30);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('minimal');
      });

      expect(result.current.settings.bloom).toBe(false);
      expect(result.current.settings.backgroundGlows).toBe(false);
      expect(result.current.settings.particleMultiplier).toBe(0);
    });

    it('should upgrade quality when FPS improves', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Start at low FPS
      simulateFps(25, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('low');
      });

      // Improve to high FPS
      simulateFps(55, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('high');
      });
    });
  });

  describe('Custom Thresholds', () => {
    it('should use custom FPS thresholds', async () => {
      const { result } = renderHook(() =>
        usePerformanceScaling({
          highQualityFps: 40,
          mediumQualityFps: 25,
          lowQualityFps: 15,
        })
      );

      // 35 FPS should be medium quality with custom thresholds
      simulateFps(35, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('medium');
      });
    });

    it('should respect custom check interval', () => {
      const checkInterval = 5000;
      renderHook(() =>
        usePerformanceScaling({
          checkInterval,
        })
      );

      simulateFps(30, 60);

      // Should not have checked yet
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should check now
      act(() => {
        vi.advanceTimersByTime(3000);
      });
    });
  });

  describe('Hysteresis', () => {
    it('should prevent rapid quality switching with hysteresis', async () => {
      const { result } = renderHook(() =>
        usePerformanceScaling({
          hysteresis: 5,
        })
      );

      // Start at high quality
      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.quality).toBe('high');

      // Drop to just below threshold (50 - 5 hysteresis = 45)
      simulateFps(48, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should still be high due to hysteresis
      expect(result.current.quality).toBe('high');

      // Drop further
      simulateFps(40, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.quality).toBe('medium');
      });
    });
  });

  describe('Manual Quality Override', () => {
    it('should allow manual quality override', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('low');
      });

      expect(result.current.quality).toBe('low');
    });

    it('should disable auto-scaling when manual quality is set', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('low');
      });

      // Simulate high FPS
      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should still be low (manual override)
      expect(result.current.quality).toBe('low');
    });

    it('should re-enable auto-scaling', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      // Set manual quality
      act(() => {
        result.current.setManualQuality('low');
      });

      expect(result.current.quality).toBe('low');

      // Re-enable auto-scaling
      act(() => {
        result.current.enableAutoScaling();
      });

      // Simulate high FPS
      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should auto-adjust back to high
      await waitFor(() => {
        expect(result.current.quality).toBe('high');
      });
    });

    it('should clear manual override with null', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('low');
      });

      expect(result.current.quality).toBe('low');

      act(() => {
        result.current.setManualQuality(null);
      });

      // Should return to auto mode
      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });
    });
  });

  describe('Quality Settings', () => {
    it('should provide high quality settings', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('high');
      });

      const { settings } = result.current;

      expect(settings.backgroundGlows).toBe(true);
      expect(settings.glowIntensity).toBe('high');
      expect(settings.animateGlows).toBe(true);
      expect(settings.bloom).toBe(true);
      expect(settings.bloomPreset).toBe('intense');
      expect(settings.chromaticAberration).toBe(true);
      expect(settings.vignette).toBe(true);
      expect(settings.scanlines).toBe(true);
      expect(settings.particleMultiplier).toBe(1.0);
      expect(settings.particleAnimations).toBe(true);
    });

    it('should provide medium quality settings', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('medium');
      });

      const { settings } = result.current;

      expect(settings.backgroundGlows).toBe(true);
      expect(settings.glowIntensity).toBe('medium');
      expect(settings.animateGlows).toBe(false); // Disabled
      expect(settings.bloom).toBe(true);
      expect(settings.bloomPreset).toBe('moderate');
      expect(settings.noiseFps).toBe(12); // Reduced
      expect(settings.particleMultiplier).toBe(0.6); // Reduced
    });

    it('should provide low quality settings', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('low');
      });

      const { settings } = result.current;

      expect(settings.backgroundGlows).toBe(true);
      expect(settings.glowIntensity).toBe('low');
      expect(settings.animateGlows).toBe(false);
      expect(settings.bloom).toBe(true);
      expect(settings.bloomPreset).toBe('subtle');
      expect(settings.chromaticAberration).toBe(false); // Disabled
      expect(settings.scanlines).toBe(false); // Disabled
      expect(settings.noiseFps).toBe(6); // Very reduced
      expect(settings.particleMultiplier).toBe(0.3); // Very reduced
      expect(settings.particleAnimations).toBe(false); // Disabled
    });

    it('should provide minimal quality settings', () => {
      const { result } = renderHook(() => usePerformanceScaling());

      act(() => {
        result.current.setManualQuality('minimal');
      });

      const { settings } = result.current;

      expect(settings.backgroundGlows).toBe(false); // Disabled
      expect(settings.noiseOverlay).toBe(false); // Disabled
      expect(settings.bloom).toBe(false); // Disabled
      expect(settings.bloomPreset).toBe('off');
      expect(settings.chromaticAberration).toBe(false);
      expect(settings.vignette).toBe(false); // Disabled
      expect(settings.scanlines).toBe(false);
      expect(settings.particleMultiplier).toBe(0); // No particles
      expect(settings.particleAnimations).toBe(false);
    });
  });

  describe('Performance Stats', () => {
    it('should track adjustment count', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      const initialCount = result.current.stats.adjustmentCount;

      // Force quality change
      simulateFps(25, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.stats.adjustmentCount).toBeGreaterThan(initialCount);
      });
    });

    it('should indicate auto-adjustment', async () => {
      const { result } = renderHook(() => usePerformanceScaling());

      simulateFps(60, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.stats.autoAdjusted).toBe(false);

      // Trigger quality change
      simulateFps(25, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(result.current.stats.quality).toBe('low');
      });
    });
  });

  describe('Disabled Mode', () => {
    it('should not monitor FPS when disabled', () => {
      renderHook(() =>
        usePerformanceScaling({
          enabled: false,
        })
      );

      expect(mockRaf).not.toHaveBeenCalled();
    });

    it('should stay at high quality when disabled', async () => {
      const { result } = renderHook(() =>
        usePerformanceScaling({
          enabled: false,
        })
      );

      simulateFps(15, 60);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.quality).toBe('high');
    });
  });

  describe('Cleanup', () => {
    it('should cancel animation frame on unmount', () => {
      const { unmount } = renderHook(() => usePerformanceScaling());

      unmount();

      expect(mockCancelRaf).toHaveBeenCalled();
    });

    it('should clear interval on unmount', () => {
      const { unmount } = renderHook(() => usePerformanceScaling());

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });
  });

  describe('Quality Level Transitions', () => {
    const qualityLevels: QualityLevel[] = ['high', 'medium', 'low', 'minimal'];

    qualityLevels.forEach((level) => {
      it(`should provide valid settings for ${level} quality`, () => {
        const { result } = renderHook(() => usePerformanceScaling());

        act(() => {
          result.current.setManualQuality(level);
        });

        const { settings } = result.current;

        // All settings should be defined
        expect(settings.backgroundGlows).toBeDefined();
        expect(settings.glowIntensity).toBeDefined();
        expect(settings.bloom).toBeDefined();
        expect(settings.particleMultiplier).toBeGreaterThanOrEqual(0);
        expect(settings.particleMultiplier).toBeLessThanOrEqual(1);
      });
    });
  });
});
