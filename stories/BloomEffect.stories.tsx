import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { BloomEffect } from '../packages/frontend/src/components/3d/effects/BloomEffect';
import * as THREE from 'three';

/**
 * BloomEffect - Post-processing bloom/glow effect
 *
 * Makes emissive materials glow realistically. Essential for neon arcade aesthetic.
 *
 * ## Features
 * - EffectComposer integration from @react-three/postprocessing
 * - Configurable intensity, threshold, radius
 * - Multiple kernel sizes for quality/performance tuning
 * - 7 presets (subtle, moderate, intense, neon, arcade, dramatic, off)
 * - Imperative API for runtime control
 * - Hook for programmatic control
 *
 * ## Usage
 * Place inside Canvas after all scene objects. Targets emissive materials.
 */

const meta = {
  title: '3D/Effects/BloomEffect',
  component: BloomEffect,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Bloom post-processing effect for neon glow on emissive materials.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BloomEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Test Scene Components
// ============================================================================

/**
 * Scene with emissive cubes to demonstrate bloom effect.
 */
function EmissiveScene({ color = '#00ffff', emissiveIntensity = 1 }) {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.1} />

      {/* Emissive cubes - these will bloom */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color="#ff00ff"
          emissive="#ff00ff"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      <mesh position={[2, 0, 0]}>
        <torusGeometry args={[0.5, 0.2, 16, 32]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>

      {/* Non-emissive floor (won't bloom) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Camera controls */}
      <OrbitControls />
    </>
  );
}

/**
 * Neon text scene.
 */
function NeonTextScene() {
  return (
    <>
      <ambientLight intensity={0.05} />

      {/* Glowing spheres arranged as "GLOW" */}
      {/* G */}
      <mesh position={[-3, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-3, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-3, -0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
      </mesh>

      {/* L */}
      <mesh position={[-1.5, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-1.5, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-1.5, -0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff00ff" emissive="#ff00ff" emissiveIntensity={2} />
      </mesh>

      {/* O */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={2} />
      </mesh>

      {/* W */}
      <mesh position={[1.5, 0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.5, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[1.5, -0.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
      </mesh>

      <OrbitControls />
    </>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default bloom effect with moderate settings.
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect />
      </Canvas>
    </div>
  ),
};

/**
 * Subtle bloom - minimal glow for professional look.
 */
export const Subtle: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="subtle" />
      </Canvas>
    </div>
  ),
};

/**
 * Moderate bloom - balanced glow (default preset).
 */
export const Moderate: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="moderate" />
      </Canvas>
    </div>
  ),
};

/**
 * Intense bloom - strong glow effect.
 */
export const Intense: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="intense" />
      </Canvas>
    </div>
  ),
};

/**
 * Neon bloom - vibrant cyberpunk glow.
 */
export const Neon: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="neon" />
      </Canvas>
    </div>
  ),
};

/**
 * Arcade bloom - retro arcade cabinet glow.
 */
export const Arcade: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="arcade" />
      </Canvas>
    </div>
  ),
};

/**
 * Dramatic bloom - maximum glow for dramatic effect.
 */
export const Dramatic: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="dramatic" />
      </Canvas>
    </div>
  ),
};

/**
 * No bloom - effect disabled for comparison.
 */
export const NoBloom: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect preset="off" />
      </Canvas>
    </div>
  ),
};

/**
 * Custom configuration - manual control over all parameters.
 */
export const CustomConfiguration: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect
          intensity={2.5}
          threshold={0.8}
          smoothing={0.4}
          radius={0.9}
          kernelSize="LARGE"
          blendFunction="ADD"
        />
      </Canvas>
    </div>
  ),
};

/**
 * High threshold - only brightest objects bloom.
 */
export const HighThreshold: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene emissiveIntensity={2} />
        <BloomEffect intensity={1.5} threshold={0.98} radius={0.6} />
      </Canvas>
    </div>
  ),
};

/**
 * Low threshold - everything glows.
 */
export const LowThreshold: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect intensity={1.0} threshold={0.5} radius={0.5} />
      </Canvas>
    </div>
  ),
};

/**
 * Large radius - wide, diffuse glow.
 */
export const LargeRadius: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect intensity={1.5} threshold={0.9} radius={1.5} />
      </Canvas>
    </div>
  ),
};

/**
 * Small radius - tight, focused glow.
 */
export const SmallRadius: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect intensity={2.0} threshold={0.9} radius={0.2} />
      </Canvas>
    </div>
  ),
};

/**
 * Screen blend function - softer, additive blending.
 */
export const ScreenBlend: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect intensity={2.0} threshold={0.85} radius={0.7} blendFunction="SCREEN" />
      </Canvas>
    </div>
  ),
};

/**
 * Neon text scene with dramatic bloom.
 */
export const NeonText: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <NeonTextScene />
        <BloomEffect preset="neon" />
      </Canvas>
    </div>
  ),
};

/**
 * Performance test - huge kernel size for maximum quality.
 */
export const HugeKernel: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <EmissiveScene />
        <BloomEffect
          intensity={2.0}
          threshold={0.85}
          radius={0.8}
          kernelSize="HUGE"
        />
      </Canvas>
    </div>
  ),
};
