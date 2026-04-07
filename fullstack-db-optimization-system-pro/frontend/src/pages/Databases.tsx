import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databasesApi } from '@api/databases';
import Table from '@components/Table';
import { Database, DatabaseCreate, DatabaseUpdate } from '@types';
import { DatabaseType } from '@types/auth';
import { PlusIcon, PencilIcon, TrashIcon, ChartBarIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';

const Databases: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.isAdmin;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDb, setEditingDb] = useState<Database | null>(null);
  const [formData, setFormData] = useState<DatabaseCreate | DatabaseUpdate>({
    name: '',
    dbType: DatabaseType.POSTGRESQL,
    host: '',
    port: 5432,
    dbName: '',
    username: '',
    password: '',
    description: '',
    ownerId: user?.id, // Default to current user's ID
  });

  const { data: databases, isLoading, error } = useQuery({
    queryKey: ['databases'],
    queryFn: databasesApi.getDatabases,
  });

  const createDatabaseMutation = useMutation({
    mutationFn: databasesApi.createDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: Error) => alert(`Error creating database: ${err.message}`),
  });

  const updateDatabaseMutation = useMutation({
    mutationFn: ({ dbId, data }: { dbId: number; data: DatabaseUpdate }) =>
      databasesApi.updateDatabase(dbId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
      setIsModalOpen(false);
      setEditingDb(null);
      resetForm();
    },
    onError: (err: Error) => alert(`Error updating database: ${err.message}`),
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: databasesApi.deleteDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
    onError: (err: Error) => alert(`Error deleting database: ${err.message}`),
  });

  const handleCreateNew = () => {
    setEditingDb(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (db: Database) => {
    setEditingDb(db);
    setFormData({
      name: db.name,
      dbType: db.dbType,
      host: db.host,
      port: db.port,
      dbName: db.dbName,
      username: db.username,
      // NOTE: Password is not returned by API for security. User must re-enter if changing credentials.
      // For update, we might send an empty string or null if not updated.
      password: '',
      description: db.description,
      ownerId: db.ownerId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (dbId: number) => {
    if (window.confirm('Are you sure you want to delete this database?')) {
      deleteDatabaseMutation.mutate(dbId);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'port' || name === 'ownerId' ? parseInt(value) : value,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDb) {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't send empty password if not changed
      }
      updateDatabaseMutation.mutate({ dbId: editingDb.id, data: updateData });
    } else {
      createDatabaseMutation.mutate(formData as DatabaseCreate);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      dbType: DatabaseType.POSTGRESQL,
      host: '',
      port: 5432,
      dbName: '',
      username: '',
      password: '',
      description: '',
      ownerId: user?.id,
    });
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Type', accessor: 'dbType' },
    { header: 'Host:Port', accessor: (row: Database) => `${row.host}:${row.port}` },
    { header: 'DB Name', accessor: 'dbName' },
    { header: 'Username', accessor: 'username' },
    {
      header: 'Actions',
      accessor: (row: Database) => (
        <div className="flex space-x-2">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/databases/${row.id}/metrics`); }} className="text-blue-600 hover:text-blue-900 p-1">
            <ChartBarIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); navigate(`/databases/${row.id}/suggestions`); }} className="text-green-600 hover:text-green-900 p-1">
            <LightBulbIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="text-indigo-600 hover:text-indigo-900 p-1">
            <PencilIcon className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }} className="text-red-600 hover:text-red-900 p-1">
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      ),
    },
  ];

  if (error) return <div className="p-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Registered Databases</h1>
        <button
          onClick={handleCreateNew}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <PlusIcon className="w-5 h-5 mr-2" /> Register New Database
        </button>
      </div>

      <Table<Database>
        data={databases || []}
        columns={columns}
        getKey={(db) => db.id}
        isLoading={isLoading}
        emptyMessage="No databases registered yet. Click 'Register New Database' to add one."
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
              {editingDb ? 'Edit Database' : 'Register New Database'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="dbType" className="block text-sm font-medium text-gray-700">Database Type</label>
                <select
                  id="dbType"
                  name="dbType"
                  value={formData.dbType}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.values(DatabaseType).map((type) => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="host" className="block text-sm font-medium text-gray-700">Host</label>
                <input
                  type="text"
                  id="host"
                  name="host"
                  value={formData.host}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="port" className="block text-sm font-medium text-gray-700">Port</label>
                <input
                  type="number"
                  id="port"
                  name="port"
                  value={formData.port}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="dbName" className="block text-sm font-medium text-gray-700">Database Name</label>
                <input
                  type="text"
                  id="dbName"
                  name="dbName"
                  value={formData.dbName}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">Database Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Database Password {editingDb ? '(leave blank to keep current)' : ''}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  // required={!editingDb} // Password is required for creation, optional for update
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description || ''}
                  onChange={handleFormChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                ></textarea>
              </div>
              {isAdmin && !editingDb && ( // Only show ownerId for admin creating new DB
                <div>
                  <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">Owner ID (Admin Only)</label>
                  <input
                    type="number"
                    id="ownerId"
                    name="ownerId"
                    value={formData.ownerId || ''}
                    onChange={handleFormChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDatabaseMutation.isPending || updateDatabaseMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingDb ? 'Update Database' : 'Register Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Databases;