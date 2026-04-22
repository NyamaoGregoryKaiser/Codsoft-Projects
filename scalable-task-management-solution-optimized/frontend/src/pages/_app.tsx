import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '@/theme/chakra.theme';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';

export default function App({ Component, pageProps }: AppProps) {
  const noAuthRequired = ['/login', '/register', '/404']; // Pages that don't need authentication

  return (
    <ChakraProvider theme={theme}>
      <AuthGuard noAuthRequired={noAuthRequired}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AuthGuard>
    </ChakraProvider>
  );
}