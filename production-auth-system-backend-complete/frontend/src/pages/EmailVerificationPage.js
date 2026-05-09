import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [message, setMessage] = useState({ type: 'info', text: 'Verifying your email...' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setMessage({ type: 'error', text: 'No verification token found.' });
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        await apiClient.post('/auth/verify-email', { token });
        setMessage({ type: 'success', text: 'Email verified successfully! You can now log in.' });
        // Refresh auth state in case user was logged in before verification
        checkAuth();
        setTimeout(() => navigate('/login'), 3000); // Redirect to login after a delay
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Email verification failed.';
        setMessage({ type: 'error', text: msg });
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="auth-form-container">
      <h2>Email Verification</h2>
      {isLoading && <p>Loading... <span className="spinner"></span></p>}
      {message.type === 'info' && <p>{message.text}</p>}
      {message.type === 'success' && <p className="success-message">{message.text}</p>}
      {message.type === 'error' && <p className="error-message">{message.text}</p>}
    </div>
  );
}

export default EmailVerificationPage;
```