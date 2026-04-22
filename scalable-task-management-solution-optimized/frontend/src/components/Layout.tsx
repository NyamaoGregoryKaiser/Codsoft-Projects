import { ReactNode } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';

  if (!isAuthenticated && !isAuthPage) {
    // If not authenticated and not on an auth page, don't render layout components, AuthGuard will handle redirect
    return <Box>{children}</Box>;
  }

  if (isAuthPage) {
    // For login/register pages, just render children without sidebar/header
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.100">
        {children}
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Flex flex="1">
        <Sidebar />
        <Box flex="1" p={4} ml={{ base: 0, md: '250px' }} transition="margin-left 0.2s">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
};

export default Layout;