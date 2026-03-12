import React, { useState } from 'react';
import { Box, Button, FormControl, FormLabel, Input, Heading, Text, Link, VStack, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SITE_NAME } from '../../config';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userData = await login(email, password);
      toast({
        title: 'Login successful.',
        description: `Welcome, ${userData.first_name}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      toast({
        title: 'Login failed.',
        description: error.response?.data?.detail || 'Invalid credentials. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      _dark={{ bg: 'gray.900' }}
    >
      <Box
        p={8}
        maxWidth="md"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
        _dark={{ bg: 'gray.800' }}
        w="full"
      >
        <VStack spacing={4} align="stretch">
          <Heading as="h1" size="xl" textAlign="center" color="purple.500">
            {SITE_NAME}
          </Heading>
          <Text fontSize="lg" textAlign="center" mb={6} color="gray.600" _dark={{ color: 'gray.300' }}>
            Sign in to your account
          </Text>
          <form onSubmit={handleSubmit}>
            <FormControl id="email" mb={4}>
              <FormLabel>Email address</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </FormControl>
            <FormControl id="password" mb={6}>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              size="lg"
              width="full"
              isLoading={loading}
              mb={4}
            >
              Sign In
            </Button>
          </form>
          <Text textAlign="center" color="gray.600" _dark={{ color: 'gray.300' }}>
            Don't have an account?{' '}
            <Link as={RouterLink} to="/register" color="purple.500" fontWeight="bold">
              Sign Up
            </Link>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default LoginPage;
```

#### `frontend/src/pages/Admin/DashboardPage.js`

```javascript