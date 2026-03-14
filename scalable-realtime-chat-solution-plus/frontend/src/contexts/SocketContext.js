```javascript
/**
 * @file React Context for providing the Socket.IO instance to child components.
 * This can be used in conjunction with AuthContext's socket or separately if
 * socket initialization is decoupled. For this project, AuthContext handles it.
 * This file is kept as an example of dedicated Socket Context.
 * @module contexts/SocketContext
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext'; // Import AuthContext to get the token
import config from '../config';

const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const { isAuthenticated, user, logout } = useContext(AuthContext);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (isAuthenticated && user && !socket) {
            const token = localStorage.getItem('token'); // Get token directly if AuthContext doesn't pass it

            const newSocket = io(config.socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                if (err.message === 'Authentication failed.') {
                    console.warn('Socket authentication failed. Token might be invalid or expired. Logging out.');
                    logout(); // Trigger logout from AuthContext
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
                setSocket(null);
            };
        } else if (!isAuthenticated && socket) {
            // Disconnect socket if user logs out
            socket.disconnect();
            setSocket(null);
        }
    }, [isAuthenticated, user, socket, logout]); // Depend on isAuthenticated and user to manage socket lifecycle

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export { SocketContext, SocketProvider };
```