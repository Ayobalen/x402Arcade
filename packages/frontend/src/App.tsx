import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Play } from '@/pages/Play';
import { Leaderboard } from '@/pages/Leaderboard';

function App() {
  return (
    <Router>
      <Layout showBalance maxWidth="full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          {/* Additional routes will be added here */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
