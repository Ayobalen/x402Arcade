/**
 * Tests for WebGL Context Provider
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import {
  WebGLProvider,
  useWebGL,
  useWebGLSafe,
  QUALITY_PRESETS,
  DEFAULT_CAPABILITIES,
} from '../../src/contexts/WebGLContext';
import type { QualityPreset } from '../../src/contexts/WebGLContext';

// Mock canvas context
const mockWebGLContext = {
  getParameter: vi.fn((param: number) => {
    const params: Record<number, unknown> = {
      3379: 4096, // MAX_TEXTURE_SIZE
      34076: 4096, // MAX_CUBE_MAP_TEXTURE_SIZE
      34024: 4096, // MAX_RENDERBUFFER_SIZE
      36347: 256, // MAX_VERTEX_UNIFORM_VECTORS
      36349: 256, // MAX_FRAGMENT_UNIFORM_VECTORS
      35661: 16, // MAX_TEXTURE_IMAGE_UNITS
      37445: 'Test Renderer', // UNMASKED_RENDERER_WEBGL
      37446: 'Test Vendor', // UNMASKED_VENDOR_WEBGL
      34047: 16, // MAX_TEXTURE_MAX_ANISOTROPY_EXT
    };
    return params[param] ?? 0;
  }),
  getExtension: vi.fn((name: string) => {
    if (name === 'WEBGL_debug_renderer_info') {
      return {
        UNMASKED_RENDERER_WEBGL: 37445,
        UNMASKED_VENDOR_WEBGL: 37446,
      };
    }
    if (name === 'EXT_texture_filter_anisotropic') {
      return {
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: 34047,
      };
    }
    if (name === 'OES_texture_float') {
      return {};
    }
    if (name === 'ANGLE_instanced_arrays') {
      return {};
    }
    return null;
  }),
};

describe('WebGLContext', () => {
  beforeEach(() => {
    // Mock canvas.getContext to return our mock WebGL context
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
      (contextType: string) => {
        if (contextType === 'webgl2' || contextType === 'webgl') {
          return mockWebGLContext as unknown as WebGLRenderingContext;
        }
        return null;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('WebGLProvider', () => {
    it('renders children', () => {
      render(
        <WebGLProvider>
          <div data-testid="child">Test Child</div>
        </WebGLProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides initial quality preset', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="high">{children}</WebGLProvider>
        ),
      });

      expect(result.current.qualityPreset).toBe('high');
    });

    it('becomes ready after mount', async () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      // After mounting, isReady should be true
      expect(result.current.isReady).toBe(true);
    });
  });

  describe('useWebGL', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebGL());
      }).toThrow('useWebGL must be used within a WebGLProvider');

      consoleSpy.mockRestore();
    });

    it('provides capabilities', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      expect(result.current.capabilities).toBeDefined();
      expect(result.current.capabilities.webglAvailable).toBe(true);
    });

    it('provides quality settings', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      expect(result.current.qualitySettings).toBeDefined();
      expect(typeof result.current.qualitySettings.pixelRatio).toBe('number');
    });
  });

  describe('useWebGLSafe', () => {
    it('returns null when used outside provider', () => {
      const { result } = renderHook(() => useWebGLSafe());
      expect(result.current).toBeNull();
    });

    it('returns context when inside provider', () => {
      const { result } = renderHook(() => useWebGLSafe(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      expect(result.current).not.toBeNull();
    });
  });

  describe('setQualityPreset', () => {
    it('changes quality preset', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="low">{children}</WebGLProvider>
        ),
      });

      expect(result.current.qualityPreset).toBe('low');

      act(() => {
        result.current.setQualityPreset('high');
      });

      expect(result.current.qualityPreset).toBe('high');
    });

    it('updates quality settings accordingly', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="low">{children}</WebGLProvider>
        ),
      });

      act(() => {
        result.current.setQualityPreset('ultra');
      });

      expect(result.current.qualitySettings.antialias).toBe(true);
      expect(result.current.qualitySettings.shadows).toBe(true);
      expect(result.current.qualitySettings.postProcessing).toBe(true);
    });
  });

  describe('setQualitySettings', () => {
    it('allows partial updates', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="medium">{children}</WebGLProvider>
        ),
      });

      const originalPixelRatio = result.current.qualitySettings.pixelRatio;

      act(() => {
        result.current.setQualitySettings({ antialias: false });
      });

      expect(result.current.qualitySettings.antialias).toBe(false);
      expect(result.current.qualitySettings.pixelRatio).toBe(originalPixelRatio);
    });
  });

  describe('getTextureSize', () => {
    it('returns size clamped to quality settings', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="high">{children}</WebGLProvider>
        ),
      });

      // High quality allows up to 2048
      const maxAllowed = Math.min(
        result.current.qualitySettings.maxTextureResolution,
        result.current.capabilities.maxTextureSize
      );
      const size = result.current.getTextureSize(512);
      expect(size).toBeLessThanOrEqual(maxAllowed);
      expect(size).toBeGreaterThanOrEqual(0);
    });

    it('clamps large requests to max texture resolution', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="low">{children}</WebGLProvider>
        ),
      });

      // Low quality has maxTextureResolution of 512
      const maxAllowed = result.current.qualitySettings.maxTextureResolution;
      const size = result.current.getTextureSize(99999);
      expect(size).toBeLessThanOrEqual(maxAllowed);
    });

    it('returns minimum of ideal, quality, and capabilities', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider initialQuality="medium">{children}</WebGLProvider>
        ),
      });

      const ideal = 256;
      const size = result.current.getTextureSize(ideal);

      // Result should be at most the ideal size
      expect(size).toBeLessThanOrEqual(ideal);
    });
  });

  describe('isFeatureAvailable', () => {
    it('returns correct value for boolean features', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      // webglAvailable should be true since we mocked canvas.getContext
      const webglAvailable = result.current.capabilities.webglAvailable;
      expect(result.current.isFeatureAvailable('webglAvailable')).toBe(webglAvailable);
    });

    it('returns correct value for number features', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      // maxTextureSize > 0 means feature is available
      const maxTextureSize = result.current.capabilities.maxTextureSize;
      expect(result.current.isFeatureAvailable('maxTextureSize')).toBe(maxTextureSize > 0);
    });

    it('handles boolean and number features correctly', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      // Test with DEFAULT_CAPABILITIES which we know are conservative
      // Check that the function returns the right type of answer
      const webgl = result.current.isFeatureAvailable('webglAvailable');
      const texture = result.current.isFeatureAvailable('maxTextureSize');

      expect(typeof webgl).toBe('boolean');
      expect(typeof texture).toBe('boolean');
    });
  });

  describe('QUALITY_PRESETS', () => {
    it('has all four presets defined', () => {
      expect(QUALITY_PRESETS.low).toBeDefined();
      expect(QUALITY_PRESETS.medium).toBeDefined();
      expect(QUALITY_PRESETS.high).toBeDefined();
      expect(QUALITY_PRESETS.ultra).toBeDefined();
    });

    it('low preset disables expensive features', () => {
      expect(QUALITY_PRESETS.low.antialias).toBe(false);
      expect(QUALITY_PRESETS.low.shadows).toBe(false);
      expect(QUALITY_PRESETS.low.postProcessing).toBe(false);
      expect(QUALITY_PRESETS.low.particles).toBe(false);
    });

    it('ultra preset enables all features', () => {
      expect(QUALITY_PRESETS.ultra.antialias).toBe(true);
      expect(QUALITY_PRESETS.ultra.shadows).toBe(true);
      expect(QUALITY_PRESETS.ultra.postProcessing).toBe(true);
      expect(QUALITY_PRESETS.ultra.particles).toBe(true);
    });

    it('has progressive quality levels', () => {
      const presets: QualityPreset[] = ['low', 'medium', 'high', 'ultra'];

      // Shadow map sizes should increase
      for (let i = 0; i < presets.length - 1; i++) {
        expect(QUALITY_PRESETS[presets[i]].shadowMapSize).toBeLessThanOrEqual(
          QUALITY_PRESETS[presets[i + 1]].shadowMapSize
        );
      }

      // Max particles should increase
      for (let i = 0; i < presets.length - 1; i++) {
        expect(QUALITY_PRESETS[presets[i]].maxParticles).toBeLessThanOrEqual(
          QUALITY_PRESETS[presets[i + 1]].maxParticles
        );
      }
    });
  });

  describe('DEFAULT_CAPABILITIES', () => {
    it('has conservative defaults', () => {
      expect(DEFAULT_CAPABILITIES.webglAvailable).toBe(false);
      expect(DEFAULT_CAPABILITIES.maxTextureSize).toBe(2048);
    });

    it('includes all capability properties', () => {
      expect(DEFAULT_CAPABILITIES).toHaveProperty('webglAvailable');
      expect(DEFAULT_CAPABILITIES).toHaveProperty('webgl2Available');
      expect(DEFAULT_CAPABILITIES).toHaveProperty('maxTextureSize');
      expect(DEFAULT_CAPABILITIES).toHaveProperty('renderer');
      expect(DEFAULT_CAPABILITIES).toHaveProperty('vendor');
    });
  });

  describe('context loss handling', () => {
    it('starts with contextLost as false', () => {
      const { result } = renderHook(() => useWebGL(), {
        wrapper: ({ children }) => <WebGLProvider>{children}</WebGLProvider>,
      });

      expect(result.current.contextLost).toBe(false);
    });

    it('calls onContextLost callback when context is lost', () => {
      const onContextLost = vi.fn();

      renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider onContextLost={onContextLost}>{children}</WebGLProvider>
        ),
      });

      // Simulate context loss event
      act(() => {
        window.dispatchEvent(new Event('webglcontextlost'));
      });

      expect(onContextLost).toHaveBeenCalled();
    });

    it('calls onContextRestored callback when context is restored', () => {
      const onContextRestored = vi.fn();

      renderHook(() => useWebGL(), {
        wrapper: ({ children }) => (
          <WebGLProvider onContextRestored={onContextRestored}>{children}</WebGLProvider>
        ),
      });

      // Simulate context restore event
      act(() => {
        window.dispatchEvent(new Event('webglcontextrestored'));
      });

      expect(onContextRestored).toHaveBeenCalled();
    });
  });
});
