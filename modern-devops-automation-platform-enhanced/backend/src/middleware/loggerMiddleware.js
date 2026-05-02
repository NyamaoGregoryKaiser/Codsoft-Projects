```javascript
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
};

module.exports = requestLogger;
```