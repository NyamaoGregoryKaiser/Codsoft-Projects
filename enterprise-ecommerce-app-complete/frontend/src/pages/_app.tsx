```typescript
import '@/src/styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { CartProvider } from '@/src/contexts/CartContext';
import { Toaster } from 'react-hot-toast';
import Layout from '@/src/layouts/Layout';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Component {...pageProps} />
          <Toaster position="bottom-right" reverseOrder={false} />
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
```