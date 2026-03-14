```javascript
import { io } from 'socket.io-client';

let socket;

export const initializeSocket = (token) => {
  if (token) {
    socket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // Prioritize WebSocket
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });
  } else {
    console.error('Cannot initialize socket without a token.');
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
    socket = null;
  }
};
```