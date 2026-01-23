/**
 * Tests to verify @react-three/drei installation and helper imports
 */
import { describe, it, expect } from 'vitest';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  useGLTF,
  Text,
  Html,
  Float,
  Sparkles,
  Stars,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  RoundedBox,
  Sphere,
  Box,
  Plane,
} from '@react-three/drei';

describe('@react-three/drei Setup', () => {
  describe('Control Helpers', () => {
    it('should import OrbitControls', () => {
      expect(OrbitControls).toBeDefined();
    });

    it('should import PerspectiveCamera', () => {
      expect(PerspectiveCamera).toBeDefined();
    });
  });

  describe('Environment and Lighting', () => {
    it('should import Environment helper', () => {
      expect(Environment).toBeDefined();
    });

    it('should import Stars effect', () => {
      expect(Stars).toBeDefined();
    });

    it('should import Sparkles effect', () => {
      expect(Sparkles).toBeDefined();
    });
  });

  describe('Geometry Helpers', () => {
    it('should import RoundedBox', () => {
      expect(RoundedBox).toBeDefined();
    });

    it('should import Sphere', () => {
      expect(Sphere).toBeDefined();
    });

    it('should import Box', () => {
      expect(Box).toBeDefined();
    });

    it('should import Plane', () => {
      expect(Plane).toBeDefined();
    });
  });

  describe('Material Helpers', () => {
    it('should import MeshDistortMaterial', () => {
      expect(MeshDistortMaterial).toBeDefined();
    });

    it('should import MeshWobbleMaterial', () => {
      expect(MeshWobbleMaterial).toBeDefined();
    });
  });

  describe('Text and HTML', () => {
    it('should import Text component', () => {
      expect(Text).toBeDefined();
    });

    it('should import Html helper', () => {
      expect(Html).toBeDefined();
    });
  });

  describe('Animation Helpers', () => {
    it('should import Float animation', () => {
      expect(Float).toBeDefined();
    });
  });

  describe('Asset Loading', () => {
    it('should import useGLTF hook', () => {
      expect(useGLTF).toBeDefined();
      expect(typeof useGLTF).toBe('function');
    });
  });

  describe('Project-Specific Helpers', () => {
    // Helpers identified as needed for x402Arcade project:
    it('should have access to arcade cabinet modeling helpers', () => {
      // RoundedBox for cabinet body
      expect(RoundedBox).toBeDefined();
      // Plane for screen
      expect(Plane).toBeDefined();
      // Box for structural elements
      expect(Box).toBeDefined();
    });

    it('should have access to neon effect helpers', () => {
      // Sparkles for arcade atmosphere
      expect(Sparkles).toBeDefined();
      // Stars for background
      expect(Stars).toBeDefined();
    });

    it('should have access to camera controls', () => {
      // OrbitControls for interactive viewing
      expect(OrbitControls).toBeDefined();
      // PerspectiveCamera for proper 3D rendering
      expect(PerspectiveCamera).toBeDefined();
    });
  });
});
