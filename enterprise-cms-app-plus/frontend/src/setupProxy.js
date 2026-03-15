```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

// This file is used by Create React App's development server.
// It proxies API requests from the React app (port 3000) to the Django backend (port 8000).
module.exports = function(app) {
  app.use(
    '/api', // Path to proxy (e.g., all /api/v1 requests)
    createProxyMiddleware({
      target: 'http://localhost:8000', // Target Django backend
      changeOrigin: true,
      // Optional: Rewrite paths if needed, e.g., to remove /api from target
      // pathRewrite: {
      //   '^/api': '/api', // This example keeps /api prefix
      // },
    })
  );
  app.use(
    '/media', // Also proxy media files during development
    createProxyMiddleware({
      target: 'http://localhost:8000',
      changeOrigin: true,
    })
  );
};
```