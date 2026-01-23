/**
 * usePerformanceMonitor - Hook for monitoring WebGL performance metrics
 *
 * Tracks FPS, memory usage, and draw calls with throttled updates.
 * Designed for development mode debugging and performance optimization.
 *
 * @module hooks/usePerformanceMonitor
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// ============================================================================
// Types
// ============================================================================

/**
 * Performance metrics snapshot
 */
export interface PerformanceMetrics {
  /** Current frames per second */
  fps: number
  /** Average FPS over the sample window */
  avgFps: number
  /** Minimum FPS recorded in the sample window */
  minFps: number
  /** Maximum FPS recorded in the sample window */
  maxFps: number
  /** Frame time in milliseconds */
  frameTime: number
  /** WebGL draw calls this frame (if available) */
  drawCalls: number
  /** WebGL triangles rendered this frame (if available) */
  triangles: number
  /** Total geometries in scene */
  geometries: number
  /** Total textures loaded */
  textures: number
  /** JavaScript heap size in MB (if available) */
  memoryUsed: number | null
  /** JavaScript heap limit in MB (if available) */
  memoryLimit: number | null
  /** Memory usage percentage (if available) */
  memoryPercent: number | null
  /** Time since last metrics update in ms */
  lastUpdate: number
  /** Whether the hook is actively monitoring */
  isMonitoring: boolean
}

/**
 * Performance monitor configuration
 */
export interface UsePerformanceMonitorOptions {
  /** Enable monitoring (default: true in dev, false in prod) */
  enabled?: boolean
  /** Update interval in milliseconds (default: 500) */
  updateInterval?: number
  /** Number of frames to average for FPS calculation (default: 60) */
  sampleSize?: number
  /** Log metrics to console (default: false) */
  logToConsole?: boolean
  /** Console log interval in ms (default: 2000) */
  consoleLogInterval?: number
  /** Callback when metrics are updated */
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
  /** FPS threshold for performance warnings */
  fpsWarningThreshold?: number
  /** Callback when FPS drops below threshold */
  onLowFps?: (fps: number) => void
}

/**
 * Return type for usePerformanceMonitor
 */
export interface UsePerformanceMonitorResult {
  /** Current performance metrics */
  metrics: PerformanceMetrics
  /** Start monitoring */
  start: () => void
  /** Stop monitoring */
  stop: () => void
  /** Reset all metrics */
  reset: () => void
  /** Whether monitoring is active */
  isMonitoring: boolean
  /** Get a formatted string summary of metrics */
  getSummary: () => string
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_UPDATE_INTERVAL = 500
const DEFAULT_SAMPLE_SIZE = 60
const DEFAULT_CONSOLE_LOG_INTERVAL = 2000
const DEFAULT_FPS_WARNING_THRESHOLD = 30

const INITIAL_METRICS: PerformanceMetrics = {
  fps: 0,
  avgFps: 0,
  minFps: Infinity,
  maxFps: 0,
  frameTime: 0,
  drawCalls: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  memoryUsed: null,
  memoryLimit: null,
  memoryPercent: null,
  lastUpdate: 0,
  isMonitoring: false,
}

// ============================================================================
// Memory API Type (non-standard Chrome API)
// ============================================================================

interface PerformanceMemory {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if we're in development mode
 */
function isDevMode(): boolean {
  // In Vite, import.meta.env.DEV is always available
  return import.meta.env?.DEV ?? true
}

/**
 * Get memory information if available (Chrome only)
 */
function getMemoryInfo(): { used: number; limit: number; percent: number } | null {
  const perf = performance as PerformanceWithMemory
  if (perf.memory) {
    const used = perf.memory.usedJSHeapSize / (1024 * 1024)
    const limit = perf.memory.jsHeapSizeLimit / (1024 * 1024)
    const percent = (used / limit) * 100
    return { used, limit, percent }
  }
  return null
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(mb: number): string {
  if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * usePerformanceMonitor - Monitor WebGL and JavaScript performance
 *
 * Tracks FPS, memory, draw calls, and provides throttled updates.
 * Only active in development mode by default.
 *
 * @example
 * ```tsx
 * function Scene() {
 *   const { metrics, getSummary } = usePerformanceMonitor({
 *     enabled: true,
 *     onLowFps: (fps) => console.warn(`Low FPS: ${fps}`),
 *   })
 *
 *   return (
 *     <>
 *       <mesh>...</mesh>
 *       {metrics.fps < 30 && <PerformanceWarning />}
 *     </>
 *   )
 * }
 * ```
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
): UsePerformanceMonitorResult {
  const {
    enabled = isDevMode(),
    updateInterval = DEFAULT_UPDATE_INTERVAL,
    sampleSize = DEFAULT_SAMPLE_SIZE,
    logToConsole = false,
    consoleLogInterval = DEFAULT_CONSOLE_LOG_INTERVAL,
    onMetricsUpdate,
    fpsWarningThreshold = DEFAULT_FPS_WARNING_THRESHOLD,
    onLowFps,
  } = options

  // Get Three.js context
  const { gl } = useThree()

  // State
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    ...INITIAL_METRICS,
    isMonitoring: enabled,
  })
  const [isMonitoring, setIsMonitoring] = useState(enabled)

  // Refs for tracking frame times
  const frameTimesRef = useRef<number[]>([])
  const lastFrameTimeRef = useRef(performance.now())
  const lastUpdateTimeRef = useRef(0)
  const lastConsoleLogTimeRef = useRef(0)
  const lowFpsTriggeredRef = useRef(false)

  // Start monitoring
  const start = useCallback(() => {
    setIsMonitoring(true)
    frameTimesRef.current = []
    lastFrameTimeRef.current = performance.now()
    lowFpsTriggeredRef.current = false
  }, [])

  // Stop monitoring
  const stop = useCallback(() => {
    setIsMonitoring(false)
  }, [])

  // Reset metrics
  const reset = useCallback(() => {
    frameTimesRef.current = []
    lastFrameTimeRef.current = performance.now()
    lastUpdateTimeRef.current = 0
    lowFpsTriggeredRef.current = false
    setMetrics({
      ...INITIAL_METRICS,
      isMonitoring,
    })
  }, [isMonitoring])

  // Get formatted summary
  const getSummary = useCallback((): string => {
    const m = metrics
    const memStr = m.memoryUsed !== null
      ? `Memory: ${formatBytes(m.memoryUsed)}/${formatBytes(m.memoryLimit ?? 0)} (${m.memoryPercent?.toFixed(1)}%)`
      : 'Memory: N/A'

    return [
      `FPS: ${m.fps.toFixed(0)} (avg: ${m.avgFps.toFixed(0)}, min: ${m.minFps === Infinity ? 'N/A' : m.minFps.toFixed(0)}, max: ${m.maxFps.toFixed(0)})`,
      `Frame: ${m.frameTime.toFixed(2)}ms`,
      `Draw Calls: ${m.drawCalls} | Triangles: ${m.triangles.toLocaleString()}`,
      `Geometries: ${m.geometries} | Textures: ${m.textures}`,
      memStr,
    ].join(' | ')
  }, [metrics])

  // Frame update - collect timing data
  useFrame(() => {
    if (!isMonitoring) return

    const now = performance.now()
    const delta = now - lastFrameTimeRef.current
    lastFrameTimeRef.current = now

    // Record frame time
    frameTimesRef.current.push(delta)
    if (frameTimesRef.current.length > sampleSize) {
      frameTimesRef.current.shift()
    }

    // Check if it's time to update metrics
    if (now - lastUpdateTimeRef.current < updateInterval) return
    lastUpdateTimeRef.current = now

    // Calculate FPS metrics
    const frameTimes = frameTimesRef.current
    if (frameTimes.length === 0) return

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    const currentFps = delta > 0 ? 1000 / delta : 0
    const avgFps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0
    const minFrameTime = Math.min(...frameTimes)
    const maxFrameTime = Math.max(...frameTimes)
    const maxFps = minFrameTime > 0 ? 1000 / minFrameTime : 0
    const minFps = maxFrameTime > 0 ? 1000 / maxFrameTime : 0

    // Get renderer info
    const info = gl.info
    const drawCalls = info.render?.calls ?? 0
    const triangles = info.render?.triangles ?? 0
    const geometries = info.memory?.geometries ?? 0
    const textures = info.memory?.textures ?? 0

    // Get memory info
    const memInfo = getMemoryInfo()

    // Build metrics object
    const newMetrics: PerformanceMetrics = {
      fps: currentFps,
      avgFps,
      minFps: minFps === Infinity ? 0 : minFps,
      maxFps,
      frameTime: delta,
      drawCalls,
      triangles,
      geometries,
      textures,
      memoryUsed: memInfo?.used ?? null,
      memoryLimit: memInfo?.limit ?? null,
      memoryPercent: memInfo?.percent ?? null,
      lastUpdate: now,
      isMonitoring: true,
    }

    // Update state
    setMetrics(newMetrics)

    // Callback
    onMetricsUpdate?.(newMetrics)

    // Low FPS warning
    if (avgFps < fpsWarningThreshold && !lowFpsTriggeredRef.current) {
      lowFpsTriggeredRef.current = true
      onLowFps?.(avgFps)
    } else if (avgFps >= fpsWarningThreshold) {
      lowFpsTriggeredRef.current = false
    }

    // Console logging
    if (logToConsole && now - lastConsoleLogTimeRef.current > consoleLogInterval) {
      lastConsoleLogTimeRef.current = now
      console.log('[Performance]', getSummary())
    }
  })

  // Sync monitoring state with enabled prop
  useEffect(() => {
    setIsMonitoring(enabled)
  }, [enabled])

  return {
    metrics,
    start,
    stop,
    reset,
    isMonitoring,
    getSummary,
  }
}

// ============================================================================
// Standalone Hook (for use outside React Three Fiber)
// ============================================================================

/**
 * usePerformanceMonitorStandalone - Basic FPS monitor without Three.js
 *
 * Use this when you need performance monitoring outside of R3F context.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { fps } = usePerformanceMonitorStandalone()
 *   return <div>FPS: {fps.toFixed(0)}</div>
 * }
 * ```
 */
export function usePerformanceMonitorStandalone(
  options: Omit<UsePerformanceMonitorOptions, 'onMetricsUpdate' | 'onLowFps'> = {}
): { fps: number; frameTime: number; isMonitoring: boolean } {
  const {
    enabled = isDevMode(),
    updateInterval = DEFAULT_UPDATE_INTERVAL,
  } = options

  const [fps, setFps] = useState(0)
  const [frameTime, setFrameTime] = useState(0)
  const frameTimesRef = useRef<number[]>([])
  const lastTimeRef = useRef(performance.now())
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    let lastUpdate = performance.now()

    const tick = () => {
      const now = performance.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now

      frameTimesRef.current.push(delta)
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift()
      }

      if (now - lastUpdate > updateInterval) {
        lastUpdate = now
        const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length
        setFps(avgDelta > 0 ? 1000 / avgDelta : 0)
        setFrameTime(avgDelta)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
    }
  }, [enabled, updateInterval])

  return { fps, frameTime, isMonitoring: enabled }
}

// ============================================================================
// Exports
// ============================================================================

export default usePerformanceMonitor
