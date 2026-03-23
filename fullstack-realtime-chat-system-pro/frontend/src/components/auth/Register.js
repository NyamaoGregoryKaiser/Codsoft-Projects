import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../auth/AuthService';
import '../../styles/Auth.css';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await AuthService.register(username, email, password);
      setSuccess('Registration successful! You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      // Error response structure from backend's GlobalExceptionHandler for validation issues
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') { // Generic error message
          setError(err.response.data);
        } else if (err.response.data.message) { // Specific message from custom exception
          setError(err.response.data.message);
        } else if (typeof err.response.data === 'object') { // Field-specific validation errors
          const fieldErrors = Object.values(err.response.data).join(', ');
          setError(`Validation failed: ${fieldErrors}`);
        } else {
          setError('An unexpected error occurred during registration.');
        }
      } else {
        setError('Network error or server unavailable.');
      }
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2>Register</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength="3"
            maxLength="20"
          />
        </div>
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
            minLength="6"
          />
        </div>
        <button type="submit" className="auth-button">Register</button>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;