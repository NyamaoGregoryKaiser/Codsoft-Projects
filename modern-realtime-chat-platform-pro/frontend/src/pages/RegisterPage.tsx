```typescript
import { Box, Heading, Text, Link, VStack, useToast } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import { useAuth } from '../hooks/useAuth';
import { RegisterPayload } from '../types/auth';

function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleRegister = async (payload: RegisterPayload) => {
    try {
      await register(payload);
      toast({
        title: 'Registration successful.',
        description: 'You can now log in.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Registration failed.',
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

        <Heading fontSize="3xl" mb={4} zIndex="1">Create Your Account</Heading>
        <AuthForm type="register" onSubmit={handleRegister} />
        <Text zIndex="1">
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="blue.500" fontWeight="bold">
            Log In
          </Link>
        </Text>
      </VStack>
    </Box>
  );
}

export default RegisterPage;
```