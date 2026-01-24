/**
 * Layout Component Tests
 *
 * Comprehensive unit tests for the Layout component.
 * Covers structure, child rendering, background effects, and responsive behavior.
 */

import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Layout } from './Layout';

expect.extend(toHaveNoViolations);

// Mock the wallet store to avoid wallet connection issues
vi.mock('@/store/walletStore', () => ({
  useWalletStore: () => ({
    address: null,
    isConnected: false,
    chainId: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

// Wrapper component for Router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

// Render helper with router
const renderWithRouter = (ui: React.ReactElement) => render(ui, { wrapper: RouterWrapper });

describe('Layout', () => {
  describe('Basic Rendering', () => {
    it('renders children content', () => {
      renderWithRouter(
        <Layout>
          <div data-testid="child">Child content</div>
        </Layout>
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders as a div container', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      // The root element should be a div
      const root = screen.getByRole('banner').parentElement;
      expect(root?.tagName).toBe('DIV');
    });

    it('applies base container styles', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('min-h-screen', 'flex', 'flex-col');
    });

    it('applies dark theme background', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('bg-[#0a0a0a]', 'text-white');
    });

    it('has displayName set', () => {
      expect(Layout.displayName).toBe('Layout');
    });
  });

  describe('Header Integration', () => {
    it('renders Header component by default', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      // Header should be present (banner role)
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders navigation links in Header', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByRole('link', { name: /play/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /prizes/i })).toBeInTheDocument();
    });

    it('hides Header when showHeader is false', () => {
      renderWithRouter(
        <Layout showHeader={false}>
          <div>Content</div>
        </Layout>
      );
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    });

    it('passes showBalance to Header', () => {
      renderWithRouter(
        <Layout showBalance>
          <div>Content</div>
        </Layout>
      );
      // Balance should be displayed when showBalance is true
      expect(screen.getByText(/0\.00/)).toBeInTheDocument();
    });

    it('renders custom header when provided', () => {
      renderWithRouter(
        <Layout customHeader={<header data-testid="custom-header">Custom Header</header>}>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByTestId('custom-header')).toBeInTheDocument();
      expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });
  });

  describe('Main Content Area', () => {
    it('renders main element for content', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('renders children inside main element', () => {
      renderWithRouter(
        <Layout>
          <div data-testid="child">Child content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toContainElement(screen.getByTestId('child'));
    });

    it('applies flex-1 to main for viewport height fill', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('flex-1');
    });

    it('applies responsive padding by default', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('px-4', 'py-8');
    });

    it('removes padding when contentPadding is false', () => {
      renderWithRouter(
        <Layout contentPadding={false}>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).not.toHaveClass('px-4', 'py-8');
    });

    it('centers content horizontally', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('mx-auto');
    });

    it('applies z-index for layering above background', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('relative', 'z-10');
    });
  });

  describe('Max Width Options', () => {
    it('applies sm max-width', () => {
      renderWithRouter(
        <Layout maxWidth="sm">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-sm');
    });

    it('applies md max-width', () => {
      renderWithRouter(
        <Layout maxWidth="md">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-md');
    });

    it('applies lg max-width', () => {
      renderWithRouter(
        <Layout maxWidth="lg">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-lg');
    });

    it('applies xl max-width', () => {
      renderWithRouter(
        <Layout maxWidth="xl">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-xl');
    });

    it('applies 2xl max-width', () => {
      renderWithRouter(
        <Layout maxWidth="2xl">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-2xl');
    });

    it('applies full max-width by default', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-full');
    });
  });

  describe('Background Effects', () => {
    it('renders BackgroundEffects by default', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      // Background effects container should be present (fixed, inset-0)
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toBeInTheDocument();
      expect(bgEffects).toHaveClass('fixed', 'inset-0');
    });

    it('hides BackgroundEffects when showBackgroundEffects is false', () => {
      const { container } = renderWithRouter(
        <Layout showBackgroundEffects={false}>
          <div>Content</div>
        </Layout>
      );
      // No background effects container when disabled
      const bgEffects = container.querySelector('.fixed.inset-0[aria-hidden="true"]');
      expect(bgEffects).not.toBeInTheDocument();
    });

    it('applies low glow intensity', () => {
      const { container } = renderWithRouter(
        <Layout glowIntensity="low">
          <div>Content</div>
        </Layout>
      );
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toBeInTheDocument();
    });

    it('applies medium glow intensity by default', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toBeInTheDocument();
    });

    it('applies high glow intensity', () => {
      const { container } = renderWithRouter(
        <Layout glowIntensity="high">
          <div>Content</div>
        </Layout>
      );
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toBeInTheDocument();
    });

    it('background effects have pointer-events-none', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toHaveClass('pointer-events-none');
    });
  });

  describe('Footer Support', () => {
    it('does not render footer by default (no customFooter)', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
    });

    it('renders custom footer when provided', () => {
      renderWithRouter(
        <Layout customFooter={<footer data-testid="custom-footer">Custom Footer</footer>}>
          <div>Content</div>
        </Layout>
      );
      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Custom Footer')).toBeInTheDocument();
    });

    it('hides footer when showFooter is false', () => {
      renderWithRouter(
        <Layout showFooter={false} customFooter={<footer data-testid="footer">Footer</footer>}>
          <div>Content</div>
        </Layout>
      );
      expect(screen.queryByTestId('footer')).not.toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to main content', () => {
      renderWithRouter(
        <Layout className="custom-layout">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('custom-layout');
    });

    it('merges custom className with default classes', () => {
      renderWithRouter(
        <Layout className="custom-class">
          <div>Content</div>
        </Layout>
      );
      const main = screen.getByRole('main');
      expect(main).toHaveClass('custom-class', 'flex-1', 'mx-auto');
    });
  });

  describe('Children Rendering', () => {
    it('renders string children', () => {
      renderWithRouter(<Layout>Simple text content</Layout>);
      expect(screen.getByText('Simple text content')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      renderWithRouter(
        <Layout>
          <div data-testid="first">First</div>
          <div data-testid="second">Second</div>
          <div data-testid="third">Third</div>
        </Layout>
      );
      expect(screen.getByTestId('first')).toBeInTheDocument();
      expect(screen.getByTestId('second')).toBeInTheDocument();
      expect(screen.getByTestId('third')).toBeInTheDocument();
    });

    it('renders nested components', () => {
      renderWithRouter(
        <Layout>
          <section>
            <article>
              <h1>Nested Heading</h1>
              <p>Nested paragraph</p>
            </article>
          </section>
        </Layout>
      );
      expect(screen.getByRole('heading', { name: 'Nested Heading' })).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations in default state', async () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Accessible content</div>
        </Layout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations without header', async () => {
      const { container } = renderWithRouter(
        <Layout showHeader={false}>
          <div>Content without header</div>
        </Layout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with all options', async () => {
      const { container } = renderWithRouter(
        <Layout showBalance maxWidth="xl" customFooter={<footer>Footer content</footer>}>
          <main>
            <h1>Page Title</h1>
            <p>Page content</p>
          </main>
        </Layout>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has proper semantic structure', () => {
      renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      // Should have banner (header) and main regions
      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('background effects are hidden from assistive technology', () => {
      const { container } = renderWithRouter(
        <Layout>
          <div>Content</div>
        </Layout>
      );
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Combined Props', () => {
    it('works with all props combined', () => {
      renderWithRouter(
        <Layout
          showHeader
          showFooter
          showBalance
          maxWidth="xl"
          contentPadding
          showBackgroundEffects
          glowIntensity="high"
          className="full-featured"
          customFooter={<footer data-testid="footer">Footer</footer>}
        >
          <div data-testid="content">Full featured content</div>
        </Layout>
      );

      // Content renders
      expect(screen.getByTestId('content')).toBeInTheDocument();

      // Header present
      expect(screen.getByRole('banner')).toBeInTheDocument();

      // Footer present
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // Main has correct classes
      const main = screen.getByRole('main');
      expect(main).toHaveClass('max-w-screen-xl', 'px-4', 'py-8', 'full-featured');
    });

    it('works with minimal props (fullscreen game mode)', () => {
      const { container } = renderWithRouter(
        <Layout
          showHeader={false}
          showFooter={false}
          showBackgroundEffects={false}
          contentPadding={false}
          maxWidth="full"
        >
          <div data-testid="game-canvas">Game Canvas</div>
        </Layout>
      );

      // Content renders
      expect(screen.getByTestId('game-canvas')).toBeInTheDocument();

      // No header
      expect(screen.queryByRole('banner')).not.toBeInTheDocument();

      // No background effects
      const bgEffects = container.querySelector('[aria-hidden="true"]');
      expect(bgEffects).not.toBeInTheDocument();

      // Main has no padding
      const main = screen.getByRole('main');
      expect(main).not.toHaveClass('px-4', 'py-8');
      expect(main).toHaveClass('max-w-full');
    });
  });
});
