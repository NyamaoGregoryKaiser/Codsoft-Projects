import React from 'react';
import { Box, Heading, Text, VStack, Button, Link } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <Box p={8} bg="white" borderRadius="lg" boxShadow="md" maxW="3xl" mx="auto" mt={8}>
      <Heading as="h2" size="xl" mb={4} color="brand.700">
        Welcome, {user?.username || 'Guest'}!
      </Heading>
      <Text fontSize="lg" mb={6}>
        This is your central hub for managing Machine Learning Utilities.
      </Text>

      <VStack spacing={6} align="stretch">
        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading as="h3" size="md" mb={2}>Model Management</Heading>
          <Text mb={3}>
            View, upload, update, and deploy your machine learning models.
          </Text>
          <Link as={RouterLink} to="/models">
            <Button colorScheme="brand">Go to Models</Button>
          </Link>
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading as="h3" size="md" mb={2}>Data Transformations</Heading>
          <Text mb={3}>
            Apply various preprocessing techniques like StandardScaler and MinMaxScaler to your datasets.
          </Text>
          <Link as={RouterLink} to="/transforms">
            <Button colorScheme="brand">Apply Transforms</Button>
          </Link>
        </Box>

        <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
          <Heading as="h3" size="md" mb={2}>API Documentation</Heading>
          <Text mb={3}>
            Explore the full capabilities of the ML Utilities API.
          </Text>
          <Link href="/api-docs" isExternal>
            <Button colorScheme="blue" variant="outline">View API Docs</Button>
          </Link>
        </Box>
      </VStack>
    </Box>
  );
};

export default DashboardPage;
```