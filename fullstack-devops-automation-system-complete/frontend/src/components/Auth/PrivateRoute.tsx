```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[]; // Optional: specify roles allowed to access this route
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    // Authenticated, but user role is not allowed
    // Redirect to home or show an unauthorized message
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
```