/**
 * Tests to verify React Three Fiber installation and basic imports
 */
import { describe, it, expect } from 'vitest';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

describe('React Three Fiber Setup', () => {
  describe('Core R3F Imports', () => {
    it('should import Canvas component', () => {
      expect(Canvas).toBeDefined();
      expect(typeof Canvas).toBe('object'); // React.forwardRef returns an object
    });

    it('should import useFrame hook', () => {
      expect(useFrame).toBeDefined();
      expect(typeof useFrame).toBe('function');
    });

    it('should import useThree hook', () => {
      expect(useThree).toBeDefined();
      expect(typeof useThree).toBe('function');
    });

    it('should import useLoader hook', () => {
      expect(useLoader).toBeDefined();
      expect(typeof useLoader).toBe('function');
    });
  });

  describe('Three.js Compatibility', () => {
    it('should work with Three.js objects', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const mesh = new THREE.Mesh(geometry, material);

      expect(mesh).toBeInstanceOf(THREE.Mesh);
    });

    it('should create valid Three.js scene', () => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

      scene.add(camera);

      expect(scene.children).toContain(camera);
    });
  });
});
