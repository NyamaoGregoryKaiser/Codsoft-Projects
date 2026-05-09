```javascript
import React, { useEffect, useState } from 'react';
import * as userApi from '../api/user';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userApi.getAllUsers();
        setUsers(data);
      } catch (err) {
        setError(err.detail || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return <div className="container">Loading users...</div>;
  }

  if (error) {
    return <div className="container error-message">{error}</div>;
  }

  return (
    <div className="container">
      <h2>Admin - Manage Users</h2>
      {users.length === 0 ? (
        <p>No users registered yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Admin</th>
              <th>Active</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>{user.first_name || 'N/A'}</td>
                <td>{user.last_name || 'N/A'}</td>
                <td>{user.is_admin ? 'Yes' : 'No'}</td>
                <td>{user.is_active ? 'Yes' : 'No'}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UsersPage;
```