/**
 * NeonLines Component Stories
 *
 * Demonstrates the NeonLines decorative effect component
 * with various patterns and configurations.
 *
 * @module stories/3D/NeonLines
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Scene } from '../../components/3d/Scene';
import { LightingRig } from '../../components/3d/LightingRig';
import { NeonLines, NEON_LINES_PRESETS } from '../../components/3d/effects/NeonLines';

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof NeonLines> = {
  title: '3D/Effects/NeonLines',
  component: NeonLines,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The NeonLines component creates decorative glowing lines that frame scene edges.
It features:
- Multiple patterns (corners, frame, grid, diagonal, custom)
- TubeGeometry for smooth, rounded lines
- Emissive materials for neon glow effect
- Subtle pulse animation
- Corner L-shapes and edge decorations
- Grid and geometric patterns
- Customizable colors and glow intensity
- Multiple presets for different styles

Perfect for framing 3D scenes with cyberpunk/retro aesthetics.
        `,
      },
    },
    layout: 'fullscreen',
  },
  argTypes: {
    pattern: {
      control: 'select',
      options: ['corners', 'frame', 'grid', 'diagonal', 'custom'],
      description: 'Pattern type to generate',
    },
    size: {
      control: { type: 'range', min: 10, max: 40, step: 1 },
      description: 'Width/height of the framed area',
    },
    depth: {
      control: { type: 'range', min: -20, max: 0, step: 1 },
      description: 'Z position of the lines',
    },
    lineWidth: {
      control: { type: 'range', min: 0.01, max: 0.2, step: 0.01 },
      description: 'Line thickness',
    },
    glowIntensity: {
      control: { type: 'range', min: 0, max: 3, step: 0.1 },
      description: 'Glow intensity',
    },
    opacity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Overall opacity',
    },
    enablePulse: {
      control: 'boolean',
      description: 'Enable subtle pulse animation',
    },
    pulseSpeed: {
      control: { type: 'range', min: 0, max: 2, step: 0.1 },
      description: 'Pulse speed (cycles per second)',
    },
    pulseAmount: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Pulse amount',
    },
    bracketSize: {
      control: { type: 'range', min: 1, max: 10, step: 0.5 },
      description: 'Corner bracket size',
    },
    gridDivisions: {
      control: { type: 'range', min: 3, max: 15, step: 1 },
      description: 'Grid divisions',
    },
    primaryColor: {
      control: 'color',
      description: 'Primary neon color',
    },
    secondaryColor: {
      control: 'color',
      description: 'Secondary neon color',
    },
  },
};

export default meta;
type Story = StoryObj<typeof NeonLines>;

// ============================================================================
// Scene Wrapper Component
// ============================================================================

interface SceneWrapperProps {
  children: React.ReactNode;
}

function SceneWrapper({ children }: SceneWrapperProps) {
  return (
    <div style={{ width: '100%', height: '600px', background: '#0F0F1A' }}>
      <Scene cameraPosition={[0, 0, 15]} cameraFov={60} shadows={false}>
        <LightingRig preset="arcade" />
        {children}
        {/* Add a reference box to show scale */}
        <mesh position={[0, 0, -10]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#444" />
        </mesh>
      </Scene>
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

/**
 * Default corner brackets pattern
 */
export const Default: Story = {
  args: {
    ...NEON_LINES_PRESETS.corners,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
};

/**
 * Corner brackets - classic L-shapes at each corner
 */
export const Corners: Story = {
  args: {
    ...NEON_LINES_PRESETS.corners,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'L-shaped brackets at each corner. Classic framing for retro/arcade aesthetics.',
      },
    },
  },
};

/**
 * Full frame border
 */
export const Frame: Story = {
  args: {
    ...NEON_LINES_PRESETS.frame,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Complete border around the scene edges. Clean and prominent.',
      },
    },
  },
};

/**
 * Grid pattern
 */
export const Grid: Story = {
  args: {
    ...NEON_LINES_PRESETS.grid,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Subtle grid overlay. Alternating colors for visual interest. Low opacity to avoid distraction.',
      },
    },
  },
};

/**
 * Diagonal cross pattern
 */
export const Diagonal: Story = {
  args: {
    pattern: 'diagonal',
    glowIntensity: 1.2,
    opacity: 0.6,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diagonal lines creating an X pattern. Dynamic and modern.',
      },
    },
  },
};

/**
 * Cyberpunk style - bright, intense glow
 */
export const Cyberpunk: Story = {
  args: {
    ...NEON_LINES_PRESETS.cyberpunk,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'High-intensity cyan glow with fast pulse. Maximum cyberpunk vibes.',
      },
    },
  },
};

/**
 * Arcade cabinet style
 */
export const Arcade: Story = {
  args: {
    ...NEON_LINES_PRESETS.arcade,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Purple and pink accents. Perfect for retro arcade aesthetics.',
      },
    },
  },
};

/**
 * Minimal frame - subtle and clean
 */
export const Minimal: Story = {
  args: {
    ...NEON_LINES_PRESETS.minimal,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Thin, subtle frame with no pulse. Minimal distraction, maximum elegance.',
      },
    },
  },
};

/**
 * Large corner brackets
 */
export const LargeBrackets: Story = {
  args: {
    pattern: 'corners',
    bracketSize: 6,
    glowIntensity: 1.8,
    opacity: 0.9,
    primaryColor: '#00ffff',
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Extra-large corner brackets for more prominent framing. Eye-catching and bold.',
      },
    },
  },
};

/**
 * Dense grid
 */
export const DenseGrid: Story = {
  args: {
    pattern: 'grid',
    gridDivisions: 12,
    glowIntensity: 0.6,
    opacity: 0.3,
    lineWidth: 0.02,
    primaryColor: '#8B5CF6',
    secondaryColor: '#06B6D4',
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fine grid with many divisions. Creates depth perception and sci-fi atmosphere.',
      },
    },
  },
};

/**
 * Custom segments - manual line placement
 */
export const CustomSegments: Story = {
  args: {
    pattern: 'custom',
    customSegments: [
      // Horizontal center line
      { start: [-10, 0, -10], end: [10, 0, -10], color: '#00ffff' },
      // Vertical center line
      { start: [0, -10, -10], end: [0, 10, -10], color: '#ff00ff' },
      // Diagonal accents
      { start: [-5, 5, -10], end: [-3, 3, -10], color: '#ffff00' },
      { start: [5, 5, -10], end: [3, 3, -10], color: '#ffff00' },
      { start: [-5, -5, -10], end: [-3, -3, -10], color: '#ffff00' },
      { start: [5, -5, -10], end: [3, -3, -10], color: '#ffff00' },
    ],
    glowIntensity: 2,
    opacity: 0.9,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Fully custom line segments. Create any pattern you can imagine. Cross pattern with accent lines.',
      },
    },
  },
};

/**
 * No pulse - static glow
 */
export const NoPulse: Story = {
  args: {
    pattern: 'corners',
    enablePulse: false,
    glowIntensity: 1.5,
    opacity: 0.8,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Pulse animation disabled for static, constant glow. Good for background elements.',
      },
    },
  },
};

/**
 * Fast pulse - energetic animation
 */
export const FastPulse: Story = {
  args: {
    pattern: 'corners',
    enablePulse: true,
    pulseSpeed: 1.5,
    pulseAmount: 0.5,
    glowIntensity: 2,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Fast, prominent pulse for attention-grabbing effects. High energy.',
      },
    },
  },
};

/**
 * Close to camera
 */
export const CloseDepth: Story = {
  args: {
    pattern: 'corners',
    depth: -5,
    size: 15,
    glowIntensity: 1.8,
    opacity: 0.9,
  },
  render: (args) => (
    <SceneWrapper>
      <NeonLines {...args} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Positioned closer to camera for more prominent framing. Larger visual impact.',
      },
    },
  },
};

/**
 * Layered frames - multiple depths
 */
export const Layered: Story = {
  render: () => (
    <SceneWrapper>
      <NeonLines pattern="corners" depth={-8} size={18} primaryColor="#8B5CF6" />
      <NeonLines pattern="frame" depth={-12} size={22} primaryColor="#06B6D4" opacity={0.5} />
      <NeonLines pattern="grid" depth={-15} size={25} gridDivisions={6} opacity={0.3} />
    </SceneWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multiple NeonLines components at different depths create layered, dimensional framing.',
      },
    },
  },
};
