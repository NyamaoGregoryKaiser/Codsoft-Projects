```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function PrivateRoute({ children, roles = [] }) {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner/loader component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !hasRole(roles)) {
    return <h1>403 - Forbidden: You do not have permission to view this page.</h1>;
  }

  return children;
}

export default PrivateRoute;
```