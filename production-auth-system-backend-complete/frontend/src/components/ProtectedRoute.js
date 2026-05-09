import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if the user has any of them
  if (roles.length > 0 && !hasRole(roles)) {
    // If user is authenticated but doesn't have required role, redirect to dashboard or 403 page
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
```