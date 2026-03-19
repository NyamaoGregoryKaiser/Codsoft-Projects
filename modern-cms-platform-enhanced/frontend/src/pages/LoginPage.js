```javascript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isRegister) {
        await register({ username, email, password });
        setMessage('Registration successful! Please log in.');
        // Optionally switch to login form
        setIsRegister(false);
      } else {
        await login({ email, password });
        // Context will handle navigation to dashboard
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="form-container">
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div className="form-group">
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
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </div>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isRegister ? (
          <>
            Already have an account?{' '}
            <span onClick={() => setIsRegister(false)} style={{ cursor: 'pointer', color: '#007bff' }}>
              Login
            </span>
          </>
        ) : (
          <>
            Don't have an account?{' '}
            <span onClick={() => setIsRegister(true)} style={{ cursor: 'pointer', color: '#007bff' }}>
              Register
            </span>
          </>
        )}
      </p>
    </div>
  );
}

export default LoginPage;
```