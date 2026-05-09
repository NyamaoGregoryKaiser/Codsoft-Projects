import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';

function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); // Email is read-only for simplicity
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMessage({ type: '', text: '' });
    try {
      const response = await apiClient.put('/users/me', { full_name: fullName });
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      // Re-fetch auth context to update user state globally
      checkAuth();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    setPasswordMessage({ type: '', text: '' });
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      setIsPasswordLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      setIsPasswordLoading(false);
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordMessage({ type: 'error', text: 'New password cannot be the same as current password.' });
      setIsPasswordLoading(false);
      return;
    }
    try {
      await apiClient.put('/users/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div>
      <h2 className="page-title">Your Profile</h2>

      <div className="card">
        <h3>Update Profile Information</h3>
        {profileMessage.text && (
          <p className={profileMessage.type === 'success' ? 'success-message' : 'error-message'}>
            {profileMessage.text}
          </p>
        )}
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isProfileLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} disabled readOnly /> {/* Email is read-only */}
            <small>Email cannot be changed via profile page. Contact support.</small>
          </div>
          <button type="submit" disabled={isProfileLoading}>
            Update Profile {isProfileLoading && <span className="spinner"></span>}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Change Password</h3>
        {passwordMessage.text && (
          <p className={passwordMessage.type === 'success' ? 'success-message' : 'error-message'}>
            {passwordMessage.text}
          </p>
        )}
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={isPasswordLoading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isPasswordLoading}
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
              disabled={isPasswordLoading}
            />
          </div>
          <button type="submit" disabled={isPasswordLoading}>
            Change Password {isPasswordLoading && <span className="spinner"></span>}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;
```