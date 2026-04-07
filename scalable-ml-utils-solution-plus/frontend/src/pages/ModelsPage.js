```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModels, deleteModel as deleteModelService } from '../services/modelService';
import { useAuth } from '../context/AuthContext';
import ModelCard from '../components/model/ModelCard';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './ListPage.css';

const ModelsPage = () => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { user } = useAuth();

  const fetchModels = async () => {
    try {
      setLoading(true);
      const data = await getModels();
      setModels(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError(err.message || 'Failed to load models.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteModelService(id);
        setModels(models.filter(model => model.id !== id));
        setSuccessMessage('Model deleted successfully!');
        setError(null);
      } catch (err) {
        console.error('Failed to delete model:', err);
        setError(err.message || 'Failed to delete model.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Loader message="Loading models..." />;
  }

  return (
    <div className="list-page">
      <div className="list-header">
        <h1>ML Models</h1>
        <Link to="/models/new" className="btn btn-primary">Create New Model</Link>
      </div>

      {error && <Alert message={error} type="error" onClose={() => setError(null)} />}
      {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}

      <div className="card-grid">
        {models.length === 0 ? (
          <p>No models found. Start by creating one!</p>
        ) : (
          models.map(model => (
            <div key={model.id} className="card-wrapper">
              <ModelCard model={model} />
              {(user?.id === model.owner_id || user?.role === 'admin') && (
                <div className="card-actions">
                  <Link to={`/models/${model.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                  <button onClick={() => handleDelete(model.id)} className="btn btn-danger btn-sm">Delete</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ModelsPage;
```