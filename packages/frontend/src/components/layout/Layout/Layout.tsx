/**
 * Layout Component
 *
 * Main layout wrapper for all pages in the application.
 * Provides consistent structure with header, footer, and content area.
 *
 * Features:
 * - Responsive header with navigation and wallet connection
 * - Optional footer
 * - Configurable max-width and padding for content
 * - Retro arcade theme styling
 *
 * @example
 * // Basic usage
 * <Layout>
 *   <YourPageContent />
 * </Layout>
 *
 * @example
 * // With custom options
 * <Layout
 *   showBalance
 *   maxWidth="xl"
 *   contentPadding={false}
 * >
 *   <YourPageContent />
 * </Layout>
 *
 * @example
 * // Without header or footer
 * <Layout showHeader={false} showFooter={false}>
 *   <FullScreenGame />
 * </Layout>
 */

import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BackgroundEffects, NoiseOverlay } from '@/components/layout/BackgroundEffects';
import type { LayoutProps } from './Layout.types';

/**
 * Map max-width prop to Tailwind classes
 */
const maxWidthClasses = {
  sm: 'max-w-screen-sm', // 640px
  md: 'max-w-screen-md', // 768px
  lg: 'max-w-screen-lg', // 1024px
  xl: 'max-w-screen-xl', // 1280px
  '2xl': 'max-w-screen-2xl', // 1536px
  full: 'max-w-full', // No constraint
} as const;

/**
 * Layout Component
 */
export function Layout({
  children,
  className,
  showHeader = true,
  showFooter = true,
  showBalance = false,
  customHeader,
  customFooter,
  maxWidth = 'full',
  contentPadding = true,
  showBackgroundEffects = true,
  glowIntensity = 'medium',
  showNoiseOverlay = true,
  noiseIntensity = 0.08,
}: LayoutProps) {
  return (
    <div
      className={cn(
        // Full height layout
        'min-h-screen',
        'flex flex-col',
        // Retro arcade theme background
        'bg-[#0a0a0a]',
        'text-white',
        // Ensure content is above background effects
        'relative'
      )}
    >
      {/* Background Effects - positioned behind all content */}
      {showBackgroundEffects && <BackgroundEffects glowIntensity={glowIntensity} />}

      {/* Noise/Grain Overlay */}
      {showNoiseOverlay && <NoiseOverlay intensity={noiseIntensity} />}

      {/* Header */}
      {showHeader && (customHeader || <Header showBalance={showBalance} />)}

      {/* Main Content Area */}
      <main
        className={cn(
          // Flex grow to push footer to bottom
          'flex-1',
          // Center content horizontally with max-width
          'w-full',
          maxWidthClasses[maxWidth],
          'mx-auto',
          // Content padding
          contentPadding && 'px-4 py-8',
          // Ensure content is above background effects
          'relative z-10',
          // Custom classes
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && (customFooter || <Footer />)}
    </div>
  );
}

Layout.displayName = 'Layout';

export default Layout;
