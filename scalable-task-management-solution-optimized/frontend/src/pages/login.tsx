import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Heading,
  VStack,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import Link from 'next/link';
import api from '@/api';
import { LoginData } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';

const LoginPage = () => {
  const router = useRouter();
  const toast = useToast();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', formData);
      login(response.data.accessToken);
      toast({
        title: 'Login successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login failed.',
        description: error.response?.data?.message || 'An unexpected error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={8} borderWidth={1} borderRadius={8} boxShadow="lg" bg="white" maxW="md" mx="auto">
      <Heading as="h2" size="xl" textAlign="center" mb={6} color="brand.500">
        Login
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl id="email">
            <FormLabel>Email address</FormLabel>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </FormControl>
          <FormControl id="password">
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </FormControl>
          <Button
            type="submit"
            colorScheme="brand"
            size="lg"
            width="full"
            isLoading={isLoading}
            mt={4}
          >
            Sign In
          </Button>
        </VStack>
      </form>
      <Text mt={4} textAlign="center">
        Don't have an account?{' '}
        <Link href="/register" passHref>
          <ChakraLink color="brand.500">Sign Up</ChakraLink>
        </Link>
      </Text>
    </Box>
  );
};

export default LoginPage;