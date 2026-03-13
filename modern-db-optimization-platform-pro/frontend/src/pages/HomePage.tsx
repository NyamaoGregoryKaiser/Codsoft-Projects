```typescript
import React from 'react';
import { Box, Heading, Text, Container, Button, Stack, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Box
      textAlign="center"
      py={10}
      px={6}
      bg={useColorModeValue('gray.50', 'gray.800')}
      minHeight="calc(100vh - 64px)" // Subtract Navbar height
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW={'3xl'}>
        <Stack
          as={Box}
          textAlign={'center'}
          spacing={{ base: 8, md: 14 }}
          py={{ base: 20, md: 36 }}
        >
          <Heading
            fontWeight={600}
            fontSize={{ base: '2xl', sm: '4xl', md: '6xl' }}
            lineHeight={'110%'}
          >
            Optimize Your Database <br />
            <Text as={'span'} color={'blue.400'}>
              Performance
            </Text>
          </Heading>
          <Text color={'gray.500'}>
            Gain deep insights into your PostgreSQL databases. Monitor active queries, analyze execution plans, manage indexes, and streamline your database operations for peak performance.
          </Text>
          <Stack
            direction={'column'}
            spacing={3}
            align={'center'}
            alignSelf={'center'}
            position={'relative'}
          >
            {isAuthenticated ? (
              <Button
                as={RouterLink}
                to="/connections"
                colorScheme={'blue'}
                bg={'blue.400'}
                rounded={'full'}
                px={6}
                _hover={{
                  bg: 'blue.500',
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <Button
                as={RouterLink}
                to="/register"
                colorScheme={'blue'}
                bg={'blue.400'}
                rounded={'full'}
                px={6}
                _hover={{
                  bg: 'blue.500',
                }}
              >
                Get Started
              </Button>
            )}
            <Button as={RouterLink} to="/login" variant={'link'} colorScheme={'blue'} size={'sm'}>
              Already have an account? Login.
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default HomePage;
```