import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner, Center } from '@chakra-ui/react';

const RequireAuth = ({ allowedRoles }) => {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  const userRoles = [];
  if (isStaff) userRoles.push('staff');
  if (isAdmin) userRoles.push('admin');
  if (user) userRoles.push('authenticated');

  const hasRequiredRole = allowedRoles ? allowedRoles.some(role => userRoles.includes(role)) : true;

  return user && hasRequiredRole ? (
    <Outlet />
  ) : user ? (
    // User is authenticated but doesn't have the required role
    <Navigate to="/unauthorized" state={{ from: location }} replace />
  ) : (
    // User is not authenticated
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequireAuth;
```

#### `frontend/src/components/Layout/AdminLayout.js`

```javascript