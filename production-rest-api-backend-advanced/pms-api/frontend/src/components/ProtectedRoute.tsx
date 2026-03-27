import React from 'react';
import { Navigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'member';
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  user: User | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, user }) => {
  if (!user) {
    // Redirect to the login page if not authenticated
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;