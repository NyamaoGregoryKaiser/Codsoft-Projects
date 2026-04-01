```javascript
import React, { useEffect, useState } from 'react';
import { getDatasets, uploadDataset, deleteDataset } from '../api/api';
import Card from '../components/Card';
import { Link } from 'react-router-dom';
import { PlusIcon, TrashIcon } from '@heroicons/react/outline';

const Datasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const fetchDatasets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDatasets();
      setDatasets(response.data);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
      setError(err.response?.data?.detail || 'Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setUploadError('');
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please select a file to upload.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      await uploadDataset(file);
      setFile(null); // Clear selected file
      await fetchDatasets(); // Refresh list
    } catch (err) {
      console.error('Failed to upload dataset:', err);
      setUploadError(err.response?.data?.detail || 'Failed to upload dataset. Only CSV files are supported.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        await deleteDataset(id);
        await fetchDatasets(); // Refresh list
      } catch (err) {
        console.error('Failed to delete dataset:', err);
        setError(err.response?.data?.detail || 'Failed to delete dataset.');
      }
    }
  };

  if (loading) return <div>Loading datasets...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Your Datasets</h1>

      <Card title="Upload New Dataset">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="file-upload" className="sr-only">Choose file</label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
            {file && <p className="mt-2 text-sm text-gray-600">Selected file: {file.name}</p>}
          </div>
          {uploadError && <p className="text-red-500 text-sm">{uploadError}</p>}
          <div>
            <button type="submit" className="btn-primary" disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
          </div>
        </form>
      </Card>

      <Card title="Existing Datasets">
        {datasets.length === 0 ? (
          <p className="text-gray-600">You haven't uploaded any datasets yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {datasets.map((dataset) => (
              <li key={dataset.id} className="py-4 flex justify-between items-center">
                <div>
                  <Link to={`/datasets/${dataset.id}`} className="text-lg font-medium text-blue-600 hover:underline">
                    {dataset.name}
                  </Link>
                  <p className="text-sm text-gray-500">{dataset.description || 'No description'}</p>
                  <p className="text-xs text-gray-400">Uploaded: {new Date(dataset.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex space-x-2">
                  <Link to={`/models?datasetId=${dataset.id}`} className="btn-secondary text-sm">Train Model</Link>
                  <button
                    onClick={() => handleDelete(dataset.id)}
                    className="btn-danger text-sm"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

export default Datasets;
```