```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { user: authUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setProfile(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        email: response.data.email || '',
      });
    } catch (err) {
      toast.error('Failed to load profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [authUser]); // Refetch if authUser changes

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updatedProfile = await api.patch('/users/profile', formData);
      setProfile(updatedProfile.data);
      setEditMode(false);
      toast.success('Profile updated successfully!');
      // Update local storage user data to reflect changes
      localStorage.setItem('user', JSON.stringify({ ...authUser, ...updatedProfile.data }));
    } catch (err) {
      toast.error('Failed to update profile.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;
  if (!profile) return <div className="p-6 text-center text-red-500">Profile not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-600">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <p className="flex items-center text-lg text-gray-800">
              <UserIcon className="h-6 w-6 mr-2 text-indigo-500" />
              <span className="font-medium">Name:</span> {profile.firstName} {profile.lastName}
            </p>
            <p className="flex items-center text-lg text-gray-800">
              <EnvelopeIcon className="h-6 w-6 mr-2 text-indigo-500" />
              <span className="font-medium">Email:</span> {profile.email}
            </p>
            <p className="flex items-center text-lg text-gray-800">
              <span className="font-medium">Role:</span> {profile.role}
            </p>
            <p className="text-gray-600 text-sm mt-6">
              Account created on: {new Date(profile.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
```