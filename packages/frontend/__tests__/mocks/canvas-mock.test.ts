/**
 * Canvas and WebGL Mock Tests
 *
 * Verifies that all canvas and WebGL mocks work correctly for game testing.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createMockCanvas,
  createMock2DContext,
  createMockWebGLContext,
  createMockWebGL2Context,
  AnimationFrameController,
  PerformanceMock,
  createTestCanvas2D,
  createTestCanvasWebGL,
  createTestCanvasWebGL2,
  createAnimationFrameSetup,
  createPerformanceSetup,
  assertCanvasCallsInclude,
  assertWebGLCallsInclude,
  assertDrawCallCount,
  getCanvasCallCount,
  type CanvasCallRecord,
} from './canvas-mock';

// ============================================================================
// MOCK CANVAS TESTS
// ============================================================================

describe('createMockCanvas', () => {
  it('creates canvas with default dimensions', () => {
    const canvas = createMockCanvas();
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);
  });

  it('creates canvas with custom dimensions', () => {
    const canvas = createMockCanvas({ width: 1024, height: 768 });
    expect(canvas.width).toBe(1024);
    expect(canvas.height).toBe(768);
  });

  it('returns 2D context when requested', () => {
    const canvas = createMockCanvas();
    const ctx = canvas.getContext('2d');
    expect(ctx).not.toBeNull();
    expect(ctx?.canvas).toBe(canvas);
  });

  it('returns WebGL context when requested', () => {
    const canvas = createMockCanvas();
    const gl = canvas.getContext('webgl');
    expect(gl).not.toBeNull();
    expect(gl?.canvas).toBe(canvas);
  });

  it('returns WebGL2 context when requested', () => {
    const canvas = createMockCanvas();
    const gl = canvas.getContext('webgl2');
    expect(gl).not.toBeNull();
    expect(gl?.canvas).toBe(canvas);
  });

  it('returns same context instance on repeated calls', () => {
    const canvas = createMockCanvas();
    const ctx1 = canvas.getContext('2d');
    const ctx2 = canvas.getContext('2d');
    expect(ctx1).toBe(ctx2);
  });

  it('returns null for unsupported context types', () => {
    const canvas = createMockCanvas({ supportedContexts: ['2d'] });
    const gl = canvas.getContext('webgl');
    expect(gl).toBeNull();
  });

  it('returns null when failGetContext is true', () => {
    const canvas = createMockCanvas({ failGetContext: true });
    expect(canvas.getContext('2d')).toBeNull();
    expect(canvas.getContext('webgl')).toBeNull();
  });

  it('supports toDataURL', () => {
    const canvas = createMockCanvas();
    const dataUrl = canvas.toDataURL('image/png', 0.8);
    expect(dataUrl).toContain('data:image/png;base64');
    expect(dataUrl).toContain('0.8');
  });

  it('supports toBlob', async () => {
    const canvas = createMockCanvas();
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg');
    });
    expect(blob).not.toBeNull();
    expect(blob?.type).toBe('image/jpeg');
  });

  it('supports getBoundingClientRect', () => {
    const canvas = createMockCanvas({ width: 640, height: 480 });
    const rect = canvas.getBoundingClientRect();
    expect(rect.width).toBe(640);
    expect(rect.height).toBe(480);
    expect(rect.top).toBe(0);
    expect(rect.left).toBe(0);
  });

  it('supports experimental-webgl as alias', () => {
    const canvas = createMockCanvas();
    const gl = canvas.getContext('experimental-webgl');
    expect(gl).not.toBeNull();
  });
});

// ============================================================================
// MOCK 2D CONTEXT TESTS
// ============================================================================

describe('createMock2DContext', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D & {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
  };

  beforeEach(() => {
    canvas = createMockCanvas();
    ctx = canvas.getContext('2d') as CanvasRenderingContext2D & {
      __getCallLog: () => CanvasCallRecord[];
      __clearCallLog: () => void;
    };
  });

  describe('basic properties', () => {
    it('returns canvas reference', () => {
      expect(ctx.canvas).toBe(canvas);
    });

    it('supports fillStyle getter/setter', () => {
      ctx.fillStyle = '#ff0000';
      expect(ctx.fillStyle).toBe('#ff0000');
    });

    it('supports strokeStyle getter/setter', () => {
      ctx.strokeStyle = 'blue';
      expect(ctx.strokeStyle).toBe('blue');
    });

    it('supports lineWidth getter/setter', () => {
      ctx.lineWidth = 5;
      expect(ctx.lineWidth).toBe(5);
    });

    it('supports font getter/setter', () => {
      ctx.font = '24px Arial';
      expect(ctx.font).toBe('24px Arial');
    });

    it('supports textAlign getter/setter', () => {
      ctx.textAlign = 'center';
      expect(ctx.textAlign).toBe('center');
    });

    it('supports globalAlpha getter/setter', () => {
      ctx.globalAlpha = 0.5;
      expect(ctx.globalAlpha).toBe(0.5);
    });
  });

  describe('drawing methods', () => {
    it('logs fillRect calls', () => {
      ctx.fillRect(10, 20, 100, 50);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'fillRect', args: [10, 20, 100, 50] })
      );
    });

    it('logs strokeRect calls', () => {
      ctx.strokeRect(0, 0, 200, 200);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'strokeRect', args: [0, 0, 200, 200] })
      );
    });

    it('logs clearRect calls', () => {
      ctx.clearRect(0, 0, 800, 600);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'clearRect', args: [0, 0, 800, 600] })
      );
    });

    it('logs drawImage calls', () => {
      const img = {} as HTMLImageElement;
      ctx.drawImage(img, 50, 50);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'drawImage',
          args: expect.arrayContaining([img, 50, 50]),
        })
      );
    });
  });

  describe('path methods', () => {
    it('logs beginPath calls', () => {
      ctx.beginPath();
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'beginPath' }));
    });

    it('logs moveTo and lineTo calls', () => {
      ctx.beginPath();
      ctx.moveTo(10, 10);
      ctx.lineTo(100, 100);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'moveTo', args: [10, 10] })
      );
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'lineTo', args: [100, 100] })
      );
    });

    it('logs arc calls', () => {
      ctx.arc(100, 100, 50, 0, Math.PI * 2);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'arc',
          args: [100, 100, 50, 0, Math.PI * 2, undefined],
        })
      );
    });

    it('logs fill and stroke calls', () => {
      ctx.beginPath();
      ctx.rect(10, 10, 50, 50);
      ctx.fill();
      ctx.stroke();
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'fill' }));
      expect(calls).toContainEqual(expect.objectContaining({ method: 'stroke' }));
    });
  });

  describe('text methods', () => {
    it('logs fillText calls', () => {
      ctx.fillText('Hello World', 100, 100);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'fillText',
          args: ['Hello World', 100, 100, undefined],
        })
      );
    });

    it('logs strokeText calls', () => {
      ctx.strokeText('Test', 50, 50, 200);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'strokeText',
          args: ['Test', 50, 50, 200],
        })
      );
    });

    it('returns text metrics from measureText', () => {
      const metrics = ctx.measureText('Hello');
      expect(metrics.width).toBeGreaterThan(0);
      expect(metrics.actualBoundingBoxAscent).toBeGreaterThan(0);
    });
  });

  describe('transform methods', () => {
    it('logs translate calls', () => {
      ctx.translate(100, 200);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'translate', args: [100, 200] })
      );
    });

    it('logs rotate calls', () => {
      ctx.rotate(Math.PI / 4);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'rotate', args: [Math.PI / 4] })
      );
    });

    it('logs scale calls', () => {
      ctx.scale(2, 2);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'scale', args: [2, 2] })
      );
    });
  });

  describe('state management', () => {
    it('supports save and restore', () => {
      ctx.fillStyle = 'red';
      ctx.save();
      ctx.fillStyle = 'blue';
      expect(ctx.fillStyle).toBe('blue');
      ctx.restore();
      expect(ctx.fillStyle).toBe('red');
    });

    it('logs save and restore calls', () => {
      ctx.save();
      ctx.restore();
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'save' }));
      expect(calls).toContainEqual(expect.objectContaining({ method: 'restore' }));
    });
  });

  describe('gradient and pattern', () => {
    it('creates linear gradient', () => {
      const gradient = ctx.createLinearGradient(0, 0, 100, 100);
      expect(gradient).toBeDefined();
      expect(gradient.addColorStop).toBeDefined();
    });

    it('creates radial gradient', () => {
      const gradient = ctx.createRadialGradient(50, 50, 10, 50, 50, 50);
      expect(gradient).toBeDefined();
    });

    it('creates pattern', () => {
      const img = {} as HTMLImageElement;
      const pattern = ctx.createPattern(img, 'repeat');
      expect(pattern).toBeDefined();
    });
  });

  describe('image data', () => {
    it('creates ImageData', () => {
      const imageData = ctx.createImageData(100, 100);
      expect(imageData.width).toBe(100);
      expect(imageData.height).toBe(100);
      expect(imageData.data.length).toBe(100 * 100 * 4);
    });

    it('gets ImageData', () => {
      const imageData = ctx.getImageData(0, 0, 50, 50);
      expect(imageData.width).toBe(50);
      expect(imageData.height).toBe(50);
    });

    it('puts ImageData', () => {
      const imageData = ctx.createImageData(10, 10);
      ctx.putImageData(imageData, 0, 0);
      const calls = ctx.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'putImageData' })
      );
    });
  });

  describe('call log utilities', () => {
    it('clears call log', () => {
      ctx.fillRect(0, 0, 10, 10);
      expect(ctx.__getCallLog().length).toBeGreaterThan(0);
      ctx.__clearCallLog();
      expect(ctx.__getCallLog().length).toBe(0);
    });

    it('timestamps calls', () => {
      ctx.fillRect(0, 0, 10, 10);
      const calls = ctx.__getCallLog();
      expect(calls[0].timestamp).toBeDefined();
      expect(typeof calls[0].timestamp).toBe('number');
    });
  });
});

// ============================================================================
// MOCK WEBGL CONTEXT TESTS
// ============================================================================

describe('createMockWebGLContext', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGLRenderingContext & {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
    __simulateContextLoss: () => void;
    __simulateContextRestore: () => void;
  };

  beforeEach(() => {
    canvas = createMockCanvas();
    gl = canvas.getContext('webgl') as WebGLRenderingContext & {
      __getCallLog: () => CanvasCallRecord[];
      __clearCallLog: () => void;
      __simulateContextLoss: () => void;
      __simulateContextRestore: () => void;
    };
  });

  describe('basic properties', () => {
    it('returns canvas reference', () => {
      expect(gl.canvas).toBe(canvas);
    });

    it('has drawing buffer dimensions', () => {
      expect(gl.drawingBufferWidth).toBe(canvas.width);
      expect(gl.drawingBufferHeight).toBe(canvas.height);
    });

    it('returns context attributes', () => {
      const attrs = gl.getContextAttributes();
      expect(attrs).not.toBeNull();
      expect(attrs?.alpha).toBe(true);
      expect(attrs?.depth).toBe(true);
    });
  });

  describe('WebGL constants', () => {
    it('has buffer constants', () => {
      expect(gl.ARRAY_BUFFER).toBe(0x8892);
      expect(gl.ELEMENT_ARRAY_BUFFER).toBe(0x8893);
    });

    it('has shader constants', () => {
      expect(gl.VERTEX_SHADER).toBe(0x8b31);
      expect(gl.FRAGMENT_SHADER).toBe(0x8b30);
    });

    it('has clear bit constants', () => {
      expect(gl.COLOR_BUFFER_BIT).toBe(0x4000);
      expect(gl.DEPTH_BUFFER_BIT).toBe(0x100);
    });
  });

  describe('shader operations', () => {
    it('creates shader', () => {
      const shader = gl.createShader(gl.VERTEX_SHADER);
      expect(shader).not.toBeNull();
    });

    it('compiles shader', () => {
      const shader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(shader, 'void main() {}');
      gl.compileShader(shader);
      expect(gl.getShaderParameter(shader, gl.COMPILE_STATUS)).toBe(true);
    });

    it('logs shader operations', () => {
      const shader = gl.createShader(gl.VERTEX_SHADER)!;
      gl.shaderSource(shader, 'test');
      gl.compileShader(shader);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'createShader' }));
      expect(calls).toContainEqual(expect.objectContaining({ method: 'shaderSource' }));
      expect(calls).toContainEqual(expect.objectContaining({ method: 'compileShader' }));
    });
  });

  describe('program operations', () => {
    it('creates program', () => {
      const program = gl.createProgram();
      expect(program).not.toBeNull();
    });

    it('links program', () => {
      const program = gl.createProgram()!;
      const vs = gl.createShader(gl.VERTEX_SHADER)!;
      const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      expect(gl.getProgramParameter(program, gl.LINK_STATUS)).toBe(true);
    });

    it('gets uniform location', () => {
      const program = gl.createProgram()!;
      const location = gl.getUniformLocation(program, 'uModelMatrix');
      expect(location).not.toBeNull();
    });

    it('gets attribute location', () => {
      const program = gl.createProgram()!;
      const location = gl.getAttribLocation(program, 'aPosition');
      expect(location).toBe(0);
    });
  });

  describe('buffer operations', () => {
    it('creates buffer', () => {
      const buffer = gl.createBuffer();
      expect(buffer).not.toBeNull();
    });

    it('binds buffer', () => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'bindBuffer',
          args: [gl.ARRAY_BUFFER, buffer],
        })
      );
    });

    it('uploads buffer data', () => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1, 2, 3]), gl.STATIC_DRAW);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'bufferData' }));
    });
  });

  describe('texture operations', () => {
    it('creates texture', () => {
      const texture = gl.createTexture();
      expect(texture).not.toBeNull();
    });

    it('binds texture', () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'bindTexture' }));
    });

    it('sets texture parameters', () => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'texParameteri' }));
    });
  });

  describe('framebuffer operations', () => {
    it('creates framebuffer', () => {
      const fb = gl.createFramebuffer();
      expect(fb).not.toBeNull();
    });

    it('checks framebuffer status', () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, gl.createFramebuffer());
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      expect(status).toBe(gl.FRAMEBUFFER_COMPLETE);
    });
  });

  describe('drawing operations', () => {
    it('clears canvas', () => {
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'clearColor', args: [0, 0, 0, 1] })
      );
      expect(calls).toContainEqual(expect.objectContaining({ method: 'clear' }));
    });

    it('draws arrays', () => {
      gl.drawArrays(gl.TRIANGLES, 0, 36);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'drawArrays',
          args: [gl.TRIANGLES, 0, 36],
        })
      );
    });

    it('draws elements', () => {
      gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({
          method: 'drawElements',
          args: [gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0],
        })
      );
    });
  });

  describe('state management', () => {
    it('enables capabilities', () => {
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'enable', args: [gl.DEPTH_TEST] })
      );
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'enable', args: [gl.BLEND] })
      );
    });

    it('sets viewport', () => {
      gl.viewport(0, 0, 800, 600);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'viewport', args: [0, 0, 800, 600] })
      );
    });

    it('sets blend function', () => {
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'blendFunc' }));
    });
  });

  describe('extensions', () => {
    it('returns supported extensions', () => {
      const extensions = gl.getSupportedExtensions();
      expect(extensions).toContain('OES_texture_float');
      expect(extensions).toContain('WEBGL_depth_texture');
    });

    it('gets extension', () => {
      const ext = gl.getExtension('ANGLE_instanced_arrays');
      expect(ext).not.toBeNull();
      expect((ext as { drawArraysInstancedANGLE: () => void }).drawArraysInstancedANGLE).toBeDefined();
    });

    it('returns null for unsupported extension', () => {
      const ext = gl.getExtension('NONEXISTENT_EXTENSION');
      expect(ext).toBeNull();
    });
  });

  describe('parameters', () => {
    it('gets max texture size', () => {
      const maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      expect(maxSize).toBe(4096);
    });

    it('gets vendor string', () => {
      const vendor = gl.getParameter(gl.VENDOR);
      expect(vendor).toBe('Mock WebGL Vendor');
    });

    it('gets WebGL version', () => {
      const version = gl.getParameter(gl.VERSION);
      expect(version).toContain('WebGL');
    });
  });

  describe('context loss', () => {
    it('reports context not lost by default', () => {
      expect(gl.isContextLost()).toBe(false);
    });

    it('simulates context loss', () => {
      gl.__simulateContextLoss();
      expect(gl.isContextLost()).toBe(true);
      expect(gl.getError()).toBe(0x9242); // CONTEXT_LOST_WEBGL
    });

    it('simulates context restore', () => {
      gl.__simulateContextLoss();
      gl.__simulateContextRestore();
      expect(gl.isContextLost()).toBe(false);
    });
  });

  describe('uniform methods', () => {
    it('sets uniform1f', () => {
      const program = gl.createProgram()!;
      const location = gl.getUniformLocation(program, 'uTime');
      gl.uniform1f(location, 1.5);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(
        expect.objectContaining({ method: 'uniform1f', args: [location, 1.5] })
      );
    });

    it('sets uniformMatrix4fv', () => {
      const program = gl.createProgram()!;
      const location = gl.getUniformLocation(program, 'uMatrix');
      const matrix = new Float32Array(16);
      gl.uniformMatrix4fv(location, false, matrix);
      const calls = gl.__getCallLog();
      expect(calls).toContainEqual(expect.objectContaining({ method: 'uniformMatrix4fv' }));
    });
  });
});

// ============================================================================
// MOCK WEBGL2 CONTEXT TESTS
// ============================================================================

describe('createMockWebGL2Context', () => {
  let canvas: HTMLCanvasElement;
  let gl: WebGL2RenderingContext & {
    __getCallLog: () => CanvasCallRecord[];
    __clearCallLog: () => void;
  };

  beforeEach(() => {
    // Use createMockWebGL2Context directly to get proper call logging
    canvas = createMockCanvas();
    gl = createMockWebGL2Context(canvas) as WebGL2RenderingContext & {
      __getCallLog: () => CanvasCallRecord[];
      __clearCallLog: () => void;
    };
  });

  it('has WebGL2-specific methods', () => {
    expect(gl.createVertexArray).toBeDefined();
    expect(gl.bindVertexArray).toBeDefined();
    expect(gl.drawArraysInstanced).toBeDefined();
    expect(gl.drawElementsInstanced).toBeDefined();
  });

  it('creates vertex array objects', () => {
    const vao = gl.createVertexArray();
    expect(vao).not.toBeNull();
  });

  it('supports instanced drawing', () => {
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 36, 100);
    gl.drawElementsInstanced(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0, 100);
    const calls = gl.__getCallLog();
    expect(calls).toContainEqual(
      expect.objectContaining({ method: 'drawArraysInstanced' })
    );
    expect(calls).toContainEqual(
      expect.objectContaining({ method: 'drawElementsInstanced' })
    );
  });

  it('supports 3D textures', () => {
    gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA, 64, 64, 64, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    const calls = gl.__getCallLog();
    expect(calls).toContainEqual(expect.objectContaining({ method: 'texImage3D' }));
  });

  it('supports transform feedback', () => {
    const tf = gl.createTransformFeedback();
    expect(tf).not.toBeNull();
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK, tf);
    const calls = gl.__getCallLog();
    expect(calls).toContainEqual(expect.objectContaining({ method: 'bindTransformFeedback' }));
  });

  it('reports WebGL 2.0 version', () => {
    const version = gl.getParameter(gl.VERSION);
    expect(version).toContain('WebGL 2.0');
  });
});

// ============================================================================
// ANIMATION FRAME CONTROLLER TESTS
// ============================================================================

describe('AnimationFrameController', () => {
  let controller: AnimationFrameController;

  beforeEach(() => {
    controller = new AnimationFrameController({ frameRate: 60 });
  });

  afterEach(() => {
    controller.reset();
  });

  it('creates controller with default settings', () => {
    const state = controller.getState();
    expect(state.currentTime).toBe(0);
    expect(state.frameCount).toBe(0);
    expect(state.pendingCallbacks).toBe(0);
  });

  it('registers animation frame callbacks', () => {
    const callback = vi.fn();
    const id = controller.requestAnimationFrame(callback);
    expect(id).toBeGreaterThan(0);
    expect(controller.getState().pendingCallbacks).toBe(1);
  });

  it('cancels animation frame callbacks', () => {
    const callback = vi.fn();
    const id = controller.requestAnimationFrame(callback);
    controller.cancelAnimationFrame(id);
    expect(controller.getState().pendingCallbacks).toBe(0);
    controller.tick();
    expect(callback).not.toHaveBeenCalled();
  });

  it('executes callback on tick', () => {
    const callback = vi.fn();
    controller.requestAnimationFrame(callback);
    controller.tick();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.any(Number));
  });

  it('advances time by frame interval', () => {
    controller.tick();
    const state = controller.getState();
    expect(state.currentTime).toBeCloseTo(1000 / 60, 1); // ~16.67ms
    expect(state.frameCount).toBe(1);
  });

  it('ticks multiple frames', () => {
    controller.tickN(10);
    const state = controller.getState();
    expect(state.frameCount).toBe(10);
    expect(state.currentTime).toBeCloseTo((1000 / 60) * 10, 1);
  });

  it('advances by time duration', () => {
    controller.advanceByTime(1000); // 1 second
    const state = controller.getState();
    // 1000ms / (1000/60)ms per frame = 59.94, which floors to 59 frames
    expect(state.frameCount).toBeGreaterThanOrEqual(59);
    expect(state.frameCount).toBeLessThanOrEqual(60);
  });

  it('supports game loop pattern', () => {
    let frames = 0;
    const gameLoop = (time: number) => {
      frames++;
      if (frames < 5) {
        controller.requestAnimationFrame(gameLoop);
      }
    };
    controller.requestAnimationFrame(gameLoop);
    controller.runAllFrames();
    expect(frames).toBe(5);
  });

  it('passes correct timestamp to callbacks', () => {
    const timestamps: number[] = [];
    const callback = (time: number) => {
      timestamps.push(time);
      if (timestamps.length < 3) {
        controller.requestAnimationFrame(callback);
      }
    };
    controller.requestAnimationFrame(callback);
    controller.runAllFrames();
    expect(timestamps[1]).toBeGreaterThan(timestamps[0]);
    expect(timestamps[2]).toBeGreaterThan(timestamps[1]);
  });

  it('resets state', () => {
    controller.tickN(100);
    controller.reset();
    const state = controller.getState();
    expect(state.currentTime).toBe(0);
    expect(state.frameCount).toBe(0);
    expect(state.pendingCallbacks).toBe(0);
  });

  it('respects maxFrames limit', () => {
    const limitedController = new AnimationFrameController({ maxFrames: 10 });
    const callback = (_time: number) => {
      limitedController.requestAnimationFrame(callback);
    };
    limitedController.requestAnimationFrame(callback);
    limitedController.runAllFrames();
    expect(limitedController.getState().frameCount).toBe(10);
  });

  it('installs and uninstalls globally', () => {
    const originalRAF = global.requestAnimationFrame;
    controller.install();
    expect(global.requestAnimationFrame).toBe(controller.requestAnimationFrame);
    controller.uninstall();
    expect(global.requestAnimationFrame).not.toBe(controller.requestAnimationFrame);
  });
});

// ============================================================================
// PERFORMANCE MOCK TESTS
// ============================================================================

describe('PerformanceMock', () => {
  let perfMock: PerformanceMock;

  beforeEach(() => {
    perfMock = new PerformanceMock({ startTime: 0 });
  });

  it('returns configured start time', () => {
    const time = perfMock.now();
    expect(time).toBe(0);
  });

  it('returns same time without auto-increment', () => {
    expect(perfMock.now()).toBe(0);
    expect(perfMock.now()).toBe(0);
    expect(perfMock.now()).toBe(0);
  });

  it('auto-increments when configured', () => {
    const autoMock = new PerformanceMock({ startTime: 0, autoIncrement: true });
    const t1 = autoMock.now();
    const t2 = autoMock.now();
    const t3 = autoMock.now();
    expect(t2).toBeGreaterThan(t1);
    expect(t3).toBeGreaterThan(t2);
  });

  it('advances time manually', () => {
    perfMock.advanceTime(100);
    expect(perfMock.now()).toBe(100);
    perfMock.advanceTime(50);
    expect(perfMock.now()).toBe(150);
  });

  it('sets time directly', () => {
    perfMock.setTime(5000);
    expect(perfMock.now()).toBe(5000);
  });

  it('tracks call count', () => {
    expect(perfMock.getCallCount()).toBe(0);
    perfMock.now();
    perfMock.now();
    perfMock.now();
    expect(perfMock.getCallCount()).toBe(3);
  });

  it('resets state', () => {
    perfMock.advanceTime(1000);
    perfMock.now();
    perfMock.now();
    perfMock.reset(500);
    expect(perfMock.now()).toBe(500);
    expect(perfMock.getCallCount()).toBe(1); // The reset clears count, then we called now()
  });

  it('uses custom time increment', () => {
    const customMock = new PerformanceMock({ timeIncrement: 100, autoIncrement: true });
    customMock.now();
    customMock.now();
    expect(customMock.now()).toBe(300);
  });
});

// ============================================================================
// ASSERTION HELPER TESTS
// ============================================================================

describe('Assertion Helpers', () => {
  describe('assertCanvasCallsInclude', () => {
    it('passes when method was called', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(0, 0, 100, 100);
      expect(() =>
        assertCanvasCallsInclude(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect'
        )
      ).not.toThrow();
    });

    it('fails when method was not called', () => {
      const { ctx } = createTestCanvas2D();
      expect(() =>
        assertCanvasCallsInclude(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect'
        )
      ).toThrow(/Expected canvas method "fillRect" to be called/);
    });

    it('passes when method was called with expected args', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(10, 20, 30, 40);
      expect(() =>
        assertCanvasCallsInclude(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect',
          [10, 20, 30, 40]
        )
      ).not.toThrow();
    });

    it('fails when method was called with different args', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(10, 20, 30, 40);
      expect(() =>
        assertCanvasCallsInclude(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect',
          [1, 2, 3, 4]
        )
      ).toThrow(/Expected canvas method "fillRect" to be called with args/);
    });
  });

  describe('assertWebGLCallsInclude', () => {
    it('passes when WebGL method was called', () => {
      const { gl } = createTestCanvasWebGL();
      gl.clear(gl.COLOR_BUFFER_BIT);
      expect(() =>
        assertWebGLCallsInclude(
          gl as WebGLRenderingContext & { __getCallLog: () => CanvasCallRecord[] },
          'clear'
        )
      ).not.toThrow();
    });

    it('fails when WebGL method was not called', () => {
      const { gl } = createTestCanvasWebGL();
      expect(() =>
        assertWebGLCallsInclude(
          gl as WebGLRenderingContext & { __getCallLog: () => CanvasCallRecord[] },
          'clear'
        )
      ).toThrow(/Expected WebGL method "clear" to be called/);
    });
  });

  describe('getCanvasCallCount', () => {
    it('counts method calls', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(0, 0, 10, 10);
      ctx.fillRect(20, 20, 10, 10);
      ctx.strokeRect(30, 30, 10, 10);
      expect(
        getCanvasCallCount(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect'
        )
      ).toBe(2);
      expect(
        getCanvasCallCount(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'strokeRect'
        )
      ).toBe(1);
    });

    it('returns 0 for uncalled methods', () => {
      const { ctx } = createTestCanvas2D();
      expect(
        getCanvasCallCount(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          'fillRect'
        )
      ).toBe(0);
    });
  });

  describe('assertDrawCallCount', () => {
    it('passes with correct draw call count', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(0, 0, 10, 10);
      ctx.strokeRect(10, 10, 10, 10);
      ctx.fillText('Hello', 50, 50);
      expect(() =>
        assertDrawCallCount(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          3
        )
      ).not.toThrow();
    });

    it('fails with incorrect draw call count', () => {
      const { ctx } = createTestCanvas2D();
      ctx.fillRect(0, 0, 10, 10);
      expect(() =>
        assertDrawCallCount(
          ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] },
          5
        )
      ).toThrow(/Expected 5 draw calls, but got 1/);
    });
  });
});

// ============================================================================
// FACTORY FUNCTION TESTS
// ============================================================================

describe('Factory Functions', () => {
  describe('createTestCanvas2D', () => {
    it('creates canvas with 2D context', () => {
      const { canvas, ctx } = createTestCanvas2D();
      expect(canvas).toBeDefined();
      expect(ctx).toBeDefined();
      expect(ctx.canvas).toBe(canvas);
    });

    it('accepts custom dimensions', () => {
      const { canvas } = createTestCanvas2D(1920, 1080);
      expect(canvas.width).toBe(1920);
      expect(canvas.height).toBe(1080);
    });
  });

  describe('createTestCanvasWebGL', () => {
    it('creates canvas with WebGL context', () => {
      const { canvas, gl } = createTestCanvasWebGL();
      expect(canvas).toBeDefined();
      expect(gl).toBeDefined();
      expect(gl.canvas).toBe(canvas);
    });

    it('accepts custom dimensions', () => {
      const { canvas } = createTestCanvasWebGL(640, 480);
      expect(canvas.width).toBe(640);
      expect(canvas.height).toBe(480);
    });
  });

  describe('createTestCanvasWebGL2', () => {
    it('creates canvas with WebGL2 context', () => {
      const { canvas, gl } = createTestCanvasWebGL2();
      expect(canvas).toBeDefined();
      expect(gl).toBeDefined();
      expect(gl.createVertexArray).toBeDefined();
    });
  });

  describe('createAnimationFrameSetup', () => {
    it('creates and installs animation frame controller', () => {
      const controller = createAnimationFrameSetup({ frameRate: 30 });
      expect(global.requestAnimationFrame).toBe(controller.requestAnimationFrame);
      controller.uninstall();
    });
  });

  describe('createPerformanceSetup', () => {
    it('creates and installs performance mock', () => {
      const mock = createPerformanceSetup({ startTime: 1000 });
      expect(mock.now()).toBe(1000);
      mock.uninstall();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Canvas Mock Integration', () => {
  it('simulates a complete game render frame', () => {
    const { ctx } = createTestCanvas2D(800, 600);

    // Clear canvas
    ctx.clearRect(0, 0, 800, 600);

    // Draw background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, 800, 600);

    // Draw game entities
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(100, 100, 20, 20); // Player
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(300, 200, 20, 20); // Enemy

    // Draw score
    ctx.font = '24px Orbitron';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Score: 1000', 10, 30);

    // Verify all operations were logged
    const calls = (ctx as CanvasRenderingContext2D & { __getCallLog: () => CanvasCallRecord[] }).__getCallLog();
    // 3 fillRect calls: background, player, enemy
    expect(calls.filter((c) => c.method === 'fillRect').length).toBe(3);
    expect(calls.filter((c) => c.method === 'fillText').length).toBe(1);
    expect(calls.filter((c) => c.method === 'clearRect').length).toBe(1);
  });

  it('simulates WebGL rendering pipeline', () => {
    const { gl } = createTestCanvasWebGL(800, 600);

    // Create shader program
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, 'attribute vec3 aPos; void main() { gl_Position = vec4(aPos, 1.0); }');
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, 'void main() { gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); }');
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 0, 1, 0, 0, 0.5, 1, 0]), gl.STATIC_DRAW);

    // Setup attributes
    const posLoc = gl.getAttribLocation(program, 'aPos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // Render
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Verify pipeline
    expect(gl.getShaderParameter(vs, gl.COMPILE_STATUS)).toBe(true);
    expect(gl.getProgramParameter(program, gl.LINK_STATUS)).toBe(true);
  });

  it('simulates game loop with animation frames', () => {
    const { ctx } = createTestCanvas2D();
    const controller = new AnimationFrameController({ frameRate: 60 });
    const perfMock = new PerformanceMock();

    let frameCount = 0;
    let lastTime = 0;
    const deltas: number[] = [];

    const gameLoop = (time: number) => {
      const delta = time - lastTime;
      deltas.push(delta);
      lastTime = time;

      // Clear and draw
      ctx.clearRect(0, 0, 800, 600);
      ctx.fillRect(frameCount * 10, 100, 20, 20);

      frameCount++;
      if (frameCount < 10) {
        controller.requestAnimationFrame(gameLoop);
      }
    };

    controller.requestAnimationFrame(gameLoop);
    controller.runAllFrames();

    expect(frameCount).toBe(10);
    expect(deltas.length).toBe(10);
    // First delta should be the time (since lastTime was 0)
    expect(deltas[0]).toBeCloseTo(1000 / 60, 1);
  });
});
