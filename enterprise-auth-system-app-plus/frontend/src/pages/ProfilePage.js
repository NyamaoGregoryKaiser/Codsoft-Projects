```javascript
import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import * as userApi from '../api/user';

const ProfilePage = () => {
  const { user, loading, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '', // For password change
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        password: '', // Reset password field
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const dataToUpdate = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      // Only include password if it's provided
      if (formData.password) {
        dataToUpdate.password = formData.password;
      }

      const updatedUser = await userApi.updateCurrentUser(dataToUpdate);
      updateUser(updatedUser); // Update user in AuthContext
      setMessage('Profile updated successfully!');
      setFormData(prev => ({ ...prev, password: '' })); // Clear password field after update
      setIsEditing(false);
    } catch (err) {
      setError(err.detail || 'Failed to update profile.');
    }
  };

  if (loading || !user) {
    return <div className="container">Loading profile...</div>;
  }

  return (
    <div className="container">
      <h2>User Profile</h2>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}

      {!isEditing ? (
        <div>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>First Name:</strong> {user.first_name || 'N/A'}</p>
          <p><strong>Last Name:</strong> {user.last_name || 'N/A'}</p>
          <p><strong>Role:</strong> {user.is_admin ? 'Administrator' : 'User'}</p>
          <p><strong>Account Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
          <button onClick={() => setIsEditing(true)} className="button">Edit Profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="first_name">First Name:</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="last_name">Last Name:</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Change Password (leave blank to keep current):</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              placeholder="Enter new password"
            />
          </div>
          <button type="submit" className="button">Save Changes</button>
          <button type="button" onClick={() => setIsEditing(false)} className="button" style={{ marginLeft: '10px', backgroundColor: '#6c757d' }}>Cancel</button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
```