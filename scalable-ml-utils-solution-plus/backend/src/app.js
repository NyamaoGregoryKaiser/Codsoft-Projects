```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan'); // For simple HTTP request logging in dev
const rateLimit = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/logging');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/appError');
const config = require('./config/config');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const modelRoutes = require('./routes/modelRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const inferenceLogRoutes = require('./routes/inferenceLogRoutes');

const app = express();

// 1) Global Middlewares
// Enable CORS for all requests
app.use(cors());

// Set security HTTP headers
app.use(helmet());

// Logging middleware
if (config.env === 'development') {
  app.use(morgan('dev')); // HTTP request logger for development
}
app.use(requestLogger); // Custom logger for detailed logging

// Limit requests from same API
app.use('/api', rateLimit);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 2) Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/models', modelRoutes);
app.use('/api/v1/datasets', datasetRoutes);
app.use('/api/v1/inference-logs', inferenceLogRoutes);

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 3) Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;
```