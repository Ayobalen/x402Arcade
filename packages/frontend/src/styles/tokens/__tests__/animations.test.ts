/**
 * Animation Tokens Tests
 *
 * Verify all animation presets are correctly defined and exported.
 */

import {
  durations,
  durationMs,
  DURATION_PRESETS,
  SPRING_PRESETS,
  easings,
  EASING_PRESETS,
  keyframes,
  animations,
  transitions,
  animationTokens,
  type SpringConfig,
} from '../animations';

describe('Animation Tokens', () => {
  describe('DURATION_PRESETS', () => {
    it('should define instant duration preset (100ms)', () => {
      expect(DURATION_PRESETS.instant).toBe(durations.fast);
      expect(DURATION_PRESETS.instant).toBe('100ms');
    });

    it('should define fast duration preset (200ms)', () => {
      expect(DURATION_PRESETS.fast).toBe(durations.DEFAULT);
      expect(DURATION_PRESETS.fast).toBe('200ms');
    });

    it('should define normal duration preset (300ms)', () => {
      expect(DURATION_PRESETS.normal).toBe(durations.moderate);
      expect(DURATION_PRESETS.normal).toBe('300ms');
    });

    it('should define slow duration preset (500ms)', () => {
      expect(DURATION_PRESETS.slow).toBe(durations.slower);
      expect(DURATION_PRESETS.slow).toBe('500ms');
    });

    it('should define verySlow duration preset (800ms)', () => {
      expect(DURATION_PRESETS.verySlow).toBe('800ms');
    });

    it('should have exactly 5 presets', () => {
      const presetKeys = Object.keys(DURATION_PRESETS);
      expect(presetKeys).toHaveLength(5);
      expect(presetKeys).toEqual(['instant', 'fast', 'normal', 'slow', 'verySlow']);
    });
  });

  describe('SPRING_PRESETS', () => {
    it('should define bouncy spring with high stiffness and low damping', () => {
      expect(SPRING_PRESETS.bouncy).toBeDefined();
      expect(SPRING_PRESETS.bouncy.stiffness).toBe(300);
      expect(SPRING_PRESETS.bouncy.damping).toBe(10);
      expect(SPRING_PRESETS.bouncy.mass).toBe(1);
    });

    it('should define gentle spring with low stiffness and high damping', () => {
      expect(SPRING_PRESETS.gentle).toBeDefined();
      expect(SPRING_PRESETS.gentle.stiffness).toBe(100);
      expect(SPRING_PRESETS.gentle.damping).toBe(20);
      expect(SPRING_PRESETS.gentle.mass).toBe(1);
    });

    it('should define stiff spring with very high stiffness', () => {
      expect(SPRING_PRESETS.stiff).toBeDefined();
      expect(SPRING_PRESETS.stiff.stiffness).toBe(400);
      expect(SPRING_PRESETS.stiff.damping).toBe(30);
      expect(SPRING_PRESETS.stiff.mass).toBe(1);
    });

    it('should define wobbly spring for playful interactions', () => {
      expect(SPRING_PRESETS.wobbly).toBeDefined();
      expect(SPRING_PRESETS.wobbly.stiffness).toBe(180);
      expect(SPRING_PRESETS.wobbly.damping).toBe(12);
      expect(SPRING_PRESETS.wobbly.mass).toBe(1);
    });

    it('should have exactly 4 spring presets', () => {
      const presetKeys = Object.keys(SPRING_PRESETS);
      expect(presetKeys).toHaveLength(4);
      expect(presetKeys).toEqual(['bouncy', 'gentle', 'stiff', 'wobbly']);
    });

    it('should verify bouncy is more energetic than gentle', () => {
      // Higher stiffness and lower damping = more energetic
      expect(SPRING_PRESETS.bouncy.stiffness).toBeGreaterThan(SPRING_PRESETS.gentle.stiffness);
      expect(SPRING_PRESETS.bouncy.damping).toBeLessThan(SPRING_PRESETS.gentle.damping);
    });

    it('should verify stiff has highest stiffness', () => {
      expect(SPRING_PRESETS.stiff.stiffness).toBeGreaterThan(SPRING_PRESETS.bouncy.stiffness);
      expect(SPRING_PRESETS.stiff.stiffness).toBeGreaterThan(SPRING_PRESETS.gentle.stiffness);
      expect(SPRING_PRESETS.stiff.stiffness).toBeGreaterThan(SPRING_PRESETS.wobbly.stiffness);
    });

    it('should have valid SpringConfig structure for all presets', () => {
      Object.values(SPRING_PRESETS).forEach((preset) => {
        expect(preset).toHaveProperty('stiffness');
        expect(preset).toHaveProperty('damping');
        expect(preset).toHaveProperty('mass');
        expect(typeof preset.stiffness).toBe('number');
        expect(typeof preset.damping).toBe('number');
        expect(typeof preset.mass).toBe('number');
        expect(preset.stiffness).toBeGreaterThan(0);
        expect(preset.damping).toBeGreaterThan(0);
        expect(preset.mass).toBeGreaterThan(0);
      });
    });
  });

  describe('EASING_PRESETS', () => {
    it('should define easeOut for natural deceleration', () => {
      expect(EASING_PRESETS.easeOut).toBe(easings.cubicOut);
      expect(EASING_PRESETS.easeOut).toBe('cubic-bezier(0.215, 0.61, 0.355, 1)');
    });

    it('should define easeIn for acceleration', () => {
      expect(EASING_PRESETS.easeIn).toBe(easings.cubicIn);
      expect(EASING_PRESETS.easeIn).toBe('cubic-bezier(0.55, 0.055, 0.675, 0.19)');
    });

    it('should define easeInOut for smooth transitions', () => {
      expect(EASING_PRESETS.easeInOut).toBe(easings.cubicInOut);
      expect(EASING_PRESETS.easeInOut).toBe('cubic-bezier(0.645, 0.045, 0.355, 1)');
    });

    it('should define sharp for snappy UI feedback', () => {
      expect(EASING_PRESETS.sharp).toBe(easings.sharp);
      expect(EASING_PRESETS.sharp).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
    });

    it('should define crypto for brand feel', () => {
      expect(EASING_PRESETS.crypto).toBe(easings.crypto);
      expect(EASING_PRESETS.crypto).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    });

    it('should have exactly 5 easing presets', () => {
      const presetKeys = Object.keys(EASING_PRESETS);
      expect(presetKeys).toHaveLength(5);
      expect(presetKeys).toEqual(['easeOut', 'easeIn', 'easeInOut', 'sharp', 'crypto']);
    });

    it('should use cubic-bezier format for all presets', () => {
      Object.values(EASING_PRESETS).forEach((easing) => {
        expect(easing).toMatch(/^cubic-bezier\(/);
      });
    });
  });

  describe('Easings - New Additions', () => {
    it('should define sharp easing in easings object', () => {
      expect(easings.sharp).toBe('cubic-bezier(0.4, 0, 0.6, 1)');
    });

    it('should define crypto easing in easings object', () => {
      expect(easings.crypto).toBe('cubic-bezier(0.34, 1.56, 0.64, 1)');
    });
  });

  describe('animationTokens Export', () => {
    it('should include DURATION_PRESETS in animationTokens', () => {
      expect(animationTokens.DURATION_PRESETS).toBe(DURATION_PRESETS);
    });

    it('should include SPRING_PRESETS in animationTokens', () => {
      expect(animationTokens.SPRING_PRESETS).toBe(SPRING_PRESETS);
    });

    it('should include EASING_PRESETS in animationTokens', () => {
      expect(animationTokens.EASING_PRESETS).toBe(EASING_PRESETS);
    });

    it('should maintain backward compatibility with existing exports', () => {
      expect(animationTokens.durations).toBe(durations);
      expect(animationTokens.durationMs).toBe(durationMs);
      expect(animationTokens.easings).toBe(easings);
      expect(animationTokens.keyframes).toBe(keyframes);
      expect(animationTokens.animations).toBe(animations);
      expect(animationTokens.transitions).toBe(transitions);
    });
  });

  describe('Type Safety', () => {
    it('should allow SpringConfig type assignment', () => {
      const customSpring: SpringConfig = {
        stiffness: 250,
        damping: 15,
        mass: 1,
      };
      expect(customSpring.stiffness).toBe(250);
      expect(customSpring.damping).toBe(15);
      expect(customSpring.mass).toBe(1);
    });

    it('should allow SpringConfig without mass', () => {
      const customSpring: SpringConfig = {
        stiffness: 250,
        damping: 15,
      };
      expect(customSpring.stiffness).toBe(250);
      expect(customSpring.damping).toBe(15);
      expect(customSpring.mass).toBeUndefined();
    });
  });

  describe('Feature Requirements Verification', () => {
    it('should satisfy requirement: Add SPRING_PRESETS object to animation constants', () => {
      expect(SPRING_PRESETS).toBeDefined();
      expect(typeof SPRING_PRESETS).toBe('object');
    });

    it('should satisfy requirement: Define bouncy spring', () => {
      expect(SPRING_PRESETS.bouncy).toBeDefined();
      expect(SPRING_PRESETS.bouncy.stiffness).toBeGreaterThan(SPRING_PRESETS.bouncy.damping);
    });

    it('should satisfy requirement: Define gentle spring', () => {
      expect(SPRING_PRESETS.gentle).toBeDefined();
      // Gentle has low stiffness (100) and high damping (20) - relatively speaking
      expect(SPRING_PRESETS.gentle.stiffness).toBeLessThan(SPRING_PRESETS.bouncy.stiffness);
      expect(SPRING_PRESETS.gentle.damping).toBeGreaterThan(SPRING_PRESETS.bouncy.damping);
    });

    it('should satisfy requirement: Define stiff spring', () => {
      expect(SPRING_PRESETS.stiff).toBeDefined();
      expect(SPRING_PRESETS.stiff.stiffness).toBeGreaterThan(300);
    });

    it('should satisfy requirement: Define wobbly spring', () => {
      expect(SPRING_PRESETS.wobbly).toBeDefined();
      // Wobbly has moderate stiffness (180) and low damping (12)
      expect(SPRING_PRESETS.wobbly.stiffness).toBeGreaterThan(100);
      expect(SPRING_PRESETS.wobbly.damping).toBeLessThan(15);
    });

    it('should satisfy requirement: Add DURATION_PRESETS to animation constants', () => {
      expect(DURATION_PRESETS).toBeDefined();
      expect(typeof DURATION_PRESETS).toBe('object');
    });

    it('should satisfy requirement: Define instant as 0.1s', () => {
      expect(DURATION_PRESETS.instant).toBe('100ms');
    });

    it('should satisfy requirement: Define fast as 0.2s', () => {
      expect(DURATION_PRESETS.fast).toBe('200ms');
    });

    it('should satisfy requirement: Define normal as 0.3s', () => {
      expect(DURATION_PRESETS.normal).toBe('300ms');
    });

    it('should satisfy requirement: Define slow as 0.5s', () => {
      expect(DURATION_PRESETS.slow).toBe('500ms');
    });

    it('should satisfy requirement: Define verySlow as 0.8s', () => {
      expect(DURATION_PRESETS.verySlow).toBe('800ms');
    });

    it('should satisfy requirement: Add EASING_PRESETS to animation constants', () => {
      expect(EASING_PRESETS).toBeDefined();
      expect(typeof EASING_PRESETS).toBe('object');
    });

    it('should satisfy requirement: Define easeOut cubic-bezier', () => {
      expect(EASING_PRESETS.easeOut).toContain('cubic-bezier');
    });

    it('should satisfy requirement: Define easeIn cubic-bezier', () => {
      expect(EASING_PRESETS.easeIn).toContain('cubic-bezier');
    });

    it('should satisfy requirement: Define easeInOut', () => {
      expect(EASING_PRESETS.easeInOut).toContain('cubic-bezier');
    });

    it('should satisfy requirement: Define sharp for snappy UI', () => {
      expect(EASING_PRESETS.sharp).toBeDefined();
      expect(easings.sharp).toBeDefined();
    });

    it('should satisfy requirement: Define crypto custom easing', () => {
      expect(EASING_PRESETS.crypto).toBeDefined();
      expect(easings.crypto).toBeDefined();
    });

    it('should satisfy requirement: Add type definitions for spring config', () => {
      // TypeScript compilation will verify this
      const config: SpringConfig = SPRING_PRESETS.bouncy;
      expect(config).toBeDefined();
    });
  });
});
