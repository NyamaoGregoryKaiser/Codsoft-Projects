import React, { useState, useEffect } from 'react';
import { fetchUsers, updateUser, deleteUser } from '../api/adminApi'; // Assuming admin-specific API calls
import { User, UserRole, PaginationMeta } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Pagination from '../components/Pagination';

// NOTE: For brevity, I'll add adminApi here. In a real project, this would be a separate file `frontend/src/api/adminApi.ts`
// Assuming adminApi.ts contains:
// import axiosInstance from './axiosInstance';
// export const fetchUsers = (page: number, limit: number) => axiosInstance.get(`/auth/users?page=${page}&limit=${limit}`);
// export const updateUser = (id: string, data: Partial<User>) => axiosInstance.put(`/auth/users/${id}`, data);
// export const deleteUser = (id: string) => axiosInstance.delete(`/auth/users/${id}`);

const UserListPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/unauthorized'); // Redirect if not admin
      return;
    }
    loadUsers(currentPage);
  }, [currentPage, isAdmin, authLoading, navigate]);

  const loadUsers = async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore (ignoring because adminApi functions are defined as comments above for brevity)
      const response = await fetchUsers(page, 10);
      if (response.data.success) {
        setUsers(response.data.data);
        if (response.data.meta) {
          setMeta(response.data.meta);
        }
      } else {
        setError(response.data.message || 'Failed to fetch users.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (window.confirm(`Are you sure you want to change the role of this user to ${newRole}?`)) {
      setLoading(true);
      try {
        // @ts-ignore
        await updateUser(userId, { role: newRole });
        loadUsers(currentPage); // Reload users
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to update user role.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivationToggle = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      setLoading(true);
      try {
        // @ts-ignore
        await updateUser(userId, { isActive: !currentStatus });
        loadUsers(currentPage); // Reload users
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to update user status.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      setLoading(true);
      try {
        // @ts-ignore
        await deleteUser(userId);
        loadUsers(currentPage); // Reload users
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to delete user.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading || authLoading) {
    return <div className="container py-8 text-center">Loading users...</div>;
  }

  if (!isAdmin) { // Double check authorization
    return <div className="container py-8 text-center text-red-600">You are not authorized to view this page.</div>;
  }

  if (error) {
    return <div className="container py-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>

      {users.length === 0 ? (
        <p className="text-center text-gray-500">No users found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Email</th>
                  <th className="py-2 px-4 border-b text-left">Role</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{user.email}</td>
                    <td className="py-2 px-4 border-b">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="input-field max-w-[120px] py-1 text-sm"
                        disabled={user.email === 'admin@example.com'} // Prevent changing admin's role
                      >
                        {Object.values(UserRole).map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => handleActivationToggle(user.id, user.isActive)}
                        className={`text-blue-600 hover:text-blue-800 mr-2 ${user.email === 'admin@example.com' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={user.email === 'admin@example.com'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className={`text-red-600 hover:text-red-800 ${user.email === 'admin@example.com' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={user.email === 'admin@example.com'}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

export default UserListPage;