```javascript
const app = require('./app');
const config = require('./config/env');
const logger = require('./utils/logger');

const PORT = config.PORT;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
```