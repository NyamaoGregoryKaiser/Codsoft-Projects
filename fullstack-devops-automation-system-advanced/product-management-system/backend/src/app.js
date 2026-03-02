const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const httpStatus = require('http-status');
const config = require('./config');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const routes = require('./routes/v1');
const ApiError = require('./utils/ApiError');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS for all routes (or specific origins in production)
app.use(cors());
app.options('*', cors()); // Enable pre-flight for all routes

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Apply the API rate limit to all requests
// NOTE: For better security, apply this after other middleware like authentication
// so authenticated users can have different limits or bypass it for internal services.
app.use(apiLimiter);

// v1 api routes
app.use('/api/v1', routes);

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;
```

```