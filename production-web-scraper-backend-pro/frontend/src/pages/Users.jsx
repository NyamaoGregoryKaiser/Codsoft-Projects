```javascript
import React, { useEffect, useState } from 'react';
import api from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { toast } from 'react-toastify';
import Table from '../components/Table';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import ConfirmModal from '../components/ConfirmModal';
import { Dialog, Switch } from '@headlessui/react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import TextInput from '../components/TextInput';
import moment from 'moment';
import useAuth from '../hooks/useAuth';

const UserForm = ({ initialValues, onSubmit, isSubmitting, isEditMode = false }) => {
  const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    password: Yup.string().when('isEditMode', {
      is: false,
      then: (schema) => schema.required('Password is required').min(6, 'Password must be at least 6 characters'),
      otherwise: (schema) => schema.min(6, 'Password must be at least 6 characters').nullable(),
    }),
    is_active: Yup.boolean().required('Active status is required'),
    is_admin: Yup.boolean().required('Admin status is required'),
  });

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      enableReinitialize={true}
    >
      {({ values, setFieldValue }) => (
        <Form className="space-y-4">
          <TextInput label="Username" name="username" />
          <TextInput label="Email" name="email" type="email" />
          {/* Password field only required for create, optional for edit */}
          <TextInput label="Password" name="password" type="password" placeholder={isEditMode ? 'Leave blank to keep current' : ''} />

          <div className="flex items-center space-x-2">
            <Switch
              checked={values.is_active}
              onChange={(checked) => setFieldValue('is_active', checked)}
              className={`${
                values.is_active ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Toggle active status</span>
              <span
                className={`${
                  values.is_active ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              >
                <span
                  className={`${
                    values.is_active
                      ? 'opacity-0 ease-out duration-100'
                      : 'opacity-100 ease-in duration-200'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className={`${
                    values.is_active
                      ? 'opacity-100 ease-in duration-200'
                      : 'opacity-0 ease-out duration-100'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l4.293-4.293a1 1 0 00-1.414-1.414L5 6.586V8z" />
                  </svg>
                </span>
              </span>
            </Switch>
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Is Active
            </label>
            <ErrorMessage name="is_active" component="div" className="ml-2 text-sm text-red-600" />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={values.is_admin}
              onChange={(checked) => setFieldValue('is_admin', checked)}
              className={`${
                values.is_admin ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Toggle admin status</span>
              <span
                className={`${
                  values.is_admin ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              >
                <span
                  className={`${
                    values.is_admin
                      ? 'opacity-0 ease-out duration-100'
                      : 'opacity-100 ease-in duration-200'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                    <path
                      d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span
                  className={`${
                    values.is_admin
                      ? 'opacity-100 ease-in duration-200'
                      : 'opacity-0 ease-out duration-100'
                  } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                  aria-hidden="true"
                >
                  <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                    <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l4.293-4.293a1 1 0 00-1.414-1.414L5 6.586V8z" />
                  </svg>
                </span>
              </span>
            </Switch>
            <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
              Is Admin
            </label>
            <ErrorMessage name="is_admin" component="div" className="ml-2 text-sm text-red-600" />
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Saving...' : 'Save User'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};


const Users = () => {
  const { user: currentUser } = useAuth(); // The currently logged-in user
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [operation, setOperation] = useState('create'); // 'create' or 'edit'
  const [userToDelete, setUserToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchUsers = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await api.get('/users', { params: { skip, limit: pageSize } });
      setUsers(response.data.items);
      setPagination({
        ...pagination,
        page,
        pageSize,
        total: response.data.total,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.detail || 'Failed to load users.');
      toast.error(err.response?.data?.detail || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePageChange = (newPage) => {
    fetchUsers(newPage);
  };

  const handleCreateClick = () => {
    setOperation('create');
    setSelectedUser({
      username: '',
      email: '',
      password: '',
      is_active: true,
      is_admin: false,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (user) => {
    setOperation('edit');
    // Don't pre-fill password for security
    setSelectedUser({ ...user, password: '' }); 
    setIsModalOpen(true);
  };

  const handleDeleteClick = (userId) => {
    if (userId === currentUser?.id) {
        toast.error("You cannot delete your own account.");
        return;
    }
    setUserToDelete(userId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!userToDelete) return;

    try {
      await api.delete(`/users/${userToDelete}`);
      toast.success('User deleted successfully!');
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete user.');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      if (operation === 'create') {
        await api.post('/users', values);
        toast.success('User created successfully!');
      } else if (operation === 'edit' && selectedUser) {
        // Only send password if it's provided
        const updateValues = { ...values };
        if (!updateValues.password) {
          delete updateValues.password;
        }
        await api.put(`/users/${selectedUser.id}`, updateValues);
        toast.success('User updated successfully!');
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Failed to save user:', err);
      toast.error(err.response?.data?.detail || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600 text-center p-4">{error}</div>;
  }

  const tableHeaders = ['Username', 'Email', 'Active', 'Admin', 'Created At', 'Actions'];

  const renderUserRow = (user) => (
    <tr key={user.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {user.username} {user.id === currentUser?.id && '(You)'}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {user.email}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.is_active ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          user.is_admin ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {user.is_admin ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {moment(user.created_at).format('YYYY-MM-DD HH:mm')}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => handleEditClick(user)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
            title="Edit User"
          >
            <PencilIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleDeleteClick(user.id)}
            className="text-red-600 hover:text-red-900 flex items-center"
            title="Delete User"
            disabled={user.id === currentUser?.id}
          >
            <TrashIcon className="h-5 w-5 mr-1" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts, roles, and active status.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add User
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <Table
          headers={tableHeaders}
          data={users}
          renderRow={renderUserRow}
          emptyMessage="No users found."
        />
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* User Form Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {operation === 'create' ? 'Create New User' : `Edit User: ${selectedUser?.username}`}
            </h3>
            {selectedUser && (
              <UserForm
                initialValues={selectedUser}
                onSubmit={handleFormSubmit}
                isEditMode={operation === 'edit'}
                isSubmitting={false}
              />
            )}
            <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:ml-3 sm:w-auto"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={isConfirmModalOpen}
        setOpen={setIsConfirmModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />
    </div>
  );
};

export default Users;
```