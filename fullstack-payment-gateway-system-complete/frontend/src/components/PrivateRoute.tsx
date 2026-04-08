import React, { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import LoadingSpinner from './LoadingSpinner';
import { Box, Heading, Text } from '@chakra-ui/react';

interface PrivateRouteProps {
  element: ReactElement;
  roles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, roles }) => {
  const { isAuthenticated, loading, hasRole, user } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return (
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md" mt={10} textAlign="center">
        <Heading fontSize="xl">Access Denied</Heading>
        <Text mt={4}>You do not have permission to view this page.</Text>
        <Text mt={2} fontSize="sm" color="gray.500">
          Your role: {user?.role || 'N/A'}
        </Text>
        <Text mt={2} fontSize="sm" color="gray.500">
          Required roles: {roles.join(', ')}
        </Text>
      </Box>
    );
  }

  return element;
};

export default PrivateRoute;