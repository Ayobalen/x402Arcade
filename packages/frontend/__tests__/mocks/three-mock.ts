/**
 * Three.js and React Three Fiber Test Mocks
 *
 * Mock implementations for Three.js and React Three Fiber for testing.
 * Provides stubs for WebGL rendering and 3D scene management.
 *
 * @module __tests__/mocks/three-mock
 */

import { vi } from 'vitest';
import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Mock WebGL renderer configuration
 */
export interface MockWebGLRendererConfig {
  /** Canvas width (default: 800) */
  width?: number;
  /** Canvas height (default: 600) */
  height?: number;
  /** Pixel ratio (default: 1) */
  pixelRatio?: number;
  /** Whether to auto-clear (default: true) */
  autoClear?: boolean;
  /** Whether to track render calls (default: true) */
  trackRenderCalls?: boolean;
}

/**
 * Render call record for tracking
 */
export interface RenderCallRecord {
  timestamp: number;
  scene: MockScene;
  camera: MockCamera;
}

/**
 * Mock Vector3 implementation
 */
export interface MockVector3 {
  x: number;
  y: number;
  z: number;
  set: (x: number, y: number, z: number) => MockVector3;
  copy: (v: MockVector3) => MockVector3;
  add: (v: MockVector3) => MockVector3;
  sub: (v: MockVector3) => MockVector3;
  multiplyScalar: (s: number) => MockVector3;
  normalize: () => MockVector3;
  length: () => number;
  clone: () => MockVector3;
}

/**
 * Mock Euler implementation
 */
export interface MockEuler {
  x: number;
  y: number;
  z: number;
  order: string;
  set: (x: number, y: number, z: number, order?: string) => MockEuler;
}

/**
 * Mock Color implementation
 */
export interface MockColor {
  r: number;
  g: number;
  b: number;
  set: (color: number | string) => MockColor;
  setHex: (hex: number) => MockColor;
  getHex: () => number;
  clone: () => MockColor;
}

// ============================================================================
// MOCK CLASSES - MATH
// ============================================================================

/**
 * Mock Vector3 class
 */
export class MockVector3Impl implements MockVector3 {
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  set(x: number, y: number, z: number): MockVector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  copy(v: MockVector3): MockVector3 {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  add(v: MockVector3): MockVector3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: MockVector3): MockVector3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiplyScalar(s: number): MockVector3 {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  normalize(): MockVector3 {
    const len = this.length();
    if (len > 0) {
      this.multiplyScalar(1 / len);
    }
    return this;
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  clone(): MockVector3 {
    return new MockVector3Impl(this.x, this.y, this.z);
  }
}

/**
 * Mock Euler class
 */
export class MockEulerImpl implements MockEuler {
  x: number;
  y: number;
  z: number;
  order: string;

  constructor(x = 0, y = 0, z = 0, order = 'XYZ') {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
  }

  set(x: number, y: number, z: number, order = 'XYZ'): MockEuler {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    return this;
  }
}

/**
 * Mock Color class
 */
export class MockColorImpl implements MockColor {
  r: number;
  g: number;
  b: number;

  constructor(color?: number | string) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    if (color !== undefined) {
      this.set(color);
    }
  }

  set(color: number | string): MockColor {
    if (typeof color === 'number') {
      this.setHex(color);
    } else {
      // Simple CSS color parsing for testing
      if (color.startsWith('#')) {
        this.setHex(parseInt(color.slice(1), 16));
      }
    }
    return this;
  }

  setHex(hex: number): MockColor {
    this.r = ((hex >> 16) & 255) / 255;
    this.g = ((hex >> 8) & 255) / 255;
    this.b = (hex & 255) / 255;
    return this;
  }

  getHex(): number {
    return (
      (Math.round(this.r * 255) << 16) |
      (Math.round(this.g * 255) << 8) |
      Math.round(this.b * 255)
    );
  }

  clone(): MockColor {
    const c = new MockColorImpl();
    c.r = this.r;
    c.g = this.g;
    c.b = this.b;
    return c;
  }
}

/**
 * Mock Matrix4 class
 */
export class MockMatrix4 {
  elements: number[];

  constructor() {
    this.elements = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  identity(): MockMatrix4 {
    this.elements = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
    return this;
  }

  makeTranslation(x: number, y: number, z: number): MockMatrix4 {
    this.elements[12] = x;
    this.elements[13] = y;
    this.elements[14] = z;
    return this;
  }

  makeRotationX(theta: number): MockMatrix4 {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    this.elements[5] = c;
    this.elements[6] = s;
    this.elements[9] = -s;
    this.elements[10] = c;
    return this;
  }

  multiply(m: MockMatrix4): MockMatrix4 {
    // Simplified matrix multiply for testing
    return this;
  }

  clone(): MockMatrix4 {
    const m = new MockMatrix4();
    m.elements = [...this.elements];
    return m;
  }
}

// ============================================================================
// MOCK CLASSES - SCENE GRAPH
// ============================================================================

/**
 * Mock Object3D base class
 */
export class MockObject3D {
  uuid: string;
  name: string;
  type: string;
  position: MockVector3;
  rotation: MockEuler;
  scale: MockVector3;
  visible: boolean;
  children: MockObject3D[];
  parent: MockObject3D | null;
  userData: Record<string, unknown>;
  matrix: MockMatrix4;
  matrixWorld: MockMatrix4;
  matrixAutoUpdate: boolean;

  constructor() {
    this.uuid = Math.random().toString(36).substr(2, 9);
    this.name = '';
    this.type = 'Object3D';
    this.position = new MockVector3Impl();
    this.rotation = new MockEulerImpl();
    this.scale = new MockVector3Impl(1, 1, 1);
    this.visible = true;
    this.children = [];
    this.parent = null;
    this.userData = {};
    this.matrix = new MockMatrix4();
    this.matrixWorld = new MockMatrix4();
    this.matrixAutoUpdate = true;
  }

  add(object: MockObject3D): this {
    object.parent = this;
    this.children.push(object);
    return this;
  }

  remove(object: MockObject3D): this {
    const index = this.children.indexOf(object);
    if (index !== -1) {
      object.parent = null;
      this.children.splice(index, 1);
    }
    return this;
  }

  traverse(callback: (object: MockObject3D) => void): void {
    callback(this);
    for (const child of this.children) {
      child.traverse(callback);
    }
  }

  updateMatrix(): void {
    // Mock update
  }

  updateMatrixWorld(force?: boolean): void {
    // Mock update
  }

  lookAt(x: number | MockVector3, y?: number, z?: number): void {
    // Mock lookAt
  }

  clone(recursive?: boolean): MockObject3D {
    const cloned = new MockObject3D();
    cloned.name = this.name;
    cloned.position.copy(this.position);
    cloned.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.order);
    cloned.scale.copy(this.scale);
    cloned.visible = this.visible;
    return cloned;
  }
}

/**
 * Mock Scene class
 */
export class MockScene extends MockObject3D {
  background: MockColor | null;
  fog: unknown;
  environment: unknown;

  constructor() {
    super();
    this.type = 'Scene';
    this.background = null;
    this.fog = null;
    this.environment = null;
  }
}

/**
 * Mock Camera base class
 */
export class MockCamera extends MockObject3D {
  matrixWorldInverse: MockMatrix4;
  projectionMatrix: MockMatrix4;
  projectionMatrixInverse: MockMatrix4;

  constructor() {
    super();
    this.type = 'Camera';
    this.matrixWorldInverse = new MockMatrix4();
    this.projectionMatrix = new MockMatrix4();
    this.projectionMatrixInverse = new MockMatrix4();
  }

  updateProjectionMatrix(): void {
    // Mock update
  }
}

/**
 * Mock PerspectiveCamera class
 */
export class MockPerspectiveCamera extends MockCamera {
  fov: number;
  aspect: number;
  near: number;
  far: number;

  constructor(fov = 50, aspect = 1, near = 0.1, far = 2000) {
    super();
    this.type = 'PerspectiveCamera';
    this.fov = fov;
    this.aspect = aspect;
    this.near = near;
    this.far = far;
  }
}

/**
 * Mock OrthographicCamera class
 */
export class MockOrthographicCamera extends MockCamera {
  left: number;
  right: number;
  top: number;
  bottom: number;
  near: number;
  far: number;

  constructor(left = -1, right = 1, top = 1, bottom = -1, near = 0.1, far = 2000) {
    super();
    this.type = 'OrthographicCamera';
    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
  }
}

// ============================================================================
// MOCK CLASSES - LIGHTS
// ============================================================================

/**
 * Mock Light base class
 */
export class MockLight extends MockObject3D {
  color: MockColor;
  intensity: number;

  constructor(color = 0xffffff, intensity = 1) {
    super();
    this.type = 'Light';
    this.color = new MockColorImpl(color);
    this.intensity = intensity;
  }
}

/**
 * Mock AmbientLight class
 */
export class MockAmbientLight extends MockLight {
  constructor(color = 0xffffff, intensity = 1) {
    super(color, intensity);
    this.type = 'AmbientLight';
  }
}

/**
 * Mock DirectionalLight class
 */
export class MockDirectionalLight extends MockLight {
  target: MockObject3D;
  shadow: unknown;

  constructor(color = 0xffffff, intensity = 1) {
    super(color, intensity);
    this.type = 'DirectionalLight';
    this.target = new MockObject3D();
    this.shadow = {};
  }
}

/**
 * Mock PointLight class
 */
export class MockPointLight extends MockLight {
  distance: number;
  decay: number;

  constructor(color = 0xffffff, intensity = 1, distance = 0, decay = 2) {
    super(color, intensity);
    this.type = 'PointLight';
    this.distance = distance;
    this.decay = decay;
  }
}

/**
 * Mock SpotLight class
 */
export class MockSpotLight extends MockLight {
  target: MockObject3D;
  angle: number;
  penumbra: number;
  distance: number;
  decay: number;

  constructor(color = 0xffffff, intensity = 1, distance = 0, angle = Math.PI / 3, penumbra = 0, decay = 2) {
    super(color, intensity);
    this.type = 'SpotLight';
    this.target = new MockObject3D();
    this.angle = angle;
    this.penumbra = penumbra;
    this.distance = distance;
    this.decay = decay;
  }
}

// ============================================================================
// MOCK CLASSES - GEOMETRY
// ============================================================================

/**
 * Mock BufferGeometry class
 */
export class MockBufferGeometry {
  uuid: string;
  type: string;
  attributes: Record<string, unknown>;
  index: unknown;
  boundingBox: unknown;
  boundingSphere: unknown;

  constructor() {
    this.uuid = Math.random().toString(36).substr(2, 9);
    this.type = 'BufferGeometry';
    this.attributes = {};
    this.index = null;
    this.boundingBox = null;
    this.boundingSphere = null;
  }

  setAttribute(name: string, attribute: unknown): this {
    this.attributes[name] = attribute;
    return this;
  }

  getAttribute(name: string): unknown {
    return this.attributes[name];
  }

  computeBoundingBox(): void {}
  computeBoundingSphere(): void {}

  dispose(): void {
    // Mock dispose
  }
}

/**
 * Mock BoxGeometry class
 */
export class MockBoxGeometry extends MockBufferGeometry {
  width: number;
  height: number;
  depth: number;

  constructor(width = 1, height = 1, depth = 1) {
    super();
    this.type = 'BoxGeometry';
    this.width = width;
    this.height = height;
    this.depth = depth;
  }
}

/**
 * Mock SphereGeometry class
 */
export class MockSphereGeometry extends MockBufferGeometry {
  radius: number;

  constructor(radius = 1, widthSegments = 32, heightSegments = 16) {
    super();
    this.type = 'SphereGeometry';
    this.radius = radius;
  }
}

/**
 * Mock PlaneGeometry class
 */
export class MockPlaneGeometry extends MockBufferGeometry {
  width: number;
  height: number;

  constructor(width = 1, height = 1) {
    super();
    this.type = 'PlaneGeometry';
    this.width = width;
    this.height = height;
  }
}

/**
 * Mock CylinderGeometry class
 */
export class MockCylinderGeometry extends MockBufferGeometry {
  radiusTop: number;
  radiusBottom: number;
  height: number;

  constructor(radiusTop = 1, radiusBottom = 1, height = 1) {
    super();
    this.type = 'CylinderGeometry';
    this.radiusTop = radiusTop;
    this.radiusBottom = radiusBottom;
    this.height = height;
  }
}

// ============================================================================
// MOCK CLASSES - MATERIALS
// ============================================================================

/**
 * Mock Material base class
 */
export class MockMaterial {
  uuid: string;
  type: string;
  name: string;
  opacity: number;
  transparent: boolean;
  visible: boolean;
  side: number;
  needsUpdate: boolean;

  constructor() {
    this.uuid = Math.random().toString(36).substr(2, 9);
    this.type = 'Material';
    this.name = '';
    this.opacity = 1;
    this.transparent = false;
    this.visible = true;
    this.side = 0; // FrontSide
    this.needsUpdate = false;
  }

  dispose(): void {
    // Mock dispose
  }

  clone(): MockMaterial {
    const m = new MockMaterial();
    m.opacity = this.opacity;
    m.transparent = this.transparent;
    m.visible = this.visible;
    return m;
  }
}

/**
 * Mock MeshBasicMaterial class
 */
export class MockMeshBasicMaterial extends MockMaterial {
  color: MockColor;
  wireframe: boolean;
  map: unknown;

  constructor(parameters?: { color?: number | string; wireframe?: boolean; map?: unknown }) {
    super();
    this.type = 'MeshBasicMaterial';
    this.color = new MockColorImpl(parameters?.color ?? 0xffffff);
    this.wireframe = parameters?.wireframe ?? false;
    this.map = parameters?.map ?? null;
  }
}

/**
 * Mock MeshStandardMaterial class
 */
export class MockMeshStandardMaterial extends MockMaterial {
  color: MockColor;
  roughness: number;
  metalness: number;
  map: unknown;
  normalMap: unknown;
  emissive: MockColor;
  emissiveIntensity: number;

  constructor(parameters?: {
    color?: number | string;
    roughness?: number;
    metalness?: number;
    emissive?: number | string;
    emissiveIntensity?: number;
  }) {
    super();
    this.type = 'MeshStandardMaterial';
    this.color = new MockColorImpl(parameters?.color ?? 0xffffff);
    this.roughness = parameters?.roughness ?? 1;
    this.metalness = parameters?.metalness ?? 0;
    this.map = null;
    this.normalMap = null;
    this.emissive = new MockColorImpl(parameters?.emissive ?? 0x000000);
    this.emissiveIntensity = parameters?.emissiveIntensity ?? 1;
  }
}

/**
 * Mock MeshPhongMaterial class
 */
export class MockMeshPhongMaterial extends MockMaterial {
  color: MockColor;
  specular: MockColor;
  shininess: number;

  constructor(parameters?: { color?: number | string; specular?: number | string; shininess?: number }) {
    super();
    this.type = 'MeshPhongMaterial';
    this.color = new MockColorImpl(parameters?.color ?? 0xffffff);
    this.specular = new MockColorImpl(parameters?.specular ?? 0x111111);
    this.shininess = parameters?.shininess ?? 30;
  }
}

/**
 * Mock ShaderMaterial class
 */
export class MockShaderMaterial extends MockMaterial {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;

  constructor(parameters?: {
    vertexShader?: string;
    fragmentShader?: string;
    uniforms?: Record<string, { value: unknown }>;
  }) {
    super();
    this.type = 'ShaderMaterial';
    this.vertexShader = parameters?.vertexShader ?? '';
    this.fragmentShader = parameters?.fragmentShader ?? '';
    this.uniforms = parameters?.uniforms ?? {};
  }
}

// ============================================================================
// MOCK CLASSES - MESH
// ============================================================================

/**
 * Mock Mesh class
 */
export class MockMesh extends MockObject3D {
  geometry: MockBufferGeometry;
  material: MockMaterial | MockMaterial[];

  constructor(geometry?: MockBufferGeometry, material?: MockMaterial | MockMaterial[]) {
    super();
    this.type = 'Mesh';
    this.geometry = geometry ?? new MockBufferGeometry();
    this.material = material ?? new MockMaterial();
  }
}

/**
 * Mock Group class
 */
export class MockGroup extends MockObject3D {
  constructor() {
    super();
    this.type = 'Group';
  }
}

// ============================================================================
// MOCK CLASSES - RENDERER
// ============================================================================

/**
 * Mock WebGLRenderer class
 */
export class MockWebGLRenderer {
  domElement: HTMLCanvasElement;
  private config: Required<MockWebGLRendererConfig>;
  private renderCalls: RenderCallRecord[];
  shadowMap: { enabled: boolean; type: number };
  outputColorSpace: string;
  toneMapping: number;
  toneMappingExposure: number;

  constructor(parameters?: { canvas?: HTMLCanvasElement; antialias?: boolean; alpha?: boolean }) {
    this.domElement = parameters?.canvas ?? document.createElement('canvas');
    this.config = {
      width: 800,
      height: 600,
      pixelRatio: 1,
      autoClear: true,
      trackRenderCalls: true,
    };
    this.renderCalls = [];
    this.shadowMap = { enabled: false, type: 0 };
    this.outputColorSpace = 'srgb';
    this.toneMapping = 0;
    this.toneMappingExposure = 1;
  }

  setSize(width: number, height: number, updateStyle?: boolean): void {
    this.config.width = width;
    this.config.height = height;
    this.domElement.width = width;
    this.domElement.height = height;
  }

  setPixelRatio(value: number): void {
    this.config.pixelRatio = value;
  }

  getSize(target: { width: number; height: number }): { width: number; height: number } {
    target.width = this.config.width;
    target.height = this.config.height;
    return target;
  }

  getPixelRatio(): number {
    return this.config.pixelRatio;
  }

  render(scene: MockScene, camera: MockCamera): void {
    if (this.config.trackRenderCalls) {
      this.renderCalls.push({
        timestamp: Date.now(),
        scene,
        camera,
      });
    }
  }

  clear(color?: boolean, depth?: boolean, stencil?: boolean): void {
    // Mock clear
  }

  setAnimationLoop(callback: ((time: number) => void) | null): void {
    // Mock animation loop - in tests, we don't actually run it
  }

  dispose(): void {
    this.renderCalls = [];
  }

  // Test helpers
  getRenderCalls(): RenderCallRecord[] {
    return [...this.renderCalls];
  }

  getRenderCallCount(): number {
    return this.renderCalls.length;
  }

  clearRenderCalls(): void {
    this.renderCalls = [];
  }
}

// ============================================================================
// MOCK CLASSES - LOADERS
// ============================================================================

/**
 * Mock TextureLoader class
 */
export class MockTextureLoader {
  load(
    url: string,
    onLoad?: (texture: MockTexture) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (event: ErrorEvent) => void
  ): MockTexture {
    const texture = new MockTexture();
    texture.name = url;
    if (onLoad) {
      setTimeout(() => onLoad(texture), 0);
    }
    return texture;
  }

  loadAsync(url: string): Promise<MockTexture> {
    return new Promise((resolve) => {
      const texture = new MockTexture();
      texture.name = url;
      setTimeout(() => resolve(texture), 0);
    });
  }
}

/**
 * Mock Texture class
 */
export class MockTexture {
  uuid: string;
  name: string;
  image: unknown;
  needsUpdate: boolean;

  constructor() {
    this.uuid = Math.random().toString(36).substr(2, 9);
    this.name = '';
    this.image = null;
    this.needsUpdate = false;
  }

  dispose(): void {}
}

// ============================================================================
// MOCK THREE NAMESPACE
// ============================================================================

/**
 * Complete mock THREE namespace
 */
export const mockTHREE = {
  // Math
  Vector3: MockVector3Impl,
  Euler: MockEulerImpl,
  Color: MockColorImpl,
  Matrix4: MockMatrix4,

  // Scene Graph
  Object3D: MockObject3D,
  Scene: MockScene,
  Group: MockGroup,
  Mesh: MockMesh,

  // Cameras
  Camera: MockCamera,
  PerspectiveCamera: MockPerspectiveCamera,
  OrthographicCamera: MockOrthographicCamera,

  // Lights
  Light: MockLight,
  AmbientLight: MockAmbientLight,
  DirectionalLight: MockDirectionalLight,
  PointLight: MockPointLight,
  SpotLight: MockSpotLight,

  // Geometries
  BufferGeometry: MockBufferGeometry,
  BoxGeometry: MockBoxGeometry,
  SphereGeometry: MockSphereGeometry,
  PlaneGeometry: MockPlaneGeometry,
  CylinderGeometry: MockCylinderGeometry,

  // Materials
  Material: MockMaterial,
  MeshBasicMaterial: MockMeshBasicMaterial,
  MeshStandardMaterial: MockMeshStandardMaterial,
  MeshPhongMaterial: MockMeshPhongMaterial,
  ShaderMaterial: MockShaderMaterial,

  // Renderer
  WebGLRenderer: MockWebGLRenderer,

  // Loaders
  TextureLoader: MockTextureLoader,
  Texture: MockTexture,

  // Constants
  FrontSide: 0,
  BackSide: 1,
  DoubleSide: 2,
  NoToneMapping: 0,
  LinearToneMapping: 1,
  ReinhardToneMapping: 2,
  CineonToneMapping: 3,
  ACESFilmicToneMapping: 4,
};

// ============================================================================
// REACT THREE FIBER MOCKS
// ============================================================================

/**
 * Mock Canvas component for @react-three/fiber
 */
export const MockCanvas = vi.fn(
  ({ children, camera, gl, shadows, ...props }: {
    children?: React.ReactNode;
    camera?: unknown;
    gl?: unknown;
    shadows?: boolean;
    [key: string]: unknown;
  }) => {
    return React.createElement(
      'div',
      {
        'data-testid': 'r3f-canvas',
        'data-camera': JSON.stringify(camera ?? {}),
        'data-gl': JSON.stringify(gl ?? {}),
        'data-shadows': shadows,
        ...props,
      },
      children
    );
  }
);

/**
 * Mock useThree hook
 */
export const mockUseThree = vi.fn(() => ({
  scene: new MockScene(),
  camera: new MockPerspectiveCamera(),
  gl: new MockWebGLRenderer(),
  size: { width: 800, height: 600 },
  viewport: { width: 800, height: 600, factor: 1 },
  clock: { elapsedTime: 0, getDelta: () => 0.016 },
  mouse: new MockVector3Impl(),
  raycaster: {},
  invalidate: vi.fn(),
  advance: vi.fn(),
}));

/**
 * Mock useFrame hook
 */
export const mockUseFrame = vi.fn((callback: (state: unknown, delta: number) => void) => {
  // In tests, we don't actually run the frame loop
  // Instead, tests can call the callback directly if needed
});

/**
 * Mock useLoader hook
 */
export const mockUseLoader = vi.fn((loader: unknown, url: string | string[]) => {
  // Return a mock texture or model
  if (Array.isArray(url)) {
    return url.map(() => new MockTexture());
  }
  return new MockTexture();
});

/**
 * Creates a module mock for three
 */
export function createThreeMock() {
  return {
    ...mockTHREE,
    default: mockTHREE,
  };
}

/**
 * Creates a module mock for @react-three/fiber
 */
export function createReactThreeFiberMock() {
  return {
    Canvas: MockCanvas,
    useThree: mockUseThree,
    useFrame: mockUseFrame,
    useLoader: mockUseLoader,
    extend: vi.fn(),
    addEffect: vi.fn(),
    addAfterEffect: vi.fn(),
    addTail: vi.fn(),
  };
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a test scene with common objects
 */
export function createTestScene(): {
  scene: MockScene;
  camera: MockPerspectiveCamera;
  renderer: MockWebGLRenderer;
} {
  const scene = new MockScene();
  const camera = new MockPerspectiveCamera(75, 16 / 9, 0.1, 1000);
  camera.position.set(0, 0, 5);
  const renderer = new MockWebGLRenderer();
  renderer.setSize(800, 600);
  return { scene, camera, renderer };
}

/**
 * Creates a mesh with geometry and material
 */
export function createTestMesh(
  geometry: 'box' | 'sphere' | 'plane' = 'box',
  color = 0x00ffff
): MockMesh {
  let geo: MockBufferGeometry;
  switch (geometry) {
    case 'sphere':
      geo = new MockSphereGeometry(1);
      break;
    case 'plane':
      geo = new MockPlaneGeometry(1, 1);
      break;
    case 'box':
    default:
      geo = new MockBoxGeometry(1, 1, 1);
  }
  const material = new MockMeshStandardMaterial({ color });
  return new MockMesh(geo, material);
}

/**
 * Asserts that a scene contains a specific number of objects
 */
export function assertSceneObjectCount(scene: MockScene, expectedCount: number): void {
  let count = 0;
  scene.traverse(() => {
    count++;
  });
  // Subtract 1 to exclude the scene itself
  const actualCount = count - 1;
  if (actualCount !== expectedCount) {
    throw new Error(`Expected scene to have ${expectedCount} objects, but found ${actualCount}`);
  }
}

/**
 * Asserts that a mesh has the expected geometry type
 */
export function assertMeshGeometry(mesh: MockMesh, expectedType: string): void {
  if (mesh.geometry.type !== expectedType) {
    throw new Error(`Expected mesh to have ${expectedType}, but has ${mesh.geometry.type}`);
  }
}

/**
 * Asserts that a renderer has been called a specific number of times
 */
export function assertRenderCallCount(renderer: MockWebGLRenderer, expectedCount: number): void {
  const actualCount = renderer.getRenderCallCount();
  if (actualCount !== expectedCount) {
    throw new Error(`Expected ${expectedCount} render calls, but got ${actualCount}`);
  }
}
