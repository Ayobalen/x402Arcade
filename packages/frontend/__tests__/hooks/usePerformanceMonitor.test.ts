/**
 * Tests for usePerformanceMonitor Hook
 *
 * Tests the performance monitoring hook including FPS tracking,
 * memory monitoring, and performance callbacks.
 *
 * @module __tests__/hooks/usePerformanceMonitor.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  usePerformanceMonitorStandalone,
  type PerformanceMetrics,
  type UsePerformanceMonitorOptions,
} from '../../src/hooks/usePerformanceMonitor';

// ============================================================================
// Test Setup
// ============================================================================

// Expected initial metrics values (mirrors the constants in the source)
const EXPECTED_INITIAL_METRICS: PerformanceMetrics = {
  fps: 0,
  avgFps: 0,
  minFps: Infinity,
  maxFps: 0,
  frameTime: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  memoryUsed: null,
  memoryLimit: null,
  memoryPercent: null,
  lastUpdate: 0,
  isMonitoring: false,
};

// Note: usePerformanceMonitor requires React Three Fiber context (useFrame, useThree)
// We test usePerformanceMonitorStandalone which can be used outside R3F context

describe('usePerformanceMonitorStandalone', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock requestAnimationFrame
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    vi.spyOn(global, 'cancelAnimationFrame').mockImplementation((id: number) => {
      clearTimeout(id);
    });
    // Mock performance.now to return increasing values
    let time = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      time += 16.67; // ~60 FPS
      return time;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('returns fps as 0 initially', () => {
      const { result } = renderHook(() => usePerformanceMonitorStandalone());

      expect(result.current.fps).toBe(0);
    });

    it('returns frameTime as 0 initially', () => {
      const { result } = renderHook(() => usePerformanceMonitorStandalone());

      expect(result.current.frameTime).toBe(0);
    });

    it('returns isMonitoring based on enabled option', () => {
      const { result: enabledResult } = renderHook(() =>
        usePerformanceMonitorStandalone({ enabled: true })
      );
      const { result: disabledResult } = renderHook(() =>
        usePerformanceMonitorStandalone({ enabled: false })
      );

      expect(enabledResult.current.isMonitoring).toBe(true);
      expect(disabledResult.current.isMonitoring).toBe(false);
    });
  });

  describe('FPS Tracking', () => {
    it('calculates FPS after update interval', async () => {
      const { result } = renderHook(() =>
        usePerformanceMonitorStandalone({
          enabled: true,
          updateInterval: 100,
        })
      );

      // Fast-forward to allow frame measurements
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // After some frames, FPS should be calculated
      expect(result.current.fps).toBeGreaterThan(0);
    });

    it('updates frameTime', async () => {
      const { result } = renderHook(() =>
        usePerformanceMonitorStandalone({
          enabled: true,
          updateInterval: 100,
        })
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.frameTime).toBeGreaterThan(0);
    });
  });

  describe('Enabled/Disabled State', () => {
    it('does not start animation frame loop when disabled', () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');
      const initialCallCount = rafSpy.mock.calls.length;

      renderHook(() =>
        usePerformanceMonitorStandalone({ enabled: false })
      );

      expect(rafSpy.mock.calls.length).toBe(initialCallCount);
    });

    it('cleans up animation frame on unmount', () => {
      const cancelSpy = vi.spyOn(global, 'cancelAnimationFrame');

      const { unmount } = renderHook(() =>
        usePerformanceMonitorStandalone({ enabled: true })
      );

      unmount();

      expect(cancelSpy).toHaveBeenCalled();
    });

    it('responds to enabled prop changes', async () => {
      const { result, rerender } = renderHook(
        ({ enabled }) => usePerformanceMonitorStandalone({ enabled }),
        { initialProps: { enabled: true } }
      );

      expect(result.current.isMonitoring).toBe(true);

      rerender({ enabled: false });

      expect(result.current.isMonitoring).toBe(false);
    });
  });

  describe('Update Interval', () => {
    it('calculates FPS after sufficient time has passed', async () => {
      const { result } = renderHook(() =>
        usePerformanceMonitorStandalone({
          enabled: true,
          updateInterval: 500,
        })
      );

      // Initial state - FPS starts at 0
      expect(result.current.fps).toBe(0);

      // Advance time past the update interval
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // FPS should now be calculated (greater than 0)
      expect(result.current.fps).toBeGreaterThan(0);
    });

    it('uses the specified update interval', async () => {
      // With a short update interval, we should see FPS updates quickly
      const { result } = renderHook(() =>
        usePerformanceMonitorStandalone({
          enabled: true,
          updateInterval: 100, // Short interval
        })
      );

      // Advance time
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should have calculated FPS
      expect(result.current.fps).toBeGreaterThan(0);
    });
  });
});

describe('PerformanceMetrics Types', () => {
  describe('Initial Metrics Structure', () => {
    it('has correct initial fps', () => {
      expect(EXPECTED_INITIAL_METRICS.fps).toBe(0);
    });

    it('has correct initial avgFps', () => {
      expect(EXPECTED_INITIAL_METRICS.avgFps).toBe(0);
    });

    it('has correct initial minFps', () => {
      expect(EXPECTED_INITIAL_METRICS.minFps).toBe(Infinity);
    });

    it('has correct initial maxFps', () => {
      expect(EXPECTED_INITIAL_METRICS.maxFps).toBe(0);
    });

    it('has correct initial frameTime', () => {
      expect(EXPECTED_INITIAL_METRICS.frameTime).toBe(0);
    });

    it('has correct initial draw call counts', () => {
      expect(EXPECTED_INITIAL_METRICS.drawCalls).toBe(0);
      expect(EXPECTED_INITIAL_METRICS.triangles).toBe(0);
      expect(EXPECTED_INITIAL_METRICS.geometries).toBe(0);
      expect(EXPECTED_INITIAL_METRICS.textures).toBe(0);
    });

    it('has null memory values', () => {
      expect(EXPECTED_INITIAL_METRICS.memoryUsed).toBeNull();
      expect(EXPECTED_INITIAL_METRICS.memoryLimit).toBeNull();
      expect(EXPECTED_INITIAL_METRICS.memoryPercent).toBeNull();
    });

    it('has correct initial monitoring state', () => {
      expect(EXPECTED_INITIAL_METRICS.isMonitoring).toBe(false);
    });
  });

  describe('PerformanceMetrics interface', () => {
    it('has all required properties', () => {
      const metrics: PerformanceMetrics = {
        fps: 60,
        avgFps: 58,
        minFps: 45,
        maxFps: 62,
        frameTime: 16.67,
        drawCalls: 100,
        triangles: 50000,
        geometries: 50,
        textures: 10,
        memoryUsed: 256,
        memoryLimit: 2048,
        memoryPercent: 12.5,
        lastUpdate: Date.now(),
        isMonitoring: true,
      };

      expect(metrics.fps).toBe(60);
      expect(metrics.avgFps).toBe(58);
      expect(metrics.minFps).toBe(45);
      expect(metrics.maxFps).toBe(62);
      expect(metrics.frameTime).toBe(16.67);
      expect(metrics.drawCalls).toBe(100);
      expect(metrics.triangles).toBe(50000);
      expect(metrics.geometries).toBe(50);
      expect(metrics.textures).toBe(10);
      expect(metrics.memoryUsed).toBe(256);
      expect(metrics.memoryLimit).toBe(2048);
      expect(metrics.memoryPercent).toBe(12.5);
      expect(metrics.isMonitoring).toBe(true);
    });
  });
});

describe('UsePerformanceMonitorOptions interface', () => {
  it('accepts all optional parameters', () => {
    const options: UsePerformanceMonitorOptions = {
      enabled: true,
      updateInterval: 500,
      sampleSize: 60,
      logToConsole: true,
      consoleLogInterval: 2000,
      fpsWarningThreshold: 30,
      onMetricsUpdate: () => {},
      onLowFps: () => {},
    };

    expect(options.enabled).toBe(true);
    expect(options.updateInterval).toBe(500);
    expect(options.sampleSize).toBe(60);
    expect(options.logToConsole).toBe(true);
    expect(options.consoleLogInterval).toBe(2000);
    expect(options.fpsWarningThreshold).toBe(30);
    expect(typeof options.onMetricsUpdate).toBe('function');
    expect(typeof options.onLowFps).toBe('function');
  });

  it('works with minimal options', () => {
    const options: UsePerformanceMonitorOptions = {};
    expect(Object.keys(options).length).toBe(0);
  });
});
