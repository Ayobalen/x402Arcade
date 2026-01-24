/**
 * Assets Module
 *
 * This module provides centralized access to static assets.
 * Import assets here and re-export for type-safe usage throughout the app.
 *
 * @module assets
 */

// ============================================================================
// Asset Path Helpers
// ============================================================================

/**
 * Get the full path to an image asset
 * @param filename - The image filename (e.g., 'logo.svg')
 * @returns The full import path
 */
export function getImagePath(filename: string): string {
  return new URL(`./images/${filename}`, import.meta.url).href
}

/**
 * Get the full path to a sound asset
 * @param filename - The sound filename (e.g., 'button-click.mp3')
 * @returns The full import path
 */
export function getSoundPath(filename: string): string {
  return new URL(`./sounds/${filename}`, import.meta.url).href
}

/**
 * Get the full path to a sprite asset
 * @param filename - The sprite filename (e.g., 'snake-body.png')
 * @returns The full import path
 */
export function getSpritePath(filename: string): string {
  return new URL(`./sprites/${filename}`, import.meta.url).href
}

/**
 * Get the full path to a font asset
 * @param filename - The font filename (e.g., 'Inter.woff2')
 * @returns The full import path
 */
export function getFontPath(filename: string): string {
  return new URL(`./fonts/${filename}`, import.meta.url).href
}

// ============================================================================
// Preload Helpers
// ============================================================================

/**
 * Preload an image for faster rendering
 * @param src - The image source URL
 * @returns Promise that resolves when the image is loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 * @param srcs - Array of image source URLs
 * @returns Promise that resolves when all images are loaded
 */
export function preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
  return Promise.all(srcs.map(preloadImage))
}

/**
 * Preload an audio file
 * @param src - The audio source URL
 * @returns Promise that resolves when the audio is ready
 */
export function preloadAudio(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.oncanplaythrough = () => resolve(audio)
    audio.onerror = reject
    audio.src = src
  })
}

// ============================================================================
// Asset Constants
// ============================================================================

/**
 * Supported image formats
 */
export const IMAGE_FORMATS = ['webp', 'png', 'jpg', 'jpeg', 'svg', 'gif'] as const
export type ImageFormat = (typeof IMAGE_FORMATS)[number]

/**
 * Supported audio formats
 */
export const AUDIO_FORMATS = ['mp3', 'ogg', 'wav', 'm4a'] as const
export type AudioFormat = (typeof AUDIO_FORMATS)[number]

/**
 * Supported font formats
 */
export const FONT_FORMATS = ['woff2', 'woff', 'ttf', 'otf'] as const
export type FontFormat = (typeof FONT_FORMATS)[number]

// ============================================================================
// Default Export
// ============================================================================

export default {
  getImagePath,
  getSoundPath,
  getSpritePath,
  getFontPath,
  preloadImage,
  preloadImages,
  preloadAudio,
  IMAGE_FORMATS,
  AUDIO_FORMATS,
  FONT_FORMATS,
}
