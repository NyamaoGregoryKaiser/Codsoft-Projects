```javascript
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { pubClient, subClient } = require('../config/redis'); // Assume redis config has pub/sub clients
const config = require('../config/config');
const logger = require('../config/logger');
const { chatService, userService } = require('../services');
const jwt = require('jsonwebtoken');

// Map to keep track of users in rooms
// { roomId: { socketId: { userId, username } } }
const usersInRooms = {};

const initializeSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // path: '/socket.io', // If using a specific path
  });

  // Use Redis adapter for horizontal scaling
  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured.');
  }).catch(err => {
    logger.error('Failed to connect Redis for Socket.IO adapter:', err);
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing.'));
    }
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await userService.getUserById(decoded.sub);
      if (!user) {
        return next(new Error('Authentication error: User not found.'));
      }
      socket.user = user; // Attach user object to socket
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.username} (${socket.id})`);

    socket.on('joinRoom', async (roomId, callback) => {
      try {
        const chatRoom = await chatService.getChatRoomById(roomId);

        // Check if user is already a member
        const isMember = chatRoom.users.some(user => user.id === socket.user.id);
        if (!isMember && chatRoom.isPrivate && socket.user.role !== 'admin') {
          throw new Error('Access to private room denied.');
        }

        // Add user to the room if not already a member (and if it's not private or user is admin)
        if (!isMember) {
          await chatService.addUserToRoom(roomId, socket.user.id);
          logger.info(`User ${socket.user.username} (id: ${socket.user.id}) joined room ${chatRoom.name} via Socket.IO`);
          io.to(roomId).emit('userJoined', { userId: socket.user.id, username: socket.user.username, roomId: roomId });
        }


        socket.join(roomId);
        logger.info(`${socket.user.username} joined Socket.IO room: ${roomId}`);

        // Track users in rooms for presence
        if (!usersInRooms[roomId]) {
          usersInRooms[roomId] = {};
        }
        usersInRooms[roomId][socket.id] = { userId: socket.user.id, username: socket.user.username };

        // Broadcast updated user list for this room
        io.to(roomId).emit('roomUsers', Object.values(usersInRooms[roomId]));

        // Load recent messages
        const messages = await chatService.getRoomMessages(roomId, { limit: 50, offset: 0 }); // Fetch last 50 messages
        callback({ status: 'ok', messages, room: chatRoom });

      } catch (error) {
        logger.error(`Error joining room ${roomId} for user ${socket.user.username}:`, error.message);
        callback({ status: 'error', message: error.message });
      }
    });

    socket.on('sendMessage', async ({ roomId, content }, callback) => {
      try {
        if (!socket.rooms.has(roomId)) {
          throw new Error('User is not in this room.');
        }
        if (!content || content.trim() === '') {
          throw new Error('Message content cannot be empty.');
        }

        const message = await chatService.saveMessage(roomId, socket.user.id, content.trim());
        io.to(roomId).emit('message', message);
        callback({ status: 'ok', message: 'Message sent.' });
      } catch (error) {
        logger.error(`Error sending message to room ${roomId} by ${socket.user.username}:`, error.message);
        callback({ status: 'error', message: error.message });
      }
    });

    socket.on('leaveRoom', async (roomId, callback) => {
      try {
        socket.leave(roomId);
        logger.info(`${socket.user.username} left Socket.IO room: ${roomId}`);

        // Remove user from tracking
        if (usersInRooms[roomId]) {
          delete usersInRooms[roomId][socket.id];
          // If no more users in the room, remove the room entry
          if (Object.keys(usersInRooms[roomId]).length === 0) {
            delete usersInRooms[roomId];
          } else {
            io.to(roomId).emit('roomUsers', Object.values(usersInRooms[roomId]));
          }
        }

        // Optionally remove user from DB room membership if this is a 'permanent' leave
        // await chatService.removeUserFromRoom(roomId, socket.user.id);
        io.to(roomId).emit('userLeft', { userId: socket.user.id, username: socket.user.username, roomId: roomId });

        callback({ status: 'ok', message: 'Left room successfully.' });
      } catch (error) {
        logger.error(`Error leaving room ${roomId} for user ${socket.user.username}:`, error.message);
        callback({ status: 'error', message: error.message });
      }
    });

    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.user.username} (${socket.id})`);
      // Clean up user from all rooms they might be in
      for (const roomId in usersInRooms) {
        if (usersInRooms[roomId][socket.id]) {
          delete usersInRooms[roomId][socket.id];
          if (Object.keys(usersInRooms[roomId]).length === 0) {
            delete usersInRooms[roomId];
          } else {
            io.to(roomId).emit('roomUsers', Object.values(usersInRooms[roomId]));
          }
          io.to(roomId).emit('userLeft', { userId: socket.user.id, username: socket.user.username, roomId: roomId });
        }
      }
    });

    // Handle Socket.IO errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.user ? socket.user.username : 'unknown'}:`, error);
    });
  });

  return io;
};

module.exports = initializeSocketIO;
```