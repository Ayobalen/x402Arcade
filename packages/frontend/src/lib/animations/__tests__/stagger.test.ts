/**
 * Tests for Stagger Animation Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  staggerContainer,
  staggerChild,
  STAGGER_PRESETS,
  getStaggerPreset,
  type StaggerContainerOptions,
  type StaggerChildOptions,
} from '../stagger';

describe('stagger', () => {
  describe('staggerContainer', () => {
    it('should create container variants with default values', () => {
      const variants = staggerContainer();

      expect(variants).toHaveProperty('hidden');
      expect(variants).toHaveProperty('visible');
      expect(variants).toHaveProperty('exit');

      expect(variants.visible).toHaveProperty('transition');
      expect(variants.visible.transition).toMatchObject({
        delayChildren: 0,
        staggerChildren: 0.05,
        staggerDirection: 1, // forward
        duration: 0,
      });
    });

    it('should apply custom delay and stagger values', () => {
      const options: StaggerContainerOptions = {
        delayChildren: 0.2,
        staggerChildren: 0.1,
      };
      const variants = staggerContainer(options);

      expect(variants.visible.transition).toMatchObject({
        delayChildren: 0.2,
        staggerChildren: 0.1,
      });
    });

    it('should set staggerDirection to 1 for forward direction', () => {
      const variants = staggerContainer({ direction: 'forward' });

      expect(variants.visible.transition).toMatchObject({
        staggerDirection: 1,
      });
    });

    it('should set staggerDirection to -1 for reverse direction', () => {
      const variants = staggerContainer({ direction: 'reverse' });

      expect(variants.visible.transition).toMatchObject({
        staggerDirection: -1,
      });
    });

    it('should reverse exit direction for forward animations', () => {
      const variants = staggerContainer({ direction: 'forward' });

      expect(variants.exit.transition).toMatchObject({
        staggerDirection: -1, // reversed
      });
    });

    it('should reverse exit direction for reverse animations', () => {
      const variants = staggerContainer({ direction: 'reverse' });

      expect(variants.exit.transition).toMatchObject({
        staggerDirection: 1, // reversed
      });
    });

    it('should exit faster than entrance', () => {
      const variants = staggerContainer({ staggerChildren: 0.1 });

      expect(variants.exit.transition.staggerChildren).toBe(0.05); // half of 0.1
    });

    it('should apply custom duration', () => {
      const variants = staggerContainer({ duration: 0.5 });

      expect(variants.hidden.transition?.duration).toBe(0.5);
      expect(variants.visible.transition.duration).toBe(0.5);
      expect(variants.exit.transition.duration).toBe(0.5);
    });
  });

  describe('staggerChild', () => {
    it('should create child variants with default values', () => {
      const variants = staggerChild();

      expect(variants).toHaveProperty('hidden');
      expect(variants).toHaveProperty('visible');
      expect(variants).toHaveProperty('exit');

      expect(variants.hidden).toMatchObject({
        opacity: 0,
        y: 20,
        scale: 1,
      });

      expect(variants.visible).toMatchObject({
        opacity: 1,
        y: 0,
        scale: 1,
      });
    });

    it('should apply custom initial values', () => {
      const options: StaggerChildOptions = {
        initialOpacity: 0.5,
        initialY: 50,
        initialScale: 0.8,
      };
      const variants = staggerChild(options);

      expect(variants.hidden).toMatchObject({
        opacity: 0.5,
        y: 50,
        scale: 0.8,
      });
    });

    it('should apply custom duration', () => {
      const variants = staggerChild({ duration: 0.5 });

      expect(variants.visible.transition).toMatchObject({
        duration: 0.5,
      });
    });

    it('should use easeOut for visible transition', () => {
      const variants = staggerChild();

      expect(variants.visible.transition?.ease).toBe('easeOut');
    });

    it('should use easeIn for exit transition', () => {
      const variants = staggerChild();

      expect(variants.exit.transition?.ease).toBe('easeIn');
    });

    it('should exit faster than entrance', () => {
      const variants = staggerChild({ duration: 0.4 });

      expect(variants.exit.transition?.duration).toBe(0.2); // half of 0.4
    });

    it('should exit in forward direction when direction is forward', () => {
      const variants = staggerChild({ direction: 'forward', initialY: 20 });

      expect(variants.exit.y).toBe(20); // same as initialY
    });

    it('should exit in reverse direction when direction is reverse', () => {
      const variants = staggerChild({ direction: 'reverse', initialY: 20 });

      expect(variants.exit.y).toBe(-20); // negative initialY
    });

    it('should scale down slightly on exit', () => {
      const variants = staggerChild({ initialScale: 1 });

      expect(variants.exit.scale).toBe(0.95); // 1 * 0.95
    });
  });

  describe('STAGGER_PRESETS', () => {
    it('should contain all expected presets', () => {
      expect(STAGGER_PRESETS).toHaveProperty('quick');
      expect(STAGGER_PRESETS).toHaveProperty('normal');
      expect(STAGGER_PRESETS).toHaveProperty('slow');
      expect(STAGGER_PRESETS).toHaveProperty('fade');
      expect(STAGGER_PRESETS).toHaveProperty('scale');
      expect(STAGGER_PRESETS).toHaveProperty('dramatic');
    });

    it('should have container and child for each preset', () => {
      Object.values(STAGGER_PRESETS).forEach((preset) => {
        expect(preset).toHaveProperty('container');
        expect(preset).toHaveProperty('child');
      });
    });

    describe('quick preset', () => {
      it('should have fast stagger timing', () => {
        const preset = STAGGER_PRESETS.quick;

        expect(preset.container.visible.transition.staggerChildren).toBe(0.03);
        expect(preset.child.visible.transition?.duration).toBe(0.2);
      });

      it('should have minimal movement', () => {
        const preset = STAGGER_PRESETS.quick;

        expect(preset.child.hidden.y).toBe(10);
      });
    });

    describe('normal preset', () => {
      it('should have moderate stagger timing', () => {
        const preset = STAGGER_PRESETS.normal;

        expect(preset.container.visible.transition.staggerChildren).toBe(0.05);
        expect(preset.child.visible.transition?.duration).toBe(0.3);
      });

      it('should have moderate movement', () => {
        const preset = STAGGER_PRESETS.normal;

        expect(preset.child.hidden.y).toBe(20);
      });
    });

    describe('slow preset', () => {
      it('should have slow stagger timing', () => {
        const preset = STAGGER_PRESETS.slow;

        expect(preset.container.visible.transition.staggerChildren).toBe(0.1);
        expect(preset.child.visible.transition?.duration).toBe(0.5);
      });

      it('should have larger movement', () => {
        const preset = STAGGER_PRESETS.slow;

        expect(preset.child.hidden.y).toBe(30);
      });
    });

    describe('fade preset', () => {
      it('should have no vertical movement', () => {
        const preset = STAGGER_PRESETS.fade;

        expect(preset.child.hidden.y).toBe(0);
      });

      it('should have opacity change', () => {
        const preset = STAGGER_PRESETS.fade;

        expect(preset.child.hidden.opacity).toBe(0);
        expect(preset.child.visible.opacity).toBe(1);
      });
    });

    describe('scale preset', () => {
      it('should have scale change', () => {
        const preset = STAGGER_PRESETS.scale;

        expect(preset.child.hidden.scale).toBe(0.9);
        expect(preset.child.visible.scale).toBe(1);
      });

      it('should have no vertical movement', () => {
        const preset = STAGGER_PRESETS.scale;

        expect(preset.child.hidden.y).toBe(0);
      });
    });

    describe('dramatic preset', () => {
      it('should have long delay', () => {
        const preset = STAGGER_PRESETS.dramatic;

        expect(preset.container.visible.transition.delayChildren).toBe(0.3);
      });

      it('should have large movement', () => {
        const preset = STAGGER_PRESETS.dramatic;

        expect(preset.child.hidden.y).toBe(50);
      });

      it('should have long duration', () => {
        const preset = STAGGER_PRESETS.dramatic;

        expect(preset.child.visible.transition?.duration).toBe(0.6);
      });
    });
  });

  describe('getStaggerPreset', () => {
    it('should return the correct preset for quick', () => {
      const preset = getStaggerPreset('quick');

      expect(preset).toBe(STAGGER_PRESETS.quick);
    });

    it('should return the correct preset for normal', () => {
      const preset = getStaggerPreset('normal');

      expect(preset).toBe(STAGGER_PRESETS.normal);
    });

    it('should return the correct preset for slow', () => {
      const preset = getStaggerPreset('slow');

      expect(preset).toBe(STAGGER_PRESETS.slow);
    });

    it('should return the correct preset for fade', () => {
      const preset = getStaggerPreset('fade');

      expect(preset).toBe(STAGGER_PRESETS.fade);
    });

    it('should return the correct preset for scale', () => {
      const preset = getStaggerPreset('scale');

      expect(preset).toBe(STAGGER_PRESETS.scale);
    });

    it('should return the correct preset for dramatic', () => {
      const preset = getStaggerPreset('dramatic');

      expect(preset).toBe(STAGGER_PRESETS.dramatic);
    });
  });
});
