import React from 'react';
import { Flex, Button, Text, Heading, Spacer, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('brand.500', 'brand.800');
  const color = useColorModeValue('white', 'gray.100');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Flex
      as="header"
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="sticky"
      bg={bg}
      color={color}
      p={4}
      align="center"
      justify="space-between"
      pl={{ base: 4, md: '216px' }} // Account for sidebar width + padding
      boxShadow="sm"
    >
      <Heading as="h1" size="md">
        <RouterLink to="/">DataViz Pro</RouterLink>
      </Heading>
      <Spacer />
      {user && (
        <Text mr={4}>
          Welcome, <Text as="span" fontWeight="bold">{user.username || user.email}</Text> ({user.role})
        </Text>
      )}
      <Button colorScheme="red" onClick={handleLogout}>
        Logout
      </Button>
    </Flex>
  );
}

export default Header;