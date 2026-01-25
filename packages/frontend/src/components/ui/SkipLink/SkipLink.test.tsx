/**
 * Tests for SkipLink Component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipLink } from './SkipLink';

describe('SkipLink', () => {
  describe('Rendering', () => {
    it('should render skip link with default props', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '#main-content');
    });

    it('should render with custom href', () => {
      render(<SkipLink href="#custom-content" />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#custom-content');
    });

    it('should render with custom label', () => {
      render(<SkipLink label="Jump to content" />);

      const link = screen.getByRole('link', { name: /jump to content/i });
      expect(link).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SkipLink className="custom-class" />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('custom-class');
    });

    it('should forward additional props to anchor element', () => {
      render(<SkipLink data-testid="skip-link" />);

      const link = screen.getByTestId('skip-link');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have sr-only-focusable class for keyboard-only visibility', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('sr-only-focusable');
    });

    it('should have high z-index to appear above other content when focused', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('z-[9999]');
    });

    it('should have fixed positioning when focused', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('fixed');
      expect(link).toHaveClass('top-4');
      expect(link).toHaveClass('left-4');
    });

    it('should have focus-visible styles', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none');
      expect(link).toHaveClass('focus-visible:ring-2');
      expect(link).toHaveClass('focus-visible:ring-primary');
    });
  });

  describe('Design System Compliance', () => {
    it('should use primary color for background', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-primary');
    });

    it('should have border with primary-light color', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('border');
      expect(link).toHaveClass('border-primary-light');
    });

    it('should have neon glow shadow effect', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('shadow-lg');
      expect(link).toHaveClass('shadow-primary/50');
    });

    it('should have rounded corners', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('rounded-lg');
    });

    it('should have smooth transition', () => {
      render(<SkipLink />);

      const link = screen.getByRole('link');
      expect(link).toHaveClass('transition-all');
      expect(link).toHaveClass('duration-200');
    });
  });

  describe('WCAG Compliance', () => {
    it('should be the first focusable element (via document order)', () => {
      const { container } = render(
        <>
          <SkipLink />
          <button>Other Element</button>
        </>
      );

      const skipLink = screen.getByRole('link');
      const button = screen.getByRole('button');

      // SkipLink should come before button in DOM order
      const skipLinkIndex = Array.from(container.querySelectorAll('*')).indexOf(skipLink);
      const buttonIndex = Array.from(container.querySelectorAll('*')).indexOf(button);

      expect(skipLinkIndex).toBeLessThan(buttonIndex);
    });

    it('should target a valid landmark (main content)', () => {
      render(<SkipLink href="#main-content" />);

      const link = screen.getByRole('link');
      expect(link.getAttribute('href')).toBe('#main-content');
      expect(link.getAttribute('href')).toMatch(/^#/); // Anchor link
    });

    it('should have descriptive text for screen readers', () => {
      render(<SkipLink label="Skip to main content" />);

      const link = screen.getByRole('link', { name: /skip to main content/i });
      expect(link.textContent).toBe('Skip to main content');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to anchor element', () => {
      const ref = { current: null };
      render(<SkipLink ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });

    it('should allow ref access to DOM methods', () => {
      const ref = { current: null };
      render(<SkipLink ref={ref} />);

      expect(ref.current).toHaveProperty('focus');
      expect(ref.current).toHaveProperty('click');
    });
  });
});
