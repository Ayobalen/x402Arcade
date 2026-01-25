/**
 * x402Arcade Z-Index Design Tokens
 *
 * This file defines all z-index values used throughout the application.
 * Uses a consistent scale to manage stacking contexts and prevent z-index wars.
 *
 * Design Philosophy:
 * - Base UI elements: 0-9
 * - Dropdowns and popovers: 10-30
 * - Sticky elements: 20
 * - Fixed position elements: 30
 * - Modal backdrops: 40
 * - Modals: 50
 * - Popovers over modals: 60
 * - Tooltips (always on top): 70
 *
 * Actual values use 1000+ to avoid conflicts with default browser values.
 */

/**
 * Z-Index Scale Tokens
 *
 * Standard z-index values for consistent layering.
 */
export const zIndex = {
  /** No z-index - default stacking */
  auto: 'auto',
  /** Base level - default content */
  base: '0',
  /** Slightly elevated - hover cards, highlighted items */
  raised: '1',
  /** Dropdown menus and select options */
  dropdown: '1000',
  /** Sticky headers and navigation */
  sticky: '1100',
  /** Fixed position elements (FABs, fixed navs) */
  fixed: '1200',
  /** Modal backdrop - dim layer behind modals */
  modalBackdrop: '1300',
  /** Modal dialogs - primary focus layer */
  modal: '1400',
  /** Popovers that can appear over modals */
  popover: '1500',
  /** Tooltips - always visible, topmost layer */
  tooltip: '1600',
  /** Toast notifications - critical visibility */
  toast: '1700',
  /** Debug overlays - development only */
  debug: '9999',
} as const;

/**
 * Semantic Z-Index Tokens
 *
 * Context-specific z-index values for common UI patterns.
 */
export const semanticZIndex = {
  /** Header navigation */
  header: zIndex.sticky,
  /** Sidebar navigation */
  sidebar: zIndex.fixed,
  /** Floating action button */
  fab: zIndex.fixed,
  /** Dropdown menu */
  menu: zIndex.dropdown,
  /** Modal dialog */
  dialog: zIndex.modal,
  /** Alert/confirmation modal */
  alert: zIndex.modal,
  /** Side panel/drawer */
  drawer: zIndex.modal,
  /** Tooltip on hover */
  tip: zIndex.tooltip,
  /** Notification toast */
  notification: zIndex.toast,
} as const;

/**
 * Complete Z-Index Tokens Object
 *
 * All z-index tokens exported as a single typed constant.
 */
export const zIndexTokens = {
  scale: zIndex,
  semantic: semanticZIndex,
} as const;

/**
 * Type definitions for z-index tokens
 */
export type ZIndex = typeof zIndex;
export type SemanticZIndex = typeof semanticZIndex;
export type ZIndexTokens = typeof zIndexTokens;

export default zIndexTokens;
