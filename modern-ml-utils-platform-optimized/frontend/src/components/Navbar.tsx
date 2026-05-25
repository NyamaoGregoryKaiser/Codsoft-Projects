import { Box, Flex, HStack, Button, Text, useColorModeValue, Link } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const bg = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('gray.600', 'white');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg={bg} px={4} borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')}>
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <HStack spacing={8} alignItems={'center'}>
          <Text as={RouterLink} to="/" fontSize="xl" fontWeight="bold" color="brand.700">
            ML Utilities Hub
          </Text>
          {user && (
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              <Link as={RouterLink} to="/datasets" color={color} _hover={{ textDecoration: 'none', color: 'brand.600' }}>
                Datasets
              </Link>
              <Link as={RouterLink} to="/utilities" color={color} _hover={{ textDecoration: 'none', color: 'brand.600' }}>
                Data Utilities
              </Link>
            </HStack>
          )}
        </HStack>
        <Flex alignItems={'center'}>
          {user ? (
            <HStack spacing={3}>
              <Text color={color}>Welcome, {user.firstName || user.email}!</Text>
              <Button onClick={handleLogout} colorScheme="red" size="sm">
                Logout
              </Button>
            </HStack>
          ) : (
            <HStack spacing={3}>
              <Button as={RouterLink} to="/login" colorScheme="blue" size="sm">
                Login
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="purple" size="sm" variant="outline">
                Register
              </Button>
            </HStack>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;