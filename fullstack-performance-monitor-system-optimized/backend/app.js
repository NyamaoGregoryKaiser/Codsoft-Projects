```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { apiRateLimiter } = require('./middleware/rateLimitMiddleware');
const loggingMiddleware = require('./middleware/loggingMiddleware');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const metricRoutes = require('./routes/metricRoutes');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Request Body Parser
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Logging Middleware
app.use(loggingMiddleware);

// Apply general API rate limiter to all routes (except specific ones where it's overridden)
app.use(apiRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/metrics', metricRoutes); // Note: metricRoutes has a public '/collect' endpoint

// Root endpoint for health check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Performance Monitor API is running!' });
});

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  const error = new Error(`Can't find ${req.originalUrl} on this server!`);
  error.statusCode = 404;
  error.name = 'NotFoundError';
  next(error);
});

// Centralized Error Handling Middleware (must be last middleware)
app.use(errorHandler);

module.exports = app;
```