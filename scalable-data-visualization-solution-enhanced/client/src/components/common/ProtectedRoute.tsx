```typescript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  // You can add roles here if needed for more granular protection
  // roles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ /* roles */ }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />; // Show a loading spinner while auth status is being determined
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // TODO: Implement role-based authorization if roles prop is used
  // if (roles && user && !roles.includes(user.role)) {
  //   return <Navigate to="/unauthorized" replace />; // Redirect to an unauthorized page
  // }

  return <Outlet />;
};

export default ProtectedRoute;
```