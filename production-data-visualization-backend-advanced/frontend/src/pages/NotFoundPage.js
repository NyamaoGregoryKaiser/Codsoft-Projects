import React from 'react';
import { Box, Heading, Text, Button, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function NotFoundPage() {
  return (
    <Flex align="center" justify="center" minH="calc(100vh - 70px)" flexDirection="column" textAlign="center" p={4}>
      <Heading as="h1" size="2xl" mb={4} color="brand.500">
        404
      </Heading>
      <Text fontSize="xl" mb={6} color="gray.700">
        Page Not Found
      </Text>
      <Text fontSize="md" color="gray.600" mb={8}>
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </Text>
      <Button as={RouterLink} to="/" colorScheme="brand" size="lg">
        Go to Home
      </Button>
    </Flex>
  );
}

export default NotFoundPage;