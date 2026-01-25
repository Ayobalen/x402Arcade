/**
 * LiveRegion Component Types
 *
 * Type definitions for ARIA live region component for screen reader announcements.
 */

import type { ReactNode } from 'react';

/**
 * ARIA live politeness levels
 *
 * - polite: Wait for natural pause before announcing (most common)
 * - assertive: Announce immediately, interrupting current speech
 * - off: Disable live region announcements
 */
export type AriaPoliteness = 'polite' | 'assertive' | 'off';

/**
 * ARIA relevant changes to announce
 *
 * - additions: Announce when new content is added
 * - removals: Announce when content is removed
 * - text: Announce when text content changes
 * - all: Announce all changes
 */
export type AriaRelevant = 'additions' | 'removals' | 'text' | 'all' | 'additions text';

/**
 * Props for the LiveRegion component
 */
export interface LiveRegionProps {
  /**
   * Message to announce to screen readers
   * When this changes, the new value will be announced
   */
  message?: ReactNode;

  /**
   * Politeness level for announcements
   * @default 'polite'
   */
  politeness?: AriaPoliteness;

  /**
   * Types of changes that should be announced
   * @default 'additions text'
   */
  relevant?: AriaRelevant;

  /**
   * Whether to announce atomic changes only (announce entire region on change)
   * @default false
   */
  atomic?: boolean;

  /**
   * Whether the region is currently active/visible
   * When false, announcements are disabled
   * @default true
   */
  isActive?: boolean;

  /**
   * Optional CSS class name for the container
   */
  className?: string;

  /**
   * Optional role override
   * @default 'status' for polite, 'alert' for assertive
   */
  role?: 'status' | 'alert' | 'log' | 'region';
}

/**
 * Configuration for creating a live region announcement
 */
export interface LiveRegionAnnouncement {
  /** Message to announce */
  message: string;
  /** Politeness level */
  politeness?: AriaPoliteness;
  /** Delay before clearing announcement (ms) */
  clearAfter?: number;
}
