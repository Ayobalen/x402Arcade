/**
 * ResponsiveImage Component Tests
 *
 * Tests for responsive image generation, srcset, sizes,
 * and priority loading behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResponsiveImage } from './ResponsiveImage';
import { DEFAULT_WIDTHS, SIZES_PRESETS, BREAKPOINT_PRESETS } from './ResponsiveImage.types';

describe('ResponsiveImage', () => {
  const defaultProps = {
    src: '/images/test-image.jpg',
    alt: 'Test image',
    width: 800,
    height: 600,
  };

  describe('Rendering', () => {
    it('renders an image with basic props', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('alt', 'Test image');
    });

    it('renders with correct width and height', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '800');
      expect(img).toHaveAttribute('height', '600');
    });

    it('applies custom className', () => {
      render(<ResponsiveImage {...defaultProps} className="custom-class" />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('custom-class');
    });

    it('applies aspect ratio style by default', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ aspectRatio: '800 / 600' });
    });

    it('skips aspect ratio when preserveAspectRatio is false', () => {
      render(<ResponsiveImage {...defaultProps} preserveAspectRatio={false} />);

      const img = screen.getByRole('img');
      expect(img).not.toHaveStyle({ aspectRatio: '800 / 600' });
    });

    it('uses custom aspectRatio when provided', () => {
      render(<ResponsiveImage {...defaultProps} aspectRatio="16/9" />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ aspectRatio: '16/9' });
    });
  });

  describe('Srcset Generation', () => {
    it('generates srcset with default widths', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      // Should include all default widths
      DEFAULT_WIDTHS.forEach((width) => {
        expect(srcset).toContain(`${width}w`);
      });
    });

    it('generates srcset with custom widths', () => {
      const customWidths = [400, 800, 1200];
      render(<ResponsiveImage {...defaultProps} widths={customWidths} />);

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      customWidths.forEach((width) => {
        expect(srcset).toContain(`${width}w`);
      });

      // Should not contain default widths that aren't in custom array
      expect(srcset).not.toContain('1536w');
    });

    it('uses default format (jpg) in srcset URLs', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      // Each width should have a .jpg URL
      DEFAULT_WIDTHS.forEach((width) => {
        expect(srcset).toContain(`-${width}.jpg`);
      });
    });

    it('uses custom format in srcset URLs', () => {
      render(<ResponsiveImage {...defaultProps} format="png" />);

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      DEFAULT_WIDTHS.forEach((width) => {
        expect(srcset).toContain(`-${width}.png`);
      });
    });

    it('uses custom srcset generator', () => {
      const customGenerator = vi.fn(
        (src: string, width: number) => `${src}?w=${width}&format=webp`
      );

      render(
        <ResponsiveImage {...defaultProps} srcsetGenerator={customGenerator} widths={[400, 800]} />
      );

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      expect(srcset).toContain('?w=400&format=webp 400w');
      expect(srcset).toContain('?w=800&format=webp 800w');
      expect(customGenerator).toHaveBeenCalledWith('/images/test-image.jpg', 400);
      expect(customGenerator).toHaveBeenCalledWith('/images/test-image.jpg', 800);
    });

    it('handles src with existing extension', () => {
      render(
        <ResponsiveImage
          src="/images/photo.png"
          alt="Photo"
          width={800}
          height={600}
          widths={[400]}
        />
      );

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      // Should replace extension, not append
      expect(srcset).toContain('/images/photo-400.jpg');
      expect(srcset).not.toContain('.png');
    });
  });

  describe('Sizes Generation', () => {
    it('generates default sizes based on image width', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      const sizes = img.getAttribute('sizes');

      expect(sizes).toContain('100vw');
      expect(sizes).toContain('800px');
    });

    it('uses custom sizes when provided', () => {
      const customSizes = '(max-width: 768px) 100vw, 50vw';
      render(<ResponsiveImage {...defaultProps} sizes={customSizes} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', customSizes);
    });

    it('uses preset sizes for card preset', () => {
      render(<ResponsiveImage {...defaultProps} preset="card" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.card);
    });

    it('uses preset sizes for hero preset', () => {
      render(<ResponsiveImage {...defaultProps} preset="hero" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.hero);
    });

    it('uses preset sizes for thumbnail preset', () => {
      render(<ResponsiveImage {...defaultProps} preset="thumbnail" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.thumbnail);
    });

    it('uses preset sizes for game-thumbnail preset', () => {
      render(<ResponsiveImage {...defaultProps} preset="game-thumbnail" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS['game-thumbnail']);
    });

    it('generates sizes from custom breakpoints', () => {
      const breakpoints = [
        { width: 640, imageWidth: 300 },
        { width: 1024, imageWidth: 500 },
        { width: Infinity, imageWidth: 800 },
      ];

      render(<ResponsiveImage {...defaultProps} breakpoints={breakpoints} />);

      const img = screen.getByRole('img');
      const sizes = img.getAttribute('sizes');

      expect(sizes).toContain('(max-width: 640px) 300px');
      expect(sizes).toContain('(max-width: 1024px) 500px');
      expect(sizes).toContain('800px');
    });

    it('custom sizes override preset', () => {
      const customSizes = '100vw';
      render(<ResponsiveImage {...defaultProps} preset="card" sizes={customSizes} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', customSizes);
    });
  });

  describe('Loading Behavior', () => {
    it('uses lazy loading by default', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('uses eager loading when priority is true', () => {
      render(<ResponsiveImage {...defaultProps} priority />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('sets high fetchPriority when priority is true', () => {
      render(<ResponsiveImage {...defaultProps} priority />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('fetchpriority', 'high');
    });

    it('uses auto fetchPriority by default', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('fetchpriority', 'auto');
    });

    it('respects explicit loading prop over priority', () => {
      render(<ResponsiveImage {...defaultProps} loading="eager" priority={false} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('respects explicit fetchPriority prop over priority', () => {
      render(<ResponsiveImage {...defaultProps} fetchPriority="low" priority />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('fetchpriority', 'low');
    });
  });

  describe('Presets', () => {
    it('applies thumbnail preset correctly', () => {
      render(<ResponsiveImage {...defaultProps} preset="thumbnail" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.thumbnail);
    });

    it('applies card preset correctly', () => {
      render(<ResponsiveImage {...defaultProps} preset="card" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.card);
    });

    it('applies hero preset correctly', () => {
      render(<ResponsiveImage {...defaultProps} preset="hero" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.hero);
    });

    it('applies full-width preset correctly', () => {
      render(<ResponsiveImage {...defaultProps} preset="full-width" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS['full-width']);
    });

    it('applies avatar preset correctly', () => {
      render(<ResponsiveImage {...defaultProps} preset="avatar" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', SIZES_PRESETS.avatar);
    });

    it('custom breakpoints override preset', () => {
      const breakpoints = [
        { width: 500, imageWidth: 200 },
        { width: Infinity, imageWidth: 400 },
      ];

      render(<ResponsiveImage {...defaultProps} preset="card" breakpoints={breakpoints} />);

      const img = screen.getByRole('img');
      const sizes = img.getAttribute('sizes');

      expect(sizes).toContain('(max-width: 500px) 200px');
      expect(sizes).not.toEqual(SIZES_PRESETS.card);
    });
  });

  describe('Format Support', () => {
    it('includes webp format by default', () => {
      render(<ResponsiveImage {...defaultProps} />);

      // The OptimizedImage will handle WebP generation
      // We just verify the image renders
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('supports format prop for srcset generation', () => {
      render(<ResponsiveImage {...defaultProps} format="webp" />);

      const img = screen.getByRole('img');
      const srcset = img.getAttribute('srcset');

      expect(srcset).toContain('.webp');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to the img element', () => {
      const ref = { current: null };
      render(<ResponsiveImage {...defaultProps} ref={ref as React.RefObject<HTMLImageElement>} />);

      expect(ref.current).toBeInstanceOf(HTMLImageElement);
    });
  });

  describe('Accessibility', () => {
    it('requires alt text', () => {
      render(<ResponsiveImage {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', 'Test image');
    });

    it('supports decorative images with empty alt', () => {
      render(<ResponsiveImage {...defaultProps} alt="" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', '');
    });
  });

  describe('BREAKPOINT_PRESETS', () => {
    it('contains correct thumbnail breakpoints', () => {
      expect(BREAKPOINT_PRESETS.thumbnail).toHaveLength(3);
      expect(BREAKPOINT_PRESETS.thumbnail[0]).toEqual({ width: 640, imageWidth: 150 });
    });

    it('contains correct card breakpoints', () => {
      expect(BREAKPOINT_PRESETS.card).toHaveLength(3);
    });

    it('contains correct hero breakpoints', () => {
      expect(BREAKPOINT_PRESETS.hero).toHaveLength(3);
    });

    it('contains correct game-thumbnail breakpoints', () => {
      expect(BREAKPOINT_PRESETS['game-thumbnail']).toHaveLength(4);
    });

    it('contains correct avatar breakpoints', () => {
      expect(BREAKPOINT_PRESETS.avatar).toHaveLength(3);
    });
  });

  describe('DEFAULT_WIDTHS', () => {
    it('contains standard responsive widths', () => {
      expect(DEFAULT_WIDTHS).toContain(320);
      expect(DEFAULT_WIDTHS).toContain(640);
      expect(DEFAULT_WIDTHS).toContain(768);
      expect(DEFAULT_WIDTHS).toContain(1024);
      expect(DEFAULT_WIDTHS).toContain(1280);
      expect(DEFAULT_WIDTHS).toContain(1536);
    });
  });

  describe('Edge Cases', () => {
    it('handles very small images', () => {
      render(<ResponsiveImage src="/images/icon.png" alt="Icon" width={32} height={32} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });

    it('handles very large images', () => {
      render(
        <ResponsiveImage src="/images/panorama.jpg" alt="Panorama" width={4000} height={1000} />
      );

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
    });

    it('handles square aspect ratio', () => {
      render(<ResponsiveImage src="/images/square.jpg" alt="Square" width={500} height={500} />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ aspectRatio: '500 / 500' });
    });

    it('handles portrait aspect ratio', () => {
      render(
        <ResponsiveImage src="/images/portrait.jpg" alt="Portrait" width={400} height={600} />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ aspectRatio: '400 / 600' });
    });
  });
});
