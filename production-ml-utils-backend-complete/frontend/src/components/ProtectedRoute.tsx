import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Flex, Spinner } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex height="100vh" align="center" justify="center">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```