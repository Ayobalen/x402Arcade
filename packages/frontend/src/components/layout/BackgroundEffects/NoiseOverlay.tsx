/**
 * NoiseOverlay Component
 *
 * Film grain/noise overlay effect for added texture and authentic retro feel.
 * Creates an animated noise pattern that simulates analog video grain.
 *
 * Features:
 * - Generates procedural noise pattern
 * - Animated grain for authentic film look
 * - Configurable intensity
 * - Performance-optimized with CSS and requestAnimationFrame
 * - Minimal DOM manipulation
 *
 * @example
 * // Default settings
 * <NoiseOverlay />
 *
 * @example
 * // Custom intensity and animation
 * <NoiseOverlay intensity={0.15} animate={true} fps={15} />
 *
 * @example
 * // High grain for strong retro effect
 * <NoiseOverlay intensity={0.2} animate={true} fps={24} />
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface NoiseOverlayProps {
  /**
   * Custom className for the container
   */
  className?: string;

  /**
   * Noise intensity (opacity of the noise layer)
   * @default 0.08
   * @range 0 to 1
   */
  intensity?: number;

  /**
   * Whether to animate the noise pattern
   * @default true
   */
  animate?: boolean;

  /**
   * Animation frames per second
   * Lower FPS = less CPU usage, higher FPS = smoother grain
   * @default 12 (cinematic film grain)
   * @range 1 to 60
   */
  fps?: number;

  /**
   * Noise grain size (CSS filter blur amount in px)
   * @default 1
   * @range 0 to 5
   */
  grainSize?: number;

  /**
   * Blend mode for the noise layer
   * @default 'overlay'
   */
  blendMode?: 'overlay' | 'multiply' | 'screen' | 'soft-light' | 'hard-light';
}

export function NoiseOverlay({
  className,
  intensity = 0.08,
  animate = true,
  fps = 12,
  grainSize = 1,
  blendMode = 'overlay',
}: NoiseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  // Clamp values to valid ranges
  const clampedIntensity = Math.max(0, Math.min(1, intensity));
  const clampedFps = Math.max(1, Math.min(60, fps));
  const clampedGrainSize = Math.max(0, Math.min(5, grainSize));
  const frameInterval = 1000 / clampedFps;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Performance optimization
    });
    if (!ctx) return;

    // Set canvas size to match viewport (use smaller size for performance)
    const updateCanvasSize = () => {
      const scale = 0.5; // Use half resolution for performance
      canvas.width = window.innerWidth * scale;
      canvas.height = window.innerHeight * scale;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };

    updateCanvasSize();

    // Generate noise pattern
    const generateNoise = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Generate random noise
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 256);
        data[i] = value; // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255; // A
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Animation loop
    const animateNoise = (timestamp: number) => {
      if (!animate) {
        // If not animating, generate once and stop
        generateNoise();
        return;
      }

      // Throttle to target FPS
      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);
        generateNoise();
      }

      frameIdRef.current = requestAnimationFrame(animateNoise);
    };

    // Start animation
    frameIdRef.current = requestAnimationFrame(animateNoise);

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
      if (!animate) {
        generateNoise();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [animate, frameInterval]);

  return (
    <div
      className={cn(
        // Fixed positioning to cover entire viewport
        'fixed inset-0',
        // Prevent pointer events (allow clicks to pass through)
        'pointer-events-none',
        // Layer above background effects but below content
        'z-[5]',
        className
      )}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          opacity: clampedIntensity,
          mixBlendMode: blendMode,
          filter: clampedGrainSize > 0 ? `blur(${clampedGrainSize}px)` : undefined,
          imageRendering: 'pixelated', // Preserve grain sharpness
        }}
      />
    </div>
  );
}

NoiseOverlay.displayName = 'NoiseOverlay';

export default NoiseOverlay;
