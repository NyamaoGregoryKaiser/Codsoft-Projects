'use client';

import { useAuth } from '../layout';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import useSWR from 'swr';

export default function ProfilePage() {
  const { isAuthenticated, user, setUserProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch profile data with SWR
  const { data: profileData, error: swrError, isLoading, mutate } = useSWR(isAuthenticated ? '/users/profile' : null, api.getProfile);

  useEffect(() => {
    if (!isAuthenticated && !isLoading && !swrError) {
      router.push('/');
    }
    if (profileData?.user) {
        setUserProfile(profileData.user); // Update context user with fresh data
        setUsername(profileData.user.username);
    }
  }, [isAuthenticated, isLoading, swrError, router, profileData, setUserProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const updates = {};
    if (username && username !== user?.username) {
      updates.username = username;
    }
    if (password) {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      setMessage('No changes to save.');
      setIsEditing(false);
      return;
    }

    try {
      const response = await api.updateProfile(updates);
      setMessage(response.message);
      setError('');
      setPassword(''); // Clear password field after update
      setIsEditing(false);
      mutate(); // Re-fetch profile data using SWR
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(err.response?.message || err.message || 'Failed to update profile.');
    }
  };

  if (!isAuthenticated || isLoading) {
    return <div className="text-center text-lg mt-8">Loading profile...</div>;
  }

  if (swrError) {
    return <div className="text-center text-lg mt-8 text-red-500">Error loading profile: {swrError.info?.message || swrError.message}</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg mt-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Profile</h2>

      {message && <p className="mb-4 text-green-600 text-center">{message}</p>}
      {error && <p className="mb-4 text-red-600 text-center">{error}</p>}

      {!isEditing ? (
        <div className="space-y-4">
          <p className="text-gray-700"><strong className="font-semibold">ID:</strong> {user?.id}</p>
          <p className="text-gray-700"><strong className="font-semibold">Username:</strong> {user?.username}</p>
          <p className="text-gray-700"><strong className="font-semibold">Role:</strong> {user?.role}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-700 text-sm font-bold mb-2">
              Username:
            </label>
            <input
              type="text"
              id="username"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              New Password:
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength={6}
            />
          </div>
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setUsername(user?.username || ''); // Reset to current username
                setPassword('');
                setError('');
                setMessage('');
              }}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
```

### `frontend/src/components/AuthForm.js`
```javascript