import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import userService from '../services/user.service';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          const userProfile = await userService.getCurrentUser();
          setProfile(userProfile);
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError(err.message || 'Failed to load profile.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        setError('Please log in to view your profile.');
      }
    };

    fetchProfile();
  }, [isAuthenticated]);

  if (loading) {
    return <div className="profile-container">Loading profile...</div>;
  }

  if (error) {
    return <div className="profile-container error-message">{error}</div>;
  }

  if (!profile) {
    return <div className="profile-container">No profile data available.</div>;
  }

  return (
    <div className="profile-container">
      <h2>My Profile</h2>
      <div className="profile-details">
        <p><strong>Username:</strong> {profile.username}</p>
        <p><strong>Email:</strong> {profile.email}</p>
        <p><strong>Roles:</strong> {profile.roles.join(', ')}</p>
        <p><strong>Member Since:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
        {/* Add more profile details if available in UserProfileDTO */}
      </div>
    </div>
  );
};

export default ProfilePage;