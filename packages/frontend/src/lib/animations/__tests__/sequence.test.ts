/**
 * Tests for Sequence Animation Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AnimationControls } from 'framer-motion';
import {
  sequence,
  createSequence,
  sequencePreset,
  SEQUENCE_PRESETS,
  getSequencePreset,
  type AnimationStep,
  type SequenceOptions,
} from '../sequence';

// Mock AnimationControls
const createMockControls = (): AnimationControls => {
  return {
    start: vi.fn().mockResolvedValue(undefined),
    set: vi.fn(),
    stop: vi.fn(),
    mount: vi.fn().mockReturnValue(() => {}),
  } as unknown as AnimationControls;
};

describe('sequence', () => {
  let controls: AnimationControls;

  beforeEach(() => {
    controls = createMockControls();
    vi.clearAllMocks();
  });

  describe('sequence function', () => {
    it('should execute a single animation step', async () => {
      const steps: AnimationStep[] = [{ to: { opacity: 1 }, duration: 0.3 }];

      await sequence(controls, steps);

      expect(controls.start).toHaveBeenCalledTimes(1);
      expect(controls.start).toHaveBeenCalledWith({
        opacity: 1,
        transition: {
          duration: 0.3,
          ease: 'easeOut',
        },
      });
    });

    it('should execute multiple animation steps in order', async () => {
      const steps: AnimationStep[] = [
        { to: { opacity: 1 }, duration: 0.3 },
        { to: { scale: 1.2 }, duration: 0.2 },
        { to: { scale: 1 }, duration: 0.2 },
      ];

      await sequence(controls, steps);

      expect(controls.start).toHaveBeenCalledTimes(3);
      expect(controls.start).toHaveBeenNthCalledWith(1, {
        opacity: 1,
        transition: { duration: 0.3, ease: 'easeOut' },
      });
      expect(controls.start).toHaveBeenNthCalledWith(2, {
        scale: 1.2,
        transition: { duration: 0.2, ease: 'easeOut' },
      });
      expect(controls.start).toHaveBeenNthCalledWith(3, {
        scale: 1,
        transition: { duration: 0.2, ease: 'easeOut' },
      });
    });

    it('should apply custom easing', async () => {
      const steps: AnimationStep[] = [{ to: { x: 100 }, duration: 0.5, ease: 'easeInOut' }];

      await sequence(controls, steps);

      expect(controls.start).toHaveBeenCalledWith({
        x: 100,
        transition: {
          duration: 0.5,
          ease: 'easeInOut',
        },
      });
    });

    it('should execute onStart callback before step', async () => {
      const onStart = vi.fn();
      const steps: AnimationStep[] = [{ to: { opacity: 1 }, onStart }];

      await sequence(controls, steps);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledBefore(controls.start as any);
    });

    it('should execute onComplete callback after step', async () => {
      const onComplete = vi.fn();
      const steps: AnimationStep[] = [{ to: { opacity: 1 }, onComplete }];

      await sequence(controls, steps);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(controls.start).toHaveBeenCalledBefore(onComplete);
    });

    it('should execute sequence onStart callback before steps', async () => {
      const onStart = vi.fn();
      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];
      const options: SequenceOptions = { onStart };

      await sequence(controls, steps, options);

      expect(onStart).toHaveBeenCalledTimes(1);
      expect(onStart).toHaveBeenCalledBefore(controls.start as any);
    });

    it('should execute sequence onComplete callback after all steps', async () => {
      const onComplete = vi.fn();
      const steps: AnimationStep[] = [{ to: { opacity: 1 } }, { to: { scale: 1.2 } }];
      const options: SequenceOptions = { onComplete };

      await sequence(controls, steps, options);

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(controls.start).toHaveBeenCalledBefore(onComplete);
    });

    it('should handle async onStart callbacks', async () => {
      const onStart = vi.fn().mockResolvedValue(undefined);
      const steps: AnimationStep[] = [{ to: { opacity: 1 }, onStart }];

      await sequence(controls, steps);

      expect(onStart).toHaveBeenCalled();
    });

    it('should handle async onComplete callbacks', async () => {
      const onComplete = vi.fn().mockResolvedValue(undefined);
      const steps: AnimationStep[] = [{ to: { opacity: 1 }, onComplete }];

      await sequence(controls, steps);

      expect(onComplete).toHaveBeenCalled();
    });

    it('should apply step delay', async () => {
      vi.useFakeTimers();

      const steps: AnimationStep[] = [{ to: { opacity: 1 }, delay: 0.5 }];

      const promise = sequence(controls, steps);

      // Should not have called start yet
      expect(controls.start).not.toHaveBeenCalled();

      // Fast forward delay
      await vi.advanceTimersByTimeAsync(500);

      // Now should have called start
      await promise;
      expect(controls.start).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should apply initial delay', async () => {
      vi.useFakeTimers();

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];
      const options: SequenceOptions = { initialDelay: 0.3 };

      const promise = sequence(controls, steps, options);

      // Should not have called start yet
      expect(controls.start).not.toHaveBeenCalled();

      // Fast forward delay
      await vi.advanceTimersByTimeAsync(300);

      // Now should have called start
      await promise;
      expect(controls.start).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should suppress errors when suppressErrors is true', async () => {
      const error = new Error('Animation failed');
      const mockControlsWithError = {
        ...controls,
        start: vi.fn().mockRejectedValue(error),
      } as unknown as AnimationControls;

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];
      const options: SequenceOptions = { suppressErrors: true };

      // Should not throw
      await expect(sequence(mockControlsWithError, steps, options)).resolves.toBeUndefined();
    });

    it('should throw errors when suppressErrors is false', async () => {
      const error = new Error('Animation failed');
      const mockControlsWithError = {
        ...controls,
        start: vi.fn().mockRejectedValue(error),
      } as unknown as AnimationControls;

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];
      const options: SequenceOptions = { suppressErrors: false };

      // Should throw
      await expect(sequence(mockControlsWithError, steps, options)).rejects.toThrow(
        'Animation failed'
      );
    });

    it('should wait for each step when waitForCompletion is true', async () => {
      let resolveFirst: () => void;
      const firstPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      const mockControlsDelayed = {
        ...controls,
        start: vi.fn().mockReturnValueOnce(firstPromise).mockResolvedValue(undefined),
      } as unknown as AnimationControls;

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }, { to: { scale: 1.2 } }];

      const promise = sequence(mockControlsDelayed, steps, { waitForCompletion: true });

      // First step should be called
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockControlsDelayed.start).toHaveBeenCalledTimes(1);

      // Second step should NOT be called yet
      expect(mockControlsDelayed.start).toHaveBeenCalledTimes(1);

      // Resolve first animation
      resolveFirst!();
      await promise;

      // Now second step should be called
      expect(mockControlsDelayed.start).toHaveBeenCalledTimes(2);
    });

    it('should not wait for steps when waitForCompletion is false', async () => {
      const steps: AnimationStep[] = [{ to: { opacity: 1 } }, { to: { scale: 1.2 } }];

      await sequence(controls, steps, { waitForCompletion: false });

      // All steps should be called immediately
      expect(controls.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('createSequence', () => {
    it('should create a reusable sequence function', async () => {
      const runSequence = createSequence(controls);

      expect(typeof runSequence).toBe('function');

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];

      await runSequence(steps);

      expect(controls.start).toHaveBeenCalledTimes(1);
    });

    it('should allow calling the sequence multiple times', async () => {
      const runSequence = createSequence(controls);

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];

      await runSequence(steps);
      await runSequence(steps);

      expect(controls.start).toHaveBeenCalledTimes(2);
    });

    it('should accept options', async () => {
      const runSequence = createSequence(controls);
      const onComplete = vi.fn();

      const steps: AnimationStep[] = [{ to: { opacity: 1 } }];

      await runSequence(steps, { onComplete });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('SEQUENCE_PRESETS', () => {
    it('should contain all expected presets', () => {
      expect(SEQUENCE_PRESETS).toHaveProperty('pulse');
      expect(SEQUENCE_PRESETS).toHaveProperty('bounce');
      expect(SEQUENCE_PRESETS).toHaveProperty('shake');
      expect(SEQUENCE_PRESETS).toHaveProperty('fadeInScale');
      expect(SEQUENCE_PRESETS).toHaveProperty('fadeOutScale');
      expect(SEQUENCE_PRESETS).toHaveProperty('glow');
      expect(SEQUENCE_PRESETS).toHaveProperty('slideInLeft');
      expect(SEQUENCE_PRESETS).toHaveProperty('slideInRight');
      expect(SEQUENCE_PRESETS).toHaveProperty('slideInTop');
      expect(SEQUENCE_PRESETS).toHaveProperty('slideInBottom');
      expect(SEQUENCE_PRESETS).toHaveProperty('rotateIn');
      expect(SEQUENCE_PRESETS).toHaveProperty('success');
      expect(SEQUENCE_PRESETS).toHaveProperty('error');
      expect(SEQUENCE_PRESETS).toHaveProperty('loading');
    });

    it('should have array of steps for each preset', () => {
      Object.values(SEQUENCE_PRESETS).forEach((preset) => {
        expect(Array.isArray(preset)).toBe(true);
        expect(preset.length).toBeGreaterThan(0);
      });
    });

    describe('pulse preset', () => {
      it('should have 2 steps', () => {
        expect(SEQUENCE_PRESETS.pulse).toHaveLength(2);
      });

      it('should scale up then down', () => {
        const [up, down] = SEQUENCE_PRESETS.pulse;

        expect(up.to.scale).toBe(1.05);
        expect(down.to.scale).toBe(1);
      });
    });

    describe('bounce preset', () => {
      it('should have 3 steps', () => {
        expect(SEQUENCE_PRESETS.bounce).toHaveLength(3);
      });

      it('should scale up, down, then back to normal', () => {
        const [up, down, normal] = SEQUENCE_PRESETS.bounce;

        expect(up.to.scale).toBe(1.2);
        expect(down.to.scale).toBe(0.9);
        expect(normal.to.scale).toBe(1);
      });
    });

    describe('shake preset', () => {
      it('should have 5 steps', () => {
        expect(SEQUENCE_PRESETS.shake).toHaveLength(5);
      });

      it('should move left, right, left, right, center', () => {
        const [left1, right1, left2, right2, center] = SEQUENCE_PRESETS.shake;

        expect(left1.to.x).toBe(-10);
        expect(right1.to.x).toBe(10);
        expect(left2.to.x).toBe(-10);
        expect(right2.to.x).toBe(10);
        expect(center.to.x).toBe(0);
      });
    });

    describe('fadeInScale preset', () => {
      it('should have 2 steps', () => {
        expect(SEQUENCE_PRESETS.fadeInScale).toHaveLength(2);
      });

      it('should start hidden and scale up', () => {
        const [initial, final] = SEQUENCE_PRESETS.fadeInScale;

        expect(initial.to.opacity).toBe(0);
        expect(initial.to.scale).toBe(0.9);
        expect(final.to.opacity).toBe(1);
        expect(final.to.scale).toBe(1);
      });
    });

    describe('fadeOutScale preset', () => {
      it('should have 1 step', () => {
        expect(SEQUENCE_PRESETS.fadeOutScale).toHaveLength(1);
      });

      it('should fade out and scale down', () => {
        const [step] = SEQUENCE_PRESETS.fadeOutScale;

        expect(step.to.opacity).toBe(0);
        expect(step.to.scale).toBe(0.9);
      });
    });

    describe('glow preset', () => {
      it('should have 2 steps', () => {
        expect(SEQUENCE_PRESETS.glow).toHaveLength(2);
      });

      it('should brighten then dim', () => {
        const [brighten, dim] = SEQUENCE_PRESETS.glow;

        expect(brighten.to.filter).toContain('brightness(1.2)');
        expect(dim.to.filter).toContain('brightness(1)');
      });
    });

    describe('slide presets', () => {
      it('slideInLeft should move from left', () => {
        const [initial, final] = SEQUENCE_PRESETS.slideInLeft;

        expect(initial.to.x).toBe(-50);
        expect(final.to.x).toBe(0);
      });

      it('slideInRight should move from right', () => {
        const [initial, final] = SEQUENCE_PRESETS.slideInRight;

        expect(initial.to.x).toBe(50);
        expect(final.to.x).toBe(0);
      });

      it('slideInTop should move from top', () => {
        const [initial, final] = SEQUENCE_PRESETS.slideInTop;

        expect(initial.to.y).toBe(-50);
        expect(final.to.y).toBe(0);
      });

      it('slideInBottom should move from bottom', () => {
        const [initial, final] = SEQUENCE_PRESETS.slideInBottom;

        expect(initial.to.y).toBe(50);
        expect(final.to.y).toBe(0);
      });
    });

    describe('rotateIn preset', () => {
      it('should have 2 steps', () => {
        expect(SEQUENCE_PRESETS.rotateIn).toHaveLength(2);
      });

      it('should rotate from -180 to 0', () => {
        const [initial, final] = SEQUENCE_PRESETS.rotateIn;

        expect(initial.to.rotate).toBe(-180);
        expect(final.to.rotate).toBe(0);
      });
    });

    describe('success preset', () => {
      it('should have 3 steps', () => {
        expect(SEQUENCE_PRESETS.success).toHaveLength(3);
      });

      it('should include green glow', () => {
        const steps = SEQUENCE_PRESETS.success;

        expect(steps[1].to.filter).toContain('#00ff00');
      });
    });

    describe('error preset', () => {
      it('should have 4 steps', () => {
        expect(SEQUENCE_PRESETS.error).toHaveLength(4);
      });

      it('should include red glow and shake', () => {
        const steps = SEQUENCE_PRESETS.error;

        expect(steps[0].to.filter).toContain('#ff0000');
        expect(steps[0].to.x).toBe(-10);
      });
    });

    describe('loading preset', () => {
      it('should have 2 steps (pulse animation)', () => {
        expect(SEQUENCE_PRESETS.loading).toHaveLength(2);
      });

      it('should pulse scale and opacity', () => {
        const [grow, shrink] = SEQUENCE_PRESETS.loading;

        expect(grow.to.scale).toBe(1.1);
        expect(grow.to.opacity).toBe(0.7);
        expect(shrink.to.scale).toBe(1);
        expect(shrink.to.opacity).toBe(1);
      });
    });
  });

  describe('getSequencePreset', () => {
    it('should return the correct preset for pulse', () => {
      const preset = getSequencePreset('pulse');

      expect(preset).toBe(SEQUENCE_PRESETS.pulse);
    });

    it('should return the correct preset for bounce', () => {
      const preset = getSequencePreset('bounce');

      expect(preset).toBe(SEQUENCE_PRESETS.bounce);
    });

    it('should return the correct preset for shake', () => {
      const preset = getSequencePreset('shake');

      expect(preset).toBe(SEQUENCE_PRESETS.shake);
    });
  });

  describe('sequencePreset', () => {
    it('should execute a preset sequence', async () => {
      await sequencePreset(controls, 'pulse');

      expect(controls.start).toHaveBeenCalledTimes(2);
    });

    it('should accept options', async () => {
      const onComplete = vi.fn();

      await sequencePreset(controls, 'pulse', { onComplete });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should work with different presets', async () => {
      await sequencePreset(controls, 'bounce');

      expect(controls.start).toHaveBeenCalledTimes(3);
    });
  });
});
