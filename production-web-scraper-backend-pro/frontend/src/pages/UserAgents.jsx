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

const UserAgentForm = ({ initialValues, onSubmit, isSubmitting }) => {
  const validationSchema = Yup.object().shape({
    agent_string: Yup.string().required('User Agent string is required').min(10, 'User Agent string must be at least 10 characters'),
    enabled: Yup.boolean().required('Enabled status is required'),
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
          <TextInput label="User Agent String" name="agent_string" type="textarea" rows="3" placeholder="e.g., Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36" />
          
          <div className="flex items-center space-x-2">
            <Switch
              checked={values.enabled}
              onChange={(checked) => setFieldValue('enabled', checked)}
              className={`${
                values.enabled ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable user agent</span>
              <span
                className={`${
                  values.enabled ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              >
                <span
                  className={`${
                    values.enabled
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
                    values.enabled
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
            <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
              Enabled
            </label>
            <ErrorMessage name="enabled" component="div" className="ml-2 text-sm text-red-600" />
          </div>

          <div className="flex justify-end pt-4 border-t mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Saving...' : 'Save User Agent'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

const UserAgents = () => {
  const [userAgents, setUserAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentUserAgent, setCurrentUserAgent] = useState(null);
  const [operation, setOperation] = useState('create'); // 'create' or 'edit'
  const [userAgentToDelete, setUserAgentToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchUserAgents = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await api.get('/user-agents', { params: { skip, limit: pageSize } });
      setUserAgents(response.data.items);
      setPagination({
        ...pagination,
        page,
        pageSize,
        total: response.data.total,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch user agents:', err);
      setError(err.response?.data?.detail || 'Failed to load user agents.');
      toast.error(err.response?.data?.detail || 'Failed to load user agents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAgents();
  }, []);

  const handlePageChange = (newPage) => {
    fetchUserAgents(newPage);
  };

  const handleCreateClick = () => {
    setOperation('create');
    setCurrentUserAgent({
      agent_string: '',
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (userAgent) => {
    setOperation('edit');
    setCurrentUserAgent(userAgent);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (uaId) => {
    setUserAgentToDelete(uaId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!userAgentToDelete) return;

    try {
      await api.delete(`/user-agents/${userAgentToDelete}`);
      toast.success('User agent deleted successfully!');
      fetchUserAgents();
    } catch (err) {
      console.error('Failed to delete user agent:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete user agent.');
    } finally {
      setUserAgentToDelete(null);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      if (operation === 'create') {
        await api.post('/user-agents', values);
        toast.success('User agent created successfully!');
      } else if (operation === 'edit' && currentUserAgent) {
        await api.put(`/user-agents/${currentUserAgent.id}`, values);
        toast.success('User agent updated successfully!');
      }
      setIsModalOpen(false);
      fetchUserAgents();
    } catch (err) {
      console.error('Failed to save user agent:', err);
      toast.error(err.response?.data?.detail || 'Failed to save user agent.');
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

  const tableHeaders = ['User Agent String', 'Enabled', 'Last Used', 'Actions'];

  const renderUserAgentRow = (ua) => (
    <tr key={ua.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6 max-w-sm truncate">
        {ua.agent_string}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          ua.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {ua.enabled ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {moment(ua.last_used).format('YYYY-MM-DD HH:mm')}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => handleEditClick(ua)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
            title="Edit User Agent"
          >
            <PencilIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleDeleteClick(ua.id)}
            className="text-red-600 hover:text-red-900 flex items-center"
            title="Delete User Agent"
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
          <h1 className="text-3xl font-bold text-gray-900">User Agents</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your user agent strings for rotating during scraping tasks.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add User Agent
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <Table
          headers={tableHeaders}
          data={userAgents}
          renderRow={renderUserAgentRow}
          emptyMessage="No user agents configured yet."
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

      {/* User Agent Form Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {operation === 'create' ? 'Add New User Agent' : `Edit User Agent: ${currentUserAgent?.agent_string.substring(0, 50)}...`}
            </h3>
            {currentUserAgent && (
              <UserAgentForm
                initialValues={currentUserAgent}
                onSubmit={handleFormSubmit}
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
        title="Delete User Agent"
        message="Are you sure you want to delete this user agent? It will no longer be available for scraping tasks."
      />
    </div>
  );
};

export default UserAgents;
```