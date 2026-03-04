```typescript
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { config } from '../config';
import { logger } from '../config/logger';
import { prisma } from '../config/prisma';

// Map to store user's current channel and their socket ID
interface UserSocket {
  socketId: string;
  userId: string;
  username: string;
  currentChannelId?: string;
}

const connectedUsers = new Map<string, UserSocket>(); // Map of userId to UserSocket
const socketIdToUser = new Map<string, string>(); // Map of socketId to userId

export const initializeSocketIO = (io: SocketIOServer) => {
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('Socket connection denied: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true }
      });

      if (!user) {
        logger.warn(`Socket connection denied: User not found for token ID ${decoded.id}`);
        return next(new Error('Authentication error: User not found'));
      }

      (socket as any).user = user; // Attach user to socket
      next();
    } catch (err) {
      logger.error(`Socket authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`User connected: ${user.username} (ID: ${user.id}, Socket ID: ${socket.id})`);

    connectedUsers.set(user.id, { socketId: socket.id, userId: user.id, username: user.username });
    socketIdToUser.set(socket.id, user.id);

    // Emit global user online status
    io.emit('userOnline', { userId: user.id, username: user.username });

    socket.on('joinChannel', async (channelId: string) => {
      // Leave previous channel if any
      const previousChannelId = connectedUsers.get(user.id)?.currentChannelId;
      if (previousChannelId && previousChannelId !== channelId) {
        socket.leave(previousChannelId);
        logger.debug(`${user.username} left channel ${previousChannelId}`);
        io.to(previousChannelId).emit('userLeftChannel', { userId: user.id, username: user.username, channelId: previousChannelId });
      }

      // Check if user is allowed to join the channel (membership check)
      try {
        const membership = await prisma.channelMembership.findUnique({
          where: {
            userId_channelId: {
              userId: user.id,
              channelId: channelId,
            },
          },
        });
        if (!membership) {
          logger.warn(`User ${user.username} denied joining channel ${channelId}: Not a member.`);
          socket.emit('channelJoinError', `Access denied: You are not a member of channel "${channelId}".`);
          return;
        }

        socket.join(channelId);
        connectedUsers.set(user.id, { ...connectedUsers.get(user.id)!, currentChannelId: channelId });
        logger.info(`User ${user.username} joined channel ${channelId}`);
        io.to(channelId).emit('userJoinedChannel', { userId: user.id, username: user.username, channelId: channelId });

        // Optionally, fetch online users in this channel and emit to the joining user
        const onlineUsersInChannel = Array.from(connectedUsers.values())
          .filter(u => u.currentChannelId === channelId)
          .map(u => ({ id: u.userId, username: u.username }));
        socket.emit('onlineUsersInChannel', { channelId, users: onlineUsersInChannel });

      } catch (error) {
        logger.error(`Error joining channel ${channelId} for user ${user.username}:`, error);
        socket.emit('channelJoinError', `Failed to join channel "${channelId}".`);
      }
    });

    socket.on('leaveChannel', (channelId: string) => {
      socket.leave(channelId);
      connectedUsers.set(user.id, { ...connectedUsers.get(user.id)!, currentChannelId: undefined });
      logger.info(`User ${user.username} left channel ${channelId}`);
      io.to(channelId).emit('userLeftChannel', { userId: user.id, username: user.username, channelId: channelId });
    });

    socket.on('typing', (data: { channelId: string; isTyping: boolean }) => {
      // Broadcast to all other users in the channel
      socket.to(data.channelId).emit('typing', {
        channelId: data.channelId,
        userId: user.id,
        username: user.username,
        isTyping: data.isTyping,
      });
    });

    socket.on('disconnect', () => {
      const disconnectedUserId = socketIdToUser.get(socket.id);
      if (disconnectedUserId) {
        const disconnectedUser = connectedUsers.get(disconnectedUserId);
        if (disconnectedUser) {
          // Remove from connected users map
          connectedUsers.delete(disconnectedUserId);
          socketIdToUser.delete(socket.id);

          // Emit global user offline status
          io.emit('userOffline', { userId: disconnectedUser.userId, username: disconnectedUser.username });
          logger.info(`User disconnected: ${disconnectedUser.username} (ID: ${disconnectedUser.userId}, Socket ID: ${socket.id})`);

          // If they were in a channel, notify others in that channel
          if (disconnectedUser.currentChannelId) {
            io.to(disconnectedUser.currentChannelId).emit('userLeftChannel', {
              userId: disconnectedUser.userId,
              username: disconnectedUser.username,
              channelId: disconnectedUser.currentChannelId,
            });
          }
        }
      }
    });
  });
};

// Function to get active socket for a user (useful for DM or direct notifications)
export const getUserSocketId = (userId: string): string | undefined => {
  return connectedUsers.get(userId)?.socketId;
};

// Export `io` for use in controllers (e.g., to emit messages from REST endpoints)
// This is already imported in messageController.ts as a named export.
// So no need to export `io` from here directly, `server.ts` will do it.
```