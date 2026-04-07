```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createModel as createModelService } from '../services/modelService';
import { getDatasets } from '../services/datasetService'; // To link a dataset
import Loader from '../components/common/Loader';
import Alert from '../components/common/Alert';
import './FormPage.css';

const CreateModelPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('other');
  const [endpointUrl, setEndpointUrl] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const [datasets, setDatasets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetsError, setDatasetsError] = useState(null);

  useEffect(() => {
    const fetchDatasetsForDropdown = async () => {
      try {
        setDatasetsLoading(true);
        const data = await getDatasets();
        setDatasets(data);
      } catch (err) {
        console.error('Failed to fetch datasets for dropdown:', err);
        setDatasetsError('Failed to load datasets for selection.');
      } finally {
        setDatasetsLoading(false);
      }
    };
    fetchDatasetsForDropdown();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const modelData = {
      name,
      version,
      description,
      type,
      endpoint_url: endpointUrl,
      dataset_id: datasetId || null, // Allow null if no dataset is selected
    };

    try {
      const newModel = await createModelService(modelData);
      setSuccess('Model created successfully!');
      navigate(`/models/${newModel.id}`);
    } catch (err) {
      console.error('Failed to create model:', err);
      setError(err.message || 'Failed to create model.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || datasetsLoading) {
    return <Loader message="Loading..." />;
  }

  return (
    <div className="form-page-container">
      <h2>Create New ML Model</h2>
      {(error || datasetsError) && <Alert message={error || datasetsError} type="error" onClose={() => setError(null)} />}
      {success && <Alert message={success} type="success" onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="form-container">
        <div className="form-group">
          <label htmlFor="name">Model Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="version">Version:</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)} required>
            <option value="classification">Classification</option>
            <option value="regression">Regression</option>
            <option value="clustering">Clustering</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="endpointUrl">Endpoint URL:</label>
          <input
            type="url"
            id="endpointUrl"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="datasetId">Associated Dataset:</label>
          <select id="datasetId" value={datasetId} onChange={(e) => setDatasetId(e.target.value)}>
            <option value="">-- Select a Dataset (Optional) --</option>
            {datasets.map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </select>
          {datasetsError && <p className="text-danger">{datasetsError}</p>}
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Model'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/models')}>Cancel</button>
      </form>
    </div>
  );
};

export default CreateModelPage;
```