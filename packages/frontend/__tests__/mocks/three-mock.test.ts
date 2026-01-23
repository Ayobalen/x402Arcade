/**
 * Three.js and React Three Fiber Mock Tests
 *
 * Tests for Three.js and React Three Fiber test mocks.
 *
 * @module __tests__/mocks/three-mock.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import {
  // Types
  type MockVector3,
  type MockColor,
  type RenderCallRecord,
  // Math classes
  MockVector3Impl,
  MockEulerImpl,
  MockColorImpl,
  MockMatrix4,
  // Scene graph
  MockObject3D,
  MockScene,
  MockGroup,
  MockMesh,
  // Cameras
  MockCamera,
  MockPerspectiveCamera,
  MockOrthographicCamera,
  // Lights
  MockLight,
  MockAmbientLight,
  MockDirectionalLight,
  MockPointLight,
  MockSpotLight,
  // Geometries
  MockBufferGeometry,
  MockBoxGeometry,
  MockSphereGeometry,
  MockPlaneGeometry,
  MockCylinderGeometry,
  // Materials
  MockMaterial,
  MockMeshBasicMaterial,
  MockMeshStandardMaterial,
  MockMeshPhongMaterial,
  MockShaderMaterial,
  // Renderer
  MockWebGLRenderer,
  // Loaders
  MockTextureLoader,
  MockTexture,
  // Mocks
  mockTHREE,
  MockCanvas,
  mockUseThree,
  mockUseFrame,
  mockUseLoader,
  createThreeMock,
  createReactThreeFiberMock,
  // Test utilities
  createTestScene,
  createTestMesh,
  assertSceneObjectCount,
  assertMeshGeometry,
  assertRenderCallCount,
} from './three-mock';

describe('Three.js Mocks', () => {
  // ============================================================================
  // MATH CLASSES TESTS
  // ============================================================================

  describe('Math Classes', () => {
    describe('MockVector3Impl', () => {
      it('creates with default values', () => {
        const v = new MockVector3Impl();
        expect(v.x).toBe(0);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
      });

      it('creates with specified values', () => {
        const v = new MockVector3Impl(1, 2, 3);
        expect(v.x).toBe(1);
        expect(v.y).toBe(2);
        expect(v.z).toBe(3);
      });

      it('set changes values', () => {
        const v = new MockVector3Impl();
        v.set(4, 5, 6);
        expect(v.x).toBe(4);
        expect(v.y).toBe(5);
        expect(v.z).toBe(6);
      });

      it('copy copies from another vector', () => {
        const v1 = new MockVector3Impl(1, 2, 3);
        const v2 = new MockVector3Impl();
        v2.copy(v1);
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
      });

      it('add adds vectors', () => {
        const v1 = new MockVector3Impl(1, 2, 3);
        const v2 = new MockVector3Impl(4, 5, 6);
        v1.add(v2);
        expect(v1.x).toBe(5);
        expect(v1.y).toBe(7);
        expect(v1.z).toBe(9);
      });

      it('sub subtracts vectors', () => {
        const v1 = new MockVector3Impl(4, 5, 6);
        const v2 = new MockVector3Impl(1, 2, 3);
        v1.sub(v2);
        expect(v1.x).toBe(3);
        expect(v1.y).toBe(3);
        expect(v1.z).toBe(3);
      });

      it('multiplyScalar scales vector', () => {
        const v = new MockVector3Impl(1, 2, 3);
        v.multiplyScalar(2);
        expect(v.x).toBe(2);
        expect(v.y).toBe(4);
        expect(v.z).toBe(6);
      });

      it('length calculates magnitude', () => {
        const v = new MockVector3Impl(3, 4, 0);
        expect(v.length()).toBe(5);
      });

      it('normalize normalizes vector', () => {
        const v = new MockVector3Impl(3, 0, 0);
        v.normalize();
        expect(v.x).toBe(1);
        expect(v.y).toBe(0);
        expect(v.z).toBe(0);
      });

      it('clone creates copy', () => {
        const v1 = new MockVector3Impl(1, 2, 3);
        const v2 = v1.clone();
        expect(v2.x).toBe(1);
        expect(v2.y).toBe(2);
        expect(v2.z).toBe(3);
        expect(v2).not.toBe(v1);
      });
    });

    describe('MockEulerImpl', () => {
      it('creates with default values', () => {
        const e = new MockEulerImpl();
        expect(e.x).toBe(0);
        expect(e.y).toBe(0);
        expect(e.z).toBe(0);
        expect(e.order).toBe('XYZ');
      });

      it('creates with specified values', () => {
        const e = new MockEulerImpl(Math.PI, 0, Math.PI / 2, 'YXZ');
        expect(e.x).toBeCloseTo(Math.PI);
        expect(e.y).toBe(0);
        expect(e.z).toBeCloseTo(Math.PI / 2);
        expect(e.order).toBe('YXZ');
      });

      it('set changes values', () => {
        const e = new MockEulerImpl();
        e.set(1, 2, 3, 'ZYX');
        expect(e.x).toBe(1);
        expect(e.y).toBe(2);
        expect(e.z).toBe(3);
        expect(e.order).toBe('ZYX');
      });
    });

    describe('MockColorImpl', () => {
      it('creates white by default', () => {
        const c = new MockColorImpl();
        expect(c.r).toBe(1);
        expect(c.g).toBe(1);
        expect(c.b).toBe(1);
      });

      it('creates from hex number', () => {
        const c = new MockColorImpl(0x00ffff);
        expect(c.r).toBeCloseTo(0);
        expect(c.g).toBeCloseTo(1);
        expect(c.b).toBeCloseTo(1);
      });

      it('setHex sets color from hex', () => {
        const c = new MockColorImpl();
        c.setHex(0xff0000);
        expect(c.r).toBeCloseTo(1);
        expect(c.g).toBeCloseTo(0);
        expect(c.b).toBeCloseTo(0);
      });

      it('getHex returns hex value', () => {
        const c = new MockColorImpl(0x00ff00);
        expect(c.getHex()).toBe(0x00ff00);
      });

      it('clone creates copy', () => {
        const c1 = new MockColorImpl(0xff00ff);
        const c2 = c1.clone();
        expect(c2.r).toBeCloseTo(c1.r);
        expect(c2.g).toBeCloseTo(c1.g);
        expect(c2.b).toBeCloseTo(c1.b);
        expect(c2).not.toBe(c1);
      });
    });

    describe('MockMatrix4', () => {
      it('creates identity matrix', () => {
        const m = new MockMatrix4();
        expect(m.elements[0]).toBe(1);
        expect(m.elements[5]).toBe(1);
        expect(m.elements[10]).toBe(1);
        expect(m.elements[15]).toBe(1);
      });

      it('makeTranslation sets translation', () => {
        const m = new MockMatrix4();
        m.makeTranslation(1, 2, 3);
        expect(m.elements[12]).toBe(1);
        expect(m.elements[13]).toBe(2);
        expect(m.elements[14]).toBe(3);
      });

      it('clone creates copy', () => {
        const m1 = new MockMatrix4();
        m1.makeTranslation(5, 6, 7);
        const m2 = m1.clone();
        expect(m2.elements[12]).toBe(5);
        expect(m2).not.toBe(m1);
      });
    });
  });

  // ============================================================================
  // SCENE GRAPH TESTS
  // ============================================================================

  describe('Scene Graph', () => {
    describe('MockObject3D', () => {
      it('creates with unique uuid', () => {
        const o1 = new MockObject3D();
        const o2 = new MockObject3D();
        expect(o1.uuid).toBeDefined();
        expect(o2.uuid).toBeDefined();
        expect(o1.uuid).not.toBe(o2.uuid);
      });

      it('has default position, rotation, scale', () => {
        const o = new MockObject3D();
        expect(o.position.x).toBe(0);
        expect(o.rotation.x).toBe(0);
        expect(o.scale.x).toBe(1);
      });

      it('add adds child', () => {
        const parent = new MockObject3D();
        const child = new MockObject3D();
        parent.add(child);
        expect(parent.children).toContain(child);
        expect(child.parent).toBe(parent);
      });

      it('remove removes child', () => {
        const parent = new MockObject3D();
        const child = new MockObject3D();
        parent.add(child);
        parent.remove(child);
        expect(parent.children).not.toContain(child);
        expect(child.parent).toBeNull();
      });

      it('traverse visits all objects', () => {
        const parent = new MockObject3D();
        const child1 = new MockObject3D();
        const child2 = new MockObject3D();
        const grandchild = new MockObject3D();
        parent.add(child1);
        parent.add(child2);
        child1.add(grandchild);

        const visited: MockObject3D[] = [];
        parent.traverse((obj) => visited.push(obj));

        expect(visited).toContain(parent);
        expect(visited).toContain(child1);
        expect(visited).toContain(child2);
        expect(visited).toContain(grandchild);
        expect(visited).toHaveLength(4);
      });

      it('clone creates copy', () => {
        const o1 = new MockObject3D();
        o1.name = 'test';
        o1.position.set(1, 2, 3);
        const o2 = o1.clone();
        expect(o2.name).toBe('test');
        expect(o2.position.x).toBe(1);
        expect(o2).not.toBe(o1);
      });
    });

    describe('MockScene', () => {
      it('has type Scene', () => {
        const scene = new MockScene();
        expect(scene.type).toBe('Scene');
      });

      it('has background property', () => {
        const scene = new MockScene();
        expect(scene.background).toBeNull();
        scene.background = new MockColorImpl(0x000000);
        expect(scene.background).toBeDefined();
      });
    });

    describe('MockGroup', () => {
      it('has type Group', () => {
        const group = new MockGroup();
        expect(group.type).toBe('Group');
      });
    });

    describe('MockMesh', () => {
      it('has geometry and material', () => {
        const mesh = new MockMesh();
        expect(mesh.geometry).toBeInstanceOf(MockBufferGeometry);
        expect(mesh.material).toBeInstanceOf(MockMaterial);
      });

      it('accepts custom geometry and material', () => {
        const geo = new MockBoxGeometry(2, 2, 2);
        const mat = new MockMeshBasicMaterial({ color: 0xff0000 });
        const mesh = new MockMesh(geo, mat);
        expect(mesh.geometry).toBe(geo);
        expect(mesh.material).toBe(mat);
      });
    });
  });

  // ============================================================================
  // CAMERA TESTS
  // ============================================================================

  describe('Cameras', () => {
    describe('MockPerspectiveCamera', () => {
      it('has type PerspectiveCamera', () => {
        const camera = new MockPerspectiveCamera();
        expect(camera.type).toBe('PerspectiveCamera');
      });

      it('accepts fov, aspect, near, far', () => {
        const camera = new MockPerspectiveCamera(75, 16 / 9, 0.1, 1000);
        expect(camera.fov).toBe(75);
        expect(camera.aspect).toBeCloseTo(16 / 9);
        expect(camera.near).toBe(0.1);
        expect(camera.far).toBe(1000);
      });

      it('has projection matrices', () => {
        const camera = new MockPerspectiveCamera();
        expect(camera.projectionMatrix).toBeInstanceOf(MockMatrix4);
        expect(camera.projectionMatrixInverse).toBeInstanceOf(MockMatrix4);
      });
    });

    describe('MockOrthographicCamera', () => {
      it('has type OrthographicCamera', () => {
        const camera = new MockOrthographicCamera();
        expect(camera.type).toBe('OrthographicCamera');
      });

      it('accepts left, right, top, bottom, near, far', () => {
        const camera = new MockOrthographicCamera(-10, 10, 10, -10, 1, 100);
        expect(camera.left).toBe(-10);
        expect(camera.right).toBe(10);
        expect(camera.top).toBe(10);
        expect(camera.bottom).toBe(-10);
      });
    });
  });

  // ============================================================================
  // LIGHT TESTS
  // ============================================================================

  describe('Lights', () => {
    describe('MockAmbientLight', () => {
      it('has type AmbientLight', () => {
        const light = new MockAmbientLight();
        expect(light.type).toBe('AmbientLight');
      });

      it('accepts color and intensity', () => {
        const light = new MockAmbientLight(0xffffff, 0.5);
        expect(light.intensity).toBe(0.5);
      });
    });

    describe('MockDirectionalLight', () => {
      it('has type DirectionalLight', () => {
        const light = new MockDirectionalLight();
        expect(light.type).toBe('DirectionalLight');
      });

      it('has target', () => {
        const light = new MockDirectionalLight();
        expect(light.target).toBeInstanceOf(MockObject3D);
      });
    });

    describe('MockPointLight', () => {
      it('has distance and decay', () => {
        const light = new MockPointLight(0xffffff, 1, 100, 2);
        expect(light.distance).toBe(100);
        expect(light.decay).toBe(2);
      });
    });

    describe('MockSpotLight', () => {
      it('has angle and penumbra', () => {
        const light = new MockSpotLight(0xffffff, 1, 100, Math.PI / 6, 0.5);
        expect(light.angle).toBeCloseTo(Math.PI / 6);
        expect(light.penumbra).toBe(0.5);
      });
    });
  });

  // ============================================================================
  // GEOMETRY TESTS
  // ============================================================================

  describe('Geometries', () => {
    describe('MockBufferGeometry', () => {
      it('has unique uuid', () => {
        const g1 = new MockBufferGeometry();
        const g2 = new MockBufferGeometry();
        expect(g1.uuid).not.toBe(g2.uuid);
      });

      it('setAttribute and getAttribute work', () => {
        const geo = new MockBufferGeometry();
        const attr = { array: new Float32Array([1, 2, 3]) };
        geo.setAttribute('position', attr);
        expect(geo.getAttribute('position')).toBe(attr);
      });
    });

    describe('MockBoxGeometry', () => {
      it('has type BoxGeometry', () => {
        const geo = new MockBoxGeometry();
        expect(geo.type).toBe('BoxGeometry');
      });

      it('stores dimensions', () => {
        const geo = new MockBoxGeometry(2, 3, 4);
        expect(geo.width).toBe(2);
        expect(geo.height).toBe(3);
        expect(geo.depth).toBe(4);
      });
    });

    describe('MockSphereGeometry', () => {
      it('stores radius', () => {
        const geo = new MockSphereGeometry(5);
        expect(geo.radius).toBe(5);
      });
    });

    describe('MockPlaneGeometry', () => {
      it('stores dimensions', () => {
        const geo = new MockPlaneGeometry(10, 20);
        expect(geo.width).toBe(10);
        expect(geo.height).toBe(20);
      });
    });

    describe('MockCylinderGeometry', () => {
      it('stores dimensions', () => {
        const geo = new MockCylinderGeometry(1, 2, 3);
        expect(geo.radiusTop).toBe(1);
        expect(geo.radiusBottom).toBe(2);
        expect(geo.height).toBe(3);
      });
    });
  });

  // ============================================================================
  // MATERIAL TESTS
  // ============================================================================

  describe('Materials', () => {
    describe('MockMaterial', () => {
      it('has default properties', () => {
        const mat = new MockMaterial();
        expect(mat.opacity).toBe(1);
        expect(mat.transparent).toBe(false);
        expect(mat.visible).toBe(true);
      });

      it('clone creates copy', () => {
        const m1 = new MockMaterial();
        m1.opacity = 0.5;
        const m2 = m1.clone();
        expect(m2.opacity).toBe(0.5);
        expect(m2).not.toBe(m1);
      });
    });

    describe('MockMeshBasicMaterial', () => {
      it('has type MeshBasicMaterial', () => {
        const mat = new MockMeshBasicMaterial();
        expect(mat.type).toBe('MeshBasicMaterial');
      });

      it('accepts color parameter', () => {
        const mat = new MockMeshBasicMaterial({ color: 0xff0000 });
        expect(mat.color.r).toBeCloseTo(1);
        expect(mat.color.g).toBeCloseTo(0);
      });

      it('has wireframe option', () => {
        const mat = new MockMeshBasicMaterial({ wireframe: true });
        expect(mat.wireframe).toBe(true);
      });
    });

    describe('MockMeshStandardMaterial', () => {
      it('has roughness and metalness', () => {
        const mat = new MockMeshStandardMaterial({ roughness: 0.5, metalness: 0.8 });
        expect(mat.roughness).toBe(0.5);
        expect(mat.metalness).toBe(0.8);
      });

      it('has emissive properties', () => {
        const mat = new MockMeshStandardMaterial({
          emissive: 0x00ff00,
          emissiveIntensity: 0.5,
        });
        expect(mat.emissive.g).toBeCloseTo(1);
        expect(mat.emissiveIntensity).toBe(0.5);
      });
    });

    describe('MockMeshPhongMaterial', () => {
      it('has specular and shininess', () => {
        const mat = new MockMeshPhongMaterial({ specular: 0xffffff, shininess: 100 });
        expect(mat.shininess).toBe(100);
      });
    });

    describe('MockShaderMaterial', () => {
      it('has shaders and uniforms', () => {
        const mat = new MockShaderMaterial({
          vertexShader: 'void main() {}',
          fragmentShader: 'void main() {}',
          uniforms: { uTime: { value: 0 } },
        });
        expect(mat.vertexShader).toBe('void main() {}');
        expect(mat.uniforms.uTime.value).toBe(0);
      });
    });
  });

  // ============================================================================
  // RENDERER TESTS
  // ============================================================================

  describe('MockWebGLRenderer', () => {
    let renderer: MockWebGLRenderer;

    beforeEach(() => {
      renderer = new MockWebGLRenderer();
    });

    it('creates canvas element', () => {
      expect(renderer.domElement).toBeInstanceOf(HTMLCanvasElement);
    });

    it('setSize updates dimensions', () => {
      renderer.setSize(1920, 1080);
      const size = { width: 0, height: 0 };
      renderer.getSize(size);
      expect(size.width).toBe(1920);
      expect(size.height).toBe(1080);
    });

    it('setPixelRatio stores value', () => {
      renderer.setPixelRatio(2);
      expect(renderer.getPixelRatio()).toBe(2);
    });

    it('render tracks calls', () => {
      const scene = new MockScene();
      const camera = new MockPerspectiveCamera();

      renderer.render(scene, camera);
      renderer.render(scene, camera);

      expect(renderer.getRenderCallCount()).toBe(2);
    });

    it('clearRenderCalls resets count', () => {
      const scene = new MockScene();
      const camera = new MockPerspectiveCamera();

      renderer.render(scene, camera);
      renderer.clearRenderCalls();

      expect(renderer.getRenderCallCount()).toBe(0);
    });

    it('getRenderCalls returns records', () => {
      const scene = new MockScene();
      const camera = new MockPerspectiveCamera();

      renderer.render(scene, camera);

      const calls = renderer.getRenderCalls();
      expect(calls).toHaveLength(1);
      expect(calls[0].scene).toBe(scene);
      expect(calls[0].camera).toBe(camera);
    });

    it('has shadow map settings', () => {
      expect(renderer.shadowMap.enabled).toBe(false);
      renderer.shadowMap.enabled = true;
      expect(renderer.shadowMap.enabled).toBe(true);
    });
  });

  // ============================================================================
  // LOADER TESTS
  // ============================================================================

  describe('Loaders', () => {
    describe('MockTextureLoader', () => {
      it('load returns texture immediately', () => {
        const loader = new MockTextureLoader();
        const texture = loader.load('test.png');
        expect(texture).toBeInstanceOf(MockTexture);
        expect(texture.name).toBe('test.png');
      });

      it('load calls onLoad callback', async () => {
        const loader = new MockTextureLoader();
        const onLoad = vi.fn();
        loader.load('test.png', onLoad);

        await new Promise((r) => setTimeout(r, 10));

        expect(onLoad).toHaveBeenCalled();
      });

      it('loadAsync returns promise', async () => {
        const loader = new MockTextureLoader();
        const texture = await loader.loadAsync('test.png');
        expect(texture).toBeInstanceOf(MockTexture);
      });
    });

    describe('MockTexture', () => {
      it('has unique uuid', () => {
        const t1 = new MockTexture();
        const t2 = new MockTexture();
        expect(t1.uuid).not.toBe(t2.uuid);
      });
    });
  });

  // ============================================================================
  // MOCK THREE NAMESPACE TESTS
  // ============================================================================

  describe('mockTHREE Namespace', () => {
    it('exports all math classes', () => {
      expect(mockTHREE.Vector3).toBe(MockVector3Impl);
      expect(mockTHREE.Euler).toBe(MockEulerImpl);
      expect(mockTHREE.Color).toBe(MockColorImpl);
      expect(mockTHREE.Matrix4).toBe(MockMatrix4);
    });

    it('exports all scene classes', () => {
      expect(mockTHREE.Object3D).toBe(MockObject3D);
      expect(mockTHREE.Scene).toBe(MockScene);
      expect(mockTHREE.Group).toBe(MockGroup);
      expect(mockTHREE.Mesh).toBe(MockMesh);
    });

    it('exports all camera classes', () => {
      expect(mockTHREE.PerspectiveCamera).toBe(MockPerspectiveCamera);
      expect(mockTHREE.OrthographicCamera).toBe(MockOrthographicCamera);
    });

    it('exports all light classes', () => {
      expect(mockTHREE.AmbientLight).toBe(MockAmbientLight);
      expect(mockTHREE.DirectionalLight).toBe(MockDirectionalLight);
      expect(mockTHREE.PointLight).toBe(MockPointLight);
      expect(mockTHREE.SpotLight).toBe(MockSpotLight);
    });

    it('exports all geometry classes', () => {
      expect(mockTHREE.BoxGeometry).toBe(MockBoxGeometry);
      expect(mockTHREE.SphereGeometry).toBe(MockSphereGeometry);
      expect(mockTHREE.PlaneGeometry).toBe(MockPlaneGeometry);
    });

    it('exports all material classes', () => {
      expect(mockTHREE.MeshBasicMaterial).toBe(MockMeshBasicMaterial);
      expect(mockTHREE.MeshStandardMaterial).toBe(MockMeshStandardMaterial);
      expect(mockTHREE.MeshPhongMaterial).toBe(MockMeshPhongMaterial);
    });

    it('exports constants', () => {
      expect(mockTHREE.FrontSide).toBe(0);
      expect(mockTHREE.BackSide).toBe(1);
      expect(mockTHREE.DoubleSide).toBe(2);
    });
  });

  // ============================================================================
  // REACT THREE FIBER MOCKS TESTS
  // ============================================================================

  describe('React Three Fiber Mocks', () => {
    describe('MockCanvas', () => {
      it('renders with data-testid', () => {
        const result = MockCanvas({ children: 'test' });
        expect(result.props['data-testid']).toBe('r3f-canvas');
      });

      it('passes camera and gl as data attributes', () => {
        const result = MockCanvas({
          children: 'test',
          camera: { fov: 75 },
          gl: { antialias: true },
        });
        expect(result.props['data-camera']).toBe('{"fov":75}');
        expect(result.props['data-gl']).toBe('{"antialias":true}');
      });
    });

    describe('mockUseThree', () => {
      it('returns scene and camera', () => {
        const state = mockUseThree();
        expect(state.scene).toBeInstanceOf(MockScene);
        expect(state.camera).toBeInstanceOf(MockPerspectiveCamera);
      });

      it('returns renderer', () => {
        const state = mockUseThree();
        expect(state.gl).toBeInstanceOf(MockWebGLRenderer);
      });

      it('returns size and viewport', () => {
        const state = mockUseThree();
        expect(state.size).toEqual({ width: 800, height: 600 });
        expect(state.viewport).toEqual({ width: 800, height: 600, factor: 1 });
      });

      it('returns invalidate and advance functions', () => {
        const state = mockUseThree();
        expect(typeof state.invalidate).toBe('function');
        expect(typeof state.advance).toBe('function');
      });
    });

    describe('mockUseFrame', () => {
      it('is a mock function', () => {
        expect(vi.isMockFunction(mockUseFrame)).toBe(true);
      });

      it('accepts callback', () => {
        const callback = vi.fn();
        mockUseFrame(callback);
        expect(mockUseFrame).toHaveBeenCalledWith(callback);
      });
    });

    describe('mockUseLoader', () => {
      it('returns texture for single url', () => {
        const result = mockUseLoader(MockTextureLoader, 'test.png');
        expect(result).toBeInstanceOf(MockTexture);
      });

      it('returns array for multiple urls', () => {
        const result = mockUseLoader(MockTextureLoader, ['test1.png', 'test2.png']);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
      });
    });

    describe('createReactThreeFiberMock', () => {
      it('exports Canvas, useThree, useFrame, useLoader', () => {
        const mock = createReactThreeFiberMock();
        expect(mock.Canvas).toBe(MockCanvas);
        expect(mock.useThree).toBe(mockUseThree);
        expect(mock.useFrame).toBe(mockUseFrame);
        expect(mock.useLoader).toBe(mockUseLoader);
      });

      it('exports extend and effects', () => {
        const mock = createReactThreeFiberMock();
        expect(typeof mock.extend).toBe('function');
        expect(typeof mock.addEffect).toBe('function');
      });
    });
  });

  // ============================================================================
  // TEST UTILITIES TESTS
  // ============================================================================

  describe('Test Utilities', () => {
    describe('createTestScene', () => {
      it('returns scene, camera, and renderer', () => {
        const { scene, camera, renderer } = createTestScene();
        expect(scene).toBeInstanceOf(MockScene);
        expect(camera).toBeInstanceOf(MockPerspectiveCamera);
        expect(renderer).toBeInstanceOf(MockWebGLRenderer);
      });

      it('positions camera at z=5', () => {
        const { camera } = createTestScene();
        expect(camera.position.z).toBe(5);
      });
    });

    describe('createTestMesh', () => {
      it('creates box by default', () => {
        const mesh = createTestMesh();
        expect(mesh.geometry.type).toBe('BoxGeometry');
      });

      it('creates sphere when specified', () => {
        const mesh = createTestMesh('sphere');
        expect(mesh.geometry.type).toBe('SphereGeometry');
      });

      it('creates plane when specified', () => {
        const mesh = createTestMesh('plane');
        expect(mesh.geometry.type).toBe('PlaneGeometry');
      });

      it('uses cyan color by default', () => {
        const mesh = createTestMesh();
        const material = mesh.material as MockMeshStandardMaterial;
        expect(material.color.getHex()).toBe(0x00ffff);
      });
    });

    describe('assertSceneObjectCount', () => {
      it('passes for correct count', () => {
        const scene = new MockScene();
        scene.add(new MockMesh());
        scene.add(new MockMesh());

        expect(() => assertSceneObjectCount(scene, 2)).not.toThrow();
      });

      it('throws for incorrect count', () => {
        const scene = new MockScene();
        scene.add(new MockMesh());

        expect(() => assertSceneObjectCount(scene, 5)).toThrow('Expected scene to have 5 objects');
      });
    });

    describe('assertMeshGeometry', () => {
      it('passes for correct geometry', () => {
        const mesh = new MockMesh(new MockBoxGeometry());
        expect(() => assertMeshGeometry(mesh, 'BoxGeometry')).not.toThrow();
      });

      it('throws for incorrect geometry', () => {
        const mesh = new MockMesh(new MockBoxGeometry());
        expect(() => assertMeshGeometry(mesh, 'SphereGeometry')).toThrow(
          'Expected mesh to have SphereGeometry'
        );
      });
    });

    describe('assertRenderCallCount', () => {
      it('passes for correct count', () => {
        const { scene, camera, renderer } = createTestScene();
        renderer.render(scene, camera);
        renderer.render(scene, camera);

        expect(() => assertRenderCallCount(renderer, 2)).not.toThrow();
      });

      it('throws for incorrect count', () => {
        const renderer = new MockWebGLRenderer();
        expect(() => assertRenderCallCount(renderer, 5)).toThrow(
          'Expected 5 render calls, but got 0'
        );
      });
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration Examples', () => {
    it('creates complete scene with lights and meshes', () => {
      const { scene, camera, renderer } = createTestScene();

      // Add lights
      scene.add(new MockAmbientLight(0x404040));
      scene.add(new MockDirectionalLight(0xffffff, 1));

      // Add meshes
      const box = createTestMesh('box', 0xff0000);
      const sphere = createTestMesh('sphere', 0x00ff00);
      sphere.position.set(2, 0, 0);

      scene.add(box);
      scene.add(sphere);

      // Render
      renderer.render(scene, camera);

      // Assertions
      assertSceneObjectCount(scene, 4);
      assertRenderCallCount(renderer, 1);
    });

    it('supports nested groups', () => {
      const scene = new MockScene();
      const group = new MockGroup();

      group.add(createTestMesh('box'));
      group.add(createTestMesh('sphere'));

      scene.add(group);

      let count = 0;
      scene.traverse(() => count++);

      // scene + group + 2 meshes = 4
      expect(count).toBe(4);
    });

    it('can simulate camera movement', () => {
      const { camera } = createTestScene();

      // Move camera
      camera.position.set(10, 5, 10);
      camera.lookAt(0, 0, 0);

      expect(camera.position.x).toBe(10);
      expect(camera.position.y).toBe(5);
      expect(camera.position.z).toBe(10);
    });
  });
});
