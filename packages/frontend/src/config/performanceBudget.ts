/**
 * Performance Budget Configuration
 *
 * Defines strict performance budgets for the x402Arcade application.
 * These budgets are used for CI checks, performance monitoring, and
 * alerting when thresholds are exceeded.
 *
 * @module config/performanceBudget
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Bundle size budget configuration
 */
export interface BundleSizeBudget {
  /** Maximum total JS bundle size (gzipped) in KB */
  totalJs: number;
  /** Maximum total CSS size (gzipped) in KB */
  totalCss: number;
  /** Maximum size for any single JS chunk in KB */
  maxChunkSize: number;
  /** Maximum initial bundle size (JS + CSS) in KB */
  initialBundle: number;
  /** Per-route/feature budgets */
  routes: Record<string, number>;
  /** Warning threshold as percentage of budget (e.g., 0.8 = 80%) */
  warningThreshold: number;
}

/**
 * Load time budget configuration (in milliseconds)
 */
export interface LoadTimeBudget {
  /** Time to First Byte target */
  ttfb: number;
  /** First Contentful Paint target */
  fcp: number;
  /** Largest Contentful Paint target */
  lcp: number;
  /** Time to Interactive target */
  tti: number;
  /** Total Blocking Time target */
  tbt: number;
  /** Speed Index target */
  speedIndex: number;
  /** Full page load target */
  fullLoad: number;
}

/**
 * Core Web Vitals targets
 */
export interface CoreWebVitalsBudget {
  /** Largest Contentful Paint (ms) - Good < 2500, Needs Improvement < 4000 */
  lcp: { good: number; needsImprovement: number };
  /** First Input Delay (ms) - Good < 100, Needs Improvement < 300 */
  fid: { good: number; needsImprovement: number };
  /** Cumulative Layout Shift - Good < 0.1, Needs Improvement < 0.25 */
  cls: { good: number; needsImprovement: number };
  /** Interaction to Next Paint (ms) - Good < 200, Needs Improvement < 500 */
  inp: { good: number; needsImprovement: number };
  /** Time to First Byte (ms) - Good < 800, Needs Improvement < 1800 */
  ttfb: { good: number; needsImprovement: number };
}

/**
 * Game-specific performance targets
 */
export interface GamePerformanceBudget {
  /** Target frames per second */
  targetFps: number;
  /** Minimum acceptable FPS before quality reduction */
  minAcceptableFps: number;
  /** Maximum frame time in ms (1000 / targetFps) */
  maxFrameTime: number;
  /** Maximum memory usage in MB */
  maxMemoryUsage: number;
  /** Maximum WebGL draw calls per frame */
  maxDrawCalls: number;
  /** Maximum triangles per frame */
  maxTriangles: number;
  /** Maximum texture memory in MB */
  maxTextureMemory: number;
  /** Maximum particle count */
  maxParticles: number;
}

/**
 * Complete performance budget configuration
 */
export interface PerformanceBudgetConfig {
  bundleSize: BundleSizeBudget;
  loadTime: LoadTimeBudget;
  coreWebVitals: CoreWebVitalsBudget;
  gamePerformance: GamePerformanceBudget;
}

// ============================================================================
// Performance Budget Configuration
// ============================================================================

/**
 * Bundle size budgets (in KB, gzipped)
 */
export const BUNDLE_SIZE_BUDGET: BundleSizeBudget = {
  // Total JS should be under 500KB gzipped for good performance
  totalJs: 500,
  // CSS should be minimal
  totalCss: 50,
  // Individual chunks should be under 200KB for good caching
  maxChunkSize: 200,
  // Initial bundle (critical path) should be under 150KB
  initialBundle: 150,
  // Per-route budgets
  routes: {
    // Main pages - should be lean
    '/': 100,
    '/arcade': 150,
    '/play': 200,
    '/leaderboard': 80,
    '/profile': 100,
    // Games are heavier due to 3D assets
    '/play/snake': 250,
    '/play/tetris': 250,
    '/play/pong': 250,
    '/play/breakout': 250,
    '/play/space-invaders': 250,
  },
  warningThreshold: 0.8,
};

/**
 * Load time budgets (in milliseconds)
 * Based on industry best practices and Google's recommendations
 */
export const LOAD_TIME_BUDGET: LoadTimeBudget = {
  // TTFB should be fast - server response time
  ttfb: 200,
  // FCP - when first content appears
  fcp: 1000,
  // LCP - main content loaded
  lcp: 2500,
  // TTI - page fully interactive
  tti: 3500,
  // TBT - total time main thread was blocked
  tbt: 200,
  // Speed Index - visual progress
  speedIndex: 3000,
  // Full page load including lazy content
  fullLoad: 5000,
};

/**
 * Core Web Vitals targets
 * Based on Google's thresholds for good/needs improvement/poor
 */
export const CORE_WEB_VITALS_BUDGET: CoreWebVitalsBudget = {
  lcp: {
    good: 2500,
    needsImprovement: 4000,
  },
  fid: {
    good: 100,
    needsImprovement: 300,
  },
  cls: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  inp: {
    good: 200,
    needsImprovement: 500,
  },
  ttfb: {
    good: 800,
    needsImprovement: 1800,
  },
};

/**
 * Game-specific performance targets
 * Optimized for smooth 60fps gameplay
 */
export const GAME_PERFORMANCE_BUDGET: GamePerformanceBudget = {
  // Target 60fps for smooth gameplay
  targetFps: 60,
  // Quality reduction triggers at 45fps
  minAcceptableFps: 45,
  // 16.67ms frame budget
  maxFrameTime: 16.67,
  // Memory budget - stay under 256MB for mobile compat
  maxMemoryUsage: 256,
  // Draw call budget - too many = CPU bottleneck
  maxDrawCalls: 100,
  // Triangle budget - balance detail with performance
  maxTriangles: 100000,
  // Texture memory - affects VRAM usage
  maxTextureMemory: 128,
  // Particle limit - expensive to update
  maxParticles: 5000,
};

/**
 * Complete performance budget
 */
export const PERFORMANCE_BUDGET: PerformanceBudgetConfig = {
  bundleSize: BUNDLE_SIZE_BUDGET,
  loadTime: LOAD_TIME_BUDGET,
  coreWebVitals: CORE_WEB_VITALS_BUDGET,
  gamePerformance: GAME_PERFORMANCE_BUDGET,
};

// ============================================================================
// Lighthouse CI Budget Configuration
// ============================================================================

/**
 * Lighthouse CI budget configuration
 * Compatible with lighthouse-ci budgets format
 */
export const LIGHTHOUSE_CI_BUDGETS = [
  {
    path: '/*',
    resourceSizes: [
      { resourceType: 'script', budget: BUNDLE_SIZE_BUDGET.totalJs },
      { resourceType: 'stylesheet', budget: BUNDLE_SIZE_BUDGET.totalCss },
      { resourceType: 'total', budget: 1000 }, // 1MB total
      { resourceType: 'third-party', budget: 100 },
    ],
    resourceCounts: [
      { resourceType: 'script', budget: 20 },
      { resourceType: 'stylesheet', budget: 5 },
      { resourceType: 'third-party', budget: 10 },
    ],
    timings: [
      { metric: 'first-contentful-paint', budget: LOAD_TIME_BUDGET.fcp },
      { metric: 'largest-contentful-paint', budget: LOAD_TIME_BUDGET.lcp },
      { metric: 'interactive', budget: LOAD_TIME_BUDGET.tti },
      { metric: 'total-blocking-time', budget: LOAD_TIME_BUDGET.tbt },
      { metric: 'speed-index', budget: LOAD_TIME_BUDGET.speedIndex },
    ],
  },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a metric is within budget
 */
export function isWithinBudget(metric: keyof LoadTimeBudget, value: number): boolean {
  return value <= LOAD_TIME_BUDGET[metric];
}

/**
 * Check Core Web Vital rating
 */
export function getCoreWebVitalRating(
  metric: keyof CoreWebVitalsBudget,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = CORE_WEB_VITALS_BUDGET[metric];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Calculate budget usage percentage
 */
export function calculateBudgetUsage(
  metric: keyof LoadTimeBudget | keyof BundleSizeBudget,
  value: number,
  budgetType: 'loadTime' | 'bundleSize' = 'loadTime'
): number {
  const budget =
    budgetType === 'loadTime'
      ? LOAD_TIME_BUDGET[metric as keyof LoadTimeBudget]
      : BUNDLE_SIZE_BUDGET[metric as keyof BundleSizeBudget];

  if (typeof budget !== 'number') return 0;
  return (value / budget) * 100;
}

/**
 * Get performance grade based on all metrics
 */
export function getPerformanceGrade(metrics: {
  lcp?: number;
  fid?: number;
  cls?: number;
  inp?: number;
  ttfb?: number;
}): 'A' | 'B' | 'C' | 'D' | 'F' {
  let goodCount = 0;
  let totalCount = 0;

  const metricKeys = ['lcp', 'fid', 'cls', 'inp', 'ttfb'] as const;

  for (const key of metricKeys) {
    const value = metrics[key];
    if (value !== undefined) {
      totalCount++;
      if (getCoreWebVitalRating(key, value) === 'good') {
        goodCount++;
      }
    }
  }

  if (totalCount === 0) return 'F';

  const percentage = (goodCount / totalCount) * 100;

  if (percentage >= 90) return 'A';
  if (percentage >= 75) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 25) return 'D';
  return 'F';
}

/**
 * Generate a performance report
 */
export function generatePerformanceReport(metrics: {
  bundleSize?: { js: number; css: number };
  loadTime?: Partial<LoadTimeBudget>;
  coreWebVitals?: Partial<Record<keyof CoreWebVitalsBudget, number>>;
  gamePerformance?: Partial<GamePerformanceBudget>;
}): {
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check bundle size
  if (metrics.bundleSize) {
    if (metrics.bundleSize.js > BUNDLE_SIZE_BUDGET.totalJs) {
      issues.push(
        `JS bundle size (${metrics.bundleSize.js}KB) exceeds budget (${BUNDLE_SIZE_BUDGET.totalJs}KB)`
      );
      recommendations.push(
        'Consider code splitting, removing unused dependencies, or using dynamic imports'
      );
    }
    if (metrics.bundleSize.css > BUNDLE_SIZE_BUDGET.totalCss) {
      issues.push(
        `CSS size (${metrics.bundleSize.css}KB) exceeds budget (${BUNDLE_SIZE_BUDGET.totalCss}KB)`
      );
      recommendations.push('Consider removing unused CSS or using CSS-in-JS with tree shaking');
    }
  }

  // Check load times
  if (metrics.loadTime) {
    for (const [key, value] of Object.entries(metrics.loadTime)) {
      const budget = LOAD_TIME_BUDGET[key as keyof LoadTimeBudget];
      if (value !== undefined && value > budget) {
        issues.push(`${key} (${value}ms) exceeds budget (${budget}ms)`);
      }
    }
  }

  // Check Core Web Vitals
  if (metrics.coreWebVitals) {
    for (const [key, value] of Object.entries(metrics.coreWebVitals)) {
      if (value !== undefined) {
        const rating = getCoreWebVitalRating(key as keyof CoreWebVitalsBudget, value);
        if (rating === 'poor') {
          issues.push(`${key} is rated as poor (${value})`);
          switch (key) {
            case 'lcp':
              recommendations.push(
                'Optimize largest content: use lazy loading, optimize images, reduce server response time'
              );
              break;
            case 'fid':
            case 'inp':
              recommendations.push(
                'Reduce JavaScript execution time, break up long tasks, use web workers'
              );
              break;
            case 'cls':
              recommendations.push(
                'Add size attributes to images/videos, avoid inserting content above existing content'
              );
              break;
            case 'ttfb':
              recommendations.push('Optimize server response time, use CDN, implement caching');
              break;
          }
        }
      }
    }
  }

  // Check game performance
  if (metrics.gamePerformance) {
    const gp = metrics.gamePerformance;
    if (gp.targetFps && gp.targetFps < GAME_PERFORMANCE_BUDGET.minAcceptableFps) {
      issues.push(
        `FPS (${gp.targetFps}) below minimum acceptable (${GAME_PERFORMANCE_BUDGET.minAcceptableFps})`
      );
      recommendations.push('Reduce quality settings, optimize render loop, reduce draw calls');
    }
    if (gp.maxDrawCalls && gp.maxDrawCalls > GAME_PERFORMANCE_BUDGET.maxDrawCalls) {
      issues.push(
        `Draw calls (${gp.maxDrawCalls}) exceed budget (${GAME_PERFORMANCE_BUDGET.maxDrawCalls})`
      );
      recommendations.push('Use instanced rendering, batch geometries, reduce unique materials');
    }
  }

  // Calculate grade
  const grade = getPerformanceGrade(metrics.coreWebVitals || {});

  return { grade, issues, recommendations };
}

// ============================================================================
// Exports
// ============================================================================

export default PERFORMANCE_BUDGET;
