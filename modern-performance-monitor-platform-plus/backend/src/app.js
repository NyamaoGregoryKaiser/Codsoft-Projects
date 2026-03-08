```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security middleware
const compression = require('compression'); // Compression middleware
const session = require('express-session');
const RedisStore = require('connect-redis').default;
const { createClient } = require('redis');
const config = require('./config');
const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const { rateLimitMiddleware } = require('./middleware/rateLimit');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS for all routes (adjust as needed for production)
app.use(cors({
  origin: config.frontendUrl, // Allow requests only from frontend
  credentials: true,
}));

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Gzip compression
app.use(compression());

// Initialize Redis client
const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));

// Connect to Redis, ensure it's connected before session store is used
(async () => {
  await redisClient.connect();
})();


// Session middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient, prefix: 'pms:session:' }),
    secret: config.jwt.secret, // Use JWT secret for session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.env === 'production', // true for HTTPS
      httpOnly: true,
      maxAge: config.jwt.accessExpirationMinutes * 60 * 1000, // Matches JWT access token expiry
      sameSite: config.env === 'production' ? 'Lax' : 'None', // 'Lax' for production, 'None' for cross-site dev
    },
  })
);

// Apply rate limiting to all requests
app.use(rateLimitMiddleware);

// API routes
app.use(`/api/${config.apiVersion}`, routes);

// Send back a 404 error for any unknown API request
app.use((req, res, next) => {
  next(new Error('Not Found', 404)); // Custom error might be better
});

// Convert error to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;
```