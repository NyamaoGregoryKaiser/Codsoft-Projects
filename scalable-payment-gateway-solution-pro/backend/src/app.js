const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');

const config = require('./config');
const { authLimiter } = require('./middleware/rateLimit.middleware');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');
const ApiError = require('./utils/ApiError');

// Import all routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const accountRoutes = require('./modules/accounts/account.routes');
const transactionRoutes = require('./modules/transactions/transaction.routes');
const paymentRoutes = require('./modules/payments/payment.routes');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());
app.options('*', cors()); // pre-flight requests

// Parse JSON request body
app.use(express.json());

// Apply rate limiting to specific routes
app.use('/api/v1/auth', authLimiter); // Limit auth attempts

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;