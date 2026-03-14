```javascript
/**
 * @file Manages Socket.IO connections and real-time event handling.
 * @module socket
 */

const { Server } = require('socket.io');
const { User, Room, Message } = require('./models');
const { verifyTokenSocket } = require('./utils/jwt');
const logger = require('./utils/logger');
const messageService = require('./services/messageService');
const roomService = require('./services/roomService');
const { APIError } = require('./utils/apiErrors');

let io;

/**
 * Initializes the Socket.IO server.
 * @param {object} httpServer - The HTTP server instance to attach Socket.IO to.
 * @param {object} app - The Express app instance to set the io object.
 */
exports.initSocket = (httpServer, app) => {
    io = new Server(httpServer, {
        cors: {
            origin: app.get('clientUrl'), // Allow CORS from your frontend URL
            methods: ['GET', 'POST'],
            credentials: true,
        },
        transports: ['websocket', 'polling'], // Prioritize websocket
    });

    app.set('io', io); // Store io instance in app for access in controllers

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            logger.warn('Socket connection rejected: No authentication token provided.');
            return next(new APIError('Authentication token missing.', 401));
        }
        try {
            const decoded = verifyTokenSocket(token);
            const user = await User.findByPk(decoded.id, {
                attributes: ['id', 'username', 'email', 'status', 'lastSeen']
            });
            if (!user) {
                logger.warn(`Socket connection rejected: User ${decoded.id} not found.`);
                return next(new APIError('User not found.', 401));
            }
            socket.user = user; // Attach user to socket object
            logger.info(`Socket authenticated for user: ${user.username} (${user.id})`);
            next();
        } catch (error) {
            logger.error('Socket authentication failed:', error.message);
            return next(new APIError('Authentication failed.', 401));
        }
    });

    io.on('connection', (socket) => {
        logger.info(`User ${socket.user.username} connected with socket ID: ${socket.id}`);

        // Update user status to online
        socket.user.update({ status: 'online', lastSeen: new Date() })
            .then(() => {
                io.emit('user:status:update', { userId: socket.user.id, status: 'online', username: socket.user.username });
                logger.debug(`Emitted 'user:status:update' for ${socket.user.username} to online`);
            })
            .catch(err => logger.error(`Failed to update user status to online for ${socket.user.username}: ${err.message}`));

        // Automatically join user to all rooms they are a member of
        socket.user.getRooms().then(rooms => {
            rooms.forEach(room => {
                socket.join(room.id);
                logger.debug(`User ${socket.user.username} joined Socket.IO room: ${room.name} (${room.id})`);
            });
        }).catch(err => logger.error(`Failed to auto-join rooms for ${socket.user.username}: ${err.message}`));


        // Event: user sends a chat message
        socket.on('chat:message', async (data, callback) => {
            const { roomId, content } = data;
            if (!roomId || !content) {
                return callback({ success: false, message: 'Room ID and content are required.' });
            }

            try {
                // Use the service to handle business logic and persistence
                const message = await messageService.sendMessage(socket.user.id, roomId, content);

                // Broadcast message to all clients in the room
                io.to(roomId).emit('chat:message', message.toJSON());
                logger.info(`Message sent to room ${roomId} by ${socket.user.username}: ${content.substring(0, 30)}...`);
                callback({ success: true, message: 'Message sent', data: message.toJSON() });
            } catch (error) {
                logger.error(`Error sending message by ${socket.user.username} in room ${roomId}:`, error.message);
                callback({ success: false, message: error.message || 'Failed to send message.' });
            }
        });

        // Event: user joins a room (via UI action, beyond initial auto-join)
        socket.on('room:join', async (roomId, callback) => {
            if (!roomId) {
                return callback({ success: false, message: 'Room ID is required.' });
            }
            try {
                // Ensure user is added to the database relationship first
                await roomService.joinRoom(roomId, socket.user.id);
                socket.join(roomId); // Add socket to the Socket.IO room
                io.to(roomId).emit('room:user:join', { userId: socket.user.id, username: socket.user.username, roomId });
                logger.info(`User ${socket.user.username} joined room ${roomId}`);
                callback({ success: true, message: `Joined room ${roomId}` });
            } catch (error) {
                logger.error(`Error joining room ${roomId} by ${socket.user.username}:`, error.message);
                callback({ success: false, message: error.message || 'Failed to join room.' });
            }
        });

        // Event: user leaves a room
        socket.on('room:leave', async (roomId, callback) => {
            if (!roomId) {
                return callback({ success: false, message: 'Room ID is required.' });
            }
            try {
                await roomService.leaveRoom(roomId, socket.user.id);
                socket.leave(roomId); // Remove socket from the Socket.IO room
                io.to(roomId).emit('room:user:leave', { userId: socket.user.id, username: socket.user.username, roomId });
                logger.info(`User ${socket.user.username} left room ${roomId}`);
                callback({ success: true, message: `Left room ${roomId}` });
            } catch (error) {
                logger.error(`Error leaving room ${roomId} by ${socket.user.username}:`, error.message);
                callback({ success: false, message: error.message || 'Failed to leave room.' });
            }
        });

        // Event: user disconnects
        socket.on('disconnect', () => {
            logger.info(`User ${socket.user.username} disconnected with socket ID: ${socket.id}`);
            // Update user status to offline after a delay to account for brief disconnections/reconnections
            setTimeout(() => {
                // Check if user has reconnected with a new socket within the timeout
                const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
                    s => s.user && s.user.id === socket.user.id
                );
                if (connectedSockets.length === 0) { // If no active sockets for this user
                    socket.user.update({ status: 'offline', lastSeen: new Date() })
                        .then(() => {
                            io.emit('user:status:update', { userId: socket.user.id, status: 'offline', username: socket.user.username });
                            logger.debug(`Emitted 'user:status:update' for ${socket.user.username} to offline`);
                        })
                        .catch(err => logger.error(`Failed to update user status to offline for ${socket.user.username}: ${err.message}`));
                }
            }, 5000); // 5 seconds grace period
        });

        socket.on('error', (err) => {
            logger.error(`Socket error for user ${socket.user.username} (${socket.id}): ${err.message}`, err);
        });
    });
};

/**
 * Gets the initialized Socket.IO instance.
 * @returns {object} The Socket.IO server instance.
 * @throws {Error} If Socket.IO has not been initialized.
 */
exports.getIo = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket first.');
    }
    return io;
};
```