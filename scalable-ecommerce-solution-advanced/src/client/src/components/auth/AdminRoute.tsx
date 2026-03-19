import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center py-8">Loading authentication...</div>;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but not admin, redirect to home or a forbidden page
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />; // Or to a /forbidden page
  }

  // If authenticated and admin, render the child routes
  return <Outlet />;
};

export default AdminRoute;