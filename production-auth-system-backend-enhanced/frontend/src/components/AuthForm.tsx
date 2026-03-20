import React, { useState } from 'react';
import './AuthForm.css'; // Simple CSS for styling

interface AuthFormProps {
  type: 'login' | 'register';
  onSubmit: (email: string, password: string) => Promise<void>;
  onForgotPassword?: (email: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onSubmit, onForgotPassword, loading, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(email, password);
    } catch (err) {
      // Error handled by parent component's state
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordMessage(null);
    setForgotPasswordError(null);
    if (onForgotPassword) {
      try {
        await onForgotPassword(forgotPasswordEmail);
        setForgotPasswordMessage('If an account with that email exists, a password reset link has been sent.');
      } catch (err: any) {
        setForgotPasswordError(err.response?.data?.message || 'Failed to send reset link.');
      }
    }
  };

  const title = type === 'login' ? 'Login' : 'Register';
  const buttonText = type === 'login' ? 'Login' : 'Register';

  return (
    <div className="auth-form-container">
      <h2>{title}</h2>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
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
            disabled={loading}
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : buttonText}
        </button>
      </form>

      {type === 'login' && onForgotPassword && (
        <p className="forgot-password-link">
          <button type="button" onClick={() => setShowForgotPassword(!showForgotPassword)} disabled={loading}>
            {showForgotPassword ? 'Back to Login' : 'Forgot Password?'}
          </button>
        </p>
      )}

      {showForgotPassword && (
        <div className="forgot-password-section">
          <h3>Reset Password</h3>
          {forgotPasswordMessage && <p className="success-message">{forgotPasswordMessage}</p>}
          {forgotPasswordError && <p className="error-message">{forgotPasswordError}</p>}
          <form onSubmit={handleForgotPasswordSubmit}>
            <div className="form-group">
              <label htmlFor="forgotEmail">Email:</label>
              <input
                type="email"
                id="forgotEmail"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AuthForm;