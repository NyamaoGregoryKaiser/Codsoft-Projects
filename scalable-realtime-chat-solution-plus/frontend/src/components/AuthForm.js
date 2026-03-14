```javascript
/**
 * @file Reusable authentication form component for login and registration.
 * @module components/AuthForm
 */

import React, { useState } from 'react';
import './AuthForm.css';

const AuthForm = ({ type, onSubmit, isLoading, errorMessage }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const isRegister = type === 'register';

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegister) {
            onSubmit(username, email, password);
        } else {
            onSubmit(email, password); // Identifier could be email or username
        }
    };

    return (
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2>{isRegister ? 'Register' : 'Login'}</h2>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            {isRegister && (
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                </div>
            )}
            <div className="form-group">
                <label htmlFor="email">{isRegister ? 'Email:' : 'Username/Email:'}</label>
                <input
                    type="text"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <button type="submit" disabled={isLoading}>
                {isLoading ? 'Loading...' : (isRegister ? 'Register' : 'Login')}
            </button>
        </form>
    );
};

export default AuthForm;
```