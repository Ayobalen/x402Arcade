/**
 * Class Name Utility
 *
 * Merges class names using clsx and tailwind-merge for proper Tailwind CSS class handling.
 * Ensures that conflicting Tailwind classes are properly merged (e.g., last class wins).
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4' (px-4 overrides px-2)
 * cn('text-red-500', condition && 'text-blue-500') // => conditional classes
 * ```
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names with proper Tailwind CSS handling
 *
 * @param inputs - Class names to merge
 * @returns Merged class name string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
