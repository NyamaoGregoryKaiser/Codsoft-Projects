import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Scrapers } from './pages/Scrapers';
import { ScraperDetail } from './pages/ScraperDetail';
import { Jobs } from './pages/Jobs';
import { Results } from './pages/Results';

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center py-8">Loading authentication...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><Scrapers /></PrivateRoute>} />
            <Route path="/scrapers" element={<PrivateRoute><Scrapers /></PrivateRoute>} />
            <Route path="/scrapers/:id" element={<PrivateRoute><ScraperDetail /></PrivateRoute>} />
            <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
            <Route path="/jobs/:jobId/results" element={<PrivateRoute><Results /></PrivateRoute>} />
            <Route path="/scrapers/:scraperId/results" element={<PrivateRoute><Results /></PrivateRoute>} />
            {/* Additional routes for users, dashboard, etc. */}
            <Route path="*" element={<p>404 Not Found</p>} /> {/* Catch-all for undefined routes */}
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
};
```
---