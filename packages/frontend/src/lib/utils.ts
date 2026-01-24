/**
 * Utility functions for the x402Arcade frontend
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind CSS merge support.
 * Uses clsx for conditional classes and twMerge to properly handle Tailwind conflicts.
 *
 * @example
 * cn('px-4 py-2', condition && 'bg-blue-500', 'text-white')
 * // Returns merged class string with Tailwind conflicts resolved
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
