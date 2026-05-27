```javascript
require('dotenv').config(); // Load environment variables from .env file
const app = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');

const PORT = config.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.NODE_ENV} environment`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err);
  // Close server & exit process
  server.close(() => process.exit(1));
});
```