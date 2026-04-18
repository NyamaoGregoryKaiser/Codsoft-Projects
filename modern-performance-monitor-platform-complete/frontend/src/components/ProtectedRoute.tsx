```typescript jsx
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If user is authenticated but not authorized for this role
    return <Navigate to="/dashboard" replace />; // Redirect to dashboard or an unauthorized page
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```