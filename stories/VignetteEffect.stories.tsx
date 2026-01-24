import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Center } from '@react-three/drei';
import { VignetteEffect } from '../packages/frontend/src/components/3d/effects/VignetteEffect';

/**
 * VignetteEffect - Vignette post-processing
 *
 * Darkens screen corners to focus attention on the center, creating
 * cinematic framing and depth.
 *
 * ## Features
 * - EffectComposer integration from @react-three/postprocessing
 * - Configurable darkness (0-1)
 * - Configurable offset/radius (0-1)
 * - 7 presets (subtle, moderate, strong, cinematic, arcade, dramatic, off)
 * - Imperative API for runtime control
 * - Hook for programmatic control
 *
 * ## Usage
 * Place inside Canvas after all scene objects. Darkens corners for focus.
 */

const meta = {
  title: '3D/Effects/VignetteEffect',
  component: VignetteEffect,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Vignette post-processing to darken screen corners and focus attention.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VignetteEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// Test Scene Components
// ============================================================================

/**
 * Colorful scene to showcase vignette framing.
 */
function ColorfulScene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 5, 5]} intensity={1} />

      {/* Center focal point - bright white */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
      </mesh>

      {/* Surrounding objects - should darken at edges */}
      <mesh position={[-2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#00ffff" />
      </mesh>

      <mesh position={[2, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ff00ff" />
      </mesh>

      <mesh position={[0, 2, 0]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#ffff00" />
      </mesh>

      <mesh position={[0, -2, 0]}>
        <octahedronGeometry args={[0.8]} />
        <meshStandardMaterial color="#00ff00" />
      </mesh>

      {/* Grid floor - darkens at far edges */}
      <gridHelper args={[20, 40, '#ffffff', '#444444']} />

      <OrbitControls />
    </>
  );
}

/**
 * Arcade cabinet scene - test vignette on game screen.
 */
function ArcadeScene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 5]} intensity={1.5} />

      {/* Arcade screen (center focal point) */}
      <Center>
        <mesh>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial
            color="#1a1a2e"
            emissive="#8B5CF6"
            emissiveIntensity={0.5}
          />
        </mesh>
      </Center>

      {/* Game elements - should be darkened at edges */}
      {[-2, -1, 0, 1, 2].map((x) =>
        [-1, 0, 1].map((y) => (
          <mesh key={`${x}-${y}`} position={[x * 0.8, y * 0.8, 0.2]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial
              color={Math.abs(x) + Math.abs(y) < 2 ? '#00ffff' : '#ff00ff'}
              emissive={Math.abs(x) + Math.abs(y) < 2 ? '#00ffff' : '#ff00ff'}
              emissiveIntensity={0.3}
            />
          </mesh>
        ))
      )}

      <OrbitControls />
    </>
  );
}

/**
 * Tunnel scene - vignette enhances depth perception.
 */
function TunnelScene() {
  const rings = [];
  for (let i = 0; i < 10; i++) {
    const z = -i * 2;
    const scale = 1 + i * 0.3;
    rings.push(
      <mesh key={i} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[scale, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={i % 2 === 0 ? '#00ffff' : '#ff00ff'}
          emissive={i % 2 === 0 ? '#00ffff' : '#ff00ff'}
          emissiveIntensity={0.3}
        />
      </mesh>
    );
  }

  return (
    <>
      <ambientLight intensity={0.3} />
      {rings}
      <OrbitControls />
    </>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default vignette with moderate settings.
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect />
      </Canvas>
    </div>
  ),
};

/**
 * Subtle vignette - barely noticeable, professional look.
 */
export const Subtle: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="subtle" />
      </Canvas>
    </div>
  ),
};

/**
 * Moderate vignette - balanced framing.
 */
export const Moderate: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="moderate" />
      </Canvas>
    </div>
  ),
};

/**
 * Strong vignette - pronounced corner darkening.
 */
export const Strong: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="strong" />
      </Canvas>
    </div>
  ),
};

/**
 * Cinematic vignette - movie-style framing with multiply blend.
 */
export const Cinematic: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="cinematic" />
      </Canvas>
    </div>
  ),
};

/**
 * Arcade preset - optimized for retro gaming aesthetic.
 */
export const Arcade: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ArcadeScene />
        <VignetteEffect preset="arcade" />
      </Canvas>
    </div>
  ),
};

/**
 * Dramatic vignette - maximum darkness for intense focus.
 */
export const Dramatic: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="dramatic" />
      </Canvas>
    </div>
  ),
};

/**
 * Custom darkness - high darkness value.
 */
export const CustomDarkness: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.9} offset={0.5} />
      </Canvas>
    </div>
  ),
};

/**
 * Custom offset - vignette extends far into center.
 */
export const CustomOffset: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.6} offset={0.8} />
      </Canvas>
    </div>
  ),
};

/**
 * Tight vignette - small central focus area.
 */
export const TightVignette: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.8} offset={0.2} />
      </Canvas>
    </div>
  ),
};

/**
 * Tunnel scene with vignette - enhances depth.
 */
export const TunnelWithVignette: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <TunnelScene />
        <VignetteEffect preset="strong" />
      </Canvas>
    </div>
  ),
};

/**
 * No vignette - comparison baseline.
 */
export const NoVignette: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect preset="off" />
      </Canvas>
    </div>
  ),
};

/**
 * Multiply blend mode - darker, more dramatic.
 */
export const MultiplyBlend: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.6} offset={0.5} blendFunction="MULTIPLY" />
      </Canvas>
    </div>
  ),
};

/**
 * Overlay blend mode - softer effect.
 */
export const OverlayBlend: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.6} offset={0.5} blendFunction="OVERLAY" />
      </Canvas>
    </div>
  ),
};

/**
 * Low opacity - subtle hint of vignette.
 */
export const LowOpacity: Story = {
  render: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ColorfulScene />
        <VignetteEffect darkness={0.8} offset={0.5} opacity={0.5} />
      </Canvas>
    </div>
  ),
};
