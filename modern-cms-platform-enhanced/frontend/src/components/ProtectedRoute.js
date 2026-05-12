```javascript
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Spinner from './Spinner'; // A simple loading spinner component

const ProtectedRoute = ({ roles }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />; // Or render an Unauthorized component
  }

  return <Outlet />;
};

export default ProtectedRoute;
```