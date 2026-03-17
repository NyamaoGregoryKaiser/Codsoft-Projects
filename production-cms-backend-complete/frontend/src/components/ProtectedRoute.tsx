import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user, isAdmin, isEditor, isViewer } = useAuth();

  if (loading) {
    return <div className="text-center mt-8">Loading user data...</div>; // Or a proper spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // For more granular role checks
      let authorized = false;
      if (allowedRoles.includes(UserRole.ADMIN) && isAdmin) authorized = true;
      if (allowedRoles.includes(UserRole.EDITOR) && isEditor) authorized = true;
      if (allowedRoles.includes(UserRole.VIEWER) && isViewer) authorized = true;

      if (!authorized) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;