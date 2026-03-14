```javascript
/**
 * @file Registration page component.
 * @module pages/RegisterPage
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthForm from '../components/AuthForm';
import useAuth from '../hooks/useAuth';
import './AuthPage.css';

const RegisterPage = () => {
    const { isAuthenticated, register, loading, error } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            // Redirect to chat if already authenticated
            // navigate('/chat'); // Handled by ProtectedRoute
        }
    }, [isAuthenticated]);

    const handleRegisterSubmit = (username, email, password) => {
        register(username, email, password);
    };

    return (
        <div className="auth-page">
            <AuthForm
                type="register"
                onSubmit={handleRegisterSubmit}
                isLoading={loading}
                errorMessage={error}
            />
            <p>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default RegisterPage;
```