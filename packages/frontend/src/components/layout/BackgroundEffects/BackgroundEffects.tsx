/**
 * BackgroundEffects Component
 *
 * Global background visual effects for the arcade theme.
 * Includes dark gradient, grid pattern overlay, and corner glow effects.
 *
 * Features:
 * - Dark gradient background from deep purple to black
 * - Subtle grid pattern overlay for retro feel
 * - Corner glow effects (cyan/magenta) for neon aesthetic
 * - Performance optimized with CSS-only effects
 * - Fixed positioning behind all content
 *
 * @example
 * <BackgroundEffects />
 *
 * @example
 * // With custom intensity
 * <BackgroundEffects gridOpacity={0.15} glowIntensity="high" />
 */

import { cn } from '@/lib/utils';

export interface BackgroundEffectsProps {
  /** Custom className for the container */
  className?: string;
  /** Whether to show the grid pattern (default: true) */
  showGrid?: boolean;
  /** Opacity of the grid pattern (0-1, default: 0.1) */
  gridOpacity?: number;
  /** Whether to show corner glows (default: true) */
  showGlows?: boolean;
  /** Glow intensity: 'low' | 'medium' | 'high' (default: 'medium') */
  glowIntensity?: 'low' | 'medium' | 'high';
  /** Whether to animate the glows (default: false for performance) */
  animateGlows?: boolean;
}

/**
 * Grid pattern sizes and colors
 */
const GRID_SIZE = 50; // pixels
const GRID_COLOR = 'rgba(45, 45, 74, 0.5)'; // --color-border with alpha

/**
 * Glow intensity configurations
 */
const glowConfigs = {
  low: {
    size: '400px',
    opacity: 0.15,
  },
  medium: {
    size: '500px',
    opacity: 0.25,
  },
  high: {
    size: '600px',
    opacity: 0.35,
  },
};

export function BackgroundEffects({
  className,
  showGrid = true,
  gridOpacity = 0.1,
  showGlows = true,
  glowIntensity = 'medium',
  animateGlows = false,
}: BackgroundEffectsProps) {
  const glowConfig = glowConfigs[glowIntensity];

  return (
    <div
      className={cn(
        // Fixed positioning behind all content
        'fixed inset-0',
        'pointer-events-none',
        'z-0',
        // Overflow hidden to prevent glow bleed
        'overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Base dark gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              ellipse at 50% 0%,
              rgba(26, 26, 46, 0.8) 0%,
              rgba(10, 10, 15, 1) 50%,
              rgba(10, 10, 10, 1) 100%
            )
          `,
        }}
      />

      {/* Subtle grid pattern overlay */}
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(${GRID_COLOR} 1px, transparent 1px),
              linear-gradient(90deg, ${GRID_COLOR} 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
            opacity: gridOpacity,
          }}
        />
      )}

      {/* Corner glow effects */}
      {showGlows && (
        <>
          {/* Top-left cyan glow */}
          <div
            className={cn(
              'absolute',
              '-top-[200px] -left-[200px]',
              'rounded-full',
              'blur-[100px]',
              animateGlows && 'animate-pulse'
            )}
            style={{
              width: glowConfig.size,
              height: glowConfig.size,
              background: `radial-gradient(circle, rgba(0, 255, 255, ${glowConfig.opacity}) 0%, transparent 70%)`,
            }}
          />

          {/* Top-right magenta glow */}
          <div
            className={cn(
              'absolute',
              '-top-[150px] -right-[150px]',
              'rounded-full',
              'blur-[120px]',
              animateGlows && 'animate-pulse'
            )}
            style={{
              width: glowConfig.size,
              height: glowConfig.size,
              background: `radial-gradient(circle, rgba(255, 0, 255, ${glowConfig.opacity * 0.8}) 0%, transparent 70%)`,
              animationDelay: animateGlows ? '1s' : undefined,
            }}
          />

          {/* Bottom-left magenta glow (subtle) */}
          <div
            className={cn(
              'absolute',
              '-bottom-[250px] -left-[100px]',
              'rounded-full',
              'blur-[150px]',
              animateGlows && 'animate-pulse'
            )}
            style={{
              width: `calc(${glowConfig.size} * 0.8)`,
              height: `calc(${glowConfig.size} * 0.8)`,
              background: `radial-gradient(circle, rgba(255, 0, 255, ${glowConfig.opacity * 0.5}) 0%, transparent 70%)`,
              animationDelay: animateGlows ? '2s' : undefined,
            }}
          />

          {/* Bottom-right cyan glow (subtle) */}
          <div
            className={cn(
              'absolute',
              '-bottom-[200px] -right-[200px]',
              'rounded-full',
              'blur-[130px]',
              animateGlows && 'animate-pulse'
            )}
            style={{
              width: `calc(${glowConfig.size} * 0.7)`,
              height: `calc(${glowConfig.size} * 0.7)`,
              background: `radial-gradient(circle, rgba(0, 255, 255, ${glowConfig.opacity * 0.6}) 0%, transparent 70%)`,
              animationDelay: animateGlows ? '1.5s' : undefined,
            }}
          />
        </>
      )}

      {/* Center ambient glow (very subtle) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[200px]"
        style={{
          width: '800px',
          height: '600px',
          background: `radial-gradient(ellipse, rgba(26, 26, 46, 0.3) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}

BackgroundEffects.displayName = 'BackgroundEffects';

export default BackgroundEffects;
