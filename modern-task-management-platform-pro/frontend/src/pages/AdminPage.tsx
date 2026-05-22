```typescript
import React, { useState, useEffect, useCallback } from 'react';
import { User, PaginatedResponse } from 'types';
import * as userApi from 'api/users';
import Modal from 'components/Modal';
import Pagination from 'components/Pagination';
import { UserRole } from '../../../backend/src/database/entities/user.entity'; // Use relative path for type definition
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    page: 1,
    totalPages: 0,
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editedRole, setEditedRole] = useState<UserRole>(UserRole.MEMBER);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getUsers(page, limit);
      if (res.success && res.data) {
        setUsers(res.data.data);
        setPagination(res.data.pagination);
      } else {
        setError(res.message || 'Failed to fetch users.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenEditModal = (user: User) => {
    setCurrentUser(user);
    setEditedRole(user.role as UserRole); // Cast to UserRole enum
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const handleUpdateUserRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setEditFormError(null);
    try {
      await userApi.updateUserRole(currentUser.id, { role: editedRole });
      setIsEditModalOpen(false);
      fetchUsers(); // Refresh the list
    } catch (err: any) {
      setEditFormError(err.response?.data?.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone and will delete all associated projects, tasks, and comments.')) {
      try {
        await userApi.deleteUser(userId);
        fetchUsers(); // Refresh the list
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete user.');
      }
    }
  };

  const handlePageChange = (page: number) => {
    fetchUsers(page, pagination.limit);
  };

  if (loading && users.length === 0) return <div className="loading-state">Loading users...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="admin-page-container">
      <header className="admin-header">
        <h1>Admin Panel - Manage Users</h1>
      </header>

      <section className="users-list">
        {users.length === 0 && !loading ? (
          <p className="no-content-message">No users found.</p>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => handleOpenEditModal(user)} className="btn btn-sm">Edit Role</button>
                    <button onClick={() => handleDeleteUser(user.id)} className="btn delete-btn btn-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Role for ${currentUser?.firstName} ${currentUser?.lastName}`}>
        <form onSubmit={handleUpdateUserRole} className="user-role-form">
          {editFormError && <p className="error-message">{editFormError}</p>}
          <div className="form-group">
            <label htmlFor="userRole">Role:</label>
            <select
              id="userRole"
              value={editedRole}
              onChange={(e) => setEditedRole(e.target.value as UserRole)}
              aria-label="User Role"
            >
              <option value={UserRole.MEMBER}>Member</option>
              <option value={UserRole.ADMIN}>Admin</option>
            </select>
          </div>
          <button type="submit" className="btn primary-btn">Update Role</button>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPage;
```