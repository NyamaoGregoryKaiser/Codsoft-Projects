```javascript
const logger = require('../utils/logger');

// Custom request logger using Winston
const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};

module.exports = {
  requestLogger,
};
```