import React, { useState } from 'react';
import {
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  CloseButton,
  useToast,
  Flex
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { AuthResponse } from '../../types/auth';
import { useAuth } from '../../hooks/useAuth';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await api.post<AuthResponse>('/auth/register', { username, email, password });
      login(response.data.token, response.data.user);
      navigate('/'); // Redirect to dashboard on successful registration and login
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      toast({
        title: "Registration Error",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex align="center" justify="center" h="100vh" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <Box textAlign="center">
          <Heading as="h2" size="xl" mb={6} color="brand.600">Register</Heading>
        </Box>
        <Box my={4} textAlign="left">
          {error && (
            <Alert status="error" mb={4} borderRadius="md">
              <AlertIcon />
              {error}
              <CloseButton position="absolute" right="8px" top="8px" onClick={() => setError(null)} />
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email address</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormControl>
              <Button type="submit" colorScheme="brand" width="full" mt={4} isLoading={isLoading}>
                Register
              </Button>
            </VStack>
          </form>
          <Text mt={4} textAlign="center">
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color="brand.500">
              Login here
            </Link>
          </Text>
        </Box>
      </Box>
    </Flex>
  );
};

export default RegisterPage;
```