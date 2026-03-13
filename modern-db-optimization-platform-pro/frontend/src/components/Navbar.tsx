```typescript
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  useColorModeValue,
  Spacer,
  Heading,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4} borderBottom="1px" borderColor="gray.200">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Heading as="h1" size="md">
          <RouterLink to="/">DB Optimizer</RouterLink>
        </Heading>

        <Spacer />

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            {user ? (
              <>
                <Text fontSize="md" alignSelf="center">
                  Welcome, {user.username} ({user.role})
                </Text>
                <Button as={RouterLink} to="/connections" variant="ghost">
                  Connections
                </Button>
                <Button onClick={logout} colorScheme="red" size="sm">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button as={RouterLink} to="/login" variant="ghost">
                  Login
                </Button>
                <Button as={RouterLink} to="/register" variant="outline">
                  Register
                </Button>
              </>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar;
```