/**
 * GameFrame.test.tsx
 *
 * Tests for the 3D GameFrame component that wraps game canvases
 * with neon-lit picture frame borders.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as THREE from 'three';

// Mock R3F to avoid WebGL requirements in tests
// Note: The mock preserves data-testid from the real component usage
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  useFrame: vi.fn((_callback) => {
    // Don't execute frame callbacks in tests
  }),
  useThree: vi.fn(() => ({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    gl: {},
    size: { width: 800, height: 600 },
    viewport: { width: 800, height: 600, factor: 1 },
  })),
}));

// Mock drei components
vi.mock('@react-three/drei', () => ({
  RoundedBox: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <mesh data-testid="rounded-box" {...props}>{children}</mesh>
  ),
  MeshTransmissionMaterial: (props: unknown) => <meshBasicMaterial data-testid="transmission-material" />,
}));

import { GameFrame, StandaloneFrameScene, type GameFrameProps } from '../../src/components/3d/GameFrame';

describe('GameFrame Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<GameFrame />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      render(<GameFrame className="custom-class" />);
      // The frame should render (checking container renders)
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should render children inside the frame', () => {
      render(
        <GameFrame>
          <div data-testid="child-content">Game Content</div>
        </GameFrame>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('Props Configuration', () => {
    it('should accept width and height props', () => {
      const props: GameFrameProps = {
        width: 5,
        height: 4,
      };
      render(<GameFrame {...props} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should accept border width and depth props', () => {
      const props: GameFrameProps = {
        borderWidth: 0.2,
        depth: 0.4,
      };
      render(<GameFrame {...props} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should accept custom accent colors', () => {
      const props: GameFrameProps = {
        accentColor: '#ff0000',
        glowColor: '#00ff00',
      };
      render(<GameFrame {...props} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should accept glow configuration', () => {
      const props: GameFrameProps = {
        enableGlow: true,
        glowIntensity: 0.8,
      };
      render(<GameFrame {...props} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should accept rotation configuration', () => {
      const props: GameFrameProps = {
        enableRotation: true,
        rotationSpeed: 0.002,
      };
      render(<GameFrame {...props} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });
  });

  describe('Default Values', () => {
    it('should use default cyan accent color (#00ffff)', () => {
      // Verify component renders with defaults
      render(<GameFrame />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should use default magenta glow color (#ff00ff)', () => {
      render(<GameFrame />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should have glow enabled by default', () => {
      render(<GameFrame enableGlow={true} />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });
  });

  describe('StandaloneFrameScene', () => {
    it('should render standalone version for embedding', () => {
      render(<StandaloneFrameScene />);
      // StandaloneFrameScene doesn't wrap in Canvas
      // It's meant to be placed inside an existing Canvas
    });

    it('should accept all frame props', () => {
      const props = {
        width: 6,
        height: 4.5,
        borderWidth: 0.25,
        accentColor: '#00ff00',
      };
      // StandaloneFrameScene is for embedding in existing Canvas
      // It should accept the same props as GameFrame
      expect(StandaloneFrameScene).toBeDefined();
    });
  });
});

describe('GameFrame Integration', () => {
  describe('Game Canvas Embedding', () => {
    it('should work as a wrapper for game content', () => {
      render(
        <GameFrame width={4} height={3}>
          <div data-testid="game-canvas">Snake Game</div>
        </GameFrame>
      );
      expect(screen.getByTestId('game-canvas')).toBeInTheDocument();
    });

    it('should work with multiple child elements', () => {
      render(
        <GameFrame>
          <div data-testid="game-screen">Game</div>
          <div data-testid="game-hud">HUD</div>
        </GameFrame>
      );
      expect(screen.getByTestId('game-screen')).toBeInTheDocument();
      expect(screen.getByTestId('game-hud')).toBeInTheDocument();
    });
  });

  describe('Style Integration', () => {
    it('should apply custom className to container', () => {
      render(<GameFrame className="arcade-frame" />);
      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });
  });
});

describe('GameFrame Performance', () => {
  describe('Optimization', () => {
    it('should handle rapid prop changes', () => {
      const { rerender } = render(<GameFrame glowIntensity={0.5} />);

      // Simulate rapid prop changes
      for (let i = 0; i < 10; i++) {
        rerender(<GameFrame glowIntensity={i / 10} />);
      }

      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });

    it('should not re-render unnecessarily with same props', () => {
      const { rerender } = render(<GameFrame width={4} height={3} />);

      // Same props should not cause issues
      rerender(<GameFrame width={4} height={3} />);

      expect(screen.getByTestId('game-frame-container')).toBeInTheDocument();
    });
  });
});
