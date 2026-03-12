import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    old_password: '',
    new_password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        old_password: '',
        new_password: '',
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

    const updateData = {};
    if (formData.username !== user.username) updateData.username = formData.username;
    if (formData.email !== user.email) updateData.email = formData.email;
    if (formData.old_password && formData.new_password) {
      updateData.old_password = formData.old_password;
      updateData.new_password = formData.new_password;
    } else if (formData.old_password || formData.new_password) {
        setError("Both old and new password are required to change password.");
        return;
    }
    
    if (Object.keys(updateData).length === 0) {
        setMessage("No changes to save.");
        return;
    }

    try {
      const response = await api.put('/users/me', updateData);
      setUser(response.data); // Update user context
      setMessage('Profile updated successfully!');
      setFormData({ ...formData, old_password: '', new_password: '' }); // Clear password fields
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen text-xl">Loading user data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="container mx-auto bg-white p-8 rounded-lg shadow-lg max-w-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Profile</h1>
        
        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="pt-4 border-t border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
            <div>
              <label htmlFor="old_password" className="block text-sm font-medium text-gray-700">Old Password</label>
              <input
                type="password"
                name="old_password"
                id="old_password"
                value={formData.old_password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                name="new_password"
                id="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
```