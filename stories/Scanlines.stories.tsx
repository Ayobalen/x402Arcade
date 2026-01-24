import type { Meta, StoryObj } from '@storybook/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Scanlines } from '../packages/frontend/src/components/3d/effects';

/**
 * Scanlines - CRT-style scanline overlay effect
 *
 * Creates retro CRT monitor scanlines across the entire screen.
 * Perfect for adding authentic retro arcade atmosphere.
 *
 * ## Features
 * - Horizontal scanline pattern
 * - Configurable line count and thickness
 * - Subtle scrolling animation
 * - Multiple presets
 * - Full opacity control
 *
 * ## Usage
 * Layer on top of 3D scenes with high renderOrder to act as overlay.
 */
const meta: Meta<typeof Scanlines> = {
  title: '3D/Effects/Scanlines',
  component: Scanlines,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'CRT-style scanline overlay effect for retro arcade aesthetic. Adds horizontal lines across the screen with optional scrolling animation.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#0a0a0a' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <color attach="background" args={['#0a0a0a']} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          {/* Background scene for context */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial
              color="#8B5CF6"
              emissive="#8B5CF6"
              emissiveIntensity={0.5}
            />
          </mesh>

          <Story />
          <OrbitControls enableDamping dampingFactor={0.05} />
        </Canvas>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Scanlines>;

/**
 * Default scanlines with classic CRT effect.
 */
export const Default: Story = {
  args: {},
};

/**
 * Subtle scanlines - minimal distraction, perfect for backgrounds.
 */
export const Subtle: Story = {
  args: {
    preset: 'subtle',
  },
};

/**
 * Classic CRT scanlines - authentic retro monitor feel.
 */
export const Classic: Story = {
  args: {
    preset: 'classic',
  },
};

/**
 * Intense scanlines - heavy CRT effect for dramatic atmosphere.
 */
export const Intense: Story = {
  args: {
    preset: 'intense',
  },
};

/**
 * Minimal scanlines - barely visible, just a hint of texture.
 */
export const Minimal: Story = {
  args: {
    preset: 'minimal',
  },
};

/**
 * No scanlines - turned off (opacity: 0).
 */
export const Off: Story = {
  args: {
    preset: 'off',
  },
};

/**
 * Custom configuration - high opacity, dense lines.
 */
export const CustomDense: Story = {
  args: {
    opacity: 0.25,
    lineCount: 400,
    lineWidth: 0.6,
    animationSpeed: 0.8,
  },
};

/**
 * Wide scanlines - fewer, thicker lines for a different aesthetic.
 */
export const WideLines: Story = {
  args: {
    opacity: 0.2,
    lineCount: 50,
    lineWidth: 0.8,
    animationSpeed: 0.3,
  },
};

/**
 * Fast scrolling - rapid scanline animation.
 */
export const FastScroll: Story = {
  args: {
    opacity: 0.15,
    lineCount: 200,
    lineWidth: 0.5,
    animationSpeed: 2.0,
  },
};

/**
 * Static scanlines - no animation, fixed pattern.
 */
export const Static: Story = {
  args: {
    opacity: 0.15,
    lineCount: 200,
    lineWidth: 0.5,
    enableAnimation: false,
  },
};

/**
 * Colored scanlines - green tint for "matrix" aesthetic.
 */
export const GreenTint: Story = {
  args: {
    opacity: 0.2,
    lineCount: 200,
    lineWidth: 0.5,
    color: '#00ff00',
    animationSpeed: 0.5,
  },
};

/**
 * Colored scanlines - cyan tint for cyberpunk aesthetic.
 */
export const CyanTint: Story = {
  args: {
    opacity: 0.2,
    lineCount: 200,
    lineWidth: 0.5,
    color: '#00ffff',
    animationSpeed: 0.5,
  },
};

/**
 * Ultra fine scanlines - very dense pattern for smooth gradient.
 */
export const UltraFine: Story = {
  args: {
    opacity: 0.1,
    lineCount: 600,
    lineWidth: 0.3,
    animationSpeed: 0.2,
  },
};

/**
 * Heavy distortion - thick black lines for dramatic effect.
 */
export const HeavyDistortion: Story = {
  args: {
    opacity: 0.4,
    lineCount: 100,
    lineWidth: 0.9,
    animationSpeed: 0.1,
  },
};

/**
 * Reverse animation - scanlines scrolling upward.
 */
export const ReverseScroll: Story = {
  args: {
    opacity: 0.15,
    lineCount: 200,
    lineWidth: 0.5,
    animationSpeed: -0.5, // Negative speed for reverse
  },
};
