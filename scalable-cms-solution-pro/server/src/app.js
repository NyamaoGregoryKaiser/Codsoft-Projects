```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/config');
const { connectDB } = require('./config/database');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler.middleware');
const { requestLogger } = require('./middleware/logger.middleware');
const logger = require('./utils/logger');
const { setupRateLimit } = require('./middleware/rateLimit.middleware');

const app = express();

// Database Connection
connectDB();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: config.CORS_ORIGIN, // e.g., 'http://localhost:3000'
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Request logging (using morgan for HTTP requests, Winston for custom logs)
app.use(morgan('dev', { stream: { write: message => logger.http(message.trim()) } }));
app.use(requestLogger); // Custom Winston logger for more details if needed

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use(setupRateLimit());

// API Routes
app.use('/api/v1', apiRoutes);

// Static files (for media uploads, or serving frontend in production if monorepo)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route for API health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Catch-all for undefined API routes
app.use('/api/*', (req, res, next) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
```