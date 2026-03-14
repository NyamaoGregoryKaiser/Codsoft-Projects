```javascript
const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');
const logger = require('./config/winston');
const ErrorResponse = require('./utils/errorResponse');

// Load env vars
dotenv.config({ path: './.env' });

// Route files
const auth = require('./routes/authRoutes');
const users = require('./routes/userRoutes');
const rooms = require('./routes/roomRoutes');
const messages = require('./routes/messageRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL, // Allow only your client URL
  credentials: true
}));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Sanitize data
app.use(mongoSanitize());

// Prevent http param pollution
app.use(hpp());

// Rate limiting
app.use(rateLimiter);

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/users', users);
app.use('/api/v1/rooms', rooms);
app.use('/api/v1/messages', messages);

// Catch-all for undefined routes
app.all('*', (req, res, next) => {
  logger.warn(`Attempted to access unknown route: ${req.originalUrl}`);
  next(new ErrorResponse(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware (must be last middleware)
app.use(errorHandler);

module.exports = app;
```