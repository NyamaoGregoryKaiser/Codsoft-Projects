```typescript
import { Box, Heading, Text, Link, VStack, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { LoginPayload } from '../types/auth';

function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async (payload: LoginPayload) => {
    try {
      await login(payload);
      toast({
        title: 'Login successful.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/chat');
    } catch (error: any) {
      toast({
        title: 'Login failed.',
        description: error.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bgGradient="linear(to-r, blue.800, purple.700)"
      color="white"
    >
      <VStack
        spacing={8}
        p={8}
        bg="whiteAlpha.900"
        rounded="xl"
        shadow="2xl"
        maxW="md"
        w="full"
        color="gray.800"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="-50px"
          left="-50px"
          w="200px"
          h="200px"
          bg="blue.500"
          rounded="full"
          filter="blur(80px)"
          opacity="0.3"
        />
        <Box
          position="absolute"
          bottom="-50px"
          right="-50px"
          w="200px"
          h="200px"
          bg="purple.500"
          rounded="full"
          filter="blur(80px)"
          opacity="0.3"
        />

        <Heading fontSize="3xl" mb={4} zIndex="1">Welcome Back!</Heading>
        <AuthForm type="login" onSubmit={handleLogin} />
        <Text zIndex="1">
          Don't have an account?{' '}
          <Link as={RouterLink} to="/register" color="blue.500" fontWeight="bold">
            Sign Up
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}

export default LoginPage;
```