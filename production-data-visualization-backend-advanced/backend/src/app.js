const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Although not explicitly asked, it's a good practice for security
const { rateLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const config = require('./config/config');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const dataSourceRoutes = require('./routes/dataSourceRoutes');
const chartRoutes = require('./routes/chartRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl, // Allow requests from your frontend
  credentials: true,
}));
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// Apply rate limiter to all requests (or specific routes)
app.use(rateLimiter);

// Log all requests (optional, for debugging)
app.use((req, res, next) => {
  logger.info(`Request: ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/dashboards', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Data Visualization API is running!' });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global error handling middleware
app.use(errorHandler);

module.exports = app;