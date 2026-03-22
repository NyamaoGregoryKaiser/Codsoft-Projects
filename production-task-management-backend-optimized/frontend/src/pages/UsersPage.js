```javascript
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { PlusIcon, UserCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Modal from '../components/common/Modal';
import UserForm from '../components/forms/UserForm'; // Admin can create/edit users

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // For editing

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users.');
      toast.error('Failed to load users.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${userId}`);
        toast.success('User deleted successfully!');
        fetchUsers();
      } catch (err) {
        toast.error('Failed to delete user.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async () => {
    setIsModalOpen(false);
    await fetchUsers();
  };

  if (loading) return <div className="p-6 text-center">Loading users...</div>;
  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={handleCreateUser}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New User
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-gray-600 text-lg">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((userItem) => (
            <div key={userItem.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-400">
              <div className="flex items-center mb-4">
                <UserCircleIcon className="h-10 w-10 text-gray-500 mr-4" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{userItem.firstName} {userItem.lastName}</h3>
                  <p className="text-gray-600 text-sm">{userItem.email}</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">Role: <span className="font-medium text-indigo-600">{userItem.role}</span></p>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => handleEditUser(userItem)}
                  className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                  title="Edit User"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteUser(userItem.id)}
                  className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
                  title="Delete User"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser ? 'Edit User' : 'Create New User'}>
        <UserForm
          user={currentUser}
          onSuccess={handleFormSubmit}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default UsersPage;
```