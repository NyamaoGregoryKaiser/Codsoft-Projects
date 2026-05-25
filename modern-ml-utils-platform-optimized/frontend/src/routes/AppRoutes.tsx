import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

import LoginPage from '@pages/Auth/LoginPage';
import RegisterPage from '@pages/Auth/RegisterPage';
import DashboardPage from '@pages/DashboardPage';
import DatasetsPage from '@pages/Datasets/DatasetsPage';
import DatasetDetailPage from '@pages/Datasets/DatasetDetailPage';
import DataUtilitiesPage from '@pages/DataUtilities/DataUtilitiesPage';
import NotFoundPage from '@pages/NotFoundPage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/datasets"
        element={
          <PrivateRoute>
            <DatasetsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/datasets/:id"
        element={
          <PrivateRoute>
            <DatasetDetailPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/utilities"
        element={
          <PrivateRoute>
            <DataUtilitiesPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;