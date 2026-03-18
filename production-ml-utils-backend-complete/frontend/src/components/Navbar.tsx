import React from 'react';
import { Box, Flex, Button, Heading, Spacer, Link, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg="brand.700" px={4} py={3} color="white">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Heading as="h1" size="lg" letterSpacing="tight">
          <Link as={RouterLink} to="/">ML Utilities</Link>
        </Heading>
        <Spacer />
        <Flex alignItems="center">
          {isAuthenticated ? (
            <>
              <Link as={RouterLink} to="/models" p={2} _hover={{ textDecoration: 'none', bg: 'brand.600' }} borderRadius="md">
                Models
              </Link>
              <Link as={RouterLink} to="/transforms" p={2} ml={4} _hover={{ textDecoration: 'none', bg: 'brand.600' }} borderRadius="md">
                Transforms
              </Link>
              <Box ml={6} mr={2}>
                Hi, {user?.username || 'User'}
              </Box>
              <Button colorScheme="red" variant="solid" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={RouterLink} to="/login" colorScheme="brand" variant="outline" mr={4}>
                Login
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="brand" variant="solid">
                Register
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
```