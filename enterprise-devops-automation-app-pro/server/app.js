const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const app = express();

// Load environment variables (already done in server.js, but good for standalone tests)
if (process.env.NODE_ENV !== 'production') {
  require('./config/env');
}

// Security Middlewares
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true })); // CORS protection
app.use(helmet()); // Set security HTTP headers
app.use(hpp()); // Prevent HTTP Parameter Pollution
app.use(xss()); // Prevent Cross-Site Scripting (XSS) attacks

// Custom Middlewares
const loggerMiddleware = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');

app.use(loggerMiddleware); // Request logging
app.use('/api/', rateLimitMiddleware); // Apply rate limiting to all API routes

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'E-commerce API is running!' });
});

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`, { cause: 404 }));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;