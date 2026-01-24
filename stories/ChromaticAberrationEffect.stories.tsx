import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text3D, Center } from '@react-three/drei';
import { ChromaticAberrationEffect } from '../packages/frontend/src/components/3d/effects/ChromaticAberrationEffect';
import * as THREE from 'three';

/**
 * ChromaticAberrationEffect - Chromatic aberration post-processing
 *
 * Simulates RGB color channel separation for retro CRT screen effects.
 *
 * ## Features
 * - EffectComposer integration from @react-three/postprocessing
 * - Configurable offset (horizontal/vertical RGB separation)
 * - Radial modulation (stronger at edges)
 * - 6 presets (subtle, moderate, strong, crt, lens, off)
 * - Imperative API for runtime control
 * - Hook for programmatic control
 *
 * ## Usage
 * Place inside Canvas after all scene objects. Creates color fringing effect.
 */

const meta = {
  title: '3D/Effects/ChromaticAberrationEffect',
  component: ChromaticAberrationEffect,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Chromatic aberration post-processing for retro CRT color fringing.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ChromaticAberrationEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Test Scene Components
// ============================================================================

/**
 * Scene with high-contrast elements to showcase aberration.
 */
function HighContrastScene() {
  return (
    <>
      {/* Strong white light to create stark color separation */}
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />

      {/* White cube with black edges - perfect for seeing RGB split */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>

      {/* Bright cyan sphere */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#00ffff" />
      </mesh>

      {/* Bright magenta torus */}
      <mesh position={[2, 0, 0]}>
        <torusGeometry args={[0.6, 0.25, 16, 32]} />
        <meshStandardMaterial color="#ff00ff" />
      </mesh>

      {/* Grid floor for edge aberration visibility */}
      <gridHelper args={[10, 20, '#ffffff', '#666666']} />

      <OrbitControls />
    </>
  );
}

/**
 * Text scene to demonstrate aberration on edges.
 */
function TextScene() {
  return (
    <>
      <ambientLight intensity={0.8} />

      <Center>
        <mesh>
          <boxGeometry args={[4, 1, 0.2]} />
          <meshStandardMaterial color="#00ffff" />
        </mesh>
      </Center>

      {/* Ring at screen edges to show radial modulation */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[3, 0.1, 16, 64]} />
        <meshStandardMaterial color="#ff00ff" />
      </mesh>

      <OrbitControls />
    </>
  );
}

/**
 * Grid scene to show aberration concentration at edges.
 */
function GridScene() {
  const gridItems = [];
  for (let x = -3; x <= 3; x++) {
    for (let y = -3; y <= 3; y++) {
      gridItems.push(
        <mesh key={`${x}-${y}`} position={[x * 1.5, y * 1.5, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial
            color={
              (x + y) % 2 === 0
                ? '#00ffff'
                : '#ff00ff'
            }
          />
        </mesh>
      );
    }
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      {gridItems}
      <OrbitControls />
    </>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default chromatic aberration with moderate settings.
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect />
      </Canvas>
    </div>
  ),
};

/**
 * Subtle aberration - barely noticeable color fringing.
 */
export const Subtle: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="subtle" />
      </Canvas>
    </div>
  ),
};

/**
 * Moderate aberration - balanced effect (default preset).
 */
export const Moderate: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="moderate" />
      </Canvas>
    </div>
  ),
};

/**
 * Strong aberration - pronounced color separation.
 */
export const Strong: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="strong" />
      </Canvas>
    </div>
  ),
};

/**
 * CRT preset - authentic retro monitor aberration.
 */
export const CRT: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="crt" />
      </Canvas>
    </div>
  ),
};

/**
 * Lens preset - optical lens distortion aberration.
 */
export const Lens: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="lens" />
      </Canvas>
    </div>
  ),
};

/**
 * No aberration - effect disabled for comparison.
 */
export const NoAberration: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect preset="off" />
      </Canvas>
    </div>
  ),
};

/**
 * Custom configuration - manual offset control.
 */
export const CustomConfiguration: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect
          offset={[0.0025, 0.0025]}
          radialModulation={true}
          modulationOffset={0.25}
          opacity={0.9}
        />
      </Canvas>
    </div>
  ),
};

/**
 * High offset - exaggerated effect for demonstration.
 */
export const HighOffset: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect offset={[0.005, 0.005]} />
      </Canvas>
    </div>
  ),
};

/**
 * No radial modulation - uniform aberration across screen.
 */
export const NoRadialModulation: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect
          offset={[0.002, 0.002]}
          radialModulation={false}
        />
      </Canvas>
    </div>
  ),
};

/**
 * High radial modulation - strong edge concentration.
 */
export const HighRadialModulation: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect
          offset={[0.002, 0.002]}
          radialModulation={true}
          modulationOffset={0.4}
        />
      </Canvas>
    </div>
  ),
};

/**
 * Text scene - shows aberration on text and shapes.
 */
export const TextScene: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <TextScene />
        <ChromaticAberrationEffect preset="crt" />
      </Canvas>
    </div>
  ),
};

/**
 * Grid scene - demonstrates edge concentration.
 */
export const GridScene: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 7] }}>
        <GridScene />
        <ChromaticAberrationEffect preset="moderate" />
      </Canvas>
    </div>
  ),
};

/**
 * Horizontal only - aberration on X axis only.
 */
export const HorizontalOnly: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect offset={[0.003, 0]} />
      </Canvas>
    </div>
  ),
};

/**
 * Vertical only - aberration on Y axis only.
 */
export const VerticalOnly: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect offset={[0, 0.003]} />
      </Canvas>
    </div>
  ),
};

/**
 * Low opacity - subtle blending with scene.
 */
export const LowOpacity: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <HighContrastScene />
        <ChromaticAberrationEffect
          offset={[0.003, 0.003]}
          opacity={0.5}
        />
      </Canvas>
    </div>
  ),
};
