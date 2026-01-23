/**
 * useGracefulDegradation - Hook for adaptive quality management
 *
 * Provides automatic and manual quality control based on device capabilities
 * and runtime performance monitoring. Persists user preferences to localStorage.
 *
 * @module hooks/useGracefulDegradation
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  detectWebGLCapabilities,
  type WebGLCapabilities,
} from '../utils/webglCapabilities'

// ============================================================================
// Types
// ============================================================================

/**
 * Quality tiers for graceful degradation
 */
export type QualityTier = 'low' | 'medium' | 'high' | 'ultra'

/**
 * Quality settings for each tier
 */
export interface QualitySettings {
  /** Quality tier name */
  tier: QualityTier
  /** Pixel ratio multiplier (0.5-2.0) */
  pixelRatio: number
  /** Enable anti-aliasing */
  antialias: boolean
  /** Enable shadows */
  shadows: boolean
  /** Shadow map resolution */
  shadowMapSize: number
  /** Enable post-processing effects */
  postProcessing: boolean
  /** Enable bloom effect */
  bloom: boolean
  /** Enable CRT effect */
  crtEffect: boolean
  /** Maximum texture resolution */
  maxTextureSize: number
  /** Enable particle effects */
  particles: boolean
  /** Maximum particle count */
  maxParticles: number
  /** Enable reflections */
  reflections: boolean
  /** Enable ambient occlusion */
  ambientOcclusion: boolean
  /** Target frame rate */
  targetFps: number
  /** Enable animations */
  animations: boolean
  /** Animation quality (0-1) */
  animationQuality: number
}

/**
 * Degradation state and controls
 */
export interface GracefulDegradationState {
  /** Current quality settings */
  settings: QualitySettings
  /** Current quality tier */
  currentTier: QualityTier
  /** Whether auto-degradation is enabled */
  autoDegrade: boolean
  /** Whether settings were auto-detected */
  isAutoDetected: boolean
  /** Current FPS (if monitoring) */
  currentFps: number | null
  /** Detected device capabilities */
  capabilities: WebGLCapabilities | null
  /** Whether quality is currently degrading */
  isDegrading: boolean
  /** User has overridden auto settings */
  hasManualOverride: boolean
}

/**
 * Return type for useGracefulDegradation
 */
export interface UseGracefulDegradationResult {
  /** Current state */
  state: GracefulDegradationState
  /** Set quality tier manually */
  setQualityTier: (tier: QualityTier) => void
  /** Enable/disable auto degradation */
  setAutoDegrade: (enabled: boolean) => void
  /** Reset to auto-detected settings */
  resetToAuto: () => void
  /** Report current FPS for adaptive quality */
  reportFps: (fps: number) => void
  /** Force re-detect capabilities */
  redetectCapabilities: () => void
  /** Get settings for a specific tier */
  getTierSettings: (tier: QualityTier) => QualitySettings
  /** Check if a feature is enabled at current quality */
  isFeatureEnabled: (feature: keyof QualitySettings) => boolean
  /** Get a specific setting value */
  getSetting: <K extends keyof QualitySettings>(key: K) => QualitySettings[K]
}

/**
 * Options for useGracefulDegradation
 */
export interface UseGracefulDegradationOptions {
  /** Initial quality tier (auto-detected if not provided) */
  initialTier?: QualityTier
  /** Enable auto-degradation based on FPS (default: true) */
  autoDegrade?: boolean
  /** FPS threshold for degradation (default: 30) */
  degradeFpsThreshold?: number
  /** FPS threshold for upgrading quality (default: 55) */
  upgradeFpsThreshold?: number
  /** Minimum time between quality changes in ms (default: 5000) */
  cooldownMs?: number
  /** localStorage key for persisting settings (default: 'x402-quality') */
  storageKey?: string
  /** Callback when quality changes */
  onQualityChange?: (tier: QualityTier, settings: QualitySettings) => void
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_DEFAULT = 'x402-quality'
const DEGRADE_FPS_THRESHOLD = 30
const UPGRADE_FPS_THRESHOLD = 55
const COOLDOWN_MS = 5000
const FPS_SAMPLE_SIZE = 30

/**
 * Quality tier definitions
 */
export const QUALITY_TIERS: Record<QualityTier, QualitySettings> = {
  low: {
    tier: 'low',
    pixelRatio: 0.75,
    antialias: false,
    shadows: false,
    shadowMapSize: 256,
    postProcessing: false,
    bloom: false,
    crtEffect: false,
    maxTextureSize: 512,
    particles: false,
    maxParticles: 0,
    reflections: false,
    ambientOcclusion: false,
    targetFps: 30,
    animations: true,
    animationQuality: 0.5,
  },
  medium: {
    tier: 'medium',
    pixelRatio: 1,
    antialias: true,
    shadows: false,
    shadowMapSize: 512,
    postProcessing: true,
    bloom: false,
    crtEffect: true,
    maxTextureSize: 1024,
    particles: true,
    maxParticles: 500,
    reflections: false,
    ambientOcclusion: false,
    targetFps: 45,
    animations: true,
    animationQuality: 0.75,
  },
  high: {
    tier: 'high',
    pixelRatio: 1.5,
    antialias: true,
    shadows: true,
    shadowMapSize: 1024,
    postProcessing: true,
    bloom: true,
    crtEffect: true,
    maxTextureSize: 2048,
    particles: true,
    maxParticles: 2000,
    reflections: true,
    ambientOcclusion: false,
    targetFps: 60,
    animations: true,
    animationQuality: 1,
  },
  ultra: {
    tier: 'ultra',
    pixelRatio: 2,
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    postProcessing: true,
    bloom: true,
    crtEffect: true,
    maxTextureSize: 4096,
    particles: true,
    maxParticles: 10000,
    reflections: true,
    ambientOcclusion: true,
    targetFps: 60,
    animations: true,
    animationQuality: 1,
  },
}

/** Ordered tiers from lowest to highest */
const TIER_ORDER: QualityTier[] = ['low', 'medium', 'high', 'ultra']

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the tier index for ordering
 */
function getTierIndex(tier: QualityTier): number {
  return TIER_ORDER.indexOf(tier)
}

/**
 * Get the next lower tier
 */
function getLowerTier(tier: QualityTier): QualityTier {
  const index = getTierIndex(tier)
  return index > 0 ? TIER_ORDER[index - 1] : tier
}

/**
 * Get the next higher tier
 */
function getHigherTier(tier: QualityTier): QualityTier {
  const index = getTierIndex(tier)
  return index < TIER_ORDER.length - 1 ? TIER_ORDER[index + 1] : tier
}

/**
 * Determine recommended tier based on capabilities
 */
function getRecommendedTier(capabilities: WebGLCapabilities): QualityTier {
  // Use the capability detection's recommendation, but map to our tiers
  const recommended = capabilities.recommendedQuality
  if (TIER_ORDER.includes(recommended as QualityTier)) {
    return recommended as QualityTier
  }
  return 'medium'
}

/**
 * Load persisted settings from localStorage
 */
function loadPersistedSettings(key: string): {
  tier: QualityTier
  autoDegrade: boolean
  hasManualOverride: boolean
} | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (
      parsed &&
      TIER_ORDER.includes(parsed.tier) &&
      typeof parsed.autoDegrade === 'boolean'
    ) {
      return {
        tier: parsed.tier,
        autoDegrade: parsed.autoDegrade,
        hasManualOverride: parsed.hasManualOverride ?? false,
      }
    }
  } catch {
    // Invalid stored data
  }
  return null
}

/**
 * Save settings to localStorage
 */
function persistSettings(
  key: string,
  tier: QualityTier,
  autoDegrade: boolean,
  hasManualOverride: boolean
): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(
      key,
      JSON.stringify({ tier, autoDegrade, hasManualOverride })
    )
  } catch {
    // localStorage may be unavailable
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * useGracefulDegradation - Adaptive quality management hook
 *
 * Automatically detects device capabilities and provides quality settings.
 * Supports manual override and persists user preferences.
 *
 * @example
 * ```tsx
 * function Game() {
 *   const { state, setQualityTier, reportFps } = useGracefulDegradation({
 *     autoDegrade: true,
 *     onQualityChange: (tier) => console.log(`Quality changed to ${tier}`),
 *   })
 *
 *   // In your render loop, report FPS
 *   useFrame(() => {
 *     reportFps(currentFps)
 *   })
 *
 *   return (
 *     <Canvas
 *       dpr={state.settings.pixelRatio}
 *       shadows={state.settings.shadows}
 *     >
 *       {state.settings.bloom && <Bloom />}
 *       {state.settings.particles && <Particles max={state.settings.maxParticles} />}
 *     </Canvas>
 *   )
 * }
 * ```
 */
export function useGracefulDegradation(
  options: UseGracefulDegradationOptions = {}
): UseGracefulDegradationResult {
  const {
    initialTier,
    autoDegrade: initialAutoDegrade = true,
    degradeFpsThreshold = DEGRADE_FPS_THRESHOLD,
    upgradeFpsThreshold = UPGRADE_FPS_THRESHOLD,
    cooldownMs = COOLDOWN_MS,
    storageKey = STORAGE_KEY_DEFAULT,
    onQualityChange,
  } = options

  // Refs for FPS tracking
  const fpsHistoryRef = useRef<number[]>([])
  const lastChangeTimeRef = useRef(0)
  const recommendedTierRef = useRef<QualityTier>('medium')

  // Initialize state
  const [capabilities, setCapabilities] = useState<WebGLCapabilities | null>(null)
  const [currentTier, setCurrentTier] = useState<QualityTier>(() => {
    // Check localStorage first
    const persisted = loadPersistedSettings(storageKey)
    if (persisted?.hasManualOverride) {
      return persisted.tier
    }
    // Use initial tier if provided
    if (initialTier) {
      return initialTier
    }
    // Will be updated after capability detection
    return 'medium'
  })
  const [autoDegrade, setAutoDegradeState] = useState(() => {
    const persisted = loadPersistedSettings(storageKey)
    return persisted?.autoDegrade ?? initialAutoDegrade
  })
  const [hasManualOverride, setHasManualOverride] = useState(() => {
    const persisted = loadPersistedSettings(storageKey)
    return persisted?.hasManualOverride ?? false
  })
  const [currentFps, setCurrentFps] = useState<number | null>(null)
  const [isDegrading, setIsDegrading] = useState(false)
  const [isAutoDetected, setIsAutoDetected] = useState(!initialTier)

  // Detect capabilities on mount
  useEffect(() => {
    const caps = detectWebGLCapabilities()
    setCapabilities(caps)

    const recommended = getRecommendedTier(caps)
    recommendedTierRef.current = recommended

    // Only set tier if not manually overridden
    if (!hasManualOverride && !initialTier) {
      setCurrentTier(recommended)
      setIsAutoDetected(true)
    }
  }, [hasManualOverride, initialTier])

  // Persist settings when they change
  useEffect(() => {
    persistSettings(storageKey, currentTier, autoDegrade, hasManualOverride)
  }, [storageKey, currentTier, autoDegrade, hasManualOverride])

  // Notify on quality change
  useEffect(() => {
    onQualityChange?.(currentTier, QUALITY_TIERS[currentTier])
  }, [currentTier, onQualityChange])

  // Set quality tier manually
  const setQualityTier = useCallback((tier: QualityTier) => {
    setCurrentTier(tier)
    setHasManualOverride(true)
    setIsAutoDetected(false)
    lastChangeTimeRef.current = Date.now()
  }, [])

  // Enable/disable auto degradation
  const setAutoDegrade = useCallback((enabled: boolean) => {
    setAutoDegradeState(enabled)
    if (enabled) {
      fpsHistoryRef.current = []
    }
  }, [])

  // Reset to auto-detected settings
  const resetToAuto = useCallback(() => {
    setHasManualOverride(false)
    setCurrentTier(recommendedTierRef.current)
    setIsAutoDetected(true)
    fpsHistoryRef.current = []
    lastChangeTimeRef.current = 0
  }, [])

  // Report FPS for adaptive quality
  const reportFps = useCallback(
    (fps: number) => {
      setCurrentFps(fps)

      if (!autoDegrade || hasManualOverride) return

      // Add to history
      fpsHistoryRef.current.push(fps)
      if (fpsHistoryRef.current.length > FPS_SAMPLE_SIZE) {
        fpsHistoryRef.current.shift()
      }

      // Need enough samples
      if (fpsHistoryRef.current.length < FPS_SAMPLE_SIZE / 2) return

      // Check cooldown
      const now = Date.now()
      if (now - lastChangeTimeRef.current < cooldownMs) return

      // Calculate average FPS
      const avgFps =
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) /
        fpsHistoryRef.current.length

      // Check for degradation
      if (avgFps < degradeFpsThreshold && currentTier !== 'low') {
        setIsDegrading(true)
        const newTier = getLowerTier(currentTier)
        setCurrentTier(newTier)
        lastChangeTimeRef.current = now
        fpsHistoryRef.current = []
        setTimeout(() => setIsDegrading(false), 1000)
        return
      }

      // Check for upgrade
      if (avgFps > upgradeFpsThreshold && currentTier !== recommendedTierRef.current) {
        const targetIndex = getTierIndex(recommendedTierRef.current)
        const currentIndex = getTierIndex(currentTier)
        if (currentIndex < targetIndex) {
          const newTier = getHigherTier(currentTier)
          setCurrentTier(newTier)
          lastChangeTimeRef.current = now
          fpsHistoryRef.current = []
        }
      }
    },
    [autoDegrade, hasManualOverride, currentTier, cooldownMs, degradeFpsThreshold, upgradeFpsThreshold]
  )

  // Force re-detect capabilities
  const redetectCapabilities = useCallback(() => {
    const caps = detectWebGLCapabilities()
    setCapabilities(caps)
    const recommended = getRecommendedTier(caps)
    recommendedTierRef.current = recommended
    if (!hasManualOverride) {
      setCurrentTier(recommended)
      setIsAutoDetected(true)
    }
  }, [hasManualOverride])

  // Get settings for a specific tier
  const getTierSettings = useCallback(
    (tier: QualityTier): QualitySettings => QUALITY_TIERS[tier],
    []
  )

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback(
    (feature: keyof QualitySettings): boolean => {
      const value = QUALITY_TIERS[currentTier][feature]
      if (typeof value === 'boolean') return value
      if (typeof value === 'number') return value > 0
      return !!value
    },
    [currentTier]
  )

  // Get a specific setting
  const getSetting = useCallback(
    <K extends keyof QualitySettings>(key: K): QualitySettings[K] =>
      QUALITY_TIERS[currentTier][key],
    [currentTier]
  )

  // Build state object
  const state: GracefulDegradationState = {
    settings: QUALITY_TIERS[currentTier],
    currentTier,
    autoDegrade,
    isAutoDetected,
    currentFps,
    capabilities,
    isDegrading,
    hasManualOverride,
  }

  return {
    state,
    setQualityTier,
    setAutoDegrade,
    resetToAuto,
    reportFps,
    redetectCapabilities,
    getTierSettings,
    isFeatureEnabled,
    getSetting,
  }
}

// ============================================================================
// Exports
// ============================================================================

export default useGracefulDegradation
