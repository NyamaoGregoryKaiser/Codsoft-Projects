import React, { useContext, useState, useEffect } from 'react';
import AuthContext from '../utils/AuthContext';
import { getUserProfile, updateUser } from '../api/api';

const UserProfilePage = () => {
  const { user, refreshUser, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    // password and role are typically updated through separate, more secure flows or by admins
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const response = await getUserProfile(user.id);
          setProfile(response.data);
          setFormData({
            username: response.data.username,
            email: response.data.email,
          });
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setError('Failed to load user profile.');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [user, refreshUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await updateUser(user.id, formData);
      setProfile(response.data.data); // Update local profile state
      await refreshUser(); // Update user context
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
  };

  if (loading) return <div className="text-center text-gray-600">Loading profile...</div>;
  if (error) return <div className="text-center text-red-500">{error}</div>;
  if (!profile) return <div className="text-center text-gray-600">No profile data available.</div>;

  return (
    <div className="max-w-2xl mx-auto my-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 text-center">User Profile</h1>

      {editMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <p className="text-lg"><strong>Username:</strong> {profile.username}</p>
          <p className="text-lg"><strong>Email:</strong> {profile.email}</p>
          <p className="text-lg"><strong>Role:</strong> <span className="capitalize">{profile.role}</span></p>
          <p className="text-lg"><strong>Status:</strong> <span className="capitalize">{profile.status}</span></p>
          <p className="text-lg"><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString()}</p>
          <p className="text-lg"><strong>Last Login:</strong> {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'Never'}</p>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setEditMode(true)}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Edit Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;