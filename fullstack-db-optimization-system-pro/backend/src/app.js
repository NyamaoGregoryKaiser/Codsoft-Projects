```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { logRequest, logError } = require('./middleware/loggerMiddleware');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const queryRoutes = require('./routes/queryRoutes');
const optimizationRoutes = require('./routes/optimizationRoutes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(apiLimiter);

// Request Logging
app.use(logRequest);

// Body Parsers
app.use(express.json()); // For JSON payloads
app.use(express.urlencoded({ extended: true })); // For URL-encoded payloads

// Routes
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Welcome to the Database Optimizer API!' });
});
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/databases', databaseRoutes);
app.use('/api/queries', queryRoutes);
app.use('/api/optimizations', optimizationRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handling
app.use(logError); // Log errors before sending response
app.use(errorHandler);

module.exports = app;
```