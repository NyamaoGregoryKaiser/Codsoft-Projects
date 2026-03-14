```javascript
// This file is a simple way to get environment variables into the React app.
// For larger projects, consider a more structured config file that loads from process.env

const config = {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
    socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
    // Add other frontend-specific configurations here
};

export default config;
```