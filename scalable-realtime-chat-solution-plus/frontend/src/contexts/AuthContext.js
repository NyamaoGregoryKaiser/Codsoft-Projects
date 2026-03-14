```javascript
/**
 * @file React Context for managing authentication state globally.
 * @module contexts/AuthContext
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { login, register, logout, getProfile } from '../api/authApi';
import { setToken, getToken, removeToken, setUserInLocalStorage, getUserFromLocalStorage } from '../utils/localStorage';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import config from '../config'; // Frontend config

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getUserFromLocalStorage());
    const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Socket.IO instance for global user status updates
    const [socket, setSocket] = useState(null);

    const initializeSocket = useCallback(() => {
        const token = getToken();
        if (token && !socket) {
            const newSocket = io(config.socketUrl, {
                auth: { token },
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                // Handle potential re-authentication or status updates
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                if (err.message === 'Authentication failed.') {
                    // Redirect to login if socket authentication fails
                    handleLogout();
                }
            });

            newSocket.on('user:status:update', (data) => {
                // console.log('Received user:status:update:', data);
                setUser((prevUser) => {
                    if (prevUser && prevUser.id === data.userId) {
                        return { ...prevUser, status: data.status };
                    }
                    return prevUser;
                });
                // TODO: Also update a global list of users if needed
            });

            setSocket(newSocket);
        } else if (!token && socket) {
            // Disconnect socket if token is removed
            socket.disconnect();
            setSocket(null);
        }
    }, [socket]);

    useEffect(() => {
        const checkAuth = async () => {
            if (getToken()) {
                try {
                    const profile = await getProfile();
                    setUser(profile);
                    setIsAuthenticated(true);
                    setUserInLocalStorage(profile);
                } catch (err) {
                    console.error('Failed to fetch profile on app load:', err);
                    handleLogout(); // Log out if token is invalid
                }
            }
            setLoading(false);
        };

        checkAuth();
        initializeSocket(); // Initialize socket on mount if token exists

        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [initializeSocket]); // Re-run if initializeSocket changes (e.g., due to user logging in/out)


    const handleRegister = async (username, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await register(username, email, password);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            setUserInLocalStorage(data.user);
            initializeSocket(); // Initialize socket after login
            navigate('/chat');
        } catch (err) {
            console.error('Registration failed:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Registration failed.');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (identifier, password) => {
        setLoading(true);
        setError(null);
        try {
            const data = await login(identifier, password);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            setUserInLocalStorage(data.user);
            initializeSocket(); // Initialize socket after login
            navigate('/chat');
        } catch (err) {
            console.error('Login failed:', err.response?.data?.message || err.message);
            setError(err.response?.data?.message || 'Login failed.');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        setLoading(true);
        try {
            await logout();
        } catch (err) {
            console.error('Logout failed on server:', err);
            // Even if server logout fails, clear local state
        } finally {
            removeToken();
            setUser(null);
            setIsAuthenticated(false);
            setUserInLocalStorage(null);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            setLoading(false);
            navigate('/login');
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        error,
        register: handleRegister,
        login: handleLogin,
        logout: handleLogout,
        socket, // Provide socket instance to children
        setUser, // Allow updating user object (e.g., status changes)
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
```