import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    } else {
      setMessage({ type: 'error', text: 'No reset token found in URL.' });
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    if (!token) {
      setMessage({ type: 'error', text: 'Invalid or missing reset token.' });
      setIsLoading(false);
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      setIsLoading(false);
      return;
    }

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword,
      });
      setMessage({ type: 'success', text: 'Your password has been reset successfully! You can now log in with your new password.' });
      setNewPassword('');
      setConfirmNewPassword('');
      // Optionally redirect to login page after a delay
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to reset password. The link might be expired or invalid.';
      setMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>Reset Password</h2>
      {message.text && (
        <p className={message.type === 'success' ? 'success-message' : 'error-message'}>
          {message.text}
        </p>
      )}
      {!token && message.type === 'error' && (
        <p className="error-message">Please ensure you're using the correct reset link from your email.</p>
      )}

      {token && message.type !== 'success' && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button type="submit" disabled={isLoading}>
            Reset Password {isLoading && <span className="spinner"></span>}
          </button>
        </form>
      )}
      <Link to="/login" className="link-text">Back to Login</Link>
    </div>
  );
}

export default ResetPasswordPage;
```