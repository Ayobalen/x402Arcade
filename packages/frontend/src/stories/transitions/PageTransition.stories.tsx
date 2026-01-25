import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { PageTransition } from '@/components/transitions/PageTransition';
import { useState } from 'react';
import type { PageTransitionPreset } from '@/lib/animations/pageTransitions';

/**
 * PageTransition Component Stories
 *
 * Demonstrates the PageTransition component with all available transition presets.
 * This component wraps page content with smooth animations on route changes.
 *
 * Features:
 * - Uses react-router's useLocation for route-based key
 * - Applies configurable transition variants
 * - Respects reduced motion preferences
 * - Supports all page transition presets
 */
const meta = {
  title: 'Transitions/PageTransition',
  component: PageTransition,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Wraps page content with smooth animations on route changes. Automatically detects route changes using useLocation and applies the selected transition variant.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PageTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

// Demo page components
const DemoPage = ({
  title,
  color,
  subtitle,
}: {
  title: string;
  color: string;
  subtitle?: string;
}) => (
  <div
    className="flex flex-col items-center justify-center min-h-screen"
    style={{
      background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
    }}
  >
    <div className="text-center space-y-4">
      <h1 className="text-6xl font-display font-bold" style={{ color }}>
        {title}
      </h1>
      {subtitle && <p className="text-2xl text-text-muted">{subtitle}</p>}
    </div>
  </div>
);

// Navigation demo wrapper
const NavigationDemo = ({ transition }: { transition: PageTransitionPreset }) => {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'contact'>('home');

  const pages = {
    home: { title: 'Home Page', color: '#8B5CF6', subtitle: 'Welcome!' },
    about: { title: 'About Page', color: '#EC4899', subtitle: 'Learn More' },
    contact: { title: 'Contact Page', color: '#10B981', subtitle: 'Get in Touch' },
  };

  return (
    <div className="relative min-h-screen bg-bg-main">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'about'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'contact'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              Contact
            </button>
          </div>
          <div className="text-center mt-2 text-sm text-text-muted">
            Transition: <span className="text-primary font-mono">{transition}</span>
          </div>
        </div>
      </div>

      {/* Content with padding to avoid navbar */}
      <div className="pt-24">
        <MemoryRouter key={currentPage}>
          <PageTransition transition={transition}>
            <DemoPage {...pages[currentPage]} />
          </PageTransition>
        </MemoryRouter>
      </div>
    </div>
  );
};

/**
 * Default Fade Transition
 *
 * Simple opacity fade - the most common and subtle transition.
 * Best for: Simple page changes, professional apps, accessibility-first designs
 */
export const Fade: Story = {
  render: () => <NavigationDemo transition="fade" />,
};

/**
 * Fast Fade Transition
 *
 * Quick opacity fade (200ms) for snappy page changes.
 * Best for: Rapid navigation, loading states, responsive interfaces
 */
export const FadeFast: Story = {
  render: () => <NavigationDemo transition="fadeFast" />,
};

/**
 * Slide Right Transition
 *
 * Slide in from right, exit to left - creates forward navigation feel.
 * Best for: Sequential pages, wizards, next/previous navigation
 */
export const SlideRight: Story = {
  render: () => <NavigationDemo transition="slideRight" />,
};

/**
 * Slide Left Transition
 *
 * Slide in from left, exit to right - creates backward navigation feel.
 * Best for: Back navigation, previous page, undo actions
 */
export const SlideLeft: Story = {
  render: () => <NavigationDemo transition="slideLeft" />,
};

/**
 * Slide Up Transition
 *
 * Slide in from top, creating a descending effect.
 * Best for: Mobile apps, dropdown content, hierarchical navigation
 */
export const SlideUp: Story = {
  render: () => <NavigationDemo transition="slideUp" />,
};

/**
 * Slide Down Transition
 *
 * Slide in from bottom, creating an ascending effect.
 * Best for: Mobile sheets, bottom navigation, modal alternatives
 */
export const SlideDown: Story = {
  render: () => <NavigationDemo transition="slideDown" />,
};

/**
 * Scale Center Transition
 *
 * Scale from center point with fade - creates focus effect.
 * Best for: Modal dialogs, detail views, focused content
 */
export const ScaleCenter: Story = {
  render: () => <NavigationDemo transition="scaleCenter" />,
};

/**
 * Scale Bottom Transition
 *
 * Scale from bottom - perfect for mobile sheet-style transitions.
 * Best for: Mobile bottom sheets, action panels, slide-up menus
 */
export const ScaleBottom: Story = {
  render: () => <NavigationDemo transition="scaleBottom" />,
};

/**
 * Slide Scale Transition
 *
 * Combined slide and scale for dramatic effect.
 * Best for: Game screens, hero sections, featured content
 */
export const SlideScale: Story = {
  render: () => <NavigationDemo transition="slideScale" />,
};

/**
 * Blur Transition
 *
 * Fade with blur effect (Apple-style) for premium feel.
 * Best for: Premium apps, iOS-like transitions, background changes
 */
export const Blur: Story = {
  render: () => <NavigationDemo transition="blur" />,
};

/**
 * Rotate Y Transition
 *
 * 3D rotate on Y axis - playful card flip effect.
 * Best for: Game screens, card flips, playful interactions
 */
export const RotateY: Story = {
  render: () => <NavigationDemo transition="rotateY" />,
};

/**
 * Zoom Transition
 *
 * Dramatic zoom in/out effect.
 * Best for: Game start screens, level transitions, splash screens
 */
export const Zoom: Story = {
  render: () => <NavigationDemo transition="zoom" />,
};

/**
 * Neon Glow Transition
 *
 * Arcade-style glow effect for retro aesthetic.
 * Best for: Game pages, arcade UI, neon-themed sections
 */
export const NeonGlow: Story = {
  render: () => <NavigationDemo transition="neonGlow" />,
};

/**
 * All Presets Comparison
 *
 * Side-by-side comparison of all transition presets.
 */
export const AllPresets: Story = {
  render: () => {
    const presets: PageTransitionPreset[] = [
      'fade',
      'fadeFast',
      'slideRight',
      'slideLeft',
      'slideUp',
      'slideDown',
      'scaleCenter',
      'scaleBottom',
      'slideScale',
      'blur',
      'rotateY',
      'zoom',
      'neonGlow',
    ];

    return (
      <div className="min-h-screen bg-bg-main p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-display font-bold text-text">All Page Transitions</h1>
            <p className="text-text-muted">Click buttons to see each transition in action</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => (
              <div key={preset} className="bg-bg-surface rounded-lg p-4 border border-border">
                <NavigationDemo transition={preset} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: 'fullscreen',
  },
};

// Component for callbacks demo (extracted to avoid hooks-in-render error)
const CallbacksDemo = () => {
  const [currentPage, setCurrentPage] = useState<'home' | 'about' | 'contact'>('home');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  };

  const pages = {
    home: { title: 'Home Page', color: '#8B5CF6', subtitle: 'Welcome!' },
    about: { title: 'About Page', color: '#EC4899', subtitle: 'Learn More' },
    contact: { title: 'Contact Page', color: '#10B981', subtitle: 'Get in Touch' },
  };

  return (
    <div className="min-h-screen bg-bg-main">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-bg-surface border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex gap-4 items-center justify-center">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'about'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setCurrentPage('contact')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'contact'
                  ? 'bg-primary text-text'
                  : 'bg-bg-main text-text-muted hover:text-text'
              }`}
            >
              Contact
            </button>
          </div>
          <div className="text-center mt-2 text-sm text-text-muted">
            Navigate between pages to see callback logs below
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 flex">
        {/* Page Content */}
        <div className="flex-1">
          <MemoryRouter key={currentPage}>
            <PageTransition
              transition="slideRight"
              onAnimationStart={() => addLog('🎬 Animation started')}
              onAnimationComplete={() => addLog('✅ Animation completed')}
              onExitComplete={() => addLog('👋 Exit complete')}
            >
              <DemoPage {...pages[currentPage]} />
            </PageTransition>
          </MemoryRouter>
        </div>

        {/* Callback Log Panel */}
        <div className="w-80 bg-bg-surface border-l border-border p-4 overflow-y-auto max-h-screen">
          <div className="space-y-2">
            <h3 className="text-lg font-display font-bold text-text mb-4">
              Animation Callback Log
            </h3>
            {logs.length === 0 && (
              <p className="text-sm text-text-muted italic">
                Navigate between pages to see callbacks...
              </p>
            )}
            {logs.map((log, index) => (
              <div
                key={index}
                className="text-sm font-mono text-text-muted bg-bg-main p-2 rounded border border-border"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * With Animation Callbacks
 *
 * Demonstrates the callback functionality of PageTransition.
 * Open the browser console to see callback logs.
 */
export const WithCallbacks: Story = {
  render: () => <CallbacksDemo />,
  parameters: {
    layout: 'fullscreen',
  },
};
