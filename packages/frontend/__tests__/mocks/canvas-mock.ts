/**
 * Canvas and WebGL Mock Utilities
 *
 * Provides comprehensive mocks for HTML5 Canvas and WebGL APIs for testing
 * game rendering code. Compatible with Three.js and 2D canvas games.
 *
 * @module __tests__/mocks/canvas-mock
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Configuration options for mock canvas
 */
export interface MockCanvasConfig {
  width?: number;
  height?: number;
  contextType?: '2d' | 'webgl' | 'webgl2' | 'bitmaprenderer';
  supportedContexts?: Array<'2d' | 'webgl' | 'webgl2' | 'bitmaprenderer'>;
  /** If true, getContext returns null (simulates unsupported context) */
  failGetContext?: boolean;
  /** Custom attributes for context creation */
  contextAttributes?: WebGLContextAttributes | CanvasRenderingContext2DSettings;
}

/**
 * Call record for tracking canvas operations
 */
export interface CanvasCallRecord {
  method: string;
  args: unknown[];
  timestamp: number;
}

/**
 * Configuration for mock 2D context
 */
export interface Mock2DContextConfig {
  /** Simulate image smoothing */
  imageSmoothingEnabled?: boolean;
  /** Simulate line cap */
  lineCap?: CanvasLineCap;
  /** Simulate line join */
  lineJoin?: CanvasLineJoin;
  /** Line width */
  lineWidth?: number;
  /** Fill style */
  fillStyle?: string;
  /** Stroke style */
  strokeStyle?: string;
  /** Font */
  font?: string;
  /** Text align */
  textAlign?: CanvasTextAlign;
  /** Text baseline */
  textBaseline?: CanvasTextBaseline;
  /** Global alpha */
  globalAlpha?: number;
  /** Global composite operation */
  globalCompositeOperation?: GlobalCompositeOperation;
}

/**
 * WebGL extension name types
 */
export type WebGLExtensionName =
  | 'ANGLE_instanced_arrays'
  | 'EXT_blend_minmax'
  | 'EXT_color_buffer_float'
  | 'EXT_color_buffer_half_float'
  | 'EXT_disjoint_timer_query'
  | 'EXT_float_blend'
  | 'EXT_frag_depth'
  | 'EXT_shader_texture_lod'
  | 'EXT_sRGB'
  | 'EXT_texture_filter_anisotropic'
  | 'OES_element_index_uint'
  | 'OES_fbo_render_mipmap'
  | 'OES_standard_derivatives'
  | 'OES_texture_float'
  | 'OES_texture_float_linear'
  | 'OES_texture_half_float'
  | 'OES_texture_half_float_linear'
  | 'OES_vertex_array_object'
  | 'WEBGL_color_buffer_float'
  | 'WEBGL_compressed_texture_astc'
  | 'WEBGL_compressed_texture_etc'
  | 'WEBGL_compressed_texture_etc1'
  | 'WEBGL_compressed_texture_pvrtc'
  | 'WEBGL_compressed_texture_s3tc'
  | 'WEBGL_compressed_texture_s3tc_srgb'
  | 'WEBGL_debug_renderer_info'
  | 'WEBGL_debug_shaders'
  | 'WEBGL_depth_texture'
  | 'WEBGL_draw_buffers'
  | 'WEBGL_lose_context';

/**
 * Configuration for mock WebGL context
 */
export interface MockWebGLConfig {
  /** WebGL version (1 or 2) */
  version?: 1 | 2;
  /** Supported extensions */
  extensions?: WebGLExtensionName[];
  /** Max texture size */
  maxTextureSize?: number;
  /** Max viewport dimensions */
  maxViewportDims?: [number, number];
  /** Max vertex attributes */
  maxVertexAttribs?: number;
  /** Max texture units */
  maxTextureImageUnits?: number;
  /** Vendor string */
  vendor?: string;
  /** Renderer string */
  renderer?: string;
  /** If true, simulate context loss */
  simulateContextLoss?: boolean;
  /** Pixel ratio for device simulation */
  devicePixelRatio?: number;
}

/**
 * Performance mock configuration
 */
export interface MockPerformanceConfig {
  /** Starting timestamp */
  startTime?: number;
  /** Time increment per call */
  timeIncrement?: number;
  /** Whether to auto-increment time */
  autoIncrement?: boolean;
}

/**
 * Animation frame mock configuration
 */
export interface MockAnimationFrameConfig {
  /** Frame rate (frames per second) */
  frameRate?: number;
  /** Whether to auto-advance frames */
  autoAdvance?: boolean;
  /** Max frames to run before stopping */
  maxFrames?: number;
}

// ============================================================================
// MOCK 2D CONTEXT
// ============================================================================

/**
 * Creates a mock 2D rendering context with all standard methods stubbed
 */
export function createMock2DContext(
  canvas: HTMLCanvasElement,
  config: Mock2DContextConfig = {}
): CanvasRenderingContext2D {
  const callLog: CanvasCallRecord[] = [];

  const logCall = (method: string, ...args: unknown[]) => {
    callLog.push({ method, args, timestamp: Date.now() });
  };

  // State stack for save/restore
  const stateStack: Mock2DContextConfig[] = [];

  // Current state
  let currentState: Mock2DContextConfig = {
    imageSmoothingEnabled: config.imageSmoothingEnabled ?? true,
    lineCap: config.lineCap ?? 'butt',
    lineJoin: config.lineJoin ?? 'miter',
    lineWidth: config.lineWidth ?? 1,
    fillStyle: config.fillStyle ?? '#000000',
    strokeStyle: config.strokeStyle ?? '#000000',
    font: config.font ?? '10px sans-serif',
    textAlign: config.textAlign ?? 'start',
    textBaseline: config.textBaseline ?? 'alphabetic',
    globalAlpha: config.globalAlpha ?? 1,
    globalCompositeOperation: config.globalCompositeOperation ?? 'source-over',
  };

  // Path state
  let pathStarted = false;

  const context = {
    canvas,

    // Properties (getters/setters for state)
    get imageSmoothingEnabled() {
      return currentState.imageSmoothingEnabled!;
    },
    set imageSmoothingEnabled(value: boolean) {
      currentState.imageSmoothingEnabled = value;
    },

    get lineCap() {
      return currentState.lineCap!;
    },
    set lineCap(value: CanvasLineCap) {
      currentState.lineCap = value;
    },

    get lineJoin() {
      return currentState.lineJoin!;
    },
    set lineJoin(value: CanvasLineJoin) {
      currentState.lineJoin = value;
    },

    get lineWidth() {
      return currentState.lineWidth!;
    },
    set lineWidth(value: number) {
      currentState.lineWidth = value;
    },

    get fillStyle() {
      return currentState.fillStyle!;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      currentState.fillStyle = value as string;
    },

    get strokeStyle() {
      return currentState.strokeStyle!;
    },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      currentState.strokeStyle = value as string;
    },

    get font() {
      return currentState.font!;
    },
    set font(value: string) {
      currentState.font = value;
    },

    get textAlign() {
      return currentState.textAlign!;
    },
    set textAlign(value: CanvasTextAlign) {
      currentState.textAlign = value;
    },

    get textBaseline() {
      return currentState.textBaseline!;
    },
    set textBaseline(value: CanvasTextBaseline) {
      currentState.textBaseline = value;
    },

    get globalAlpha() {
      return currentState.globalAlpha!;
    },
    set globalAlpha(value: number) {
      currentState.globalAlpha = value;
    },

    get globalCompositeOperation() {
      return currentState.globalCompositeOperation!;
    },
    set globalCompositeOperation(value: GlobalCompositeOperation) {
      currentState.globalCompositeOperation = value;
    },

    // State methods
    save() {
      logCall('save');
      stateStack.push({ ...currentState });
    },
    restore() {
      logCall('restore');
      if (stateStack.length > 0) {
        currentState = stateStack.pop()!;
      }
    },

    // Transform methods
    scale(x: number, y: number) {
      logCall('scale', x, y);
    },
    rotate(angle: number) {
      logCall('rotate', angle);
    },
    translate(x: number, y: number) {
      logCall('translate', x, y);
    },
    transform(a: number, b: number, c: number, d: number, e: number, f: number) {
      logCall('transform', a, b, c, d, e, f);
    },
    setTransform(
      a: number | DOMMatrix2DInit,
      b?: number,
      c?: number,
      d?: number,
      e?: number,
      f?: number
    ) {
      logCall('setTransform', a, b, c, d, e, f);
    },
    resetTransform() {
      logCall('resetTransform');
    },
    getTransform(): DOMMatrix {
      logCall('getTransform');
      return new DOMMatrix([1, 0, 0, 1, 0, 0]);
    },

    // Compositing
    // (handled via property setters above)

    // Image smoothing
    // (handled via property setters above)

    // Stroke/fill styles
    createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
      logCall('createLinearGradient', x0, y0, x1, y1);
      return createMockGradient();
    },
    createRadialGradient(
      x0: number,
      y0: number,
      r0: number,
      x1: number,
      y1: number,
      r1: number
    ) {
      logCall('createRadialGradient', x0, y0, r0, x1, y1, r1);
      return createMockGradient();
    },
    createConicGradient(startAngle: number, x: number, y: number) {
      logCall('createConicGradient', startAngle, x, y);
      return createMockGradient();
    },
    createPattern(
      image: CanvasImageSource,
      repetition: string | null
    ): CanvasPattern | null {
      logCall('createPattern', image, repetition);
      return createMockPattern();
    },

    // Shadows
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    shadowOffsetX: 0,
    shadowOffsetY: 0,

    // Filters
    filter: 'none',

    // Rectangle methods
    fillRect(x: number, y: number, width: number, height: number) {
      logCall('fillRect', x, y, width, height);
    },
    strokeRect(x: number, y: number, width: number, height: number) {
      logCall('strokeRect', x, y, width, height);
    },
    clearRect(x: number, y: number, width: number, height: number) {
      logCall('clearRect', x, y, width, height);
    },

    // Path methods
    beginPath() {
      logCall('beginPath');
      pathStarted = true;
    },
    closePath() {
      logCall('closePath');
    },
    moveTo(x: number, y: number) {
      logCall('moveTo', x, y);
    },
    lineTo(x: number, y: number) {
      logCall('lineTo', x, y);
    },
    bezierCurveTo(
      cp1x: number,
      cp1y: number,
      cp2x: number,
      cp2y: number,
      x: number,
      y: number
    ) {
      logCall('bezierCurveTo', cp1x, cp1y, cp2x, cp2y, x, y);
    },
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number) {
      logCall('quadraticCurveTo', cpx, cpy, x, y);
    },
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      counterclockwise?: boolean
    ) {
      logCall('arc', x, y, radius, startAngle, endAngle, counterclockwise);
    },
    arcTo(x1: number, y1: number, x2: number, y2: number, radius: number) {
      logCall('arcTo', x1, y1, x2, y2, radius);
    },
    ellipse(
      x: number,
      y: number,
      radiusX: number,
      radiusY: number,
      rotation: number,
      startAngle: number,
      endAngle: number,
      counterclockwise?: boolean
    ) {
      logCall(
        'ellipse',
        x,
        y,
        radiusX,
        radiusY,
        rotation,
        startAngle,
        endAngle,
        counterclockwise
      );
    },
    rect(x: number, y: number, width: number, height: number) {
      logCall('rect', x, y, width, height);
    },
    roundRect(
      x: number,
      y: number,
      width: number,
      height: number,
      radii?: number | DOMPointInit | Iterable<number | DOMPointInit>
    ) {
      logCall('roundRect', x, y, width, height, radii);
    },
    fill(fillRule?: CanvasFillRule | Path2D, fillRuleOrUndefined?: CanvasFillRule) {
      logCall('fill', fillRule, fillRuleOrUndefined);
    },
    stroke(path?: Path2D) {
      logCall('stroke', path);
    },
    clip(fillRule?: CanvasFillRule | Path2D, fillRuleOrUndefined?: CanvasFillRule) {
      logCall('clip', fillRule, fillRuleOrUndefined);
    },
    isPointInPath(
      x: number | Path2D,
      y: number,
      fillRule?: CanvasFillRule | number,
      fillRuleOrUndefined?: CanvasFillRule
    ): boolean {
      logCall('isPointInPath', x, y, fillRule, fillRuleOrUndefined);
      return false;
    },
    isPointInStroke(x: number | Path2D, y: number, yOrUndefined?: number): boolean {
      logCall('isPointInStroke', x, y, yOrUndefined);
      return false;
    },

    // Line styles
    // (handled via property setters)
    miterLimit: 10,
    lineDashOffset: 0,
    setLineDash(segments: number[]) {
      logCall('setLineDash', segments);
    },
    getLineDash(): number[] {
      logCall('getLineDash');
      return [];
    },

    // Text
    fillText(text: string, x: number, y: number, maxWidth?: number) {
      logCall('fillText', text, x, y, maxWidth);
    },
    strokeText(text: string, x: number, y: number, maxWidth?: number) {
      logCall('strokeText', text, x, y, maxWidth);
    },
    measureText(text: string): TextMetrics {
      logCall('measureText', text);
      return createMockTextMetrics(text);
    },

    // Drawing images
    drawImage(
      image: CanvasImageSource,
      sx: number,
      sy: number,
      sw?: number,
      sh?: number,
      dx?: number,
      dy?: number,
      dw?: number,
      dh?: number
    ) {
      logCall('drawImage', image, sx, sy, sw, sh, dx, dy, dw, dh);
    },

    // Pixel manipulation
    createImageData(
      sw: number | ImageData,
      sh?: number,
      settings?: ImageDataSettings
    ): ImageData {
      logCall('createImageData', sw, sh, settings);
      const width = typeof sw === 'number' ? sw : sw.width;
      const height = typeof sw === 'number' ? (sh ?? 1) : sw.height;
      return createMockImageData(width, height);
    },
    getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
      logCall('getImageData', sx, sy, sw, sh);
      return createMockImageData(sw, sh);
    },
    putImageData(
      imagedata: ImageData,
      dx: number,
      dy: number,
      dirtyX?: number,
      dirtyY?: number,
      dirtyWidth?: number,
      dirtyHeight?: number
    ) {
      logCall('putImageData', imagedata, dx, dy, dirtyX, dirtyY, dirtyWidth, dirtyHeight);
    },

    // Hit regions (deprecated but may still be used)
    addHitRegion(_options?: Record<string, unknown>) {
      logCall('addHitRegion', _options);
    },
    removeHitRegion(_id: string) {
      logCall('removeHitRegion', _id);
    },
    clearHitRegions() {
      logCall('clearHitRegions');
    },

    // Focus ring
    drawFocusIfNeeded(element: Element | Path2D, elementOrUndefined?: Element) {
      logCall('drawFocusIfNeeded', element, elementOrUndefined);
    },

    // Scrolling
    scrollPathIntoView(path?: Path2D) {
      logCall('scrollPathIntoView', path);
    },

    // Canvas state query
    getContextAttributes(): CanvasRenderingContext2DSettings {
      logCall('getContextAttributes');
      return {
        alpha: true,
        colorSpace: 'srgb',
        desynchronized: false,
        willReadFrequently: false,
      };
    },

    // Direction
    direction: 'inherit' as CanvasDirection,
    fontKerning: 'auto' as CanvasFontKerning,
    fontStretch: 'normal' as CanvasFontStretch,
    fontVariantCaps: 'normal' as CanvasFontVariantCaps,
    letterSpacing: '0px',
    textRendering: 'auto' as CanvasTextRendering,
    wordSpacing: '0px',

    // Test utilities (not part of standard API)
    __getCallLog: () => [...callLog],
    __clearCallLog: () => {
      callLog.length = 0;
    },
    __isPathStarted: () => pathStarted,
  } as unknown as CanvasRenderingContext2D & {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
    __isPathStarted: () => boolean;
  };

  return context;
}

// ============================================================================
// MOCK WEBGL CONTEXT
// ============================================================================

/**
 * Creates a mock WebGL rendering context compatible with Three.js
 */
export function createMockWebGLContext(
  canvas: HTMLCanvasElement,
  config: MockWebGLConfig = {}
): WebGLRenderingContext {
  const callLog: CanvasCallRecord[] = [];

  const logCall = (method: string, ...args: unknown[]) => {
    callLog.push({ method, args, timestamp: Date.now() });
  };

  const {
    version = 1,
    extensions = [
      'OES_texture_float',
      'OES_standard_derivatives',
      'OES_element_index_uint',
      'OES_vertex_array_object',
      'WEBGL_depth_texture',
      'ANGLE_instanced_arrays',
      'WEBGL_lose_context',
      'EXT_texture_filter_anisotropic',
      'WEBGL_debug_renderer_info',
    ],
    maxTextureSize = 4096,
    maxViewportDims = [4096, 4096],
    maxVertexAttribs = 16,
    maxTextureImageUnits = 16,
    vendor = 'Mock WebGL Vendor',
    renderer = 'Mock WebGL Renderer',
    simulateContextLoss = false,
  } = config;

  let contextLost = simulateContextLoss;
  let nextProgramId = 1;
  let nextShaderId = 1;
  let nextBufferId = 1;
  let nextTextureId = 1;
  let nextFramebufferId = 1;
  let nextRenderbufferId = 1;

  // WebGL constants
  const GL = {
    // Clearing
    COLOR_BUFFER_BIT: 0x4000,
    DEPTH_BUFFER_BIT: 0x100,
    STENCIL_BUFFER_BIT: 0x400,

    // Types
    BYTE: 0x1400,
    UNSIGNED_BYTE: 0x1401,
    SHORT: 0x1402,
    UNSIGNED_SHORT: 0x1403,
    INT: 0x1404,
    UNSIGNED_INT: 0x1405,
    FLOAT: 0x1406,

    // Shaders
    FRAGMENT_SHADER: 0x8b30,
    VERTEX_SHADER: 0x8b31,
    COMPILE_STATUS: 0x8b81,
    LINK_STATUS: 0x8b82,
    DELETE_STATUS: 0x8b80,
    VALIDATE_STATUS: 0x8b83,
    ATTACHED_SHADERS: 0x8b85,
    ACTIVE_ATTRIBUTES: 0x8b89,
    ACTIVE_UNIFORMS: 0x8b86,
    SHADER_TYPE: 0x8b4f,

    // Buffers
    ARRAY_BUFFER: 0x8892,
    ELEMENT_ARRAY_BUFFER: 0x8893,
    STATIC_DRAW: 0x88e4,
    DYNAMIC_DRAW: 0x88e8,
    STREAM_DRAW: 0x88e0,

    // Textures
    TEXTURE_2D: 0x0de1,
    TEXTURE0: 0x84c0,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MAG_FILTER: 0x2800,
    TEXTURE_MIN_FILTER: 0x2801,
    NEAREST: 0x2600,
    LINEAR: 0x2601,
    REPEAT: 0x2901,
    CLAMP_TO_EDGE: 0x812f,
    MIRRORED_REPEAT: 0x8370,
    RGBA: 0x1908,
    RGB: 0x1907,

    // Blend modes
    ZERO: 0,
    ONE: 1,
    SRC_COLOR: 0x300,
    ONE_MINUS_SRC_COLOR: 0x301,
    SRC_ALPHA: 0x302,
    ONE_MINUS_SRC_ALPHA: 0x303,
    DST_ALPHA: 0x304,
    ONE_MINUS_DST_ALPHA: 0x305,
    DST_COLOR: 0x306,
    ONE_MINUS_DST_COLOR: 0x307,

    // Enable/disable
    BLEND: 0x0be2,
    DEPTH_TEST: 0x0b71,
    CULL_FACE: 0x0b44,
    SCISSOR_TEST: 0x0c11,
    STENCIL_TEST: 0x0b90,
    DITHER: 0x0bd0,
    POLYGON_OFFSET_FILL: 0x8037,

    // Draw modes
    POINTS: 0x0,
    LINES: 0x1,
    LINE_LOOP: 0x2,
    LINE_STRIP: 0x3,
    TRIANGLES: 0x4,
    TRIANGLE_STRIP: 0x5,
    TRIANGLE_FAN: 0x6,

    // Framebuffer
    FRAMEBUFFER: 0x8d40,
    RENDERBUFFER: 0x8d41,
    COLOR_ATTACHMENT0: 0x8ce0,
    DEPTH_ATTACHMENT: 0x8d00,
    STENCIL_ATTACHMENT: 0x8d20,
    DEPTH_STENCIL_ATTACHMENT: 0x821a,
    FRAMEBUFFER_COMPLETE: 0x8cd5,

    // Errors
    NO_ERROR: 0,
    INVALID_ENUM: 0x500,
    INVALID_VALUE: 0x501,
    INVALID_OPERATION: 0x502,
    OUT_OF_MEMORY: 0x505,
    CONTEXT_LOST_WEBGL: 0x9242,

    // Parameters
    MAX_TEXTURE_SIZE: 0x0d33,
    MAX_VIEWPORT_DIMS: 0x0d3a,
    MAX_VERTEX_ATTRIBS: 0x8869,
    MAX_TEXTURE_IMAGE_UNITS: 0x8872,
    VENDOR: 0x1f00,
    RENDERER: 0x1f01,
    VERSION: 0x1f02,
    SHADING_LANGUAGE_VERSION: 0x8b8c,
  };

  const context = {
    canvas,

    // Constants (spread all GL constants)
    ...GL,

    // Drawing buffer
    drawingBufferWidth: canvas.width,
    drawingBufferHeight: canvas.height,

    // Context state
    getContextAttributes(): WebGLContextAttributes | null {
      logCall('getContextAttributes');
      return {
        alpha: true,
        antialias: true,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: 'default',
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
      };
    },

    isContextLost(): boolean {
      logCall('isContextLost');
      return contextLost;
    },

    // Extensions
    getSupportedExtensions(): string[] {
      logCall('getSupportedExtensions');
      return extensions;
    },

    getExtension(name: string): unknown {
      logCall('getExtension', name);
      if (!extensions.includes(name as WebGLExtensionName)) {
        return null;
      }
      // Return mock extension object
      return createMockExtension(name);
    },

    // Parameters
    getParameter(pname: number): unknown {
      logCall('getParameter', pname);
      switch (pname) {
        case GL.MAX_TEXTURE_SIZE:
          return maxTextureSize;
        case GL.MAX_VIEWPORT_DIMS:
          return new Int32Array(maxViewportDims);
        case GL.MAX_VERTEX_ATTRIBS:
          return maxVertexAttribs;
        case GL.MAX_TEXTURE_IMAGE_UNITS:
          return maxTextureImageUnits;
        case GL.VENDOR:
          return vendor;
        case GL.RENDERER:
          return renderer;
        case GL.VERSION:
          return version === 2 ? 'WebGL 2.0' : 'WebGL 1.0';
        case GL.SHADING_LANGUAGE_VERSION:
          return version === 2 ? 'WebGL GLSL ES 3.00' : 'WebGL GLSL ES 1.0';
        default:
          return null;
      }
    },

    getError(): number {
      logCall('getError');
      if (contextLost) return GL.CONTEXT_LOST_WEBGL;
      return GL.NO_ERROR;
    },

    // Viewport
    viewport(x: number, y: number, width: number, height: number) {
      logCall('viewport', x, y, width, height);
    },
    scissor(x: number, y: number, width: number, height: number) {
      logCall('scissor', x, y, width, height);
    },

    // Clearing
    clear(mask: number) {
      logCall('clear', mask);
    },
    clearColor(r: number, g: number, b: number, a: number) {
      logCall('clearColor', r, g, b, a);
    },
    clearDepth(depth: number) {
      logCall('clearDepth', depth);
    },
    clearStencil(s: number) {
      logCall('clearStencil', s);
    },

    // Enable/disable
    enable(cap: number) {
      logCall('enable', cap);
    },
    disable(cap: number) {
      logCall('disable', cap);
    },
    isEnabled(cap: number): boolean {
      logCall('isEnabled', cap);
      return false;
    },

    // Blending
    blendFunc(sfactor: number, dfactor: number) {
      logCall('blendFunc', sfactor, dfactor);
    },
    blendFuncSeparate(
      srcRGB: number,
      dstRGB: number,
      srcAlpha: number,
      dstAlpha: number
    ) {
      logCall('blendFuncSeparate', srcRGB, dstRGB, srcAlpha, dstAlpha);
    },
    blendEquation(mode: number) {
      logCall('blendEquation', mode);
    },
    blendEquationSeparate(modeRGB: number, modeAlpha: number) {
      logCall('blendEquationSeparate', modeRGB, modeAlpha);
    },
    blendColor(r: number, g: number, b: number, a: number) {
      logCall('blendColor', r, g, b, a);
    },

    // Depth
    depthFunc(func: number) {
      logCall('depthFunc', func);
    },
    depthMask(flag: boolean) {
      logCall('depthMask', flag);
    },
    depthRange(zNear: number, zFar: number) {
      logCall('depthRange', zNear, zFar);
    },

    // Culling
    cullFace(mode: number) {
      logCall('cullFace', mode);
    },
    frontFace(mode: number) {
      logCall('frontFace', mode);
    },

    // Stencil
    stencilFunc(func: number, ref: number, mask: number) {
      logCall('stencilFunc', func, ref, mask);
    },
    stencilFuncSeparate(face: number, func: number, ref: number, mask: number) {
      logCall('stencilFuncSeparate', face, func, ref, mask);
    },
    stencilMask(mask: number) {
      logCall('stencilMask', mask);
    },
    stencilMaskSeparate(face: number, mask: number) {
      logCall('stencilMaskSeparate', face, mask);
    },
    stencilOp(fail: number, zfail: number, zpass: number) {
      logCall('stencilOp', fail, zfail, zpass);
    },
    stencilOpSeparate(face: number, fail: number, zfail: number, zpass: number) {
      logCall('stencilOpSeparate', face, fail, zfail, zpass);
    },

    // Shaders
    createShader(type: number): WebGLShader | null {
      logCall('createShader', type);
      return { __id: nextShaderId++, __type: type } as unknown as WebGLShader;
    },
    shaderSource(_shader: WebGLShader, source: string) {
      logCall('shaderSource', _shader, source);
    },
    compileShader(shader: WebGLShader) {
      logCall('compileShader', shader);
    },
    getShaderParameter(_shader: WebGLShader, pname: number): unknown {
      logCall('getShaderParameter', _shader, pname);
      if (pname === GL.COMPILE_STATUS) return true;
      if (pname === GL.DELETE_STATUS) return false;
      if (pname === GL.SHADER_TYPE) return (_shader as unknown as { __type: number }).__type;
      return null;
    },
    getShaderInfoLog(_shader: WebGLShader): string | null {
      logCall('getShaderInfoLog', _shader);
      return '';
    },
    deleteShader(shader: WebGLShader) {
      logCall('deleteShader', shader);
    },

    // Programs
    createProgram(): WebGLProgram | null {
      logCall('createProgram');
      return { __id: nextProgramId++ } as unknown as WebGLProgram;
    },
    attachShader(program: WebGLProgram, shader: WebGLShader) {
      logCall('attachShader', program, shader);
    },
    detachShader(program: WebGLProgram, shader: WebGLShader) {
      logCall('detachShader', program, shader);
    },
    linkProgram(program: WebGLProgram) {
      logCall('linkProgram', program);
    },
    useProgram(program: WebGLProgram | null) {
      logCall('useProgram', program);
    },
    getProgramParameter(_program: WebGLProgram, pname: number): unknown {
      logCall('getProgramParameter', _program, pname);
      if (pname === GL.LINK_STATUS) return true;
      if (pname === GL.DELETE_STATUS) return false;
      if (pname === GL.VALIDATE_STATUS) return true;
      if (pname === GL.ATTACHED_SHADERS) return 2;
      if (pname === GL.ACTIVE_ATTRIBUTES) return 2;
      if (pname === GL.ACTIVE_UNIFORMS) return 4;
      return null;
    },
    getProgramInfoLog(_program: WebGLProgram): string | null {
      logCall('getProgramInfoLog', _program);
      return '';
    },
    validateProgram(program: WebGLProgram) {
      logCall('validateProgram', program);
    },
    deleteProgram(program: WebGLProgram) {
      logCall('deleteProgram', program);
    },

    // Uniforms
    getUniformLocation(
      _program: WebGLProgram,
      name: string
    ): WebGLUniformLocation | null {
      logCall('getUniformLocation', _program, name);
      return { __name: name } as unknown as WebGLUniformLocation;
    },
    getUniform(_program: WebGLProgram, _location: WebGLUniformLocation): unknown {
      logCall('getUniform', _program, _location);
      return null;
    },
    uniform1i(location: WebGLUniformLocation | null, x: number) {
      logCall('uniform1i', location, x);
    },
    uniform1f(location: WebGLUniformLocation | null, x: number) {
      logCall('uniform1f', location, x);
    },
    uniform2f(location: WebGLUniformLocation | null, x: number, y: number) {
      logCall('uniform2f', location, x, y);
    },
    uniform3f(
      location: WebGLUniformLocation | null,
      x: number,
      y: number,
      z: number
    ) {
      logCall('uniform3f', location, x, y, z);
    },
    uniform4f(
      location: WebGLUniformLocation | null,
      x: number,
      y: number,
      z: number,
      w: number
    ) {
      logCall('uniform4f', location, x, y, z, w);
    },
    uniform1iv(location: WebGLUniformLocation | null, v: Int32Array | number[]) {
      logCall('uniform1iv', location, v);
    },
    uniform1fv(location: WebGLUniformLocation | null, v: Float32Array | number[]) {
      logCall('uniform1fv', location, v);
    },
    uniform2fv(location: WebGLUniformLocation | null, v: Float32Array | number[]) {
      logCall('uniform2fv', location, v);
    },
    uniform3fv(location: WebGLUniformLocation | null, v: Float32Array | number[]) {
      logCall('uniform3fv', location, v);
    },
    uniform4fv(location: WebGLUniformLocation | null, v: Float32Array | number[]) {
      logCall('uniform4fv', location, v);
    },
    uniformMatrix2fv(
      location: WebGLUniformLocation | null,
      transpose: boolean,
      v: Float32Array | number[]
    ) {
      logCall('uniformMatrix2fv', location, transpose, v);
    },
    uniformMatrix3fv(
      location: WebGLUniformLocation | null,
      transpose: boolean,
      v: Float32Array | number[]
    ) {
      logCall('uniformMatrix3fv', location, transpose, v);
    },
    uniformMatrix4fv(
      location: WebGLUniformLocation | null,
      transpose: boolean,
      v: Float32Array | number[]
    ) {
      logCall('uniformMatrix4fv', location, transpose, v);
    },

    // Attributes
    getAttribLocation(_program: WebGLProgram, name: string): number {
      logCall('getAttribLocation', _program, name);
      return 0;
    },
    getActiveAttrib(
      _program: WebGLProgram,
      index: number
    ): WebGLActiveInfo | null {
      logCall('getActiveAttrib', _program, index);
      return { name: `attribute${index}`, size: 1, type: GL.FLOAT };
    },
    getActiveUniform(
      _program: WebGLProgram,
      index: number
    ): WebGLActiveInfo | null {
      logCall('getActiveUniform', _program, index);
      return { name: `uniform${index}`, size: 1, type: GL.FLOAT };
    },
    vertexAttribPointer(
      index: number,
      size: number,
      type: number,
      normalized: boolean,
      stride: number,
      offset: number
    ) {
      logCall('vertexAttribPointer', index, size, type, normalized, stride, offset);
    },
    enableVertexAttribArray(index: number) {
      logCall('enableVertexAttribArray', index);
    },
    disableVertexAttribArray(index: number) {
      logCall('disableVertexAttribArray', index);
    },
    vertexAttrib1f(index: number, x: number) {
      logCall('vertexAttrib1f', index, x);
    },
    vertexAttrib2f(index: number, x: number, y: number) {
      logCall('vertexAttrib2f', index, x, y);
    },
    vertexAttrib3f(index: number, x: number, y: number, z: number) {
      logCall('vertexAttrib3f', index, x, y, z);
    },
    vertexAttrib4f(index: number, x: number, y: number, z: number, w: number) {
      logCall('vertexAttrib4f', index, x, y, z, w);
    },
    vertexAttrib1fv(index: number, v: Float32Array | number[]) {
      logCall('vertexAttrib1fv', index, v);
    },
    vertexAttrib2fv(index: number, v: Float32Array | number[]) {
      logCall('vertexAttrib2fv', index, v);
    },
    vertexAttrib3fv(index: number, v: Float32Array | number[]) {
      logCall('vertexAttrib3fv', index, v);
    },
    vertexAttrib4fv(index: number, v: Float32Array | number[]) {
      logCall('vertexAttrib4fv', index, v);
    },
    getVertexAttrib(index: number, pname: number): unknown {
      logCall('getVertexAttrib', index, pname);
      return null;
    },
    getVertexAttribOffset(index: number, pname: number): number {
      logCall('getVertexAttribOffset', index, pname);
      return 0;
    },

    // Buffers
    createBuffer(): WebGLBuffer | null {
      logCall('createBuffer');
      return { __id: nextBufferId++ } as unknown as WebGLBuffer;
    },
    bindBuffer(target: number, buffer: WebGLBuffer | null) {
      logCall('bindBuffer', target, buffer);
    },
    bufferData(
      target: number,
      data: BufferSource | number,
      usage: number,
      srcOffset?: number,
      length?: number
    ) {
      logCall('bufferData', target, data, usage, srcOffset, length);
    },
    bufferSubData(
      target: number,
      offset: number,
      data: BufferSource,
      srcOffset?: number,
      length?: number
    ) {
      logCall('bufferSubData', target, offset, data, srcOffset, length);
    },
    deleteBuffer(buffer: WebGLBuffer) {
      logCall('deleteBuffer', buffer);
    },
    isBuffer(buffer: WebGLBuffer): boolean {
      logCall('isBuffer', buffer);
      return buffer !== null;
    },
    getBufferParameter(target: number, pname: number): unknown {
      logCall('getBufferParameter', target, pname);
      return null;
    },

    // Textures
    createTexture(): WebGLTexture | null {
      logCall('createTexture');
      return { __id: nextTextureId++ } as unknown as WebGLTexture;
    },
    bindTexture(target: number, texture: WebGLTexture | null) {
      logCall('bindTexture', target, texture);
    },
    activeTexture(texture: number) {
      logCall('activeTexture', texture);
    },
    texImage2D(
      target: number,
      level: number,
      internalformat: number,
      widthOrFormat: number | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
      heightOrType?: number,
      borderOrSource?: number | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
      format?: number,
      type?: number,
      pixels?: ArrayBufferView | null
    ) {
      logCall('texImage2D', target, level, internalformat, widthOrFormat, heightOrType, borderOrSource, format, type, pixels);
    },
    texSubImage2D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      widthOrFormat: number | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
      heightOrType?: number,
      formatOrSource?: number | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
      type?: number,
      pixels?: ArrayBufferView | null
    ) {
      logCall('texSubImage2D', target, level, xoffset, yoffset, widthOrFormat, heightOrType, formatOrSource, type, pixels);
    },
    texParameteri(target: number, pname: number, param: number) {
      logCall('texParameteri', target, pname, param);
    },
    texParameterf(target: number, pname: number, param: number) {
      logCall('texParameterf', target, pname, param);
    },
    getTexParameter(target: number, pname: number): unknown {
      logCall('getTexParameter', target, pname);
      return null;
    },
    deleteTexture(texture: WebGLTexture) {
      logCall('deleteTexture', texture);
    },
    isTexture(texture: WebGLTexture): boolean {
      logCall('isTexture', texture);
      return texture !== null;
    },
    generateMipmap(target: number) {
      logCall('generateMipmap', target);
    },
    copyTexImage2D(
      target: number,
      level: number,
      internalformat: number,
      x: number,
      y: number,
      width: number,
      height: number,
      border: number
    ) {
      logCall('copyTexImage2D', target, level, internalformat, x, y, width, height, border);
    },
    copyTexSubImage2D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      logCall('copyTexSubImage2D', target, level, xoffset, yoffset, x, y, width, height);
    },
    compressedTexImage2D(
      target: number,
      level: number,
      internalformat: number,
      width: number,
      height: number,
      border: number,
      data: ArrayBufferView
    ) {
      logCall('compressedTexImage2D', target, level, internalformat, width, height, border, data);
    },
    compressedTexSubImage2D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      width: number,
      height: number,
      format: number,
      data: ArrayBufferView
    ) {
      logCall('compressedTexSubImage2D', target, level, xoffset, yoffset, width, height, format, data);
    },
    pixelStorei(pname: number, param: number | boolean) {
      logCall('pixelStorei', pname, param);
    },

    // Framebuffers
    createFramebuffer(): WebGLFramebuffer | null {
      logCall('createFramebuffer');
      return { __id: nextFramebufferId++ } as unknown as WebGLFramebuffer;
    },
    bindFramebuffer(target: number, framebuffer: WebGLFramebuffer | null) {
      logCall('bindFramebuffer', target, framebuffer);
    },
    framebufferTexture2D(
      target: number,
      attachment: number,
      textarget: number,
      texture: WebGLTexture | null,
      level: number
    ) {
      logCall('framebufferTexture2D', target, attachment, textarget, texture, level);
    },
    framebufferRenderbuffer(
      target: number,
      attachment: number,
      renderbuffertarget: number,
      renderbuffer: WebGLRenderbuffer | null
    ) {
      logCall('framebufferRenderbuffer', target, attachment, renderbuffertarget, renderbuffer);
    },
    checkFramebufferStatus(target: number): number {
      logCall('checkFramebufferStatus', target);
      return GL.FRAMEBUFFER_COMPLETE;
    },
    deleteFramebuffer(framebuffer: WebGLFramebuffer) {
      logCall('deleteFramebuffer', framebuffer);
    },
    isFramebuffer(framebuffer: WebGLFramebuffer): boolean {
      logCall('isFramebuffer', framebuffer);
      return framebuffer !== null;
    },
    getFramebufferAttachmentParameter(
      target: number,
      attachment: number,
      pname: number
    ): unknown {
      logCall('getFramebufferAttachmentParameter', target, attachment, pname);
      return null;
    },

    // Renderbuffers
    createRenderbuffer(): WebGLRenderbuffer | null {
      logCall('createRenderbuffer');
      return { __id: nextRenderbufferId++ } as unknown as WebGLRenderbuffer;
    },
    bindRenderbuffer(target: number, renderbuffer: WebGLRenderbuffer | null) {
      logCall('bindRenderbuffer', target, renderbuffer);
    },
    renderbufferStorage(
      target: number,
      internalformat: number,
      width: number,
      height: number
    ) {
      logCall('renderbufferStorage', target, internalformat, width, height);
    },
    deleteRenderbuffer(renderbuffer: WebGLRenderbuffer) {
      logCall('deleteRenderbuffer', renderbuffer);
    },
    isRenderbuffer(renderbuffer: WebGLRenderbuffer): boolean {
      logCall('isRenderbuffer', renderbuffer);
      return renderbuffer !== null;
    },
    getRenderbufferParameter(target: number, pname: number): unknown {
      logCall('getRenderbufferParameter', target, pname);
      return null;
    },

    // Drawing
    drawArrays(mode: number, first: number, count: number) {
      logCall('drawArrays', mode, first, count);
    },
    drawElements(mode: number, count: number, type: number, offset: number) {
      logCall('drawElements', mode, count, type, offset);
    },

    // Reading pixels
    readPixels(
      x: number,
      y: number,
      width: number,
      height: number,
      format: number,
      type: number,
      pixels: ArrayBufferView
    ) {
      logCall('readPixels', x, y, width, height, format, type, pixels);
      // Fill with zeros
      if (pixels instanceof Uint8Array) {
        pixels.fill(0);
      }
    },

    // Line width
    lineWidth(width: number) {
      logCall('lineWidth', width);
    },

    // Polygon offset
    polygonOffset(factor: number, units: number) {
      logCall('polygonOffset', factor, units);
    },

    // Color mask
    colorMask(r: boolean, g: boolean, b: boolean, a: boolean) {
      logCall('colorMask', r, g, b, a);
    },

    // Sample coverage
    sampleCoverage(value: number, invert: boolean) {
      logCall('sampleCoverage', value, invert);
    },

    // Hint
    hint(target: number, mode: number) {
      logCall('hint', target, mode);
    },

    // Finish/flush
    finish() {
      logCall('finish');
    },
    flush() {
      logCall('flush');
    },

    // Test utilities
    __getCallLog: () => [...callLog],
    __clearCallLog: () => {
      callLog.length = 0;
    },
    __simulateContextLoss: () => {
      contextLost = true;
    },
    __simulateContextRestore: () => {
      contextLost = false;
    },
    __isContextLost: () => contextLost,
  } as unknown as WebGLRenderingContext & {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
    __simulateContextLoss: () => void;
    __simulateContextRestore: () => void;
    __isContextLost: () => boolean;
  };

  return context;
}

/**
 * Creates a mock WebGL2 rendering context
 */
export function createMockWebGL2Context(
  canvas: HTMLCanvasElement,
  config: MockWebGLConfig = {}
): WebGL2RenderingContext {
  // Start with WebGL1 context and add WebGL2 methods
  const gl1 = createMockWebGLContext(canvas, { ...config, version: 2 });

  // Get direct reference to the internal call log array (not a copy)
  // We need to push to the same array the WebGL1 context uses
  const gl1WithLog = gl1 as unknown as {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
    __internalCallLog?: CanvasCallRecord[];
  };

  // Create a shared call log that both WebGL1 and WebGL2 methods will use
  const sharedCallLog: CanvasCallRecord[] = [];

  // Copy any existing calls from WebGL1 context
  const existingCalls = gl1WithLog.__getCallLog();
  sharedCallLog.push(...existingCalls);

  const logCall = (method: string, ...args: unknown[]) => {
    sharedCallLog.push({ method, args, timestamp: Date.now() });
  };

  let nextVaoId = 1;
  let nextQueryId = 1;
  let nextSamplerId = 1;
  let nextSyncId = 1;
  let nextTransformFeedbackId = 1;

  const gl2Extensions = {
    // WebGL2-specific methods
    createVertexArray(): WebGLVertexArrayObject | null {
      logCall('createVertexArray');
      return { __id: nextVaoId++ } as unknown as WebGLVertexArrayObject;
    },
    bindVertexArray(vao: WebGLVertexArrayObject | null) {
      logCall('bindVertexArray', vao);
    },
    deleteVertexArray(vao: WebGLVertexArrayObject) {
      logCall('deleteVertexArray', vao);
    },
    isVertexArray(vao: WebGLVertexArrayObject): boolean {
      logCall('isVertexArray', vao);
      return vao !== null;
    },

    // Queries
    createQuery(): WebGLQuery | null {
      logCall('createQuery');
      return { __id: nextQueryId++ } as unknown as WebGLQuery;
    },
    deleteQuery(query: WebGLQuery) {
      logCall('deleteQuery', query);
    },
    beginQuery(target: number, query: WebGLQuery) {
      logCall('beginQuery', target, query);
    },
    endQuery(target: number) {
      logCall('endQuery', target);
    },
    getQuery(target: number, pname: number): WebGLQuery | null {
      logCall('getQuery', target, pname);
      return null;
    },
    getQueryParameter(_query: WebGLQuery, pname: number): unknown {
      logCall('getQueryParameter', _query, pname);
      return null;
    },

    // Samplers
    createSampler(): WebGLSampler | null {
      logCall('createSampler');
      return { __id: nextSamplerId++ } as unknown as WebGLSampler;
    },
    deleteSampler(sampler: WebGLSampler) {
      logCall('deleteSampler', sampler);
    },
    bindSampler(unit: number, sampler: WebGLSampler | null) {
      logCall('bindSampler', unit, sampler);
    },
    samplerParameteri(sampler: WebGLSampler, pname: number, param: number) {
      logCall('samplerParameteri', sampler, pname, param);
    },
    samplerParameterf(sampler: WebGLSampler, pname: number, param: number) {
      logCall('samplerParameterf', sampler, pname, param);
    },

    // Sync
    fenceSync(condition: number, flags: number): WebGLSync | null {
      logCall('fenceSync', condition, flags);
      return { __id: nextSyncId++ } as unknown as WebGLSync;
    },
    deleteSync(sync: WebGLSync) {
      logCall('deleteSync', sync);
    },
    clientWaitSync(sync: WebGLSync, flags: number, timeout: number): number {
      logCall('clientWaitSync', sync, flags, timeout);
      return 0x911a; // ALREADY_SIGNALED
    },
    waitSync(sync: WebGLSync, flags: number, timeout: number) {
      logCall('waitSync', sync, flags, timeout);
    },
    getSyncParameter(_sync: WebGLSync, pname: number): unknown {
      logCall('getSyncParameter', _sync, pname);
      return null;
    },

    // Transform feedback
    createTransformFeedback(): WebGLTransformFeedback | null {
      logCall('createTransformFeedback');
      return { __id: nextTransformFeedbackId++ } as unknown as WebGLTransformFeedback;
    },
    deleteTransformFeedback(tf: WebGLTransformFeedback) {
      logCall('deleteTransformFeedback', tf);
    },
    bindTransformFeedback(target: number, tf: WebGLTransformFeedback | null) {
      logCall('bindTransformFeedback', target, tf);
    },
    beginTransformFeedback(primitiveMode: number) {
      logCall('beginTransformFeedback', primitiveMode);
    },
    endTransformFeedback() {
      logCall('endTransformFeedback');
    },
    transformFeedbackVaryings(program: WebGLProgram, varyings: string[], bufferMode: number) {
      logCall('transformFeedbackVaryings', program, varyings, bufferMode);
    },
    getTransformFeedbackVarying(_program: WebGLProgram, index: number): WebGLActiveInfo | null {
      logCall('getTransformFeedbackVarying', _program, index);
      return null;
    },
    pauseTransformFeedback() {
      logCall('pauseTransformFeedback');
    },
    resumeTransformFeedback() {
      logCall('resumeTransformFeedback');
    },

    // Uniform buffer objects
    getUniformBlockIndex(_program: WebGLProgram, uniformBlockName: string): number {
      logCall('getUniformBlockIndex', _program, uniformBlockName);
      return 0;
    },
    uniformBlockBinding(program: WebGLProgram, uniformBlockIndex: number, uniformBlockBinding: number) {
      logCall('uniformBlockBinding', program, uniformBlockIndex, uniformBlockBinding);
    },
    getActiveUniformBlockParameter(_program: WebGLProgram, _uniformBlockIndex: number, pname: number): unknown {
      logCall('getActiveUniformBlockParameter', _program, _uniformBlockIndex, pname);
      return null;
    },
    getActiveUniformBlockName(_program: WebGLProgram, uniformBlockIndex: number): string | null {
      logCall('getActiveUniformBlockName', _program, uniformBlockIndex);
      return `uniformBlock${uniformBlockIndex}`;
    },

    // Instanced drawing
    drawArraysInstanced(mode: number, first: number, count: number, instanceCount: number) {
      logCall('drawArraysInstanced', mode, first, count, instanceCount);
    },
    drawElementsInstanced(mode: number, count: number, type: number, offset: number, instanceCount: number) {
      logCall('drawElementsInstanced', mode, count, type, offset, instanceCount);
    },
    vertexAttribDivisor(index: number, divisor: number) {
      logCall('vertexAttribDivisor', index, divisor);
    },

    // Multiple render targets
    drawBuffers(buffers: number[]) {
      logCall('drawBuffers', buffers);
    },
    clearBufferfv(buffer: number, drawbuffer: number, values: Float32Array | number[]) {
      logCall('clearBufferfv', buffer, drawbuffer, values);
    },
    clearBufferiv(buffer: number, drawbuffer: number, values: Int32Array | number[]) {
      logCall('clearBufferiv', buffer, drawbuffer, values);
    },
    clearBufferuiv(buffer: number, drawbuffer: number, values: Uint32Array | number[]) {
      logCall('clearBufferuiv', buffer, drawbuffer, values);
    },
    clearBufferfi(buffer: number, drawbuffer: number, depth: number, stencil: number) {
      logCall('clearBufferfi', buffer, drawbuffer, depth, stencil);
    },

    // 3D textures
    texImage3D(
      target: number,
      level: number,
      internalformat: number,
      width: number,
      height: number,
      depth: number,
      border: number,
      format: number,
      type: number,
      source: ArrayBufferView | null
    ) {
      logCall('texImage3D', target, level, internalformat, width, height, depth, border, format, type, source);
    },
    texSubImage3D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      zoffset: number,
      width: number,
      height: number,
      depth: number,
      format: number,
      type: number,
      source: ArrayBufferView | null
    ) {
      logCall('texSubImage3D', target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, source);
    },
    copyTexSubImage3D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      zoffset: number,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      logCall('copyTexSubImage3D', target, level, xoffset, yoffset, zoffset, x, y, width, height);
    },
    compressedTexImage3D(
      target: number,
      level: number,
      internalformat: number,
      width: number,
      height: number,
      depth: number,
      border: number,
      data: ArrayBufferView
    ) {
      logCall('compressedTexImage3D', target, level, internalformat, width, height, depth, border, data);
    },
    compressedTexSubImage3D(
      target: number,
      level: number,
      xoffset: number,
      yoffset: number,
      zoffset: number,
      width: number,
      height: number,
      depth: number,
      format: number,
      data: ArrayBufferView
    ) {
      logCall('compressedTexSubImage3D', target, level, xoffset, yoffset, zoffset, width, height, depth, format, data);
    },
    texStorage2D(target: number, levels: number, internalformat: number, width: number, height: number) {
      logCall('texStorage2D', target, levels, internalformat, width, height);
    },
    texStorage3D(target: number, levels: number, internalformat: number, width: number, height: number, depth: number) {
      logCall('texStorage3D', target, levels, internalformat, width, height, depth);
    },

    // Renderbuffer
    renderbufferStorageMultisample(
      target: number,
      samples: number,
      internalformat: number,
      width: number,
      height: number
    ) {
      logCall('renderbufferStorageMultisample', target, samples, internalformat, width, height);
    },
    getInternalformatParameter(target: number, internalformat: number, pname: number): unknown {
      logCall('getInternalformatParameter', target, internalformat, pname);
      return null;
    },

    // Framebuffer
    blitFramebuffer(
      srcX0: number, srcY0: number, srcX1: number, srcY1: number,
      dstX0: number, dstY0: number, dstX1: number, dstY1: number,
      mask: number, filter: number
    ) {
      logCall('blitFramebuffer', srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, mask, filter);
    },
    readBuffer(src: number) {
      logCall('readBuffer', src);
    },
    invalidateFramebuffer(target: number, attachments: number[]) {
      logCall('invalidateFramebuffer', target, attachments);
    },
    invalidateSubFramebuffer(target: number, attachments: number[], x: number, y: number, width: number, height: number) {
      logCall('invalidateSubFramebuffer', target, attachments, x, y, width, height);
    },

    // Buffer binding
    bindBufferBase(target: number, index: number, buffer: WebGLBuffer | null) {
      logCall('bindBufferBase', target, index, buffer);
    },
    bindBufferRange(target: number, index: number, buffer: WebGLBuffer | null, offset: number, size: number) {
      logCall('bindBufferRange', target, index, buffer, offset, size);
    },
    getIndexedParameter(target: number, index: number): unknown {
      logCall('getIndexedParameter', target, index);
      return null;
    },

    // Override test utilities to use shared call log
    __getCallLog: () => [...sharedCallLog],
    __clearCallLog: () => {
      sharedCallLog.length = 0;
    },
  };

  return { ...gl1, ...gl2Extensions } as unknown as WebGL2RenderingContext;
}

// ============================================================================
// MOCK CANVAS ELEMENT
// ============================================================================

/**
 * Creates a mock HTMLCanvasElement with configurable context support
 */
export function createMockCanvas(config: MockCanvasConfig = {}): HTMLCanvasElement {
  const {
    width = 800,
    height = 600,
    supportedContexts = ['2d', 'webgl', 'webgl2'],
    failGetContext = false,
  } = config;

  let context2d: CanvasRenderingContext2D | null = null;
  let contextWebGL: WebGLRenderingContext | null = null;
  let contextWebGL2: WebGL2RenderingContext | null = null;

  const canvas = {
    width,
    height,
    style: {},
    parentNode: null,
    nodeName: 'CANVAS',
    tagName: 'CANVAS',

    getContext(
      contextId: string,
      options?: CanvasRenderingContext2DSettings | WebGLContextAttributes
    ): RenderingContext | null {
      if (failGetContext) {
        return null;
      }

      if (contextId === '2d' && supportedContexts.includes('2d')) {
        if (!context2d) {
          context2d = createMock2DContext(canvas as unknown as HTMLCanvasElement, options as Mock2DContextConfig);
        }
        return context2d;
      }

      if (contextId === 'webgl' && supportedContexts.includes('webgl')) {
        if (!contextWebGL) {
          contextWebGL = createMockWebGLContext(canvas as unknown as HTMLCanvasElement);
        }
        return contextWebGL;
      }

      if (contextId === 'webgl2' && supportedContexts.includes('webgl2')) {
        if (!contextWebGL2) {
          contextWebGL2 = createMockWebGL2Context(canvas as unknown as HTMLCanvasElement);
        }
        return contextWebGL2;
      }

      if (contextId === 'experimental-webgl' && supportedContexts.includes('webgl')) {
        if (!contextWebGL) {
          contextWebGL = createMockWebGLContext(canvas as unknown as HTMLCanvasElement);
        }
        return contextWebGL;
      }

      return null;
    },

    toDataURL(type?: string, quality?: number): string {
      return `data:${type ?? 'image/png'};base64,MOCK_IMAGE_DATA_${quality ?? 0.92}`;
    },

    toBlob(
      callback: BlobCallback,
      type?: string,
      quality?: number
    ): void {
      const mockBlob = new Blob(['MOCK_BLOB_DATA'], { type: type ?? 'image/png' });
      setTimeout(() => callback(mockBlob), 0);
    },

    transferControlToOffscreen(): OffscreenCanvas {
      return {
        width,
        height,
        getContext: () => null,
      } as unknown as OffscreenCanvas;
    },

    captureStream(_frameRate?: number): MediaStream {
      return {
        getTracks: () => [],
        getVideoTracks: () => [],
        getAudioTracks: () => [],
      } as unknown as MediaStream;
    },

    // DOM methods
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    setAttribute: () => {},
    getAttribute: () => null,
    removeAttribute: () => {},
    getBoundingClientRect: () => ({
      x: 0,
      y: 0,
      width,
      height,
      top: 0,
      right: width,
      bottom: height,
      left: 0,
      toJSON: () => ({}),
    }),

    // Test utilities
    __get2DContext: () => context2d,
    __getWebGLContext: () => contextWebGL,
    __getWebGL2Context: () => contextWebGL2,
    __resetContexts: () => {
      context2d = null;
      contextWebGL = null;
      contextWebGL2 = null;
    },
  };

  return canvas as unknown as HTMLCanvasElement;
}

// ============================================================================
// ANIMATION FRAME MOCKS
// ============================================================================

/**
 * Animation frame controller for testing game loops
 */
export class AnimationFrameController {
  private callbacks: Map<number, FrameRequestCallback> = new Map();
  private nextId = 1;
  private currentTime = 0;
  private frameCount = 0;
  private isRunning = false;
  private maxFrames: number;
  private frameInterval: number;

  constructor(config: MockAnimationFrameConfig = {}) {
    const { frameRate = 60, maxFrames = Infinity } = config;
    this.maxFrames = maxFrames;
    this.frameInterval = 1000 / frameRate;
  }

  /**
   * Request animation frame mock
   */
  requestAnimationFrame = (callback: FrameRequestCallback): number => {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  };

  /**
   * Cancel animation frame mock
   */
  cancelAnimationFrame = (id: number): void => {
    this.callbacks.delete(id);
  };

  /**
   * Advance by one frame
   */
  tick(): void {
    this.currentTime += this.frameInterval;
    this.frameCount++;
    const callbacksToRun = new Map(this.callbacks);
    this.callbacks.clear();
    callbacksToRun.forEach((callback) => {
      callback(this.currentTime);
    });
  }

  /**
   * Advance by n frames
   */
  tickN(n: number): void {
    for (let i = 0; i < n; i++) {
      this.tick();
    }
  }

  /**
   * Advance by specific time duration
   */
  advanceByTime(ms: number): void {
    const frames = Math.floor(ms / this.frameInterval);
    this.tickN(frames);
  }

  /**
   * Run all pending frames up to maxFrames
   */
  runAllFrames(): void {
    this.isRunning = true;
    while (this.callbacks.size > 0 && this.frameCount < this.maxFrames) {
      this.tick();
    }
    this.isRunning = false;
  }

  /**
   * Get current state
   */
  getState() {
    return {
      currentTime: this.currentTime,
      frameCount: this.frameCount,
      pendingCallbacks: this.callbacks.size,
      isRunning: this.isRunning,
    };
  }

  /**
   * Reset controller
   */
  reset(): void {
    this.callbacks.clear();
    this.currentTime = 0;
    this.frameCount = 0;
    this.isRunning = false;
    this.nextId = 1;
  }

  /**
   * Install globally
   */
  install(): void {
    global.requestAnimationFrame = this.requestAnimationFrame;
    global.cancelAnimationFrame = this.cancelAnimationFrame;
  }

  /**
   * Uninstall from global
   */
  uninstall(): void {
    // Restore original (or simple fallback)
    global.requestAnimationFrame = (cb) => setTimeout(cb, 0) as unknown as number;
    global.cancelAnimationFrame = (id) => clearTimeout(id);
  }
}

// ============================================================================
// PERFORMANCE MOCK
// ============================================================================

/**
 * Performance mock controller for timing tests
 */
export class PerformanceMock {
  private currentTime: number;
  private timeIncrement: number;
  private autoIncrement: boolean;
  private callCount = 0;

  constructor(config: MockPerformanceConfig = {}) {
    this.currentTime = config.startTime ?? 0;
    this.timeIncrement = config.timeIncrement ?? 16.67; // ~60fps
    this.autoIncrement = config.autoIncrement ?? false;
  }

  /**
   * Mock performance.now()
   */
  now = (): number => {
    this.callCount++;
    if (this.autoIncrement) {
      this.currentTime += this.timeIncrement;
    }
    return this.currentTime;
  };

  /**
   * Set current time
   */
  setTime(time: number): void {
    this.currentTime = time;
  }

  /**
   * Advance time by delta
   */
  advanceTime(delta: number): void {
    this.currentTime += delta;
  }

  /**
   * Get call count
   */
  getCallCount(): number {
    return this.callCount;
  }

  /**
   * Reset mock
   */
  reset(startTime = 0): void {
    this.currentTime = startTime;
    this.callCount = 0;
  }

  /**
   * Install globally
   */
  install(): void {
    Object.defineProperty(performance, 'now', {
      value: this.now,
      writable: true,
      configurable: true,
    });
  }

  /**
   * Uninstall from global
   */
  uninstall(): void {
    // Cannot easily restore original performance.now in jsdom
    // Just leave it as-is or reset to a basic mock
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create mock gradient for 2D context
 */
function createMockGradient(): CanvasGradient {
  const colorStops: Array<{ offset: number; color: string }> = [];
  return {
    addColorStop(offset: number, color: string) {
      colorStops.push({ offset, color });
    },
    __getColorStops: () => [...colorStops],
  } as CanvasGradient & { __getColorStops: () => Array<{ offset: number; color: string }> };
}

/**
 * Create mock pattern for 2D context
 */
function createMockPattern(): CanvasPattern {
  return {
    setTransform(_transform?: DOMMatrix2DInit) {
      // No-op
    },
  } as CanvasPattern;
}

/**
 * Create mock text metrics
 */
function createMockTextMetrics(text: string): TextMetrics {
  const charWidth = 8;
  const width = text.length * charWidth;
  return {
    width,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: width,
    actualBoundingBoxAscent: 12,
    actualBoundingBoxDescent: 3,
    fontBoundingBoxAscent: 12,
    fontBoundingBoxDescent: 3,
    emHeightAscent: 12,
    emHeightDescent: 3,
    hangingBaseline: 10,
    alphabeticBaseline: 0,
    ideographicBaseline: -3,
  };
}

/**
 * Create mock ImageData
 */
function createMockImageData(width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  return {
    width,
    height,
    data,
    colorSpace: 'srgb',
  } as ImageData;
}

/**
 * Create mock WebGL extension
 */
function createMockExtension(name: string): unknown {
  switch (name) {
    case 'ANGLE_instanced_arrays':
      return {
        drawArraysInstancedANGLE: () => {},
        drawElementsInstancedANGLE: () => {},
        vertexAttribDivisorANGLE: () => {},
        VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: 0x88fe,
      };
    case 'OES_vertex_array_object':
      return {
        createVertexArrayOES: () => ({}),
        deleteVertexArrayOES: () => {},
        bindVertexArrayOES: () => {},
        isVertexArrayOES: () => true,
        VERTEX_ARRAY_BINDING_OES: 0x85b5,
      };
    case 'WEBGL_lose_context':
      return {
        loseContext: () => {},
        restoreContext: () => {},
      };
    case 'EXT_texture_filter_anisotropic':
      return {
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84ff,
        TEXTURE_MAX_ANISOTROPY_EXT: 0x84fe,
      };
    case 'WEBGL_debug_renderer_info':
      return {
        UNMASKED_VENDOR_WEBGL: 0x9245,
        UNMASKED_RENDERER_WEBGL: 0x9246,
      };
    default:
      return {};
  }
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert canvas operations were called
 */
export function assertCanvasCallsInclude(
  context: CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
  method: string,
  expectedArgs?: unknown[]
): void {
  const callLog = context.__getCallLog();
  const matchingCalls = callLog.filter((call) => call.method === method);

  if (matchingCalls.length === 0) {
    throw new Error(`Expected canvas method "${method}" to be called, but it was not. Called methods: ${callLog.map((c) => c.method).join(', ')}`);
  }

  if (expectedArgs !== undefined) {
    const argsMatch = matchingCalls.some((call) =>
      JSON.stringify(call.args) === JSON.stringify(expectedArgs)
    );
    if (!argsMatch) {
      throw new Error(
        `Expected canvas method "${method}" to be called with args ${JSON.stringify(expectedArgs)}, ` +
          `but was called with: ${matchingCalls.map((c) => JSON.stringify(c.args)).join(', ')}`
      );
    }
  }
}

/**
 * Assert WebGL operations were called
 */
export function assertWebGLCallsInclude(
  context: WebGLRenderingContext & { __getCallLog: () => CanvasCallRecord[] },
  method: string,
  expectedArgs?: unknown[]
): void {
  const callLog = context.__getCallLog();
  const matchingCalls = callLog.filter((call) => call.method === method);

  if (matchingCalls.length === 0) {
    throw new Error(`Expected WebGL method "${method}" to be called, but it was not. Called methods: ${callLog.map((c) => c.method).join(', ')}`);
  }

  if (expectedArgs !== undefined) {
    const argsMatch = matchingCalls.some((call) =>
      JSON.stringify(call.args) === JSON.stringify(expectedArgs)
    );
    if (!argsMatch) {
      throw new Error(
        `Expected WebGL method "${method}" to be called with args ${JSON.stringify(expectedArgs)}, ` +
          `but was called with: ${matchingCalls.map((c) => JSON.stringify(c.args)).join(', ')}`
      );
    }
  }
}

/**
 * Get call count for a specific method
 */
export function getCanvasCallCount(
  context: { __getCallLog: () => CanvasCallRecord[] },
  method: string
): number {
  return context.__getCallLog().filter((call) => call.method === method).length;
}

/**
 * Assert specific number of draw calls
 */
export function assertDrawCallCount(
  context: { __getCallLog: () => CanvasCallRecord[] },
  expectedCount: number
): void {
  const drawMethods = ['fillRect', 'strokeRect', 'fill', 'stroke', 'drawImage', 'fillText', 'strokeText'];
  const drawCalls = context.__getCallLog().filter((call) => drawMethods.includes(call.method));

  if (drawCalls.length !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} draw calls, but got ${drawCalls.length}. ` +
        `Draw calls: ${drawCalls.map((c) => c.method).join(', ')}`
    );
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a test canvas with 2D context
 */
export function createTestCanvas2D(
  width = 800,
  height = 600
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = createMockCanvas({ width, height, supportedContexts: ['2d'] });
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

/**
 * Create a test canvas with WebGL context
 */
export function createTestCanvasWebGL(
  width = 800,
  height = 600
): { canvas: HTMLCanvasElement; gl: WebGLRenderingContext } {
  const canvas = createMockCanvas({ width, height, supportedContexts: ['webgl'] });
  const gl = canvas.getContext('webgl')!;
  return { canvas, gl };
}

/**
 * Create a test canvas with WebGL2 context
 */
export function createTestCanvasWebGL2(
  width = 800,
  height = 600
): { canvas: HTMLCanvasElement; gl: WebGL2RenderingContext } {
  const canvas = createMockCanvas({ width, height, supportedContexts: ['webgl2'] });
  const gl = canvas.getContext('webgl2')!;
  return { canvas, gl: gl as WebGL2RenderingContext };
}

/**
 * Create animation frame testing setup
 */
export function createAnimationFrameSetup(
  config: MockAnimationFrameConfig = {}
): AnimationFrameController {
  const controller = new AnimationFrameController(config);
  controller.install();
  return controller;
}

/**
 * Create performance mock setup
 */
export function createPerformanceSetup(
  config: MockPerformanceConfig = {}
): PerformanceMock {
  const mock = new PerformanceMock(config);
  mock.install();
  return mock;
}
