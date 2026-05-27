```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check for role-based authorization if roles are specified
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="text-red-500 text-center mt-8">
        You do not have permission to view this page.
      </div>
    );
  }

  return children;
};

export default PrivateRoute;
```