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
  type PageTransitionVariants,
  type SlideDirection,
  type ScaleDirection,
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
      const expectedOrigins = [
        'center top',
        'center bottom',
        'left center',
        'right center',
      ];

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
});
