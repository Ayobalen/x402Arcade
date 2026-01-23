/**
 * E2E Visual Comparison Utilities
 *
 * Utilities for visual snapshot comparison in E2E tests.
 * Provides helpers for taking screenshots, comparing against baselines,
 * and masking dynamic content.
 *
 * @example
 * ```typescript
 * import { test, expect } from '@playwright/test';
 * import { VisualTester, maskDynamicContent } from '../utils/visual-utils';
 *
 * test('game lobby visual test', async ({ page }) => {
 *   const visual = new VisualTester(page);
 *   await page.goto('/lobby');
 *
 *   // Mask dynamic content like timestamps
 *   await maskDynamicContent(page, [
 *     '[data-testid="timestamp"]',
 *     '.user-avatar'
 *   ]);
 *
 *   // Compare screenshot to baseline
 *   await visual.compareScreenshot('lobby-page');
 * });
 * ```
 */

import { Page, Locator, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Visual comparison configuration options
 */
export interface VisualConfig {
  /** Directory for baseline screenshots */
  baselineDir: string;
  /** Directory for actual screenshots (current test run) */
  actualDir: string;
  /** Directory for diff images */
  diffDir: string;
  /** Maximum allowed pixel difference ratio (0-1) */
  maxDiffThreshold: number;
  /** Maximum allowed pixel difference count */
  maxDiffPixels: number;
  /** Whether to update baselines when missing */
  updateBaselines: boolean;
  /** Default image format */
  format: 'png' | 'jpeg';
  /** Full page screenshot by default */
  fullPage: boolean;
  /** Animations timeout before screenshot */
  animationsTimeout: number;
}

/**
 * Default visual comparison configuration
 */
export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  baselineDir: 'e2e/visual-baselines',
  actualDir: 'test-results/visual-actual',
  diffDir: 'test-results/visual-diff',
  maxDiffThreshold: 0.01, // 1% pixel difference allowed
  maxDiffPixels: 100, // Or up to 100 pixels different
  updateBaselines: process.env.UPDATE_BASELINES === 'true',
  format: 'png',
  fullPage: false,
  animationsTimeout: 500,
};

/**
 * Screenshot options for visual comparison
 */
export interface ScreenshotOptions {
  /** Screenshot name (used for baseline matching) */
  name: string;
  /** Custom threshold for this screenshot */
  threshold?: number;
  /** Take full page screenshot */
  fullPage?: boolean;
  /** Custom clip region */
  clip?: { x: number; y: number; width: number; height: number };
  /** Selectors to mask (will be replaced with solid color) */
  mask?: string[];
  /** Mask color */
  maskColor?: string;
  /** Wait for animations to complete */
  waitForAnimations?: boolean;
  /** Custom timeout for animations */
  animationsTimeout?: number;
}

/**
 * Visual comparison result
 */
export interface ComparisonResult {
  /** Whether the comparison passed */
  passed: boolean;
  /** Difference ratio (0-1) */
  diffRatio: number;
  /** Number of different pixels */
  diffPixels: number;
  /** Path to baseline image */
  baselinePath: string;
  /** Path to actual image */
  actualPath: string;
  /** Path to diff image (if generated) */
  diffPath?: string;
  /** Whether baseline was created */
  baselineCreated: boolean;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// Main Visual Tester Class
// ============================================================================

/**
 * Visual tester for E2E screenshot comparisons
 */
export class VisualTester {
  private page: Page;
  private config: VisualConfig;

  constructor(page: Page, config: Partial<VisualConfig> = {}) {
    this.page = page;
    this.config = { ...DEFAULT_VISUAL_CONFIG, ...config };
  }

  /**
   * Compare a screenshot against its baseline
   * @param name - Screenshot name for baseline matching
   * @param options - Screenshot options
   */
  async compareScreenshot(
    name: string,
    options: Omit<ScreenshotOptions, 'name'> = {}
  ): Promise<ComparisonResult> {
    const fullOptions: ScreenshotOptions = { name, ...options };

    // Wait for animations if requested
    if (fullOptions.waitForAnimations !== false) {
      await this.waitForAnimations(fullOptions.animationsTimeout);
    }

    // Apply masks for dynamic content
    if (fullOptions.mask && fullOptions.mask.length > 0) {
      await this.applyMasks(fullOptions.mask, fullOptions.maskColor);
    }

    // Generate paths
    const baselinePath = this.getBaselinePath(name);
    const actualPath = this.getActualPath(name);

    // Ensure directories exist
    this.ensureDirectories();

    // Take screenshot
    const screenshot = await this.page.screenshot({
      fullPage: fullOptions.fullPage ?? this.config.fullPage,
      clip: fullOptions.clip,
      type: this.config.format,
      path: actualPath,
    });

    // Check if baseline exists
    const baselineExists = fs.existsSync(baselinePath);

    if (!baselineExists) {
      if (this.config.updateBaselines) {
        // Create baseline
        fs.copyFileSync(actualPath, baselinePath);
        return {
          passed: true,
          diffRatio: 0,
          diffPixels: 0,
          baselinePath,
          actualPath,
          baselineCreated: true,
        };
      } else {
        return {
          passed: false,
          diffRatio: 1,
          diffPixels: -1,
          baselinePath,
          actualPath,
          baselineCreated: false,
          error: `Baseline not found: ${baselinePath}. Run with UPDATE_BASELINES=true to create.`,
        };
      }
    }

    // Use Playwright's built-in visual comparison
    const threshold = fullOptions.threshold ?? this.config.maxDiffThreshold;

    try {
      await expect(this.page).toHaveScreenshot(name + '.' + this.config.format, {
        maxDiffPixels: this.config.maxDiffPixels,
        threshold,
        fullPage: fullOptions.fullPage ?? this.config.fullPage,
      });

      return {
        passed: true,
        diffRatio: 0,
        diffPixels: 0,
        baselinePath,
        actualPath,
        baselineCreated: false,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Parse diff information from error if available
      const diffMatch = errorMessage.match(/(\d+(?:\.\d+)?)\s*%?\s*diff/i);
      const diffRatio = diffMatch ? parseFloat(diffMatch[1]) / 100 : 1;

      return {
        passed: false,
        diffRatio,
        diffPixels: -1,
        baselinePath,
        actualPath,
        diffPath: this.getDiffPath(name),
        baselineCreated: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Update a baseline screenshot
   * @param name - Screenshot name
   */
  async updateBaseline(name: string, options: Omit<ScreenshotOptions, 'name'> = {}): Promise<void> {
    const baselinePath = this.getBaselinePath(name);

    // Wait for animations
    if (options.waitForAnimations !== false) {
      await this.waitForAnimations(options.animationsTimeout);
    }

    // Apply masks
    if (options.mask && options.mask.length > 0) {
      await this.applyMasks(options.mask, options.maskColor);
    }

    // Ensure directory exists
    const dir = path.dirname(baselinePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Take screenshot directly to baseline path
    await this.page.screenshot({
      fullPage: options.fullPage ?? this.config.fullPage,
      clip: options.clip,
      type: this.config.format,
      path: baselinePath,
    });
  }

  /**
   * Wait for CSS animations and transitions to complete
   */
  private async waitForAnimations(timeout?: number): Promise<void> {
    const waitTime = timeout ?? this.config.animationsTimeout;

    // Wait for animations using page.evaluate
    await this.page.evaluate(async (wait) => {
      // Wait for any ongoing animations
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          setTimeout(resolve, wait);
        });
      });
    }, waitTime);
  }

  /**
   * Apply visual masks to dynamic content
   */
  private async applyMasks(selectors: string[], color?: string): Promise<void> {
    const maskColor = color ?? '#808080'; // Default gray mask

    for (const selector of selectors) {
      await this.page.evaluate(
        ({ sel, col }) => {
          const elements = document.querySelectorAll(sel);
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.backgroundColor = col;
            htmlEl.style.color = col;
            // Hide images and SVGs
            if (el.tagName === 'IMG' || el.tagName === 'SVG') {
              htmlEl.style.visibility = 'hidden';
            }
          });
        },
        { sel: selector, col: maskColor }
      );
    }
  }

  /**
   * Get baseline path for a screenshot name
   */
  private getBaselinePath(name: string): string {
    const browserName = this.page.context().browser()?.browserType().name() ?? 'unknown';
    return path.join(
      process.cwd(),
      this.config.baselineDir,
      browserName,
      `${name}.${this.config.format}`
    );
  }

  /**
   * Get actual screenshot path
   */
  private getActualPath(name: string): string {
    return path.join(
      process.cwd(),
      this.config.actualDir,
      `${name}-actual.${this.config.format}`
    );
  }

  /**
   * Get diff image path
   */
  private getDiffPath(name: string): string {
    return path.join(
      process.cwd(),
      this.config.diffDir,
      `${name}-diff.${this.config.format}`
    );
  }

  /**
   * Ensure all output directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      path.join(process.cwd(), this.config.baselineDir),
      path.join(process.cwd(), this.config.actualDir),
      path.join(process.cwd(), this.config.diffDir),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Mask dynamic content on the page before taking screenshots
 * @param page - Playwright page
 * @param selectors - CSS selectors for elements to mask
 * @param color - Mask color (default: gray)
 */
export async function maskDynamicContent(
  page: Page,
  selectors: string[],
  color: string = '#808080'
): Promise<void> {
  for (const selector of selectors) {
    await page.evaluate(
      ({ sel, col }) => {
        const elements = document.querySelectorAll(sel);
        elements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.backgroundColor = col;
          htmlEl.style.color = col;
          htmlEl.style.backgroundImage = 'none';
          // Handle images
          if (el.tagName === 'IMG') {
            (el as HTMLImageElement).src = '';
            htmlEl.style.visibility = 'hidden';
          }
          // Handle SVGs
          if (el.tagName === 'SVG' || el.tagName === 'svg') {
            htmlEl.style.visibility = 'hidden';
          }
        });
      },
      { sel: selector, col: color }
    );
  }
}

/**
 * Create a mask locator for Playwright's toHaveScreenshot
 * @param page - Playwright page
 * @param selectors - CSS selectors to mask
 */
export function createMaskLocators(page: Page, selectors: string[]): Locator[] {
  return selectors.map((selector) => page.locator(selector));
}

/**
 * Wait for page to stabilize (no network requests, animations complete)
 * @param page - Playwright page
 * @param options - Stability options
 */
export async function waitForVisualStability(
  page: Page,
  options: {
    networkIdleTimeout?: number;
    animationTimeout?: number;
    checkInterval?: number;
  } = {}
): Promise<void> {
  const {
    networkIdleTimeout = 500,
    animationTimeout = 500,
    checkInterval = 100,
  } = options;

  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout: networkIdleTimeout * 10 }).catch(() => {});

  // Wait for animations
  await page.evaluate(
    async ({ animTimeout, interval }) => {
      // Wait for CSS animations to complete
      const startTime = Date.now();
      while (Date.now() - startTime < animTimeout) {
        const animations = document.getAnimations();
        if (animations.length === 0) break;
        await new Promise((r) => setTimeout(r, interval));
      }
    },
    { animTimeout: animationTimeout, interval: checkInterval }
  );

  // Final stabilization wait
  await page.waitForTimeout(100);
}

/**
 * Take a viewport-only screenshot (no scrolling)
 * @param page - Playwright page
 * @param name - Screenshot name
 * @param outputDir - Output directory
 */
export async function takeViewportScreenshot(
  page: Page,
  name: string,
  outputDir: string = 'test-results/screenshots'
): Promise<string> {
  const screenshotPath = path.join(process.cwd(), outputDir, `${name}.png`);

  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: screenshotPath,
    fullPage: false,
  });

  return screenshotPath;
}

/**
 * Take a full-page screenshot
 * @param page - Playwright page
 * @param name - Screenshot name
 * @param outputDir - Output directory
 */
export async function takeFullPageScreenshot(
  page: Page,
  name: string,
  outputDir: string = 'test-results/screenshots'
): Promise<string> {
  const screenshotPath = path.join(process.cwd(), outputDir, `${name}-full.png`);

  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  return screenshotPath;
}

/**
 * Take an element screenshot
 * @param locator - Playwright locator for the element
 * @param name - Screenshot name
 * @param outputDir - Output directory
 */
export async function takeElementScreenshot(
  locator: Locator,
  name: string,
  outputDir: string = 'test-results/screenshots'
): Promise<string> {
  const screenshotPath = path.join(process.cwd(), outputDir, `${name}-element.png`);

  // Ensure directory exists
  const dir = path.dirname(screenshotPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await locator.screenshot({
    path: screenshotPath,
  });

  return screenshotPath;
}

// ============================================================================
// Visual Comparison Assertions
// ============================================================================

/**
 * Assert that a page matches its visual baseline
 * @param page - Playwright page
 * @param name - Screenshot name
 * @param options - Comparison options
 */
export async function assertVisualMatch(
  page: Page,
  name: string,
  options: {
    threshold?: number;
    maxDiffPixels?: number;
    fullPage?: boolean;
    mask?: Locator[];
  } = {}
): Promise<void> {
  await expect(page).toHaveScreenshot(`${name}.png`, {
    threshold: options.threshold ?? 0.01,
    maxDiffPixels: options.maxDiffPixels ?? 100,
    fullPage: options.fullPage ?? false,
    mask: options.mask,
  });
}

/**
 * Assert that an element matches its visual baseline
 * @param locator - Playwright locator
 * @param name - Screenshot name
 * @param options - Comparison options
 */
export async function assertElementVisualMatch(
  locator: Locator,
  name: string,
  options: {
    threshold?: number;
    maxDiffPixels?: number;
    mask?: Locator[];
  } = {}
): Promise<void> {
  await expect(locator).toHaveScreenshot(`${name}.png`, {
    threshold: options.threshold ?? 0.01,
    maxDiffPixels: options.maxDiffPixels ?? 50,
    mask: options.mask,
  });
}

// ============================================================================
// Exports
// ============================================================================

export default VisualTester;
