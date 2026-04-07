```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDatasets, deleteDataset as deleteDatasetService } from '../services/datasetService';
import { useAuth } from '../context/AuthContext';
import DatasetCard from '../components/dataset/DatasetCard';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './ListPage.css';

const DatasetsPage = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { user } = useAuth();

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const data = await getDatasets();
      setDatasets(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
      setError(err.message || 'Failed to load datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteDatasetService(id);
        setDatasets(datasets.filter(dataset => dataset.id !== id));
        setSuccessMessage('Dataset deleted successfully!');
        setError(null);
      } catch (err) {
        console.error('Failed to delete dataset:', err);
        setError(err.message || 'Failed to delete dataset.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Loader message="Loading datasets..." />;
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h1>ML Datasets</h1>
        <Link to="/datasets/new" className="btn btn-primary">Create New Dataset</Link>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}

      <div className="card-grid">
        {datasets.length === 0 ? (
          <p>No datasets found. Start by creating one!</p>
        ) : (
          datasets.map(dataset => (
            <div key={dataset.id} className="card-wrapper">
              <DatasetCard dataset={dataset} />
              {(user?.id === dataset.owner_id || user?.role === 'admin') && (
                <div className="card-actions">
                  <Link to={`/datasets/${dataset.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(dataset.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DatasetsPage;
```