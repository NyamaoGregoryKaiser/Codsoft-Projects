```javascript
// server/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const httpStatus = require('http-status-codes');
const config = require('./config');
const logger = require('./config/logger');
const ApiError = require('./utils/ApiError');
const { errorConverter, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
// Add other routes here (userRoutes, orderRoutes, cartRoutes, etc.)

const app = express();

// Security middleware
app.use(helmet());

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// HTTP request logger
app.use(morgan(config.env === 'development' ? 'dev' : 'combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Apply rate limiting to all API requests
app.use(apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/cart', cartRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(httpStatus.OK).json({ status: 'UP', timestamp: new Date() });
});

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle error
app.use(errorHandler);

module.exports = app;

```