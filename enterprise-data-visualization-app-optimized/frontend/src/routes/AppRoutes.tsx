```typescript
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import HomePage from '../pages/HomePage';
import DashboardsPage from '../pages/DashboardsPage';
import DashboardEditorPage from '../pages/DashboardEditorPage';
import DataSourcesPage from '../pages/DataSourcesPage';
import VisualizationEditorPage from '../pages/VisualizationEditorPage';
import UserProfilePage from '../pages/UserProfilePage';
import NotFoundPage from '../pages/NotFoundPage';

interface ProtectedRouteProps {
  children: React.ReactElement;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-lg">
        Loading authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && (!user || !user.is_admin)) {
    return <Navigate to="/403" replace />; // Redirect to a Forbidden page
  }

  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/403" element={<div className="flex items-center justify-center h-full text-xl text-red-500">403 - Forbidden</div>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/dashboards" element={<ProtectedRoute><DashboardsPage /></ProtectedRoute>} />
      <Route path="/dashboards/new" element={<ProtectedRoute><DashboardEditorPage /></ProtectedRoute>} />
      <Route path="/dashboards/edit/:id" element={<ProtectedRoute><DashboardEditorPage /></ProtectedRoute>} />
      <Route path="/datasources" element={<ProtectedRoute><DataSourcesPage /></ProtectedRoute>} />
      <Route path="/visualizations/new" element={<ProtectedRoute><VisualizationEditorPage /></ProtectedRoute>} />
      <Route path="/visualizations/edit/:id" element={<ProtectedRoute><VisualizationEditorPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

      {/* Admin-only routes */}
      {/* <Route path="/admin/users" element={<ProtectedRoute adminOnly><AdminUsersPage /></ProtectedRoute>} /> */}

      {/* Catch-all for unknown routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
```