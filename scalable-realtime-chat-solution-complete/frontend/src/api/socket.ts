```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket || !socket.connected) {
    const token = localStorage.getItem('token');
    if (token) {
      socket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket'],
      });

      socket.on('connect', () => {
        console.log('Socket connected:', socket?.id);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        // Optionally handle re-authentication or UI updates
      });

      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        // You might want to handle specific errors, e.g., invalid token
        if (err.message === 'Authentication error: Invalid token' || err.message === 'Authentication error: User not found') {
          console.error('Socket authentication failed, clearing token.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          // Dispatch a global logout or redirect to login
          // window.location.href = '/auth';
        }
      });
    } else {
      console.warn('Cannot establish socket connection: No token found.');
      // Handle scenario where token is missing (e.g., user not logged in)
      throw new Error('No authentication token found.');
    }
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};
```