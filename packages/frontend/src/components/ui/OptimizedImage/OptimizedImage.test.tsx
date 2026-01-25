/**
 * OptimizedImage Component Tests
 *
 * Tests for the OptimizedImage component covering:
 * - Basic rendering
 * - WebP source generation
 * - AVIF support
 * - Picture element structure
 * - Accessibility
 * - Loading states
 * - Error handling
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizedImage } from './OptimizedImage';

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render an img element for SVGs', () => {
      render(<OptimizedImage src="/logo.svg" alt="Logo" />);

      const img = screen.getByRole('img', { name: 'Logo' });
      expect(img).toBeInTheDocument();
      expect(img.tagName).toBe('IMG');
      expect(img).toHaveAttribute('src', '/logo.svg');
    });

    it('should render a picture element for PNGs with WebP source', () => {
      const { container } = render(<OptimizedImage src="/hero.png" alt="Hero" />);

      const picture = container.querySelector('picture');
      expect(picture).toBeInTheDocument();

      const sources = picture?.querySelectorAll('source');
      expect(sources?.length).toBe(1);
      expect(sources?.[0]).toHaveAttribute('type', 'image/webp');
      expect(sources?.[0]).toHaveAttribute('srcset', '/hero.webp');
    });

    it('should render a picture element for JPEGs with WebP source', () => {
      const { container } = render(<OptimizedImage src="/photo.jpg" alt="Photo" />);

      const picture = container.querySelector('picture');
      const sources = picture?.querySelectorAll('source');
      expect(sources?.length).toBe(1);
      expect(sources?.[0]).toHaveAttribute('srcset', '/photo.webp');
    });

    it('should handle .jpeg extension', () => {
      const { container } = render(<OptimizedImage src="/photo.jpeg" alt="Photo" />);

      const source = container.querySelector('source');
      expect(source).toHaveAttribute('srcset', '/photo.webp');
    });

    it('should render with width and height attributes', () => {
      render(<OptimizedImage src="/image.png" alt="Image" width={400} height={300} />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('width', '400');
      expect(img).toHaveAttribute('height', '300');
    });

    it('should apply custom className to img element', () => {
      render(<OptimizedImage src="/image.png" alt="Image" className="custom-class" />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('custom-class');
    });

    it('should apply pictureClassName to picture element', () => {
      const { container } = render(
        <OptimizedImage src="/image.png" alt="Image" pictureClassName="picture-class" />
      );

      const picture = container.querySelector('picture');
      expect(picture).toHaveClass('picture-class');
    });
  });

  describe('WebP Support', () => {
    it('should include WebP source by default', () => {
      const { container } = render(<OptimizedImage src="/image.png" alt="Image" />);

      const source = container.querySelector('source[type="image/webp"]');
      expect(source).toBeInTheDocument();
    });

    it('should disable WebP when webp prop is false', () => {
      const { container } = render(<OptimizedImage src="/image.png" alt="Image" webp={false} />);

      const picture = container.querySelector('picture');
      expect(picture).not.toBeInTheDocument();
    });

    it('should convert PNG to WebP in srcset', () => {
      const { container } = render(
        <OptimizedImage
          src="/image.png"
          alt="Image"
          srcset="/image-400.png 400w, /image-800.png 800w"
        />
      );

      const source = container.querySelector('source[type="image/webp"]');
      expect(source).toHaveAttribute('srcset', '/image-400.webp 400w, /image-800.webp 800w');
    });
  });

  describe('AVIF Support', () => {
    it('should not include AVIF source by default', () => {
      const { container } = render(<OptimizedImage src="/image.png" alt="Image" />);

      const source = container.querySelector('source[type="image/avif"]');
      expect(source).not.toBeInTheDocument();
    });

    it('should include AVIF source when avif prop is true', () => {
      const { container } = render(<OptimizedImage src="/image.png" alt="Image" avif />);

      const avifSource = container.querySelector('source[type="image/avif"]');
      expect(avifSource).toBeInTheDocument();
      expect(avifSource).toHaveAttribute('srcset', '/image.avif');
    });

    it('should order AVIF before WebP', () => {
      const { container } = render(<OptimizedImage src="/image.png" alt="Image" avif webp />);

      const sources = container.querySelectorAll('source');
      expect(sources[0]).toHaveAttribute('type', 'image/avif');
      expect(sources[1]).toHaveAttribute('type', 'image/webp');
    });
  });

  describe('Custom Sources', () => {
    it('should render custom sources', () => {
      const { container } = render(
        <OptimizedImage
          src="/image.png"
          alt="Image"
          sources={[
            {
              src: '/image-mobile.png',
              format: 'png',
              media: '(max-width: 768px)',
            },
          ]}
        />
      );

      const customSource = container.querySelector('source[media="(max-width: 768px)"]');
      expect(customSource).toBeInTheDocument();
      expect(customSource).toHaveAttribute('srcset', '/image-mobile.png');
    });

    it('should render custom sources before generated sources', () => {
      const { container } = render(
        <OptimizedImage
          src="/image.png"
          alt="Image"
          sources={[
            {
              src: '/image-mobile.webp',
              format: 'webp',
              media: '(max-width: 768px)',
            },
          ]}
        />
      );

      const sources = container.querySelectorAll('source');
      // Custom source first, then generated WebP
      expect(sources[0]).toHaveAttribute('media', '(max-width: 768px)');
      expect(sources[1]).not.toHaveAttribute('media');
    });
  });

  describe('Accessibility', () => {
    it('should have alt text', () => {
      render(<OptimizedImage src="/image.png" alt="Descriptive alt text" />);

      const img = screen.getByRole('img', { name: 'Descriptive alt text' });
      expect(img).toBeInTheDocument();
    });

    it('should support empty alt for decorative images', () => {
      render(<OptimizedImage src="/bg.png" alt="" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('alt', '');
    });
  });

  describe('Loading Behavior', () => {
    it('should use lazy loading by default', () => {
      render(<OptimizedImage src="/image.png" alt="Image" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('should support eager loading', () => {
      render(<OptimizedImage src="/image.png" alt="Image" loading="eager" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should use async decoding by default', () => {
      render(<OptimizedImage src="/image.png" alt="Image" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('decoding', 'async');
    });

    it('should support custom decoding', () => {
      render(<OptimizedImage src="/image.png" alt="Image" decoding="sync" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('decoding', 'sync');
    });
  });

  describe('Callbacks', () => {
    it('should call onLoad when image loads', () => {
      const handleLoad = vi.fn();
      render(<OptimizedImage src="/image.png" alt="Image" onLoad={handleLoad} />);

      const img = screen.getByRole('img');
      fireEvent.load(img);

      expect(handleLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onError when image fails to load', () => {
      const handleError = vi.fn();
      render(<OptimizedImage src="/invalid.png" alt="Image" onError={handleError} />);

      const img = screen.getByRole('img');
      fireEvent.error(img);

      expect(handleError).toHaveBeenCalledTimes(1);
    });
  });

  describe('Styling', () => {
    it('should apply objectFit style', () => {
      render(<OptimizedImage src="/image.png" alt="Image" objectFit="contain" />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ objectFit: 'contain' });
    });

    it('should apply objectPosition style', () => {
      render(<OptimizedImage src="/image.png" alt="Image" objectPosition="top left" />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ objectPosition: 'top left' });
    });

    it('should apply custom inline styles', () => {
      render(<OptimizedImage src="/image.png" alt="Image" style={{ borderRadius: '8px' }} />);

      const img = screen.getByRole('img');
      expect(img).toHaveStyle({ borderRadius: '8px' });
    });

    it('should have pulse animation before load', () => {
      render(<OptimizedImage src="/image.png" alt="Image" />);

      const img = screen.getByRole('img');
      expect(img).toHaveClass('animate-pulse');
    });

    it('should remove pulse animation after load', () => {
      render(<OptimizedImage src="/image.png" alt="Image" />);

      const img = screen.getByRole('img');
      fireEvent.load(img);

      expect(img).not.toHaveClass('animate-pulse');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to img element', () => {
      const ref = vi.fn();
      render(<OptimizedImage src="/image.png" alt="Image" ref={ref} />);

      expect(ref).toHaveBeenCalled();
      expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLImageElement);
    });
  });

  describe('Edge Cases', () => {
    it('should handle data URIs', () => {
      const dataUri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      render(<OptimizedImage src={dataUri} alt="Data URI" />);

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', dataUri);
    });

    it('should handle GIF images', () => {
      const { container } = render(<OptimizedImage src="/animation.gif" alt="GIF" />);

      const source = container.querySelector('source');
      expect(source).toHaveAttribute('srcset', '/animation.webp');
    });

    it('should pass through additional props', () => {
      render(
        <OptimizedImage
          src="/image.png"
          alt="Image"
          data-testid="custom-image"
          title="Image title"
        />
      );

      const img = screen.getByTestId('custom-image');
      expect(img).toHaveAttribute('title', 'Image title');
    });

    it('should have sizes attribute on img and source elements', () => {
      const { container } = render(
        <OptimizedImage src="/image.png" alt="Image" sizes="(max-width: 768px) 100vw, 50vw" />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');

      const source = container.querySelector('source');
      expect(source).toHaveAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    });
  });
});
