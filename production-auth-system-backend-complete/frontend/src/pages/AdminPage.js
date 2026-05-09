import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';

function AdminPage() {
  const { user } = useAuth(); // Current logged-in admin user
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [assignRolesLoading, setAssignRolesLoading] = useState(false);
  const [userActionMessage, setUserActionMessage] = useState({ type: '', text: '' });

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
    }
  };

  const fetchRoles = async () => {
    try {
      // Assuming a /admin/roles endpoint exists or similar for roles
      // For now, let's hardcode or fetch if available
      // Or if roles are fetched as part of user data (like in this example, they are)
      // we can just extract unique roles
      // For this example, we'll imagine a GET /admin/roles endpoint
      // and create some dummy roles if not available.
      // In a real system, you'd fetch from a dedicated roles endpoint.
      const dummyRoles = [
        { id: 1, name: 'admin', description: 'Administrator' },
        { id: 2, name: 'user', description: 'Standard user' },
        { id: 3, name: 'editor', description: 'Content editor' },
      ];
      setRoles(dummyRoles);
    } catch (err) {
      console.error("Could not fetch roles:", err);
      // Fallback to dummy roles if fetching fails
      setRoles([
        { id: 1, name: 'admin', description: 'Administrator' },
        { id: 2, name: 'user', description: 'Standard user' },
        { id: 3, name: 'editor', description: 'Content editor' },
      ]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchUsers();
      await fetchRoles();
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSelectUserForRoles = (user) => {
    setSelectedUserId(user.id);
    setSelectedRoles(user.roles.map(role => role.id));
    setUserActionMessage({ type: '', text: '' }); // Clear messages
  };

  const handleRoleChange = (roleId) => {
    setSelectedRoles(prevRoles =>
      prevRoles.includes(roleId)
        ? prevRoles.filter(id => id !== roleId)
        : [...prevRoles, roleId]
    );
  };

  const handleAssignRoles = async () => {
    if (!selectedUserId) return;
    setAssignRolesLoading(true);
    setUserActionMessage({ type: '', text: '' });
    try {
      await apiClient.post(`/admin/users/${selectedUserId}/roles`, { role_ids: selectedRoles });
      setUserActionMessage({ type: 'success', text: `Roles updated for user ${selectedUserId}` });
      await fetchUsers(); // Refresh user list
      setSelectedUserId(null); // Close role assignment UI
      setSelectedRoles([]);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to assign roles.';
      setUserActionMessage({ type: 'error', text: msg });
    } finally {
      setAssignRolesLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm(`Are you sure you want to delete user ${userId}?`)) {
      setLoading(true); // Re-use loading for full page operation
      setUserActionMessage({ type: '', text: '' });
      try {
        await apiClient.delete(`/admin/users/${userId}`);
        setUserActionMessage({ type: 'success', text: `User ${userId} deleted successfully.` });
        await fetchUsers(); // Refresh user list
      } catch (err) {
        const msg = err.response?.data?.message || err.message || 'Failed to delete user.';
        setUserActionMessage({ type: 'error', text: msg });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <div>Loading admin data...</div>;
  }

  if (error) {
    return <p className="error-message">Error: {error}</p>;
  }

  return (
    <div>
      <h2 className="page-title">Admin Panel</h2>

      {userActionMessage.text && (
        <p className={userActionMessage.type === 'success' ? 'success-message' : 'error-message'}>
          {userActionMessage.text}
        </p>
      )}

      <div className="card">
        <h3>User Management</h3>
        <ul className="user-list">
          {users.map((u) => (
            <li key={u.id}>
              <div>
                <span>{u.full_name || u.email}</span> ({u.email}) - Roles: {u.roles.map(r => r.name).join(', ')}
              </div>
              <div>
                <button onClick={() => handleSelectUserForRoles(u)}>Assign Roles</button>
                {u.id !== user.id && ( // Prevent admin from deleting themselves
                  <button onClick={() => handleDeleteUser(u.id)} style={{ backgroundColor: '#dc3545', marginLeft: '10px' }}>
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {selectedUserId && (
        <div className="card">
          <h3>Assign Roles for User ID: {selectedUserId}</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleAssignRoles(); }}>
            <div className="form-group">
              <label>Select Roles:</label>
              {roles.map(role => (
                <div key={role.id}>
                  <input
                    type="checkbox"
                    id={`role-${role.id}`}
                    value={role.id}
                    checked={selectedRoles.includes(role.id)}
                    onChange={() => handleRoleChange(role.id)}
                    disabled={assignRolesLoading}
                  />
                  <label htmlFor={`role-${role.id}`}>{role.name}</label>
                </div>
              ))}
            </div>
            <button type="submit" disabled={assignRolesLoading}>
              Save Roles {assignRolesLoading && <span className="spinner"></span>}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedUserId(null); setSelectedRoles([]); }}
              style={{ backgroundColor: '#6c757d', marginLeft: '10px' }}
              disabled={assignRolesLoading}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
```