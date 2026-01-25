import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/transitions';
import { ProtectedRoute } from '@/components/guards';
import {
  HomePageSkeleton,
  PlayPageSkeleton,
  GamePageSkeleton,
  LeaderboardPageSkeleton,
  NotFoundPageSkeleton,
} from '@/components/ui/PageSkeleton';

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Layout showBalance maxWidth="full">
        <AnimatedRoutes />
      </Layout>
    </Router>
  );
}

export default App;
