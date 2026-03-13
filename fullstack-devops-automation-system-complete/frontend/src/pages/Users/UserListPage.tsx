```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '@api/user';
import Button from '@components/Common/Button';
import Select from '@components/Common/Select';
import useAuth from '@hooks/useAuth';
import { UserRole } from '@types-frontend/enums';
import { User } from '@types-frontend/entities';

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth(); // The currently logged-in user

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser?.id) {
        setError('You cannot change your own role.');
        return;
    }
    if (window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      try {
        await updateUserRole(userId, newRole);
        fetchUsers(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update user role.');
      }
    }
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await deleteUser(userId);
        fetchUsers(); // Refresh the list
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  if (loading) return <p className="text-center mt-8">Loading users...</p>;
  if (error) return <p className="alert alert-error text-center mt-8">{error}</p>;

  return (
    <div className="mt-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

      {users.length === 0 ? (
        <p className="text-center text-gray-600">No users found.</p>
      ) : (
        <div className="table-container">
          <table className="table-layout">
            <thead>
              <tr>
                <th className="table-header">Username</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'table-row-even' : 'table-row-odd'}>
                  <td className="table-cell">{user.username}</td>
                  <td className="table-cell">{user.email}</td>
                  <td className="table-cell">
                    <Select
                      id={`role-select-${user.id}`}
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      options={[
                        { value: UserRole.USER, label: 'User' },
                        { value: UserRole.ADMIN, label: 'Admin' },
                      ]}
                      className="!w-28" // Override w-full from form-input
                      disabled={user.id === currentUser?.id} // Cannot change your own role
                    />
                  </td>
                  <td className="table-cell space-x-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      disabled={user.id === currentUser?.id} // Cannot delete your own account
                    >
                      Delete
                    </Button>
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

export default UserListPage;
```