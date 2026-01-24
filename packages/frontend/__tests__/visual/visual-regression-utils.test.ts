/**
 * Visual Regression Utilities Tests
 *
 * Tests for visual regression testing infrastructure.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  // Config
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
  // Screenshot
  captureScreenshot,
  captureElement,
  // Test runner
  runVisualTests,
  runComponentTests,
  runViewportTests,
  // Utilities
  createComponentTester,
  formatComparisonResult,
  formatTestSummary,
  generateHtmlReport,
} from './visual-regression-utils';

describe('Visual Regression Utilities', () => {
  beforeEach(() => {
    resetConfig();
    clearRegistry();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration', () => {
    describe('DEFAULT_CONFIG', () => {
      it('should have correct baseline directory', () => {
        expect(DEFAULT_CONFIG.baselineDir).toBe('__tests__/visual/__image_snapshots__');
      });

      it('should have correct actual directory', () => {
        expect(DEFAULT_CONFIG.actualDir).toBe('__tests__/visual/__actual_snapshots__');
      });

      it('should have correct diff directory', () => {
        expect(DEFAULT_CONFIG.diffDir).toBe('__tests__/visual/__diff_snapshots__');
      });

      it('should have standard viewports', () => {
        expect(DEFAULT_CONFIG.viewports.length).toBeGreaterThan(0);
      });

      it('should have correct snapshot extension', () => {
        expect(DEFAULT_CONFIG.snapshotExtension).toBe('.png');
      });
    });

    describe('Thresholds', () => {
      it('DEFAULT_THRESHOLD should have balanced values', () => {
        expect(DEFAULT_THRESHOLD.pixelThreshold).toBe(0.01);
        expect(DEFAULT_THRESHOLD.colorThreshold).toBe(10);
        expect(DEFAULT_THRESHOLD.failThreshold).toBe(0.05);
        expect(DEFAULT_THRESHOLD.allowAntialiasing).toBe(true);
      });

      it('STRICT_THRESHOLD should have stricter values', () => {
        expect(STRICT_THRESHOLD.pixelThreshold).toBeLessThan(DEFAULT_THRESHOLD.pixelThreshold);
        expect(STRICT_THRESHOLD.failThreshold).toBeLessThan(DEFAULT_THRESHOLD.failThreshold);
      });

      it('RELAXED_THRESHOLD should have more lenient values', () => {
        expect(RELAXED_THRESHOLD.pixelThreshold).toBeGreaterThan(DEFAULT_THRESHOLD.pixelThreshold);
        expect(RELAXED_THRESHOLD.failThreshold).toBeGreaterThan(DEFAULT_THRESHOLD.failThreshold);
      });
    });

    describe('STANDARD_VIEWPORTS', () => {
      it('should include mobile viewports', () => {
        const mobileViewports = STANDARD_VIEWPORTS.filter(v => v.isMobile);
        expect(mobileViewports.length).toBeGreaterThan(0);
      });

      it('should include desktop viewports', () => {
        const desktopViewports = STANDARD_VIEWPORTS.filter(v => !v.isMobile);
        expect(desktopViewports.length).toBeGreaterThan(0);
      });

      it('should have named viewports', () => {
        for (const viewport of STANDARD_VIEWPORTS) {
          expect(viewport.name).toBeTruthy();
          expect(viewport.width).toBeGreaterThan(0);
          expect(viewport.height).toBeGreaterThan(0);
        }
      });

      it('should include common viewport sizes', () => {
        const names = STANDARD_VIEWPORTS.map(v => v.name);
        expect(names).toContain('mobile-sm');
        expect(names).toContain('desktop-md');
      });
    });

    describe('getViewport', () => {
      it('should return viewport by name', () => {
        const viewport = getViewport('desktop-md');
        expect(viewport).toBeDefined();
        expect(viewport?.width).toBe(1280);
      });

      it('should return undefined for unknown viewport', () => {
        const viewport = getViewport('unknown');
        expect(viewport).toBeUndefined();
      });
    });

    describe('getThreshold', () => {
      it('should return default threshold', () => {
        expect(getThreshold('default')).toBe(DEFAULT_THRESHOLD);
        expect(getThreshold()).toBe(DEFAULT_THRESHOLD);
      });

      it('should return strict threshold', () => {
        expect(getThreshold('strict')).toBe(STRICT_THRESHOLD);
      });

      it('should return relaxed threshold', () => {
        expect(getThreshold('relaxed')).toBe(RELAXED_THRESHOLD);
      });
    });

    describe('getSnapshotFilename', () => {
      it('should generate correct filename', () => {
        const filename = getSnapshotFilename('Button', 'primary', 'desktop-md');
        expect(filename).toBe('button-primary-desktop-md.png');
      });

      it('should sanitize special characters', () => {
        const filename = getSnapshotFilename('My Button', 'primary_large', 'desktop-md');
        expect(filename).toBe('my-button-primary-large-desktop-md.png');
      });

      it('should support custom extension', () => {
        const filename = getSnapshotFilename('Button', 'primary', 'desktop-md', '.jpg');
        expect(filename).toBe('button-primary-desktop-md.jpg');
      });
    });

    describe('mergeConfig', () => {
      it('should merge base and overrides', () => {
        const merged = mergeConfig(DEFAULT_CONFIG, {
          updateSnapshots: true,
        });
        expect(merged.updateSnapshots).toBe(true);
        expect(merged.baselineDir).toBe(DEFAULT_CONFIG.baselineDir);
      });

      it('should deep merge thresholds', () => {
        const merged = mergeConfig(DEFAULT_CONFIG, {
          defaultThreshold: { pixelThreshold: 0.02 },
        });
        expect(merged.defaultThreshold.pixelThreshold).toBe(0.02);
        expect(merged.defaultThreshold.colorThreshold).toBe(DEFAULT_THRESHOLD.colorThreshold);
      });
    });

    describe('parseEnvConfig', () => {
      it('should parse environment variables', () => {
        const originalEnv = process.env.VISUAL_UPDATE_SNAPSHOTS;
        process.env.VISUAL_UPDATE_SNAPSHOTS = 'true';

        const config = parseEnvConfig();
        expect(config.updateSnapshots).toBe(true);

        process.env.VISUAL_UPDATE_SNAPSHOTS = originalEnv;
      });
    });
  });

  describe('State Management', () => {
    describe('initVisualTesting', () => {
      it('should initialize with default config', async () => {
        await initVisualTesting();
        const config = getConfig();
        expect(config.baselineDir).toBe(DEFAULT_CONFIG.baselineDir);
      });

      it('should accept custom options', async () => {
        await initVisualTesting({ updateSnapshots: true });
        const config = getConfig();
        expect(config.updateSnapshots).toBe(true);
      });
    });

    describe('getConfig / setConfig', () => {
      it('should get current config', () => {
        const config = getConfig();
        expect(config).toBeDefined();
        expect(config.baselineDir).toBeTruthy();
      });

      it('should update config', () => {
        setConfig({ updateSnapshots: true });
        const config = getConfig();
        expect(config.updateSnapshots).toBe(true);
      });
    });

    describe('resetConfig', () => {
      it('should reset to defaults', () => {
        setConfig({ updateSnapshots: true });
        resetConfig();
        const config = getConfig();
        expect(config.updateSnapshots).toBe(false);
      });
    });
  });

  describe('Component Registration', () => {
    describe('registerComponent', () => {
      it('should register component with variants', () => {
        registerComponent('Button', ['primary', 'secondary']);
        const components = getRegisteredComponents();
        expect(components.has('Button')).toBe(true);
        expect(components.get('Button')?.has('primary')).toBe(true);
      });

      it('should use default variant if none provided', () => {
        registerComponent('Icon');
        const components = getRegisteredComponents();
        expect(components.get('Icon')?.has('default')).toBe(true);
      });
    });

    describe('registerComponents', () => {
      it('should register multiple components', () => {
        registerComponents({
          Button: ['primary', 'secondary'],
          Input: ['text', 'password'],
        });
        const components = getRegisteredComponents();
        expect(components.size).toBe(2);
      });
    });

    describe('clearRegistry', () => {
      it('should clear all registered components', () => {
        registerComponent('Button', ['primary']);
        clearRegistry();
        expect(getRegisteredComponents().size).toBe(0);
      });
    });
  });

  describe('Image Comparison', () => {
    describe('compareImages', () => {
      it('should detect identical images', () => {
        const imageA = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]); // 2 pixels
        const imageB = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);

        const result = compareImages(imageA, imageB);
        expect(result.passed).toBe(true);
        expect(result.diffPixels).toBe(0);
      });

      it('should detect different images', () => {
        const imageA = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
        const imageB = new Uint8Array([0, 255, 0, 255, 255, 0, 0, 255]);

        const result = compareImages(imageA, imageB);
        expect(result.diffPixels).toBeGreaterThan(0);
      });

      it('should handle different sized images', () => {
        const imageA = new Uint8Array([255, 0, 0, 255]);
        const imageB = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);

        const result = compareImages(imageA, imageB);
        expect(result.passed).toBe(false);
        expect(result.error).toBe('Image dimensions do not match');
      });

      it('should use custom threshold', () => {
        const imageA = new Uint8Array([255, 0, 0, 255]);
        const imageB = new Uint8Array([250, 0, 0, 255]); // Small color diff

        const strictResult = compareImages(imageA, imageB, STRICT_THRESHOLD);
        const relaxedResult = compareImages(imageA, imageB, RELAXED_THRESHOLD);

        // Strict should fail, relaxed should pass (for small diff)
        expect(relaxedResult.diffPixels).toBeLessThanOrEqual(strictResult.diffPixels);
      });
    });

    describe('compareSnapshots', () => {
      it('should compare component snapshots', async () => {
        const result = await compareSnapshots('Button', 'primary', 'desktop-md');
        expect(result).toBeDefined();
        expect(typeof result.passed).toBe('boolean');
      });

      it('should use correct file paths', async () => {
        const result = await compareSnapshots('Button', 'primary', 'desktop-md');
        expect(result.baselinePath).toContain('button-primary-desktop-md');
      });
    });
  });

  describe('Screenshot Capture', () => {
    describe('captureScreenshot', () => {
      it('should return image data', async () => {
        const data = await captureScreenshot('http://localhost:3000');
        expect(data).toBeInstanceOf(Uint8Array);
        expect(data.length).toBeGreaterThan(0);
      });

      it('should respect viewport option', async () => {
        const viewport = getViewport('mobile-sm');
        const data = await captureScreenshot('http://localhost:3000', { viewport });
        expect(data).toBeDefined();
      });

      it('should wait for delay', async () => {
        const start = performance.now();
        await captureScreenshot('http://localhost:3000', { delay: 100 });
        const elapsed = performance.now() - start;
        expect(elapsed).toBeGreaterThanOrEqual(100);
      });
    });

    describe('captureElement', () => {
      it('should return null for null element', async () => {
        const result = await captureElement(null);
        expect(result).toBeNull();
      });

      it('should capture element', async () => {
        const element = document.createElement('div');
        const result = await captureElement(element);
        expect(result).toBeInstanceOf(Uint8Array);
      });
    });
  });

  describe('Test Runner', () => {
    beforeEach(() => {
      registerComponents({
        Button: ['primary', 'secondary'],
        Input: ['text'],
      });
    });

    describe('runVisualTests', () => {
      it('should run all registered tests', async () => {
        const summary = await runVisualTests();
        expect(summary.total).toBeGreaterThan(0);
      });

      it('should filter by components', async () => {
        const summary = await runVisualTests({
          components: ['Button'],
        });
        // Button has 2 variants, tested on multiple viewports
        expect(summary.total).toBeGreaterThan(0);
      });

      it('should filter by viewports', async () => {
        const summary = await runVisualTests({
          viewports: ['desktop-md'],
        });
        // Each component variant tested once per viewport
        expect(summary.total).toBe(3); // 2 Button variants + 1 Input variant
      });

      it('should return duration', async () => {
        const summary = await runVisualTests();
        expect(summary.duration).toBeGreaterThan(0);
      });

      it('should include results array', async () => {
        const summary = await runVisualTests();
        expect(Array.isArray(summary.results)).toBe(true);
      });
    });

    describe('runComponentTests', () => {
      it('should run tests for specific component', async () => {
        const summary = await runComponentTests('Button');
        expect(summary.results.every(r => r.component === 'Button')).toBe(true);
      });
    });

    describe('runViewportTests', () => {
      it('should run tests for specific viewports', async () => {
        const summary = await runViewportTests(['mobile-sm', 'desktop-lg']);
        const viewports = [...new Set(summary.results.map(r => r.viewport))];
        expect(viewports.length).toBe(2);
      });
    });
  });

  describe('Component Tester', () => {
    describe('createComponentTester', () => {
      it('should create tester for component', () => {
        const tester = createComponentTester('Button');
        expect(tester).toBeDefined();
        expect(typeof tester.registerVariants).toBe('function');
        expect(typeof tester.runTests).toBe('function');
        expect(typeof tester.compareVariant).toBe('function');
      });

      it('should register variants', () => {
        const tester = createComponentTester('Card');
        tester.registerVariants(['default', 'elevated', 'outlined']);
        const components = getRegisteredComponents();
        expect(components.get('Card')?.size).toBe(3);
      });

      it('should run tests', async () => {
        const tester = createComponentTester('Modal');
        tester.registerVariants(['open', 'closed']);
        const summary = await tester.runTests();
        expect(summary.total).toBeGreaterThan(0);
      });

      it('should compare specific variant', async () => {
        const tester = createComponentTester('Tooltip');
        tester.registerVariants(['top', 'bottom']);
        const result = await tester.compareVariant('top');
        expect(result).toBeDefined();
      });
    });
  });

  describe('Formatting', () => {
    describe('formatComparisonResult', () => {
      it('should format passing result', () => {
        const result = {
          passed: true,
          diffPercentage: 0.5,
          diffPixels: 100,
          totalPixels: 20000,
          baselinePath: '',
          actualPath: '',
        };
        const formatted = formatComparisonResult(result);
        expect(formatted).toContain('✓');
        expect(formatted).toContain('Passed');
      });

      it('should format failing result', () => {
        const result = {
          passed: false,
          diffPercentage: 10.5,
          diffPixels: 2000,
          totalPixels: 20000,
          baselinePath: '',
          actualPath: '',
        };
        const formatted = formatComparisonResult(result);
        expect(formatted).toContain('✗');
        expect(formatted).toContain('Failed');
      });
    });

    describe('formatTestSummary', () => {
      it('should format summary', () => {
        const summary = {
          total: 10,
          passed: 8,
          failed: 2,
          skipped: 0,
          updated: 0,
          results: [],
          duration: 5000,
        };
        const formatted = formatTestSummary(summary);
        expect(formatted).toContain('Total:   10');
        expect(formatted).toContain('Passed:  8');
        expect(formatted).toContain('Failed:  2');
      });
    });

    describe('generateHtmlReport', () => {
      it('should generate HTML report', () => {
        const summary = {
          total: 5,
          passed: 4,
          failed: 1,
          skipped: 0,
          updated: 0,
          results: [
            {
              component: 'Button',
              variant: 'primary',
              viewport: 'desktop-md',
              comparison: {
                passed: true,
                diffPercentage: 0,
                diffPixels: 0,
                totalPixels: 1000,
                baselinePath: '',
                actualPath: '',
              },
              duration: 100,
            },
          ],
          duration: 5000,
        };
        const html = generateHtmlReport(summary);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('Visual Regression Report');
        expect(html).toContain('Button');
      });
    });
  });
});
