import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
 * Handles route transitions with AnimatePresence.
 * Must be separate component to access useLocation hook.
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
              <PageTransition>
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
    </AnimatePresence>
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
