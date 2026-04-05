const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const httpStatus = require('http-status');
const { jwtSecret } = require('./config'); // For passport-jwt if used, but we'll use custom middleware
const { errorConverter, errorHandler } = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');
const routes = require('./routes');
const { rateLimiter } = require('./middlewares/rateLimit');
const authMiddleware = require('./middlewares/auth.middleware'); // General auth for protected routes

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());
app.options('*', cors()); // Enable pre-flight for all routes

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all requests
app.use(rateLimiter);

// Public routes (e.g., auth) don't need authMiddleware here
// All routes starting with /api will be handled by the router
app.use('/api', routes);

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;