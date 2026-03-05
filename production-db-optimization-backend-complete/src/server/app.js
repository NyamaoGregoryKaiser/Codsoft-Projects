const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security best practice
const rateLimit = require('express-rate-limit');
const morgan = require('morgan'); // HTTP request logging
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const queryAnalysisRoutes = require('./routes/queryAnalysisRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const schemaRoutes = require('./routes/schemaRoutes');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow requests from frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

// Request Logging (using Morgan for HTTP requests, Winston for app logs)
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Body Parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/queries', queryAnalysisRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/schema', schemaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route Not Found' });
});

// Centralized Error Handling Middleware (must be last)
app.use(errorHandler);

module.exports = app;