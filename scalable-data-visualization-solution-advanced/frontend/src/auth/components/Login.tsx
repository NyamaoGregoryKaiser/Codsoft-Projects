```tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useToast,
  Link,
  Center,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Login successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/'); // Redirect to home page
    } catch (error: any) {
      toast({
        title: 'Login failed.',
        description: error.response?.data?.detail || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center minH="100vh" bg="gray.50">
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" bg="white">
        <Stack spacing={4} as="form" onSubmit={handleSubmit}>
          <Heading as="h1" size="xl" textAlign="center" color="brand.500">
            DataViz System
          </Heading>
          <Text fontSize="lg" textAlign="center" color="gray.600">
            Sign in to your account
          </Text>
          <FormControl id="email">
            <FormLabel>Email address</FormLabel>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormControl>
          <FormControl id="password">
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="brand"
            isLoading={isLoading}
            loadingText="Logging in"
            width="full"
          >
            Sign In
          </Button>
          <Text textAlign="center" mt={4}>
            Don't have an account?{' '}
            <Link color="brand.500" href="/register">
              Sign Up
            </Link>
          </Text>
        </Stack>
      </Box>
    </Center>
  );
};
```