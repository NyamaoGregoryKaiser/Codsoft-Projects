```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardsPage from './pages/DashboardsPage';
import DataSourcesPage from './pages/DataSourcesPage';
import VisualizationsPage from './pages/VisualizationsPage';
import DashboardBuilderPage from './pages/DashboardBuilderPage'; // For creating/editing dashboards

// A private route component
const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a proper loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.some(role => user?.roles?.includes(role))) {
    return <Navigate to="/" replace />; // Or an unauthorized page
  }

  return children;
};


function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/data-sources"
            element={
              <PrivateRoute roles={['editor', 'admin']}>
                <DataSourcesPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/visualizations"
            element={
              <PrivateRoute roles={['editor', 'admin']}>
                <VisualizationsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboards"
            element={
              <PrivateRoute> {/* All authenticated users can view their dashboards */}
                <DashboardsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboards/create"
            element={
              <PrivateRoute roles={['editor', 'admin']}>
                <DashboardBuilderPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboards/edit/:id"
            element={
              <PrivateRoute roles={['editor', 'admin']}>
                <DashboardBuilderPage />
              </PrivateRoute>
            }
          />
          {/* Public dashboard view - no auth required */}
          <Route path="/dashboards/public/:id" element={<DashboardBuilderPage isPublic={true} />} />

          {/* Fallback for unknown routes */}
          <Route path="*" element={<p>Page Not Found</p>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
```