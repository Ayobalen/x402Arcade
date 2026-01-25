/**
 * ResponsiveImage Component
 *
 * A responsive image component that automatically generates srcset
 * and sizes attributes for optimal performance across devices.
 *
 * Features:
 * - Automatic srcset generation for multiple widths
 * - Preset breakpoint configurations for common use cases
 * - Priority loading for above-the-fold images
 * - Aspect ratio preservation
 * - WebP/AVIF format support (via OptimizedImage)
 *
 * @module components/ui/ResponsiveImage
 */

import { forwardRef, useMemo } from 'react';
import { clsx } from 'clsx';
import { OptimizedImage } from '../OptimizedImage';
import type { ResponsiveImageProps, ImageBreakpoint } from './ResponsiveImage.types';
import { DEFAULT_WIDTHS, BREAKPOINT_PRESETS, SIZES_PRESETS } from './ResponsiveImage.types';

/**
 * Default srcset URL generator
 * Converts base URL to include width suffix
 */
function defaultSrcsetGenerator(src: string, width: number, format: string): string {
  // Remove existing extension if present
  const baseSrc = src.replace(/\.(jpg|jpeg|png|webp|avif|gif)$/i, '');
  return `${baseSrc}-${width}.${format}`;
}

/**
 * Generate srcset string from widths array
 */
function generateSrcset(
  src: string,
  widths: readonly number[],
  generator: (src: string, width: number) => string
): string {
  return widths.map((width) => `${generator(src, width)} ${width}w`).join(', ');
}

/**
 * Generate sizes attribute from breakpoints
 */
function generateSizes(breakpoints: ImageBreakpoint[]): string {
  const sorted = [...breakpoints].sort((a, b) => a.width - b.width);

  return sorted
    .map((bp, index) => {
      if (bp.width === Infinity || index === sorted.length - 1) {
        return `${bp.imageWidth}px`;
      }
      return `(max-width: ${bp.width}px) ${bp.imageWidth}px`;
    })
    .join(', ');
}

/**
 * ResponsiveImage component with automatic srcset and sizes generation
 */
export const ResponsiveImage = forwardRef<HTMLImageElement, ResponsiveImageProps>(
  function ResponsiveImage(
    {
      src,
      alt,
      width,
      height,
      widths = DEFAULT_WIDTHS,
      sizes: customSizes,
      breakpoints,
      preset,
      priority = false,
      aspectRatio,
      preserveAspectRatio = true,
      srcsetGenerator,
      format = 'jpg',
      loading,
      fetchPriority,
      className,
      style,
      ...props
    },
    ref
  ) {
    // Determine loading strategy
    const finalLoading = loading ?? (priority ? 'eager' : 'lazy');
    const finalFetchPriority = fetchPriority ?? (priority ? 'high' : 'auto');

    // Get breakpoints from preset or custom
    const finalBreakpoints = useMemo(() => {
      if (breakpoints) return breakpoints;
      if (preset) return BREAKPOINT_PRESETS[preset];
      return null;
    }, [breakpoints, preset]);

    // Generate or use custom srcset generator
    const generator = useMemo(() => {
      if (srcsetGenerator) return srcsetGenerator;
      return (baseSrc: string, w: number) => defaultSrcsetGenerator(baseSrc, w, format);
    }, [srcsetGenerator, format]);

    // Generate srcset
    const srcset = useMemo(() => {
      return generateSrcset(src, widths, generator);
    }, [src, widths, generator]);

    // Generate or use custom sizes
    // Priority: customSizes > custom breakpoints > preset sizes > default
    const sizes = useMemo(() => {
      if (customSizes) return customSizes;
      // If custom breakpoints provided, use them even if preset is also specified
      if (breakpoints) return generateSizes(breakpoints);
      // Use preset sizes if available
      if (preset && SIZES_PRESETS[preset]) return SIZES_PRESETS[preset];
      // Fallback to generating from preset breakpoints
      if (finalBreakpoints) return generateSizes(finalBreakpoints);
      // Default: use image width up to 100vw
      return `(max-width: ${width}px) 100vw, ${width}px`;
    }, [customSizes, breakpoints, preset, finalBreakpoints, width]);

    // Calculate aspect ratio
    const calculatedAspectRatio = useMemo(() => {
      if (aspectRatio) return aspectRatio;
      return `${width} / ${height}`;
    }, [aspectRatio, width, height]);

    // Container styles for aspect ratio preservation
    const containerStyles = useMemo(() => {
      if (!preserveAspectRatio) return style;
      return {
        aspectRatio: calculatedAspectRatio,
        ...style,
      };
    }, [preserveAspectRatio, calculatedAspectRatio, style]);

    return (
      <OptimizedImage
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        srcset={srcset}
        sizes={sizes}
        loading={finalLoading}
        fetchPriority={finalFetchPriority}
        className={clsx(preserveAspectRatio && 'w-full h-auto', className)}
        style={containerStyles}
        {...props}
      />
    );
  }
);

// Display name for debugging
ResponsiveImage.displayName = 'ResponsiveImage';

export default ResponsiveImage;
