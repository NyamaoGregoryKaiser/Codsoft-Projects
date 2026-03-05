import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  Link,
  VStack,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(username, email, password);
      navigate('/dashboards');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VStack minH="100vh" justify="center" align="center" bg="gray.50">
      <Box
        p={8}
        maxWidth="500px"
        borderWidth={1}
        borderRadius={8}
        boxShadow="lg"
        bg="white"
      >
        <Box textAlign="center">
          <Heading as="h2" size="xl" mb={4}>Register for DataViz Pro</Heading>
        </Box>
        <Box my={4} textAlign="left">
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert status="error" mb={4}>
                <AlertIcon />
                {error}
              </Alert>
            )}
            <FormControl isRequired mb={4}>
              <FormLabel htmlFor="username">Username</FormLabel>
              <Input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired mb={4}>
              <FormLabel htmlFor="email">Email address</FormLabel>
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl isRequired mb={6}>
              <FormLabel htmlFor="password">Password</FormLabel>
              <Input
                type="password"
                id="password"
                placeholder="Enter your password (min 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="brand"
              width="full"
              isLoading={loading}
              loadingText="Registering..."
            >
              Register
            </Button>
          </form>
          <Text mt={4} textAlign="center">
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="brand.500" fontWeight="bold">
              Login here
            </Link>
          </Text>
        </Box>
      </Box>
    </VStack>
  );
}

export default RegisterPage;