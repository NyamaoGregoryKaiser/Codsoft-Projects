```javascript
// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const websiteRoutes = require('./routes/website.routes');
const jobRoutes = require('./routes/job.routes');
const scrapedDataRoutes = require('./routes/scrapedData.routes');

const errorHandler = require('./middleware/errorHandler.middleware');
const { requestLogger, errorLogger } = require('./middleware/logging.middleware');
const rateLimitMiddleware = require('./middleware/rateLimit.middleware');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true })); // Adjust CORS for production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use(rateLimitMiddleware);

// Logging Middleware
app.use(requestLogger);

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Web Scraper API',
      version: '1.0.0',
      description: 'API documentation for the Web Scraper Tools System',
      contact: {
        name: 'Your Name',
        email: 'your.email@example.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: []
    }],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'], // Files containing annotations for Swagger
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/websites', websiteRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/data', scrapedDataRoutes);

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Error Logging Middleware (should be before errorHandler for logging)
app.use(errorLogger);

// Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
```