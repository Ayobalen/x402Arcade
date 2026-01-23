/**
 * WebGL Capability Detection Utilities
 *
 * Detects WebGL support and capabilities of the user's device/browser.
 * Used to determine optimal rendering settings and graceful degradation.
 *
 * @module utils/webglCapabilities
 */

// ============================================================================
// Types
// ============================================================================

/**
 * WebGL version support status
 */
export interface WebGLVersionSupport {
  /** WebGL 1 is supported */
  webgl1: boolean
  /** WebGL 2 is supported */
  webgl2: boolean
  /** Highest supported version (null if none) */
  highestVersion: 1 | 2 | null
  /** The WebGL rendering context type available */
  contextType: 'webgl2' | 'webgl' | 'experimental-webgl' | null
}

/**
 * WebGL hardware limits
 */
export interface WebGLLimits {
  /** Maximum texture size in pixels */
  maxTextureSize: number
  /** Maximum cube map texture size in pixels */
  maxCubeMapTextureSize: number
  /** Maximum renderbuffer size */
  maxRenderbufferSize: number
  /** Maximum vertex attributes */
  maxVertexAttribs: number
  /** Maximum vertex uniform vectors */
  maxVertexUniformVectors: number
  /** Maximum fragment uniform vectors */
  maxFragmentUniformVectors: number
  /** Maximum varying vectors */
  maxVaryingVectors: number
  /** Maximum texture image units */
  maxTextureImageUnits: number
  /** Maximum vertex texture image units */
  maxVertexTextureImageUnits: number
  /** Maximum combined texture image units */
  maxCombinedTextureImageUnits: number
  /** Maximum viewport dimensions */
  maxViewportDims: [number, number]
  /** Aliased line width range */
  aliasedLineWidthRange: [number, number]
  /** Aliased point size range */
  aliasedPointSizeRange: [number, number]
  /** Maximum anisotropy (0 if not supported) */
  maxAnisotropy: number
  /** Maximum samples for multisampling */
  maxSamples: number
  /** Maximum draw buffers (MRT) */
  maxDrawBuffers: number
  /** Maximum color attachments */
  maxColorAttachments: number
  /** GPU vendor string */
  vendor: string
  /** GPU renderer string */
  renderer: string
  /** GLSL version string */
  glslVersion: string
}

/**
 * Common WebGL extensions and their support status
 */
export interface WebGLExtensionSupport {
  /** Anisotropic filtering */
  anisotropicFiltering: boolean
  /** Depth textures */
  depthTexture: boolean
  /** Floating point textures */
  floatTextures: boolean
  /** Half-float textures */
  halfFloatTextures: boolean
  /** Float texture filtering */
  floatTextureLinear: boolean
  /** Half-float texture filtering */
  halfFloatTextureLinear: boolean
  /** Instanced rendering */
  instancedArrays: boolean
  /** Vertex array objects */
  vertexArrayObject: boolean
  /** Shader texture LOD */
  shaderTextureLOD: boolean
  /** Standard derivatives (dFdx, dFdy, fwidth) */
  standardDerivatives: boolean
  /** Blend minmax */
  blendMinMax: boolean
  /** sRGB support */
  sRGB: boolean
  /** Draw buffers (MRT) */
  drawBuffers: boolean
  /** Compressed textures (S3TC) */
  compressedTextureS3TC: boolean
  /** Compressed textures (ETC1) */
  compressedTextureETC1: boolean
  /** Compressed textures (PVRTC) */
  compressedTexturePVRTC: boolean
  /** Compressed textures (ASTC) */
  compressedTextureASTC: boolean
  /** Parallel shader compile */
  parallelShaderCompile: boolean
  /** Debug renderer info (gives GPU name) */
  debugRendererInfo: boolean
  /** List of all supported extension names */
  supportedExtensions: string[]
}

/**
 * Overall WebGL capability report
 */
export interface WebGLCapabilities {
  /** Whether any WebGL is supported */
  supported: boolean
  /** Version support details */
  version: WebGLVersionSupport
  /** Hardware limits */
  limits: WebGLLimits
  /** Extension support */
  extensions: WebGLExtensionSupport
  /** Estimated performance tier (1=low, 2=medium, 3=high) */
  performanceTier: 1 | 2 | 3
  /** Recommended quality settings based on capabilities */
  recommendedQuality: 'low' | 'medium' | 'high' | 'ultra'
  /** Whether this is likely a mobile GPU */
  isMobile: boolean
  /** Any issues detected */
  issues: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a temporary canvas for WebGL context creation
 */
function createTestCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas
}

/**
 * Attempts to get a WebGL 2 context
 */
function getWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContext | null {
  try {
    return canvas.getContext('webgl2') as WebGL2RenderingContext | null
  } catch {
    return null
  }
}

/**
 * Attempts to get a WebGL 1 context
 */
function getWebGL1Context(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  try {
    return (
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    )
  } catch {
    return null
  }
}

/**
 * Gets the anisotropic filtering extension
 */
function getAnisotropicExtension(
  gl: WebGLRenderingContext | WebGL2RenderingContext
): EXT_texture_filter_anisotropic | null {
  return (
    gl.getExtension('EXT_texture_filter_anisotropic') ||
    gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
    gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
  )
}

/**
 * Detects if this is likely a mobile GPU
 */
function detectMobile(renderer: string): boolean {
  const mobilePatterns = [
    /adreno/i,
    /mali/i,
    /powervr/i,
    /apple gpu/i,
    /apple m/i,
    /sgx/i,
    /tegra/i,
    /videocore/i,
    /vivante/i,
  ]
  return mobilePatterns.some((pattern) => pattern.test(renderer))
}

/**
 * Estimates performance tier based on capabilities
 */
function estimatePerformanceTier(
  limits: WebGLLimits,
  extensions: WebGLExtensionSupport,
  isWebGL2: boolean
): 1 | 2 | 3 {
  let score = 0

  // Base score for WebGL version
  if (isWebGL2) score += 3
  else score += 1

  // Texture size score
  if (limits.maxTextureSize >= 16384) score += 3
  else if (limits.maxTextureSize >= 8192) score += 2
  else if (limits.maxTextureSize >= 4096) score += 1

  // Extension score
  if (extensions.floatTextures) score += 1
  if (extensions.floatTextureLinear) score += 1
  if (extensions.instancedArrays) score += 1
  if (extensions.anisotropicFiltering && limits.maxAnisotropy >= 8) score += 1
  if (extensions.parallelShaderCompile) score += 1

  // MRT support
  if (limits.maxDrawBuffers >= 4) score += 1

  // Classify into tiers
  if (score >= 10) return 3 // High
  if (score >= 5) return 2 // Medium
  return 1 // Low
}

/**
 * Determines recommended quality based on tier and limits
 */
function getRecommendedQuality(
  tier: 1 | 2 | 3,
  limits: WebGLLimits,
  isMobile: boolean
): 'low' | 'medium' | 'high' | 'ultra' {
  // Mobile always caps at medium
  if (isMobile) {
    return tier >= 2 ? 'medium' : 'low'
  }

  // Desktop based on tier
  switch (tier) {
    case 3:
      return limits.maxTextureSize >= 16384 ? 'ultra' : 'high'
    case 2:
      return 'medium'
    case 1:
    default:
      return 'low'
  }
}

// ============================================================================
// Main Detection Function
// ============================================================================

/**
 * Default capabilities for SSR or when WebGL is unavailable
 */
const DEFAULT_CAPABILITIES: WebGLCapabilities = {
  supported: false,
  version: {
    webgl1: false,
    webgl2: false,
    highestVersion: null,
    contextType: null,
  },
  limits: {
    maxTextureSize: 0,
    maxCubeMapTextureSize: 0,
    maxRenderbufferSize: 0,
    maxVertexAttribs: 0,
    maxVertexUniformVectors: 0,
    maxFragmentUniformVectors: 0,
    maxVaryingVectors: 0,
    maxTextureImageUnits: 0,
    maxVertexTextureImageUnits: 0,
    maxCombinedTextureImageUnits: 0,
    maxViewportDims: [0, 0],
    aliasedLineWidthRange: [0, 0],
    aliasedPointSizeRange: [0, 0],
    maxAnisotropy: 0,
    maxSamples: 0,
    maxDrawBuffers: 0,
    maxColorAttachments: 0,
    vendor: 'Unknown',
    renderer: 'Unknown',
    glslVersion: 'Unknown',
  },
  extensions: {
    anisotropicFiltering: false,
    depthTexture: false,
    floatTextures: false,
    halfFloatTextures: false,
    floatTextureLinear: false,
    halfFloatTextureLinear: false,
    instancedArrays: false,
    vertexArrayObject: false,
    shaderTextureLOD: false,
    standardDerivatives: false,
    blendMinMax: false,
    sRGB: false,
    drawBuffers: false,
    compressedTextureS3TC: false,
    compressedTextureETC1: false,
    compressedTexturePVRTC: false,
    compressedTextureASTC: false,
    parallelShaderCompile: false,
    debugRendererInfo: false,
    supportedExtensions: [],
  },
  performanceTier: 1,
  recommendedQuality: 'low',
  isMobile: false,
  issues: ['WebGL not supported'],
}

/**
 * Detects WebGL capabilities of the current device/browser
 *
 * @returns Complete capability report
 *
 * @example
 * ```tsx
 * const caps = detectWebGLCapabilities()
 * if (!caps.supported) {
 *   console.error('WebGL not supported:', caps.issues)
 * } else {
 *   console.log(`WebGL ${caps.version.highestVersion} available`)
 *   console.log(`Recommended quality: ${caps.recommendedQuality}`)
 * }
 * ```
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  // SSR check
  if (typeof window === 'undefined') {
    return DEFAULT_CAPABILITIES
  }

  const canvas = createTestCanvas()
  if (!canvas) {
    return DEFAULT_CAPABILITIES
  }

  const issues: string[] = []

  // Try WebGL 2 first
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = getWebGL2Context(canvas)
  let isWebGL2 = gl !== null
  let contextType: WebGLCapabilities['version']['contextType'] = isWebGL2 ? 'webgl2' : null

  // Fall back to WebGL 1
  if (!gl) {
    gl = getWebGL1Context(canvas)
    if (gl) {
      contextType = 'webgl'
    }
  }

  if (!gl) {
    return {
      ...DEFAULT_CAPABILITIES,
      issues: ['WebGL context creation failed'],
    }
  }

  // Version support
  const version: WebGLVersionSupport = {
    webgl1: true,
    webgl2: isWebGL2,
    highestVersion: isWebGL2 ? 2 : 1,
    contextType,
  }

  // Get debug info extension for vendor/renderer
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown'
    : gl.getParameter(gl.VENDOR) || 'Unknown'
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown'
    : gl.getParameter(gl.RENDERER) || 'Unknown'

  // Get GLSL version
  const glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown'

  // Anisotropic filtering
  const anisotropicExt = getAnisotropicExtension(gl)
  const maxAnisotropy = anisotropicExt
    ? gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
    : 0

  // Get limits
  const viewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [0, 0]
  const lineWidthRange = gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE) || [0, 0]
  const pointSizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) || [0, 0]

  // WebGL 2 specific parameters
  let maxSamples = 0
  let maxDrawBuffers = 1
  let maxColorAttachments = 1

  if (isWebGL2) {
    const gl2 = gl as WebGL2RenderingContext
    maxSamples = gl2.getParameter(gl2.MAX_SAMPLES) || 0
    maxDrawBuffers = gl2.getParameter(gl2.MAX_DRAW_BUFFERS) || 1
    maxColorAttachments = gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS) || 1
  } else {
    // Check for WebGL 1 draw buffers extension
    const drawBuffersExt = gl.getExtension('WEBGL_draw_buffers')
    if (drawBuffersExt) {
      maxDrawBuffers = gl.getParameter(drawBuffersExt.MAX_DRAW_BUFFERS_WEBGL) || 1
      maxColorAttachments = gl.getParameter(drawBuffersExt.MAX_COLOR_ATTACHMENTS_WEBGL) || 1
    }
  }

  const limits: WebGLLimits = {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0,
    maxCubeMapTextureSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) || 0,
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0,
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0,
    maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS) || 0,
    maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS) || 0,
    maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS) || 0,
    maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) || 0,
    maxVertexTextureImageUnits: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) || 0,
    maxCombinedTextureImageUnits: gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS) || 0,
    maxViewportDims: [viewportDims[0], viewportDims[1]],
    aliasedLineWidthRange: [lineWidthRange[0], lineWidthRange[1]],
    aliasedPointSizeRange: [pointSizeRange[0], pointSizeRange[1]],
    maxAnisotropy,
    maxSamples,
    maxDrawBuffers,
    maxColorAttachments,
    vendor,
    renderer,
    glslVersion,
  }

  // Get all supported extensions
  const supportedExtensions = gl.getSupportedExtensions() || []

  // Check specific extensions
  const extensions: WebGLExtensionSupport = {
    anisotropicFiltering: anisotropicExt !== null,
    depthTexture: isWebGL2 || gl.getExtension('WEBGL_depth_texture') !== null,
    floatTextures: isWebGL2 || gl.getExtension('OES_texture_float') !== null,
    halfFloatTextures: isWebGL2 || gl.getExtension('OES_texture_half_float') !== null,
    floatTextureLinear: gl.getExtension('OES_texture_float_linear') !== null,
    halfFloatTextureLinear:
      isWebGL2 || gl.getExtension('OES_texture_half_float_linear') !== null,
    instancedArrays: isWebGL2 || gl.getExtension('ANGLE_instanced_arrays') !== null,
    vertexArrayObject: isWebGL2 || gl.getExtension('OES_vertex_array_object') !== null,
    shaderTextureLOD: isWebGL2 || gl.getExtension('EXT_shader_texture_lod') !== null,
    standardDerivatives: isWebGL2 || gl.getExtension('OES_standard_derivatives') !== null,
    blendMinMax: isWebGL2 || gl.getExtension('EXT_blend_minmax') !== null,
    sRGB: isWebGL2 || gl.getExtension('EXT_sRGB') !== null,
    drawBuffers: isWebGL2 || gl.getExtension('WEBGL_draw_buffers') !== null,
    compressedTextureS3TC:
      gl.getExtension('WEBGL_compressed_texture_s3tc') !== null ||
      gl.getExtension('WEBGL_compressed_texture_s3tc_srgb') !== null,
    compressedTextureETC1:
      gl.getExtension('WEBGL_compressed_texture_etc1') !== null ||
      gl.getExtension('WEBGL_compressed_texture_etc') !== null,
    compressedTexturePVRTC: gl.getExtension('WEBGL_compressed_texture_pvrtc') !== null,
    compressedTextureASTC: gl.getExtension('WEBGL_compressed_texture_astc') !== null,
    parallelShaderCompile: gl.getExtension('KHR_parallel_shader_compile') !== null,
    debugRendererInfo: debugInfo !== null,
    supportedExtensions,
  }

  // Check for potential issues
  if (limits.maxTextureSize < 4096) {
    issues.push('Low max texture size - some textures may not render')
  }
  if (!extensions.floatTextures) {
    issues.push('Float textures not supported - some effects may be limited')
  }
  if (!isWebGL2 && !extensions.instancedArrays) {
    issues.push('Instanced rendering not supported - performance may be reduced')
  }

  // Detect mobile
  const isMobile = detectMobile(renderer)

  // Calculate performance tier
  const performanceTier = estimatePerformanceTier(limits, extensions, isWebGL2)

  // Get recommended quality
  const recommendedQuality = getRecommendedQuality(performanceTier, limits, isMobile)

  // Clean up
  const loseContextExt = gl.getExtension('WEBGL_lose_context')
  if (loseContextExt) {
    loseContextExt.loseContext()
  }

  return {
    supported: true,
    version,
    limits,
    extensions,
    performanceTier,
    recommendedQuality,
    isMobile,
    issues,
  }
}

/**
 * Quick check if WebGL is available at all
 *
 * @returns true if any WebGL version is supported
 */
export function isWebGLAvailable(): boolean {
  if (typeof window === 'undefined') return false

  const canvas = createTestCanvas()
  if (!canvas) return false

  const gl = getWebGL2Context(canvas) || getWebGL1Context(canvas)
  return gl !== null
}

/**
 * Quick check if WebGL 2 is available
 *
 * @returns true if WebGL 2 is supported
 */
export function isWebGL2Available(): boolean {
  if (typeof window === 'undefined') return false

  const canvas = createTestCanvas()
  if (!canvas) return false

  return getWebGL2Context(canvas) !== null
}

/**
 * Get a simple capability summary string
 *
 * @returns Human-readable summary of WebGL capabilities
 */
export function getCapabilitySummary(): string {
  const caps = detectWebGLCapabilities()

  if (!caps.supported) {
    return 'WebGL not supported'
  }

  const parts = [
    `WebGL ${caps.version.highestVersion}`,
    caps.limits.renderer,
    `Max Texture: ${caps.limits.maxTextureSize}px`,
    `Quality: ${caps.recommendedQuality}`,
    caps.isMobile ? 'Mobile GPU' : 'Desktop GPU',
  ]

  return parts.join(' | ')
}

// ============================================================================
// Exports
// ============================================================================

export default detectWebGLCapabilities
