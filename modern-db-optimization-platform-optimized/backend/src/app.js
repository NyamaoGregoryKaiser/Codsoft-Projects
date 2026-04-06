const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const apiLimiter = require('./middleware/rateLimit.middleware');
const logger = require('./config/logger');

const app = express();

// Security Middleware
app.use(helmet());

// Enable CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : '*', // Restrict in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}));

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
app.use(apiLimiter);

// API Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
    res.status(404).json({ status: 'error', message: 'Not Found' });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;