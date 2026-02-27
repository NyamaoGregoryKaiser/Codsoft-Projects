import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import * as authApi from '../api/auth'; // Assuming you have auth API calls
import api from '../api';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                try {
                    const response = await authApi.getMe();
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Failed to load user:', error);
                    localStorage.removeItem('token');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const handleAuthResponse = (data: AuthResponse) => {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    };

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const response = await authApi.login(email, password);
            handleAuthResponse(response.data);
        } finally {
            setLoading(false);
        }
    };

    const register = async (firstName: string, lastName: string, email: string, password: string) => {
        setLoading(true);
        try {
            const response = await authApi.register(firstName, lastName, email, password);
            handleAuthResponse(response.data);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
    };

    const isAuthenticated = !!user && !!token;

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};