/**
 * Common Game Utilities
 *
 * This module exports shared game logic and utilities that can be used
 * across all game implementations in the x402 Arcade.
 *
 * For core game engine functionality (game loop, state machine, input handling,
 * collision detection, audio), see the `engine/` module.
 *
 * This module contains higher-level game utilities like:
 * - Score formatting
 * - Time formatting
 * - Common game UI helpers
 *
 * @module games/common
 */

// ============================================================================
// Score Utilities
// ============================================================================

/**
 * Format a score number with commas for display
 * @param score - The score to format
 * @returns Formatted score string (e.g., "1,234,567")
 */
export function formatScore(score: number): string {
  return score.toLocaleString('en-US')
}

/**
 * Format a score with leading zeros
 * @param score - The score to format
 * @param digits - Number of digits to pad to
 * @returns Padded score string (e.g., "000123")
 */
export function formatScorePadded(score: number, digits = 6): string {
  return score.toString().padStart(digits, '0')
}

/**
 * Calculate bonus points based on time remaining
 * @param timeRemaining - Time remaining in seconds
 * @param multiplier - Points per second (default 10)
 * @returns Bonus points
 */
export function calculateTimeBonus(timeRemaining: number, multiplier = 10): number {
  return Math.max(0, Math.floor(timeRemaining * multiplier))
}

/**
 * Calculate level-based score multiplier
 * @param level - Current game level
 * @param baseMultiplier - Base multiplier (default 1)
 * @returns Score multiplier for the level
 */
export function getLevelMultiplier(level: number, baseMultiplier = 1): number {
  return baseMultiplier + (level - 1) * 0.1
}

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Format elapsed time as MM:SS
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string (e.g., "02:34")
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format elapsed time as MM:SS.mmm
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string with milliseconds (e.g., "02:34.567")
 */
export function formatTimeWithMs(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const ms = milliseconds % 1000
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}

/**
 * Convert frames to milliseconds based on target FPS
 * @param frames - Number of frames
 * @param fps - Target frames per second (default 60)
 * @returns Time in milliseconds
 */
export function framesToMs(frames: number, fps = 60): number {
  return (frames / fps) * 1000
}

/**
 * Convert milliseconds to frames based on target FPS
 * @param ms - Time in milliseconds
 * @param fps - Target frames per second (default 60)
 * @returns Number of frames
 */
export function msToFrames(ms: number, fps = 60): number {
  return Math.floor((ms / 1000) * fps)
}

// ============================================================================
// Grid Utilities
// ============================================================================

/**
 * Convert grid coordinates to pixel coordinates
 * @param gridX - Grid X position
 * @param gridY - Grid Y position
 * @param cellSize - Size of each cell in pixels
 * @returns Pixel coordinates
 */
export function gridToPixel(
  gridX: number,
  gridY: number,
  cellSize: number
): { x: number; y: number } {
  return {
    x: gridX * cellSize,
    y: gridY * cellSize,
  }
}

/**
 * Convert pixel coordinates to grid coordinates
 * @param pixelX - Pixel X position
 * @param pixelY - Pixel Y position
 * @param cellSize - Size of each cell in pixels
 * @returns Grid coordinates
 */
export function pixelToGrid(
  pixelX: number,
  pixelY: number,
  cellSize: number
): { x: number; y: number } {
  return {
    x: Math.floor(pixelX / cellSize),
    y: Math.floor(pixelY / cellSize),
  }
}

/**
 * Check if a grid position is within bounds
 * @param x - Grid X position
 * @param y - Grid Y position
 * @param width - Grid width
 * @param height - Grid height
 * @returns True if position is within bounds
 */
export function isWithinGrid(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && x < width && y >= 0 && y < height
}

// ============================================================================
// Random Utilities
// ============================================================================

/**
 * Get a random integer between min and max (inclusive)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random integer
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Get a random float between min and max
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random float
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Pick a random element from an array
 * @param array - Array to pick from
 * @returns Random element, or undefined if array is empty
 */
export function randomPick<T>(array: T[]): T | undefined {
  if (array.length === 0) return undefined
  return array[randomInt(0, array.length - 1)]
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 * @param array - Array to shuffle
 * @returns The shuffled array
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(0, i)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

// ============================================================================
// Math Utilities
// ============================================================================

/**
 * Clamp a value between min and max
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 * @param start - Start value
 * @param end - End value
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * Ease-in-out interpolation (smooth start and end)
 * @param t - Time value (0-1)
 * @returns Eased value
 */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Calculate distance between two points
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
}

/**
 * Calculate angle between two points in radians
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Angle in radians
 */
export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  // Score
  formatScore,
  formatScorePadded,
  calculateTimeBonus,
  getLevelMultiplier,
  // Time
  formatTime,
  formatTimeWithMs,
  framesToMs,
  msToFrames,
  // Grid
  gridToPixel,
  pixelToGrid,
  isWithinGrid,
  // Random
  randomInt,
  randomFloat,
  randomPick,
  shuffle,
  // Math
  clamp,
  lerp,
  easeInOut,
  distance,
  angle,
}
