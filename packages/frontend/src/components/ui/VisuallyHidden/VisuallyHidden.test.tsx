/**
 * @vitest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  VisuallyHidden,
  visuallyHiddenClasses,
  focusableVisuallyHiddenClasses,
} from './VisuallyHidden';

describe('VisuallyHidden', () => {
  describe('Basic Rendering', () => {
    it('should render children content', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');
      expect(element).toBeInTheDocument();
    });

    it('should render as span by default', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');
      expect(element.tagName).toBe('SPAN');
    });

    it('should accept custom element type via "as" prop', () => {
      render(<VisuallyHidden as="div">Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');
      expect(element.tagName).toBe('DIV');
    });

    it('should render as paragraph element', () => {
      render(<VisuallyHidden as="p">Hidden paragraph</VisuallyHidden>);

      const element = screen.getByText('Hidden paragraph');
      expect(element.tagName).toBe('P');
    });
  });

  describe('Visual Hiding Styles', () => {
    it('should apply visually hidden styles', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');
      const styles = window.getComputedStyle(element);

      // Check key visually hidden properties
      expect(element.style.position).toBe('absolute');
      expect(element.style.width).toBe('1px');
      expect(element.style.height).toBe('1px');
      expect(element.style.overflow).toBe('hidden');
    });

    it('should not display content visually', () => {
      render(<VisuallyHidden>Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');

      // Element should be in document but not visible
      expect(element).toBeInTheDocument();
      expect(element.style.width).toBe('1px');
      expect(element.style.height).toBe('1px');
    });
  });

  describe('Focusable Mode (Skip Links)', () => {
    it('should apply focusable styles when focusable prop is true', () => {
      render(
        <VisuallyHidden as="a" focusable={true}>
          Skip to main content
        </VisuallyHidden>
      );

      const element = screen.getByText('Skip to main content');

      // Should have different positioning for focusable elements
      expect(element.style.position).toBe('absolute');
    });

    it('should render skip link properly', () => {
      render(
        <VisuallyHidden as="a" focusable={true}>
          <a href="#main">Skip to main content</a>
        </VisuallyHidden>
      );

      const link = screen.getByText('Skip to main content');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });
  });

  describe('Custom className Support', () => {
    it('should accept and apply custom className', () => {
      render(<VisuallyHidden className="custom-class">Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');
      expect(element.className).toContain('custom-class');
    });

    it('should combine custom className with visually hidden styles', () => {
      render(<VisuallyHidden className="my-custom-class">Hidden text</VisuallyHidden>);

      const element = screen.getByText('Hidden text');

      // Should have custom class
      expect(element.className).toContain('my-custom-class');

      // Should still have visually hidden styles
      expect(element.style.width).toBe('1px');
      expect(element.style.height).toBe('1px');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible to screen readers', () => {
      render(<VisuallyHidden>Accessible description</VisuallyHidden>);

      const element = screen.getByText('Accessible description');

      // Element should be in DOM (accessible to screen readers)
      expect(element).toBeInTheDocument();

      // But visually hidden
      expect(element.style.width).toBe('1px');
      expect(element.style.height).toBe('1px');
    });

    it('should work with aria-label pattern', () => {
      render(
        <button>
          <svg aria-hidden="true">Icon</svg>
          <VisuallyHidden>Close dialog</VisuallyHidden>
        </button>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Close dialog');
    });

    it('should work with form labels', () => {
      render(
        <div>
          <VisuallyHidden as="label" htmlFor="search">
            Search the site
          </VisuallyHidden>
          <input id="search" type="text" placeholder="Search..." />
        </div>
      );

      const label = screen.getByText('Search the site');
      expect(label).toBeInTheDocument();
      expect(label.tagName).toBe('LABEL');
    });
  });

  describe('Use Cases', () => {
    it('should work for icon button labels', () => {
      render(
        <button>
          <span aria-hidden="true">✕</span>
          <VisuallyHidden>Close</VisuallyHidden>
        </button>
      );

      const button = screen.getByRole('button', { name: 'Close' });
      expect(button).toBeInTheDocument();
    });

    it('should work for decorative list markers', () => {
      render(
        <ul>
          <li>
            <VisuallyHidden>Item 1:</VisuallyHidden>
            <span>Content</span>
          </li>
        </ul>
      );

      expect(screen.getByText('Item 1:')).toBeInTheDocument();
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should work for table headers', () => {
      render(
        <table>
          <thead>
            <tr>
              <th>
                <VisuallyHidden>Row number</VisuallyHidden>
              </th>
              <th>Name</th>
            </tr>
          </thead>
        </table>
      );

      expect(screen.getByText('Row number')).toBeInTheDocument();
    });
  });

  describe('CSS Class Exports', () => {
    it('should export visuallyHiddenClasses string', () => {
      expect(typeof visuallyHiddenClasses).toBe('string');
      expect(visuallyHiddenClasses).toContain('absolute');
      expect(visuallyHiddenClasses).toContain('w-px');
      expect(visuallyHiddenClasses).toContain('h-px');
    });

    it('should export focusableVisuallyHiddenClasses string', () => {
      expect(typeof focusableVisuallyHiddenClasses).toBe('string');
      expect(focusableVisuallyHiddenClasses).toContain('sr-only');
      expect(focusableVisuallyHiddenClasses).toContain('focus:not-sr-only');
    });
  });
});
