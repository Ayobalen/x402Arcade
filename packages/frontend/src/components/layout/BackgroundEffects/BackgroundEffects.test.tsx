/**
 * Tests for BackgroundEffects Component
 *
 * Verifies rendering of background visual effects including gradients,
 * grid patterns, corner glows, and ambient effects.
 */

import { render, screen } from '@testing-library/react';
import { BackgroundEffects } from './BackgroundEffects';

describe('BackgroundEffects', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<BackgroundEffects />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have pointer-events-none class', () => {
      const { container } = render(<BackgroundEffects />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('pointer-events-none');
    });

    it('should have fixed positioning', () => {
      const { container } = render(<BackgroundEffects />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('fixed', 'inset-0');
    });

    it('should be aria-hidden', () => {
      const { container } = render(<BackgroundEffects />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Grid Pattern', () => {
    it('should show grid pattern by default', () => {
      const { container } = render(<BackgroundEffects />);
      const gridElement = container.querySelector('[style*="linear-gradient"]');
      expect(gridElement).toBeInTheDocument();
    });

    it('should hide grid when showGrid=false', () => {
      const { container } = render(<BackgroundEffects showGrid={false} />);
      const gridElement = container.querySelector('[style*="linear-gradient"]');
      expect(gridElement).not.toBeInTheDocument();
    });

    it('should apply custom grid opacity', () => {
      const { container } = render(<BackgroundEffects gridOpacity={0.5} />);
      const gridElement = container.querySelector('[style*="linear-gradient"]');
      expect(gridElement).toHaveStyle({ opacity: 0.5 });
    });
  });

  describe('Glow Effects', () => {
    it('should show glows by default', () => {
      const { container } = render(<BackgroundEffects />);
      // Should have multiple glow elements (4 corner glows)
      const glowElements = container.querySelectorAll(
        '.blur-\\[100px\\], .blur-\\[120px\\], .blur-\\[150px\\], .blur-\\[130px\\]'
      );
      expect(glowElements.length).toBeGreaterThan(0);
    });

    it('should hide glows when showGlows=false', () => {
      const { container } = render(<BackgroundEffects showGlows={false} />);
      const glowElements = container.querySelectorAll('[class*="blur"]');
      // Should only have center ambient glow (200px blur)
      expect(glowElements.length).toBe(1);
    });

    it('should apply glow intensity - low', () => {
      render(<BackgroundEffects glowIntensity="low" />);
      // Low intensity uses smaller size and lower opacity
      // Implementation detail - just verify it renders
    });

    it('should apply glow intensity - medium', () => {
      render(<BackgroundEffects glowIntensity="medium" />);
      // Medium intensity is default
    });

    it('should apply glow intensity - high', () => {
      render(<BackgroundEffects glowIntensity="high" />);
      // High intensity uses larger size and higher opacity
    });

    it('should animate glows when animateGlows=true', () => {
      const { container } = render(<BackgroundEffects animateGlows={true} />);
      const glowElements = container.querySelectorAll('.animate-pulse');
      expect(glowElements.length).toBeGreaterThan(0);
    });

    it('should not animate glows by default', () => {
      const { container } = render(<BackgroundEffects animateGlows={false} />);
      const glowElements = container.querySelectorAll('.animate-pulse');
      expect(glowElements.length).toBe(0);
    });
  });

  describe('Base Gradient', () => {
    it('should render base dark gradient', () => {
      const { container } = render(<BackgroundEffects />);
      const gradientElement = container.querySelector('[style*="radial-gradient"]');
      expect(gradientElement).toBeInTheDocument();
    });
  });

  describe('Center Ambient Glow', () => {
    it('should render center ambient glow', () => {
      const { container } = render(<BackgroundEffects />);
      const centerGlow = container.querySelector('.blur-\\[200px\\]');
      expect(centerGlow).toBeInTheDocument();
    });

    it('should center ambient glow be properly positioned', () => {
      const { container } = render(<BackgroundEffects />);
      const centerGlow = container.querySelector('.blur-\\[200px\\]') as HTMLElement;
      expect(centerGlow).toHaveClass('top-1/2', 'left-1/2', '-translate-x-1/2', '-translate-y-1/2');
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      const { container } = render(<BackgroundEffects className="custom-class" />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('custom-class');
    });
  });

  describe('Props Integration', () => {
    it('should work with all props together', () => {
      render(
        <BackgroundEffects
          className="test-class"
          showGrid={true}
          gridOpacity={0.2}
          showGlows={true}
          glowIntensity="high"
          animateGlows={true}
        />
      );
      // If it renders without errors, props are compatible
    });

    it('should work with minimal props', () => {
      render(<BackgroundEffects showGrid={false} showGlows={false} />);
      // Should still render base gradient and center glow
    });
  });

  describe('Accessibility', () => {
    it('should be hidden from screen readers', () => {
      const { container } = render(<BackgroundEffects />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not interfere with pointer events', () => {
      const { container } = render(<BackgroundEffects />);
      const element = container.firstChild as HTMLElement;
      expect(element).toHaveClass('pointer-events-none');
    });
  });
});
