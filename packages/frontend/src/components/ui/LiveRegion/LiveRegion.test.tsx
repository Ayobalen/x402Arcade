/**
 * LiveRegion Component Tests
 *
 * Tests for ARIA live region component functionality.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from './LiveRegion';

describe('LiveRegion', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      const { container } = render(<LiveRegion message="Test announcement" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('Test announcement');
    });

    it('should render with custom message', () => {
      const { container } = render(<LiveRegion message="Score increased to 100" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveTextContent('Score increased to 100');
    });

    it('should not render when isActive is false', () => {
      const { container } = render(<LiveRegion message="Test" isActive={false} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should not render when no message is provided', () => {
      const { container } = render(<LiveRegion />);
      const liveRegion = container.firstChild as HTMLElement;

      // Should render but be empty
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toBeEmptyDOMElement();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have aria-live="polite" by default', () => {
      const { container } = render(<LiveRegion message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-live="assertive" when specified', () => {
      const { container } = render(<LiveRegion message="Test" politeness="assertive" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have aria-live="off" when specified', () => {
      const { container } = render(<LiveRegion message="Test" politeness="off" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-live', 'off');
    });

    it('should have correct aria-relevant attribute', () => {
      const { container } = render(<LiveRegion message="Test" relevant="additions text" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-relevant', 'additions text');
    });

    it('should support all aria-relevant values', () => {
      const relevantValues = ['additions', 'removals', 'text', 'all', 'additions text'] as const;

      relevantValues.forEach((relevant) => {
        const { container } = render(<LiveRegion message="Test" relevant={relevant} />);
        const liveRegion = container.firstChild as HTMLElement;

        expect(liveRegion).toHaveAttribute('aria-relevant', relevant);
      });
    });

    it('should have aria-atomic="false" by default', () => {
      const { container } = render(<LiveRegion message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
    });

    it('should have aria-atomic="true" when specified', () => {
      const { container } = render(<LiveRegion message="Test" atomic={true} />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Role Attribute', () => {
    it('should have role="status" by default (polite)', () => {
      const { container } = render(<LiveRegion message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('role', 'status');
    });

    it('should have role="alert" for assertive politeness', () => {
      const { container } = render(<LiveRegion message="Test" politeness="assertive" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('role', 'alert');
    });

    it('should support custom role override', () => {
      const { container } = render(<LiveRegion message="Test" role="log" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveAttribute('role', 'log');
    });

    it('should support all valid role values', () => {
      const roles = ['status', 'alert', 'log', 'region'] as const;

      roles.forEach((role) => {
        const { container } = render(<LiveRegion message="Test" role={role} />);
        const liveRegion = container.firstChild as HTMLElement;

        expect(liveRegion).toHaveAttribute('role', role);
      });
    });
  });

  describe('Accessibility', () => {
    it('should be screen reader only (visually hidden)', () => {
      const { container } = render(<LiveRegion message="Test" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveClass('sr-only');
    });

    it('should allow custom className while preserving sr-only', () => {
      const { container } = render(<LiveRegion message="Test" className="custom-class" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveClass('sr-only');
      expect(liveRegion).toHaveClass('custom-class');
    });

    it('should be accessible to assistive technology', () => {
      const { container } = render(<LiveRegion message="Important announcement" />);
      const liveRegion = container.firstChild as HTMLElement;

      // Should have proper ARIA attributes for screen readers
      expect(liveRegion).toHaveAttribute('aria-live');
      expect(liveRegion).toHaveAttribute('role');
      expect(liveRegion).toHaveTextContent('Important announcement');
    });
  });

  describe('Message Updates', () => {
    it('should update message content when prop changes', () => {
      const { container, rerender } = render(<LiveRegion message="Initial message" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveTextContent('Initial message');

      rerender(<LiveRegion message="Updated message" />);

      expect(liveRegion).toHaveTextContent('Updated message');
    });

    it('should handle empty message gracefully', () => {
      const { container, rerender } = render(<LiveRegion message="Initial message" />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toHaveTextContent('Initial message');

      rerender(<LiveRegion message="" />);

      expect(liveRegion).toBeEmptyDOMElement();
    });

    it('should handle ReactNode message content', () => {
      const { container } = render(
        <LiveRegion
          message={
            <span>
              Score: <strong>100</strong>
            </span>
          }
        />
      );
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toContainHTML('<span>Score: <strong>100</strong></span>');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to container div', () => {
      const ref = vi.fn();
      render(<LiveRegion ref={ref} message="Test" />);

      expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
    });

    it('should allow direct DOM access via ref', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<LiveRegion ref={ref} message="Test" />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current?.getAttribute('aria-live')).toBe('polite');
    });
  });

  describe('Active State', () => {
    it('should render when isActive is true', () => {
      const { container } = render(<LiveRegion message="Test" isActive={true} />);

      expect(container).not.toBeEmptyDOMElement();
    });

    it('should not render when isActive is false', () => {
      const { container } = render(<LiveRegion message="Test" isActive={false} />);

      expect(container).toBeEmptyDOMElement();
    });

    it('should toggle rendering when isActive changes', () => {
      const { container, rerender } = render(<LiveRegion message="Test" isActive={true} />);

      expect(container).not.toBeEmptyDOMElement();

      rerender(<LiveRegion message="Test" isActive={false} />);

      expect(container).toBeEmptyDOMElement();

      rerender(<LiveRegion message="Test" isActive={true} />);

      expect(container).not.toBeEmptyDOMElement();
    });
  });

  describe('Development Logging', () => {
    it('should log announcements in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const { rerender } = render(<LiveRegion message="Initial" />);
      rerender(<LiveRegion message="Updated" />);

      // Should log the updated message
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid message changes', () => {
      const { container, rerender } = render(<LiveRegion message="Message 1" />);
      const liveRegion = container.firstChild as HTMLElement;

      rerender(<LiveRegion message="Message 2" />);
      expect(liveRegion).toHaveTextContent('Message 2');

      rerender(<LiveRegion message="Message 3" />);
      expect(liveRegion).toHaveTextContent('Message 3');

      rerender(<LiveRegion message="Message 4" />);
      expect(liveRegion).toHaveTextContent('Message 4');
    });

    it('should handle same message multiple times', () => {
      const { container, rerender } = render(<LiveRegion message="Same message" />);
      const liveRegion = container.firstChild as HTMLElement;

      rerender(<LiveRegion message="Same message" />);
      expect(liveRegion).toHaveTextContent('Same message');

      rerender(<LiveRegion message="Same message" />);
      expect(liveRegion).toHaveTextContent('Same message');
    });

    it('should handle undefined message', () => {
      const { container } = render(<LiveRegion message={undefined} />);
      const liveRegion = container.firstChild as HTMLElement;

      expect(liveRegion).toBeEmptyDOMElement();
    });
  });
});
