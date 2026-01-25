/**
 * ResponsiveImage Types
 *
 * Type definitions for the ResponsiveImage component that handles
 * automatic srcset generation and responsive breakpoints.
 */

import type { OptimizedImageProps } from '../OptimizedImage/OptimizedImage.types';

/**
 * Breakpoint configuration for responsive images
 */
export interface ImageBreakpoint {
  /** Width at which this breakpoint applies (in pixels) */
  width: number;
  /** Image width to use at this breakpoint (in pixels) */
  imageWidth: number;
  /** Optional media query override */
  media?: string;
}

/**
 * Preset breakpoint configurations
 */
export type BreakpointPreset =
  | 'thumbnail'
  | 'card'
  | 'hero'
  | 'full-width'
  | 'game-thumbnail'
  | 'avatar';

/**
 * Image size variant for srcset generation
 */
export interface ImageSizeVariant {
  /** Width of this image variant */
  width: number;
  /** Height of this image variant (optional, maintains aspect ratio if omitted) */
  height?: number;
  /** Pixel density descriptor (e.g., "1x", "2x") or width descriptor (e.g., "400w") */
  descriptor: string;
}

/**
 * ResponsiveImage component props
 */
export interface ResponsiveImageProps extends Omit<OptimizedImageProps, 'srcset' | 'sizes'> {
  /**
   * Base image source without size suffix
   * The component will automatically generate srcset URLs
   * @example "/images/game-card" → "/images/game-card-400.jpg 400w, ..."
   */
  src: string;

  /**
   * Original image dimensions for aspect ratio calculation
   */
  width: number;
  height: number;

  /**
   * Array of widths to generate in srcset
   * @default [320, 640, 768, 1024, 1280, 1536]
   */
  widths?: number[];

  /**
   * Sizes attribute for responsive images
   * If not provided, will be generated from breakpoints
   * @example "(max-width: 768px) 100vw, 50vw"
   */
  sizes?: string;

  /**
   * Custom breakpoints for sizes attribute generation
   * If not provided, uses sensible defaults
   */
  breakpoints?: ImageBreakpoint[];

  /**
   * Use a preset breakpoint configuration
   * Overridden by custom breakpoints if provided
   */
  preset?: BreakpointPreset;

  /**
   * Whether the image should be eager-loaded (above the fold)
   * Sets loading="eager" and fetchPriority="high"
   * @default false
   */
  priority?: boolean;

  /**
   * Aspect ratio for the image container
   * If not provided, calculated from width/height
   * @example "16/9" or "1/1"
   */
  aspectRatio?: string;

  /**
   * Whether to apply aspect ratio container styling
   * @default true
   */
  preserveAspectRatio?: boolean;

  /**
   * Custom srcset URL generator
   * Receives base src and width, returns full URL
   * @default (src, width) => `${src}-${width}.jpg`
   */
  srcsetGenerator?: (src: string, width: number) => string;

  /**
   * Image format for srcset generation
   * @default "jpg"
   */
  format?: 'jpg' | 'png' | 'webp';
}

/**
 * Default widths for srcset generation
 */
export const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536] as const;

/**
 * Preset breakpoint configurations
 */
export const BREAKPOINT_PRESETS: Record<BreakpointPreset, ImageBreakpoint[]> = {
  thumbnail: [
    { width: 640, imageWidth: 150 },
    { width: 1024, imageWidth: 200 },
    { width: Infinity, imageWidth: 250 },
  ],
  card: [
    { width: 640, imageWidth: 320 },
    { width: 1024, imageWidth: 400 },
    { width: Infinity, imageWidth: 500 },
  ],
  hero: [
    { width: 640, imageWidth: 640 },
    { width: 1024, imageWidth: 1024 },
    { width: Infinity, imageWidth: 1536 },
  ],
  'full-width': [
    { width: 640, imageWidth: 640 },
    { width: 768, imageWidth: 768 },
    { width: 1024, imageWidth: 1024 },
    { width: 1280, imageWidth: 1280 },
    { width: Infinity, imageWidth: 1536 },
  ],
  'game-thumbnail': [
    { width: 480, imageWidth: 200 },
    { width: 768, imageWidth: 280 },
    { width: 1024, imageWidth: 320 },
    { width: Infinity, imageWidth: 400 },
  ],
  avatar: [
    { width: 640, imageWidth: 48 },
    { width: 1024, imageWidth: 64 },
    { width: Infinity, imageWidth: 96 },
  ],
};

/**
 * Default sizes attribute for common use cases
 */
export const SIZES_PRESETS: Record<BreakpointPreset, string> = {
  thumbnail: '(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px',
  card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  hero: '100vw',
  'full-width': '100vw',
  'game-thumbnail':
    '(max-width: 480px) 200px, (max-width: 768px) 280px, (max-width: 1024px) 320px, 400px',
  avatar: '(max-width: 640px) 48px, (max-width: 1024px) 64px, 96px',
};
