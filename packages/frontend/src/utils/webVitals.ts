/* eslint-disable no-console */
/**
 * Web Vitals Performance Monitoring
 *
 * Tracks Core Web Vitals and custom performance metrics for the application.
 * Integrates with the web-vitals library to measure real user experience.
 *
 * Core Web Vitals tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - FID (First Input Delay) - Interactivity
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - TTFB (Time to First Byte) - Server response time
 * - FCP (First Contentful Paint) - Initial render time
 * - INP (Interaction to Next Paint) - Overall responsiveness
 *
 * Note: console.* is intentionally used for debug logging in this module.
 *
 * @example
 * ```tsx
 * // Initialize in App.tsx
 * import { initWebVitals } from '@/utils/webVitals';
 *
 * function App() {
 *   useEffect(() => {
 *     initWebVitals({
 *       onMetric: (metric) => {
 *         console.log(metric.name, metric.value);
 *         // Send to analytics
 *       },
 *       debug: process.env.NODE_ENV === 'development',
 *     });
 *   }, []);
 *
 *   return <RouterProvider router={router} />;
 * }
 * ```
 *
 * @module utils/webVitals
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Performance metric data
 */
export interface PerformanceMetric {
  /** Metric name (LCP, FID, CLS, TTFB, FCP, INP) */
  name: string;
  /** Metric value */
  value: number;
  /** Rating: 'good', 'needs-improvement', 'poor' */
  rating: 'good' | 'needs-improvement' | 'poor';
  /** Metric ID for deduplication */
  id: string;
  /** Navigation type (navigate, reload, back-forward, prerender) */
  navigationType?: string;
  /** Delta from previous value */
  delta: number;
  /** Attribution data for debugging */
  attribution?: Record<string, unknown>;
  /** Timestamp when metric was recorded */
  timestamp: number;
}

/**
 * Web Vitals configuration
 */
export interface WebVitalsConfig {
  /** Callback for each metric */
  onMetric?: (metric: PerformanceMetric) => void;
  /** Enable debug logging */
  debug?: boolean;
  /** Include all attributions (increases payload size) */
  reportAllChanges?: boolean;
  /** Custom thresholds for ratings */
  thresholds?: Partial<VitalThresholds>;
  /** Analytics endpoint URL */
  analyticsEndpoint?: string;
  /** Batch metrics before sending */
  batchMetrics?: boolean;
  /** Batch size before flush */
  batchSize?: number;
  /** Batch flush interval in ms */
  flushInterval?: number;
}

/**
 * Thresholds for each vital (good/needs-improvement boundary)
 */
export interface VitalThresholds {
  LCP: [number, number]; // [good, poor] boundaries
  FID: [number, number];
  CLS: [number, number];
  TTFB: [number, number];
  FCP: [number, number];
  INP: [number, number];
}

/**
 * Performance summary for display
 */
export interface PerformanceSummary {
  lcp: PerformanceMetric | null;
  fid: PerformanceMetric | null;
  cls: PerformanceMetric | null;
  ttfb: PerformanceMetric | null;
  fcp: PerformanceMetric | null;
  inp: PerformanceMetric | null;
  customMetrics: Record<string, PerformanceMetric>;
  overallRating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Custom metric for game-specific measurements
 */
export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Default thresholds based on Google's recommendations
 * Format: [good threshold, poor threshold]
 */
export const DEFAULT_THRESHOLDS: VitalThresholds = {
  LCP: [2500, 4000], // < 2.5s good, > 4s poor
  FID: [100, 300], // < 100ms good, > 300ms poor
  CLS: [0.1, 0.25], // < 0.1 good, > 0.25 poor
  TTFB: [800, 1800], // < 800ms good, > 1800ms poor
  FCP: [1800, 3000], // < 1.8s good, > 3s poor
  INP: [200, 500], // < 200ms good, > 500ms poor
};

/**
 * Vital names for display
 */
export const VITAL_NAMES: Record<string, string> = {
  LCP: 'Largest Contentful Paint',
  FID: 'First Input Delay',
  CLS: 'Cumulative Layout Shift',
  TTFB: 'Time to First Byte',
  FCP: 'First Contentful Paint',
  INP: 'Interaction to Next Paint',
};

/**
 * Units for each metric
 */
export const VITAL_UNITS: Record<string, string> = {
  LCP: 'ms',
  FID: 'ms',
  CLS: '',
  TTFB: 'ms',
  FCP: 'ms',
  INP: 'ms',
};

// ============================================================================
// State
// ============================================================================

/** Current configuration */
let config: WebVitalsConfig = {};

/** Collected metrics */
const metrics: Map<string, PerformanceMetric> = new Map();

/** Custom metrics */
const customMetrics: Map<string, CustomMetric> = new Map();

/** Metric batch for sending */
let metricBatch: PerformanceMetric[] = [];

/** Flush timer */
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Observers for cleanup */
const observers: PerformanceObserver[] = [];

/** Whether vitals have been initialized */
let initialized = false;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get rating based on thresholds
 */
function getRating(
  name: string,
  value: number,
  thresholds: VitalThresholds
): 'good' | 'needs-improvement' | 'poor' {
  const [good, poor] = thresholds[name as keyof VitalThresholds] || [Infinity, Infinity];

  if (value <= good) return 'good';
  if (value > poor) return 'poor';
  return 'needs-improvement';
}

/**
 * Create a metric object
 */
function createMetric(
  name: string,
  value: number,
  delta: number,
  id: string,
  navigationType?: string,
  attribution?: Record<string, unknown>
): PerformanceMetric {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...config.thresholds };

  return {
    name,
    value,
    rating: getRating(name, value, thresholds),
    id,
    navigationType,
    delta,
    attribution,
    timestamp: Date.now(),
  };
}

/**
 * Handle a new metric
 */
function handleMetric(metric: PerformanceMetric): void {
  // Store metric
  metrics.set(metric.name, metric);

  // Debug logging
  if (config.debug) {
    const unit = VITAL_UNITS[metric.name] || '';
    const displayValue = metric.name === 'CLS' ? metric.value.toFixed(3) : Math.round(metric.value);
    console.log(`[WebVitals] ${metric.name}: ${displayValue}${unit} (${metric.rating})`);
  }

  // Callback
  config.onMetric?.(metric);

  // Batching
  if (config.batchMetrics) {
    metricBatch.push(metric);
    if (metricBatch.length >= (config.batchSize || 10)) {
      flushMetrics();
    } else if (!flushTimer) {
      flushTimer = setTimeout(flushMetrics, config.flushInterval || 5000);
    }
  } else if (config.analyticsEndpoint) {
    sendMetric(metric);
  }
}

/**
 * Flush batched metrics
 */
function flushMetrics(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (metricBatch.length === 0) return;

  if (config.analyticsEndpoint) {
    sendMetrics(metricBatch);
  }

  metricBatch = [];
}

/**
 * Send a single metric to analytics
 */
function sendMetric(metric: PerformanceMetric): void {
  if (!config.analyticsEndpoint) return;

  // Use sendBeacon for reliability
  const body = JSON.stringify({ metrics: [metric] });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(config.analyticsEndpoint, body);
  } else {
    fetch(config.analyticsEndpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Send multiple metrics to analytics
 */
function sendMetrics(metricsToSend: PerformanceMetric[]): void {
  if (!config.analyticsEndpoint || metricsToSend.length === 0) return;

  const body = JSON.stringify({ metrics: metricsToSend });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(config.analyticsEndpoint, body);
  } else {
    fetch(config.analyticsEndpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
}

/**
 * Generate unique ID for metric
 */
function generateId(): string {
  return `v1-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Core Web Vitals Observers
// ============================================================================

/**
 * Observe Largest Contentful Paint (LCP)
 */
function observeLCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        startTime: number;
        element?: Element;
      };

      if (lastEntry) {
        const metric = createMetric(
          'LCP',
          lastEntry.startTime,
          lastEntry.startTime,
          generateId(),
          undefined,
          { element: lastEntry.element?.tagName }
        );
        handleMetric(metric);
      }
    });

    observer.observe({ type: 'largest-contentful-paint', buffered: true });
    observers.push(observer);
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] LCP not supported');
    }
  }
}

/**
 * Observe First Input Delay (FID)
 */
function observeFID(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const firstEntry = entries[0] as PerformanceEventTiming;

      if (firstEntry) {
        const metric = createMetric(
          'FID',
          firstEntry.processingStart - firstEntry.startTime,
          firstEntry.processingStart - firstEntry.startTime,
          generateId(),
          undefined,
          { eventType: firstEntry.name }
        );
        handleMetric(metric);
      }
    });

    observer.observe({ type: 'first-input', buffered: true });
    observers.push(observer);
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] FID not supported');
    }
  }
}

/**
 * Observe Cumulative Layout Shift (CLS)
 */
function observeCLS(): void {
  try {
    let clsValue = 0;
    const clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        // Only count shifts without recent input
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }

      const metric = createMetric('CLS', clsValue, clsValue, generateId(), undefined, {
        entries: clsEntries.length,
      });
      handleMetric(metric);
    });

    observer.observe({ type: 'layout-shift', buffered: true });
    observers.push(observer);
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] CLS not supported');
    }
  }
}

/**
 * Observe First Contentful Paint (FCP)
 */
function observeFCP(): void {
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');

      if (fcpEntry) {
        const metric = createMetric('FCP', fcpEntry.startTime, fcpEntry.startTime, generateId());
        handleMetric(metric);
      }
    });

    observer.observe({ type: 'paint', buffered: true });
    observers.push(observer);
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] FCP not supported');
    }
  }
}

/**
 * Observe Time to First Byte (TTFB)
 */
function observeTTFB(): void {
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navEntry) {
      const ttfb = navEntry.responseStart;
      const metric = createMetric('TTFB', ttfb, ttfb, generateId(), navEntry.type, {
        protocol: navEntry.nextHopProtocol,
        transferSize: navEntry.transferSize,
      });
      handleMetric(metric);
    }
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] TTFB not supported');
    }
  }
}

/**
 * Observe Interaction to Next Paint (INP)
 */
function observeINP(): void {
  try {
    let maxINP = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEventTiming[]) {
        const duration = entry.duration;
        if (duration > maxINP) {
          maxINP = duration;
          const metric = createMetric('INP', duration, duration, generateId(), undefined, {
            eventType: entry.name,
          });
          handleMetric(metric);
        }
      }
    });

    observer.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
    observers.push(observer);
  } catch {
    if (config.debug) {
      console.warn('[WebVitals] INP not supported');
    }
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Initialize Web Vitals monitoring
 */
export function initWebVitals(options: WebVitalsConfig = {}): void {
  if (initialized) {
    if (config.debug) {
      console.warn('[WebVitals] Already initialized');
    }
    return;
  }

  config = options;
  initialized = true;

  if (config.debug) {
    console.log('[WebVitals] Initializing...');
  }

  // Start observers
  observeLCP();
  observeFID();
  observeCLS();
  observeFCP();
  observeTTFB();
  observeINP();

  // Flush on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushMetrics();
      }
    });

    window.addEventListener('pagehide', () => {
      flushMetrics();
    });
  }

  if (config.debug) {
    console.log('[WebVitals] Initialized');
  }
}

/**
 * Stop all observers and clean up
 */
export function stopWebVitals(): void {
  observers.forEach((observer) => observer.disconnect());
  observers.length = 0;
  flushMetrics();
  initialized = false;
}

/**
 * Get current metric values
 */
export function getMetrics(): Map<string, PerformanceMetric> {
  return new Map(metrics);
}

/**
 * Get a specific metric
 */
export function getMetric(name: string): PerformanceMetric | undefined {
  return metrics.get(name);
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): PerformanceSummary {
  const lcp = metrics.get('LCP') || null;
  const fid = metrics.get('FID') || null;
  const cls = metrics.get('CLS') || null;
  const ttfb = metrics.get('TTFB') || null;
  const fcp = metrics.get('FCP') || null;
  const inp = metrics.get('INP') || null;

  // Determine overall rating (worst of all metrics)
  const ratings = [lcp, fid, cls, ttfb, fcp, inp]
    .filter((m): m is PerformanceMetric => m !== null)
    .map((m) => m.rating);

  let overallRating: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (ratings.includes('poor')) {
    overallRating = 'poor';
  } else if (ratings.includes('needs-improvement')) {
    overallRating = 'needs-improvement';
  }

  return {
    lcp,
    fid,
    cls,
    ttfb,
    fcp,
    inp,
    customMetrics: Object.fromEntries(
      Array.from(customMetrics.entries()).map(([k, v]) => [
        k,
        createMetric(v.name, v.value, v.value, generateId()),
      ])
    ),
    overallRating,
    timestamp: Date.now(),
  };
}

/**
 * Record a custom metric
 */
export function recordCustomMetric(name: string, value: number): void {
  const metric: CustomMetric = {
    name,
    value,
    timestamp: Date.now(),
  };

  customMetrics.set(name, metric);

  if (config.debug) {
    console.log(`[WebVitals] Custom: ${name} = ${value}`);
  }

  // Also send through normal metric pipeline
  const perfMetric = createMetric(name, value, value, generateId());
  handleMetric(perfMetric);
}

/**
 * Measure a function's execution time
 */
export function measureFunction<T>(name: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  recordCustomMetric(name, duration);
  return result;
}

/**
 * Measure an async function's execution time
 */
export async function measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  recordCustomMetric(name, duration);
  return result;
}

/**
 * Create a performance mark for user timing
 */
export function mark(name: string): void {
  try {
    performance.mark(name);
  } catch {
    // Ignore if not supported
  }
}

/**
 * Create a performance measure between two marks
 */
export function measure(name: string, startMark: string, endMark?: string): number | null {
  try {
    const measureName = `measure:${name}`;
    performance.measure(measureName, startMark, endMark);
    const entries = performance.getEntriesByName(measureName);
    const entry = entries[entries.length - 1];
    if (entry) {
      recordCustomMetric(name, entry.duration);
      return entry.duration;
    }
  } catch {
    // Ignore if not supported
  }
  return null;
}

// ============================================================================
// React Integration
// ============================================================================

import { useEffect, useState, useCallback } from 'react';

/**
 * Hook to track performance metrics
 */
export function usePerformanceMetrics(): PerformanceSummary {
  const [summary, setSummary] = useState<PerformanceSummary>(getPerformanceSummary);

  useEffect(() => {
    // Update summary when metrics change
    const interval = setInterval(() => {
      setSummary(getPerformanceSummary());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return summary;
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string): void {
  const startTime = performance.now();

  useEffect(() => {
    const renderTime = performance.now() - startTime;
    recordCustomMetric(`render:${componentName}`, renderTime);
  });
}

/**
 * Hook for game-specific performance tracking
 */
export function useGamePerformance() {
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.67);
  const frameTimesRef = useCallback(() => {
    const times: number[] = [];
    return times;
  }, [])();
  const lastFrameTimeRef = useCallback(() => {
    return { current: performance.now() };
  }, [])();

  useEffect(() => {
    let frameId: number;
    let lastUpdate = performance.now();

    const updateFps = (now: number) => {
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      frameTimesRef.push(delta);
      if (frameTimesRef.length > 60) {
        frameTimesRef.shift();
      }

      // Update FPS display every 500ms
      if (now - lastUpdate > 500) {
        const avgFrameTime = frameTimesRef.reduce((a, b) => a + b, 0) / frameTimesRef.length;
        setFrameTime(avgFrameTime);
        setFps(Math.round(1000 / avgFrameTime));
        lastUpdate = now;
      }

      frameId = requestAnimationFrame(updateFps);
    };

    frameId = requestAnimationFrame(updateFps);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [frameTimesRef, lastFrameTimeRef]);

  const recordGameMetric = useCallback((name: string, value: number) => {
    recordCustomMetric(`game:${name}`, value);
  }, []);

  return {
    fps,
    frameTime,
    recordGameMetric,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default {
  initWebVitals,
  stopWebVitals,
  getMetrics,
  getMetric,
  getPerformanceSummary,
  recordCustomMetric,
  measureFunction,
  measureAsyncFunction,
  mark,
  measure,
  usePerformanceMetrics,
  useRenderTime,
  useGamePerformance,
  DEFAULT_THRESHOLDS,
  VITAL_NAMES,
  VITAL_UNITS,
};
