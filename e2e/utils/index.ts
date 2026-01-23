/**
 * E2E Test Utilities Index
 *
 * Central export for all E2E test utilities.
 *
 * @example
 * ```typescript
 * import { VisualTester, maskDynamicContent, waitForVisualStability } from '../utils';
 * ```
 */

// Visual comparison utilities
export {
  VisualTester,
  DEFAULT_VISUAL_CONFIG,
  maskDynamicContent,
  createMaskLocators,
  waitForVisualStability,
  takeViewportScreenshot,
  takeFullPageScreenshot,
  takeElementScreenshot,
  assertVisualMatch,
  assertElementVisualMatch,
} from './visual-utils';

// Type exports
export type {
  VisualConfig,
  ScreenshotOptions,
  ComparisonResult,
} from './visual-utils';
