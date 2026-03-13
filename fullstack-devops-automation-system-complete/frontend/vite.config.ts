```typescript
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env vars regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@api': path.resolve(__dirname, './src/api'),
        '@components': path.resolve(__dirname, './src/components'),
        '@context': path.resolve(__dirname, './src/context'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@types-frontend': path.resolve(__dirname, './src/types'),
        '@utils': path.resolve(__dirname, './src/utils'),
      },
    },
    server: {
      port: 5173,
      // Proxy requests to the backend API if not using Nginx locally
      // This is mostly for development convenience if you don't use docker-compose
      // When using docker-compose, Nginx handles this.
      // proxy: {
      //   '/api': {
      //     target: env.VITE_API_BASE_URL || 'http://localhost:5000',
      //     changeOrigin: true,
      //     rewrite: (path) => path.replace(/^\/api/, '/api'),
      //   },
      // },
    },
    build: {
      outDir: 'build', // Output directory for built files
      sourcemap: true,
    },
    define: {
      'process.env': env,
    },
  };
});
```