```javascript
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getModelById, deleteModel as deleteModelService, runInference } from '../services/modelService';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './DetailPage.css';

const ModelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Inference state
  const [inferencePayload, setInferencePayload] = useState('{}');
  const [inferenceResult, setInferenceResult] = useState(null);
  const [inferenceLoading, setInferenceLoading] = useState(false);
  const [inferenceError, setInferenceError] = useState(null);

  useEffect(() => {
    const fetchModel = async () => {
      try {
        setLoading(true);
        const data = await getModelById(id);
        setModel(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch model:', err);
        setError(err.message || 'Failed to load model details.');
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteModelService(id);
        setSuccessMessage('Model deleted successfully!');
        navigate('/models'); // Redirect to models list after deletion
      } catch (err) {
        console.error('Failed to delete model:', err);
        setError(err.message || 'Failed to delete model.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInferenceSubmit = async (e) => {
    e.preventDefault();
    setInferenceLoading(true);
    setInferenceError(null);
    setInferenceResult(null);

    try {
      const payload = JSON.parse(inferencePayload);
      const result = await runInference(id, payload);
      setInferenceResult(result);
    } catch (err) {
      console.error('Inference failed:', err);
      setInferenceError(err.message || 'Failed to run inference.');
    } finally {
      setInferenceLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading model details..." />;
  }

  if (error) {
    return <Alert message={error} type="error" />;
  }

  if (!model) {
    return <Alert message="Model not found." type="info" />;
  }

  const isOwnerOrAdmin = user?.id === model.owner_id || user?.role === 'admin';

  return (
    <div className="detail-page">
      <div className="detail-header">
        <h1>{model.name} (v{model.version})</h1>
        <div className="detail-actions">
          {isOwnerOrAdmin && (
            <>
              <Link to={`/models/${model.id}/edit`} className="btn btn-secondary">Edit Model</Link>
              <button onClick={handleDelete} className="btn btn-danger">Delete Model</button>
            </>
          )}
          <Link to="/models" className="btn btn-info">Back to Models</Link>
        </div>
      </div>

      {successMessage && <Alert message={successMessage} type="success" onClose={() => setSuccessMessage(null)} />}

      <section className="detail-section">
        <h2>Model Information</h2>
        <p><strong>Description:</strong> {model.description || 'N/A'}</p>
        <p><strong>Type:</strong> {model.type}</p>
        <p><strong>Endpoint URL:</strong> {model.endpoint_url}</p>
        <p><strong>Owner:</strong> {model.owner?.username || 'N/A'}</p>
        <p>
          <strong>Associated Dataset:</strong> {' '}
          {model.dataset ? <Link to={`/datasets/${model.dataset.id}`}>{model.dataset.name}</Link> : 'N/A'}
        </p>
        <p><strong>Created At:</strong> {new Date(model.createdAt).toLocaleDateString()}</p>
        <p><strong>Last Updated:</strong> {new Date(model.updatedAt).toLocaleDateString()}</p>
      </section>

      <section className="detail-section">
        <h2>Run Inference</h2>
        <form onSubmit={handleInferenceSubmit} className="inference-form">
          <div className="form-group">
            <label htmlFor="inferencePayload">Inference Input (JSON):</label>
            <textarea
              id="inferencePayload"
              value={inferencePayload}
              onChange={(e) => setInferencePayload(e.target.value)}
              rows="8"
              placeholder='{"feature1": 10, "feature2": "value"}'
            ></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={inferenceLoading}>
            {inferenceLoading ? 'Running...' : 'Run Inference'}
          </button>
        </form>

        {inferenceError && <Alert message={inferenceError} type="error" onClose={() => setInferenceError(null)} />}
        {inferenceResult && (
          <div className="inference-result">
            <h3>Inference Result:</h3>
            <pre>{JSON.stringify(inferenceResult, null, 2)}</pre>
            <p>Check the <Link to="/inference-logs">Inference Logs page</Link> for detailed history.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default ModelDetailPage;
```