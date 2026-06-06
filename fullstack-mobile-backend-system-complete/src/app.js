```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean'); // Typically used with Helmet, but explicitly included for XSS protection
const mongoSanitize = require('express-mongo-sanitize'); // Although using Prisma/Postgres, good practice for other dbs
const compression = require('compression');
const httpStatus = require('http-status');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const config = require('./config');
const morgan = require('./config/morgan');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');
const rateLimitMiddleware = require('./middleware/rateLimit.middleware');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');

const app = express();

// Log HTTP requests
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// Set security HTTP headers
app.use(helmet());

// Parse incoming requests with JSON payloads
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Sanitize request data (against XSS and NoSQL injection)
app.use(xss());
app.use(mongoSanitize()); // Good practice even with Prisma, if you might integrate other dbs/use raw queries.

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors());
app.options('*', cors());

// Rate limiting
if (config.env === 'production') {
  app.use(rateLimitMiddleware);
}

// Swagger API documentation
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes
app.use('/v1', routes);

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not Found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;
```