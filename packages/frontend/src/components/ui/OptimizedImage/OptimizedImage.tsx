/**
 * OptimizedImage Component
 *
 * A performance-optimized image component that:
 * - Uses `<picture>` element for format negotiation
 * - Automatically includes WebP source for modern browsers
 * - Supports AVIF for even better compression
 * - Prevents layout shift with width/height
 * - Supports lazy loading and fetch priority
 * - Provides fallback for older browsers
 *
 * @module components/ui/OptimizedImage
 */

import { forwardRef, useMemo, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import type { OptimizedImageProps, ImageSource } from './OptimizedImage.types';

/**
 * Converts an image path to WebP format
 * @param src - Original image source
 * @returns WebP version of the path
 */
function toWebP(src: string): string {
  // Don't convert SVGs or data URIs
  if (src.endsWith('.svg') || src.startsWith('data:')) {
    return src;
  }
  // Replace extension with .webp
  return src.replace(/\.(png|jpe?g|gif)$/i, '.webp');
}

/**
 * Converts an image path to AVIF format
 * @param src - Original image source
 * @returns AVIF version of the path
 */
function toAvif(src: string): string {
  // Don't convert SVGs or data URIs
  if (src.endsWith('.svg') || src.startsWith('data:')) {
    return src;
  }
  // Replace extension with .avif
  return src.replace(/\.(png|jpe?g|gif|webp)$/i, '.avif');
}

/**
 * Gets the MIME type for an image format
 * @param src - Image source or format
 * @returns MIME type string
 */
function getMimeType(src: string): string {
  const ext = src.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'webp':
      return 'image/webp';
    case 'avif':
      return 'image/avif';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'image/png';
  }
}

/**
 * Checks if a source is an SVG
 * @param src - Image source
 * @returns true if SVG
 */
function isSvg(src: string): boolean {
  return src.endsWith('.svg') || src.startsWith('data:image/svg');
}

/**
 * OptimizedImage component with automatic WebP/AVIF support
 */
export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  function OptimizedImage(
    {
      src,
      alt,
      width,
      height,
      sizes,
      srcset,
      loading = 'lazy',
      decoding = 'async',
      fetchPriority = 'auto',
      webp = true,
      avif = false,
      sources = [],
      objectFit = 'cover',
      objectPosition = 'center',
      placeholderColor = '#1a1a2e',
      onLoad,
      onError,
      className,
      pictureClassName,
      style,
      ...props
    },
    ref
  ) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Don't use picture element for SVGs
    const shouldUsePicture = !isSvg(src);

    // Generate sources for different formats
    const generatedSources = useMemo<ImageSource[]>(() => {
      if (!shouldUsePicture) return [];

      const result: ImageSource[] = [];

      // Add AVIF source (best compression, limited support)
      if (avif) {
        result.push({
          src: toAvif(src),
          format: 'avif',
          sizes,
          srcset: srcset ? srcset.replace(/\.(png|jpe?g|gif|webp)/gi, '.avif') : undefined,
        });
      }

      // Add WebP source (good compression, wide support)
      if (webp) {
        result.push({
          src: toWebP(src),
          format: 'webp',
          sizes,
          srcset: srcset ? srcset.replace(/\.(png|jpe?g|gif)/gi, '.webp') : undefined,
        });
      }

      return result;
    }, [src, webp, avif, sizes, srcset, shouldUsePicture]);

    // Combine generated sources with custom sources
    const allSources = useMemo(() => {
      return [...sources, ...generatedSources];
    }, [sources, generatedSources]);

    // Handle image load
    const handleLoad = useCallback(() => {
      setIsLoaded(true);
      onLoad?.();
    }, [onLoad]);

    // Handle image error
    const handleError = useCallback(() => {
      setHasError(true);
      onError?.();
    }, [onError]);

    // Image styles
    const imageStyles = useMemo(
      () => ({
        objectFit,
        objectPosition,
        ...style,
      }),
      [objectFit, objectPosition, style]
    );

    // Placeholder styles
    const placeholderStyles = useMemo(
      () => ({
        backgroundColor: !isLoaded && !hasError ? placeholderColor : undefined,
        transition: 'opacity 0.2s ease-in-out',
        opacity: isLoaded ? 1 : 0.8,
      }),
      [isLoaded, hasError, placeholderColor]
    );

    // The img element (shared between picture and standalone)
    const imgElement = (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        srcSet={srcset}
        loading={loading}
        decoding={decoding}
        // @ts-expect-error - fetchPriority is a valid HTML attribute but not typed in React yet
        fetchpriority={fetchPriority}
        onLoad={handleLoad}
        onError={handleError}
        className={clsx('max-w-full h-auto', !isLoaded && 'animate-pulse', className)}
        style={{
          ...imageStyles,
          ...placeholderStyles,
        }}
        {...props}
      />
    );

    // SVGs and single-format images don't need picture element
    if (!shouldUsePicture || allSources.length === 0) {
      return imgElement;
    }

    // Use picture element for format negotiation
    return (
      <picture className={pictureClassName}>
        {/* Render sources in priority order (AVIF > WebP > original) */}
        {allSources.map((source, index) => (
          <source
            key={`${source.format}-${index}`}
            srcSet={source.srcset || source.src}
            sizes={source.sizes}
            media={source.media}
            type={getMimeType(source.src)}
          />
        ))}
        {imgElement}
      </picture>
    );
  }
);

// Display name for debugging
OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
