```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'auth/AuthContext';
import * as authService from 'auth/auth.service';
import { User } from 'types';
import './Profile.css';

const Profile: React.FC = () => {
  const { user: authUser, isAuthenticated, loading: authLoading, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }
    if (authUser) {
      setUsername(authUser.username);
      setEmail(authUser.email);
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!authUser) {
      setError('User not loaded.');
      setLoading(false);
      return;
    }

    try {
      const updatedUser = await authService.updateMyProfile({ username, email });
      updateUser(updatedUser); // Update context and local storage
      setSuccessMessage('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (!isAuthenticated || !authUser) {
    return <div className="profile-container error-message">Please log in to view your profile.</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>My Profile</h2>
        {successMessage && <p className="success-message">{successMessage}</p>}
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading} className="profile-button">
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
        <button onClick={logout} className="logout-button">Logout</button>
      </div>
    </div>
  );
};

export default Profile;
```