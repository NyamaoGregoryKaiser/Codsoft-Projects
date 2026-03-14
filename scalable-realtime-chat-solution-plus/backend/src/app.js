```javascript
/**
 * @file Main Express application setup.
 * @module app
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize'); // Although using PostgreSQL, good practice to include
const compression = require('compression');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiRateLimiter } = require('./middleware/rateLimitMiddleware');
const logger = require('./utils/logger');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger'); // Swagger configuration

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Set client URL in app locals for Socket.IO (already in config)
app.set('clientUrl', config.clientUrl);

// Security Middleware
app.use(helmet()); // Set security headers
app.use(xss());    // Sanitize user input coming from POST body, GET queries, and URL params
app.use(hpp());    // Prevent HTTP Parameter Pollution
app.use(mongoSanitize()); // Prevent NoSQL injection (good to have, even if not using MongoDB)

// Enable CORS
app.use(cors({
    origin: config.clientUrl,
    credentials: true,
}));

// Compression middleware
app.use(compression());

// Body parser - Parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global API rate limiting
app.use(apiRateLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
logger.info(`Swagger UI available at ${config.serverUrl}/api-docs`);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Catch 404 and forward to error handler
app.use(notFound);

// Custom error handling middleware
app.use(errorHandler);

module.exports = app;
```