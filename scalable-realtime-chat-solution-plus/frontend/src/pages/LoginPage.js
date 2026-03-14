```javascript
/**
 * @file Login page component.
 * @module pages/LoginPage
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuth from '../hooks/useAuth';
import './AuthPage.css';

const LoginPage = () => {
    const { isAuthenticated, login, loading, error } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            // Redirect to chat if already authenticated
            // This is handled by useAuth and react-router's ProtectedRoute
            // but can also be explicitly here for immediate visual feedback.
            // navigate('/chat');
        }
    }, [isAuthenticated]);

    const handleLoginSubmit = (identifier, password) => {
        login(identifier, password);
    };

    return (
        <div className="auth-page">
            <AuthForm
                type="login"
                onSubmit={handleLoginSubmit}
                isLoading={loading}
                errorMessage={error}
            />
            <p>
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    );
};

export default LoginPage;
```