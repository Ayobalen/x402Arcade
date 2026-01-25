/**
 * Tests for Loop Animation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  createLoop,
  LOOP_PRESETS,
  getLoopPreset,
  customLoop,
  type LoopOptions,
  type LoopPreset,
} from '../loop';

describe('loop', () => {
  describe('createLoop', () => {
    it('should create loop animation with default values', () => {
      const animation = createLoop({
        keyframes: { scale: [1, 1.1, 1] },
      });

      expect(animation).toHaveProperty('scale');
      expect(animation).toHaveProperty('transition');
      expect(animation.transition).toMatchObject({
        duration: 1,
        repeat: Infinity,
        repeatType: 'loop',
        repeatDelay: 0,
        ease: 'easeInOut',
        delay: 0,
      });
    });

    it('should apply custom duration', () => {
      const animation = createLoop({
        keyframes: { opacity: [0, 1] },
        duration: 2,
      });

      expect(animation.transition.duration).toBe(2);
    });

    it('should apply custom repeat count', () => {
      const animation = createLoop({
        keyframes: { x: [0, 100] },
        repeat: 5,
      });

      expect(animation.transition.repeat).toBe(5);
    });

    it('should support infinite repeat', () => {
      const animation = createLoop({
        keyframes: { rotate: 360 },
        repeat: Infinity,
      });

      expect(animation.transition.repeat).toBe(Infinity);
    });

    it('should apply reverse repeat type', () => {
      const animation = createLoop({
        keyframes: { x: [0, 100] },
        repeatType: 'reverse',
      });

      expect(animation.transition.repeatType).toBe('reverse');
    });

    it('should apply mirror repeat type', () => {
      const animation = createLoop({
        keyframes: { scale: [1, 2] },
        repeatType: 'mirror',
      });

      expect(animation.transition.repeatType).toBe('mirror');
    });

    it('should apply repeat delay', () => {
      const animation = createLoop({
        keyframes: { opacity: [0, 1] },
        repeatDelay: 0.5,
      });

      expect(animation.transition.repeatDelay).toBe(0.5);
    });

    it('should apply custom easing', () => {
      const animation = createLoop({
        keyframes: { y: [0, -10] },
        ease: 'linear',
      });

      expect(animation.transition.ease).toBe('linear');
    });

    it('should apply initial delay', () => {
      const animation = createLoop({
        keyframes: { scale: [1, 1.1] },
        delay: 1,
      });

      expect(animation.transition.delay).toBe(1);
    });

    it('should merge keyframes into animation object', () => {
      const animation = createLoop({
        keyframes: { x: [0, 50], y: [0, -20] },
      });

      expect(animation).toHaveProperty('x');
      expect(animation).toHaveProperty('y');
      expect(animation.x).toEqual([0, 50]);
      expect(animation.y).toEqual([0, -20]);
    });

    it('should handle complex keyframes', () => {
      const animation = createLoop({
        keyframes: {
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [1, 0.5, 1],
        },
        duration: 2,
      });

      expect(animation.scale).toEqual([1, 1.2, 1]);
      expect(animation.rotate).toEqual([0, 180, 360]);
      expect(animation.opacity).toEqual([1, 0.5, 1]);
    });
  });

  describe('LOOP_PRESETS', () => {
    it('should define pulse preset', () => {
      const preset = LOOP_PRESETS.pulse;

      expect(preset).toHaveProperty('scale');
      expect(preset).toHaveProperty('transition');
      expect(preset.scale).toEqual([1, 1.05, 1]);
      expect(preset.transition.duration).toBe(2);
    });

    it('should define pulseFast preset', () => {
      const preset = LOOP_PRESETS.pulseFast;

      expect(preset).toHaveProperty('scale');
      expect(preset.scale).toEqual([1, 1.1, 1]);
      expect(preset.transition.duration).toBe(1);
    });

    it('should define pulseSlow preset', () => {
      const preset = LOOP_PRESETS.pulseSlow;

      expect(preset).toHaveProperty('scale');
      expect(preset.scale).toEqual([1, 1.03, 1]);
      expect(preset.transition.duration).toBe(3);
    });

    it('should define bounce preset', () => {
      const preset = LOOP_PRESETS.bounce;

      expect(preset).toHaveProperty('y');
      expect(preset.y).toEqual([0, -10, 0]);
      expect(preset.transition.ease).toBe('easeOut');
    });

    it('should define float preset', () => {
      const preset = LOOP_PRESETS.float;

      expect(preset).toHaveProperty('y');
      expect(preset.y).toEqual([0, -15, 0]);
      expect(preset.transition.duration).toBe(3);
    });

    it('should define spin preset', () => {
      const preset = LOOP_PRESETS.spin;

      expect(preset).toHaveProperty('rotate');
      expect(preset.rotate).toBe(360);
      expect(preset.transition.duration).toBe(2);
      expect(preset.transition.ease).toBe('linear');
    });

    it('should define spinSlow preset', () => {
      const preset = LOOP_PRESETS.spinSlow;

      expect(preset).toHaveProperty('rotate');
      expect(preset.rotate).toBe(360);
      expect(preset.transition.duration).toBe(4);
    });

    it('should define wiggle preset', () => {
      const preset = LOOP_PRESETS.wiggle;

      expect(preset).toHaveProperty('rotate');
      expect(preset.rotate).toEqual([0, -5, 5, -5, 5, 0]);
      expect(preset.transition.repeat).toBe(2);
    });

    it('should define glow preset', () => {
      const preset = LOOP_PRESETS.glow;

      expect(preset).toHaveProperty('opacity');
      expect(preset.opacity).toEqual([0.7, 1, 0.7]);
      expect(preset.transition.duration).toBe(2);
    });

    it('should define blink preset', () => {
      const preset = LOOP_PRESETS.blink;

      expect(preset).toHaveProperty('opacity');
      expect(preset.opacity).toEqual([1, 0, 1]);
      expect(preset.transition.ease).toBe('steps(1)');
    });

    it('should define shimmer preset', () => {
      const preset = LOOP_PRESETS.shimmer;

      expect(preset).toHaveProperty('x');
      expect(preset.x).toEqual(['-100%', '100%']);
      expect(preset.transition.ease).toBe('linear');
    });

    it('should define shake preset', () => {
      const preset = LOOP_PRESETS.shake;

      expect(preset).toHaveProperty('x');
      expect(preset.x).toEqual([0, -10, 10, -10, 10, 0]);
      expect(preset.transition.repeat).toBe(1);
    });

    it('should define loadingPulse preset', () => {
      const preset = LOOP_PRESETS.loadingPulse;

      expect(preset).toHaveProperty('scale');
      expect(preset).toHaveProperty('opacity');
      expect(preset.scale).toEqual([1, 1.05, 1]);
      expect(preset.opacity).toEqual([1, 0.8, 1]);
      expect(preset.transition.duration).toBe(1.5);
      expect(preset.transition.ease).toBe('easeInOut');
    });

    it('should have all presets with infinite repeat by default', () => {
      const infinitePresets = [
        'pulse',
        'pulseFast',
        'pulseSlow',
        'bounce',
        'float',
        'spin',
        'spinSlow',
        'glow',
        'blink',
        'shimmer',
        'loadingPulse',
      ];

      infinitePresets.forEach((presetName) => {
        const preset = LOOP_PRESETS[presetName as keyof typeof LOOP_PRESETS];
        expect(preset.transition.repeat).toBe(Infinity);
      });
    });

    it('should have finite repeat presets', () => {
      // Wiggle and shake should have finite repeats
      expect(LOOP_PRESETS.wiggle.transition.repeat).toBe(2);
      expect(LOOP_PRESETS.shake.transition.repeat).toBe(1);
    });
  });

  describe('getLoopPreset', () => {
    it('should return pulse preset', () => {
      const preset = getLoopPreset('pulse');

      expect(preset).toBe(LOOP_PRESETS.pulse);
    });

    it('should return spin preset', () => {
      const preset = getLoopPreset('spin');

      expect(preset).toBe(LOOP_PRESETS.spin);
    });

    it('should return glow preset', () => {
      const preset = getLoopPreset('glow');

      expect(preset).toBe(LOOP_PRESETS.glow);
    });

    it('should return all defined presets', () => {
      const presetKeys: LoopPreset[] = [
        'pulse',
        'pulseFast',
        'pulseSlow',
        'bounce',
        'float',
        'spin',
        'spinSlow',
        'wiggle',
        'glow',
        'blink',
        'shimmer',
        'shake',
        'loadingPulse',
      ];

      presetKeys.forEach((key) => {
        const preset = getLoopPreset(key);
        expect(preset).toBeDefined();
        expect(preset).toBe(LOOP_PRESETS[key]);
      });
    });
  });

  describe('customLoop', () => {
    it('should create custom loop from preset with duration override', () => {
      const animation = customLoop('pulse', { duration: 4 });

      expect(animation).toHaveProperty('scale');
      expect(animation.transition.duration).toBe(4);
      // Should keep other defaults from pulse preset
      expect(animation.transition.ease).toBe('easeInOut');
    });

    it('should create custom loop with repeat override', () => {
      const animation = customLoop('spin', { repeat: 3 });

      expect(animation).toHaveProperty('rotate');
      expect(animation.transition.repeat).toBe(3);
    });

    it('should create custom loop with repeatType override', () => {
      const animation = customLoop('bounce', { repeatType: 'reverse' });

      expect(animation).toHaveProperty('y');
      expect(animation.transition.repeatType).toBe('reverse');
    });

    it('should create custom loop with custom keyframes', () => {
      const animation = customLoop('pulse', {
        keyframes: { opacity: [0, 1] },
      });

      expect(animation).toHaveProperty('opacity');
      expect(animation.opacity).toEqual([0, 1]);
    });

    it('should create custom loop with multiple overrides', () => {
      const animation = customLoop('glow', {
        duration: 1,
        repeat: 5,
        ease: 'linear',
      });

      expect(animation.transition.duration).toBe(1);
      expect(animation.transition.repeat).toBe(5);
      expect(animation.transition.ease).toBe('linear');
    });

    it('should preserve preset values when not overridden', () => {
      const animation = customLoop('float', { duration: 2 });

      // Should keep keyframes from float preset
      expect(animation).toHaveProperty('y');
      expect(animation.y).toEqual([0, -15, 0]);
      // Should keep ease from float preset
      expect(animation.transition.ease).toBe('easeInOut');
    });
  });
});
