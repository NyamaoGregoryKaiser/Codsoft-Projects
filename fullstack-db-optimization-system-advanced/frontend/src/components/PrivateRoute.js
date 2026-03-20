import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />; // Redirect unauthorized users
  }

  return <Outlet />;
};

export default PrivateRoute;
```

#### `frontend/src/components/Navbar.js`
```javascript