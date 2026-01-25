/**
 * Game Loop Tests
 *
 * Tests for the game loop implementation including delta time calculation,
 * FPS counting, fixed timestep physics, and visibility handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGameLoop,
  createDeltaTimeCalculator,
  createFpsCounter,
  createVisibilityHandler,
  deltaToSeconds,
  deltaToMs,
  calculateInterpolationAlpha,
  DEFAULT_GAME_LOOP_CONFIG,
} from '../game-loop';

describe('Game Loop', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('createDeltaTimeCalculator', () => {
    it('should return 0 delta time on first call', () => {
      const calculator = createDeltaTimeCalculator(100);
      const deltaTime = calculator.calculate(performance.now());
      expect(deltaTime).toBe(0);
    });

    it('should calculate delta time correctly', () => {
      const calculator = createDeltaTimeCalculator(100);

      // First call
      calculator.calculate(0);

      // Second call after 16.67ms (60 FPS)
      const deltaTime = calculator.calculate(16.67);
      expect(deltaTime).toBeCloseTo(16.67, 1);
    });

    it('should cap delta time at max value', () => {
      const calculator = createDeltaTimeCalculator(100);

      calculator.calculate(0);

      // Try to pass 200ms delta (should be capped at 100ms)
      const deltaTime = calculator.calculate(200);
      expect(deltaTime).toBe(100);
    });

    it('should track raw and capped delta time separately', () => {
      const calculator = createDeltaTimeCalculator(100);

      calculator.calculate(0);
      calculator.calculate(200);

      expect(calculator.getRawDeltaTime()).toBe(200);
      expect(calculator.getCappedDeltaTime()).toBe(100);
    });

    it('should reset correctly', () => {
      const calculator = createDeltaTimeCalculator(100);

      calculator.calculate(0);
      calculator.calculate(50);

      calculator.reset();

      const deltaTime = calculator.calculate(100);
      expect(deltaTime).toBe(0); // First frame after reset should be 0
    });

    it('should update max delta time', () => {
      const calculator = createDeltaTimeCalculator(100);

      calculator.calculate(0);
      calculator.setMaxDeltaTime(50);

      const deltaTime = calculator.calculate(200);
      expect(deltaTime).toBe(50);
    });
  });

  describe('createFpsCounter', () => {
    it('should return 0 FPS initially', () => {
      const counter = createFpsCounter();
      expect(counter.getFps()).toBe(0);
    });

    it('should calculate FPS from frame times', () => {
      const counter = createFpsCounter(10);

      // Mock performance.now()
      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        currentTime += 16.67; // 60 FPS
        return currentTime;
      });

      // Tick several frames
      for (let i = 0; i < 5; i++) {
        counter.tick();
      }

      const fps = counter.getFps();
      expect(fps).toBeGreaterThan(50);
      expect(fps).toBeLessThan(70);
    });

    it('should calculate average FPS', () => {
      const counter = createFpsCounter(10);

      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        currentTime += 16.67;
        return currentTime;
      });

      for (let i = 0; i < 10; i++) {
        counter.tick();
      }

      const avgFps = counter.getAverageFps();
      expect(avgFps).toBeGreaterThan(50);
      expect(avgFps).toBeLessThan(70);
    });

    it('should reset correctly', () => {
      const counter = createFpsCounter();

      let currentTime = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        currentTime += 16.67;
        return currentTime;
      });

      for (let i = 0; i < 5; i++) {
        counter.tick();
      }

      counter.reset();

      expect(counter.getFps()).toBe(0);
      expect(counter.getAverageFps()).toBe(0);
    });
  });

  describe('createVisibilityHandler', () => {
    it('should call onHidden when document becomes hidden', () => {
      const onHidden = vi.fn();
      const onVisible = vi.fn();

      createVisibilityHandler(onHidden, onVisible);

      // Mock document.hidden
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });

      // Trigger visibility change
      document.dispatchEvent(new Event('visibilitychange'));

      expect(onHidden).toHaveBeenCalled();
    });

    it('should call onVisible when document becomes visible', () => {
      const onHidden = vi.fn();
      const onVisible = vi.fn();

      createVisibilityHandler(onHidden, onVisible);

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      expect(onVisible).toHaveBeenCalled();
    });

    it('should return cleanup function', () => {
      const onHidden = vi.fn();
      const onVisible = vi.fn();

      const cleanup = createVisibilityHandler(onHidden, onVisible);

      cleanup();

      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });

      document.dispatchEvent(new Event('visibilitychange'));

      // Should not be called after cleanup
      expect(onHidden).not.toHaveBeenCalled();
    });
  });

  describe('createGameLoop', () => {
    it('should create game loop with default config', () => {
      const loop = createGameLoop();

      expect(loop).toBeDefined();
      expect(loop.isRunning()).toBe(false);
      expect(loop.isPaused()).toBe(false);
    });

    it('should start the game loop', () => {
      const loop = createGameLoop();

      loop.start();

      expect(loop.isRunning()).toBe(true);
      expect(loop.isPaused()).toBe(false);

      loop.destroy();
    });

    it('should call update callback', async () => {
      const updateCallback = vi.fn();
      const loop = createGameLoop();

      loop.setUpdateCallback(updateCallback);
      loop.start();

      // Wait for a few frames
      await vi.advanceTimersByTimeAsync(100);

      expect(updateCallback).toHaveBeenCalled();

      loop.destroy();
    });

    it('should call render callback', async () => {
      const renderCallback = vi.fn();
      const loop = createGameLoop();

      loop.setRenderCallback(renderCallback);
      loop.start();

      await vi.advanceTimersByTimeAsync(100);

      expect(renderCallback).toHaveBeenCalled();

      loop.destroy();
    });

    it('should call fixed update callback', async () => {
      const fixedUpdateCallback = vi.fn();
      const loop = createGameLoop({ useFixedTimestep: true });

      loop.setFixedUpdateCallback(fixedUpdateCallback);
      loop.start();

      await vi.advanceTimersByTimeAsync(100);

      expect(fixedUpdateCallback).toHaveBeenCalled();

      loop.destroy();
    });

    it('should pause the game loop', () => {
      const loop = createGameLoop();

      loop.start();
      loop.pause();

      expect(loop.isRunning()).toBe(true);
      expect(loop.isPaused()).toBe(true);

      loop.destroy();
    });

    it('should resume the game loop', () => {
      const loop = createGameLoop();

      loop.start();
      loop.pause();
      loop.resume();

      expect(loop.isRunning()).toBe(true);
      expect(loop.isPaused()).toBe(false);

      loop.destroy();
    });

    it('should stop the game loop', () => {
      const loop = createGameLoop();

      loop.start();
      loop.stop();

      expect(loop.isRunning()).toBe(false);

      loop.destroy();
    });

    it('should provide frame info to callbacks', async () => {
      let frameInfo: any = null;
      const loop = createGameLoop();

      loop.setUpdateCallback((info) => {
        frameInfo = info;
      });

      loop.start();

      await vi.advanceTimersByTimeAsync(100);

      expect(frameInfo).toBeDefined();
      expect(frameInfo).toHaveProperty('deltaTime');
      expect(frameInfo).toHaveProperty('totalTime');
      expect(frameInfo).toHaveProperty('frameNumber');
      expect(frameInfo).toHaveProperty('fps');
      expect(frameInfo).toHaveProperty('targetFps');

      loop.destroy();
    });

    it('should destroy cleanly', () => {
      const loop = createGameLoop();

      loop.start();
      loop.destroy();

      expect(loop.isRunning()).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('deltaToSeconds should convert ms to seconds', () => {
      expect(deltaToSeconds(1000)).toBe(1);
      expect(deltaToSeconds(500)).toBe(0.5);
      expect(deltaToSeconds(16.67)).toBeCloseTo(0.01667, 4);
    });

    it('deltaToMs should convert seconds to ms', () => {
      expect(deltaToMs(1)).toBe(1000);
      expect(deltaToMs(0.5)).toBe(500);
      expect(deltaToMs(0.01667)).toBeCloseTo(16.67, 2);
    });

    it('calculateInterpolationAlpha should return value between 0 and 1', () => {
      expect(calculateInterpolationAlpha(0, 16.67)).toBe(0);
      expect(calculateInterpolationAlpha(8.335, 16.67)).toBeCloseTo(0.5, 1);
      expect(calculateInterpolationAlpha(16.67, 16.67)).toBe(1);
      expect(calculateInterpolationAlpha(20, 16.67)).toBe(1); // Capped at 1
    });
  });

  describe('DEFAULT_GAME_LOOP_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_GAME_LOOP_CONFIG.targetFps).toBe(60);
      expect(DEFAULT_GAME_LOOP_CONFIG.fixedTimestep).toBeCloseTo(16.67, 1);
      expect(DEFAULT_GAME_LOOP_CONFIG.maxDeltaTime).toBe(100);
      expect(DEFAULT_GAME_LOOP_CONFIG.useFixedTimestep).toBe(true);
      expect(DEFAULT_GAME_LOOP_CONFIG.interpolate).toBe(true);
      expect(DEFAULT_GAME_LOOP_CONFIG.autoPauseOnHidden).toBe(true);
    });
  });
});
