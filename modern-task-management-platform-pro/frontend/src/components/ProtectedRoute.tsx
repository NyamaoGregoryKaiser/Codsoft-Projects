```typescript
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // Optional: restrict access based on user role
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Optionally show a "Not Authorized" page or redirect to dashboard
    return <Navigate to="/dashboard" replace state={{ from: 'unauthorized' }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
```