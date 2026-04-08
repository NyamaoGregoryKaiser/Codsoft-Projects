import React from 'react';
import { Flex, Spinner, Text } from '@chakra-ui/react';

const LoadingSpinner = () => {
  return (
    <Flex
      height="100vh"
      alignItems="center"
      justifyContent="center"
      direction="column"
    >
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color="blue.500"
        size="xl"
      />
      <Text mt={4} fontSize="lg">Loading...</Text>
    </Flex>
  );
};

export default LoadingSpinner;