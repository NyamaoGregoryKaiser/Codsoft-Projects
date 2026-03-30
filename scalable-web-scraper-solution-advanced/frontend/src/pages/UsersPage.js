import React, { useState, useEffect } from 'react';
import api from '../api';
import UserTable from '../components/UserTable';
import { useAuth } from '../hooks/useAuth';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser } = useAuth(); // Renamed to avoid conflict

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. You need admin privileges.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    } else {
      setError("You do not have permission to view this page.");
      setLoading(false);
    }
  }, [currentUser]);

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user? This action is irreversible.")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
        setError(err.response?.data?.detail || "Failed to delete user. Make sure it's not your own account or they are not an admin.");
      }
    }
  };

  if (loading) return <div className="text-center p-4">Loading users...</div>;
  if (error) return <div className="text-center p-4 text-red-600">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">User Management</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">All Users</h2>
        <UserTable users={users} onDelete={handleDeleteUser} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default UsersPage;