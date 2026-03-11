import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { AppDispatch, RootState } from '../store/store';
import { fetchDataSources, deleteDataSource } from '../store/dataSourceSlice';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

const DataSourceListPage: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { dataSources, loading, error } = useSelector((state: RootState) => state.dataSources);

  useEffect(() => {
    dispatch(fetchDataSources());
  }, [dispatch]);

  const handleDeleteDataSource = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete data source "${name}"? This cannot be undone.`)) {
      try {
        const result = await dispatch(deleteDataSource(id));
        if (deleteDataSource.fulfilled.match(result)) {
          toast.success(`Data source "${name}" deleted successfully.`);
        } else {
          toast.error(`Failed to delete data source: ${result.payload}`);
        }
      } catch (err) {
        toast.error('An unexpected error occurred while deleting data source.');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="text-center mt-8">Loading data sources...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Data Sources</h1>
        <Link
          to="/data-sources/new"
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-lg"
        >
          Add New Data Source
        </Link>
      </div>

      {dataSources.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">You haven't added any data sources yet. Click "Add New Data Source" to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataSources.map((ds) => (
            <div key={ds.id} className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{ds.name}</h2>
                <p className="text-gray-600 mt-2">Type: <span className="font-medium text-blue-700">{ds.type}</span></p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">Connection: {ds.connectionDetails}</p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                <p>Created: {dayjs(ds.createdAt).format('MMM D, YYYY h:mm A')}</p>
                <p>Last Updated: {dayjs(ds.updatedAt).format('MMM D, YYYY h:mm A')}</p>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link
                  to={`/data-sources/edit/${ds.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDeleteDataSource(ds.id, ds.name)}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DataSourceListPage;