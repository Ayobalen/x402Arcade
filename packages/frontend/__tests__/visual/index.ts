/**
 * Visual Regression Testing Module
 *
 * Provides utilities for visual regression testing including:
 * - Configuration management
 * - Snapshot comparison
 * - Screenshot capture
 * - Test runners
 * - Reporting
 *
 * @module visual
 *
 * @example
 * ```typescript
 * import {
 *   registerComponent,
 *   runVisualTests,
 *   formatTestSummary,
 * } from './__tests__/visual';
 *
 * // Register components to test
 * registerComponent('Button', ['primary', 'secondary', 'disabled']);
 * registerComponent('Input', ['text', 'password', 'search']);
 *
 * // Run visual tests
 * const summary = await runVisualTests({
 *   viewports: ['desktop-md', 'mobile-sm'],
 *   thresholdType: 'default',
 * });
 *
 * console.log(formatTestSummary(summary));
 * ```
 */

// Configuration exports
export {
  // Config values
  DEFAULT_CONFIG,
  DEFAULT_THRESHOLD,
  STRICT_THRESHOLD,
  RELAXED_THRESHOLD,
  STANDARD_VIEWPORTS,
  // Config functions
  getViewport,
  getThreshold,
  getSnapshotFilename,
  mergeConfig,
  parseEnvConfig,
  // Config types
  type VisualRegressionConfig,
  type ViewportConfig,
  type DiffThresholdConfig,
} from './config';

// Visual regression utilities
export {
  // State management
  initVisualTesting,
  getConfig,
  setConfig,
  resetConfig,
  // Registration
  registerComponent,
  registerComponents,
  getRegisteredComponents,
  clearRegistry,
  // Comparison
  compareImages,
  compareSnapshots,
  // Screenshot capture
  captureScreenshot,
  captureElement,
  // Test runners
  runVisualTests,
  runComponentTests,
  runViewportTests,
  // Component tester factory
  createComponentTester,
  // Formatting
  formatComparisonResult,
  formatTestSummary,
  generateHtmlReport,
  // Types
  type ComparisonResult,
  type RunVisualTestsOptions,
  type VisualTestSummary,
  type ComponentTestResult,
  type CaptureOptions,
} from './visual-regression-utils';
