/**
 * Page Transitions Storybook Stories
 *
 * Interactive demonstrations of all page transition variants.
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fadeTransition,
  fadeFastTransition,
  slideTransition,
  scaleTransition,
  slideScaleTransition,
  blurTransition,
  rotateTransition,
  zoomTransition,
  neonGlowTransition,
  PAGE_TRANSITION_PRESETS,
  type PageTransitionVariants,
  type SlideDirection,
  type ScaleDirection,
} from '../../lib/animations/pageTransitions';

/**
 * Page Transitions
 *
 * This story demonstrates all available page transition variants.
 * Use these transitions with AnimatePresence when changing routes or pages.
 */
const meta = {
  title: 'Animations/Page Transitions',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Page transition variants for smooth route changes. All transitions include initial, animate, and exit states for use with framer-motion AnimatePresence.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Demo Page Component
 */
interface DemoPageProps {
  variants: PageTransitionVariants;
  pageNumber: number;
  color: string;
  title: string;
}

const DemoPage: React.FC<DemoPageProps> = ({ variants, pageNumber, color, title }) => (
  <motion.div
    key={pageNumber}
    variants={variants}
    initial="initial"
    animate="animate"
    exit="exit"
    style={{
      width: '100%',
      height: '400px',
      background: color,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '12px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
    }}
  >
    <div style={{ fontSize: '96px', fontWeight: 'bold', marginBottom: '16px' }}>
      {pageNumber}
    </div>
    <div style={{ fontSize: '24px', opacity: 0.8 }}>{title}</div>
  </motion.div>
);

/**
 * Interactive Transition Demo
 */
interface TransitionDemoProps {
  variants: PageTransitionVariants;
  title: string;
}

const TransitionDemo: React.FC<TransitionDemoProps> = ({ variants, title }) => {
  const [pageIndex, setPageIndex] = useState(0);

  const pages = [
    { color: '#8B5CF6', title: 'Page One' },
    { color: '#EC4899', title: 'Page Two' },
    { color: '#F59E0B', title: 'Page Three' },
  ];

  const currentPage = pages[pageIndex % pages.length];

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '600px' }}>
      <h3 style={{ marginBottom: '16px', color: '#F8FAFC' }}>{title}</h3>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setPageIndex((prev) => prev + 1)}
          style={{
            padding: '12px 24px',
            background: '#8B5CF6',
            color: '#F8FAFC',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
          }}
        >
          Next Page
        </button>
      </div>
      <AnimatePresence mode="wait">
        <DemoPage
          variants={variants}
          pageNumber={pageIndex + 1}
          color={currentPage.color}
          title={currentPage.title}
        />
      </AnimatePresence>
    </div>
  );
};

/**
 * Fade Transition (Simple)
 *
 * Basic opacity fade in/out. 300ms duration with easeInOut timing.
 * Best for simple page changes and modals.
 */
export const Fade: Story = {
  render: () => <TransitionDemo variants={fadeTransition} title="Fade Transition" />,
};

/**
 * Fade Fast Transition
 *
 * Quick opacity fade (200ms). Best for rapid page changes.
 */
export const FadeFast: Story = {
  render: () => <TransitionDemo variants={fadeFastTransition} title="Fade Fast Transition" />,
};

/**
 * Slide Right Transition
 *
 * Slides in from the right, exits to the left. Best for forward navigation.
 */
export const SlideRight: Story = {
  render: () => (
    <TransitionDemo variants={slideTransition('right')} title="Slide Right Transition" />
  ),
};

/**
 * Slide Left Transition
 *
 * Slides in from the left, exits to the right. Best for backward navigation.
 */
export const SlideLeft: Story = {
  render: () => (
    <TransitionDemo variants={slideTransition('left')} title="Slide Left Transition" />
  ),
};

/**
 * Slide Up Transition
 *
 * Slides in from the top, exits to the bottom. Best for hierarchical navigation.
 */
export const SlideUp: Story = {
  render: () => <TransitionDemo variants={slideTransition('up')} title="Slide Up Transition" />,
};

/**
 * Slide Down Transition
 *
 * Slides in from the bottom, exits to the top. Best for modal sheets.
 */
export const SlideDown: Story = {
  render: () => (
    <TransitionDemo variants={slideTransition('down')} title="Slide Down Transition" />
  ),
};

/**
 * Scale Center Transition
 *
 * Scales from center point. Best for modal dialogs.
 */
export const ScaleCenter: Story = {
  render: () => (
    <TransitionDemo variants={scaleTransition('center')} title="Scale Center Transition" />
  ),
};

/**
 * Scale Bottom Transition
 *
 * Scales from bottom edge. Best for mobile bottom sheets.
 */
export const ScaleBottom: Story = {
  render: () => (
    <TransitionDemo variants={scaleTransition('bottom', 0.9)} title="Scale Bottom Transition" />
  ),
};

/**
 * Slide Scale Transition
 *
 * Combined slide and scale for dramatic effect. Best for game screens.
 */
export const SlideScale: Story = {
  render: () => (
    <TransitionDemo variants={slideScaleTransition()} title="Slide Scale Transition" />
  ),
};

/**
 * Blur Transition
 *
 * Fade with blur effect (Apple-style). Best for premium feel.
 */
export const Blur: Story = {
  render: () => <TransitionDemo variants={blurTransition()} title="Blur Transition" />,
};

/**
 * Rotate Y Transition
 *
 * 3D rotation on Y axis. Best for card flips and playful transitions.
 */
export const RotateY: Story = {
  render: () => <TransitionDemo variants={rotateTransition('y')} title="Rotate Y Transition" />,
};

/**
 * Rotate X Transition
 *
 * 3D rotation on X axis. Best for vertical card flips.
 */
export const RotateX: Story = {
  render: () => <TransitionDemo variants={rotateTransition('x')} title="Rotate X Transition" />,
};

/**
 * Zoom Transition
 *
 * Dramatic zoom in/out. Best for splash screens and level transitions.
 */
export const Zoom: Story = {
  render: () => <TransitionDemo variants={zoomTransition()} title="Zoom Transition" />,
};

/**
 * Neon Glow Transition
 *
 * Fade with brightness effect for retro arcade aesthetic.
 */
export const NeonGlow: Story = {
  render: () => <TransitionDemo variants={neonGlowTransition} title="Neon Glow Transition" />,
};

/**
 * All Presets Comparison Component
 */
const AllPresetsDemo: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const presets = [
    { name: 'Fade', variants: PAGE_TRANSITION_PRESETS.fade },
    { name: 'Fade Fast', variants: PAGE_TRANSITION_PRESETS.fadeFast },
    { name: 'Slide Right', variants: PAGE_TRANSITION_PRESETS.slideRight },
    { name: 'Slide Left', variants: PAGE_TRANSITION_PRESETS.slideLeft },
    { name: 'Scale Center', variants: PAGE_TRANSITION_PRESETS.scaleCenter },
    { name: 'Slide Scale', variants: PAGE_TRANSITION_PRESETS.slideScale },
    { name: 'Neon Glow', variants: PAGE_TRANSITION_PRESETS.neonGlow },
  ];

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px', color: '#F8FAFC' }}>All Page Transitions</h2>
      <button
        onClick={() => setPageIndex((prev) => prev + 1)}
        style={{
          padding: '12px 24px',
          background: '#8B5CF6',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '32px',
        }}
      >
        Change All Pages
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}
      >
        {presets.map((preset) => (
          <div key={preset.name}>
            <h4 style={{ marginBottom: '12px', color: '#F8FAFC' }}>{preset.name}</h4>
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIndex}
                variants={preset.variants}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  width: '100%',
                  height: '200px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '48px',
                  fontWeight: 'bold',
                }}
              >
                {pageIndex + 1}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * All Presets Comparison
 *
 * Side-by-side comparison of all transition presets.
 */
export const AllPresets: Story = {
  render: () => <AllPresetsDemo />,
};

/**
 * Custom Slide Distance Component
 */
const CustomSlideDistanceDemo: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '600px' }}>
      <h3 style={{ marginBottom: '16px', color: '#F8FAFC' }}>
        Custom Slide Distance (200px)
      </h3>
      <button
        onClick={() => setPageIndex((prev) => prev + 1)}
        style={{
          padding: '12px 24px',
          background: '#8B5CF6',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '24px',
        }}
      >
        Next Page
      </button>
      <AnimatePresence mode="wait">
        <DemoPage
          variants={slideTransition('right', 200)}
          pageNumber={pageIndex + 1}
          color="#8B5CF6"
          title="Large Distance"
        />
      </AnimatePresence>
    </div>
  );
};

/**
 * Custom Slide Distance
 *
 * Demonstrates custom slide distance parameter.
 */
export const CustomSlideDistance: Story = {
  render: () => <CustomSlideDistanceDemo />,
};

/**
 * Custom Blur Amount Component
 */
const CustomBlurAmountDemo: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '600px' }}>
      <h3 style={{ marginBottom: '16px', color: '#F8FAFC' }}>Custom Blur Amount (20px)</h3>
      <button
        onClick={() => setPageIndex((prev) => prev + 1)}
        style={{
          padding: '12px 24px',
          background: '#8B5CF6',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '24px',
        }}
      >
        Next Page
      </button>
      <AnimatePresence mode="wait">
        <DemoPage
          variants={blurTransition(20)}
          pageNumber={pageIndex + 1}
          color="#8B5CF6"
          title="Heavy Blur"
        />
      </AnimatePresence>
    </div>
  );
};

/**
 * Custom Blur Amount
 *
 * Demonstrates custom blur amount parameter.
 */
export const CustomBlurAmount: Story = {
  render: () => <CustomBlurAmountDemo />,
};

/**
 * Direction Comparison Component
 */
const DirectionComparisonDemo: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const directions: SlideDirection[] = ['left', 'right', 'up', 'down'];

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px', color: '#F8FAFC' }}>Slide Direction Comparison</h2>
      <button
        onClick={() => setPageIndex((prev) => prev + 1)}
        style={{
          padding: '12px 24px',
          background: '#8B5CF6',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '32px',
        }}
      >
        Change All Pages
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
        }}
      >
        {directions.map((direction) => (
          <div key={direction}>
            <h4 style={{ marginBottom: '12px', color: '#F8FAFC', textTransform: 'capitalize' }}>
              Slide {direction}
            </h4>
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIndex}
                variants={slideTransition(direction)}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  width: '100%',
                  height: '200px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '48px',
                  fontWeight: 'bold',
                }}
              >
                {pageIndex + 1}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Direction Comparison
 *
 * Side-by-side comparison of all slide directions.
 */
export const DirectionComparison: Story = {
  render: () => <DirectionComparisonDemo />,
};

/**
 * Scale Origin Comparison Component
 */
const ScaleOriginComparisonDemo: React.FC = () => {
  const [pageIndex, setPageIndex] = useState(0);

  const origins: ScaleDirection[] = ['center', 'top', 'bottom', 'left', 'right'];

  return (
    <div style={{ padding: '24px', background: '#0F0F1A', minHeight: '100vh' }}>
      <h2 style={{ marginBottom: '24px', color: '#F8FAFC' }}>Scale Origin Comparison</h2>
      <button
        onClick={() => setPageIndex((prev) => prev + 1)}
        style={{
          padding: '12px 24px',
          background: '#8B5CF6',
          color: '#F8FAFC',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '32px',
        }}
      >
        Change All Pages
      </button>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
        }}
      >
        {origins.map((origin) => (
          <div key={origin}>
            <h4 style={{ marginBottom: '12px', color: '#F8FAFC', textTransform: 'capitalize' }}>
              Scale from {origin}
            </h4>
            <AnimatePresence mode="wait">
              <motion.div
                key={pageIndex}
                variants={scaleTransition(origin)}
                initial="initial"
                animate="animate"
                exit="exit"
                style={{
                  width: '100%',
                  height: '200px',
                  background: '#8B5CF6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '48px',
                  fontWeight: 'bold',
                }}
              >
                {pageIndex + 1}
              </motion.div>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Scale Origin Comparison
 *
 * Side-by-side comparison of all scale origins.
 */
export const ScaleOriginComparison: Story = {
  render: () => <ScaleOriginComparisonDemo />,
};
