import { Box, Spinner, Flex } from '@chakra-ui/react';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from '@contexts/AuthContext';
import Navbar from '@components/Navbar';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh">
      <Navbar />
      <Box p={4}>
        <AppRoutes />
      </Box>
    </Box>
  );
}

export default App;