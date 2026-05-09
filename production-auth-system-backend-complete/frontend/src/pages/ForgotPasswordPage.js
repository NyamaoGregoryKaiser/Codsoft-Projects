import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setMessage({ type: 'success', text: 'If an account with that email exists, a password reset link has been sent to your inbox.' });
      setEmail(''); // Clear email field
    } catch (err) {
      // For security, the backend always returns a generic success message,
      // so we don't differentiate between existing/non-existing emails.
      setMessage({ type: 'success', text: 'If an account with that email exists, a password reset link has been sent to your inbox.' });
      console.error(err); // Log actual error for debugging
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Forgot Password</h2>
      {message.text && (
        <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Enter your email address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          Send Reset Link {isLoading && <span className="spinner"></span>}
        </button>
      </form>
      <Link to="/login" className="link-text">Back to Login</Link>
    </div>
  );
}

export default ForgotPasswordPage;
```