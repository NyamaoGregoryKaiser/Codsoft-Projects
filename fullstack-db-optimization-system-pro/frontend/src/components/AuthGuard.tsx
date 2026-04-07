import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[]; // Optional: for route-specific role checks
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        <p className="ml-4 text-xl">Loading authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to the login page
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has one of the allowed roles
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Optionally, redirect to a forbidden page or dashboard
    return (
      <div className="flex items-center justify-center h-screen bg-red-100 text-red-700 text-xl font-bold">
        Access Denied: You do not have the required permissions.
        <Navigate to="/dashboard" replace /> {/* Redirect to dashboard */}
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;