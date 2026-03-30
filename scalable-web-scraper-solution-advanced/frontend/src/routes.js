import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ScrapersPage from './pages/ScrapersPage';
import ScrapedDataPage from './pages/ScrapedDataPage';
import UsersPage from './pages/UsersPage';
import { useAuth } from './hooks/useAuth';

const PrivateRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center p-4">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <div className="text-center p-4 text-red-600">Access Denied: You do not have the necessary permissions.</div>;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/scrapers" element={<PrivateRoute><ScrapersPage /></PrivateRoute>} />
      <Route path="/data" element={<PrivateRoute><ScrapedDataPage /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute roles={['admin']}><UsersPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;