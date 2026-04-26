```javascript
import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import useAuth from '../hooks/useAuth';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get('/users/'); // Admin endpoint
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
    } else {
      setError('You are not authorized to view this page.');
      setLoading(false);
    }
  }, [user, fetchUsers]);

  const handleUpdateUser = async (userId, updateData) => {
    setError('');
    try {
      await axiosInstance.put(`/users/${userId}`, updateData);
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error("Failed to update user:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to update user.');
    }
  };

  const handleDeleteUser = async (userId) => {
    setError('');
    if (user.id === userId) {
      setError("You cannot delete your own admin account.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/users/${userId}`);
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error("Failed to delete user:", err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Failed to delete user.');
    }
  };

  if (loading) return <div className="container">Loading admin data...</div>;
  if (error) return <div className="container alert alert-error">{error}</div>;

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <h3>All Users</h3>
      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Full Name</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Active</th>
                <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.id}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.email}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.full_name || '-'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.role}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>{u.is_active ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                      style={{ marginRight: '5px' }}
                      disabled={user.id === u.id || u.role === 'admin'}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {u.role === 'user' && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleUpdateUser(u.id, { role: 'admin' })}
                            style={{ marginRight: '5px' }}
                        >
                            Make Admin
                        </button>
                    )}
                    {u.role === 'admin' && u.id !== user.id && (
                        <button
                            className="btn btn-secondary"
                            onClick={() => handleUpdateUser(u.id, { role: 'user' })}
                            style={{ marginRight: '5px' }}
                        >
                            Make User
                        </button>
                    )}
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteUser(u.id)}
                      disabled={user.id === u.id || u.role === 'admin'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
```