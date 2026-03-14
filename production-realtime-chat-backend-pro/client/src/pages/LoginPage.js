```javascript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import '../assets/App.css'; // For styling

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, register, authError } = useAuth();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      const success = await register(username, email, password);
      if (success) {
        // Redirect handled by App.js via isAuthenticated change
      }
    } else {
      const success = await login(email, password);
      if (success) {
        // Redirect handled by App.js via isAuthenticated change
      }
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {isRegister && (
          <div className="auth-form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        )}
        <div className="auth-form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="auth-form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {isRegister && (
          <div className="auth-form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        )}
        { (authError || localError) && (
          <div className="auth-form-error">
            {authError || localError}
          </div>
        )}
        <button type="submit">
          {isRegister ? 'Register' : 'Login'}
        </button>
        <p style={{ marginTop: '1rem', cursor: 'pointer', color: '#007bff' }} onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
        </p>
      </form>
    </div>
  );
};

export default LoginPage;
```