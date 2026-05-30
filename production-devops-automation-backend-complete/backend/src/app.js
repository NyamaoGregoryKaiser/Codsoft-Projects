```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiterMiddleware = require('./middleware/rateLimiter.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const loggerMiddleware = require('./middleware/logger.middleware');
const logger = require('./config/logger.config');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors()); // Configure CORS as needed for production, e.g., specific origins
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: true })); // Body parser for URL-encoded data

// Custom Middlewares
app.use(loggerMiddleware); // Request logging
app.use(rateLimiterMiddleware); // API rate limiting

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/tasks', taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
```