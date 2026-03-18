```javascript
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, loading, user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  const isConnectingRef = useRef(false); // To prevent multiple connection attempts

  const connectSocket = useCallback(() => {
    if (!isAuthenticated || loading || !user || isConnectingRef.current) return;

    const storedTokens = JSON.parse(localStorage.getItem('tokens'));
    if (!storedTokens || !storedTokens.access || !storedTokens.access.token) {
      console.warn('No access token found for Socket.IO connection.');
      // logout(); // Force logout if tokens are missing when trying to connect
      return;
    }

    isConnectingRef.current = true; // Mark as connecting

    console.log('Attempting to connect Socket.IO...');
    const newSocket = io(process.env.REACT_APP_SOCKET_URL, {
      auth: {
        token: storedTokens.access.token,
      },
      transports: ['websocket'], // Prefer websocket
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      setSocket(newSocket);
      isConnectingRef.current = false; // Reset connecting flag
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('Socket.IO disconnected:', reason);
      setSocket(null); // Clear socket on disconnect
      isConnectingRef.current = false; // Reset connecting flag
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        // If server actively disconnected us (e.g., due to auth failure)
        // You might want to force re-login or refresh tokens here.
        // For now, assume API interceptor will handle token refresh.
        // If the backend sends 'Authentication error: Invalid token' on handshake,
        // the client won't even connect, so this 'disconnect' might not directly trigger for auth.
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      if (err.message.includes('Authentication error')) {
        console.error('Socket authentication failed. Forcing logout.');
        logout(); // Force logout if authentication fails
        navigate('/login');
      }
      isConnectingRef.current = false; // Reset connecting flag
    });

    // Clean up on unmount
    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
        console.log('Socket.IO disconnected on cleanup.');
      }
      isConnectingRef.current = false; // Reset connecting flag
    };
  }, [isAuthenticated, loading, user, logout, navigate]);

  useEffect(() => {
    if (isAuthenticated && !loading && user && !socket) {
      connectSocket();
    } else if (!isAuthenticated && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [isAuthenticated, loading, user, socket, connectSocket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```