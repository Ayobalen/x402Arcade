/**
 * WebGL Context Provider
 *
 * Provides WebGL state, configuration, and utilities to 3D components.
 * Wraps React Three Fiber components to provide shared WebGL context.
 */

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
// Note: THREE import removed - using native WebGL API for capability detection

// ============================================================================
// Types
// ============================================================================

/**
 * Quality presets for WebGL rendering
 */
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

/**
 * WebGL capabilities detected from the browser
 */
export interface WebGLCapabilities {
  /** Whether WebGL is available */
  webglAvailable: boolean;
  /** Whether WebGL 2 is available */
  webgl2Available: boolean;
  /** Maximum texture size supported */
  maxTextureSize: number;
  /** Maximum cube map texture size */
  maxCubeMapSize: number;
  /** Maximum render buffer size */
  maxRenderBufferSize: number;
  /** Maximum vertex uniforms */
  maxVertexUniforms: number;
  /** Maximum fragment uniforms */
  maxFragmentUniforms: number;
  /** Maximum texture image units */
  maxTextureUnits: number;
  /** GPU renderer string */
  renderer: string;
  /** GPU vendor string */
  vendor: string;
  /** Whether anisotropic filtering is available */
  anisotropyAvailable: boolean;
  /** Maximum anisotropy level */
  maxAnisotropy: number;
  /** Whether float textures are available */
  floatTexturesAvailable: boolean;
  /** Whether instancing is available */
  instancingAvailable: boolean;
}

/**
 * WebGL quality settings
 */
export interface WebGLQualitySettings {
  /** Pixel ratio for rendering (affects sharpness) */
  pixelRatio: number;
  /** Anti-aliasing enabled */
  antialias: boolean;
  /** Shadow map enabled */
  shadows: boolean;
  /** Shadow map resolution */
  shadowMapSize: number;
  /** Enable postprocessing effects */
  postProcessing: boolean;
  /** Maximum texture resolution */
  maxTextureResolution: number;
  /** Enable particle effects */
  particles: boolean;
  /** Maximum particle count */
  maxParticles: number;
}

/**
 * WebGL context state and methods
 */
export interface WebGLContextType {
  /** Detected WebGL capabilities */
  capabilities: WebGLCapabilities;
  /** Current quality settings */
  qualitySettings: WebGLQualitySettings;
  /** Current quality preset */
  qualityPreset: QualityPreset;
  /** Whether WebGL context has been lost */
  contextLost: boolean;
  /** Whether the provider is ready */
  isReady: boolean;

  // Methods
  /** Set quality preset */
  setQualityPreset: (preset: QualityPreset) => void;
  /** Set custom quality settings */
  setQualitySettings: (settings: Partial<WebGLQualitySettings>) => void;
  /** Request WebGL context restoration */
  requestContextRestore: () => void;
  /** Get appropriate texture size based on quality */
  getTextureSize: (idealSize: number) => number;
  /** Check if a feature is available */
  isFeatureAvailable: (feature: keyof WebGLCapabilities) => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CAPABILITIES: WebGLCapabilities = {
  webglAvailable: false,
  webgl2Available: false,
  maxTextureSize: 2048,
  maxCubeMapSize: 2048,
  maxRenderBufferSize: 2048,
  maxVertexUniforms: 256,
  maxFragmentUniforms: 256,
  maxTextureUnits: 8,
  renderer: 'Unknown',
  vendor: 'Unknown',
  anisotropyAvailable: false,
  maxAnisotropy: 1,
  floatTexturesAvailable: false,
  instancingAvailable: false,
};

const QUALITY_PRESETS: Record<QualityPreset, WebGLQualitySettings> = {
  low: {
    pixelRatio: 1,
    antialias: false,
    shadows: false,
    shadowMapSize: 512,
    postProcessing: false,
    maxTextureResolution: 512,
    particles: false,
    maxParticles: 0,
  },
  medium: {
    pixelRatio: Math.min(window.devicePixelRatio, 1.5),
    antialias: true,
    shadows: false,
    shadowMapSize: 1024,
    postProcessing: true,
    maxTextureResolution: 1024,
    particles: true,
    maxParticles: 500,
  },
  high: {
    pixelRatio: Math.min(window.devicePixelRatio, 2),
    antialias: true,
    shadows: true,
    shadowMapSize: 2048,
    postProcessing: true,
    maxTextureResolution: 2048,
    particles: true,
    maxParticles: 2000,
  },
  ultra: {
    pixelRatio: window.devicePixelRatio,
    antialias: true,
    shadows: true,
    shadowMapSize: 4096,
    postProcessing: true,
    maxTextureResolution: 4096,
    particles: true,
    maxParticles: 10000,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect WebGL capabilities from the browser
 */
function detectCapabilities(): WebGLCapabilities {
  const capabilities = { ...DEFAULT_CAPABILITIES };

  // Try to create a WebGL context
  const canvas = document.createElement('canvas');

  // Try WebGL 2 first
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = canvas.getContext('webgl2');
  if (gl) {
    capabilities.webgl2Available = true;
    capabilities.webglAvailable = true;
    capabilities.instancingAvailable = true;
  } else {
    // Fall back to WebGL 1
    gl = canvas.getContext('webgl');
    if (gl) {
      capabilities.webglAvailable = true;
      // Check for instancing extension in WebGL 1
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      capabilities.instancingAvailable = !!ext;
    }
  }

  if (!gl) {
    return capabilities;
  }

  // Query capabilities
  capabilities.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  capabilities.maxCubeMapSize = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
  capabilities.maxRenderBufferSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  capabilities.maxVertexUniforms = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  capabilities.maxFragmentUniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  capabilities.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

  // Get GPU info via debug extension
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  if (debugInfo) {
    capabilities.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    capabilities.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  }

  // Check for anisotropic filtering
  const anisotropyExt =
    gl.getExtension('EXT_texture_filter_anisotropic') ||
    gl.getExtension('MOZ_EXT_texture_filter_anisotropic') ||
    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
  if (anisotropyExt) {
    capabilities.anisotropyAvailable = true;
    capabilities.maxAnisotropy = gl.getParameter(
      anisotropyExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT
    );
  }

  // Check for float textures
  capabilities.floatTexturesAvailable = !!gl.getExtension('OES_texture_float');

  return capabilities;
}

/**
 * Determine best quality preset based on capabilities
 */
function determineBestQuality(capabilities: WebGLCapabilities): QualityPreset {
  if (!capabilities.webglAvailable) {
    return 'low';
  }

  // Score based on capabilities
  let score = 0;

  if (capabilities.webgl2Available) score += 2;
  if (capabilities.maxTextureSize >= 4096) score += 2;
  if (capabilities.maxTextureSize >= 8192) score += 1;
  if (capabilities.anisotropyAvailable) score += 1;
  if (capabilities.floatTexturesAvailable) score += 1;
  if (capabilities.instancingAvailable) score += 1;

  // Check for mobile/low-end GPU indicators
  const renderer = capabilities.renderer.toLowerCase();
  if (
    renderer.includes('mali') ||
    renderer.includes('adreno 3') ||
    renderer.includes('powervr')
  ) {
    score -= 2;
  }

  if (score >= 7) return 'ultra';
  if (score >= 5) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

// ============================================================================
// Context
// ============================================================================

const WebGLContext = createContext<WebGLContextType | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

export interface WebGLProviderProps {
  children: ReactNode;
  /** Initial quality preset (auto-detected if not specified) */
  initialQuality?: QualityPreset;
  /** Callback when context is lost */
  onContextLost?: () => void;
  /** Callback when context is restored */
  onContextRestored?: () => void;
}

export function WebGLProvider({
  children,
  initialQuality,
  onContextLost,
  onContextRestored,
}: WebGLProviderProps) {
  // Detect capabilities on mount
  const [capabilities, setCapabilities] = useState<WebGLCapabilities>(DEFAULT_CAPABILITIES);
  const [isReady, setIsReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Determine initial quality
  const [qualityPreset, setQualityPresetState] = useState<QualityPreset>(
    initialQuality || 'medium'
  );
  const [qualitySettings, setQualitySettingsState] = useState<WebGLQualitySettings>(
    QUALITY_PRESETS[initialQuality || 'medium']
  );

  // Detect capabilities on mount
  useEffect(() => {
    const detected = detectCapabilities();
    setCapabilities(detected);

    // Auto-detect quality if not specified
    if (!initialQuality) {
      const bestQuality = determineBestQuality(detected);
      setQualityPresetState(bestQuality);
      setQualitySettingsState(QUALITY_PRESETS[bestQuality]);
    }

    setIsReady(true);
  }, [initialQuality]);

  // Listen for context lost/restored events
  useEffect(() => {
    const handleContextLost = () => {
      setContextLost(true);
      onContextLost?.();
    };

    const handleContextRestored = () => {
      setContextLost(false);
      onContextRestored?.();
    };

    // These would be attached to the actual WebGL canvas in a real implementation
    window.addEventListener('webglcontextlost', handleContextLost);
    window.addEventListener('webglcontextrestored', handleContextRestored);

    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
      window.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [onContextLost, onContextRestored]);

  // Set quality preset
  const setQualityPreset = useCallback((preset: QualityPreset) => {
    setQualityPresetState(preset);
    setQualitySettingsState(QUALITY_PRESETS[preset]);
  }, []);

  // Set custom quality settings
  const setQualitySettings = useCallback((settings: Partial<WebGLQualitySettings>) => {
    setQualitySettingsState((prev) => ({ ...prev, ...settings }));
    setQualityPresetState('medium'); // Mark as custom
  }, []);

  // Request context restore (placeholder - actual implementation depends on renderer)
  const requestContextRestore = useCallback(() => {
    // In a real implementation, this would trigger WebGL context restoration
    console.log('Context restore requested');
  }, []);

  // Get appropriate texture size based on quality
  const getTextureSize = useCallback(
    (idealSize: number): number => {
      const maxSize = Math.min(qualitySettings.maxTextureResolution, capabilities.maxTextureSize);
      return Math.min(idealSize, maxSize);
    },
    [qualitySettings.maxTextureResolution, capabilities.maxTextureSize]
  );

  // Check if a feature is available
  const isFeatureAvailable = useCallback(
    (feature: keyof WebGLCapabilities): boolean => {
      const value = capabilities[feature];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'number') return value > 0;
      return !!value;
    },
    [capabilities]
  );

  const value: WebGLContextType = {
    capabilities,
    qualitySettings,
    qualityPreset,
    contextLost,
    isReady,
    setQualityPreset,
    setQualitySettings,
    requestContextRestore,
    getTextureSize,
    isFeatureAvailable,
  };

  return <WebGLContext.Provider value={value}>{children}</WebGLContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access WebGL context
 * @throws Error if used outside WebGLProvider
 */
export function useWebGL(): WebGLContextType {
  const context = useContext(WebGLContext);
  if (!context) {
    throw new Error('useWebGL must be used within a WebGLProvider');
  }
  return context;
}

/**
 * Hook to access WebGL context (safe version that returns null if outside provider)
 */
export function useWebGLSafe(): WebGLContextType | null {
  return useContext(WebGLContext);
}

// ============================================================================
// Exports
// ============================================================================

export { WebGLContext, QUALITY_PRESETS, DEFAULT_CAPABILITIES };
export type { QualityPreset as WebGLQualityPreset };
