/**
 * Scroll Restoration Hook Storybook Stories
 *
 * Visual documentation and testing for useScrollRestoration hook.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useScrollRestoration } from '../../packages/frontend/src/hooks/useScrollRestoration';

const meta: Meta = {
  title: 'Hooks/useScrollRestoration',
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0a0a0a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

/**
 * Page component with scroll restoration
 */
function PageWithScroll({ title, color }: { title: string; color: string }) {
  useScrollRestoration();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-[#1a1a2e] border-b border-[#2d2d4a] p-4 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">{title}</h1>
          <nav className="flex gap-4">
            <Link to="/page1" className="px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-400">
              Page 1
            </Link>
            <Link to="/page2" className="px-4 py-2 bg-pink-500 rounded hover:bg-pink-400">
              Page 2
            </Link>
            <Link to="/page3" className="px-4 py-2 bg-green-500 rounded hover:bg-green-400">
              Page 3
            </Link>
          </nav>
        </div>
      </header>

      {/* Content with lots of scrollable items */}
      <main className="pt-20 px-4 max-w-6xl mx-auto">
        <div className="mb-6 p-4 bg-[#16162a] rounded-lg border border-[#2d2d4a]">
          <p className="text-gray-400">
            Current route: <code className="text-cyan-400">{location.pathname}</code>
          </p>
          <p className="text-gray-400 mt-2">
            <strong>Instructions:</strong> Scroll down on this page, then navigate to another
            page. When you use the browser back button, your scroll position will be restored!
          </p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl border-2`}
              style={{
                backgroundColor: color + '20',
                borderColor: color,
              }}
            >
              <h3 className="text-xl font-bold mb-2">
                {title} - Item #{i + 1}
              </h3>
              <p className="text-gray-400">
                This is item #{i + 1} on {title}. Scroll position is automatically saved when
                you navigate away and restored when you come back.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

/**
 * Basic Scroll Restoration Demo
 *
 * Demonstrates automatic scroll position restoration across multiple pages.
 */
export const BasicDemo: Story = {
  render: () => {
    return (
      <MemoryRouter initialEntries={['/page1']}>
        <Routes>
          <Route path="/page1" element={<PageWithScroll title="Page 1" color="#00ffff" />} />
          <Route path="/page2" element={<PageWithScroll title="Page 2" color="#ff00ff" />} />
          <Route path="/page3" element={<PageWithScroll title="Page 3" color="#00ff00" />} />
        </Routes>
      </MemoryRouter>
    );
  },
};

/**
 * Smooth Scrolling Enabled
 *
 * Same demo but with smooth scrolling animations.
 */
function PageWithSmoothScroll({ title, color }: { title: string; color: string }) {
  useScrollRestoration({ smooth: true, delay: 150 });
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 bg-[#1a1a2e] border-b border-[#2d2d4a] p-4 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">{title}</h1>
          <nav className="flex gap-4">
            <Link to="/page1" className="px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-400">
              Page 1
            </Link>
            <Link to="/page2" className="px-4 py-2 bg-pink-500 rounded hover:bg-pink-400">
              Page 2
            </Link>
            <Link to="/page3" className="px-4 py-2 bg-green-500 rounded hover:bg-green-400">
              Page 3
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-6xl mx-auto">
        <div className="mb-6 p-4 bg-[#16162a] rounded-lg border border-[#2d2d4a]">
          <p className="text-gray-400">
            Current route: <code className="text-cyan-400">{location.pathname}</code>
          </p>
          <p className="text-green-400 mt-2">
            <strong>✨ Smooth scrolling enabled!</strong> Watch the smooth animation when
            restoring scroll position or navigating to a new page.
          </p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 50 }, (_, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl border-2`}
              style={{
                backgroundColor: color + '20',
                borderColor: color,
              }}
            >
              <h3 className="text-xl font-bold mb-2">
                {title} - Item #{i + 1}
              </h3>
              <p className="text-gray-400">
                Smooth scrolling makes the restoration feel more polished and less jarring.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export const SmoothScrolling: Story = {
  render: () => {
    return (
      <MemoryRouter initialEntries={['/page1']}>
        <Routes>
          <Route path="/page1" element={<PageWithSmoothScroll title="Page 1" color="#00ffff" />} />
          <Route path="/page2" element={<PageWithSmoothScroll title="Page 2" color="#ff00ff" />} />
          <Route path="/page3" element={<PageWithSmoothScroll title="Page 3" color="#00ff00" />} />
        </Routes>
      </MemoryRouter>
    );
  },
};

/**
 * Custom Delay Demo
 *
 * Demonstrates custom delay for scroll restoration (useful for page transitions).
 */
function PageWithDelayedScroll({ title, color }: { title: string; color: string }) {
  useScrollRestoration({ delay: 500 }); // Wait 500ms for page transition to complete
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="fixed top-0 left-0 right-0 bg-[#1a1a2e] border-b border-[#2d2d4a] p-4 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">{title}</h1>
          <nav className="flex gap-4">
            <Link to="/page1" className="px-4 py-2 bg-cyan-500 rounded hover:bg-cyan-400">
              Page 1
            </Link>
            <Link to="/page2" className="px-4 py-2 bg-pink-500 rounded hover:bg-pink-400">
              Page 2
            </Link>
          </nav>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-6xl mx-auto">
        <div className="mb-6 p-4 bg-[#16162a] rounded-lg border border-[#2d2d4a]">
          <p className="text-gray-400">
            Current route: <code className="text-cyan-400">{location.pathname}</code>
          </p>
          <p className="text-yellow-400 mt-2">
            <strong>⏱️ 500ms delay before scroll restoration</strong> - This allows page
            transitions to complete before scrolling.
          </p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className={`p-6 rounded-xl border-2`}
              style={{
                backgroundColor: color + '20',
                borderColor: color,
              }}
            >
              <h3 className="text-xl font-bold mb-2">
                {title} - Item #{i + 1}
              </h3>
              <p className="text-gray-400">
                The delay prevents scroll restoration from interfering with page animations.
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export const CustomDelay: Story = {
  render: () => {
    return (
      <MemoryRouter initialEntries={['/page1']}>
        <Routes>
          <Route path="/page1" element={<PageWithDelayedScroll title="Page 1" color="#00ffff" />} />
          <Route path="/page2" element={<PageWithDelayedScroll title="Page 2" color="#ff00ff" />} />
        </Routes>
      </MemoryRouter>
    );
  },
};

/**
 * Documentation Example
 *
 * Shows how the hook is typically used in a real application.
 */
export const Documentation: Story = {
  render: () => {
    return (
      <div className="p-8 bg-[#0a0a0a] text-white max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">useScrollRestoration Hook</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Overview</h2>
          <p className="text-gray-400 mb-4">
            The <code className="text-cyan-400">useScrollRestoration</code> hook automatically
            manages scroll position restoration during page transitions. It stores the scroll
            position before navigating away and restores it when the user returns via the back
            button.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Features</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Stores scroll positions per route in session storage</li>
            <li>Restores scroll position on back navigation</li>
            <li>Scrolls to top on forward navigation</li>
            <li>Integrates with page transition timing</li>
            <li>SSR-safe with proper hydration</li>
            <li>Configurable delay, smooth scrolling, and storage type</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Basic Usage</h2>
          <pre className="bg-[#16162a] p-4 rounded-lg border border-[#2d2d4a] overflow-x-auto">
            <code className="text-sm text-green-400">{`function MyPage() {
  useScrollRestoration();

  return (
    <div>
      <h1>My Page</h1>
      {/* Long scrollable content */}
    </div>
  );
}`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Advanced Options</h2>
          <pre className="bg-[#16162a] p-4 rounded-lg border border-[#2d2d4a] overflow-x-auto">
            <code className="text-sm text-green-400">{`// With custom delay for page transitions
useScrollRestoration({ delay: 300 });

// With smooth scrolling
useScrollRestoration({ smooth: true });

// With memory-only storage (no persistence)
useScrollRestoration({ storage: 'memory' });

// Combined options
useScrollRestoration({
  delay: 300,
  smooth: true,
  storage: 'session',
  maxAge: 3600000, // 1 hour
});`}</code>
          </pre>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Best Practices</h2>
          <ul className="list-disc list-inside text-gray-400 space-y-2">
            <li>Use at the page/route level, not in individual components</li>
            <li>Set delay to match your page transition duration</li>
            <li>Use smooth scrolling for better UX (but test performance)</li>
            <li>Consider memory storage for sensitive content</li>
            <li>Test with long pages and frequent navigation</li>
          </ul>
        </section>
      </div>
    );
  },
};
