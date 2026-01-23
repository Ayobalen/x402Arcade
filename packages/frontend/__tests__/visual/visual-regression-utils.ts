/**
 * Visual Regression Testing Utilities
 *
 * This module provides utilities for running visual regression tests,
 * including snapshot comparison, viewport management, and diff generation.
 *
 * @module visual/visual-regression-utils
 *
 * @example
 * ```typescript
 * import { runVisualTests, compareSnapshots, captureScreenshot } from './visual-regression-utils';
 *
 * // Run all visual tests
 * await runVisualTests({ updateSnapshots: false });
 *
 * // Compare a specific component
 * const result = await compareSnapshots('Button', 'primary', 'desktop-md');
 * ```
 */

import {
  DEFAULT_CONFIG,
  STANDARD_VIEWPORTS,
  DEFAULT_THRESHOLD,
  STRICT_THRESHOLD,
  RELAXED_THRESHOLD,
  getViewport,
  getThreshold,
  getSnapshotFilename,
  mergeConfig,
  parseEnvConfig,
  type VisualRegressionConfig,
  type ViewportConfig,
  type DiffThresholdConfig,
} from './config';

// ============================================================================
// Types
// ============================================================================

/**
 * Result of a visual comparison
 */
export interface ComparisonResult {
  /** Whether the comparison passed */
  passed: boolean;
  /** Percentage of pixels that differed */
  diffPercentage: number;
  /** Number of pixels that differed */
  diffPixels: number;
  /** Total number of pixels compared */
  totalPixels: number;
  /** Path to the baseline image */
  baselinePath: string;
  /** Path to the actual image */
  actualPath: string;
  /** Path to the diff image (if any) */
  diffPath?: string;
  /** Error message if comparison failed */
  error?: string;
}

/**
 * Options for running visual tests
 */
export interface RunVisualTestsOptions {
  /** Update baseline snapshots */
  updateSnapshots?: boolean;
  /** Specific components to test (empty = all) */
  components?: string[];
  /** Specific viewports to test (empty = all) */
  viewports?: string[];
  /** Threshold type to use */
  thresholdType?: 'default' | 'strict' | 'relaxed';
  /** Custom config overrides */
  config?: Partial<VisualRegressionConfig>;
  /** Continue on error */
  continueOnError?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Visual test result summary
 */
export interface VisualTestSummary {
  /** Total number of tests run */
  total: number;
  /** Number of tests that passed */
  passed: number;
  /** Number of tests that failed */
  failed: number;
  /** Number of tests that were skipped */
  skipped: number;
  /** Number of snapshots updated */
  updated: number;
  /** Individual test results */
  results: ComponentTestResult[];
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Result for a single component test
 */
export interface ComponentTestResult {
  /** Component name */
  component: string;
  /** Variant tested */
  variant: string;
  /** Viewport used */
  viewport: string;
  /** Comparison result */
  comparison: ComparisonResult;
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Screenshot capture options
 */
export interface CaptureOptions {
  /** Viewport to use */
  viewport?: ViewportConfig;
  /** Full page screenshot */
  fullPage?: boolean;
  /** Element selector to capture */
  selector?: string;
  /** Wait for animations to complete */
  waitForAnimations?: boolean;
  /** Wait for network idle */
  waitForNetworkIdle?: boolean;
  /** Additional wait time in ms */
  delay?: number;
}

// ============================================================================
// State Management
// ============================================================================

let currentConfig = mergeConfig(DEFAULT_CONFIG, parseEnvConfig());
let testRegistry: Map<string, Set<string>> = new Map();
let isInitialized = false;

/**
 * Initialize visual testing environment
 */
export async function initVisualTesting(
  options: Partial<VisualRegressionConfig> = {}
): Promise<void> {
  currentConfig = mergeConfig(currentConfig, options);
  testRegistry = new Map();
  isInitialized = true;

  // Create directories if they don't exist (in Node.js environment)
  if (typeof window === 'undefined') {
    // This would be handled by the test runner in actual implementation
    console.log('[Visual] Initialized visual testing environment');
  }
}

/**
 * Get current configuration
 */
export function getConfig(): VisualRegressionConfig {
  return { ...currentConfig };
}

/**
 * Update configuration
 */
export function setConfig(options: Partial<VisualRegressionConfig>): void {
  currentConfig = mergeConfig(currentConfig, options);
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  currentConfig = mergeConfig(DEFAULT_CONFIG, parseEnvConfig());
  testRegistry.clear();
}

// ============================================================================
// Test Registration
// ============================================================================

/**
 * Register a component for visual testing
 */
export function registerComponent(
  componentName: string,
  variants: string[] = ['default']
): void {
  testRegistry.set(componentName, new Set(variants));
}

/**
 * Register multiple components
 */
export function registerComponents(
  components: Record<string, string[]>
): void {
  for (const [name, variants] of Object.entries(components)) {
    registerComponent(name, variants);
  }
}

/**
 * Get all registered components
 */
export function getRegisteredComponents(): Map<string, Set<string>> {
  return new Map(testRegistry);
}

/**
 * Clear component registry
 */
export function clearRegistry(): void {
  testRegistry.clear();
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Compare two images using a simple pixel-by-pixel algorithm
 * Note: In production, you'd use a library like pixelmatch or jest-image-snapshot
 */
export function compareImages(
  baseline: Uint8Array | ArrayBuffer,
  actual: Uint8Array | ArrayBuffer,
  threshold: DiffThresholdConfig = DEFAULT_THRESHOLD
): ComparisonResult {
  const baselineData = new Uint8Array(baseline);
  const actualData = new Uint8Array(actual);

  if (baselineData.length !== actualData.length) {
    return {
      passed: false,
      diffPercentage: 100,
      diffPixels: Math.max(baselineData.length, actualData.length),
      totalPixels: Math.max(baselineData.length, actualData.length),
      baselinePath: '',
      actualPath: '',
      error: 'Image dimensions do not match',
    };
  }

  const totalPixels = baselineData.length / 4; // RGBA = 4 bytes per pixel
  let diffPixels = 0;

  // Simple pixel comparison
  for (let i = 0; i < baselineData.length; i += 4) {
    const rDiff = Math.abs(baselineData[i] - actualData[i]);
    const gDiff = Math.abs(baselineData[i + 1] - actualData[i + 1]);
    const bDiff = Math.abs(baselineData[i + 2] - actualData[i + 2]);
    const aDiff = Math.abs(baselineData[i + 3] - actualData[i + 3]);

    const colorDiff = Math.max(rDiff, gDiff, bDiff, aDiff);

    if (colorDiff > threshold.colorThreshold) {
      diffPixels++;
    }
  }

  const diffPercentage = diffPixels / totalPixels;
  const passed = diffPercentage <= threshold.failThreshold;

  return {
    passed,
    diffPercentage: diffPercentage * 100,
    diffPixels,
    totalPixels,
    baselinePath: '',
    actualPath: '',
  };
}

/**
 * Mock compare snapshots function
 * In production, this would use actual image files
 */
export async function compareSnapshots(
  componentName: string,
  variant: string,
  viewportName: string,
  options: {
    threshold?: DiffThresholdConfig;
    updateIfMissing?: boolean;
  } = {}
): Promise<ComparisonResult> {
  const viewport = getViewport(viewportName);
  const threshold = options.threshold ?? currentConfig.defaultThreshold;
  const filename = getSnapshotFilename(componentName, variant, viewportName);

  // In a real implementation, this would:
  // 1. Load baseline image from disk
  // 2. Capture current screenshot
  // 3. Compare using pixelmatch or similar
  // 4. Generate diff image if needed

  // For now, return a mock passing result
  return {
    passed: true,
    diffPercentage: 0,
    diffPixels: 0,
    totalPixels: viewport ? viewport.width * viewport.height : 0,
    baselinePath: `${currentConfig.baselineDir}/${filename}`,
    actualPath: `${currentConfig.actualDir}/${filename}`,
  };
}

// ============================================================================
// Screenshot Capture
// ============================================================================

/**
 * Capture a screenshot (mock implementation)
 * In production, this would use Playwright, Puppeteer, or Storybook
 */
export async function captureScreenshot(
  url: string,
  options: CaptureOptions = {}
): Promise<Uint8Array> {
  const viewport = options.viewport ?? STANDARD_VIEWPORTS.find(v => v.name === 'desktop-md');

  // Wait for any requested delays
  if (options.delay) {
    await new Promise(resolve => setTimeout(resolve, options.delay));
  }

  // Mock implementation - return empty image data
  // In production, this would use Playwright/Puppeteer
  const width = viewport?.width ?? 1280;
  const height = viewport?.height ?? 800;
  const pixels = width * height * 4; // RGBA

  return new Uint8Array(pixels);
}

/**
 * Capture element screenshot
 */
export async function captureElement(
  element: Element | null,
  options: Omit<CaptureOptions, 'selector'> = {}
): Promise<Uint8Array | null> {
  if (!element) return null;

  // Mock implementation
  return captureScreenshot('', options);
}

// ============================================================================
// Test Runner
// ============================================================================

/**
 * Run visual regression tests
 */
export async function runVisualTests(
  options: RunVisualTestsOptions = {}
): Promise<VisualTestSummary> {
  const startTime = performance.now();
  const config = mergeConfig(currentConfig, options.config ?? {});

  const results: ComponentTestResult[] = [];
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const updated = 0; // TODO: Implement snapshot update tracking

  // Get components to test
  const components = options.components?.length
    ? options.components.filter(c => testRegistry.has(c))
    : Array.from(testRegistry.keys());

  // Get viewports to test
  const viewports = options.viewports?.length
    ? options.viewports.filter(v => STANDARD_VIEWPORTS.some(sv => sv.name === v))
    : config.viewports.map(v => v.name);

  // Get threshold
  const threshold = getThreshold(options.thresholdType);

  if (options.verbose) {
    console.log(`[Visual] Running tests for ${components.length} components across ${viewports.length} viewports`);
  }

  for (const componentName of components) {
    const variants = testRegistry.get(componentName) ?? new Set(['default']);

    for (const variant of variants) {
      for (const viewportName of viewports) {
        const testStartTime = performance.now();

        try {
          const comparison = await compareSnapshots(componentName, variant, viewportName, {
            threshold,
            updateIfMissing: options.updateSnapshots,
          });

          const result: ComponentTestResult = {
            component: componentName,
            variant,
            viewport: viewportName,
            comparison,
            duration: performance.now() - testStartTime,
          };

          results.push(result);

          if (comparison.passed) {
            passed++;
          } else {
            failed++;
            if (!options.continueOnError) {
              throw new Error(
                `Visual regression failed for ${componentName}/${variant}/${viewportName}: ${comparison.diffPercentage.toFixed(2)}% difference`
              );
            }
          }
        } catch (error) {
          if (!options.continueOnError) {
            throw error;
          }
          skipped++;
        }
      }
    }
  }

  return {
    total: results.length,
    passed,
    failed,
    skipped,
    updated,
    results,
    duration: performance.now() - startTime,
  };
}

/**
 * Run visual tests for a single component
 */
export async function runComponentTests(
  componentName: string,
  options: Omit<RunVisualTestsOptions, 'components'> = {}
): Promise<VisualTestSummary> {
  return runVisualTests({
    ...options,
    components: [componentName],
  });
}

/**
 * Run visual tests for specific viewports only
 */
export async function runViewportTests(
  viewports: string[],
  options: Omit<RunVisualTestsOptions, 'viewports'> = {}
): Promise<VisualTestSummary> {
  return runVisualTests({
    ...options,
    viewports,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a visual test helper for a specific component
 */
export function createComponentTester(componentName: string) {
  return {
    /**
     * Register variants for this component
     */
    registerVariants(variants: string[]): void {
      registerComponent(componentName, variants);
    },

    /**
     * Run tests for this component
     */
    async runTests(options: Omit<RunVisualTestsOptions, 'components'> = {}): Promise<VisualTestSummary> {
      return runComponentTests(componentName, options);
    },

    /**
     * Compare a specific variant
     */
    async compareVariant(
      variant: string,
      viewport: string = 'desktop-md'
    ): Promise<ComparisonResult> {
      return compareSnapshots(componentName, variant, viewport);
    },
  };
}

/**
 * Format comparison result for display
 */
export function formatComparisonResult(result: ComparisonResult): string {
  if (result.passed) {
    return `✓ Passed (${result.diffPercentage.toFixed(2)}% diff, ${result.diffPixels} pixels)`;
  }
  return `✗ Failed (${result.diffPercentage.toFixed(2)}% diff, ${result.diffPixels}/${result.totalPixels} pixels)`;
}

/**
 * Format test summary for display
 */
export function formatTestSummary(summary: VisualTestSummary): string {
  const lines = [
    '',
    '═══════════════════════════════════════════════════════════════',
    '                    Visual Regression Summary                   ',
    '═══════════════════════════════════════════════════════════════',
    '',
    `Total:   ${summary.total}`,
    `Passed:  ${summary.passed} ✓`,
    `Failed:  ${summary.failed} ✗`,
    `Skipped: ${summary.skipped} ○`,
    `Updated: ${summary.updated} ⟳`,
    '',
    `Duration: ${(summary.duration / 1000).toFixed(2)}s`,
    '',
  ];

  if (summary.failed > 0) {
    lines.push('Failed tests:');
    summary.results
      .filter(r => !r.comparison.passed)
      .forEach(r => {
        lines.push(`  • ${r.component}/${r.variant}/${r.viewport}: ${r.comparison.diffPercentage.toFixed(2)}% diff`);
      });
    lines.push('');
  }

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Generate HTML report for visual test results
 */
export function generateHtmlReport(summary: VisualTestSummary): string {
  const failedTests = summary.results.filter(r => !r.comparison.passed);
  const passedTests = summary.results.filter(r => r.comparison.passed);

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Regression Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat { padding: 1rem; border-radius: 8px; text-align: center; }
    .stat.passed { background: #d4edda; color: #155724; }
    .stat.failed { background: #f8d7da; color: #721c24; }
    .stat.total { background: #cce5ff; color: #004085; }
    .stat.skipped { background: #fff3cd; color: #856404; }
    .test-list { list-style: none; padding: 0; }
    .test-item { padding: 0.5rem; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .test-item.failed { background: #fff5f5; }
    .diff { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Visual Regression Report</h1>
  <div class="summary">
    <div class="stat total"><h2>${summary.total}</h2>Total</div>
    <div class="stat passed"><h2>${summary.passed}</h2>Passed</div>
    <div class="stat failed"><h2>${summary.failed}</h2>Failed</div>
    <div class="stat skipped"><h2>${summary.skipped}</h2>Skipped</div>
  </div>
  ${failedTests.length ? `
  <h2>Failed Tests</h2>
  <ul class="test-list">
    ${failedTests.map(t => `
      <li class="test-item failed">
        <span>${t.component} / ${t.variant} / ${t.viewport}</span>
        <span class="diff">${t.comparison.diffPercentage.toFixed(2)}% diff</span>
      </li>
    `).join('')}
  </ul>
  ` : ''}
  <h2>All Tests</h2>
  <ul class="test-list">
    ${summary.results.map(t => `
      <li class="test-item${t.comparison.passed ? '' : ' failed'}">
        <span>${t.comparison.passed ? '✓' : '✗'} ${t.component} / ${t.variant} / ${t.viewport}</span>
        <span class="diff">${t.comparison.diffPercentage.toFixed(2)}% | ${t.duration.toFixed(0)}ms</span>
      </li>
    `).join('')}
  </ul>
  <footer>
    <p>Generated at ${new Date().toISOString()} | Duration: ${(summary.duration / 1000).toFixed(2)}s</p>
  </footer>
</body>
</html>
`;
}

// ============================================================================
// Re-exports from config
// ============================================================================

export {
  DEFAULT_CONFIG,
  DEFAULT_THRESHOLD,
  STRICT_THRESHOLD,
  RELAXED_THRESHOLD,
  STANDARD_VIEWPORTS,
  getViewport,
  getThreshold,
  getSnapshotFilename,
  mergeConfig,
  parseEnvConfig,
  type VisualRegressionConfig,
  type ViewportConfig,
  type DiffThresholdConfig,
};
