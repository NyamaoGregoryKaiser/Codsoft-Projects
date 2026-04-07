```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe as updateMeService } from '../services/authService';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './FormPage.css';

const ProfilePage = () => {
  const { user, loading: authLoading, error: authError, updateUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedUser = await updateMeService({ username, email });
      updateUser(updatedUser); // Update user in AuthContext
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <Loader message="Loading profile..." />;
  }

  if (authError) {
    return <Alert message={authError} type="error" />;
  }

  if (!user) {
    return <Alert message="Please log in to view your profile." type="info" />;
  }

  return (
    <div className="form-page-container">
      <h2>My Profile</h2>
      {(error || authError) && <Alert message={error || authError} type="error" onClose={() => setError(null)} />}
      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="form-container">
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
          <label>Role:</label>
          <input type="text" value={user.role} disabled className="disabled-input" />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
```