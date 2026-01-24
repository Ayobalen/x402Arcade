/**
 * Visual Regression Testing Configuration
 *
 * This module provides configuration for visual regression testing,
 * including snapshot comparison settings, thresholds, and paths.
 *
 * @module visual/config
 */

/**
 * Visual regression diff threshold configuration
 * Lower values = stricter comparison (more sensitive to changes)
 */
export interface DiffThresholdConfig {
  /** Pixel difference threshold (0-1, percentage of different pixels allowed) */
  pixelThreshold: number;
  /** Color distance threshold for individual pixel comparison (0-255) */
  colorThreshold: number;
  /** Fail test if difference exceeds this percentage */
  failThreshold: number;
  /** Allow anti-aliasing differences */
  allowAntialiasing: boolean;
}

/**
 * Visual test viewport configuration
 */
export interface ViewportConfig {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile?: boolean;
  hasTouch?: boolean;
}

/**
 * Full visual regression configuration
 */
export interface VisualRegressionConfig {
  /** Directory for baseline images */
  baselineDir: string;
  /** Directory for actual test images */
  actualDir: string;
  /** Directory for diff images */
  diffDir: string;
  /** Default diff thresholds */
  defaultThreshold: DiffThresholdConfig;
  /** Strict diff thresholds (for critical UI elements) */
  strictThreshold: DiffThresholdConfig;
  /** Relaxed diff thresholds (for dynamic content) */
  relaxedThreshold: DiffThresholdConfig;
  /** Standard viewports for testing */
  viewports: ViewportConfig[];
  /** File extensions for snapshots */
  snapshotExtension: string;
  /** Update snapshots mode */
  updateSnapshots: boolean;
}

/**
 * Default diff threshold - balanced between strictness and noise tolerance
 */
export const DEFAULT_THRESHOLD: DiffThresholdConfig = {
  pixelThreshold: 0.01, // 1% pixel difference allowed
  colorThreshold: 10,   // Small color variations allowed (anti-aliasing, subpixel rendering)
  failThreshold: 0.05,  // Fail if >5% of pixels differ
  allowAntialiasing: true,
};

/**
 * Strict threshold - for critical UI elements (buttons, forms, navigation)
 */
export const STRICT_THRESHOLD: DiffThresholdConfig = {
  pixelThreshold: 0.001, // 0.1% pixel difference allowed
  colorThreshold: 5,     // Minimal color variation
  failThreshold: 0.01,   // Fail if >1% of pixels differ
  allowAntialiasing: true,
};

/**
 * Relaxed threshold - for dynamic content (animations, gradients, shadows)
 */
export const RELAXED_THRESHOLD: DiffThresholdConfig = {
  pixelThreshold: 0.05, // 5% pixel difference allowed
  colorThreshold: 20,   // Allow more color variation
  failThreshold: 0.15,  // Fail if >15% of pixels differ
  allowAntialiasing: true,
};

/**
 * Standard viewports for visual testing
 */
export const STANDARD_VIEWPORTS: ViewportConfig[] = [
  // Mobile viewports
  {
    name: 'mobile-sm',
    width: 320,
    height: 568,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  {
    name: 'mobile-lg',
    width: 414,
    height: 896,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  // Tablet viewport
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  },
  // Desktop viewports
  {
    name: 'desktop-sm',
    width: 1024,
    height: 768,
    deviceScaleFactor: 1,
  },
  {
    name: 'desktop-md',
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
  },
  {
    name: 'desktop-lg',
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
  },
  {
    name: 'desktop-xl',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
];

/**
 * Default visual regression configuration
 */
export const DEFAULT_CONFIG: VisualRegressionConfig = {
  baselineDir: '__tests__/visual/__image_snapshots__',
  actualDir: '__tests__/visual/__actual_snapshots__',
  diffDir: '__tests__/visual/__diff_snapshots__',
  defaultThreshold: DEFAULT_THRESHOLD,
  strictThreshold: STRICT_THRESHOLD,
  relaxedThreshold: RELAXED_THRESHOLD,
  viewports: STANDARD_VIEWPORTS,
  snapshotExtension: '.png',
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true',
};

/**
 * Get viewport by name
 */
export function getViewport(name: string): ViewportConfig | undefined {
  return STANDARD_VIEWPORTS.find(v => v.name === name);
}

/**
 * Get threshold config by name
 */
export function getThreshold(
  type: 'default' | 'strict' | 'relaxed' = 'default'
): DiffThresholdConfig {
  switch (type) {
    case 'strict':
      return STRICT_THRESHOLD;
    case 'relaxed':
      return RELAXED_THRESHOLD;
    default:
      return DEFAULT_THRESHOLD;
  }
}

/**
 * Generate snapshot filename
 */
export function getSnapshotFilename(
  componentName: string,
  variant: string,
  viewport: string,
  extension: string = '.png'
): string {
  const sanitized = (str: string) => str.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  return `${sanitized(componentName)}-${sanitized(variant)}-${sanitized(viewport)}${extension}`;
}

/**
 * Parse environment configuration overrides
 */
export function parseEnvConfig(): Partial<VisualRegressionConfig> {
  const config: Partial<VisualRegressionConfig> = {};

  if (process.env.VISUAL_BASELINE_DIR) {
    config.baselineDir = process.env.VISUAL_BASELINE_DIR;
  }

  if (process.env.VISUAL_UPDATE_SNAPSHOTS) {
    config.updateSnapshots = process.env.VISUAL_UPDATE_SNAPSHOTS === 'true';
  }

  return config;
}

/**
 * Merge configurations
 */
export function mergeConfig(
  base: VisualRegressionConfig,
  overrides: Partial<VisualRegressionConfig>
): VisualRegressionConfig {
  return {
    ...base,
    ...overrides,
    defaultThreshold: {
      ...base.defaultThreshold,
      ...overrides.defaultThreshold,
    },
    strictThreshold: {
      ...base.strictThreshold,
      ...overrides.strictThreshold,
    },
    relaxedThreshold: {
      ...base.relaxedThreshold,
      ...overrides.relaxedThreshold,
    },
    viewports: overrides.viewports ?? base.viewports,
  };
}
