```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';
import { toast } from 'react-toastify';

const PrivateRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    toast.error("You need to be logged in to access this page.");
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    // Check if the user has at least one of the required roles
    const hasRequiredRole = roles.includes('admin') ? user.is_admin : false;
    
    if (!hasRequiredRole) {
      toast.error("You do not have permission to view this page.");
      return <Navigate to="/" replace />; // Redirect to dashboard or a forbidden page
    }
  }

  return children;
};

export default PrivateRoute;
```