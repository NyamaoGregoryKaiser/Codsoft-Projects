```jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the allowed roles
  const hasRequiredRole = allowedRoles.some(role => user.roles.includes(role));

  if (hasRequiredRole) {
    // User is logged in and has an allowed role, render the child routes
    return <Outlet />;
  } else {
    // User is logged in but does not have the required role, redirect to unauthorized page or dashboard
    return <Navigate to="/dashboard" replace />; // Or a dedicated /unauthorized page
  }
};

export default PrivateRoute;
```