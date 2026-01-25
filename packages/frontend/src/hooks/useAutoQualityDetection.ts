/**
 * useAutoQualityDetection - Enhanced Automatic Quality Detection
 *
 * Comprehensive device capability detection for optimal quality settings.
 * Features:
 * - GPU info via WebGL renderer info
 * - Device memory (navigator.deviceMemory)
 * - Hardware concurrency (navigator.hardwareConcurrency)
 * - Mobile vs desktop detection
 * - Battery status monitoring (reduce quality on low battery)
 * - FPS monitoring for dynamic adjustment
 * - Network-aware quality suggestions
 *
 * @module hooks/useAutoQualityDetection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { detectWebGLCapabilities, type WebGLCapabilities } from '../utils/webglCapabilities';

// ============================================================================
// Types
// ============================================================================

/**
 * Device type classification
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/**
 * Connection quality
 */
export type ConnectionQuality = 'slow' | 'moderate' | 'fast' | 'unknown';

/**
 * Battery status
 */
export interface BatteryStatus {
  /** Whether battery status is available */
  available: boolean;
  /** Whether device is charging */
  charging: boolean;
  /** Battery level (0-1) */
  level: number;
  /** Whether battery is low (< 20%) */
  isLow: boolean;
}

/**
 * Device capabilities
 */
export interface DeviceCapabilities {
  /** WebGL capabilities */
  webgl: WebGLCapabilities;
  /** Device memory in GB (undefined if not available) */
  deviceMemory: number | undefined;
  /** Number of logical processors */
  hardwareConcurrency: number;
  /** Device type */
  deviceType: DeviceType;
  /** Whether this is a touch device */
  isTouchDevice: boolean;
  /** Battery status */
  battery: BatteryStatus;
  /** Connection quality */
  connectionQuality: ConnectionQuality;
  /** Screen pixel ratio */
  pixelRatio: number;
  /** Whether reduced motion is preferred */
  prefersReducedMotion: boolean;
  /** Whether device is likely a low-end device */
  isLowEndDevice: boolean;
  /** Overall capability score (0-100) */
  capabilityScore: number;
}

/**
 * Recommended quality settings
 */
export type QualityRecommendation = 'low' | 'medium' | 'high';

/**
 * FPS monitoring state
 */
export interface FpsMonitorState {
  /** Current FPS */
  current: number;
  /** Average FPS over sample period */
  average: number;
  /** Minimum FPS recorded */
  min: number;
  /** Maximum FPS recorded */
  max: number;
  /** Whether FPS is stable */
  isStable: boolean;
  /** Whether FPS is below target */
  isBelowTarget: boolean;
}

/**
 * Hook options
 */
export interface UseAutoQualityDetectionOptions {
  /** Target FPS for stability checks */
  targetFps?: number;
  /** FPS threshold for quality degradation */
  degradeThreshold?: number;
  /** FPS threshold for quality upgrade */
  upgradeThreshold?: number;
  /** Enable battery-aware quality */
  batteryAware?: boolean;
  /** Enable network-aware quality */
  networkAware?: boolean;
}

/**
 * Hook return type
 */
export interface UseAutoQualityDetectionResult {
  /** Detected device capabilities */
  capabilities: DeviceCapabilities;
  /** Recommended quality setting */
  recommendation: QualityRecommendation;
  /** FPS monitoring state */
  fpsState: FpsMonitorState;
  /** Report current FPS */
  reportFps: (fps: number) => void;
  /** Force re-detection of capabilities */
  redetect: () => void;
  /** Whether detection is complete */
  isReady: boolean;
  /** Get detailed capability report */
  getCapabilityReport: () => string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<UseAutoQualityDetectionOptions> = {
  targetFps: 60,
  degradeThreshold: 35,
  upgradeThreshold: 55,
  batteryAware: true,
  networkAware: true,
};

const FPS_SAMPLE_SIZE = 60;
const FPS_STABILITY_VARIANCE = 10; // FPS variance threshold for stability

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect device type
 */
function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check for mobile patterns
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet =
    /ipad|android(?!.*mobile)|tablet/i.test(ua) ||
    (hasTouchScreen && Math.min(window.innerWidth, window.innerHeight) >= 600);

  if (isMobile && !isTablet) return 'mobile';
  if (isTablet) return 'tablet';
  if (!hasTouchScreen) return 'desktop';

  return 'unknown';
}

/**
 * Detect if touch device
 */
function detectTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect connection quality
 */
function detectConnectionQuality(): ConnectionQuality {
  if (typeof navigator === 'undefined') return 'unknown';

  // @ts-expect-error - connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (!connection) return 'unknown';

  // Check effective type
  const effectiveType = connection.effectiveType as string | undefined;
  if (effectiveType) {
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'slow';
      case '3g':
        return 'moderate';
      case '4g':
        return 'fast';
    }
  }

  // Check downlink speed (Mbps)
  const downlink = connection.downlink as number | undefined;
  if (downlink !== undefined) {
    if (downlink < 1) return 'slow';
    if (downlink < 5) return 'moderate';
    return 'fast';
  }

  return 'unknown';
}

/**
 * Get battery status
 */
async function getBatteryStatus(): Promise<BatteryStatus> {
  const defaultStatus: BatteryStatus = {
    available: false,
    charging: true,
    level: 1,
    isLow: false,
  };

  if (typeof navigator === 'undefined') return defaultStatus;

  try {
    // @ts-expect-error - getBattery is not in all browsers
    if (!navigator.getBattery) return defaultStatus;

    // @ts-expect-error - getBattery is not in all browsers
    const battery = await navigator.getBattery();
    return {
      available: true,
      charging: battery.charging,
      level: battery.level,
      isLow: battery.level < 0.2 && !battery.charging,
    };
  } catch {
    return defaultStatus;
  }
}

/**
 * Check reduced motion preference
 */
function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Calculate capability score (0-100)
 */
function calculateCapabilityScore(
  webgl: WebGLCapabilities,
  deviceMemory: number | undefined,
  hardwareConcurrency: number,
  deviceType: DeviceType
): number {
  let score = 0;

  // WebGL contribution (0-40)
  if (webgl.supported) {
    score += 10;
    if (webgl.version.webgl2) score += 10;
    if (webgl.limits.maxTextureSize >= 8192) score += 10;
    else if (webgl.limits.maxTextureSize >= 4096) score += 5;
    if (webgl.extensions.floatTextures) score += 5;
    if (webgl.extensions.instancedArrays) score += 5;
  }

  // Memory contribution (0-20)
  if (deviceMemory !== undefined) {
    if (deviceMemory >= 8) score += 20;
    else if (deviceMemory >= 4) score += 15;
    else if (deviceMemory >= 2) score += 10;
    else score += 5;
  } else {
    // Assume medium if unknown
    score += 10;
  }

  // CPU contribution (0-20)
  if (hardwareConcurrency >= 8) score += 20;
  else if (hardwareConcurrency >= 4) score += 15;
  else if (hardwareConcurrency >= 2) score += 10;
  else score += 5;

  // Device type contribution (0-20)
  switch (deviceType) {
    case 'desktop':
      score += 20;
      break;
    case 'tablet':
      score += 15;
      break;
    case 'mobile':
      score += 10;
      break;
    default:
      score += 10;
  }

  return Math.min(100, score);
}

/**
 * Determine if device is low-end
 */
function isLowEndDevice(
  webgl: WebGLCapabilities,
  deviceMemory: number | undefined,
  hardwareConcurrency: number,
  _deviceType: DeviceType
): boolean {
  // No WebGL = definitely low-end
  if (!webgl.supported) return true;

  // Check for known low-end GPU patterns
  const renderer = webgl.limits.renderer.toLowerCase();
  const lowEndGpuPatterns = [
    /mali-4/,
    /mali-t[0-3]/,
    /adreno 3/,
    /adreno 4[0-2]/,
    /powervr sgx/,
    /intel.*hd.*[2-4]/,
    /intel.*gma/,
  ];
  if (lowEndGpuPatterns.some((p) => p.test(renderer))) return true;

  // Low memory
  if (deviceMemory !== undefined && deviceMemory < 2) return true;

  // Few cores
  if (hardwareConcurrency < 2) return true;

  // WebGL 1 only with limited texture size
  if (!webgl.version.webgl2 && webgl.limits.maxTextureSize < 4096) return true;

  return false;
}

/**
 * Get quality recommendation based on capabilities
 */
function getQualityRecommendation(
  capabilities: DeviceCapabilities,
  options: Required<UseAutoQualityDetectionOptions>
): QualityRecommendation {
  // Battery-aware degradation
  if (options.batteryAware && capabilities.battery.isLow) {
    return 'low';
  }

  // Network-aware (for initial load, might want to pre-load less)
  if (options.networkAware && capabilities.connectionQuality === 'slow') {
    // Don't return low just for slow connection, but factor it in
  }

  // Reduced motion preference
  if (capabilities.prefersReducedMotion) {
    return 'medium'; // Cap at medium for reduced motion
  }

  // Low-end device detection
  if (capabilities.isLowEndDevice) {
    return 'low';
  }

  // Score-based recommendation
  if (capabilities.capabilityScore >= 70) return 'high';
  if (capabilities.capabilityScore >= 40) return 'medium';
  return 'low';
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Enhanced automatic quality detection hook
 */
export function useAutoQualityDetection(
  options: UseAutoQualityDetectionOptions = {}
): UseAutoQualityDetectionResult {
  // Extract individual options for stable dependencies
  const {
    targetFps = DEFAULT_OPTIONS.targetFps,
    degradeThreshold = DEFAULT_OPTIONS.degradeThreshold,
    upgradeThreshold = DEFAULT_OPTIONS.upgradeThreshold,
    batteryAware = DEFAULT_OPTIONS.batteryAware,
    networkAware = DEFAULT_OPTIONS.networkAware,
  } = options;

  // Memoize full options object
  const fullOptions = useMemo(
    () => ({
      targetFps,
      degradeThreshold,
      upgradeThreshold,
      batteryAware,
      networkAware,
    }),
    [targetFps, degradeThreshold, upgradeThreshold, batteryAware, networkAware]
  );

  // State
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [currentFps, setCurrentFps] = useState(60);

  // Detect capabilities
  useEffect(() => {
    async function detect() {
      const webgl = detectWebGLCapabilities();
      const deviceType = detectDeviceType();
      const battery = await getBatteryStatus();

      // @ts-expect-error - deviceMemory is experimental
      const deviceMemory = navigator.deviceMemory as number | undefined;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

      const caps: DeviceCapabilities = {
        webgl,
        deviceMemory,
        hardwareConcurrency,
        deviceType,
        isTouchDevice: detectTouchDevice(),
        battery,
        connectionQuality: detectConnectionQuality(),
        pixelRatio,
        prefersReducedMotion: checkReducedMotion(),
        isLowEndDevice: isLowEndDevice(webgl, deviceMemory, hardwareConcurrency, deviceType),
        capabilityScore: calculateCapabilityScore(
          webgl,
          deviceMemory,
          hardwareConcurrency,
          deviceType
        ),
      };

      setCapabilities(caps);
      setIsReady(true);
    }

    detect();
  }, []);

  // Memoize targetFps to avoid dependency issues
  const targetFps = fullOptions.targetFps;

  // FPS state calculation
  const fpsState: FpsMonitorState = useMemo(() => {
    if (fpsHistory.length === 0) {
      return {
        current: 60,
        average: 60,
        min: 60,
        max: 60,
        isStable: true,
        isBelowTarget: false,
      };
    }

    const average = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
    const min = Math.min(...fpsHistory);
    const max = Math.max(...fpsHistory);
    const variance = max - min;

    return {
      current: currentFps,
      average,
      min,
      max,
      isStable: variance < FPS_STABILITY_VARIANCE,
      isBelowTarget: average < targetFps * 0.9,
    };
  }, [fpsHistory, currentFps, targetFps]);

  // Report FPS
  const reportFps = useCallback((fps: number) => {
    setCurrentFps(fps);
    setFpsHistory((prev) => {
      const next = [...prev, fps];
      if (next.length > FPS_SAMPLE_SIZE) {
        next.shift();
      }
      return next;
    });
  }, []);

  // Force re-detection
  const redetect = useCallback(() => {
    setIsReady(false);
    setFpsHistory([]);

    // Re-run detection
    async function detect() {
      const webgl = detectWebGLCapabilities();
      const deviceType = detectDeviceType();
      const battery = await getBatteryStatus();

      // @ts-expect-error - deviceMemory is experimental
      const deviceMemory = navigator.deviceMemory as number | undefined;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

      setCapabilities({
        webgl,
        deviceMemory,
        hardwareConcurrency,
        deviceType,
        isTouchDevice: detectTouchDevice(),
        battery,
        connectionQuality: detectConnectionQuality(),
        pixelRatio,
        prefersReducedMotion: checkReducedMotion(),
        isLowEndDevice: isLowEndDevice(webgl, deviceMemory, hardwareConcurrency, deviceType),
        capabilityScore: calculateCapabilityScore(
          webgl,
          deviceMemory,
          hardwareConcurrency,
          deviceType
        ),
      });

      setIsReady(true);
    }

    detect();
  }, []);

  // Get capability report
  const getCapabilityReport = useCallback((): string => {
    if (!capabilities) return 'Detection not complete';

    const lines = [
      `=== Device Capability Report ===`,
      ``,
      `Device Type: ${capabilities.deviceType}`,
      `Touch Device: ${capabilities.isTouchDevice ? 'Yes' : 'No'}`,
      `Pixel Ratio: ${capabilities.pixelRatio}`,
      ``,
      `--- Hardware ---`,
      `CPU Cores: ${capabilities.hardwareConcurrency}`,
      `Device Memory: ${capabilities.deviceMemory ?? 'Unknown'} GB`,
      ``,
      `--- WebGL ---`,
      `Supported: ${capabilities.webgl.supported ? 'Yes' : 'No'}`,
      `Version: WebGL ${capabilities.webgl.version.highestVersion ?? 'N/A'}`,
      `GPU: ${capabilities.webgl.limits.renderer}`,
      `Vendor: ${capabilities.webgl.limits.vendor}`,
      `Max Texture Size: ${capabilities.webgl.limits.maxTextureSize}px`,
      `Performance Tier: ${capabilities.webgl.performanceTier}`,
      ``,
      `--- Battery ---`,
      `Available: ${capabilities.battery.available ? 'Yes' : 'No'}`,
      `Charging: ${capabilities.battery.charging ? 'Yes' : 'No'}`,
      `Level: ${Math.round(capabilities.battery.level * 100)}%`,
      `Low Battery: ${capabilities.battery.isLow ? 'Yes' : 'No'}`,
      ``,
      `--- Network ---`,
      `Connection Quality: ${capabilities.connectionQuality}`,
      ``,
      `--- Preferences ---`,
      `Reduced Motion: ${capabilities.prefersReducedMotion ? 'Yes' : 'No'}`,
      ``,
      `--- Assessment ---`,
      `Capability Score: ${capabilities.capabilityScore}/100`,
      `Low-End Device: ${capabilities.isLowEndDevice ? 'Yes' : 'No'}`,
      `Recommended Quality: ${getQualityRecommendation(capabilities, fullOptions)}`,
    ];

    return lines.join('\n');
  }, [capabilities, fullOptions]);

  // Get recommendation
  const recommendation = capabilities
    ? getQualityRecommendation(capabilities, fullOptions)
    : 'medium';

  // Default capabilities while loading
  const defaultCapabilities: DeviceCapabilities = {
    webgl: detectWebGLCapabilities(),
    deviceMemory: undefined,
    hardwareConcurrency: 4,
    deviceType: 'unknown',
    isTouchDevice: false,
    battery: { available: false, charging: true, level: 1, isLow: false },
    connectionQuality: 'unknown',
    pixelRatio: 1,
    prefersReducedMotion: false,
    isLowEndDevice: false,
    capabilityScore: 50,
  };

  return {
    capabilities: capabilities ?? defaultCapabilities,
    recommendation,
    fpsState,
    reportFps,
    redetect,
    isReady,
    getCapabilityReport,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default useAutoQualityDetection;
