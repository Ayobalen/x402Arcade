import { interpolate, Easing } from 'remotion';
import { easings } from './designTokens';

// Create Remotion easing functions from our design tokens
export const createEasing = (curve: readonly [number, number, number, number]) => {
  return Easing.bezier(curve[0], curve[1], curve[2], curve[3]);
};

export const easeCubicOut = createEasing(easings.cubicOut);
export const easeExpoOut = createEasing(easings.expoOut);
export const easeBackOut = createEasing(easings.backOut);
export const easeBounceOut = createEasing(easings.bounceOut);
export const easeCubicInOut = createEasing(easings.cubicInOut);

/**
 * Fade in animation
 */
export const fadeIn = (frame: number, fps: number, duration: number = 0.6, delay: number = 0) => {
  return interpolate(frame, [delay * fps, (delay + duration) * fps], [0, 1], {
    easing: easeCubicOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  frame: number,
  fps: number,
  duration: number = 0.4,
  startFrame: number = 0
) => {
  return interpolate(frame, [startFrame, startFrame + duration * fps], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Scale up animation with back easing (slight overshoot)
 */
export const scaleUp = (
  frame: number,
  fps: number,
  duration: number = 0.6,
  delay: number = 0,
  from: number = 0.8,
  to: number = 1
) => {
  return interpolate(frame, [delay * fps, (delay + duration) * fps], [from, to], {
    easing: easeBackOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Slide in from bottom
 */
export const slideInUp = (
  frame: number,
  fps: number,
  duration: number = 0.6,
  delay: number = 0,
  distance: number = 80
) => {
  return interpolate(frame, [delay * fps, (delay + duration) * fps], [distance, 0], {
    easing: easeCubicOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Slide up animation (alias for slideInUp for clarity)
 */
export const slideUp = slideInUp;

/**
 * Slide in from left
 */
export const slideInLeft = (
  frame: number,
  fps: number,
  duration: number = 0.6,
  delay: number = 0,
  distance: number = 100
) => {
  return interpolate(frame, [delay * fps, (delay + duration) * fps], [-distance, 0], {
    easing: easeCubicOut,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

/**
 * Glitch effect (random offset)
 */
export const glitch = (frame: number, fps: number, intensity: number = 5) => {
  const glitchFrame = Math.floor(frame / 3) % 2 === 0 ? intensity : 0;
  return glitchFrame * (Math.random() > 0.5 ? 1 : -1);
};

/**
 * Shake effect (for errors/emphasis)
 */
export const shake = (
  frame: number,
  fps: number,
  startFrame: number = 0,
  duration: number = 0.5
) => {
  const progress = (frame - startFrame) / (duration * fps);
  if (progress < 0 || progress > 1) return 0;

  const frequency = 20;
  const amplitude = 5 * (1 - progress); // Decay over time
  return Math.sin(progress * frequency) * amplitude;
};

/**
 * Stagger delay helper
 */
export const stagger = (index: number, delayPerItem: number = 0.15) => {
  return index * delayPerItem;
};

/**
 * Glow pulse animation
 */
export const glowPulse = (
  frame: number,
  fps: number,
  speed: number = 2,
  min: number = 0.6,
  max: number = 1
) => {
  const progress = (frame / fps) * speed;
  const value = Math.sin(progress) * 0.5 + 0.5; // 0 to 1
  return min + value * (max - min);
};
