import React, { useState, useEffect } from 'react';
import userService from '../api/userService';
import { useAuth } from '../auth/AuthContext'; // To potentially exclude current admin from delete option

function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await userService.getAllUsers();
        setUsers(response.data.data.users);
      } catch (err) {
        setError('Failed to load users. Only admins can view this page.');
        console.error('Error fetching users:', err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await userService.deleteUser(userId);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
      } catch (err) {
        setError('Failed to delete user.');
        console.error('Error deleting user:', err);
      }
    }
  };

  if (loading) {
    return <div className="text-center text-xl mt-10">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 mt-10 text-xl">{error}</div>;
  }

  return (
    <div className="py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">User Management (Admin)</h1>
      <div className="bg-white p-8 rounded-lg shadow-md">
        {users.length === 0 ? (
          <p className="text-gray-600">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Username</th>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Role</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{user.username}</td>
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">{user.role}</td>
                    <td className="py-2 px-4 border-b">
                      {currentUser && currentUser.id !== user.id && ( // Prevent deleting self
                        <button onClick={() => handleDeleteUser(user.id)} className="btn btn-danger !px-3 !py-1 text-sm">
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;