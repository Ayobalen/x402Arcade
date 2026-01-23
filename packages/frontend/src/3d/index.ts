/**
 * 3D Components and utilities using Three.js / React Three Fiber
 *
 * This module exports all 3D-related components, hooks, and utilities
 * for the x402Arcade project.
 */

// Test that Three.js imports work correctly
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';

// Re-export Three.js for use in other modules
export { THREE };

// Re-export React Three Fiber components
export { Canvas, useFrame, useThree };

// Re-export commonly used Drei helpers
export { OrbitControls, PerspectiveCamera, Environment };

// Export a simple test to verify Three.js is working
export const isThreeLoaded = typeof THREE.Vector3 !== 'undefined';
export const threeVersion = THREE.REVISION;
