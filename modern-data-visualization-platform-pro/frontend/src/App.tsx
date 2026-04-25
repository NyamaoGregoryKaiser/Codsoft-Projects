import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import theme from './styles/theme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardListPage from './pages/DashboardListPage';
import DashboardDetailPage from './pages/DashboardDetailPage';
import DatasetListPage from './pages/DatasetListPage';
import VisualizationBuilderPage from './pages/VisualizationBuilderPage';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/MainLayout';

/**
 * Main application component responsible for routing and global context providers.
 */
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Provides a consistent baseline for CSS */}
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

/**
 * Defines the application's routes. Wrapped in a component to use `useAuth`.
 */
function AppRoutes() {
  const { isAuthenticated, loading, checkAuth } = useAuth();

  useEffect(() => {
    checkAuth(); // Check authentication status on app load
  }, [checkAuth]);

  if (loading) {
    // Show a loading spinner or splash screen while checking auth
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading Application...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboards" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboards" /> : <RegisterPage />} />

      {/* Private Routes requiring authentication */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DataProvider>
              <MainLayout />
            </DataProvider>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboards" />} />
        <Route path="dashboards" element={<DashboardListPage />} />
        <Route path="dashboards/:id" element={<DashboardDetailPage />} />
        <Route path="datasets" element={<DatasetListPage />} />
        <Route path="visualizations/new" element={<VisualizationBuilderPage />} />
        <Route path="visualizations/edit/:id" element={<VisualizationBuilderPage />} />
        {/* Add more private routes here */}
      </Route>

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboards" : "/login"} />} />
    </Routes>
  );
}

export default App;