import { Box, Heading, Text, Button, Flex } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <Flex align="center" justify="center" minH="calc(100vh - 80px)">
      <Box textAlign="center" py={10} px={6}>
        <Heading
          display="inline-block"
          as="h2"
          size="2xl"
          bgGradient="linear(to-r, teal.400, teal.600)"
          backgroundClip="text"
        >
          404
        </Heading>
        <Text fontSize="18px" mt={3} mb={2}>
          Page Not Found
        </Text>
        <Text color={'gray.500'} mb={6}>
          The page you're looking for does not seem to exist
        </Text>

        <Button
          colorScheme="teal"
          bgGradient="linear(to-r, teal.400, teal.500, teal.600)"
          color="white"
          variant="solid"
          as={RouterLink}
          to="/"
        >
          Go to Home
        </Button>
      </Box>
    </Flex>
  );
};

export default NotFoundPage;