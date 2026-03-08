import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    toast.error('You need to log in to access this page.');
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = user && user.roles.some(role => allowedRoles.includes(role));

  if (!hasRequiredRole) {
    toast.error('You do not have permission to access this page.');
    return <Navigate to="/dashboard" replace />; // Redirect to dashboard or another suitable page
  }

  return <Outlet />;
}

export default ProtectedRoute;
```