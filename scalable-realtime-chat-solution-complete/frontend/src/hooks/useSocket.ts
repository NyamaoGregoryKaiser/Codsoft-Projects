```typescript
import { useEffect, useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from 'api/socket';
import { Message, User, TypingStatus } from 'types';
import { useAuth } from 'auth/AuthContext';

interface SocketHandlers {
  onReceiveMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (data: { messageId: string; channelId: string }) => void;
  onUserOnline?: (user: User) => void;
  onUserOffline?: (user: User) => void;
  onUserJoinedChannel?: (data: { userId: string; username: string; channelId: string }) => void;
  onUserLeftChannel?: (data: { userId: string; username: string; channelId: string }) => void;
  onTyping?: (status: TypingStatus) => void;
  onOnlineUsersInChannel?: (data: { channelId: string; users: { id: string; username: string }[] }) => void;
  onChannelJoinError?: (errorMessage: string) => void;
}

export const useSocket = (channelId?: string, handlers?: SocketHandlers) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers; // Keep handlers up-to-date without re-creating useEffect

  const connect = useCallback(() => {
    if (!isAuthenticated || authLoading || socket) return;

    try {
      const newSocket = getSocket();
      setSocket(newSocket);
      console.log('Attempting to connect socket...');
    } catch (error) {
      console.error('Failed to get socket:', error);
    }
  }, [isAuthenticated, authLoading, socket]);

  useEffect(() => {
    connect();

    return () => {
      // Disconnect socket when component unmounts or auth changes to false
      // Only disconnect if this is the last component holding the socket
      // For global socket, manage disconnection in AuthContext logout
      // For channel-specific logic, ensure you leave the channel
      if (channelId && socket) {
        socket.emit('leaveChannel', channelId);
      }
    };
  }, [connect, channelId, socket]); // Rerun connect if isAuthenticated or authLoading changes

  useEffect(() => {
    if (!socket) return;

    // Register event listeners
    socket.on('receiveMessage', (message: Message) => handlersRef.current?.onReceiveMessage?.(message));
    socket.on('messageUpdated', (message: Message) => handlersRef.current?.onMessageUpdated?.(message));
    socket.on('messageDeleted', (data: { messageId: string; channelId: string }) => handlersRef.current?.onMessageDeleted?.(data));
    socket.on('userOnline', (user: User) => handlersRef.current?.onUserOnline?.(user));
    socket.on('userOffline', (user: User) => handlersRef.current?.onUserOffline?.(user));
    socket.on('userJoinedChannel', (data: { userId: string; username: string; channelId: string }) => handlersRef.current?.onUserJoinedChannel?.(data));
    socket.on('userLeftChannel', (data: { userId: string; username: string; channelId: string }) => handlersRef.current?.onUserLeftChannel?.(data));
    socket.on('typing', (status: TypingStatus) => handlersRef.current?.onTyping?.(status));
    socket.on('onlineUsersInChannel', (data: { channelId: string; users: { id: string; username: string }[] }) => handlersRef.current?.onOnlineUsersInChannel?.(data));
    socket.on('channelJoinError', (errorMessage: string) => handlersRef.current?.onChannelJoinError?.(errorMessage));

    // Join channel if provided
    if (channelId && user) {
      socket.emit('joinChannel', channelId);
      console.log(`Emitting joinChannel for ${channelId}`);
    }

    return () => {
      // Clean up event listeners
      socket.off('receiveMessage');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.off('userJoinedChannel');
      socket.off('userLeftChannel');
      socket.off('typing');
      socket.off('onlineUsersInChannel');
      socket.off('channelJoinError');

      // Leave channel if provided, only if socket exists and is connected
      if (channelId && socket && socket.connected && user) {
        // Only emit leave if the user ID matches the context user
        // This prevents other components from emitting leave for a different user
        // which could happen if `user` context changes.
        socket.emit('leaveChannel', channelId);
        console.log(`Emitting leaveChannel for ${channelId}`);
      }
    };
  }, [socket, channelId, user]);

  const emit = useCallback((event: string, data: any) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`Socket not connected, cannot emit event: ${event}`);
    }
  }, [socket]);

  return { socket, emit };
};
```