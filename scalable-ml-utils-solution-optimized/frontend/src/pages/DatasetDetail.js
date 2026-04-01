```javascript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDataset, getDatasetPreview, deleteDataset } from '../api/api';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import DataTable from '../components/DataTable';
import { TrashIcon } from '@heroicons/react/outline';

const DatasetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dataset, setDataset] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDatasetDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const datasetRes = await getDataset(id);
        setDataset(datasetRes.data);
        
        const previewRes = await getDatasetPreview(id);
        setPreview(previewRes.data);
      } catch (err) {
        console.error('Failed to fetch dataset details:', err);
        setError(err.response?.data?.detail || 'Failed to load dataset details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatasetDetails();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        await deleteDataset(id);
        navigate('/datasets');
      } catch (err) {
        console.error('Failed to delete dataset:', err);
        setError(err.response?.data?.detail || 'Failed to delete dataset.');
      }
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!dataset) return <div className="text-gray-600">Dataset not found.</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{dataset.name}</h1>
        <button onClick={handleDelete} className="btn-danger">
          <TrashIcon className="h-5 w-5 mr-2" /> Delete Dataset
        </button>
      </div>

      <Card title="Dataset Information">
        <p><strong>Description:</strong> {dataset.description || 'N/A'}</p>
        <p><strong>Total Rows:</strong> {dataset.row_count}</p>
        <p><strong>File Path:</strong> {dataset.file_path}</p>
        <p><strong>Uploaded On:</strong> {new Date(dataset.created_at).toLocaleDateString()} {new Date(dataset.created_at).toLocaleTimeString()}</p>
      </Card>

      {preview && (
        <Card title="Dataset Preview (First 5 Rows)">
          <DataTable
            columns={preview.columns}
            data={preview.data}
            className="mt-4"
          />
          <p className="mt-4 text-sm text-gray-600">Showing {preview.data.length} of {preview.total_rows} rows.</p>
        </Card>
      )}

      {dataset.column_info && (
        <Card title="Column Information">
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(dataset.column_info).map(([col, type]) => (
              <li key={col}><strong>{col}:</strong> {type}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};

export default DatasetDetail;
```