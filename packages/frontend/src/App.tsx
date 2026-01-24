import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';

function App() {
  return (
    <Router>
      <Layout showBalance maxWidth="full">
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Additional routes will be added here */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
