const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const datasetRoutes = require('./routes/datasetRoutes');
const modelRoutes = require('./routes/modelRoutes');
const trainingJobRoutes = require('./routes/trainingJobRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimitMiddleware');
const { ORIGIN, NODE_ENV } = require('./config');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: ORIGIN, // frontend URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

// Rate Limiting
app.use(apiLimiter);

// Request body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom request logger
app.use(requestLogger);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: NODE_ENV });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/training-jobs', trainingJobRoutes);
app.use('/api/predictions', predictionRoutes);

// Error Handling Middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;