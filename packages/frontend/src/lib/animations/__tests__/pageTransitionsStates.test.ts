/**
 * Tests for Page Transition Loading and Error States
 */

import { describe, it, expect } from 'vitest';
import {
  loadingTransition,
  skeletonAnimation,
  errorTransition,
  errorIconEntrance,
  loadingErrorTransition,
  loadingIndicator,
} from '../pageTransitions';

describe('Loading Transition State', () => {
  it('should export loadingTransition', () => {
    expect(loadingTransition).toBeDefined();
  });

  it('should have loading state with reduced opacity', () => {
    expect(loadingTransition.loading).toBeDefined();
    expect(loadingTransition.loading.opacity).toBe(0.6);
    expect(loadingTransition.loading.scale).toBe(1);
    expect(loadingTransition.loading.filter).toBe('brightness(0.9)');
  });

  it('should have loaded state with full opacity', () => {
    expect(loadingTransition.loaded).toBeDefined();
    expect(loadingTransition.loaded.opacity).toBe(1);
    expect(loadingTransition.loaded.scale).toBe(1);
    expect(loadingTransition.loaded.filter).toBe('brightness(1)');
  });

  it('should have transition configuration on loading state', () => {
    expect(loadingTransition.loading.transition).toBeDefined();
    expect(loadingTransition.loading.transition.duration).toBe(0.3);
  });

  it('should have transition configuration on loaded state', () => {
    expect(loadingTransition.loaded.transition).toBeDefined();
    expect(loadingTransition.loaded.transition.duration).toBe(0.4);
  });
});

describe('Skeleton Animation', () => {
  it('should export skeletonAnimation', () => {
    expect(skeletonAnimation).toBeDefined();
  });

  it('should have pulse state with opacity animation', () => {
    expect(skeletonAnimation.pulse).toBeDefined();
    expect(skeletonAnimation.pulse.opacity).toEqual([0.5, 1, 0.5]);
  });

  it('should have infinite repeat transition', () => {
    expect(skeletonAnimation.pulse.transition).toBeDefined();
    expect(skeletonAnimation.pulse.transition.duration).toBe(1.5);
    expect(skeletonAnimation.pulse.transition.repeat).toBe(Infinity);
    expect(skeletonAnimation.pulse.transition.ease).toBe('easeInOut');
  });
});

describe('Error Transition State', () => {
  it('should export errorTransition', () => {
    expect(errorTransition).toBeDefined();
  });

  it('should have loading state', () => {
    expect(errorTransition.loading).toBeDefined();
    expect(errorTransition.loading.opacity).toBe(0.6);
    expect(errorTransition.loading.x).toBe(0);
    expect(errorTransition.loading.scale).toBe(1);
  });

  it('should have error state with shake animation', () => {
    expect(errorTransition.error).toBeDefined();
    expect(errorTransition.error.opacity).toBe(1);
    expect(errorTransition.error.x).toEqual([0, -10, 10, -10, 10, -5, 5, 0]);
    expect(errorTransition.error.scale).toBe(1);
    expect(errorTransition.error.filter).toBe('brightness(1.1)');
  });

  it('should have loaded state for recovery', () => {
    expect(errorTransition.loaded).toBeDefined();
    expect(errorTransition.loaded.opacity).toBe(1);
    expect(errorTransition.loaded.x).toBe(0);
    expect(errorTransition.loaded.scale).toBe(1);
    expect(errorTransition.loaded.filter).toBe('brightness(1)');
  });

  it('should have spring transition for shake effect', () => {
    expect(errorTransition.error.transition).toBeDefined();
    expect(errorTransition.error.transition.duration).toBe(0.5);
    expect(errorTransition.error.transition.x).toBeDefined();
    expect(errorTransition.error.transition.x.type).toBe('spring');
    expect(errorTransition.error.transition.x.stiffness).toBe(500);
    expect(errorTransition.error.transition.x.damping).toBe(10);
  });
});

describe('Error Icon Entrance', () => {
  it('should export errorIconEntrance', () => {
    expect(errorIconEntrance).toBeDefined();
  });

  it('should have hidden state with scale 0', () => {
    expect(errorIconEntrance.hidden).toBeDefined();
    expect(errorIconEntrance.hidden.scale).toBe(0);
    expect(errorIconEntrance.hidden.rotate).toBe(-180);
    expect(errorIconEntrance.hidden.opacity).toBe(0);
  });

  it('should have visible state with scale 1', () => {
    expect(errorIconEntrance.visible).toBeDefined();
    expect(errorIconEntrance.visible.scale).toBe(1);
    expect(errorIconEntrance.visible.rotate).toBe(0);
    expect(errorIconEntrance.visible.opacity).toBe(1);
  });

  it('should have spring transition', () => {
    expect(errorIconEntrance.visible.transition).toBeDefined();
    expect(errorIconEntrance.visible.transition.type).toBe('spring');
    expect(errorIconEntrance.visible.transition.stiffness).toBe(260);
    expect(errorIconEntrance.visible.transition.damping).toBe(20);
    expect(errorIconEntrance.visible.transition.duration).toBe(0.5);
  });
});

describe('Combined Loading-Error Transition', () => {
  it('should export loadingErrorTransition', () => {
    expect(loadingErrorTransition).toBeDefined();
  });

  it('should have all three states', () => {
    expect(loadingErrorTransition.loading).toBeDefined();
    expect(loadingErrorTransition.loaded).toBeDefined();
    expect(loadingErrorTransition.error).toBeDefined();
  });

  it('should have consistent loading state', () => {
    expect(loadingErrorTransition.loading.opacity).toBe(0.6);
    expect(loadingErrorTransition.loading.scale).toBe(1);
    expect(loadingErrorTransition.loading.x).toBe(0);
    expect(loadingErrorTransition.loading.filter).toBe('brightness(0.9)');
  });

  it('should have successful loaded state', () => {
    expect(loadingErrorTransition.loaded.opacity).toBe(1);
    expect(loadingErrorTransition.loaded.scale).toBe(1);
    expect(loadingErrorTransition.loaded.x).toBe(0);
    expect(loadingErrorTransition.loaded.filter).toBe('brightness(1)');
  });

  it('should have error state with shake', () => {
    expect(loadingErrorTransition.error.opacity).toBe(1);
    expect(loadingErrorTransition.error.scale).toBe(1);
    expect(loadingErrorTransition.error.x).toEqual([0, -8, 8, -8, 8, -4, 4, 0]);
    expect(loadingErrorTransition.error.filter).toBe('brightness(1.1)');
  });

  it('should have spring transition for error shake', () => {
    expect(loadingErrorTransition.error.transition).toBeDefined();
    expect(loadingErrorTransition.error.transition.duration).toBe(0.5);
    expect(loadingErrorTransition.error.transition.x.type).toBe('spring');
  });
});

describe('Loading Indicator Animation', () => {
  it('should export loadingIndicator', () => {
    expect(loadingIndicator).toBeDefined();
  });

  it('should have spinning animation', () => {
    expect(loadingIndicator.spinning).toBeDefined();
    expect(loadingIndicator.spinning.rotate).toBe(360);
    expect(loadingIndicator.spinning.transition).toBeDefined();
    expect(loadingIndicator.spinning.transition.duration).toBe(1);
    expect(loadingIndicator.spinning.transition.repeat).toBe(Infinity);
    expect(loadingIndicator.spinning.transition.ease).toBe('linear');
  });

  it('should have pulsing animation', () => {
    expect(loadingIndicator.pulsing).toBeDefined();
    expect(loadingIndicator.pulsing.scale).toEqual([1, 1.1, 1]);
    expect(loadingIndicator.pulsing.opacity).toEqual([0.8, 1, 0.8]);
    expect(loadingIndicator.pulsing.transition).toBeDefined();
    expect(loadingIndicator.pulsing.transition.duration).toBe(1.5);
    expect(loadingIndicator.pulsing.transition.repeat).toBe(Infinity);
    expect(loadingIndicator.pulsing.transition.ease).toBe('easeInOut');
  });
});

describe('Transition State Consistency', () => {
  it('should use consistent duration ranges for loading states', () => {
    // Loading states should be quick (0.3-0.4s)
    expect(loadingTransition.loading.transition.duration).toBeLessThanOrEqual(0.4);
    expect(loadingTransition.loaded.transition.duration).toBeLessThanOrEqual(0.5);
  });

  it('should use consistent opacity patterns', () => {
    // Loading should be dimmed
    expect(loadingTransition.loading.opacity).toBeLessThan(1);
    expect(loadingErrorTransition.loading.opacity).toBeLessThan(1);

    // Loaded should be full opacity
    expect(loadingTransition.loaded.opacity).toBe(1);
    expect(loadingErrorTransition.loaded.opacity).toBe(1);

    // Error should be full opacity (for visibility)
    expect(errorTransition.error.opacity).toBe(1);
    expect(loadingErrorTransition.error.opacity).toBe(1);
  });

  it('should use brightness for visual feedback', () => {
    // Loading should be dimmed
    expect(loadingTransition.loading.filter).toBe('brightness(0.9)');

    // Loaded should be normal brightness
    expect(loadingTransition.loaded.filter).toBe('brightness(1)');

    // Error should be slightly brighter (attention-grabbing)
    expect(errorTransition.error.filter).toBe('brightness(1.1)');
  });

  it('should maintain scale consistency', () => {
    // Most states should maintain scale: 1
    expect(loadingTransition.loading.scale).toBe(1);
    expect(loadingTransition.loaded.scale).toBe(1);
    expect(errorTransition.loading.scale).toBe(1);
    expect(errorTransition.loaded.scale).toBe(1);
    expect(errorTransition.error.scale).toBe(1);
  });

  it('should use shake effect only for errors', () => {
    // Error states should have shake (array of x positions)
    expect(Array.isArray(errorTransition.error.x)).toBe(true);
    expect(Array.isArray(loadingErrorTransition.error.x)).toBe(true);

    // Non-error states should not shake
    expect(loadingTransition.loading.x).toBeUndefined();
    expect(loadingTransition.loaded.x).toBeUndefined();
  });
});

describe('Animation Timing and Easing', () => {
  it('should use appropriate easing for loading transitions', () => {
    // Loading should use smooth easing
    expect(loadingTransition.loading.transition.ease).toBeDefined();
    expect(loadingTransition.loaded.transition.ease).toBeDefined();
  });

  it('should use spring physics for error shake', () => {
    // Error shake should use spring for natural bounce-back
    expect(errorTransition.error.transition.x.type).toBe('spring');
    expect(loadingErrorTransition.error.transition.x.type).toBe('spring');
  });

  it('should use appropriate stiffness for springs', () => {
    // Icon entrance should use moderate stiffness
    expect(errorIconEntrance.visible.transition.stiffness).toBe(260);

    // Error shake should use high stiffness for snappy effect
    expect(errorTransition.error.transition.x.stiffness).toBe(500);
  });

  it('should use infinite repeat for continuous animations', () => {
    // Skeleton pulse should repeat infinitely
    expect(skeletonAnimation.pulse.transition.repeat).toBe(Infinity);

    // Loading indicators should repeat infinitely
    expect(loadingIndicator.spinning.transition.repeat).toBe(Infinity);
    expect(loadingIndicator.pulsing.transition.repeat).toBe(Infinity);
  });
});

describe('Accessibility and UX', () => {
  it('should not use excessive brightness changes', () => {
    // Brightness changes should be subtle
    const loadingBrightness = parseFloat(
      loadingTransition.loading.filter.match(/brightness\(([\d.]+)\)/)?.[1] || '1'
    );
    const errorBrightness = parseFloat(
      errorTransition.error.filter.match(/brightness\(([\d.]+)\)/)?.[1] || '1'
    );

    // Should be within reasonable range (0.8 - 1.2)
    expect(loadingBrightness).toBeGreaterThanOrEqual(0.8);
    expect(loadingBrightness).toBeLessThanOrEqual(1.2);
    expect(errorBrightness).toBeGreaterThanOrEqual(0.8);
    expect(errorBrightness).toBeLessThanOrEqual(1.2);
  });

  it('should use reasonable animation durations', () => {
    // Animations should not be too slow (max 1.5s for continuous)
    expect(skeletonAnimation.pulse.transition.duration).toBeLessThanOrEqual(1.5);
    expect(loadingIndicator.spinning.transition.duration).toBeLessThanOrEqual(1.5);
    expect(loadingIndicator.pulsing.transition.duration).toBeLessThanOrEqual(1.5);

    // State transitions should be quick (max 0.5s)
    expect(loadingTransition.loading.transition.duration).toBeLessThanOrEqual(0.5);
    expect(loadingTransition.loaded.transition.duration).toBeLessThanOrEqual(0.5);
    expect(errorTransition.error.transition.duration).toBeLessThanOrEqual(0.5);
  });

  it('should use appropriate shake intensity', () => {
    // Shake should not be too violent
    const errorShake = errorTransition.error.x as number[];
    const maxShake = Math.max(...errorShake.map(Math.abs));

    // Maximum shake should be reasonable (10-15px)
    expect(maxShake).toBeLessThanOrEqual(15);
    expect(maxShake).toBeGreaterThanOrEqual(5);
  });
});
