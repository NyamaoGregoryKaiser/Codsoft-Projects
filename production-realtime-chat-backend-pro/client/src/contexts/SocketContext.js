```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeSocket, getSocket, disconnectSocket as disconnectSocketIo } from '../api/socket';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user, loading: authLoading } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true); // Loading specifically for socket connection

  const disconnectSocket = () => {
    disconnectSocketIo();
    setSocket(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        const token = localStorage.getItem('token');
        if (token && !socket) { // Only initialize if authenticated and socket not already set
          setLoading(true);
          const newSocket = initializeSocket(token);
          setSocket(newSocket);
          newSocket.on('connect', () => setLoading(false));
          newSocket.on('disconnect', () => setLoading(true)); // Set loading true if disconnected
          newSocket.on('connect_error', () => setLoading(true));
        } else if (!isAuthenticated && socket) { // Disconnect if no longer authenticated
          disconnectSocket();
        }
      } else if (socket) { // If user logs out or is not authenticated, disconnect
        disconnectSocket();
      } else {
        setLoading(false); // If not authenticated and no socket, stop loading
      }
    }
    // Cleanup on unmount or if isAuthenticated changes to false
    return () => {
      if (!isAuthenticated && socket) {
        disconnectSocket();
      }
    };
  }, [isAuthenticated, user, authLoading]); // Dependency on isAuthenticated and user

  return (
    <SocketContext.Provider value={{ socket, loading, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};
```