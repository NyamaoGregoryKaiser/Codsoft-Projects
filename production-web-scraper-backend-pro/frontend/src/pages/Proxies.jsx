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

const ProxyForm = ({ initialValues, onSubmit, isSubmitting }) => {
  const validationSchema = Yup.object().shape({
    address: Yup.string().required('Address is required').matches(
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/,
      'Must be a valid IP address or hostname'
    ),
    port: Yup.number().required('Port is required').min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
    username: Yup.string().nullable(),
    password: Yup.string().nullable(),
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
          <TextInput label="Address (IP or Hostname)" name="address" placeholder="e.g., 192.168.1.1 or proxy.example.com" />
          <TextInput label="Port" name="port" type="number" placeholder="e.g., 8080" />
          <TextInput label="Username (Optional)" name="username" />
          <TextInput label="Password (Optional)" name="password" type="password" />

          <div className="flex items-center space-x-2">
            <Switch
              checked={values.enabled}
              onChange={(checked) => setFieldValue('enabled', checked)}
              className={`${
                values.enabled ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
            >
              <span className="sr-only">Enable proxy</span>
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
              {isSubmitting ? 'Saving...' : 'Save Proxy'}
            </button>
          </div>
        </Form>
      )}
    </Formik>
  );
};


const Proxies = () => {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [currentProxy, setCurrentProxy] = useState(null);
  const [operation, setOperation] = useState('create'); // 'create' or 'edit'
  const [proxyToDelete, setProxyToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  const fetchProxies = async (page = pagination.page, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await api.get('/proxies', { params: { skip, limit: pageSize } });
      setProxies(response.data.items);
      setPagination({
        ...pagination,
        page,
        pageSize,
        total: response.data.total,
      });
      setError(null);
    } catch (err) {
      console.error('Failed to fetch proxies:', err);
      setError(err.response?.data?.detail || 'Failed to load proxies.');
      toast.error(err.response?.data?.detail || 'Failed to load proxies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProxies();
  }, []);

  const handlePageChange = (newPage) => {
    fetchProxies(newPage);
  };

  const handleCreateClick = () => {
    setOperation('create');
    setCurrentProxy({
      address: '',
      port: '',
      username: '',
      password: '',
      enabled: true,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (proxy) => {
    setOperation('edit');
    setCurrentProxy({
      ...proxy,
      address: proxy.address, // IPvAnyAddress in backend, string in frontend
      port: proxy.port,
      // Pass empty string for username/password if null to avoid controlled component warnings
      username: proxy.username || '',
      password: proxy.password || '', 
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (proxyId) => {
    setProxyToDelete(proxyId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    setIsConfirmModalOpen(false);
    if (!proxyToDelete) return;

    try {
      await api.delete(`/proxies/${proxyToDelete}`);
      toast.success('Proxy deleted successfully!');
      fetchProxies();
    } catch (err) {
      console.error('Failed to delete proxy:', err);
      toast.error(err.response?.data?.detail || 'Failed to delete proxy.');
    } finally {
      setProxyToDelete(null);
    }
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
      if (operation === 'create') {
        await api.post('/proxies', values);
        toast.success('Proxy created successfully!');
      } else if (operation === 'edit' && currentProxy) {
        await api.put(`/proxies/${currentProxy.id}`, values);
        toast.success('Proxy updated successfully!');
      }
      setIsModalOpen(false);
      fetchProxies();
    } catch (err) {
      console.error('Failed to save proxy:', err);
      toast.error(err.response?.data?.detail || 'Failed to save proxy.');
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

  const tableHeaders = ['Address', 'Port', 'Username', 'Enabled', 'Last Used', 'Actions'];

  const renderProxyRow = (proxy) => (
    <tr key={proxy.id}>
      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
        {proxy.address}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {proxy.port}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {proxy.username || '-'}
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        <span className={`inline-flex px-2 text-xs font-semibold leading-5 rounded-full ${
          proxy.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {proxy.enabled ? 'Yes' : 'No'}
        </span>
      </td>
      <td className="whitespace-nowrap py-4 px-3 text-sm text-gray-500">
        {moment(proxy.last_used).format('YYYY-MM-DD HH:mm')}
      </td>
      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <div className="flex space-x-2 justify-end">
          <button
            onClick={() => handleEditClick(proxy)}
            className="text-indigo-600 hover:text-indigo-900 flex items-center"
            title="Edit Proxy"
          >
            <PencilIcon className="h-5 w-5 mr-1" />
          </button>
          <button
            onClick={() => handleDeleteClick(proxy.id)}
            className="text-red-600 hover:text-red-900 flex items-center"
            title="Delete Proxy"
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
          <h1 className="text-3xl font-bold text-gray-900">Proxies</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your proxy configurations for scraping.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={handleCreateClick}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Proxy
          </button>
        </div>
      </div>

      <div className="mt-8 flow-root">
        <Table
          headers={tableHeaders}
          data={proxies}
          renderRow={renderProxyRow}
          emptyMessage="No proxies configured yet."
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

      {/* Proxy Form Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {operation === 'create' ? 'Add New Proxy' : `Edit Proxy: ${currentProxy?.address}:${currentProxy?.port}`}
            </h3>
            {currentProxy && (
              <ProxyForm
                initialValues={currentProxy}
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
        title="Delete Proxy"
        message="Are you sure you want to delete this proxy? It will no longer be available for scraping tasks."
      />
    </div>
  );
};

export default Proxies;
```