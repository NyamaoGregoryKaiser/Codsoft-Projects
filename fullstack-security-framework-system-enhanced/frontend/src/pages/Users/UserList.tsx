import React, { useEffect, useState } from 'react';
import * as userApi from 'api/users';
import { User } from 'types/auth';
import { useAuth } from 'hooks/useAuth';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth(); // Get current logged-in user to prevent deleting self

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await userApi.getUsers();
        setUsers(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (currentUser && id === currentUser.id) {
        alert("You cannot delete your own account.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(id);
        setUsers(users.filter(u => u.id !== id));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleUpdateRole = async (id: string, newRole: User['role']) => {
    if (currentUser && id === currentUser.id) {
        alert("You cannot change your own role through this interface.");
        return;
    }
    try {
      const updatedUser = await userApi.updateUser(id, { role: newRole });
      setUsers(users.map(u => u.id === id ? updatedUser : u));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  if (loading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>User Management</h2>
      <ul style={styles.userList}>
        {users.map(user => (
          <li key={user.id} style={styles.userItem}>
            <div style={styles.userDetails}>
              <h3>{user.name} ({user.email})</h3>
              <p>Role: {user.role}</p>
            </div>
            <div style={styles.userActions}>
              <select
                value={user.role}
                onChange={(e) => handleUpdateRole(user.id, e.target.value as User['role'])}
                disabled={user.id === currentUser?.id} // Cannot change own role
                style={styles.selectRole}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <button
                onClick={() => handleDelete(user.id)}
                disabled={user.id === currentUser?.id} // Cannot delete own account
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
      maxWidth: '900px',
      margin: '50px auto',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      color: '#333',
    },
    userList: {
      listStyle: 'none',
      padding: 0,
    },
    userItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      border: '1px solid #eee',
      borderRadius: '5px',
      padding: '15px',
      marginBottom: '10px',
      backgroundColor: '#fdfdfd',
    },
    userDetails: {
      flexGrow: 1,
    },
    userActions: {
      display: 'flex',
      gap: '10px',
    },
    selectRole: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      cursor: 'pointer',
    },
    deleteButton: {
      padding: '8px 15px',
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
  };

export default UserList;