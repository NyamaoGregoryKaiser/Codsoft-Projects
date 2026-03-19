```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// A specific route for admin roles, leveraging PrivateRoute
function AdminRoute({ children }) {
  const { isAuthenticated, loading, isAdmin } = useAuth();

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner/loader component
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <h1>403 - Forbidden: You must be an administrator to view this page.</h1>;
  }

  return children;
}

export default AdminRoute;
```