/**
 * Tests for Gesture Animation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  HOVER_PRESETS,
  TAP_PRESETS,
  FOCUS_PRESETS,
  DRAG_CONSTRAINTS,
  DRAG_ELASTIC,
  BUTTON_GESTURES,
  getHoverPreset,
  getTapPreset,
  getFocusPreset,
  getDragConstraintPreset,
  getDragElasticPreset,
  getButtonGesturePreset,
  type HoverPreset,
  type TapPreset,
  type FocusPreset,
} from '../gestures';

describe('gestures', () => {
  describe('HOVER_PRESETS', () => {
    it('should define lift preset', () => {
      const preset = HOVER_PRESETS.lift;

      expect(preset).toHaveProperty('scale', 1.05);
      expect(preset).toHaveProperty('y', -2);
      expect(preset.transition).toMatchObject({
        duration: 0.2,
        ease: 'easeOut',
      });
    });

    it('should define scale preset', () => {
      const preset = HOVER_PRESETS.scale;

      expect(preset).toHaveProperty('scale', 1.1);
      expect(preset.transition.duration).toBe(0.2);
    });

    it('should define scaleSubtle preset', () => {
      const preset = HOVER_PRESETS.scaleSubtle;

      expect(preset).toHaveProperty('scale', 1.02);
      expect(preset.transition.ease).toBe('easeOut');
    });

    it('should define glow preset', () => {
      const preset = HOVER_PRESETS.glow;

      expect(preset).toHaveProperty('filter', 'brightness(1.2)');
      expect(preset.transition.duration).toBe(0.2);
    });

    it('should define glowScale preset', () => {
      const preset = HOVER_PRESETS.glowScale;

      expect(preset).toHaveProperty('scale', 1.05);
      expect(preset).toHaveProperty('filter', 'brightness(1.2)');
    });

    it('should define float preset', () => {
      const preset = HOVER_PRESETS.float;

      expect(preset).toHaveProperty('y', -4);
      expect(preset).toHaveProperty('boxShadow');
    });

    it('should define rotate preset', () => {
      const preset = HOVER_PRESETS.rotate;

      expect(preset).toHaveProperty('rotate', 5);
    });

    it('should define pulse preset', () => {
      const preset = HOVER_PRESETS.pulse;

      expect(preset).toHaveProperty('scale', [1, 1.05, 1]);
      expect(preset.transition.duration).toBe(0.6);
    });

    it('should define tilt preset', () => {
      const preset = HOVER_PRESETS.tilt;

      expect(preset).toHaveProperty('rotateY', 5);
      expect(preset).toHaveProperty('rotateX', 2);
    });

    it('should have all presets with transitions', () => {
      const presetKeys = Object.keys(HOVER_PRESETS) as HoverPreset[];

      presetKeys.forEach((key) => {
        const preset = HOVER_PRESETS[key];
        expect(preset).toHaveProperty('transition');
      });
    });
  });

  describe('TAP_PRESETS', () => {
    it('should define shrink preset', () => {
      const preset = TAP_PRESETS.shrink;

      expect(preset).toHaveProperty('scale', 0.95);
      expect(preset.transition).toMatchObject({
        duration: 0.1,
        ease: 'easeOut',
      });
    });

    it('should define press preset', () => {
      const preset = TAP_PRESETS.press;

      expect(preset).toHaveProperty('scale', 0.97);
      expect(preset).toHaveProperty('y', 1);
    });

    it('should define grow preset', () => {
      const preset = TAP_PRESETS.grow;

      expect(preset).toHaveProperty('scale', 1.05);
    });

    it('should define bounce preset', () => {
      const preset = TAP_PRESETS.bounce;

      expect(preset).toHaveProperty('scale', [1, 0.9, 1.05, 1]);
      expect(preset.transition.duration).toBe(0.4);
    });

    it('should define flash preset', () => {
      const preset = TAP_PRESETS.flash;

      expect(preset).toHaveProperty('opacity', 0.7);
      expect(preset.transition.duration).toBe(0.1);
    });

    it('should define none preset', () => {
      const preset = TAP_PRESETS.none;

      // Should be an empty object (no animation)
      expect(Object.keys(preset).length).toBe(0);
    });

    it('should have quick durations for immediate feedback', () => {
      const quickPresets: TapPreset[] = ['shrink', 'press', 'grow', 'flash'];

      quickPresets.forEach((key) => {
        const preset = TAP_PRESETS[key];
        if (preset.transition) {
          expect(preset.transition.duration).toBeLessThanOrEqual(0.1);
        }
      });
    });
  });

  describe('FOCUS_PRESETS', () => {
    it('should define glow preset', () => {
      const preset = FOCUS_PRESETS.glow;

      expect(preset).toHaveProperty('boxShadow');
      expect(preset.boxShadow).toContain('rgba(139, 92, 246');
      expect(preset.transition.duration).toBe(0.15);
    });

    it('should define scaleGlow preset', () => {
      const preset = FOCUS_PRESETS.scaleGlow;

      expect(preset).toHaveProperty('scale', 1.02);
      expect(preset).toHaveProperty('boxShadow');
    });

    it('should define brighten preset', () => {
      const preset = FOCUS_PRESETS.brighten;

      expect(preset).toHaveProperty('filter', 'brightness(1.1)');
    });

    it('should define outline preset', () => {
      const preset = FOCUS_PRESETS.outline;

      expect(preset).toHaveProperty('borderColor');
      expect(preset).toHaveProperty('borderWidth', '2px');
    });

    it('should use consistent focus duration', () => {
      const presetKeys = Object.keys(FOCUS_PRESETS) as FocusPreset[];

      presetKeys.forEach((key) => {
        const preset = FOCUS_PRESETS[key];
        expect(preset.transition.duration).toBe(0.15);
      });
    });
  });

  describe('DRAG_CONSTRAINTS', () => {
    it('should define tight constraints', () => {
      const constraints = DRAG_CONSTRAINTS.tight;

      expect(constraints).toEqual({
        top: -10,
        left: -10,
        right: 10,
        bottom: 10,
      });
    });

    it('should define normal constraints', () => {
      const constraints = DRAG_CONSTRAINTS.normal;

      expect(constraints).toEqual({
        top: -50,
        left: -50,
        right: 50,
        bottom: 50,
      });
    });

    it('should define wide constraints', () => {
      const constraints = DRAG_CONSTRAINTS.wide;

      expect(constraints).toEqual({
        top: -100,
        left: -100,
        right: 100,
        bottom: 100,
      });
    });

    it('should define horizontal constraints', () => {
      const constraints = DRAG_CONSTRAINTS.horizontal;

      expect(constraints).toEqual({
        top: 0,
        bottom: 0,
        left: -100,
        right: 100,
      });
    });

    it('should define vertical constraints', () => {
      const constraints = DRAG_CONSTRAINTS.vertical;

      expect(constraints).toEqual({
        left: 0,
        right: 0,
        top: -100,
        bottom: 100,
      });
    });

    it('should define none constraints', () => {
      const constraints = DRAG_CONSTRAINTS.none;

      expect(constraints).toBeUndefined();
    });
  });

  describe('DRAG_ELASTIC', () => {
    it('should define none elastic', () => {
      expect(DRAG_ELASTIC.none).toBe(0);
    });

    it('should define subtle elastic', () => {
      expect(DRAG_ELASTIC.subtle).toBe(0.1);
    });

    it('should define normal elastic', () => {
      expect(DRAG_ELASTIC.normal).toBe(0.3);
    });

    it('should define bouncy elastic', () => {
      expect(DRAG_ELASTIC.bouncy).toBe(0.5);
    });

    it('should define veryBouncy elastic', () => {
      expect(DRAG_ELASTIC.veryBouncy).toBe(0.7);
    });

    it('should have values in ascending order', () => {
      expect(DRAG_ELASTIC.none).toBeLessThan(DRAG_ELASTIC.subtle);
      expect(DRAG_ELASTIC.subtle).toBeLessThan(DRAG_ELASTIC.normal);
      expect(DRAG_ELASTIC.normal).toBeLessThan(DRAG_ELASTIC.bouncy);
      expect(DRAG_ELASTIC.bouncy).toBeLessThan(DRAG_ELASTIC.veryBouncy);
    });
  });

  describe('BUTTON_GESTURES', () => {
    it('should define default button gestures', () => {
      const gestures = BUTTON_GESTURES.default;

      expect(gestures).toHaveProperty('whileHover', HOVER_PRESETS.lift);
      expect(gestures).toHaveProperty('whileTap', TAP_PRESETS.shrink);
      expect(gestures).toHaveProperty('whileFocus', FOCUS_PRESETS.glow);
    });

    it('should define subtle button gestures', () => {
      const gestures = BUTTON_GESTURES.subtle;

      expect(gestures).toHaveProperty('whileHover', HOVER_PRESETS.scaleSubtle);
      expect(gestures).toHaveProperty('whileTap', TAP_PRESETS.press);
      expect(gestures).toHaveProperty('whileFocus', FOCUS_PRESETS.brighten);
    });

    it('should define playful button gestures', () => {
      const gestures = BUTTON_GESTURES.playful;

      expect(gestures).toHaveProperty('whileHover', HOVER_PRESETS.float);
      expect(gestures).toHaveProperty('whileTap', TAP_PRESETS.bounce);
      expect(gestures).toHaveProperty('whileFocus', FOCUS_PRESETS.scaleGlow);
    });

    it('should define neon button gestures', () => {
      const gestures = BUTTON_GESTURES.neon;

      expect(gestures).toHaveProperty('whileHover', HOVER_PRESETS.glowScale);
      expect(gestures).toHaveProperty('whileTap', TAP_PRESETS.shrink);
      expect(gestures).toHaveProperty('whileFocus', FOCUS_PRESETS.glow);
    });

    it('should define scale button gestures', () => {
      const gestures = BUTTON_GESTURES.scale;

      expect(gestures).toHaveProperty('whileHover', HOVER_PRESETS.scale);
      expect(gestures).toHaveProperty('whileTap', TAP_PRESETS.shrink);
      expect(gestures).toHaveProperty('whileFocus', FOCUS_PRESETS.scaleGlow);
    });

    it('should include all three gesture types in each preset', () => {
      const buttonGestureKeys = Object.keys(BUTTON_GESTURES);

      buttonGestureKeys.forEach((key) => {
        const gestures = BUTTON_GESTURES[key as keyof typeof BUTTON_GESTURES];
        expect(gestures).toHaveProperty('whileHover');
        expect(gestures).toHaveProperty('whileTap');
        expect(gestures).toHaveProperty('whileFocus');
      });
    });
  });

  describe('getHoverPreset', () => {
    it('should return lift preset', () => {
      const preset = getHoverPreset('lift');

      expect(preset).toBe(HOVER_PRESETS.lift);
    });

    it('should return all hover presets', () => {
      const presetKeys: HoverPreset[] = [
        'lift',
        'scale',
        'scaleSubtle',
        'glow',
        'glowScale',
        'float',
        'rotate',
        'pulse',
        'tilt',
      ];

      presetKeys.forEach((key) => {
        const preset = getHoverPreset(key);
        expect(preset).toBe(HOVER_PRESETS[key]);
      });
    });
  });

  describe('getTapPreset', () => {
    it('should return shrink preset', () => {
      const preset = getTapPreset('shrink');

      expect(preset).toBe(TAP_PRESETS.shrink);
    });

    it('should return all tap presets', () => {
      const presetKeys: TapPreset[] = ['shrink', 'press', 'grow', 'bounce', 'flash', 'none'];

      presetKeys.forEach((key) => {
        const preset = getTapPreset(key);
        expect(preset).toBe(TAP_PRESETS[key]);
      });
    });
  });

  describe('getFocusPreset', () => {
    it('should return glow preset', () => {
      const preset = getFocusPreset('glow');

      expect(preset).toBe(FOCUS_PRESETS.glow);
    });

    it('should return all focus presets', () => {
      const presetKeys: FocusPreset[] = ['glow', 'scaleGlow', 'brighten', 'outline'];

      presetKeys.forEach((key) => {
        const preset = getFocusPreset(key);
        expect(preset).toBe(FOCUS_PRESETS[key]);
      });
    });
  });

  describe('getDragConstraintPreset', () => {
    it('should return tight constraints', () => {
      const constraints = getDragConstraintPreset('tight');

      expect(constraints).toBe(DRAG_CONSTRAINTS.tight);
    });

    it('should return none as undefined', () => {
      const constraints = getDragConstraintPreset('none');

      expect(constraints).toBeUndefined();
    });

    it('should return all constraint presets', () => {
      const presetKeys = ['tight', 'normal', 'wide', 'horizontal', 'vertical', 'none'] as const;

      presetKeys.forEach((key) => {
        const constraints = getDragConstraintPreset(key);
        expect(constraints).toBe(DRAG_CONSTRAINTS[key]);
      });
    });
  });

  describe('getDragElasticPreset', () => {
    it('should return none as 0', () => {
      const elastic = getDragElasticPreset('none');

      expect(elastic).toBe(0);
    });

    it('should return bouncy value', () => {
      const elastic = getDragElasticPreset('bouncy');

      expect(elastic).toBe(0.5);
    });

    it('should return all elastic presets', () => {
      const presetKeys = ['none', 'subtle', 'normal', 'bouncy', 'veryBouncy'] as const;

      presetKeys.forEach((key) => {
        const elastic = getDragElasticPreset(key);
        expect(elastic).toBe(DRAG_ELASTIC[key]);
      });
    });
  });

  describe('getButtonGesturePreset', () => {
    it('should return default button gestures', () => {
      const gestures = getButtonGesturePreset('default');

      expect(gestures).toBe(BUTTON_GESTURES.default);
    });

    it('should return neon button gestures', () => {
      const gestures = getButtonGesturePreset('neon');

      expect(gestures).toBe(BUTTON_GESTURES.neon);
    });

    it('should return all button gesture presets', () => {
      const presetKeys = ['default', 'subtle', 'playful', 'neon', 'scale'] as const;

      presetKeys.forEach((key) => {
        const gestures = getButtonGesturePreset(key);
        expect(gestures).toBe(BUTTON_GESTURES[key]);
      });
    });
  });
});
