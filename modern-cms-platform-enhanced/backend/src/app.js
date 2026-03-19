```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes');
const { errorHandler } = require('./middlewares/error.middleware');
const { requestLogger } = require('./utils/logger');
const config = require('./config/config');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
    origin: config.clientUrl, // Configure allowed origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Request logging (using custom logger and morgan for HTTP access logs)
app.use(morgan('combined', { stream: requestLogger.stream }));

// Apply rate limiting to all API requests
app.use('/api/', apiLimiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., uploaded media)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api', apiRoutes);

// Basic route for health check
app.get('/', (req, res) => {
    res.status(200).json({ message: 'CMS Backend is operational!' });
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
```