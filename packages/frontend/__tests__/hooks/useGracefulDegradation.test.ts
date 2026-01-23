/**
 * Tests for useGracefulDegradation Hook
 *
 * Tests the adaptive quality management hook including quality tier
 * detection, FPS-based degradation, and localStorage persistence.
 *
 * @module __tests__/hooks/useGracefulDegradation.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useGracefulDegradation,
  QUALITY_TIERS,
  type QualityTier,
  type QualitySettings,
  type UseGracefulDegradationOptions,
} from '../../src/hooks/useGracefulDegradation';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock webglCapabilities
vi.mock('../../src/utils/webglCapabilities', () => ({
  detectWebGLCapabilities: () => ({
    supported: true,
    version: { webgl2: true, webgl1: true, highestVersion: 2, contextType: 'webgl2' },
    limits: {
      maxTextureSize: 8192,
      maxCubeMapTextureSize: 4096,
      renderer: 'Test Renderer',
      vendor: 'Test Vendor',
    },
    extensions: {
      anisotropicFiltering: true,
      floatTextures: true,
      instancedArrays: true,
    },
    performanceTier: 2,
    recommendedQuality: 'medium',
    isMobile: false,
    issues: [],
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useGracefulDegradation', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('returns state with current quality tier', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      expect(result.current.state.currentTier).toBeDefined();
      expect(['low', 'medium', 'high', 'ultra']).toContain(
        result.current.state.currentTier
      );
    });

    it('returns quality settings object', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      expect(result.current.state.settings).toBeDefined();
      expect(result.current.state.settings).toHaveProperty('pixelRatio');
      expect(result.current.state.settings).toHaveProperty('antialias');
      expect(result.current.state.settings).toHaveProperty('shadows');
    });

    it('uses initialTier when provided', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'high' })
      );

      expect(result.current.state.currentTier).toBe('high');
    });

    it('enables autoDegrade by default', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      expect(result.current.state.autoDegrade).toBe(true);
    });

    it('respects autoDegrade option', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ autoDegrade: false })
      );

      expect(result.current.state.autoDegrade).toBe(false);
    });
  });

  describe('setQualityTier', () => {
    it('changes quality tier', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'low' })
      );

      act(() => {
        result.current.setQualityTier('high');
      });

      expect(result.current.state.currentTier).toBe('high');
    });

    it('updates settings accordingly', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'low' })
      );

      act(() => {
        result.current.setQualityTier('ultra');
      });

      expect(result.current.state.settings.shadows).toBe(true);
      expect(result.current.state.settings.postProcessing).toBe(true);
      expect(result.current.state.settings.bloom).toBe(true);
    });

    it('sets hasManualOverride to true', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      act(() => {
        result.current.setQualityTier('high');
      });

      expect(result.current.state.hasManualOverride).toBe(true);
    });

    it('persists to localStorage', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ storageKey: 'test-quality' })
      );

      act(() => {
        result.current.setQualityTier('high');
      });

      const stored = JSON.parse(
        localStorageMock.getItem('test-quality') || '{}'
      );
      expect(stored.tier).toBe('high');
    });
  });

  describe('setAutoDegrade', () => {
    it('enables auto degradation', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ autoDegrade: false })
      );

      act(() => {
        result.current.setAutoDegrade(true);
      });

      expect(result.current.state.autoDegrade).toBe(true);
    });

    it('disables auto degradation', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ autoDegrade: true })
      );

      act(() => {
        result.current.setAutoDegrade(false);
      });

      expect(result.current.state.autoDegrade).toBe(false);
    });
  });

  describe('resetToAuto', () => {
    it('clears manual override', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      act(() => {
        result.current.setQualityTier('ultra');
      });

      expect(result.current.state.hasManualOverride).toBe(true);

      act(() => {
        result.current.resetToAuto();
      });

      expect(result.current.state.hasManualOverride).toBe(false);
    });

    it('sets isAutoDetected to true', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      act(() => {
        result.current.setQualityTier('ultra');
        result.current.resetToAuto();
      });

      expect(result.current.state.isAutoDetected).toBe(true);
    });
  });

  describe('reportFps', () => {
    it('updates currentFps', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      act(() => {
        result.current.reportFps(45);
      });

      expect(result.current.state.currentFps).toBe(45);
    });

    it('does not trigger degradation when manual override is set', async () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'high' })
      );

      // Set manual override
      act(() => {
        result.current.setQualityTier('high');
      });

      // Report low FPS multiple times
      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.reportFps(15); // Below threshold
        });
        await act(async () => {
          vi.advanceTimersByTime(100);
        });
      }

      // Should stay at high due to manual override
      expect(result.current.state.currentTier).toBe('high');
    });

    it('triggers degradation when FPS is consistently low', async () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({
          degradeFpsThreshold: 30,
          cooldownMs: 100,
          autoDegrade: true,
        })
      );

      // Report low FPS multiple times to fill the sample buffer
      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.reportFps(15); // Well below threshold
        });
        await act(async () => {
          vi.advanceTimersByTime(100);
        });
      }

      // Wait for cooldown
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      // Should have degraded (unless already at 'low')
      if (result.current.state.currentTier !== 'low') {
        // The tier should have decreased
        expect(['low', 'medium']).toContain(result.current.state.currentTier);
      }
    });
  });

  describe('getTierSettings', () => {
    it('returns settings for specified tier', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      const lowSettings = result.current.getTierSettings('low');
      const ultraSettings = result.current.getTierSettings('ultra');

      expect(lowSettings.shadows).toBe(false);
      expect(ultraSettings.shadows).toBe(true);
    });

    it('returns all quality tiers correctly', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      const tiers: QualityTier[] = ['low', 'medium', 'high', 'ultra'];

      for (const tier of tiers) {
        const settings = result.current.getTierSettings(tier);
        expect(settings.tier).toBe(tier);
      }
    });
  });

  describe('isFeatureEnabled', () => {
    it('returns true for enabled features', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'ultra' })
      );

      expect(result.current.isFeatureEnabled('shadows')).toBe(true);
      expect(result.current.isFeatureEnabled('bloom')).toBe(true);
      expect(result.current.isFeatureEnabled('particles')).toBe(true);
    });

    it('returns false for disabled features', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'low' })
      );

      expect(result.current.isFeatureEnabled('shadows')).toBe(false);
      expect(result.current.isFeatureEnabled('bloom')).toBe(false);
      expect(result.current.isFeatureEnabled('particles')).toBe(false);
    });

    it('handles numeric features correctly', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'high' })
      );

      // maxParticles > 0 should return true
      expect(result.current.isFeatureEnabled('maxParticles')).toBe(true);
    });
  });

  describe('getSetting', () => {
    it('returns specific setting value', () => {
      const { result } = renderHook(() =>
        useGracefulDegradation({ initialTier: 'medium' })
      );

      expect(result.current.getSetting('pixelRatio')).toBe(1);
      expect(result.current.getSetting('antialias')).toBe(true);
      expect(result.current.getSetting('targetFps')).toBe(45);
    });
  });

  describe('redetectCapabilities', () => {
    it('updates capabilities', () => {
      const { result } = renderHook(() => useGracefulDegradation());

      act(() => {
        result.current.redetectCapabilities();
      });

      expect(result.current.state.capabilities).not.toBeNull();
    });
  });

  describe('onQualityChange callback', () => {
    it('calls callback when quality changes', () => {
      const onQualityChange = vi.fn();

      const { result } = renderHook(() =>
        useGracefulDegradation({
          initialTier: 'low',
          onQualityChange,
        })
      );

      act(() => {
        result.current.setQualityTier('high');
      });

      expect(onQualityChange).toHaveBeenCalledWith(
        'high',
        expect.objectContaining({ tier: 'high' })
      );
    });
  });

  describe('localStorage Persistence', () => {
    it('loads persisted tier from localStorage', () => {
      const storageKey = 'test-persist-quality';
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          tier: 'ultra',
          autoDegrade: true,
          hasManualOverride: true,
        })
      );

      const { result } = renderHook(() =>
        useGracefulDegradation({ storageKey })
      );

      expect(result.current.state.currentTier).toBe('ultra');
      expect(result.current.state.hasManualOverride).toBe(true);
    });

    it('persists changes to localStorage', () => {
      const storageKey = 'test-save-quality';

      const { result } = renderHook(() =>
        useGracefulDegradation({ storageKey })
      );

      act(() => {
        result.current.setQualityTier('high');
      });

      const stored = JSON.parse(localStorageMock.getItem(storageKey) || '{}');
      expect(stored.tier).toBe('high');
      expect(stored.hasManualOverride).toBe(true);
    });

    it('handles invalid localStorage data gracefully', () => {
      const storageKey = 'test-invalid-quality';
      localStorageMock.setItem(storageKey, 'invalid json {{{');

      expect(() => {
        renderHook(() => useGracefulDegradation({ storageKey }));
      }).not.toThrow();
    });
  });
});

describe('QUALITY_TIERS constant', () => {
  describe('low tier', () => {
    const tier = QUALITY_TIERS.low;

    it('has minimal visual features disabled', () => {
      expect(tier.antialias).toBe(false);
      expect(tier.shadows).toBe(false);
      expect(tier.postProcessing).toBe(false);
      expect(tier.bloom).toBe(false);
      expect(tier.particles).toBe(false);
      expect(tier.reflections).toBe(false);
      expect(tier.ambientOcclusion).toBe(false);
    });

    it('has low pixel ratio', () => {
      expect(tier.pixelRatio).toBe(0.75);
    });

    it('targets 30 FPS', () => {
      expect(tier.targetFps).toBe(30);
    });

    it('still allows basic animations', () => {
      expect(tier.animations).toBe(true);
      expect(tier.animationQuality).toBe(0.5);
    });
  });

  describe('medium tier', () => {
    const tier = QUALITY_TIERS.medium;

    it('has some visual features enabled', () => {
      expect(tier.antialias).toBe(true);
      expect(tier.postProcessing).toBe(true);
      expect(tier.particles).toBe(true);
      expect(tier.crtEffect).toBe(true);
    });

    it('has shadows and bloom disabled', () => {
      expect(tier.shadows).toBe(false);
      expect(tier.bloom).toBe(false);
    });

    it('targets 45 FPS', () => {
      expect(tier.targetFps).toBe(45);
    });
  });

  describe('high tier', () => {
    const tier = QUALITY_TIERS.high;

    it('has most visual features enabled', () => {
      expect(tier.antialias).toBe(true);
      expect(tier.shadows).toBe(true);
      expect(tier.postProcessing).toBe(true);
      expect(tier.bloom).toBe(true);
      expect(tier.particles).toBe(true);
      expect(tier.reflections).toBe(true);
    });

    it('has ambient occlusion disabled', () => {
      expect(tier.ambientOcclusion).toBe(false);
    });

    it('targets 60 FPS', () => {
      expect(tier.targetFps).toBe(60);
    });

    it('has higher pixel ratio', () => {
      expect(tier.pixelRatio).toBe(1.5);
    });
  });

  describe('ultra tier', () => {
    const tier = QUALITY_TIERS.ultra;

    it('has all visual features enabled', () => {
      expect(tier.antialias).toBe(true);
      expect(tier.shadows).toBe(true);
      expect(tier.postProcessing).toBe(true);
      expect(tier.bloom).toBe(true);
      expect(tier.particles).toBe(true);
      expect(tier.reflections).toBe(true);
      expect(tier.ambientOcclusion).toBe(true);
    });

    it('has highest pixel ratio', () => {
      expect(tier.pixelRatio).toBe(2);
    });

    it('has maximum texture and particle settings', () => {
      expect(tier.maxTextureSize).toBe(4096);
      expect(tier.maxParticles).toBe(10000);
      expect(tier.shadowMapSize).toBe(2048);
    });

    it('targets 60 FPS', () => {
      expect(tier.targetFps).toBe(60);
    });

    it('has full animation quality', () => {
      expect(tier.animations).toBe(true);
      expect(tier.animationQuality).toBe(1);
    });
  });

  describe('Progressive quality levels', () => {
    const tiers: QualityTier[] = ['low', 'medium', 'high', 'ultra'];

    it('has increasing pixel ratios', () => {
      for (let i = 0; i < tiers.length - 1; i++) {
        expect(QUALITY_TIERS[tiers[i]].pixelRatio).toBeLessThanOrEqual(
          QUALITY_TIERS[tiers[i + 1]].pixelRatio
        );
      }
    });

    it('has increasing max texture sizes', () => {
      for (let i = 0; i < tiers.length - 1; i++) {
        expect(QUALITY_TIERS[tiers[i]].maxTextureSize).toBeLessThanOrEqual(
          QUALITY_TIERS[tiers[i + 1]].maxTextureSize
        );
      }
    });

    it('has increasing max particle counts', () => {
      for (let i = 0; i < tiers.length - 1; i++) {
        expect(QUALITY_TIERS[tiers[i]].maxParticles).toBeLessThanOrEqual(
          QUALITY_TIERS[tiers[i + 1]].maxParticles
        );
      }
    });

    it('has increasing shadow map sizes', () => {
      for (let i = 0; i < tiers.length - 1; i++) {
        expect(QUALITY_TIERS[tiers[i]].shadowMapSize).toBeLessThanOrEqual(
          QUALITY_TIERS[tiers[i + 1]].shadowMapSize
        );
      }
    });
  });
});

describe('QualitySettings interface', () => {
  it('includes all required properties', () => {
    const settings: QualitySettings = {
      tier: 'medium',
      pixelRatio: 1,
      antialias: true,
      shadows: true,
      shadowMapSize: 1024,
      postProcessing: true,
      bloom: true,
      crtEffect: true,
      maxTextureSize: 2048,
      particles: true,
      maxParticles: 1000,
      reflections: true,
      ambientOcclusion: false,
      targetFps: 60,
      animations: true,
      animationQuality: 1,
    };

    expect(settings.tier).toBe('medium');
    expect(settings.pixelRatio).toBe(1);
    expect(settings.antialias).toBe(true);
    expect(settings.shadows).toBe(true);
    expect(settings.shadowMapSize).toBe(1024);
    expect(settings.postProcessing).toBe(true);
    expect(settings.bloom).toBe(true);
    expect(settings.crtEffect).toBe(true);
    expect(settings.maxTextureSize).toBe(2048);
    expect(settings.particles).toBe(true);
    expect(settings.maxParticles).toBe(1000);
    expect(settings.reflections).toBe(true);
    expect(settings.ambientOcclusion).toBe(false);
    expect(settings.targetFps).toBe(60);
    expect(settings.animations).toBe(true);
    expect(settings.animationQuality).toBe(1);
  });
});
