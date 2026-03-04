```typescript
import app from './app';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { logger } from './config/logger';
import { initializeSocketIO } from './sockets/chatSocket';
import { prisma } from './config/prisma'; // Import prisma to ensure it's initialized

const server = http.createServer(app);

// Initialize Socket.IO server
export const io = new SocketIOServer(server, {
  cors: {
    origin: config.nodeEnv === 'production' ? 'https://yourproductiondomain.com' : '*', // Adjust for production
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Optionally configure path and other options
  // path: '/socket.io/',
});

initializeSocketIO(io); // Pass the IO instance to the socket handler

const PORT = config.port;

server.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  logger.info(`HTTP Server: http://localhost:${PORT}`);
  logger.info(`WebSocket Server: ws://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await prisma.$disconnect();
    logger.info('Prisma disconnected.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});
```