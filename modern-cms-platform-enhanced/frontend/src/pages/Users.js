```javascript
import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { toast } from 'react-toastify';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const roleOptions = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // For editing
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { userRole, user: loggedInUser } = useAuth();
  const canManageUsers = userRole === 'admin';

  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'viewer',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { results } = await getUsers();
      setUsers(results);
    } catch (error) {
      toast.error('Failed to fetch users.');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddChange = (e) => {
    setAddForm((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createUser(addForm);
      toast.success('User created successfully!');
      setShowAddModal(false);
      setAddForm({ username: '', email: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create user.');
      console.error('Error creating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (user) => {
    setCurrentUser({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      password: '', // Password field is intentionally left blank for security
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setCurrentUser((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const updateData = {
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
      };
      if (currentUser.password) {
        updateData.password = currentUser.password;
      }
      await updateUser(currentUser.id, updateData);
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setCurrentUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user.');
      console.error('Error updating user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;

    if (deletingId === loggedInUser.id) {
      toast.error("You cannot delete your own account.");
      setShowDeleteModal(false);
      return;
    }

    try {
      await deleteUser(deletingId);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user.');
      console.error('Error deleting user:', error);
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  if (!canManageUsers) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="text-gray-700">You do not have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        {canManageUsers && (
          <Button onClick={() => setShowAddModal(true)} className="flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" /> Add New User
          </Button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="text-gray-600">No users found.</p>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditClick(user)} disabled={!canManageUsers}>
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteClick(user.id)}
                        disabled={!canManageUsers || user.id === loggedInUser.id} // Cannot delete self
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddModal(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" onClick={handleCreateUser} loading={submitting}>
              Add User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input label="Username" id="username" value={addForm.username} onChange={handleAddChange} required />
          <Input label="Email" id="email" type="email" value={addForm.email} onChange={handleAddChange} required />
          <Input label="Password" id="password" type="password" value={addForm.password} onChange={handleAddChange} required />
          <Select label="Role" id="role" options={roleOptions} value={addForm.role} onChange={handleAddChange} />
        </form>
      </Modal>

      {/* Edit User Modal */}
      {currentUser && (
        <Modal
          show={showEditModal}
          onClose={() => setShowEditModal(false)}
          title={`Edit User: ${currentUser.username}`}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} className="mr-2">
                Cancel
              </Button>
              <Button type="submit" onClick={handleUpdateUser} loading={submitting}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <Input label="Username" id="username" value={currentUser.username} onChange={handleEditChange} required />
            <Input label="Email" id="email" type="email" value={currentUser.email} onChange={handleEditChange} required />
            <Input label="New Password (optional)" id="password" type="password" value={currentUser.password} onChange={handleEditChange} placeholder="Leave blank to keep current password" />
            <Select label="Role" id="role" options={roleOptions} value={currentUser.role} onChange={handleEditChange} />
          </form>
        </Modal>
      )}

      {/* Delete User Modal */}
      <Modal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="mr-2">
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deletingId && !showDeleteModal ? true : false}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-gray-700">Are you sure you want to delete this user? This action cannot be undone.</p>
        {deletingId === loggedInUser.id && (
          <p className="text-red-500 font-semibold mt-2">You cannot delete your own account.</p>
        )}
      </Modal>
    </div>
  );
};

export default Users;
```