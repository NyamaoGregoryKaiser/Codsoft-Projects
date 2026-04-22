import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Flex, Spinner } from '@chakra-ui/react';

const HomePage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard');
  }, [router]);

  return (
    <Flex height="100vh" align="center" justify="center">
      <Spinner size="xl" />
    </Flex>
  );
};

export default HomePage;