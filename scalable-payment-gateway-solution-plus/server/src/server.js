```javascript
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { cache } = require('apicache');

const config = require('./config');
const { logger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const connectDb = require('./db/connection');

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const merchantRoutes = require('./routes/merchants');
const productRoutes = require('./routes/products');
const paymentRoutes = require('./routes/payments');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Database Connection
connectDb();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: config.clientUrl, // Configure CORS for your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use(logger);

// Cache middleware (example for public routes)
// Apply `cache()` to specific GET routes as needed, e.g., app.get('/api/products', cache(config.cacheDurationSeconds), productController.getProducts);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);

// Basic Route for Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Payment Processor API is running!' });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  logger.info(`Server running in ${config.env} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app; // For testing
```