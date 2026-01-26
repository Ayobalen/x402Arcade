import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from '@/config/wagmi';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/transitions';
import { ProtectedRoute } from '@/components/guards';
import {
  OnboardingFlow,
  HelpModal,
  GameTutorial,
  KeyboardShortcutsGuide,
} from '@/components/onboarding';
import {
  HomePageSkeleton,
  PlayPageSkeleton,
  GamePageSkeleton,
  LeaderboardPageSkeleton,
  NotFoundPageSkeleton,
} from '@/components/ui/PageSkeleton';

// Create QueryClient instance
const queryClient = new QueryClient();

/**
 * Lazy-loaded page components for code splitting.
 * Each page is loaded as a separate chunk, reducing initial bundle size.
 *
 * Webpack/Vite magic comments can be used for chunk naming:
 * - webpackChunkName: names the chunk for easier debugging
 * - webpackPrefetch: hints browser to prefetch in idle time
 */
const Home = lazy(() => import('@/pages/Home'));
const Play = lazy(() => import('@/pages/Play'));
const Game = lazy(() => import('@/pages/Game'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const Settings = lazy(() => import('@/pages/Settings'));
const ComponentShowcase = lazy(() => import('@/pages/ComponentShowcase'));
const NotFound = lazy(() => import('@/pages/NotFound'));

/**
 * Suspense wrapper for lazy-loaded pages.
 * Provides consistent loading states across all routes.
 */
function PageSuspense({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * AnimatedRoutes Component
 *
 * Renders routes with PageTransition wrapper for smooth animations.
 * Each route is wrapped with Suspense for lazy loading support.
 */
function AnimatedRoutes() {
  return (
    <Routes>
      {/* Home Page - Landing page with hero and features */}
      <Route
        path="/"
        element={
          <PageSuspense fallback={<HomePageSkeleton />}>
            <PageTransition>
              <Home />
            </PageTransition>
          </PageSuspense>
        }
      />

      {/* Play Page - Game selection lobby */}
      <Route
        path="/play"
        element={
          <PageSuspense fallback={<PlayPageSkeleton />}>
            <PageTransition>
              <Play />
            </PageTransition>
          </PageSuspense>
        }
      />

      {/* Game Page - Individual game with payment flow */}
      <Route
        path="/play/:gameId"
        element={
          <ProtectedRoute>
            <PageSuspense fallback={<GamePageSkeleton />}>
              <PageTransition transition="zoom">
                <Game />
              </PageTransition>
            </PageSuspense>
          </ProtectedRoute>
        }
      />

      {/* Leaderboard Page - Rankings and prize pool */}
      <Route
        path="/leaderboard"
        element={
          <PageSuspense fallback={<LeaderboardPageSkeleton />}>
            <PageTransition>
              <Leaderboard />
            </PageTransition>
          </PageSuspense>
        }
      />

      {/* Settings Page - User preferences and theme customization */}
      <Route
        path="/settings"
        element={
          <PageSuspense fallback={<HomePageSkeleton />}>
            <PageTransition>
              <Settings />
            </PageTransition>
          </PageSuspense>
        }
      />

      {/* Component Showcase - Extended component library demo */}
      <Route
        path="/components"
        element={
          <PageSuspense fallback={<HomePageSkeleton />}>
            <PageTransition>
              <ComponentShowcase />
            </PageTransition>
          </PageSuspense>
        }
      />

      {/* Catch-all route for 404 */}
      <Route
        path="*"
        element={
          <PageSuspense fallback={<NotFoundPageSkeleton />}>
            <PageTransition>
              <NotFound />
            </PageTransition>
          </PageSuspense>
        }
      />
    </Routes>
  );
}

/**
 * Main App Component
 *
 * Provides routing, layout, and lazy loading for the entire application.
 * Routes are code-split using React.lazy() for optimal bundle size.
 */
function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Layout showBalance maxWidth="full">
          <AnimatedRoutes />

          {/* Onboarding & Help Components */}
          <OnboardingFlow />
          <HelpModal />
          <GameTutorial />
          <KeyboardShortcutsGuide />
        </Layout>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
