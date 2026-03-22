```javascript
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const UserForm = ({ user, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '', // Only for creation or if password reset is allowed
    role: 'USER',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        password: '', // Never pre-fill password for security
        role: user.role,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'USER',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSend = { ...formData };
    if (!dataToSend.password) {
        delete dataToSend.password; // Don't send empty password on update
    }

    try {
      if (user) {
        await api.patch(`/users/${user.id}`, dataToSend);
        toast.success('User updated successfully!');
      } else {
        await api.post('/users', dataToSend);
        toast.success('User created successfully!');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Failed to ${user ? 'update' : 'create'} user.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          name="firstName"
          id="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          name="lastName"
          id="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        />
      </div>
      {!user && ( // Only show password field for new user creation
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            required={!user}
            placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special"
          />
        </div>
      )}
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
        <select
          name="role"
          id="role"
          value={formData.role}
          onChange={handleChange}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          required
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </div>
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          disabled={loading}
        >
          {loading ? (user ? 'Updating...' : 'Creating...') : (user ? 'Update User' : 'Create User')}
        </button>
      </div>
    </form>
  );
};

export default UserForm;
```