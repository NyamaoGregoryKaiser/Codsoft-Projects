import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { createDataSource, updateDataSource, fetchDataSourceById, setSelectedDataSource } from '../store/dataSourceSlice';
import { toast } from 'react-toastify';
import { DataSource } from '../types';

const CreateEditDataSourcePage: React.FC = () => {
  const { id } = useParams<{ id: string }>(); // for editing
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const { selectedDataSource, loading, error } = useSelector((state: RootState) => state.dataSources);
  const { user } = useSelector((state: RootState) => state.auth);

  const isEditMode = !!id;

  const [name, setName] = useState('');
  const [type, setType] = useState('POSTGRES');
  const [connectionDetails, setConnectionDetails] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      dispatch(fetchDataSourceById(Number(id)));
    } else {
      dispatch(setSelectedDataSource(null)); // Clear selected data source for new creation
      setName('');
      setType('POSTGRES');
      setConnectionDetails('');
    }
  }, [id, isEditMode, dispatch]);

  useEffect(() => {
    if (isEditMode && selectedDataSource) {
      setName(selectedDataSource.name);
      setType(selectedDataSource.type);
      setConnectionDetails(selectedDataSource.connectionDetails);
    }
  }, [isEditMode, selectedDataSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('User not logged in.');
      return;
    }

    setFormLoading(true);

    try {
      // Basic validation for connectionDetails JSON
      try {
        JSON.parse(connectionDetails);
      } catch (jsonError) {
        toast.error('Connection details must be a valid JSON string.');
        setFormLoading(false);
        return;
      }

      const dataSourceData: Omit<DataSource, 'id' | 'ownerUsername' | 'createdAt' | 'updatedAt'> = {
        name,
        type,
        connectionDetails,
        ownerId: user.id,
      };

      if (isEditMode && id) {
        const result = await dispatch(updateDataSource({ id: Number(id), updatedFields: dataSourceData }));
        if (updateDataSource.fulfilled.match(result)) {
          toast.success(`Data Source "${name}" updated successfully!`);
          navigate('/data-sources');
        } else {
          toast.error(`Failed to update data source: ${result.payload}`);
        }
      } else {
        const result = await dispatch(createDataSource(dataSourceData));
        if (createDataSource.fulfilled.match(result)) {
          toast.success(`Data Source "${name}" created successfully!`);
          navigate('/data-sources');
        } else {
          toast.error(`Failed to create data source: ${result.payload}`);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred.');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="text-center mt-8">Loading data source details...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (isEditMode && !selectedDataSource && !loading) return <div className="text-center mt-8">Data Source not found.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? `Edit Data Source: ${name}` : 'Create New Data Source'}</h1>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Data Source Name</label>
          <input
            type="text"
            id="name"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            id="type"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value="POSTGRES">PostgreSQL</option>
            <option value="MYSQL">MySQL</option>
            <option value="REST_API">REST API</option>
            <option value="CSV">CSV File (Mock)</option>
            <option value="H2">H2 (for testing/development)</option>
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="connectionDetails" className="block text-sm font-medium text-gray-700 mb-1">Connection Details (JSON)</label>
          <textarea
            id="connectionDetails"
            className="w-full border-gray-300 rounded-md shadow-sm p-2 font-mono text-sm focus:ring-blue-500 focus:border-blue-500"
            rows={8}
            value={connectionDetails}
            onChange={(e) => setConnectionDetails(e.target.value)}
            placeholder={`Example for POSTGRES:\n{\n  "url": "jdbc:postgresql://host:port/database",\n  "username": "user",\n  "password": "password"\n}\n\nExample for REST_API:\n{\n  "baseUrl": "https://api.example.com",\n  "headers": { "Authorization": "Bearer token" }\n}`}
            required
          ></textarea>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/data-sources')}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-sm"
            disabled={formLoading}
          >
            {formLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Data Source' : 'Create Data Source')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditDataSourcePage;