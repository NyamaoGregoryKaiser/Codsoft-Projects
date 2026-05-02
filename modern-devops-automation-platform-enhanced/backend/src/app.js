```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/loggerMiddleware');
const apiLimiter = require('./middleware/rateLimitMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Connect to Database and Redis
connectDB();
connectRedis();

// Security Middleware
app.use(helmet());

// CORS - Allow requests from frontend origin
app.use(cors({
  origin: config.NODE_ENV === 'production' ? 'https://your-frontend-domain.com' : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use(requestLogger);

// Rate Limiting
app.use(apiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```