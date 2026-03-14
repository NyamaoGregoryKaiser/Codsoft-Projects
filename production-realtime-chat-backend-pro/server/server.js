```javascript
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app'); // Express app
const connectDB = require('./config/db');
const socketHandler = require('./websocket/socketHandler');
const logger = require('./config/winston');
const redisClient = require('./config/redis'); // Initialize Redis client

// Connect to database
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize Socket.IO handlers
socketHandler(io);

const PORT = process.env.PORT || 5000;

// Start the server
server.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await redisClient.quit(); // Disconnect Redis client
  server.close(() => {
    logger.info('Server closed. Exiting process.');
    process.exit(0);
  });
});
```