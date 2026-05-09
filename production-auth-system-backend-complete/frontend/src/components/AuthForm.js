import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function AuthForm({ type, onSubmit, isLoading, errorMessage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register') {
      onSubmit({ email, password, full_name: fullName });
    } else {
      onSubmit({ email, password });
    }
  };

  const title = type === 'register' ? 'Register' : 'Login';
  const buttonText = type === 'register' ? 'Register' : 'Login';

  return (
    <div className="auth-form-container">
      <h2>{title}</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <form onSubmit={handleSubmit}>
        {type === 'register' && (
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        )}
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
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
          {buttonText} {isLoading && <span className="spinner"></span>}
        </button>
      </form>
      {type === 'login' ? (
        <>
          <Link to="/register" className="link-text">Don't have an account? Register</Link>
          <Link to="/forgot-password" className="link-text">Forgot Password?</Link>
        </>
      ) : (
        <Link to="/login" className="link-text">Already have an account? Login</Link>
      )}
    </div>
  );
}

export default AuthForm;
```