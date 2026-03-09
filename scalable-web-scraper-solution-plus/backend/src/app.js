```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const scrapingJobRoutes = require('./routes/scrapingJobRoutes');
const scrapingResultRoutes = require('./routes/scrapingResultRoutes');
const errorMiddleware = require('./middleware/errorMiddleware');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { protect } = require('./middleware/authMiddleware'); // Assuming we want some routes protected

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // 100 requests per window
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Body Parser
app.use(express.json());

// Logger Middleware
app.use(loggerMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', protect, userRoutes); // Protect user routes
app.use('/api/scraping-jobs', protect, scrapingJobRoutes); // Protect scraping job routes
app.use('/api/scraping-results', protect, scrapingResultRoutes); // Protect scraping results routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Scraper Hub API is running' });
});

// Catch-all for undefined routes
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
```