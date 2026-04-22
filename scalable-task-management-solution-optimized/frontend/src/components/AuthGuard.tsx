import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/store/authStore';
import { Spinner, Flex } from '@chakra-ui/react';

interface AuthGuardProps {
  children: ReactNode;
  noAuthRequired: string[];
}

const AuthGuard = ({ children, noAuthRequired }: AuthGuardProps) => {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const isLoading = useAuthStore((state) => state.accessToken === null && state.isAuthenticated === false && Cookies.get('accessToken') !== undefined); // Simple loading state

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const isPublicPath = noAuthRequired.includes(router.pathname);

    if (!isAuthenticated && !isPublicPath) {
      router.push('/login');
    } else if (isAuthenticated && (router.pathname === '/login' || router.pathname === '/register')) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router, noAuthRequired]);

  // If we are checking auth or on a private page and not authenticated, show a loading spinner or nothing
  if (isLoading && !noAuthRequired.includes(router.pathname)) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  // Render children only if authenticated or on a public path
  if (isAuthenticated || noAuthRequired.includes(router.pathname)) {
    return <>{children}</>;
  }

  // Fallback, maybe a loading screen or empty
  return null;
};

export default AuthGuard;