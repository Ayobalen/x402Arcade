import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { PageTransition } from '@/components/transitions';
import { ProtectedRoute } from '@/components/guards';
import { Home } from '@/pages/Home';
import { Play } from '@/pages/Play';
import { Game } from '@/pages/Game';
import { Leaderboard } from '@/pages/Leaderboard';
import { NotFound } from '@/pages/NotFound';

/**
 * AnimatedRoutes Component
 *
 * Renders routes with PageTransition wrapper for smooth animations.
 * PageTransition component handles AnimatePresence internally.
 */
function AnimatedRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageTransition>
            <Home />
          </PageTransition>
        }
      />
      <Route
        path="/play"
        element={
          <PageTransition>
            <Play />
          </PageTransition>
        }
      />
      <Route
        path="/play/:gameId"
        element={
          <ProtectedRoute>
            <PageTransition transition="zoom">
              <Game />
            </PageTransition>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <PageTransition>
            <Leaderboard />
          </PageTransition>
        }
      />
      {/* Catch-all route for 404 */}
      <Route
        path="*"
        element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        }
      />
    </Routes>
  );
}

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
