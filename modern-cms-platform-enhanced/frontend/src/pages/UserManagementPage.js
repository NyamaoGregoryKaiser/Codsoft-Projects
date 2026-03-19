```javascript
import React, { useEffect, useState } from 'react';
import { getUsers, updateUser, deleteUser } from '../api/posts'; // Reusing posts API file for users
import { useAuth } from '../contexts/AuthContext'; // To get current user details

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth(); // Current logged-in user

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError('Failed to fetch users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    // Prevent changing your own role or setting an invalid role
    if (userId === currentUser.id) {
      alert("You cannot change your own role through this interface.");
      return;
    }
    if (!['admin', 'author', 'viewer'].includes(newRole)) {
        alert("Invalid role selected.");
        return;
    }

    try {
      await updateUser(userId, { role: newRole });
      await fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
      console.error(err);
    }
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser.id) {
        alert("You cannot delete your own account.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        await fetchUsers(); // Refresh list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user.');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading users...</div>;
  }

  if (error) {
    return <div className="dashboard-container error-message">{error}</div>;
  }

  return (
    <div className="dashboard-container">
      <h1>User Management</h1>

      <div className="dashboard-section">
        <h2>All Users</h2>
        {users.length > 0 ? (
          <div className="dashboard-list">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={user.id === currentUser.id} // Cannot change own role
                      >
                        <option value="admin">Admin</option>
                        <option value="author">Author</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                    <td className="actions">
                      <button 
                        onClick={() => handleDelete(user.id)} 
                        className="btn-delete btn-small"
                        disabled={user.id === currentUser.id} // Cannot delete own account
                      >
                        Delete
                      </button>
                      {/* Add option to toggle isActive status */}
                      <button
                        onClick={() => updateUser(user.id, { isActive: !user.isActive }).then(fetchUsers)}
                        className="btn-primary btn-small"
                        style={{backgroundColor: user.isActive ? '#dc3545' : '#28a745'}}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No users found.</p>
        )}
      </div>
    </div>
  );
}

export default UserManagementPage;
```