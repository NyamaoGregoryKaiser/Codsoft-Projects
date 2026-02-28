```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Default port for development
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Proxy API requests to backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/uploads': { // Proxy for uploaded static files
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```