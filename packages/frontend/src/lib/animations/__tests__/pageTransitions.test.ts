/**
 * Page Transitions Tests
 *
 * Tests for page transition animation variants.
 */

import { describe, it, expect } from 'vitest';
import {
  fadeTransition,
  fadeFastTransition,
  slideTransition,
  scaleTransition,
  slideScaleTransition,
  blurTransition,
  rotateTransition,
  zoomTransition,
  neonGlowTransition,
  PAGE_TRANSITION_PRESETS,
  getPageTransitionPreset,
  createOrchestration,
  pageChildVariants,
  PAGE_ORCHESTRATION_PRESETS,
  getPageOrchestrationPreset,
  createOrchestrated,
  type PageTransitionVariants,
  type SlideDirection,
  type ScaleDirection,
  type PageOrchestrationOptions,
} from '../pageTransitions';

describe('PageTransitions', () => {
  describe('fadeTransition', () => {
    it('should have initial, animate, and exit states', () => {
      expect(fadeTransition).toHaveProperty('initial');
      expect(fadeTransition).toHaveProperty('animate');
      expect(fadeTransition).toHaveProperty('exit');
    });

    it('should start with opacity 0', () => {
      expect(fadeTransition.initial).toMatchObject({ opacity: 0 });
    });

    it('should animate to opacity 1', () => {
      expect(fadeTransition.animate).toMatchObject({ opacity: 1 });
    });

    it('should exit with opacity 0', () => {
      expect(fadeTransition.exit).toMatchObject({ opacity: 0 });
    });

    it('should have consistent duration (300ms)', () => {
      expect(fadeTransition.animate.transition).toHaveProperty('duration', 0.3);
      expect(fadeTransition.exit.transition).toHaveProperty('duration', 0.3);
    });

    it('should use easeInOut timing', () => {
      expect(fadeTransition.animate.transition).toHaveProperty('ease');
      expect(fadeTransition.exit.transition).toHaveProperty('ease');
    });
  });

  describe('fadeFastTransition', () => {
    it('should have all required states', () => {
      expect(fadeFastTransition).toHaveProperty('initial');
      expect(fadeFastTransition).toHaveProperty('animate');
      expect(fadeFastTransition).toHaveProperty('exit');
    });

    it('should have faster duration (200ms)', () => {
      expect(fadeFastTransition.animate.transition).toHaveProperty('duration', 0.2);
      expect(fadeFastTransition.exit.transition).toHaveProperty('duration', 0.2);
    });

    it('should be faster than normal fade', () => {
      expect(fadeFastTransition.animate.transition.duration).toBeLessThan(
        fadeTransition.animate.transition.duration
      );
    });
  });

  describe('slideTransition', () => {
    it('should return a PageTransitionVariants object', () => {
      const result = slideTransition();
      expect(result).toHaveProperty('initial');
      expect(result).toHaveProperty('animate');
      expect(result).toHaveProperty('exit');
    });

    it('should slide from right by default', () => {
      const result = slideTransition();
      expect(result.initial).toMatchObject({ x: 100, y: 0, opacity: 0 });
    });

    it('should slide from left when direction is "left"', () => {
      const result = slideTransition('left');
      expect(result.initial).toMatchObject({ x: -100, y: 0, opacity: 0 });
    });

    it('should slide from top when direction is "up"', () => {
      const result = slideTransition('up');
      expect(result.initial).toMatchObject({ x: 0, y: -100, opacity: 0 });
    });

    it('should slide from bottom when direction is "down"', () => {
      const result = slideTransition('down');
      expect(result.initial).toMatchObject({ x: 0, y: 100, opacity: 0 });
    });

    it('should animate to center position', () => {
      const result = slideTransition();
      expect(result.animate).toMatchObject({ x: 0, y: 0, opacity: 1 });
    });

    it('should exit in opposite direction', () => {
      const result = slideTransition('right');
      // Entering from right (+100), should exit to left (-100)
      expect(result.exit).toMatchObject({ x: -100, y: 0, opacity: 0 });
    });

    it('should accept custom distance', () => {
      const result = slideTransition('right', 200);
      expect(result.initial).toMatchObject({ x: 200, y: 0 });
    });

    it('should have transition properties', () => {
      const result = slideTransition();
      expect(result.animate).toHaveProperty('transition');
      expect(result.exit).toHaveProperty('transition');
    });
  });

  describe('scaleTransition', () => {
    it('should return a PageTransitionVariants object', () => {
      const result = scaleTransition();
      expect(result).toHaveProperty('initial');
      expect(result).toHaveProperty('animate');
      expect(result).toHaveProperty('exit');
    });

    it('should scale from 0.95 by default', () => {
      const result = scaleTransition();
      expect(result.initial).toMatchObject({ scale: 0.95, opacity: 0 });
    });

    it('should animate to scale 1', () => {
      const result = scaleTransition();
      expect(result.animate).toMatchObject({ scale: 1, opacity: 1 });
    });

    it('should exit to scale 0.95', () => {
      const result = scaleTransition();
      expect(result.exit).toMatchObject({ scale: 0.95, opacity: 0 });
    });

    it('should accept custom scale', () => {
      const result = scaleTransition('center', 0.8);
      expect(result.initial).toMatchObject({ scale: 0.8 });
      expect(result.exit).toMatchObject({ scale: 0.8 });
    });

    it('should set transformOrigin to center by default', () => {
      const result = scaleTransition();
      expect(result.initial).toHaveProperty('transformOrigin', 'center center');
    });

    it('should set transformOrigin based on direction', () => {
      const directions: ScaleDirection[] = ['top', 'bottom', 'left', 'right'];
      const expectedOrigins = ['center top', 'center bottom', 'left center', 'right center'];

      directions.forEach((direction, index) => {
        const result = scaleTransition(direction);
        expect(result.initial).toHaveProperty('transformOrigin', expectedOrigins[index]);
      });
    });
  });

  describe('slideScaleTransition', () => {
    it('should combine slide and scale effects', () => {
      const result = slideScaleTransition();
      expect(result.initial).toHaveProperty('x');
      expect(result.initial).toHaveProperty('scale');
      expect(result.initial).toHaveProperty('opacity');
    });

    it('should use smaller distance by default (50px)', () => {
      const result = slideScaleTransition('right');
      expect(result.initial).toMatchObject({ x: 50 });
    });

    it('should use scale 0.9 by default', () => {
      const result = slideScaleTransition();
      expect(result.initial).toMatchObject({ scale: 0.9 });
    });

    it('should accept custom distance and scale', () => {
      const result = slideScaleTransition('left', 100, 0.8);
      expect(result.initial).toMatchObject({ x: -100, scale: 0.8 });
    });

    it('should have longer duration (400ms) for dramatic effect', () => {
      const result = slideScaleTransition();
      expect(result.animate.transition).toHaveProperty('duration', 0.4);
    });
  });

  describe('blurTransition', () => {
    it('should start with blur', () => {
      const result = blurTransition();
      expect(result.initial).toMatchObject({
        opacity: 0,
        filter: 'blur(10px)',
      });
    });

    it('should animate to no blur', () => {
      const result = blurTransition();
      expect(result.animate).toMatchObject({
        opacity: 1,
        filter: 'blur(0px)',
      });
    });

    it('should exit with blur', () => {
      const result = blurTransition();
      expect(result.exit).toMatchObject({
        opacity: 0,
        filter: 'blur(10px)',
      });
    });

    it('should accept custom blur amount', () => {
      const result = blurTransition(20);
      expect(result.initial.filter).toBe('blur(20px)');
      expect(result.exit.filter).toBe('blur(20px)');
    });
  });

  describe('rotateTransition', () => {
    it('should rotate on Y axis by default', () => {
      const result = rotateTransition();
      expect(result.initial).toHaveProperty('rotateY', 90);
      expect(result.animate).toHaveProperty('rotateY', 0);
      expect(result.exit).toHaveProperty('rotateY', -90);
    });

    it('should rotate on X axis when specified', () => {
      const result = rotateTransition('x');
      expect(result.initial).toHaveProperty('rotateX', 90);
      expect(result.animate).toHaveProperty('rotateX', 0);
      expect(result.exit).toHaveProperty('rotateX', -90);
    });

    it('should accept custom rotation degrees', () => {
      const result = rotateTransition('y', 45);
      expect(result.initial).toHaveProperty('rotateY', 45);
      expect(result.exit).toHaveProperty('rotateY', -45);
    });

    it('should include opacity changes', () => {
      const result = rotateTransition();
      expect(result.initial).toHaveProperty('opacity', 0);
      expect(result.animate).toHaveProperty('opacity', 1);
      expect(result.exit).toHaveProperty('opacity', 0);
    });
  });

  describe('zoomTransition', () => {
    it('should start zoomed in (scale 1.2)', () => {
      const result = zoomTransition();
      expect(result.initial).toMatchObject({ scale: 1.2, opacity: 0 });
    });

    it('should animate to normal scale', () => {
      const result = zoomTransition();
      expect(result.animate).toMatchObject({ scale: 1, opacity: 1 });
    });

    it('should exit zoomed in', () => {
      const result = zoomTransition();
      expect(result.exit).toMatchObject({ scale: 1.2, opacity: 0 });
    });

    it('should accept custom zoom scale', () => {
      const result = zoomTransition(1.5);
      expect(result.initial).toHaveProperty('scale', 1.5);
      expect(result.exit).toHaveProperty('scale', 1.5);
    });

    it('should have longer duration (500ms) for dramatic effect', () => {
      const result = zoomTransition();
      expect(result.animate.transition).toHaveProperty('duration', 0.5);
    });
  });

  describe('neonGlowTransition', () => {
    it('should have all required states', () => {
      expect(neonGlowTransition).toHaveProperty('initial');
      expect(neonGlowTransition).toHaveProperty('animate');
      expect(neonGlowTransition).toHaveProperty('exit');
    });

    it('should start dimmed', () => {
      expect(neonGlowTransition.initial).toMatchObject({
        opacity: 0,
        filter: 'brightness(0.5)',
      });
    });

    it('should animate to full brightness', () => {
      expect(neonGlowTransition.animate).toMatchObject({
        opacity: 1,
        filter: 'brightness(1)',
      });
    });

    it('should exit dimmed', () => {
      expect(neonGlowTransition.exit).toMatchObject({
        opacity: 0,
        filter: 'brightness(0.5)',
      });
    });
  });

  describe('PAGE_TRANSITION_PRESETS', () => {
    it('should have all presets defined', () => {
      const expectedPresets = [
        'fade',
        'fadeFast',
        'slideRight',
        'slideLeft',
        'slideUp',
        'slideDown',
        'scaleCenter',
        'scaleBottom',
        'slideScale',
        'blur',
        'rotateY',
        'zoom',
        'neonGlow',
      ];

      expectedPresets.forEach((preset) => {
        expect(PAGE_TRANSITION_PRESETS).toHaveProperty(preset);
      });
    });

    it('should have 13 presets total', () => {
      expect(Object.keys(PAGE_TRANSITION_PRESETS)).toHaveLength(13);
    });

    it('should have all presets as PageTransitionVariants', () => {
      Object.values(PAGE_TRANSITION_PRESETS).forEach((preset) => {
        expect(preset).toHaveProperty('initial');
        expect(preset).toHaveProperty('animate');
        expect(preset).toHaveProperty('exit');
      });
    });

    it('should reference correct transition functions', () => {
      expect(PAGE_TRANSITION_PRESETS.fade).toBe(fadeTransition);
      expect(PAGE_TRANSITION_PRESETS.fadeFast).toBe(fadeFastTransition);
      expect(PAGE_TRANSITION_PRESETS.neonGlow).toBe(neonGlowTransition);
    });

    it('should have directional slide presets', () => {
      // Slide right enters from right (+x)
      expect(PAGE_TRANSITION_PRESETS.slideRight.initial).toMatchObject({ x: 100 });
      // Slide left enters from left (-x)
      expect(PAGE_TRANSITION_PRESETS.slideLeft.initial).toMatchObject({ x: -100 });
      // Slide up enters from top (-y)
      expect(PAGE_TRANSITION_PRESETS.slideUp.initial).toMatchObject({ y: -100 });
      // Slide down enters from bottom (+y)
      expect(PAGE_TRANSITION_PRESETS.slideDown.initial).toMatchObject({ y: 100 });
    });

    it('should have scale presets with different origins', () => {
      expect(PAGE_TRANSITION_PRESETS.scaleCenter.initial).toHaveProperty(
        'transformOrigin',
        'center center'
      );
      expect(PAGE_TRANSITION_PRESETS.scaleBottom.initial).toHaveProperty(
        'transformOrigin',
        'center bottom'
      );
    });
  });

  describe('getPageTransitionPreset', () => {
    it('should return correct preset by name', () => {
      const result = getPageTransitionPreset('fade');
      expect(result).toBe(fadeTransition);
    });

    it('should return all presets correctly', () => {
      const presets: Array<keyof typeof PAGE_TRANSITION_PRESETS> = [
        'fade',
        'fadeFast',
        'slideRight',
        'slideLeft',
        'slideUp',
        'slideDown',
        'scaleCenter',
        'scaleBottom',
        'slideScale',
        'blur',
        'rotateY',
        'zoom',
        'neonGlow',
      ];

      presets.forEach((preset) => {
        const result = getPageTransitionPreset(preset);
        expect(result).toBe(PAGE_TRANSITION_PRESETS[preset]);
      });
    });
  });

  describe('Transition Consistency', () => {
    it('should have all transitions start with opacity 0', () => {
      const transitions = [
        fadeTransition,
        fadeFastTransition,
        slideTransition(),
        scaleTransition(),
        slideScaleTransition(),
        blurTransition(),
        rotateTransition(),
        zoomTransition(),
        neonGlowTransition,
      ];

      transitions.forEach((transition) => {
        expect(transition.initial).toHaveProperty('opacity', 0);
      });
    });

    it('should have all transitions animate to opacity 1', () => {
      const transitions = [
        fadeTransition,
        fadeFastTransition,
        slideTransition(),
        scaleTransition(),
        slideScaleTransition(),
        blurTransition(),
        rotateTransition(),
        zoomTransition(),
        neonGlowTransition,
      ];

      transitions.forEach((transition) => {
        expect(transition.animate).toHaveProperty('opacity', 1);
      });
    });

    it('should have all transitions exit with opacity 0', () => {
      const transitions = [
        fadeTransition,
        fadeFastTransition,
        slideTransition(),
        scaleTransition(),
        slideScaleTransition(),
        blurTransition(),
        rotateTransition(),
        zoomTransition(),
        neonGlowTransition,
      ];

      transitions.forEach((transition) => {
        expect(transition.exit).toHaveProperty('opacity', 0);
      });
    });

    it('should have all transitions include timing info', () => {
      const transitions = [
        fadeTransition,
        fadeFastTransition,
        slideTransition(),
        scaleTransition(),
        slideScaleTransition(),
        blurTransition(),
        rotateTransition(),
        zoomTransition(),
        neonGlowTransition,
      ];

      transitions.forEach((transition) => {
        expect(transition.animate).toHaveProperty('transition');
        expect(transition.animate.transition).toHaveProperty('duration');
        expect(transition.exit).toHaveProperty('transition');
        expect(transition.exit.transition).toHaveProperty('duration');
      });
    });
  });

  describe('TypeScript Types', () => {
    it('should support SlideDirection type', () => {
      const directions: SlideDirection[] = ['left', 'right', 'up', 'down'];
      directions.forEach((direction) => {
        const result = slideTransition(direction);
        expect(result).toHaveProperty('initial');
      });
    });

    it('should support ScaleDirection type', () => {
      const directions: ScaleDirection[] = ['center', 'top', 'bottom', 'left', 'right'];
      directions.forEach((direction) => {
        const result = scaleTransition(direction);
        expect(result).toHaveProperty('initial');
      });
    });

    it('should support PageTransitionVariants type', () => {
      const variant: PageTransitionVariants = fadeTransition;
      expect(variant.initial).toBeDefined();
      expect(variant.animate).toBeDefined();
      expect(variant.exit).toBeDefined();
    });
  });

  describe('Orchestration', () => {
    describe('createOrchestration', () => {
      it('should preserve base transition properties', () => {
        const orchestrated = createOrchestration(fadeTransition);
        expect(orchestrated.initial).toEqual(fadeTransition.initial);
      });

      it('should add delayChildren to animate transition', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          delayChildren: 0.3,
        });
        expect(orchestrated.animate.transition).toHaveProperty('delayChildren', 0.3);
      });

      it('should add staggerChildren to animate transition', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          staggerChildren: 0.1,
        });
        expect(orchestrated.animate.transition).toHaveProperty('staggerChildren', 0.1);
      });

      it('should default staggerChildren to 0.05', () => {
        const orchestrated = createOrchestration(fadeTransition);
        expect(orchestrated.animate.transition).toHaveProperty('staggerChildren', 0.05);
      });

      it('should add when="beforeChildren" for afterParent timing', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          when: 'afterParent',
        });
        expect(orchestrated.animate.transition).toHaveProperty('when', 'beforeChildren');
      });

      it('should not add when property for withParent timing', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          when: 'withParent',
        });
        expect(orchestrated.animate.transition).not.toHaveProperty('when');
      });

      it('should add when="afterChildren" to exit transition', () => {
        const orchestrated = createOrchestration(fadeTransition);
        expect(orchestrated.exit.transition).toHaveProperty('when', 'afterChildren');
      });

      it('should halve staggerChildren for exit', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          staggerChildren: 0.1,
        });
        expect(orchestrated.exit.transition).toHaveProperty('staggerChildren', 0.05);
      });

      it('should work with slide transitions', () => {
        const orchestrated = createOrchestration(slideTransition('right'), {
          delayChildren: 0.2,
          staggerChildren: 0.08,
        });
        expect(orchestrated.animate.transition).toHaveProperty('delayChildren', 0.2);
        expect(orchestrated.animate.transition).toHaveProperty('staggerChildren', 0.08);
      });

      it('should work with scale transitions', () => {
        const orchestrated = createOrchestration(scaleTransition('center'), {
          delayChildren: 0.15,
        });
        expect(orchestrated.animate.transition).toHaveProperty('delayChildren', 0.15);
      });

      it('should work with blur transitions', () => {
        const orchestrated = createOrchestration(blurTransition(), {
          staggerChildren: 0.06,
        });
        expect(orchestrated.animate.transition).toHaveProperty('staggerChildren', 0.06);
      });

      it('should handle beforeParent timing', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          when: 'beforeParent',
          delayChildren: 0.5,
        });
        // beforeParent should reduce delay (0.5 - 0.2 = 0.3)
        expect(orchestrated.animate.transition).toHaveProperty('delayChildren', 0.3);
        expect(orchestrated.animate.transition).not.toHaveProperty('when');
      });

      it('should not have negative delay for beforeParent', () => {
        const orchestrated = createOrchestration(fadeTransition, {
          when: 'beforeParent',
          delayChildren: 0.1, // Less than 0.2 offset
        });
        // Should clamp to 0
        expect(orchestrated.animate.transition).toHaveProperty('delayChildren', 0);
      });
    });

    describe('pageChildVariants', () => {
      it('should create fade child variants', () => {
        const variants = pageChildVariants('fade');
        expect(variants.initial).toEqual({ opacity: 0 });
        expect(variants.animate).toMatchObject({ opacity: 1 });
        expect(variants.exit).toMatchObject({ opacity: 0 });
      });

      it('should create slideUp child variants', () => {
        const variants = pageChildVariants('slideUp');
        expect(variants.initial).toEqual({ opacity: 0, y: 20 });
        expect(variants.animate).toMatchObject({ opacity: 1, y: 0 });
        expect(variants.exit).toMatchObject({ opacity: 0, y: -10 });
      });

      it('should create slideDown child variants', () => {
        const variants = pageChildVariants('slideDown');
        expect(variants.initial).toEqual({ opacity: 0, y: -20 });
        expect(variants.animate).toMatchObject({ opacity: 1, y: 0 });
        expect(variants.exit).toMatchObject({ opacity: 0, y: 10 });
      });

      it('should create scale child variants', () => {
        const variants = pageChildVariants('scale');
        expect(variants.initial).toEqual({ opacity: 0, scale: 0.95 });
        expect(variants.animate).toMatchObject({ opacity: 1, scale: 1 });
        expect(variants.exit).toMatchObject({ opacity: 0, scale: 0.95 });
      });

      it('should default to fade', () => {
        const variants = pageChildVariants();
        expect(variants.initial).toEqual({ opacity: 0 });
      });

      it('should have transition durations', () => {
        const variants = pageChildVariants('fade');
        expect(variants.animate.transition).toHaveProperty('duration', 0.4);
        expect(variants.exit.transition).toHaveProperty('duration', 0.2);
      });

      it('should have faster exit than enter', () => {
        const variants = pageChildVariants('slideUp');
        const enterDuration = variants.animate.transition?.duration;
        const exitDuration = variants.exit.transition?.duration;
        expect(exitDuration).toBeLessThan(enterDuration!);
      });
    });

    describe('PAGE_ORCHESTRATION_PRESETS', () => {
      it('should have quick preset', () => {
        expect(PAGE_ORCHESTRATION_PRESETS.quick).toBeDefined();
        expect(PAGE_ORCHESTRATION_PRESETS.quick.delayChildren).toBe(0.1);
        expect(PAGE_ORCHESTRATION_PRESETS.quick.staggerChildren).toBe(0.03);
        expect(PAGE_ORCHESTRATION_PRESETS.quick.when).toBe('afterParent');
      });

      it('should have normal preset', () => {
        expect(PAGE_ORCHESTRATION_PRESETS.normal).toBeDefined();
        expect(PAGE_ORCHESTRATION_PRESETS.normal.delayChildren).toBe(0.2);
        expect(PAGE_ORCHESTRATION_PRESETS.normal.staggerChildren).toBe(0.05);
      });

      it('should have slow preset', () => {
        expect(PAGE_ORCHESTRATION_PRESETS.slow).toBeDefined();
        expect(PAGE_ORCHESTRATION_PRESETS.slow.delayChildren).toBe(0.3);
        expect(PAGE_ORCHESTRATION_PRESETS.slow.staggerChildren).toBe(0.1);
      });

      it('should have simultaneous preset', () => {
        expect(PAGE_ORCHESTRATION_PRESETS.simultaneous).toBeDefined();
        expect(PAGE_ORCHESTRATION_PRESETS.simultaneous.when).toBe('withParent');
      });

      it('should have dramatic preset', () => {
        expect(PAGE_ORCHESTRATION_PRESETS.dramatic).toBeDefined();
        expect(PAGE_ORCHESTRATION_PRESETS.dramatic.delayChildren).toBe(0.5);
        expect(PAGE_ORCHESTRATION_PRESETS.dramatic.staggerChildren).toBe(0.15);
      });

      it('should have all presets with required properties', () => {
        const presets = Object.values(PAGE_ORCHESTRATION_PRESETS);
        presets.forEach((preset) => {
          expect(preset).toHaveProperty('delayChildren');
          expect(preset).toHaveProperty('staggerChildren');
          expect(preset).toHaveProperty('when');
        });
      });

      it('should have increasing delays from quick to slow', () => {
        const { quick, normal, slow } = PAGE_ORCHESTRATION_PRESETS;
        expect(quick.delayChildren).toBeLessThan(normal.delayChildren);
        expect(normal.delayChildren).toBeLessThan(slow.delayChildren);
      });

      it('should have increasing staggers from quick to slow', () => {
        const { quick, normal, slow } = PAGE_ORCHESTRATION_PRESETS;
        expect(quick.staggerChildren).toBeLessThan(normal.staggerChildren);
        expect(normal.staggerChildren).toBeLessThan(slow.staggerChildren);
      });
    });

    describe('getPageOrchestrationPreset', () => {
      it('should return quick preset', () => {
        const preset = getPageOrchestrationPreset('quick');
        expect(preset).toEqual(PAGE_ORCHESTRATION_PRESETS.quick);
      });

      it('should return normal preset', () => {
        const preset = getPageOrchestrationPreset('normal');
        expect(preset).toEqual(PAGE_ORCHESTRATION_PRESETS.normal);
      });

      it('should return slow preset', () => {
        const preset = getPageOrchestrationPreset('slow');
        expect(preset).toEqual(PAGE_ORCHESTRATION_PRESETS.slow);
      });

      it('should return simultaneous preset', () => {
        const preset = getPageOrchestrationPreset('simultaneous');
        expect(preset).toEqual(PAGE_ORCHESTRATION_PRESETS.simultaneous);
      });

      it('should return dramatic preset', () => {
        const preset = getPageOrchestrationPreset('dramatic');
        expect(preset).toEqual(PAGE_ORCHESTRATION_PRESETS.dramatic);
      });
    });

    describe('createOrchestrated', () => {
      it('should combine transition and orchestration presets', () => {
        const result = createOrchestrated('fade', 'normal');
        expect(result.initial).toEqual(fadeTransition.initial);
        expect(result.animate.transition).toHaveProperty('delayChildren', 0.2);
        expect(result.animate.transition).toHaveProperty('staggerChildren', 0.05);
      });

      it('should work with fade + quick', () => {
        const result = createOrchestrated('fade', 'quick');
        expect(result.animate.transition).toHaveProperty('delayChildren', 0.1);
        expect(result.animate.transition).toHaveProperty('staggerChildren', 0.03);
      });

      it('should work with slideRight + slow', () => {
        const result = createOrchestrated('slideRight', 'slow');
        expect(result.animate.transition).toHaveProperty('delayChildren', 0.3);
        expect(result.animate.transition).toHaveProperty('staggerChildren', 0.1);
      });

      it('should work with blur + simultaneous', () => {
        const result = createOrchestrated('blur', 'simultaneous');
        expect(result.animate.transition).not.toHaveProperty('when');
        expect(result.animate.transition).toHaveProperty('staggerChildren', 0.02);
      });

      it('should work with zoom + dramatic', () => {
        const result = createOrchestrated('zoom', 'dramatic');
        expect(result.animate.transition).toHaveProperty('delayChildren', 0.5);
        expect(result.animate.transition).toHaveProperty('staggerChildren', 0.15);
      });

      it('should preserve base transition exit properties', () => {
        const result = createOrchestrated('neonGlow', 'normal');
        expect(result.exit).toMatchObject({
          opacity: 0,
          filter: 'brightness(0.5)',
        });
      });
    });

    describe('Type Safety', () => {
      it('should support PageOrchestrationOptions type', () => {
        const options: PageOrchestrationOptions = {
          delayChildren: 0.2,
          staggerChildren: 0.05,
          when: 'afterParent',
        };
        expect(options.delayChildren).toBe(0.2);
      });

      it('should allow partial options', () => {
        const options: PageOrchestrationOptions = {
          delayChildren: 0.1,
        };
        expect(options.delayChildren).toBe(0.1);
      });

      it('should allow empty options', () => {
        const options: PageOrchestrationOptions = {};
        expect(options).toEqual({});
      });
    });
  });
});
