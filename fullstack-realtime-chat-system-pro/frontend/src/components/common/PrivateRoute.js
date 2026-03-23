import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;