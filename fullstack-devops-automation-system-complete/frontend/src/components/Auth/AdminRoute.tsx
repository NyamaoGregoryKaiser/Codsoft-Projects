```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== UserRole.ADMIN) {
    // Authenticated but not an ADMIN, redirect to home or show unauthorized message
    // You might want a dedicated 403 page here
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
```