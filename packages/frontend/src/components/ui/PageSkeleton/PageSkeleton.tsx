/**
 * PageSkeleton Component
 *
 * Loading skeletons for different pages while they're being lazy-loaded.
 * Designed to match the visual structure of each page to minimize layout shift.
 *
 * Features:
 * - Page-specific skeletons (Home, Play, Game, Leaderboard, NotFound)
 * - Retro arcade theme with animated pulse effects
 * - Matches the layout structure of actual pages
 * - Accessible with reduced motion support
 */

import { cn } from '@/lib/utils';

/**
 * Base skeleton element with pulsing animation
 */
function SkeletonPulse({
  className,
  'aria-label': ariaLabel,
}: {
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      className={cn(
        'bg-[#1a1a2e] rounded-lg',
        'animate-pulse',
        'motion-reduce:animate-none motion-reduce:opacity-70',
        className
      )}
      aria-label={ariaLabel}
      role="presentation"
    />
  );
}

/**
 * Generic page loading skeleton
 * Used as fallback when page-specific skeleton is not available
 */
export function GenericPageSkeleton() {
  return (
    <div
      className="w-full min-h-screen py-8 px-4"
      role="progressbar"
      aria-label="Loading page..."
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="max-w-6xl mx-auto">
        <SkeletonPulse className="h-12 w-64 mb-8" aria-label="Loading title" />

        {/* Content skeleton */}
        <div className="grid gap-6">
          <SkeletonPulse className="h-48 w-full" aria-label="Loading content block" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonPulse className="h-32" />
            <SkeletonPulse className="h-32" />
            <SkeletonPulse className="h-32" />
          </div>
          <SkeletonPulse className="h-24 w-full" aria-label="Loading footer" />
        </div>
      </div>
    </div>
  );
}

GenericPageSkeleton.displayName = 'GenericPageSkeleton';

/**
 * Home page loading skeleton
 * Matches the hero section + features layout of Home.tsx
 */
export function HomePageSkeleton() {
  return (
    <div
      className="w-full min-h-screen"
      role="progressbar"
      aria-label="Loading home page..."
      aria-busy="true"
    >
      {/* Hero Section skeleton */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge skeleton */}
          <SkeletonPulse
            className="h-8 w-48 mx-auto mb-8 rounded-full"
            aria-label="Loading badge"
          />

          {/* Headline skeleton */}
          <SkeletonPulse className="h-20 w-full mb-4" aria-label="Loading headline" />
          <SkeletonPulse className="h-20 w-3/4 mx-auto mb-6" />

          {/* Tagline skeleton */}
          <SkeletonPulse className="h-8 w-2/3 mx-auto mb-4" aria-label="Loading tagline" />
          <SkeletonPulse className="h-6 w-1/2 mx-auto mb-12" />

          {/* CTA buttons skeleton */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <SkeletonPulse className="h-14 w-48 rounded-lg" aria-label="Loading button" />
            <SkeletonPulse className="h-14 w-48 rounded-lg" />
          </div>
        </div>
      </section>

      {/* Features Section skeleton */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section title */}
          <SkeletonPulse className="h-10 w-72 mx-auto mb-12" aria-label="Loading section title" />

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-xl bg-[#16162a] border border-[#2d2d4a]">
                <SkeletonPulse className="h-12 w-12 rounded-lg mb-4" />
                <SkeletonPulse className="h-6 w-32 mb-2" />
                <SkeletonPulse className="h-16 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

HomePageSkeleton.displayName = 'HomePageSkeleton';

/**
 * Play (Game Lobby) page loading skeleton
 * Matches the game selection grid layout
 */
export function PlayPageSkeleton() {
  return (
    <div
      className="w-full min-h-screen py-8 px-4"
      role="progressbar"
      aria-label="Loading games page..."
      aria-busy="true"
    >
      <div className="max-w-6xl mx-auto">
        {/* Page title */}
        <SkeletonPulse className="h-10 w-48 mb-8" aria-label="Loading page title" />

        {/* Game cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-[#16162a] border border-[#2d2d4a]">
              {/* Game thumbnail skeleton */}
              <SkeletonPulse
                className="aspect-video rounded-lg mb-4"
                aria-label="Loading game thumbnail"
              />
              {/* Game title */}
              <SkeletonPulse className="h-6 w-32 mb-2" />
              {/* Game description */}
              <SkeletonPulse className="h-12 w-full mb-4" />
              {/* Price and status */}
              <div className="flex justify-between">
                <SkeletonPulse className="h-5 w-24" />
                <SkeletonPulse className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

PlayPageSkeleton.displayName = 'PlayPageSkeleton';

/**
 * Game page loading skeleton
 * Shows a centered loading state for the game canvas
 */
export function GamePageSkeleton() {
  return (
    <div
      className="w-full min-h-screen flex flex-col items-center justify-center py-8 px-4"
      role="progressbar"
      aria-label="Loading game..."
      aria-busy="true"
    >
      <div className="max-w-2xl w-full">
        {/* Game header skeleton */}
        <div className="flex justify-between items-center mb-6">
          <SkeletonPulse className="h-8 w-32" aria-label="Loading game title" />
          <SkeletonPulse className="h-8 w-24" aria-label="Loading score" />
        </div>

        {/* Game canvas skeleton - 4:3 aspect ratio */}
        <div className="relative">
          <SkeletonPulse
            className="w-full aspect-[4/3] rounded-xl border-4 border-[#2d2d4a]"
            aria-label="Loading game canvas"
          />

          {/* Centered loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              {/* Animated loading dots */}
              <div className="flex gap-2 justify-center mb-4">
                <div
                  className="w-3 h-3 rounded-full bg-[#00ffff] animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-3 h-3 rounded-full bg-[#ff00ff] animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-3 h-3 rounded-full bg-[#00ffff] animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <p className="text-white/60 text-sm">Loading game...</p>
            </div>
          </div>
        </div>

        {/* Controls hint skeleton */}
        <SkeletonPulse className="h-6 w-64 mx-auto mt-6" aria-label="Loading controls hint" />
      </div>
    </div>
  );
}

GamePageSkeleton.displayName = 'GamePageSkeleton';

/**
 * Leaderboard page loading skeleton
 * Matches the leaderboard table layout
 */
export function LeaderboardPageSkeleton() {
  return (
    <div
      className="w-full min-h-screen py-8 px-4"
      role="progressbar"
      aria-label="Loading leaderboard..."
      aria-busy="true"
    >
      <div className="max-w-4xl mx-auto">
        {/* Page title */}
        <SkeletonPulse className="h-10 w-48 mb-4" aria-label="Loading page title" />

        {/* Subtitle */}
        <SkeletonPulse className="h-6 w-72 mb-8" />

        {/* Tab buttons skeleton */}
        <div className="flex gap-4 mb-6">
          <SkeletonPulse className="h-10 w-24 rounded-lg" />
          <SkeletonPulse className="h-10 w-24 rounded-lg" />
          <SkeletonPulse className="h-10 w-24 rounded-lg" />
        </div>

        {/* Leaderboard table skeleton */}
        <div className="rounded-xl bg-[#16162a] border border-[#2d2d4a] overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 p-4 border-b border-[#2d2d4a]">
            <SkeletonPulse className="h-5 w-12" />
            <SkeletonPulse className="h-5 w-32" />
            <SkeletonPulse className="h-5 w-24 ml-auto" />
          </div>

          {/* Table rows */}
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 border-b border-[#2d2d4a] last:border-b-0"
            >
              {/* Rank */}
              <SkeletonPulse className="h-8 w-8 rounded-full" />
              {/* Address */}
              <SkeletonPulse className="h-6 w-40" />
              {/* Score */}
              <SkeletonPulse className="h-6 w-20 ml-auto" />
            </div>
          ))}
        </div>

        {/* Prize pool info skeleton */}
        <div className="mt-8 p-6 rounded-xl bg-[#16162a] border border-[#2d2d4a]">
          <SkeletonPulse className="h-6 w-32 mb-4" />
          <SkeletonPulse className="h-10 w-48" />
        </div>
      </div>
    </div>
  );
}

LeaderboardPageSkeleton.displayName = 'LeaderboardPageSkeleton';

/**
 * NotFound page skeleton - minimal since it's a simple error page
 */
export function NotFoundPageSkeleton() {
  return (
    <div
      className="w-full min-h-screen flex items-center justify-center py-8 px-4"
      role="progressbar"
      aria-label="Loading page..."
      aria-busy="true"
    >
      <div className="text-center">
        <SkeletonPulse className="h-24 w-32 mx-auto mb-6" />
        <SkeletonPulse className="h-8 w-48 mx-auto mb-4" />
        <SkeletonPulse className="h-6 w-64 mx-auto mb-8" />
        <SkeletonPulse className="h-12 w-40 mx-auto rounded-lg" />
      </div>
    </div>
  );
}

NotFoundPageSkeleton.displayName = 'NotFoundPageSkeleton';

/**
 * Unified PageSkeleton component with variant selection
 */
export type PageSkeletonVariant = 'generic' | 'home' | 'play' | 'game' | 'leaderboard' | 'notfound';

export interface PageSkeletonProps {
  /** Which page skeleton to display */
  variant?: PageSkeletonVariant;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PageSkeleton - Unified loading skeleton component
 *
 * @example
 * // Default generic skeleton
 * <PageSkeleton />
 *
 * @example
 * // Page-specific skeleton
 * <PageSkeleton variant="home" />
 * <PageSkeleton variant="game" />
 */
export function PageSkeleton({ variant = 'generic', className }: PageSkeletonProps) {
  const skeletonComponents: Record<PageSkeletonVariant, React.ComponentType> = {
    generic: GenericPageSkeleton,
    home: HomePageSkeleton,
    play: PlayPageSkeleton,
    game: GamePageSkeleton,
    leaderboard: LeaderboardPageSkeleton,
    notfound: NotFoundPageSkeleton,
  };

  const SkeletonComponent = skeletonComponents[variant];

  return (
    <div className={className}>
      <SkeletonComponent />
    </div>
  );
}

PageSkeleton.displayName = 'PageSkeleton';

export default PageSkeleton;
