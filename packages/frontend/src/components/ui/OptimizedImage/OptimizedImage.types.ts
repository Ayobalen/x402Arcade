/**
 * OptimizedImage Types
 *
 * Type definitions for the OptimizedImage component.
 */

import type { ImgHTMLAttributes } from 'react';

/**
 * Loading strategy for images
 */
export type ImageLoading = 'lazy' | 'eager';

/**
 * Decoding hint for the browser
 */
export type ImageDecoding = 'sync' | 'async' | 'auto';

/**
 * Fetch priority for images
 */
export type ImageFetchPriority = 'high' | 'low' | 'auto';

/**
 * Supported image formats
 */
export type ImageFormat = 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'svg' | 'avif';

/**
 * Image source for responsive images
 */
export interface ImageSource {
  /** Image source URL */
  src: string;
  /** Image format */
  format: ImageFormat;
  /** Media query for this source */
  media?: string;
  /** Sizes attribute */
  sizes?: string;
  /** Srcset for responsive images */
  srcset?: string;
}

/**
 * OptimizedImage component props
 */
export interface OptimizedImageProps extends Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  'loading' | 'decoding' | 'fetchPriority'
> {
  /**
   * Image source URL (original format)
   * WebP version will be auto-detected at same path with .webp extension
   */
  src: string;

  /**
   * Alt text for accessibility (required)
   */
  alt: string;

  /**
   * Intrinsic width of the image in pixels
   * Used to calculate aspect ratio and prevent layout shift
   */
  width?: number;

  /**
   * Intrinsic height of the image in pixels
   * Used to calculate aspect ratio and prevent layout shift
   */
  height?: number;

  /**
   * Sizes attribute for responsive images
   * @example "(max-width: 768px) 100vw, 50vw"
   */
  sizes?: string;

  /**
   * Srcset for responsive images
   * @example "/img-400.jpg 400w, /img-800.jpg 800w"
   */
  srcset?: string;

  /**
   * Loading strategy
   * @default "lazy"
   */
  loading?: ImageLoading;

  /**
   * Decoding hint for the browser
   * @default "async"
   */
  decoding?: ImageDecoding;

  /**
   * Fetch priority hint
   * @default "auto"
   */
  fetchPriority?: ImageFetchPriority;

  /**
   * Whether to include WebP source
   * Set to false if you know WebP version doesn't exist
   * @default true
   */
  webp?: boolean;

  /**
   * Whether to include AVIF source (even smaller than WebP)
   * @default false
   */
  avif?: boolean;

  /**
   * Additional sources for different media queries or formats
   */
  sources?: ImageSource[];

  /**
   * Object-fit CSS property for the image
   * @default "cover"
   */
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

  /**
   * Object-position CSS property for the image
   * @default "center"
   */
  objectPosition?: string;

  /**
   * Placeholder blur color while loading
   * Uses a subtle gray by default
   */
  placeholderColor?: string;

  /**
   * Callback when image loads successfully
   */
  onLoad?: () => void;

  /**
   * Callback when image fails to load
   */
  onError?: () => void;

  /**
   * Additional class name for the picture element wrapper
   */
  pictureClassName?: string;
}
