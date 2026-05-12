```javascript
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status-codes');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: `Too many authentication attempts from this IP, please try again after 15 minutes.`,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: (req, res) => req.ip, // Use IP address for rate limiting
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute.',
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  headers: true,
  keyGenerator: (req, res) => req.ip,
});

module.exports = {
  authLimiter,
  apiLimiter,
};
```