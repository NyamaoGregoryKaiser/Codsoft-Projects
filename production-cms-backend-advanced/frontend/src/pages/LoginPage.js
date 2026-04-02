import React from 'react';
import LoginForm from '../components/LoginForm';
import { isAuthenticated } from '../api/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();

    // If already authenticated, redirect to home
    if (isAuthenticated()) {
        navigate('/');
        return null; // Don't render anything
    }

    const handleLoginSuccess = () => {
        // This function will be called on successful login from LoginForm
        navigate('/');
    };

    return (
        <div>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
        </div>
    );
};

export default LoginPage;