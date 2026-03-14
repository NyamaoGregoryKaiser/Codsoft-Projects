```javascript
const { verifySocketToken } = require('../utils/jwt');
const cacheService = require('../services/cacheService');
const messageService = require('../services/messageService');
const logger = require('../config/winston');
const User = require('../models/User'); // Required to fetch user details for initial connection

const connectedUsers = {}; // Store userId -> socket.id for direct messaging, if needed. Or just use rooms.

module.exports = (io) => {
  // Middleware for Socket.IO to authenticate connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('Socket connection denied: No token provided.');
      return next(new Error('Authentication error: No token provided.'));
    }

    const decoded = verifySocketToken(token);
    if (!decoded) {
      logger.warn('Socket connection denied: Invalid token.');
      return next(new Error('Authentication error: Invalid token.'));
    }

    try {
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        logger.warn(`Socket connection denied: User not found for ID ${decoded.id}.`);
        return next(new Error('Authentication error: User not found.'));
      }
      socket.user = user; // Attach user object to socket
      next();
    } catch (error) {
      logger.error(`Error during socket authentication: ${error.message}`);
      next(new Error('Authentication error.'));
    }
  });

  io.on('connection', async (socket) => {
    logger.info(`User ${socket.user.username} (${socket.user._id}) connected via Socket.ID: ${socket.id}`);

    // Add user to online users cache
    await cacheService.addOnlineUser(socket.user._id.toString(), socket.user.username);
    io.emit('user:online', { userId: socket.user._id, username: socket.user.username }); // Notify all clients

    // Join user to their respective rooms
    socket.user.rooms.forEach(roomId => {
      socket.join(roomId.toString());
      logger.debug(`User ${socket.user.username} joined room: ${roomId}`);
    });

    // Send the current list of online users to the newly connected client
    const onlineUsers = await cacheService.getOnlineUsers();
    socket.emit('users:online:initial', onlineUsers);


    socket.on('joinRoom', (roomId) => {
      // Additional server-side logic if user can dynamically join rooms without REST API
      // E.g., check if room exists, if public or user is invited/admin, then socket.join(roomId)
      logger.debug(`User ${socket.user.username} explicitly joined room: ${roomId}`);
      socket.join(roomId);
    });

    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      logger.debug(`User ${socket.user.username} left room: ${roomId}`);
    });

    socket.on('sendMessage', async ({ roomId, content }) => {
      if (!roomId || !content || content.trim() === '') {
        logger.warn(`Invalid message from user ${socket.user._id} to room ${roomId}. Content: "${content}"`);
        return socket.emit('chat:error', { message: 'Message content cannot be empty.' });
      }

      try {
        const message = await messageService.createMessage(roomId, socket.user._id, content);
        // Broadcast message to all clients in the room
        io.to(roomId).emit('receiveMessage', message);
        logger.verbose(`Message sent in room ${roomId} by ${socket.user.username}: ${content}`);
      } catch (error) {
        logger.error(`Error sending message for user ${socket.user._id} to room ${roomId}: ${error.message}`);
        socket.emit('chat:error', { message: 'Failed to send message.', details: error.message });
      }
    });

    socket.on('typing', ({ roomId }) => {
      // Broadcast to all clients in the room except the sender
      socket.to(roomId).emit('typing', { roomId, userId: socket.user._id, username: socket.user.username });
      logger.debug(`User ${socket.user.username} is typing in room ${roomId}`);
    });

    socket.on('stopTyping', ({ roomId }) => {
      // Broadcast to all clients in the room except the sender
      socket.to(roomId).emit('stopTyping', { roomId, userId: socket.user._id });
      logger.debug(`User ${socket.user.username} stopped typing in room ${roomId}`);
    });

    socket.on('disconnect', async () => {
      logger.info(`User ${socket.user.username} (${socket.user._id}) disconnected from Socket.ID: ${socket.id}`);

      // Remove user from online users cache
      await cacheService.removeOnlineUser(socket.user._id.toString());
      io.emit('user:offline', { userId: socket.user._id, username: socket.user.username }); // Notify all clients

      // Clear any typing indicators for this user in all rooms they were in
      socket.user.rooms.forEach(roomId => {
        io.to(roomId.toString()).emit('stopTyping', { roomId, userId: socket.user._id });
      });
    });
  });
};
```