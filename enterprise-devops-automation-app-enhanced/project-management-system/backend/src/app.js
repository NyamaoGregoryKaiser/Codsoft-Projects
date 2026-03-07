```javascript
const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const compression = require('compression');
const httpStatus = require('http-status');
const config = require('./config');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const morgan = require('./config/morgan');
const rateLimiter = require('./middleware/rateLimiter');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data
app.use(xss());
app.use(hpp()); // Prevent HTTP Parameter Pollution

// Gzip compression
app.use(compression());

// Enable cors
app.use(cors());
app.options('*', cors());

// Rate limiting (apply to all requests or specific routes)
if (config.env === 'production') {
  app.use('/api', rateLimiter);
}

// API routes
app.use('/api', routes);

// Send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

module.exports = app;
```