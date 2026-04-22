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
import { RegisterData } from '@/lib/types';

const RegisterPage = () => {
  const router = useRouter();
  const toast = useToast();

  const [formData, setFormData] = useState<RegisterData>({
    username: '',
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
      await api.post('/auth/register', formData);
      toast({
        title: 'Registration successful.',
        description: 'You can now log in with your new account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Registration failed.',
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
        Register
      </Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl id="username">
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
            />
          </FormControl>
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
            Sign Up
          </Button>
        </VStack>
      </form>
      <Text mt={4} textAlign="center">
        Already have an account?{' '}
        <Link href="/login" passHref>
          <ChakraLink color="brand.500">Login</ChakraLink>
        </Link>
      </Text>
    </Box>
  );
};

export default RegisterPage;