/**
 * Tests to verify Three.js installation and basic imports
 */
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { isThreeLoaded, threeVersion, THREE as ExportedTHREE } from '../../src/3d';

describe('Three.js Setup', () => {
  describe('Core Three.js', () => {
    it('should import THREE namespace', () => {
      expect(THREE).toBeDefined();
    });

    it('should have Vector3 available', () => {
      const vec = new THREE.Vector3(1, 2, 3);
      expect(vec.x).toBe(1);
      expect(vec.y).toBe(2);
      expect(vec.z).toBe(3);
    });

    it('should have Scene available', () => {
      const scene = new THREE.Scene();
      expect(scene).toBeInstanceOf(THREE.Scene);
    });

    it('should have common geometries', () => {
      expect(THREE.BoxGeometry).toBeDefined();
      expect(THREE.SphereGeometry).toBeDefined();
      expect(THREE.PlaneGeometry).toBeDefined();
    });

    it('should have common materials', () => {
      expect(THREE.MeshBasicMaterial).toBeDefined();
      expect(THREE.MeshStandardMaterial).toBeDefined();
      expect(THREE.MeshPhongMaterial).toBeDefined();
    });

    it('should have loaders available', () => {
      expect(THREE.TextureLoader).toBeDefined();
      expect(THREE.ObjectLoader).toBeDefined();
    });
  });

  describe('Module Exports', () => {
    it('should export isThreeLoaded as true', () => {
      expect(isThreeLoaded).toBe(true);
    });

    it('should export threeVersion', () => {
      expect(threeVersion).toBeDefined();
      expect(typeof threeVersion).toBe('string');
    });

    it('should export THREE namespace', () => {
      expect(ExportedTHREE).toBe(THREE);
    });
  });

  describe('Three.js Functionality', () => {
    it('should create a basic mesh', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const mesh = new THREE.Mesh(geometry, material);

      expect(mesh.geometry).toBe(geometry);
      expect(mesh.material).toBe(material);
    });

    it('should perform vector operations', () => {
      const v1 = new THREE.Vector3(1, 0, 0);
      const v2 = new THREE.Vector3(0, 1, 0);
      const cross = new THREE.Vector3().crossVectors(v1, v2);

      expect(cross.x).toBe(0);
      expect(cross.y).toBe(0);
      expect(cross.z).toBe(1);
    });

    it('should create color objects', () => {
      const cyan = new THREE.Color(0x00ffff);
      expect(cyan.r).toBeCloseTo(0);
      expect(cyan.g).toBeCloseTo(1);
      expect(cyan.b).toBeCloseTo(1);
    });

    it('should create and manipulate matrices', () => {
      const matrix = new THREE.Matrix4();
      matrix.makeTranslation(1, 2, 3);

      const position = new THREE.Vector3();
      position.setFromMatrixPosition(matrix);

      expect(position.x).toBe(1);
      expect(position.y).toBe(2);
      expect(position.z).toBe(3);
    });
  });
});
