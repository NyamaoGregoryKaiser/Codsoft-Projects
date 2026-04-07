```javascript
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDatasetById, deleteDataset as deleteDatasetService } from '../services/datasetService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './DetailPage.css';

const DatasetDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        setLoading(true);
        const data = await getDatasetById(id);
        setDataset(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dataset:', err);
        setError(err.message || 'Failed to load dataset details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDataset();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteDatasetService(id);
        setSuccessMessage('Dataset deleted successfully!');
        navigate('/datasets'); // Redirect to datasets list after deletion
      } catch (err) {
        console.error('Failed to delete dataset:', err);
        setError(err.message || 'Failed to delete dataset.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Loader message="Loading dataset details..." />;
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  if (!dataset) {
    return <Alert message="Dataset not found." type="info" />;
  }

  const isOwnerOrAdmin = user?.id === dataset.owner_id || user?.role === 'admin';

  return (
    <div className="detail-page">
      <div className="detail-header">
        <h1>{dataset.name}</h1>
        <div className="detail-actions">
          {isOwnerOrAdmin && (
            <>
              <Link to={`/datasets/${dataset.id}/edit`} className="btn btn-secondary">Edit Dataset</Link>
              <button onClick={handleDelete} className="btn btn-danger">Delete Dataset</button>
            </>
          )}
          <Link to="/datasets" className="btn btn-info">Back to Datasets</Link>
        </div>
      </div>

      {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}

      <section className="detail-section">
        <h2>Dataset Information</h2>
        <p><strong>Description:</strong> {dataset.description || 'N/A'}</p>
        <p>
          <strong>Source URL:</strong> {' '}
          {dataset.source_url ? (
            <a href={dataset.source_url} target="_blank" rel="noopener noreferrer">{dataset.source_url}</a>
          ) : (
            'N/A'
          )}
        </p>
        <p><strong>Owner:</strong> {dataset.owner?.username || 'N/A'}</p>
        <p><strong>Created At:</strong> {new Date(dataset.createdAt).toLocaleDateString()}</p>
        <p><strong>Last Updated:</strong> {new Date(dataset.updatedAt).toLocaleDateString()}</p>
      </section>

      <section className="detail-section">
        <h2>Schema Preview</h2>
        {Object.keys(dataset.schema_preview || {}).length > 0 ? (
          <pre>{JSON.stringify(dataset.schema_preview, null, 2)}</pre>
        ) : (
          <p>No schema preview available.</p>
        )}
      </section>
    </div>
  );
};

export default DatasetDetailPage;
```